import type {
  Puzzle, Clue, Cell, FurnitureType, Person, Room, GridSize,
} from './types'
import { furnitureFootprint, furnitureCells, cellFloor } from './types'

// ============================================================================
// Murdoku engine: clue evaluation + solver.
// A "placement" maps every person id -> Cell, with all rows distinct and all
// columns distinct. A placement is a SOLUTION iff it satisfies every clue.
// ============================================================================

export type Placement = Record<string, Cell>

/**
 * Two cells are adjacent iff they are on the SAME floor and share an orthogonal
 * edge. Cells on different floors are never adjacent (no staircase mechanics).
 */
export function cellsAdjacent(a: Cell, b: Cell): boolean {
  if (cellFloor(a) !== cellFloor(b)) return false
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
}

/**
 * Furniture types at (floor, row, col). The `floor` parameter defaults to 0
 * so all existing single-floor call sites are unaffected.
 */
export function furnitureAt(p: Puzzle, row: number, col: number, floor = 0): FurnitureType[] {
  return p.furniture.filter(f => {
    if ((f.floor ?? 0) !== floor) return false
    const { w, h } = furnitureFootprint(f)
    return row >= f.row && row < f.row + h && col >= f.col && col < f.col + w
  }).map(f => f.type)
}

/**
 * Room id at a cell, or '' when the cell is not part of any room.
 *
 * A cell on a floor that does not exist has NO room. This used to fall back to
 * the ground-floor map for any floor index past the end of `roomOfByFloor`,
 * which made "the room directly above the top floor" resolve to whatever
 * ground-floor room sat at the same row/column and let the generator print
 * "Directly below the Dining Room." for someone standing upstairs (a room that
 * is on the ground floor, so nothing can be below it).
 */
export function roomIdAt(p: Puzzle, cell: Cell): string {
  const fl = cellFloor(cell)
  if (fl < 0 || cell.row < 0 || cell.col < 0 || cell.row >= p.size || cell.col >= p.size) return ''
  if (p.roomOfByFloor) return p.roomOfByFloor[fl]?.[cell.row]?.[cell.col] ?? ''
  return fl === 0 ? (p.roomOf[cell.row]?.[cell.col] ?? '') : ''
}

/**
 * "Beside <furniture>" — the literal meaning, shared by the generator, solver
 * and validator (docs/CLUE_SEMANTICS.md):
 *
 *   there is a piece of one of the named types, on the person's floor, that the
 *   person is NOT standing on, with a footprint cell orthogonally next to the
 *   person's cell and in the SAME room as the person.
 *
 * The earlier test counted any adjacent cell of that type, so a person standing
 * on one half of a two-cell sofa was "beside the sofa", and a TV on the far
 * side of a wall in the next room counted too.
 */
export function besideFurniture(p: Puzzle, cell: Cell, types: readonly FurnitureType[]): boolean {
  const fl = cellFloor(cell)
  const here = roomIdAt(p, cell)
  if (!here) return false
  for (const piece of p.furniture) {
    if ((piece.floor ?? 0) !== fl || !types.includes(piece.type)) continue
    const cells = furnitureCells(piece)
    if (cells.some(c => c.row === cell.row && c.col === cell.col)) continue // standing on it
    const touching = cells.some(c =>
      Math.abs(c.row - cell.row) + Math.abs(c.col - cell.col) === 1
      && roomIdAt(p, { row: c.row, col: c.col, floor: fl }) === here)
    if (touching) return true
  }
  return false
}

/**
 * Does ONE clue's constraint on its own person's cell hold at `cell`?
 *
 * This is the single definition of every clue kind that depends only on where
 * its own person stands. `clueHolds`, the solver's pruning (`unaryClueOk`), the
 * generator's candidate scoring and the validator all call it, so they cannot
 * drift apart. Relational kinds (they need another person's cell) return true
 * here and are decided in `clueHolds`.
 */
