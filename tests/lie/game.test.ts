import { afterEach, describe, expect, it, vi } from 'vitest'
import { countSolutions, findMurderer } from '../../src/core/engine'
import type { Puzzle } from '../../src/core/types'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { activeStatements, chipOf, HINT, initState, isClosed, ladderStep, MAX_PINS, premiseOf, reduce, shortClaim, tierFor } from '../../src/lie/state'
import type { Action, Ctx, GameState } from '../../src/lie/state'
import { blockedTiles, lensTiles, nowhereFits } from '../../src/lie/lens'
import { clearSave, fingerprint, loadSave, loadSolved, markSolved, nextId, parseSave, pickId, saveKey, writeSave } from '../../src/lie/save'
import type { Saved } from '../../src/lie/save'
import { BEATS, beatFor, COACH_KEY } from '../../src/lie/coach'

const ctx: Ctx = { c: C, truthOnly: false }
const truth: Ctx = { c: C, truthOnly: true }
const run = (x: Ctx, s: GameState, ...as: Action[]) => as.reduce((st, a) => reduce(x, st, a), s)
const put = (id: string, row: number, col: number): Action[] => [{ t: 'select', id }, { t: 'tile', cell: { row, col } }]
const pins = (...ids: string[]): Action[] => ids.map(id => ({ t: 'pin', id }) as const)
const start = (x: Ctx = ctx) => initState(x, null)
const sol = C.puzzle.solution
const solveAll = (x: Ctx, s: GameState) => run(x, s, ...Object.entries(sol).flatMap(([id, c]) => put(id, c.row, c.col)))
// the two contradictions the case offers, cited and recorded
const prove = (s: GameState) => run(ctx, s, ...pins(...C.collisions[0]), { t: 'cite' }, ...pins(...C.collisions[1]), { t: 'cite' })

afterEach(() => localStorage.clear())

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
})

describe('the first minute', () => {
  it('opens on the first suspect with their first statement already lit', () => {
    const s = start()
    expect(s.selected).toBe('a')
    expect(s.lit).toEqual({ a: ['s1'] })
    expect(Object.keys(s.placed)).toEqual([])
  })
})

describe('placement: the experiment tool, and a silent bench', () => {
  it('places, moves and picks up', () => {
    let s = run(ctx, start(), ...put('b', 0, 0))
    expect(s.placed.b).toEqual({ row: 0, col: 0 })
    s = run(ctx, s, { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.placed.b).toBeUndefined()
    expect(s.announce).toContain('picked up')
  })

  it('writes down nothing when accounts clash: no ledger, no crack, no note, no collision cue', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1))
    expect(s.ledger).toEqual([])
    expect(s.cracked).toEqual([])
    expect(s.note).toBeNull()
    expect(s.cue).toBe('place')
    expect(s.falseCitations).toBe(0)
  })

  it('refuses a tile on an occupied row or column, with a short message', () => {
    let s = run(ctx, start(), ...put('b', 0, 0), ...put('c', 0, 3))
    expect(s.placed.c).toBeUndefined()
    expect(s.note).toEqual({ text: 'Bruno already holds that row.', kind: 'refuse' })
    expect(s.refusals).toBe(1)
    s = run(ctx, s, { t: 'tile', cell: { row: 1, col: 0 } })
    expect(s.placed.c).toBeUndefined()
    expect(s.note?.text).toBe('That column is taken.')
    expect(s.refusals).toBe(2)
  })

  it('a successful move clears the refusal and the note', () => {
    let s = run(ctx, start(), ...put('b', 0, 0), ...put('c', 0, 3))
    expect(s.refusalOpen).toBe(true)
    s = run(ctx, s, { t: 'tile', cell: { row: 1, col: 4 } })
    expect(s.refusalOpen).toBe(false)
    expect(s.note).toBeNull()
  })

  it("tapping someone else's token selects them", () => {
    const s = run(ctx, start(), ...put('b', 0, 0), { t: 'select', id: 'c' }, { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.selected).toBe('b')
    expect(s.placed.b).toBeDefined()
  })

  it('undo goes back one placement', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...put('d', 3, 1), { t: 'undo' })
    expect(s.placed.d).toBeUndefined()
    expect(s.placed.b).toBeDefined()
  })
})

