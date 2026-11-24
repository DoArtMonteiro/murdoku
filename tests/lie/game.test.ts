import { describe, expect, it } from 'vitest'
import { countSolutions, findMurderer } from '../../src/core/engine'
import type { Puzzle } from '../../src/core/types'
import { commonPeople } from '../../src/lie/collide'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { initState, isClosed, ledgerRows, reduce } from '../../src/lie/state'
import type { Action, Ctx, GameState } from '../../src/lie/state'
import { blockedTiles, lensTiles } from '../../src/lie/lens'
import { clearSave, fingerprint, loadSave, saveKey, writeSave } from '../../src/lie/save'
import { beatFor } from '../../src/lie/coach'

const ctx: Ctx = { c: C, truthOnly: false }
const truth: Ctx = { c: C, truthOnly: true }
const run = (x: Ctx, s: GameState, ...as: Action[]) => as.reduce((st, a) => reduce(x, st, a), s)
const put = (id: string, row: number, col: number): Action[] => [{ t: 'select', id }, { t: 'tile', cell: { row, col } }]
const start = (x: Ctx = ctx) => initState(x, null)
const solveAll = (x: Ctx, s: GameState) => {
  const sol = C.puzzle.solution
  return run(x, s, ...Object.entries(sol).flatMap(([id, c]) => put(id, c.row, c.col)))
}

describe('fixture', () => {
  it('has one solution without the lie, and none with it', () => {
    expect(countSolutions(C.puzzle, 3)).toBe(1)
    const lie = C.statements.find(s => s.id === C.lieId)!
    const withLie: Puzzle = { ...C.puzzle, clues: [...C.puzzle.clues, { clue: lie.clue, text: lie.text }] }
    expect(countSolutions(withLie, 3)).toBe(0)
  })

  it('the liar is the murderer', () => {
    const lie = C.statements.find(s => s.id === C.lieId)!
    expect(lie.author).toBe(C.puzzle.murdererId)
    expect(findMurderer(C.puzzle)).toBe(C.puzzle.murdererId)
  })

  it('each listed collision is unsatisfiable alone, and they overlap only in the lie', () => {
    for (const ids of C.collisions) {
      const clues = ids.map(id => C.statements.find(s => s.id === id)!).map(s => ({ clue: s.clue, text: s.text }))
      expect(countSolutions({ ...C.puzzle, clues }, 1)).toBe(0)
    }
    expect(C.collisions[0].filter(id => C.collisions[1].includes(id))).toEqual([C.lieId])
  })
})

describe('placement', () => {
  it('places, moves and picks up', () => {
    let s = run(ctx, start(), ...put('b', 0, 0))
    expect(s.placed.b).toEqual({ row: 0, col: 0 })
    s = run(ctx, s, { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.placed.b).toBeUndefined()
    expect(s.announce).toContain('picked up')
  })

  it('refuses a tile on an occupied row or column, and says why', () => {
    let s = run(ctx, start(), ...put('b', 0, 0), ...put('c', 0, 3))
    expect(s.placed.c).toBeUndefined()
    expect(s.announce).toMatch(/row already holds Bruno/)
    s = run(ctx, s, { t: 'tile', cell: { row: 1, col: 0 } })
    expect(s.placed.c).toBeUndefined()
    expect(s.announce).toMatch(/column already holds Bruno/)
  })

  it('tapping someone else\'s token selects them', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), { t: 'select', id: 'c' }, { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.selected).toBe('b')
    expect(s.placed.b).toBeDefined()
  })

  it('undo goes back one placement', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1), { t: 'undo' })
    expect(s.placed.d).toBeUndefined()
    expect(s.placed.b).toBeDefined()
  })

  it('dims occupied rows and columns for the selected person only', () => {
    const s = run(ctx, start(), ...put('b', 0, 0))
    expect(blockedTiles(C.puzzle, s.placed, 'c').has('0,3')).toBe(true)
    expect(blockedTiles(C.puzzle, s.placed, 'b').has('0,3')).toBe(false)
  })
})

describe('lens', () => {
  it('lights where a lit statement can hold, with a free row and column', () => {
    const s = run(ctx, start(), ...put('b', 0, 0))
    const tiles = lensTiles(C, ctx.c.statements, 'a', ['s1'], s.placed)!
    expect(tiles.has('0,1')).toBe(false) // row 0 is Bruno's
    expect(tiles.has('4,2')).toBe(true) // the bottom wall is free
  })

  it('a relational statement lights nothing until the other person is placed', () => {
    expect(lensTiles(C, C.statements, 'd', ['s9'], {})).toBeNull()
    const t = lensTiles(C, C.statements, 'd', ['s9'], { a: { row: 4, col: 2 } })!
    expect(t.has('3,1')).toBe(true)
    expect(t.has('4,0')).toBe(false)
  })

  it('lit toggles on and off, and the lens cue only plays on', () => {
    let s = run(ctx, start(), { t: 'lit', id: 's1' })
    expect(s.lit.a).toEqual(['s1'])
    expect(s.cue).toBe('lens')
    s = run(ctx, s, { t: 'lit', id: 's1' })
    expect(s.lit.a).toEqual([])
  })
})

