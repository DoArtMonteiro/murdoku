// Shared rules for what a statement allows. Nothing here reads puzzle.solution.
// Tiles are keyed "row,col" (the art kit's cellKey). Lie cases are single-floor.
import type { Cell, Clue, Puzzle } from '../core/types'
import { clueHolds, unaryClueHolds } from '../core/engine'
import type { LieCase, Statement } from './model'

export type Placed = Record<string, Cell>

export const tileKey = (c: { row: number; col: number }): string => `${c.row},${c.col}`

/** The other person a statement is about, if it is relational. */
export function otherOf(clue: Clue): string | undefined {
  if ('other' in clue) return clue.other
  if ((clue.kind === 'above' || clue.kind === 'below') && clue.targetKind === 'person') return clue.target
  return undefined
}

export function allTiles(p: Puzzle): Cell[] {
  const out: Cell[] = []
  for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) out.push({ row, col })
  return out
}

/** Does the statement hold in this (partial) placement? Anyone it needs who is not placed yet counts as unknown, so it holds. */
export function holds(p: Puzzle, st: Statement, trial: Placed): boolean {
  if (!trial[st.author]) return true
  const other = otherOf(st.clue)
  if (other && !trial[other]) return true
  return clueHolds(p, st.clue, trial)
}

/** Does the statement allow its author on this tile, judged on the tile alone (relational kinds allow everywhere)? */
export const unaryAllows = (p: Puzzle, st: Statement, cell: Cell): boolean => unaryClueHolds(p, st.clue, cell)

/** The person a relational statement is waiting on, if that person is not placed yet. */
export function waitingOn(st: Statement, placed: Placed): string | null {
  const other = otherOf(st.clue)
  return other && !placed[other] ? other : null
}

/** Rows and columns held by anyone except `except`. */
export function usedLines(placed: Placed, except?: string | null): { rows: Set<number>; cols: Set<number> } {
  const rows = new Set<number>(), cols = new Set<number>()
  for (const [id, c] of Object.entries(placed)) {
    if (id === except) continue
    rows.add(c.row); cols.add(c.col)
  }
  return { rows, cols }
}

/** Tiles dimmed for `person`: any tile whose row or column already holds someone else. */
export function blockedTiles(p: Puzzle, placed: Placed, person: string | null): Set<string> {
  const { rows, cols } = usedLines(placed, person)
  const out = new Set<string>()
  for (const t of allTiles(p)) if (rows.has(t.row) || cols.has(t.col)) out.add(tileKey(t))
  return out
}

/**
 * Tiles where every lit, ready statement of `person` can hold, with a free row and column.
 * A relational statement is ready once the other person stands somewhere. Null when nothing ready is lit.
 */
export function lensTiles(c: LieCase, active: readonly Statement[], person: string, litIds: readonly string[], placed: Placed): Set<string> | null {
  const ready = active.filter(s => s.author === person && litIds.includes(s.id) && !waitingOn(s, placed))
  if (!ready.length) return null
  const { rows, cols } = usedLines(placed, person)
  const out = new Set<string>()
  for (const t of allTiles(c.puzzle)) {
    if (rows.has(t.row) || cols.has(t.col)) continue
    const trial: Placed = { ...placed, [person]: t }
    if (ready.every(s => holds(c.puzzle, s, trial))) out.add(tileKey(t))
  }
  return out
}

/** The lens is lit but empty for someone not yet on the plan: nowhere satisfies everything they said and the placement. */
export const nowhereFits = (lens: ReadonlySet<string> | null, placed: Placed, person: string): boolean =>
  lens !== null && lens.size === 0 && !placed[person]
