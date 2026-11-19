import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { clueHolds, countSolutions, isSolution, unaryLegalFor } from '../../src/core/engine'
import type { Cell, Puzzle } from '../../src/core/types'
import { loadFixtures } from './fixtures'

/**
 * The engine's countSolutions as it was before relational clues were checked
 * early: unary pruning, relational clues tested only at a full placement.
 * Kept verbatim as the oracle the patched engine must agree with.
 */
function legacyCount(p: Puzzle, cap = 2): number {
  const N = p.size
  const floors = p.floors ?? 1
  const usedRow = new Array<boolean>(N).fill(false)
  const usedCol = new Array<boolean>(N).fill(false)
  const place: Record<string, Cell> = {}
  let count = 0
  const order = p.people
    .map(person => {
      const cells: Cell[] = []
      for (let fl = 0; fl < floors; fl++) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const cell: Cell = floors > 1 ? { row: r, col: c, floor: fl } : { row: r, col: c }
        if (unaryLegalFor(p, person.id, cell)) cells.push(cell)
      }
      return { id: person.id, cells }
    })
    .sort((a, b) => a.cells.length - b.cells.length)
  if (order.some(entry => entry.cells.length === 0)) return 0
  function recurse(i: number) {
    if (count >= cap) return
    if (i === order.length) { if (isSolution(p, place)) count++; return }
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

describe('countSolutions with early relational checks counts exactly what the old one did', () => {
  const catalog = getAllPuzzles()
  it('all 60 baked cases: same count at cap 2 and cap 50', () => {
    expect(catalog).toHaveLength(60)
    for (const p of catalog) {
      expect(countSolutions(p, 2), p.id).toBe(legacyCount(p, 2))
      expect(countSolutions(p, 50), p.id).toBe(legacyCount(p, 50))
      expect(countSolutions(p, 2), p.id).toBe(1)
    }
  }, 120_000)

  it('the shipped cases with one clue removed (counts above and at one)', () => {
    for (const p of catalog.filter((_, i) => i % 6 === 0)) {
      const real = p.clues.filter(c => c.clue.kind !== 'victim')
      for (let i = 0; i < real.length; i++) {
        const sub: Puzzle = { ...p, clues: real.filter((_, j) => j !== i) }
        expect(countSolutions(sub, 5), `${p.id} minus clue ${i}`).toBe(legacyCount(sub, 5))
      }
    }
  }, 120_000)

  for (const fx of loadFixtures()) {
    it(`fixture ${fx.name}: same count, and the same on the last prefixes of its clue list`, () => {
      const p = fx.puzzle
      expect(countSolutions(p, 2)).toBe(1)
      expect(legacyCount(p, 2)).toBe(1)
      const real = p.clues.filter(c => c.clue.kind !== 'victim')
      // Prefixes keep the search small enough for the old algorithm to finish.
      for (let n = Math.max(0, real.length - 2); n <= real.length; n++) {
        const sub: Puzzle = { ...p, clues: real.slice(0, n) }
        expect(countSolutions(sub, 3), `${fx.name} prefix ${n}`).toBe(legacyCount(sub, 3))
      }
    }, 600_000)
  }

  it('a clue that is false of the solution drives the count to 0 in both', () => {
    const fx = loadFixtures()[0]
    const real = fx.puzzle.clues.filter(c => c.clue.kind !== 'victim')
    const other = fx.puzzle.people.find(x => x.id !== real[0].clue.person)!.id
    const wrong: Puzzle = { ...fx.puzzle, clues: [...real, { clue: { kind: 'direction', person: real[0].clue.person, other, dir: 'N', steps: 99 }, text: '' }] }
    expect(countSolutions(wrong, 2)).toBe(0)
    expect(legacyCount(wrong, 2)).toBe(0)
    expect(clueHolds(wrong, wrong.clues[wrong.clues.length - 1].clue, wrong.solution)).toBe(false)
  })
})