export function unaryClueHolds(p: Puzzle, clue: Clue, cell: Cell): boolean {
  const fl = cellFloor(cell)
  switch (clue.kind) {
    case 'room': return roomIdAt(p, cell) === clue.roomId
    case 'notRoom': return roomIdAt(p, cell) !== clue.roomId
    // floor-aware: a person upstairs is on the furniture of THEIR storey
    case 'onFurniture': return furnitureAt(p, cell.row, cell.col, fl).includes(clue.furniture)
    case 'onlyOnFurniture': return furnitureAt(p, cell.row, cell.col, fl).includes(clue.furniture)
    case 'besideFurniture': return besideFurniture(p, cell, [clue.furniture])
    case 'besideAny': return besideFurniture(p, cell, clue.furniture)
    case 'row': return cell.row === clue.row
    case 'col': return cell.col === clue.col
    case 'edge': return cell.row === 0 || cell.col === 0 || cell.row === p.size - 1 || cell.col === p.size - 1
    case 'corner': return (cell.row === 0 || cell.row === p.size - 1) && (cell.col === 0 || cell.col === p.size - 1)
    case 'floor': return fl === clue.floorNum
    case 'above':
      // "Directly above the <room>": the cell one storey down, same row and
      // column, belongs to that room. Nothing is below the ground floor.
      if (clue.targetKind !== 'room') return true
      return fl >= 1 && roomIdAt(p, { row: cell.row, col: cell.col, floor: fl - 1 }) === clue.target
    case 'below':
      // "Directly below the <room>": the cell one storey UP, same row and
      // column, belongs to that room. A floor that does not exist has no room,
      // so nobody on the top storey is ever below anything.
      if (clue.targetKind !== 'room') return true
      return !!clue.target && roomIdAt(p, { row: cell.row, col: cell.col, floor: fl + 1 }) === clue.target
    default: return true // victim and the relational kinds
  }
}

/** Is a single clue satisfied by a (complete) placement? */
export function clueHolds(p: Puzzle, clue: Clue, place: Placement): boolean {
  const self = place[clue.person]
  switch (clue.kind) {
    case 'victim':
      return true // flavour only; the win rule is handled separately
    case 'onlyOnFurniture': {
      if (!self || !unaryClueHolds(p, clue, self)) return false
      // no other person sits on the same furniture type (on their own storey)
      return p.people.every(person => {
        if (person.id === clue.person) return true
        const c = place[person.id]
        return !c || !furnitureAt(p, c.row, c.col, cellFloor(c)).includes(clue.furniture)
      })
    }
    case 'besidePerson': {
      const o = place[clue.other]
      return !!self && !!o && cellsAdjacent(self, o)
    }
    case 'sameRoomAs': {
      const o = place[clue.other]
      return !!self && !!o && roomIdAt(p, self) === roomIdAt(p, o)
    }
    case 'notSameRoomAs': {
      const o = place[clue.other]
      return !!self && !!o && roomIdAt(p, self) !== roomIdAt(p, o)
    }
    case 'direction': {
      // "Exactly N rows north of X" compares ROW (or column) indices only; it
      // says nothing about the other axis or the storey.
      const o = place[clue.other]
      if (!self || !o) return false
      const steps = clue.steps
      switch (clue.dir) {
        case 'N': return steps ? self.row === o.row - steps : self.row < o.row
        case 'S': return steps ? self.row === o.row + steps : self.row > o.row
        case 'W': return steps ? self.col === o.col - steps : self.col < o.col
        case 'E': return steps ? self.col === o.col + steps : self.col > o.col
      }
      break
    }
    case 'above': case 'below': {
      if (!self) return false
      if (clue.targetKind === 'room') return unaryClueHolds(p, clue, self)
      // "Directly above <person>": same row and column, exactly one storey higher.
      const o = place[clue.target]
      if (!o || self.row !== o.row || self.col !== o.col) return false
      return clue.kind === 'above' ? cellFloor(self) === cellFloor(o) + 1 : cellFloor(self) === cellFloor(o) - 1
    }
    default:
      return !!self && unaryClueHolds(p, clue, self)
  }
  return false
}

/** Does a placement satisfy every clue? */
export function isSolution(p: Puzzle, place: Placement): boolean {
  return p.clues.every(ct => clueHolds(p, ct.clue, place))
}

// --- Unary pruning ---------------------------------------------------------
// Clues that constrain a single person's own cell can be checked the moment we
// place them, massively pruning the search.

function unaryClueOk(p: Puzzle, personId: string, cell: Cell): boolean {
  for (const { clue } of p.clues) {
    if (clue.person !== personId) continue
    if (!unaryClueHolds(p, clue, cell)) return false
  }
  return true
}

/** Exposed for the validator's difficulty metrics: may `personId` stand at `cell` given only their own clues? */
export function unaryLegalFor(p: Puzzle, personId: string, cell: Cell): boolean {
  return unaryClueOk(p, personId, cell)
}

/**
 * Count solutions (capped at `cap`, default 2 so callers can test uniqueness).
 * Backtracks over people, assigning each a cell with a fresh row & column.
 */
