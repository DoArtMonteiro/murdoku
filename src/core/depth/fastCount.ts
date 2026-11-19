// ============================================================================
// countSolutionsFast: engine.countSolutions with relational clues checked as
// soon as both of their people are placed, instead of only at a full placement.
//
// WHY. engine.countSolutions prunes with each person's own (unary) clues and
// tests relational clues (direction, sameRoomAs, notSameRoomAs, ...) only at the
// leaves. That is fine while every suspect carries a strong unary clue, and it
// is why the shipped catalogue solves in milliseconds. A depth case deliberately
// has weak unary clues, so the search reaches roughly (cells choose people)
// leaves before a relational clue gets a say. Measured on accepted depth cases:
// 5-person 5x5 ~3 ms, 6-person 6x6 ~160 ms, 7-person 7x7 ~8 s, 6-person 8x8 two
// floors up to 150 s per call. With the check below the same calls take
// milliseconds.
//
// This is a PROPOSED ENGINE PATCH, kept here because this round may not edit
// engine.ts. It reuses the engine's own clueHolds / unaryClueHolds, so it cannot
// disagree with it about what a clue means; tests/depth compares the two.
//
// The change in engine.ts would be, inside countSolutions: bucket every
// relational clue under the later of its two people in `order`, and after
// `place[id] = cell` run `bucket[i].every(c => clueHolds(p, c, place))` before
// recursing. (onlyOnFurniture, which looks at everybody, is re-checked at every
// level from its own person onward.)
// ============================================================================

import type { Cell, Clue, Puzzle } from '../types'
import { clueHolds, unaryLegalFor } from '../engine'
import { otherPerson } from './model'

export function countSolutionsFast(p: Puzzle, cap = 2): number {
  const N = p.size
  const floors = p.floors ?? 1
  const usedRow = new Array<boolean>(N).fill(false)
  const usedCol = new Array<boolean>(N).fill(false)
  const place: Record<string, Cell> = {}
  let count = 0

  const order = p.people
    .map(person => {
      const cells: Cell[] = []
      for (let fl = 0; fl < floors; fl++) {
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const cell: Cell = floors > 1 ? { row: r, col: c, floor: fl } : { row: r, col: c }
            if (unaryLegalFor(p, person.id, cell)) cells.push(cell)
          }
        }
      }
      return { id: person.id, cells }
    })
    .sort((a, b) => a.cells.length - b.cells.length)
  if (order.some(entry => entry.cells.length === 0)) return 0

  const position = new Map(order.map((entry, i) => [entry.id, i]))
  const checks: Clue[][] = order.map(() => [])
  for (const { clue } of p.clues) {
    const other = otherPerson(clue)
    if (other !== null) {
      const last = Math.max(position.get(clue.person) ?? 0, position.get(other) ?? 0)
      checks[last].push(clue)
    } else if (clue.kind === 'onlyOnFurniture') {
      for (let i = position.get(clue.person) ?? 0; i < order.length; i++) checks[i].push(clue)
    }
  }

  function recurse(i: number) {
    if (count >= cap) return
    if (i === order.length) { count++; return }
    const { id, cells } = order[i]
    for (const cell of cells) {
      if (usedRow[cell.row] || usedCol[cell.col]) continue
      place[id] = cell
      if (checks[i].every(c => clueHolds(p, c, place))) {
        usedRow[cell.row] = usedCol[cell.col] = true
        recurse(i + 1)
        usedRow[cell.row] = usedCol[cell.col] = false
      }
      delete place[id]
      if (count >= cap) return
    }
  }
  recurse(0)
  return count
}
