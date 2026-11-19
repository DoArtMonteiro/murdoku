import { describe, expect, it } from 'vitest'
import { getPuzzleById } from '../../src/core/catalog'
import type { Puzzle } from '../../src/core/types'
import { initState, reduce } from '../../src/casebook/game'
import type { Action, GameState } from '../../src/casebook/game'
import { emptySave, parseSave, saveKey } from '../../src/casebook/save'
import { cellKey, conflictIds } from '../../src/casebook/cells'

const hard = getPuzzleById('hard-2') as Puzzle
const easy = getPuzzleById('very-easy-3') as Puzzle
const run = (p: Puzzle, s: GameState, ...as: Action[]) => as.reduce((st, a) => reduce(p, st, a), s)
const at = (row: number, col: number, floor = 0) => ({ row, col, floor })

describe('game reducer', () => {
  it('places the selected suspect with one tap and moves on to the next unplaced one', () => {
    const s = run(easy, initState(easy, emptySave()), { t: 'cell', cell: at(5, 0) })
    expect(s.placement.p0).toEqual(at(5, 0))
    expect(s.selected).toBe('p1')
  })

  it('lifts a suspect when their own square is tapped, and selects an occupant when another is tapped', () => {
    let s = run(easy, initState(easy, emptySave()), { t: 'cell', cell: at(5, 0) }, { t: 'cell', cell: at(2, 4) })
    s = run(easy, s, { t: 'cell', cell: at(5, 0) })
    expect(s.selected).toBe('p0')
    expect(s.placement.p0).toBeDefined()
    s = run(easy, s, { t: 'cell', cell: at(5, 0) })
    expect(s.placement.p0).toBeUndefined()
  })

  it('allows a row clash, marks both, and announces it', () => {
    const s = run(easy, initState(easy, emptySave()), { t: 'cell', cell: at(2, 0) }, { t: 'cell', cell: at(2, 3) })
    expect(Object.keys(s.placement)).toHaveLength(2)
    expect([...conflictIds(s.placement)].sort()).toEqual(['p0', 'p1'])
    expect(s.announce).toMatch(/Shares a row or column with/)
  })

  it('pencil marks are per suspect and do not place', () => {
    let s = run(easy, initState(easy, emptySave()), { t: 'pencil' }, { t: 'cell', cell: at(0, 0) })
    expect(s.placement).toEqual({})
    expect(s.pencil.p0).toEqual([cellKey(at(0, 0))])
    s = run(easy, s, { t: 'select', id: 'p1' })
    expect(s.pencil.p1).toBeUndefined()
    s = run(easy, s, { t: 'select', id: 'p0' }, { t: 'cell', cell: at(0, 0) })
    expect(s.pencil.p0).toEqual([])
  })

  it('suppose puts a ghost down without placing; a plain tap elsewhere clears it', () => {
    let s = run(easy, initState(easy, emptySave()), { t: 'long', cell: at(5, 0) })
    expect(s.ghost).toEqual({ person: 'p0', cell: at(5, 0) })
    expect(s.placement).toEqual({})
    s = run(easy, s, { t: 'cell', cell: at(1, 1) })
    expect(s.ghost).toBeNull()
    expect(s.placement).toEqual({})
  })

  it('a relational statement cannot be lit until the other person is placed', () => {
    const carol = hard.clues.findIndex(c => c.clue.kind === 'notSameRoomAs')
    let s = run(hard, initState(hard, emptySave()), { t: 'select', id: 'p2' }, { t: 'lit', index: carol })
    expect(s.lit.p2).toBeUndefined()
    s = run(hard, s, { t: 'select', id: 'p0' }, { t: 'cell', cell: hard.solution.p0 }, { t: 'select', id: 'p2' }, { t: 'lit', index: carol })
    expect(s.lit.p2).toEqual([carol])
  })

  it('undo restores the previous placement', () => {
    const s = run(easy, initState(easy, emptySave()), { t: 'cell', cell: at(5, 0) }, { t: 'undo' })
    expect(s.placement).toEqual({})
  })

  it('Why? walks three levels, counts them, and level 3 places the person', () => {
    let s = run(hard, initState(hard, emptySave()), { t: 'why' })
    expect(s.hint!.level).toBe(1)
    const who = s.hint!.person
    s = run(hard, s, { t: 'why' })
    expect(s.hint!.level).toBe(2)
    expect(s.lit[who]!.length).toBeGreaterThan(0)
    s = run(hard, s, { t: 'why' })
    expect(s.hint!.level).toBe(3)
    expect(s.placement[who]).toEqual({ ...hard.solution[who], floor: hard.solution[who].floor ?? 0 })
    expect(s.hintsUsed).toBe(3)
  })

  it('accuse: strikes and a cold case on three wrong names, called-it without a proven plan, proved with one', () => {
    const innocent = hard.people.find(x => x.id !== hard.murdererId && x.id !== hard.victimId)!.id
    let s = initState(hard, emptySave())
    for (let i = 0; i < 3; i++) s = run(hard, s, { t: 'accuse', id: innocent })
    expect(s.strikes).toBe(3)
    expect(s.outcome).toBe('cold')
    const called = run(hard, initState(hard, emptySave()), { t: 'accuse', id: hard.murdererId })
    expect(called.outcome).toBe('called')
    const full = initState(hard, { ...emptySave(), placement: Object.fromEntries(hard.people.map(x => [x.id, { ...hard.solution[x.id], floor: hard.solution[x.id].floor ?? 0 }])) })
    expect(run(hard, full, { t: 'accuse', id: hard.murdererId }).outcome).toBe('proved')
  })
})

describe('save', () => {
  it('uses its own namespace and drops anything invalid', () => {
    expect(saveKey('hard-2')).toBe('alibi_casebook_v1:hard-2')
    const s = parseSave(easy, { placement: { p0: { row: 5, col: 0 }, zz: { row: 0, col: 0 }, p1: { row: 99, col: 0 } }, pencil: { p0: ['0:1:1', 'bad'] }, strikes: 9, outcome: 'proved' })
    expect(s.placement).toEqual({ p0: { row: 5, col: 0, floor: 0 } })
    expect(s.pencil.p0).toEqual(['0:1:1'])
    expect(s.strikes).toBe(3)
    expect(parseSave(easy, 'nonsense')).toEqual(emptySave())
  })
})