describe('the lens', () => {
  it('lights where a lit statement can hold, with a free row and column', () => {
    const s = run(ctx, start(), ...put('b', 0, 0))
    const tiles = lensTiles(C, ctx.c.statements, 'a', ['s1'], s.placed)!
    expect(tiles.has('0,1')).toBe(false)
    expect(tiles.has('4,2')).toBe(true)
  })

  it('a relational statement lights nothing until the other person is placed', () => {
    expect(lensTiles(C, C.statements, 'd', ['s9'], {})).toBeNull()
    const t = lensTiles(C, C.statements, 'd', ['s9'], { a: { row: 4, col: 2 } })!
    expect(t.has('3,1')).toBe(true)
    expect(t.has('4,0')).toBe(false)
  })

  it('lit toggles on and off, and the lens cue only plays on', () => {
    let s = run(ctx, start(), { t: 'lit', id: 's2' })
    expect(s.lit.a).toEqual(['s1', 's2'])
    expect(s.cue).toBe('lens')
    s = run(ctx, s, { t: 'lit', id: 's2' })
    expect(s.lit.a).toEqual(['s1'])
  })

  it('says "nowhere fits" only for an unplaced suspect whose lit statements leave no tile', () => {
    const crowded = { b: { row: 0, col: 0 }, d: { row: 1, col: 1 } }
    const empty = lensTiles(C, activeStatements(ctx, null), 'a', ['s1', 's2'], crowded)!
    expect(empty.size).toBe(0)
    expect(nowhereFits(empty, crowded, 'a')).toBe(true)
    expect(nowhereFits(empty, { ...crowded, a: { row: 4, col: 4 } }, 'a')).toBe(false)
    expect(nowhereFits(null, crowded, 'a')).toBe(false)
  })

  it('the rows and columns of placed people are only drawn from the fourth false citation (the helper stays available)', () => {
    const s = run(ctx, start(), ...put('b', 0, 0))
    expect(blockedTiles(C.puzzle, s.placed, 'c').has('0,3')).toBe(true)
    expect(blockedTiles(C.puzzle, s.placed, 'b').has('0,3')).toBe(false)
  })
})

describe('pins', () => {
  it('pin and unpin, in reading order, across suspects', () => {
    let s = run(ctx, start(), ...pins('s9', 's2'))
    expect(s.pins).toEqual(['s2', 's9'])
    s = run(ctx, s, ...pins('s2'))
    expect(s.pins).toEqual(['s9'])
  })

  it('at most four', () => {
    const s = run(ctx, start(), ...pins('s1', 's2', 's3', 's4', 's5'))
    expect(s.pins).toHaveLength(MAX_PINS)
    expect(s.note?.text).toBe('Four at most. Unpin one first.')
  })

  it('scene facts cannot be pinned', () => {
    expect(run(ctx, start(), ...pins('s10')).pins).toEqual([])
  })

  it('there is nothing to pin in the hidden harness', () => {
    expect(run(truth, start(truth), ...pins('s1')).pins).toEqual([])
  })
})

describe('citing: the ruling', () => {
  it('a minimal contradiction is recorded, the pins are cleared, and the crack lands on placed speakers only', () => {
    const s = run(ctx, start(), ...put('b', 0, 0), ...pins('s1', 's2', 's3'), { t: 'cite' })
    expect(s.ledger).toEqual([['s1', 's2', 's3']])
    expect(s.pins).toEqual([])
    expect(s.note).toEqual({ text: "Those accounts can't all be true.", kind: 'crack' })
    expect(s.cue).toBe('collision')
    expect(s.falseCitations).toBe(0)
    expect(s.cracked).toEqual(['s1', 's2', 's3'])
  })

  it("unsatisfiable but not minimal: \"One of these isn't needed.\", not recorded, and it counts", () => {
    const s = run(ctx, start(), ...pins('s1', 's2', 's3', 's5'), { t: 'cite' })
    expect(s.note?.text).toBe("One of these isn't needed.")
    expect(s.ledger).toEqual([])
    expect(s.falseCitations).toBe(1)
    expect(s.pins).toHaveLength(4)
  })

  it('satisfiable: "They can all be true.", not recorded, and it counts', () => {
    const s = run(ctx, start(), ...pins('s1', 's3'), { t: 'cite' })
    expect(s.note?.text).toBe('They can all be true.')
    expect(s.ledger).toEqual([])
    expect(s.falseCitations).toBe(1)
  })

  it('never names the false statement, whatever the ruling', () => {
    for (const ids of [['s1', 's2', 's3'], ['s1', 's2', 's3', 's5'], ['s1', 's3']]) {
      const s = run(ctx, start(), ...pins(...ids), { t: 'cite' })
      expect(`${s.announce} ${s.note?.text}`).not.toMatch(/Ana|liar|false|lie/i)
    }
  })

  it('needs two pins; a repeat of a recorded contradiction is a no-op, not a false citation', () => {
    expect(run(ctx, start(), ...pins('s1'), { t: 'cite' }).falseCitations).toBe(0)
    let s = run(ctx, start(), ...pins('s1', 's2', 's3'), { t: 'cite' }, ...pins('s3', 's1', 's2'), { t: 'cite' })
    expect(s.ledger).toHaveLength(1)
    expect(s.note?.text).toBe('Already on the ledger.')
    expect(s.falseCitations).toBe(0)
    s = run(ctx, s, { t: 'undo' })
    expect(s.cracked).toEqual([])
  })

  it('the crack goes away on the next move', () => {
    const s = run(ctx, start(), ...pins('s1', 's2', 's3'), { t: 'cite' }, ...put('b', 0, 0))
    expect(s.cracked).toEqual([])
  })
})

