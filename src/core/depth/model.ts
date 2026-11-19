// ============================================================================
// Flat cell model for the depth analysis. A cell is an index
// floor * N * N + row * N + col, so a domain is a Uint8Array and "which cells
// may this person stand on" is a bitmap rather than a list of objects.
//
// The MEANING of every clue is still the engine's: unary kinds are evaluated
// with engine.unaryClueHolds, and the relational kinds below are the same
// arithmetic as engine.clueHolds (docs/CLUE_SEMANTICS.md). tests/depth compares
// the two on whole puzzles, so they cannot drift apart unnoticed.
// ============================================================================

import type { Cell, Clue, Puzzle } from '../types'
import { cellFloor } from '../types'
import { roomIdAt, unaryClueHolds } from '../engine'

export interface Ctx {
  puzzle: Puzzle
  N: number
  floors: number
  NC: number
  rowOf: Int16Array
  colOf: Int16Array
  floorOf: Int16Array
  /** Index into puzzle.rooms, or -1 for a cell in no room. */
  roomOfCell: Int16Array
  ids: string[]
  idxOf: Map<string, number>
}

export function buildCtx(p: Puzzle): Ctx {
  const N = p.size
  const floors = p.floors ?? 1
  const NC = floors * N * N
  const rowOf = new Int16Array(NC)
  const colOf = new Int16Array(NC)
  const floorOf = new Int16Array(NC)
  const roomOfCell = new Int16Array(NC)
  const roomIndex = new Map(p.rooms.map((r, i) => [r.id, i]))
  for (let f = 0; f < floors; f++) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = f * N * N + r * N + c
        rowOf[i] = r
        colOf[i] = c
        floorOf[i] = f
        roomOfCell[i] = roomIndex.get(roomIdAt(p, { row: r, col: c, floor: f })) ?? -1
      }
    }
  }
  const ids = p.people.map(x => x.id)
  return { puzzle: p, N, floors, NC, rowOf, colOf, floorOf, roomOfCell, ids, idxOf: new Map(ids.map((id, i) => [id, i])) }
}

/** The Cell object the engine expects for a flat index (floor only on two-floor boards, as countSolutions does). */
export function cellOf(ctx: Ctx, idx: number): Cell {
  return ctx.floors > 1
    ? { row: ctx.rowOf[idx], col: ctx.colOf[idx], floor: ctx.floorOf[idx] }
    : { row: ctx.rowOf[idx], col: ctx.colOf[idx] }
}

export function indexOfCell(ctx: Ctx, cell: Cell): number {
  return cellFloor(cell) * ctx.N * ctx.N + cell.row * ctx.N + cell.col
}

/** Kinds that name a second person: they constrain a PAIR of cells. */
export function isRelational(c: Clue): boolean {
  switch (c.kind) {
    case 'direction': case 'besidePerson': case 'sameRoomAs': case 'notSameRoomAs': return true
    case 'above': case 'below': return c.targetKind === 'person'
    default: return false
  }
}

/** The other person of a relational clue. */
export function otherPerson(c: Clue): string | null {
  switch (c.kind) {
    case 'direction': case 'besidePerson': case 'sameRoomAs': case 'notSameRoomAs': return c.other
    case 'above': case 'below': return c.targetKind === 'person' ? c.target : null
    default: return null
  }
}

/** Cells (as a 0/1 map) where a unary clue holds for its own person. */
export function unaryMask(ctx: Ctx, clue: Clue): Uint8Array {
  const mask = new Uint8Array(ctx.NC)
  for (let i = 0; i < ctx.NC; i++) mask[i] = unaryClueHolds(ctx.puzzle, clue, cellOf(ctx, i)) ? 1 : 0
  return mask
}

export type PairTest = (ia: number, ib: number) => boolean

/** Does the relational clue hold when its person stands at `ia` and the other at `ib`? */
export function pairTest(ctx: Ctx, clue: Clue): PairTest | null {
  const { rowOf, colOf, floorOf, roomOfCell } = ctx
  switch (clue.kind) {
    case 'direction': {
      const steps = clue.steps
      switch (clue.dir) {
        case 'N': return steps ? (a, b) => rowOf[a] === rowOf[b] - steps : (a, b) => rowOf[a] < rowOf[b]
        case 'S': return steps ? (a, b) => rowOf[a] === rowOf[b] + steps : (a, b) => rowOf[a] > rowOf[b]
        case 'W': return steps ? (a, b) => colOf[a] === colOf[b] - steps : (a, b) => colOf[a] < colOf[b]
        case 'E': return steps ? (a, b) => colOf[a] === colOf[b] + steps : (a, b) => colOf[a] > colOf[b]
      }
      return null
    }
    case 'sameRoomAs': return (a, b) => roomOfCell[a] === roomOfCell[b]
    case 'notSameRoomAs': return (a, b) => roomOfCell[a] !== roomOfCell[b]
    case 'besidePerson':
      return (a, b) => floorOf[a] === floorOf[b] && Math.abs(rowOf[a] - rowOf[b]) + Math.abs(colOf[a] - colOf[b]) === 1
    case 'above':
      return clue.targetKind === 'person'
        ? (a, b) => rowOf[a] === rowOf[b] && colOf[a] === colOf[b] && floorOf[a] === floorOf[b] + 1
        : null
    case 'below':
      return clue.targetKind === 'person'
        ? (a, b) => rowOf[a] === rowOf[b] && colOf[a] === colOf[b] && floorOf[a] === floorOf[b] - 1
        : null
    default: return null
  }
}