describe('the ledger', () => {
  it('records a collision when it first appears, and announces it', () => {
    const s = run(ctx, start(), ...put('b', 0, 0))
    expect(s.journal).toHaveLength(1)
    expect(s.journal[0].people).toEqual(['a', 'b'])
    expect(s.announce).toContain("These accounts can't all be true.")
    expect(s.cue).toBe('collision')
  })

  it('keeps the entry after undo and does not record it twice', () => {
    let s = run(ctx, start(), ...put('b', 0, 0))
    s = run(ctx, s, { t: 'undo' }, ...put('b', 0, 0))
    expect(s.journal).toHaveLength(1)
  })

  it('a natural order of play leaves the murderer as the one common person', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1))
    expect(ledgerRows(s.journal).map(r => r.people)).toEqual([['a', 'b'], ['a', 'd']])
    expect(commonPeople(ledgerRows(s.journal).map(r => r.people))).toEqual(['a'])
  })

  it('never records a person set against their own account alone', () => {
    const s = run(ctx, start(), ...put('c', 4, 4))
    expect(s.journal).toEqual([])
  })

  it('shows at most four rows, the latest', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ people: ['a', `p${i}`], statementIds: [] }))
    expect(ledgerRows(many).map(r => r.people[1])).toEqual(['p2', 'p3', 'p4', 'p5'])
  })

  it('records nothing in the true-statements direction', () => {
    const s = run(truth, start(truth), ...put('b', 0, 0), ...put('d', 3, 1))
    expect(s.journal).toEqual([])
  })
})

describe('doubting', () => {
  it('a wrong doubt says the account stands and costs one strike', () => {
    const s = run(ctx, start(), { t: 'doubt', id: 's9' })
    expect(s.stands).toEqual(['s9'])
    expect(s.strikes).toBe(1)
    expect(s.announce).toBe('That account stands.')
    expect(s.outcome).toBeNull()
  })

  it('a second wrong doubt ends the case cold', () => {
    const s = run(ctx, start(), { t: 'doubt', id: 's9' }, { t: 'doubt', id: 's3' })
    expect(s.outcome).toBe('cold')
    expect(JSON.stringify(s)).not.toContain('s2"') // never reveals the answer in state it announces
    expect(s.announce).not.toContain('Ana')
    expect(run(ctx, s, { t: 'doubt', id: 's5' }).strikes).toBe(2)
  })

  it('doubting the same statement twice is not a second strike', () => {
    const s = run(ctx, start(), { t: 'doubt', id: 's9' }, { t: 'doubt', id: 's9' })
    expect(s.strikes).toBe(1)
  })

  it('scene facts cannot be doubted', () => {
    const s = run(ctx, start(), { t: 'doubt', id: 's10' })
    expect(s.strikes).toBe(0)
    expect(s.stands).toEqual([])
  })

  it('the right doubt cracks the lie and lifts the liar off the plan', () => {
    const s = run(ctx, start(), ...put('a', 0, 2), { t: 'doubt', id: 's2' })
    expect(s.struck).toBe('s2')
    expect(s.placed.a).toBeUndefined()
    expect(s.lifted).toEqual({ person: 'a', cell: { row: 0, col: 2 } })
    expect(s.announce).toContain('Then where were you, really?')
    expect(s.selected).toBe('a')
    expect(run(ctx, s, { t: 'settleLift' }).lifted).toBeNull()
  })

  it('has no doubt in the true-statements direction', () => {
    const s = run(truth, start(truth), { t: 'doubt', id: 's2' })
    expect(s.struck).toBeNull()
    expect(s.strikes).toBe(0)
  })

  it('keeps the ledger as notes after the lie is struck', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1), { t: 'doubt', id: 's2' })
    expect(s.journal).toHaveLength(2)
  })
})

