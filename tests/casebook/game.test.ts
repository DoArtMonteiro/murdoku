import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import type { Puzzle } from '../../src/core/types'
import { initState, reduce, toSaved } from '../../src/casebook/game'
import type { Action, GameState } from '../../src/casebook/game'
import { emptySave, parseSave, saveKey } from '../../src/casebook/save'
import { cellKey, conflictIds } from '../../src/casebook/cells'

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

  it('lighting a statement whose cells are all on the other floor brings that floor into view', () => {
    const bed = hard.clues.findIndex(c => c.clue.kind === 'onFurniture' && c.clue.person === 'p2')
    let s = run(hard, initState(hard, emptySave()), { t: 'select', id: 'p2' })
    expect(s.floor).toBe(0)
    s = run(hard, s, { t: 'lit', index: bed })
    expect(s.floor).toBe(1)
    // Why? level 2 does the same
    const w = run(hard, initState(hard, emptySave()), { t: 'why' }, { t: 'why' })
    expect(w.hint!.person).toBe('p0')
    expect(w.floor).toBe(1)
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

describe('tier after the solve', () => {
  const full = (p: Puzzle) => initState(p, { ...emptySave(), placement: Object.fromEntries(p.people.map(x => [x.id, { ...p.solution[x.id], floor: p.solution[x.id].floor ?? 0 }])) })

  it('a clean solve is "proved" and stays clean: lifting a token afterwards cannot buy a hint', () => {
    let s = run(hard, full(hard), { t: 'accuse', id: hard.murdererId })
    expect(s.outcome).toBe('proved')
    expect(s.verdict).toEqual({ kind: 'proved' })
    const lifted = run(hard, s, { t: 'cell', cell: hard.solution.p0 })
    expect(Object.keys(lifted.placement).length).toBeLessThan(hard.people.length)
    s = run(hard, lifted, { t: 'why' }, { t: 'why' })
    expect(s.hintsUsed).toBe(0)
    expect(s.hint).toBeNull()
  })

  it('a hint before the solve makes it "proved with help"', () => {
    const s = run(hard, { ...full(hard), hintsUsed: 1 }, { t: 'accuse', id: hard.murdererId })
    expect(s.verdict).toEqual({ kind: 'provedHelp' })
    expect(s.outcome).toBe('proved')
  })

  it('a strike before the solve makes it "proved with help"', () => {
    const innocent = hard.people.find(x => x.id !== hard.murdererId && x.id !== hard.victimId)!.id
    const s = run(hard, full(hard), { t: 'accuse', id: innocent }, { t: 'accuse', id: hard.murdererId })
    expect(s.verdict).toEqual({ kind: 'provedHelp' })
  })
})

describe('a revealed answer', () => {
  const full = (p: Puzzle) => initState(p, { ...emptySave(), placement: Object.fromEntries(p.people.map(x => [x.id, { ...p.solution[x.id], floor: p.solution[x.id].floor ?? 0 }])) })

  it('after the alibis were heard, finishing the plan is still only "called"', () => {
    let s = run(hard, initState(hard, emptySave()), { t: 'accuse', id: hard.murdererId })
    expect(s.outcome).toBe('called')
    s = run(hard, s, { t: 'reveal' })
    expect(s.revealed).toBe(true)
    s = { ...s, placement: full(hard).placement }
    s = run(hard, s, { t: 'accuse', id: hard.murdererId })
    expect(s.verdict).toEqual({ kind: 'calledIt' })
    expect(s.outcome).toBe('called')
  })

  it('the cold-case reveal is a reveal too, and a proof already earned is not undone by hearing it again', () => {
    const innocent = hard.people.find(x => x.id !== hard.murdererId && x.id !== hard.victimId)!.id
    let c = initState(hard, emptySave())
    for (let i = 0; i < 3; i++) c = run(hard, c, { t: 'accuse', id: innocent })
    expect(run(hard, c, { t: 'reveal' }).revealed).toBe(true)
    const proved = run(hard, full(hard), { t: 'accuse', id: hard.murdererId })
    expect(proved.outcome).toBe('proved')
    expect(run(hard, proved, { t: 'reveal' }).revealed).toBe(false)
  })

  it('persists across a reload, and a stale or malformed flag is ignored', () => {
    const s = run(hard, initState(hard, emptySave()), { t: 'reveal' })
    expect(toSaved(s).revealed).toBe(true)
    expect(initState(hard, parseSave(hard, JSON.parse(JSON.stringify(toSaved(s))))).revealed).toBe(true)
    expect(parseSave(hard, { revealed: 'yes' }).revealed).toBe(false)
    expect(parseSave(hard, {}).revealed).toBe(false)
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