describe('doubt: the gate reads the ledger only', () => {
  it('a single recorded contradiction is refused, with no penalty', () => {
    const s = run(ctx, start(), ...pins(...C.collisions[0]), { t: 'cite' }, { t: 'doubt', id: 's2' })
    expect(s.struck).toBeNull()
    expect(s.note?.text).toBe("One contradiction isn't proof — either of them could be lying.")
    expect(s.falseCitations).toBe(0)
  })

  it('two contradictions that meet in the doubted statement strike it', () => {
    const s = run(ctx, prove(start()), { t: 'doubt', id: 's2' })
    expect(s.struck).toBe('s2')
    expect(s.selected).toBe('a')
    expect(s.note?.text).toBe('That account cracks. Then where was Ana?')
    expect(s.cue).toBe('crack')
  })

  it('refuses a statement that is in only one of the contradictions', () => {
    const s = run(ctx, prove(start()), { t: 'doubt', id: 's1' })
    expect(s.struck).toBeNull()
    expect(s.note?.text).toMatch(/isn't proof/)
  })

  it('refuses when the contradictions meet in two statements', () => {
    const base = start()
    const s = run(ctx, { ...base, ledger: [['s1', 's2', 's3'], ['s1', 's2', 's8']] }, { t: 'doubt', id: 's2' })
    expect(s.struck).toBeNull()
  })

  it('if a case ever lets the gate pass for a truth, it refuses and warns (never strikes it)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const base = start()
    const s = run(ctx, { ...base, ledger: [['s1', 's3', 's4'], ['s1', 's5', 's6']] }, { t: 'doubt', id: 's1' })
    expect(s.struck).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('scene facts and unknown ids cannot be doubted', () => {
    expect(run(ctx, prove(start()), { t: 'doubt', id: 's10' }).struck).toBeNull()
    expect(run(ctx, prove(start()), { t: 'doubt', id: 'zz' }).struck).toBeNull()
  })

  it('there is no doubt in the hidden harness', () => {
    expect(run(truth, start(truth), { t: 'doubt', id: 's2' }).struck).toBeNull()
  })

  it('the proof lifts the liar off the plan', () => {
    const s = run(ctx, prove(run(ctx, start(), ...put('a', 0, 2))), { t: 'doubt', id: 's2' })
    expect(s.placed.a).toBeUndefined()
    expect(s.lifted).toEqual({ person: 'a', cell: { row: 0, col: 2 } })
    expect(run(ctx, s, { t: 'settleLift' }).lifted).toBeNull()
  })
})

describe('Act 2', () => {
  it('honest tokens that sit where the true statements put them lock; guesses go back to the tray', () => {
    const base = run(ctx, start(), ...put('b', sol.b.row, sol.b.col), ...put('c', 3, 3))
    const s = run(ctx, prove(base), { t: 'doubt', id: 's2' })
    expect(s.locked).toEqual(['b'])
    expect(s.placed).toEqual({ b: sol.b })
    expect(s.announce).toMatch(/One placement did not fit/)
    // a locked token cannot be picked up or moved
    const tried = run(ctx, s, { t: 'select', id: 'b' }, { t: 'tile', cell: { row: sol.b.row, col: sol.b.col } })
    expect(tried.placed.b).toEqual(sol.b)
    expect(tried.note?.text).toBe("Bruno's place is settled.")
    const moved = run(ctx, s, { t: 'select', id: 'b' }, { t: 'tile', cell: { row: 1, col: 1 } })
    expect(moved.placed.b).toEqual(sol.b)
  })

  it('even after a wrong guess before the proof, the case can be completed', () => {
    const wrong = run(ctx, start(), ...put('d', 4, 4), ...put('c', 3, 3))
    let s = run(ctx, prove(wrong), { t: 'doubt', id: 's2' })
    s = solveAll(ctx, s)
    expect(s.outcome).toBe('proved')
  })

  it('does not close in Act 1, even on the true plan', () => {
    const s = solveAll(ctx, start())
    expect(s.struck).toBeNull()
    expect(isClosed(ctx, s)).toBe(false)
    expect(s.outcome).toBeNull()
    expect(s.note).toBeNull()
  })

  it('closes on its own when the true plan stands after the proof', () => {
    const s = solveAll(ctx, run(ctx, prove(start()), { t: 'doubt', id: 's2' }))
    expect(s.outcome).toBe('proved')
    // the reveal sequence rings the bell itself; the solve does not
    expect(s.cue).not.toBe('bell')
    expect(s.falseCitations).toBe(0)
  })

  it('a complete plan that breaks a statement says whose account does not hold there', () => {
    let s = run(ctx, prove(start()), { t: 'doubt', id: 's2' })
    // Ana and Davi swap squares: every row and column is still different
    s = run(ctx, s, ...put('b', 0, 0), ...put('c', 1, 4), ...put('v', 2, 3), ...put('d', 4, 2), ...put('a', 3, 1))
    expect(Object.keys(s.placed)).toHaveLength(5)
    expect(s.outcome).toBeNull()
    expect(s.note?.text).toMatch(/^(Ana|Davi)'s account doesn't hold there\.$/)
  })

  it('never blames the struck lie', () => {
    let s = run(ctx, prove(start()), { t: 'doubt', id: 's2' })
    s = run(ctx, s, ...put('b', 0, 0), ...put('c', 1, 4), ...put('v', 2, 3), ...put('d', 3, 1), ...put('a', 4, 2))
    expect(s.outcome).toBe('proved')
  })

  it('closes in the hidden harness without any proof, and says so for a broken plan', () => {
    expect(solveAll(truth, start(truth)).outcome).toBe('proved')
    const s = run(truth, start(truth), ...put('b', 0, 0), ...put('c', 1, 4), ...put('v', 2, 3), ...put('d', 4, 2), ...put('a', 3, 1))
    expect(s.note?.text).toMatch(/account doesn't hold there/)
  })

  it('a closed case takes no more moves', () => {
    const s = run(truth, solveAll(truth, start(truth)), { t: 'tile', cell: { row: 0, col: 0 } })
    expect(s.placed.b).toBeDefined()
  })
})

describe('the failure ladder: never names a statement', () => {
  it('steps at 2 and 4 false citations', () => {
    expect([0, 1, 2, 3, 4, 9].map(ladderStep)).toEqual([0, 0, 1, 1, 2, 2])
    expect(HINT).toBe('Who is standing in the way?')
  })

  it('tiers', () => {
    expect([0, 1, 3, 4, 7].map(n => tierFor(false, n))).toEqual([
      'Proved', 'Proved, after some false starts', 'Proved, after some false starts', 'Proved the long way', 'Proved the long way',
    ])
    expect(tierFor(true, 0)).toBe('Closed')
  })

  it('false citations accumulate', () => {
    let s = run(ctx, start(), ...pins('s1', 's3'))
    for (let i = 0; i < 4; i++) s = run(ctx, s, { t: 'cite' })
    expect(s.falseCitations).toBe(4)
    expect(ladderStep(s.falseCitations)).toBe(2)
  })
})

describe('chips', () => {
  it('derive a short claim from the clue: place, furniture or person', () => {
    const claim = (id: string) => shortClaim(C, C.statements.find(s => s.id === id)!)
    expect(claim('s2')).toBe('the Net Loft')
    expect(claim('s3')).toBe('on the chair')
    expect(claim('s6')).toBe('by the table')
    expect(claim('s7')).toBe('apart from Bruno')
    expect(claim('s9')).toBe('north of Ana')
    expect(claim('s1')).toBe('a wall')
    expect(chipOf(C, C.statements[1])).toBe('Ana · the Net Loft')
  })
})

describe('save', () => {
  const props = (s: GameState): Saved => ({ placed: s.placed, struck: s.struck, pins: s.pins, locked: s.locked, ledger: s.ledger.map(r => [...r]), falseCitations: s.falseCitations, phase: s.struck ? 'rebuild' : 'hunt' })

  it('round-trips under the v2 key: pins, ledger, false citations, phase', () => {
    let s = run(ctx, start(), ...put('b', 0, 0), ...pins('s1', 's3'), { t: 'cite' }, ...pins('s1', 's3'), ...pins('s2', 's8', 's9'))
    writeSave(C, false, props(s))
    expect(saveKey('fixture', false)).toBe('alibi_ofa_v2:fixture')
    expect(JSON.parse(localStorage.getItem(saveKey('fixture', false))!).phase).toBe('hunt')
    const back = initState(ctx, loadSave(C, false))
    expect(back.placed).toEqual(s.placed)
    expect(back.pins).toEqual(['s2', 's8', 's9'])
    expect(back.falseCitations).toBe(1)
    s = prove(start())
    writeSave(C, false, props(s))
    expect(initState(ctx, loadSave(C, false)).ledger).toEqual(s.ledger)
    for (const k of Object.keys(localStorage)) expect(k.startsWith('alibi_ofa_')).toBe(true)
  })

  it('Act 2 survives a reload as it was: locks kept, the liar placement kept, a wrong token still there and unlocked', () => {
    let s = run(ctx, prove(run(ctx, start(), ...put('b', sol.b.row, sol.b.col))), { t: 'doubt', id: 's2' })
    s = run(ctx, s, ...put('c', 3, 3), ...put('a', 4, 2))
    writeSave(C, false, props(s))
    const back = initState(ctx, loadSave(C, false))
    expect(back.struck).toBe('s2')
    expect(back.locked).toEqual(['b'])
    expect(back.placed).toEqual({ b: sol.b, c: { row: 3, col: 3 }, a: { row: 4, col: 2 } })
  })

  it('a finished case restores as closed', () => {
    const s = solveAll(ctx, run(ctx, prove(start()), { t: 'doubt', id: 's2' }))
    expect(s.outcome).toBe('proved')
    writeSave(C, false, props(s))
    expect(initState(ctx, loadSave(C, false)).outcome).toBe('proved')
  })

  it('a stored lock the true statements disagree with is dropped on load', () => {
    const s = run(ctx, prove(start()), { t: 'doubt', id: 's2' })
    localStorage.setItem(saveKey('fixture', false), JSON.stringify({ ...props(s), placed: { c: { row: 3, col: 3 } }, locked: ['c', 'a'], fp: fingerprint(C) }))
    expect(loadSave(C, false).locked).toEqual([])
  })

  it('a version 1 save is ignored', () => {
    localStorage.setItem('alibi_ofa_v1:fixture', JSON.stringify({ fp: fingerprint(C), placed: { b: { row: 0, col: 0 } }, struck: 's2', stands: [], strikes: 1, journal: [] }))
    const s = loadSave(C, false)
    expect(s.placed).toEqual({})
    expect(s.struck).toBeNull()
  })

  it('a stored phase or struck is not trusted: Act 2 needs the ledger to prove it', () => {
    localStorage.setItem(saveKey('fixture', false), JSON.stringify({ fp: fingerprint(C), placed: {}, struck: 's2', phase: 'rebuild', ledger: [['s1', 's2', 's3']], pins: [], falseCitations: 0 }))
    const s = loadSave(C, false)
    expect(s.struck).toBeNull()
    expect(s.phase).toBe('hunt')
    expect(s.ledger).toEqual([['s1', 's2', 's3']])
  })

  it('drops ledger rows the engine no longer calls minimal, and bad pins', () => {
    const raw = {
      fp: fingerprint(C), placed: {}, struck: null, falseCitations: 2,
      ledger: [['s1', 's3'], ['s1', 's2', 's3', 's5'], ['s1', 's2', 's3'], ['s3', 's2', 's1'], 'x'],
      pins: ['s10', 'zz', 's1', 's1', 's2', 's3', 's4', 's5'],
    }
    const s = parseSave(C, false, raw)
    expect(s.ledger).toEqual([['s1', 's2', 's3']])
    expect(s.pins).toEqual(['s1', 's2', 's3', 's4'])
    expect(s.falseCitations).toBe(2)
  })

  it('the hidden harness has its own slot and keeps only the placement', () => {
    writeSave(C, true, { placed: { b: { row: 0, col: 0 } }, struck: null, pins: ['s1'], locked: [], ledger: [['s1', 's2', 's3']], falseCitations: 3, phase: 'hunt' })
    expect(loadSave(C, false).placed).toEqual({})
    const t = loadSave(C, true)
    expect(t.placed.b).toEqual({ row: 0, col: 0 })
    expect(t.ledger).toEqual([])
    clearSave(C, true)
    expect(loadSave(C, true).placed).toEqual({})
  })

  it('discards a save made on a different case, and drops clashing or out-of-range entries', () => {
    writeSave(C, false, { ...props(start()), placed: { b: { row: 0, col: 0 } }, falseCitations: 1 })
    const changed = { ...C, statements: C.statements.map(s => (s.id === 's5' ? { ...s, text: 'Changed.' } : s)) }
    expect(loadSave(changed, false).placed).toEqual({})
    const s = parseSave(C, false, { fp: fingerprint(C), placed: { a: { row: 0, col: 0 }, b: { row: 0, col: 1 }, c: { row: 9, col: 9 }, zz: { row: 2, col: 2 } } })
    expect(Object.keys(s.placed)).toEqual(['a'])
  })

  it('survives broken storage', () => {
    localStorage.setItem(saveKey('fixture', false), '{not json')
    expect(loadSave(C, false).placed).toEqual({})
  })

  it('remembers solved cases under its own key', () => {
    expect(loadSolved()).toEqual([])
    markSolved('ofa-01')
    markSolved('ofa-01')
    expect(loadSolved()).toEqual(['ofa-01'])
    localStorage.setItem('alibi_ofa_solved_v1', 'not json')
    expect(loadSolved()).toEqual([])
  })
})

describe('the opening and the casebook', () => {
  it('shows two sentences of the premise, no more', () => {
    expect(premiseOf('One. Two! Three? Four.')).toBe('One. Two!')
    expect(premiseOf('Only one sentence here.')).toBe('Only one sentence here.')
    expect(premiseOf('')).toBe('')
    expect(premiseOf(C.story.premise)).toBe('Ines was found at her desk in the counting-house. Everyone was asked where they had been.')
  })

  const order = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]
  it('?alibi with no id opens the first unsolved case; a named one is honoured', () => {
    expect(pickId('', order, [])).toBe('one')
    expect(pickId('', order, ['one'])).toBe('two')
    expect(pickId('', order, ['one', 'two', 'three'])).toBe('one')
    expect(pickId('fixture', order, [])).toBe('fixture')
    expect(pickId('', [], [])).toBe('')
  })

  it('Next case is the next unsolved one in order, wrapping, and none for a lone case', () => {
    expect(nextId('one', order, [])).toBe('two')
    expect(nextId('one', order, ['two'])).toBe('three')
    expect(nextId('three', order, ['two'])).toBe('one')
    expect(nextId('two', order, ['one', 'three'])).toBe('three')
    expect(nextId('one', [{ id: 'one' }], [])).toBeNull()
    expect(nextId('fixture', order, [])).toBeNull()
  })
})

describe('coach', () => {
  const base = { placed: {}, pins: [] as string[], ledger: [] as string[][], struck: null, outcome: null, refusalOpen: false, touched: false }
  it('is v2 and walks beat 1, 2, 3 from the real state, in the words of the brief', () => {
    expect(COACH_KEY).toBe('alibi_ofa_coach_v2')
    expect(BEATS[1]).toBe('Tap a statement: the plan shows where it can hold.')
    expect(BEATS[2]).toBe('One person per row and per column.')
    expect(beatFor(base, false)).toBe(1)
    expect(beatFor({ ...base, touched: true }, false)).toBeNull()
    expect(beatFor({ ...base, placed: { b: { row: 0, col: 0 } } }, false)).toBeNull()
    expect(beatFor({ ...base, touched: true, refusalOpen: true }, false)).toBe(2)
    expect(beatFor({ ...base, touched: true, pins: ['s1'] }, false)).toBe(3)
  })
  it('beat 3 goes quiet once something is on the ledger, and never states the method', () => {
    expect(beatFor({ ...base, pins: ['s1'], ledger: [['s1', 's2', 's3']] }, false)).toBeNull()
    expect(Object.values(BEATS).join(' ')).not.toMatch(/collision|collide|common|every contradiction/i)
  })
  it('says nothing once the lie is proved or the case is over, and never beat 3 in the hidden harness', () => {
    expect(beatFor({ ...base, struck: 's2' }, false)).toBeNull()
    expect(beatFor({ ...base, outcome: 'proved' as const }, false)).toBeNull()
    expect(beatFor({ ...base, touched: true, pins: ['s1'] }, true)).toBeNull()
  })
})