export function countSolutions(p: Puzzle, cap = 2): number {
  const N = p.size
  const floors = p.floors ?? 1
  const people = p.people
  const usedRow = new Array(N).fill(false)
  const usedCol = new Array(N).fill(false)
  const place: Placement = {}
  let count = 0

  // Two optimisations, both of which change only the ORDER of the search and
  // never its result:
  //
  //  1. Each person's unary-legal cells are computed once up front, instead of
  //     re-testing every clue at every node of the tree.
  //  2. Most-constrained-first. Searching a suspect with 3 legal cells before
  //     one with 60 prunes whole subtrees near the root. On an 8x8 board whose
  //     clues are all indirect this is the difference between validating a
  //     puzzle in ~90 seconds and doing it in milliseconds: in people-array
  //     order the search pays most of the 8! permutation cost before the first
  //     contradiction surfaces.
  //
  // For two-floor puzzles the cell list enumerates (floor, row, col). Row and
  // column constraints remain GLOBAL: usedRow/usedCol are shared across floors,
  // so a person on floor 1 row 3 col 5 consumes row 3 and col 5 for everyone.
  const order = people
    .map(person => {
      const cells: Cell[] = []
      for (let fl = 0; fl < floors; fl++) {
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const cell: Cell = floors > 1 ? { row: r, col: c, floor: fl } : { row: r, col: c }
            if (unaryClueOk(p, person.id, cell)) cells.push(cell)
          }
        }
      }
      return { id: person.id, cells }
    })
    .sort((a, b) => a.cells.length - b.cells.length)

  // A person with no legal cell at all makes the board unsatisfiable outright.
  if (order.some(entry => entry.cells.length === 0)) return 0

  function recurse(i: number) {
    if (count >= cap) return
    if (i === order.length) {
      if (isSolution(p, place)) count++
      return
    }
    const { id, cells } = order[i]
    for (const cell of cells) {
      if (usedRow[cell.row] || usedCol[cell.col]) continue
      usedRow[cell.row] = usedCol[cell.col] = true
      place[id] = cell
      recurse(i + 1)
      delete place[id]
      usedRow[cell.row] = usedCol[cell.col] = false
      if (count >= cap) return
    }
  }
  recurse(0)
  return count
}

/**
 * Cells that provably cannot hold anybody, given what is already placed.
 *
 * This is the Logic Assistant's entire reasoning, and it is deliberately the
 * narrow, sound half of the deduction rather than a solver:
 *
 *   1. A cell whose row or column already holds a placed person is out, because
 *      everybody occupies a distinct row and column.
 *   2. A cell no remaining person could legally stand on — every one of them
 *      fails their own unary clue there — is out.
 *
 * Both are things the player could derive with certainty from the rules alone,
 * so marking them never spoils a deduction the player was entitled to make.
 * Anything requiring a relational clue or a search is left to the player.
 */
export function deriveEliminations(p: Puzzle, placed: Placement): Cell[] {
  const N = p.size
  const floors = p.floors ?? 1
  // usedRow and usedCol are GLOBAL across floors — a placed suspect blocks
  // that row and column on every storey.
  const usedRow = new Set<number>()
  const usedCol = new Set<number>()
  // taken is per-floor: key is `${floor},${row},${col}`.
  const taken = new Set<string>()
  for (const cell of Object.values(placed)) {
    if (!cell) continue
    usedRow.add(cell.row)
    usedCol.add(cell.col)
    taken.add(`${cellFloor(cell)},${cell.row},${cell.col}`)
  }

  const remaining = p.people.filter(person => !placed[person.id])
  const out: Cell[] = []
  for (let fl = 0; fl < floors; fl++) {
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (taken.has(`${fl},${row},${col}`)) continue
        // Row/col exclusivity is global — any placed suspect claims this row/col
        // on every floor.
        if (usedRow.has(row) || usedCol.has(col)) {
          out.push(floors > 1 ? { row, col, floor: fl } : { row, col })
          continue
        }
        // Unary legality must be evaluated at this specific cell INCLUDING its floor,
        // so a 'floor' clue ("Upstairs.") correctly eliminates the other storey.
        const cell: Cell = floors > 1 ? { row, col, floor: fl } : { row, col }
        if (!remaining.some(person => unaryClueOk(p, person.id, cell))) out.push(cell)
      }
    }
  }
  return out
}

export function hasUniqueSolution(p: Puzzle): boolean {
  return countSolutions(p, 2) === 1
}

/** The murderer = the one suspect sharing the victim's room. */
export function findMurderer(p: Puzzle, place: Placement = p.solution): string | null {
  const victimCell = place[p.victimId]
  if (!victimCell) return null
  const victimRoom = roomIdAt(p, victimCell)
  const inRoom = p.people.filter(pr =>
    pr.id !== p.victimId && place[pr.id] && roomIdAt(p, place[pr.id]) === victimRoom)
  return inRoom.length === 1 ? inRoom[0].id : null
}

// --- helpers reused by generator & UI --------------------------------------

export function getBoxDims(_size: GridSize): [number, number] {
  return [1, 1] // rooms handle grouping now; kept for API compatibility
}

export function personById(p: Puzzle, id: string): Person | undefined {
  return p.people.find(x => x.id === id)
}

export function roomById(p: Puzzle, id: string): Room | undefined {
  return p.rooms.find(r => r.id === id)
}
