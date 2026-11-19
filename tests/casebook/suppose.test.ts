import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import { allCells, cellKey } from '../../src/casebook/cells'
import { suppose } from '../../src/casebook/suppose'

describe('suppose', () => {
  it('is sound: a ghost on its true square never removes anyone else\'s true square', () => {
    for (const p of [hard, easy]) {
      for (const g of p.people) {
        const r = suppose(p, { person: g.id, cell: p.solution[g.id] })
        expect(r.ghostLegal).toBe(true)
        expect(r.contradictions).toEqual([])
        for (const o of p.people) {
          if (o.id === g.id) continue
          expect(r.remaining[o.id].map(cellKey)).toContain(cellKey(p.solution[o.id]))
        }
      }
    }
  })

  it('removes the ghost\'s row and column for everyone', () => {
    const cell = { row: 5, col: 0, floor: 0 }
    const r = suppose(easy, { person: 'p0', cell })
    for (const id of ['p1', 'p2', 'p3']) {
      expect(r.remaining[id].every(c => c.row !== 5 && c.col !== 0)).toBe(true)
    }
  })

  it('applies the relational statement against the ghost, both ways', () => {
    // Carol: not in Lena's room. Ghost Lena on a square puts Carol's candidates outside Lena's room.
    const lena = hard.solution.p0
    const r = suppose(hard, { person: 'p0', cell: lena })
    expect(r.linked).toContain('p2')
    expect(r.remaining.p2.length).toBeGreaterThan(0)
    // ghost as Carol: Lena becomes linked too
    expect(suppose(hard, { person: 'p2', cell: hard.solution.p2 }).linked).toContain('p0')
  })

  it('finds a contradiction when a ghost leaves someone no square, and flags illegal ghosts', () => {
    // very-easy-3: Yuki is pinned to (5,0) by her statements; a ghost of Evangeline in column 0
    // is illegal for Evangeline's own statements.
    const bad = suppose(easy, { person: 'p1', cell: { row: 0, col: 0, floor: 0 } })
    expect(bad.ghostLegal).toBe(false)
    // Lena must be in row 2, column 6. Put Greta (any square) in Lena's row: Lena has no square.
    const found = allCells(easy).map(cell => suppose(easy, { person: 'p2', cell })).some(r => r.contradictions.includes('p3'))
    expect(found).toBe(true)
  })

  it('goes one hop only: others are judged on their own statements, not on each other', () => {
    const r = suppose(easy, { person: 'p2', cell: { row: 3, col: 1, floor: 0 } })
    // Yuki still has her own single square (5,0): nothing about Lena or Evangeline shrank it.
    expect(r.remaining.p0.map(cellKey)).toEqual([cellKey({ row: 5, col: 0, floor: 0 })])
  })
})
