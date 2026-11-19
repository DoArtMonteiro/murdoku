import { describe, expect, it } from 'vitest'
import { getPuzzleById } from '../../src/core/catalog'
import type { Puzzle } from '../../src/core/types'
import { cellKey } from '../../src/casebook/cells'
import { lensCells, statementReady, statementsOf } from '../../src/casebook/lens'

const hard = getPuzzleById('hard-2') as Puzzle
const easy = getPuzzleById('very-easy-3') as Puzzle

describe('lens', () => {
  it('lists statements without the victim line', () => {
    const lena = statementsOf(hard, 'p0')
    expect(lena.map(s => s.clue.kind)).toEqual(['onFurniture'])
    expect(statementsOf(hard, 'p4').some(s => s.clue.kind === 'victim')).toBe(false)
  })

  it('lights nothing until a ready statement is lit', () => {
    expect(lensCells(easy, 'p0', [], {})).toBeNull()
  })

  it('lights the cells where all lit unary statements hold', () => {
    const st = statementsOf(easy, 'p0')
    const cells = lensCells(easy, 'p0', st.map(s => s.index), {})!
    // Yuki: leftmost column AND bottom row = exactly one square
    expect([...cells]).toEqual([cellKey({ row: 5, col: 0, floor: 0 })])
  })

  it('always contains the true square for a lit true statement and never reads other people', () => {
    for (const p of [easy, hard]) {
      for (const person of p.people) {
        const sts = statementsOf(p, person.id).filter(s => !s.needs)
        if (!sts.length) continue
        const lens = lensCells(p, person.id, sts.map(s => s.index), {})!
        expect(lens.has(cellKey(p.solution[person.id]))).toBe(true)
      }
    }
  })

  it('a relational statement needs the other person placed, then follows clueHolds', () => {
    const carol = statementsOf(hard, 'p2').find(s => s.clue.kind === 'notSameRoomAs')!
    expect(carol.needs).toBe('p0')
    expect(statementReady(carol, {})).toBe(false)
    expect(lensCells(hard, 'p2', [carol.index], {})).toBeNull()
    const lena = hard.solution.p0
    const lens = lensCells(hard, 'p2', [carol.index], { p0: lena })!
    expect(lens.has(cellKey(hard.solution.p2))).toBe(true)
    // Lena's own square is in her own room: Carol cannot be there
    expect(lens.has(cellKey(lena))).toBe(false)
  })
})