describe('closing the case', () => {
  it('does not close in Act 1, even on the true plan', () => {
    const s = solveAll(ctx, start())
    expect(s.struck).toBeNull()
    expect(isClosed(ctx, s)).toBe(false)
    expect(s.outcome).toBeNull()
  })

  it('closes on its own when the true plan stands after the lie is struck', () => {
    let s = run(ctx, start(), { t: 'doubt', id: 's2' })
    s = solveAll(ctx, s)
    expect(s.outcome).toBe('proved')
    expect(s.cue).toBe('bell')
    expect(s.strikes).toBe(0)
  })

  it('does not close on a full plan that breaks a statement', () => {
    let s = run(ctx, start(), { t: 'doubt', id: 's2' })
    // swap Ana and Davi's squares: rows and columns are still all different
    s = run(ctx, s, ...put('b', 0, 0), ...put('c', 1, 4), ...put('v', 2, 3), ...put('d', 4, 2), ...put('a', 3, 1))
    expect(Object.keys(s.placed)).toHaveLength(5)
    expect(s.outcome).toBeNull()
  })

  it('closes in the true-statements direction without any doubt', () => {
    const s = solveAll(truth, start(truth))
    expect(s.outcome).toBe('proved')
  })

  it('a closed case takes no more moves', () => {
    const s = run(truth, solveAll(truth, start(truth)), { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.placed.b).toBeDefined()
  })
})

describe('save', () => {
  it('round-trips under its own key and restores the state', () => {
    let s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1))
    s = run(ctx, s, { t: 'doubt', id: 's9' })
    writeSave(C, false, { placed: s.placed, struck: s.struck, stands: s.stands, strikes: s.strikes, journal: s.journal })
    expect(localStorage.getItem(saveKey('fixture', false))).toBeTruthy()
    expect(saveKey('fixture', false)).toBe('alibi_ofa_v1:fixture')
    const back = initState(ctx, loadSave(C, false))
    expect(back.placed).toEqual(s.placed)
    expect(back.strikes).toBe(1)
    expect(back.journal).toHaveLength(2)
    for (const k of Object.keys(localStorage)) expect(k.startsWith('alibi_ofa_')).toBe(true)
  })

  it('the true-statements direction has its own slot', () => {
    writeSave(C, true, { placed: { b: { row: 0, col: 0 } }, struck: null, stands: [], strikes: 0, journal: [] })
    expect(loadSave(C, false).placed).toEqual({})
    expect(loadSave(C, true).placed.b).toEqual({ row: 0, col: 0 })
    clearSave(C, true)
    expect(loadSave(C, true).placed).toEqual({})
  })

  it('discards a save made on a different case', () => {
    writeSave(C, false, { placed: { b: { row: 0, col: 0 } }, struck: null, stands: [], strikes: 1, journal: [] })
    const changed = { ...C, statements: C.statements.map(s => (s.id === 's5' ? { ...s, text: 'Changed.' } : s)) }
    expect(fingerprint(changed)).not.toBe(fingerprint(C))
    expect(loadSave(changed, false)).toEqual({ placed: {}, struck: null, stands: [], strikes: 0, journal: [] })
  })

  it('drops clashing, out-of-range and unknown entries', () => {
    localStorage.setItem(saveKey('fixture', false), JSON.stringify({
      fp: fingerprint(C), placed: { a: { row: 0, col: 0 }, b: { row: 0, col: 1 }, c: { row: 9, col: 9 }, zz: { row: 2, col: 2 } },
      struck: 'nonsense', stands: ['s10', 's2', 's9'], strikes: 7, journal: [{ people: ['a'], statementIds: [] }],
    }))
    const s = loadSave(C, false)
    expect(Object.keys(s.placed)).toEqual(['a'])
    expect(s.struck).toBeNull()
    expect(s.stands).toEqual(['s9'])
    expect(s.strikes).toBe(2)
    expect(s.journal).toEqual([])
  })

  it('survives broken storage', () => {
    localStorage.setItem(saveKey('fixture', false), '{not json')
    expect(loadSave(C, false).placed).toEqual({})
  })
})

describe('coach', () => {
  const base = { placed: {}, journal: [], struck: null, outcome: null }
  it('walks beat 1, 2, 3 from the real state', () => {
    expect(beatFor(base, false)).toBe(1)
    expect(beatFor({ ...base, placed: { b: { row: 0, col: 0 } } }, false)).toBe(2)
    expect(beatFor({ ...base, placed: { b: { row: 0, col: 0 } }, journal: [{ people: ['a', 'b'], statementIds: [] }] }, false)).toBe(3)
  })
  it('says nothing once the lie is struck or the case is over, and never beat 3 in direction A', () => {
    expect(beatFor({ ...base, struck: 's2' }, false)).toBeNull()
    expect(beatFor({ ...base, outcome: 'proved' as const }, false)).toBeNull()
    expect(beatFor({ ...base, journal: [{ people: ['a', 'b'], statementIds: [] }] }, true)).toBeNull()
  })
})
