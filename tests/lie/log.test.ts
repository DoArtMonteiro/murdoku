import { afterEach, describe, expect, it } from 'vitest'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { beginRun, clearLog, LOG_KEY, loadLog, logEvents, summarizeLog } from '../../src/lie/log'
import { initState, reduce } from '../../src/lie/state'
import type { Action, Ctx, GameState, LogEvent } from '../../src/lie/state'

const ctx: Ctx = { c: C, truthOnly: false }
const run = (s: GameState, ...as: Action[]) => as.reduce((st, a) => reduce(ctx, st, a), s)
const pins = (...ids: string[]): Action[] => ids.map(id => ({ t: 'pin', id }) as const)
const put = (id: string, row: number, col: number): Action[] => [{ t: 'select', id }, { t: 'tile', cell: { row, col } }]
const kinds = (s: GameState) => s.events.map(e => (e.d ? `${e.k}:${e.d}` : e.k))

afterEach(() => localStorage.clear())

describe('what the reducer names for the log', () => {
  it('pins, citations and the first recorded contradiction', () => {
    const s = run(initState(ctx, null), ...pins('s1', 's3'), { t: 'cite' }, ...pins('s2'), { t: 'cite' })
    expect(kinds(s)).toEqual(['pin:s1', 'pin:s3', 'cite:satisfiable', 'pin:s2', 'cite:minimal', 'record'])
  })

  it('a false citation of each kind, and a repeat', () => {
    const redundant = run(initState(ctx, null), ...pins('s1', 's2', 's3', 's5'), { t: 'cite' })
    expect(kinds(redundant).at(-1)).toBe('cite:redundant')
    const repeat = run(initState(ctx, null), ...pins('s1', 's2', 's3'), { t: 'cite' }, ...pins('s1', 's2', 's3'), { t: 'cite' })
    expect(kinds(repeat).at(-1)).toBe('cite:repeat')
  })

  it('doubts: refused with a reason, then proved; the proof, the first move after it, completion', () => {
    let s = run(initState(ctx, null), ...pins(...C.collisions[0]), { t: 'cite' }, { t: 'doubt', id: 's2' })
    expect(kinds(s).slice(-1)).toEqual(['doubt:refused:one'])
    s = run(s, ...pins(...C.collisions[1]), { t: 'cite' }, { t: 'doubt', id: 's2' })
    expect(kinds(s).slice(-2)).toEqual(['doubt:proved', 'proof'])
    for (const [id, c] of Object.entries(C.puzzle.solution)) s = run(s, ...put(id, c.row, c.col))
    expect(kinds(s)).toContain('move2')
    expect(kinds(s).at(-1)).toBe('complete')
  })

  it('the help ladder is logged as it is reached', () => {
    let s = run(initState(ctx, null), ...pins('s1', 's3'))
    for (let i = 0; i < 6; i++) s = run(s, { t: 'cite' })
    expect(s.events.filter(e => e.k === 'ladder').map(e => e.d)).toEqual(['1', '2', '3'])
  })

  it('moves that change nothing log nothing', () => {
    const s0 = initState(ctx, null)
    expect(run(s0, { t: 'cite' }).events).toEqual([])
    expect(run(s0, ...put('b', 0, 0)).events).toEqual([])
  })
})

describe('the local log', () => {
  const ev = (...k: LogEvent['k'][]): LogEvent[] => k.map(x => ({ k: x }))

  it('opens a run, appends stamped events and summarises them relative to the start', () => {
    beginRun('fixture', 'The Quiet Quay', true, 1_000_000)
    logEvents('fixture', [{ k: 'pin', d: 's1' }], 1_042_000)
    logEvents('fixture', [{ k: 'cite', d: 'minimal' }, { k: 'record' }], 1_070_000)
    logEvents('fixture', [{ k: 'doubt', d: 'refused:one' }], 1_100_000)
    logEvents('fixture', [{ k: 'proof' }], 1_200_000)
    logEvents('fixture', [{ k: 'ladder', d: '2' }], 1_201_000)
    const text = summarizeLog()
    expect(text).toContain('fixture "The Quiet Quay" — run 1 of 1')
    expect(text).toContain('first pin +0:42 · first citation +1:10 · first recorded contradiction +1:10')
    expect(text).toContain('citations: +1:10 minimal')
    expect(text).toContain('doubts: +1:40 refused:one')
    expect(text).toContain('proof +3:20 · act 2 first move not yet · complete not yet')
    expect(text).toContain('false steps: 1 · help reached: 2 (a suspect pulsed)')
  })

  it('a fresh start is a new run; picking up a case continues the last one', () => {
    beginRun('fixture', 'Q', true, 1)
    beginRun('fixture', 'Q', false, 2)
    expect(loadLog().fixture.runs).toHaveLength(1)
    expect(loadLog().fixture.runs[0].events.map(e => e.d)).toEqual([undefined, 'resumed'])
    beginRun('fixture', 'Q', true, 3)
    expect(loadLog().fixture.runs).toHaveLength(2)
  })

  it('is capped: five runs, three hundred events, and only the first move after the proof', () => {
    for (let i = 0; i < 8; i++) beginRun('fixture', 'Q', true, i)
    expect(loadLog().fixture.runs).toHaveLength(5)
    for (let i = 0; i < 400; i++) logEvents('fixture', ev('pin'), 100 + i)
    const run = loadLog().fixture.runs.at(-1)!
    expect(run.events).toHaveLength(300)
    logEvents('fixture', ev('move2', 'move2'), 1)
    expect(loadLog().fixture.runs.at(-1)!.events.filter(e => e.k === 'move2')).toHaveLength(1)
  })

  it('without a run, events are dropped; broken storage reads as empty; it can be cleared', () => {
    logEvents('nothing', ev('pin'))
    expect(loadLog()).toEqual({})
    localStorage.setItem(LOG_KEY, '{not json')
    expect(loadLog()).toEqual({})
    expect(summarizeLog()).toContain('No runs recorded yet.')
    beginRun('fixture', 'Q', true)
    clearLog()
    expect(loadLog()).toEqual({})
  })

  it('says it sends nothing, and uses its own key', () => {
    beginRun('fixture', 'Q', true)
    expect(LOG_KEY).toBe('alibi_ofa_log_v1')
    expect(summarizeLog()).toContain('nothing was sent anywhere')
  })
})
