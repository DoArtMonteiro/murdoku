import type { Clue, FurnitureType, Puzzle } from '../../core/types'
import { unaryClueHolds } from '../../core/engine'

/**
 * Reading aid: which lanes/cells a clue LITERALLY names on the plan.
 * Only clues whose target is printed on the plan (row, column, room, corner,
 * wall, furniture) produce anything. Nothing here looks at puzzle.solution or
 * at where anyone is placed.
 */
export interface ClueTargets {
  rows: number[]
  cols: number[]
  cells: Array<[number, number]>
  /** Plain-language description for assistive tech, e.g. "row 6". */
  label: string
}

export const NO_TARGETS: ClueTargets = { rows: [], cols: [], cells: [], label: '' }

function cellsWhere(n: number, pred: (r: number, c: number) => boolean): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (pred(r, c)) out.push([r, c])
  return out
}

export function clueTargets(puzzle: Puzzle, clue: Clue, floor: number): ClueTargets {
  const n = puzzle.size
  const name = (t: FurnitureType) => t.replace(/([a-z])([A-Z])/g, '$1 $2')
  // Cells where the clue would hold for its own person, decided by the engine's
  // single semantic source (docs/CLUE_SEMANTICS.md). Row/column uniqueness and
  // other people are deliberately ignored: this is a reading aid, not a solver.
  const holds = () => cellsWhere(n, (r, c) => unaryClueHolds(puzzle, clue, { row: r, col: c, floor }))
  switch (clue.kind) {
    case 'row': return { rows: [clue.row], cols: [], cells: [], label: `row ${clue.row + 1}` }
    case 'col': return { rows: [], cols: [clue.col], cells: [], label: `column ${clue.col + 1}` }
    case 'room': {
      const room = puzzle.rooms.find(r => r.id === clue.roomId)
      return room ? { rows: [], cols: [], cells: holds(), label: room.name } : NO_TARGETS
    }
    case 'corner': return { rows: [], cols: [], cells: holds(), label: 'the corners' }
    case 'edge': return { rows: [], cols: [], cells: holds(), label: 'the outer edge' }
    case 'besideFurniture': return { rows: [], cols: [], cells: holds(), label: `beside ${name(clue.furniture)}` }
    case 'besideAny': return { rows: [], cols: [], cells: holds(), label: `beside ${clue.furniture.map(name).join(' or ')}` }
    case 'onFurniture':
    case 'onlyOnFurniture': return { rows: [], cols: [], cells: holds(), label: `on ${name(clue.furniture)}` }
    case 'above':
    case 'below': {
      if (clue.targetKind !== 'room') return NO_TARGETS
      const cells = holds()
      return cells.length ? { rows: [], cols: [], cells, label: `${clue.kind} the room` } : NO_TARGETS
    }
    default:
      return NO_TARGETS
  }
}

export function mergeTargets(list: ClueTargets[]): ClueTargets {
  const rows = new Set<number>(), cols = new Set<number>(), cells = new Map<number, [number, number]>()
  const labels: string[] = []
  for (const t of list) {
    t.rows.forEach(r => rows.add(r))
    t.cols.forEach(c => cols.add(c))
    t.cells.forEach(([r, c]) => cells.set(r * 100 + c, [r, c]))
    if (t.label && (t.rows.length || t.cols.length || t.cells.length)) labels.push(t.label)
  }
  return { rows: [...rows], cols: [...cols], cells: [...cells.values()], label: labels.join('; ') }
}
