import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from '../../src/components/ErrorBoundary'
import { getAllPuzzles, looksLikePuzzle } from '../../src/core/catalog'
import { computeBadges, dailyPuzzle, loadStreak, STREAK_KEY } from '../../src/core/daily'
import { loadCaseState, loadRecords, loadSolved } from '../../src/core/progress'
import {
  CASE_STATE_KEY, FINGERPRINT_KEY, MODE_KEY, RECORDS_KEY, SOLVED_KEY, TIMER_KEY, UPPER_FLOOR_KEY,
  readObject, readStringArray,
} from '../../src/core/storage'
import { CASE_NOTES_KEY, IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY, parseCaseNotes } from '../../src/core/ux'
import { useGame } from '../../src/hooks/useGame'

const puzzles = getAllPuzzles()

// Everything in localStorage is untrusted input. None of these may throw, white-screen
// the app, or leak a value of the wrong type into game state.
const GARBAGE = ['null', '[', ']', '{', '"text"', '42', 'true', '[1,2,3]', '{"a":1}', '{"version":2}', '', 'undefined', '\u0000', '{"__proto__":{"x":1}}']
const ALL_KEYS = [
  SOLVED_KEY, RECORDS_KEY, MODE_KEY, TIMER_KEY, UPPER_FLOOR_KEY, CASE_STATE_KEY, FINGERPRINT_KEY,
  STREAK_KEY, IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY, CASE_NOTES_KEY, 'murdoku_theme', 'murdoku_seen_help',
]

describe('safe storage readers', () => {
  it('fall back to empty values for every kind of garbage', () => {
    for (const bad of GARBAGE) {
      localStorage.setItem(SOLVED_KEY, bad)
      localStorage.setItem(RECORDS_KEY, bad)
      expect(readObject(RECORDS_KEY), bad).toEqual(expect.any(Object))
      expect(Array.isArray(readObject(RECORDS_KEY))).toBe(false)
      expect(readStringArray(SOLVED_KEY).every(x => typeof x === 'string')).toBe(true)
      expect(loadSolved().every(x => typeof x === 'string')).toBe(true)
      const records = loadRecords()
      expect(records && typeof records === 'object' && !Array.isArray(records)).toBe(true)
      expect(() => loadStreak()).not.toThrow()
      expect(() => parseCaseNotes(bad)).not.toThrow()
      for (const p of puzzles.slice(0, 3)) expect(() => loadCaseState(p)).not.toThrow()
    }
  })

  it('"murdoku_records" = "null" no longer takes the badges (and the home screen) down', () => {
    localStorage.setItem(RECORDS_KEY, 'null')
    const records = loadRecords()
    expect(records).toEqual({})
    expect(() => computeBadges({ puzzles, completedIds: [puzzles[0].id], records, streak: loadStreak() })).not.toThrow()
  })

  it('a wrong-typed streak is replaced by an empty one', () => {
    for (const bad of [...GARBAGE, '{"lastSolved":5,"current":1,"best":1}', '{"lastSolved":null,"current":"x","best":1}', '{"lastSolved":"yesterday","current":1,"best":1}', '{"lastSolved":null,"current":-1,"best":1}']) {
      localStorage.setItem(STREAK_KEY, bad)
      expect(loadStreak(), bad).toEqual({ lastSolved: null, current: 0, best: 0 })
    }
  })
})

describe('useGame with a corrupted store', () => {
  for (const bad of GARBAGE) {
    it(`starts, plays and survives every key holding ${JSON.stringify(bad)}`, () => {
      for (const key of ALL_KEYS) localStorage.setItem(key, bad)
      const { result } = renderHook(() => useGame())
      expect(result.current.completedIds).toEqual([])
      expect(result.current.mode === 'classic' || result.current.mode === 'detective').toBe(true)
      act(() => result.current.start('very-easy-1', 'classic'))
      expect(result.current.screen).toBe('game')
      expect(result.current.hintsLeft).toBe(3)
      expect(result.current.accusationsLeft).toBe(3)
      act(() => result.current.clickCell(0, 0))
      act(() => result.current.hint())
      act(() => result.current.submit())
      expect(typeof result.current.timer).toBe('string')
      expect(() => result.current.records).not.toThrow()
    })
  }

  it('ignores a half-finished board that does not fit the case (wrong size, stranger, repeated suspect)', () => {
    const p = puzzles.find(x => x.id === 'very-easy-1')!
    const row = (n: number) => Array.from({ length: n }, () => ({ kind: 'empty' }))
    const base = { id: p.id, mode: 'classic', elapsed: 12, hints: 3, selected: null }
    const variants = [
      { ...base, marks: [] },
      { ...base, marks: Array.from({ length: p.size - 1 }, () => row(p.size)) },
      { ...base, marks: Array.from({ length: p.size }, () => row(p.size).map(() => ({ kind: 'person', person: 'nobody' }))) },
      { ...base, marks: Array.from({ length: p.size }, () => row(p.size).map(() => ({ kind: 'person', person: 'p0' }))) },
      { ...base, marks: Array.from({ length: p.size }, () => row(p.size).map(() => 7)) },
      { ...base, marks: Array.from({ length: p.size }, () => row(p.size)), fp: 'not-this-puzzle' },
    ]
    for (const v of variants) {
      localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(v))
      const { result } = renderHook(() => useGame())
      act(() => result.current.start(p.id, 'classic'))
      expect(result.current.marks).toHaveLength(p.size)
      expect(result.current.marks.every(r => r.length === p.size && r.every(m => m.kind === 'empty'))).toBe(true)
    }
  })

  it('ignores a corrupt upper-floor save on a two-storey case', () => {
    const p = puzzles.find(x => (x.floors ?? 1) === 2)!
    const blank = Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' })))
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ id: p.id, mode: 'classic', marks: blank, elapsed: 3, hints: 3, selected: null }))
    for (const bad of ['[1]', '{"id":"x"}', JSON.stringify({ id: p.id, marks: [[{ kind: 'nope' }]] }), JSON.stringify({ id: p.id, marks: 5 })]) {
      localStorage.setItem(UPPER_FLOOR_KEY, bad)
      const { result } = renderHook(() => useGame())
      act(() => result.current.start(p.id, 'classic'))
      expect(result.current.marksPerFloor).toHaveLength(2)
      act(() => result.current.switchFloor(1))
      expect(result.current.marks).toHaveLength(p.size)
    }
  })

  it('a stale saved board for a case whose content changed is dropped on load', () => {
    const p = puzzles.find(x => x.id === 'hard-9')!
    const marks = Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' })))
    marks[0][0] = { kind: 'person', person: 'p0' } as never
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ id: p.id, mode: 'classic', marks, elapsed: 30, hints: 1, selected: null, fp: 'from-an-older-catalog' }))
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(p.id, 'classic'))
    expect(result.current.placedOf).toEqual({})
    expect(result.current.hintsLeft).toBe(3)
  })
})

describe('the app with a corrupted store', () => {
  // jsdom has no matchMedia; the theme hook needs one.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => undefined, removeEventListener: () => undefined,
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false,
    }),
  })

  async function freshApp() {
    // A fresh module graph (so the catalog is re-read from storage), fed a valid cache so it is instant.
    vi.resetModules()
    const cache = JSON.stringify(puzzles)
    const { default: App } = await import('../../src/App')
    return { App, cache }
  }

  it('renders the home screen with murdoku_records = "null" and every other key garbage', async () => {
    const { App, cache } = await freshApp()
    for (const key of ALL_KEYS) localStorage.setItem(key, 'null')
    localStorage.setItem('murdoku_catalog_v26', cache)
    render(<App />)
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(await screen.findAllByText(/case/i, {}, { timeout: 10000 })).not.toHaveLength(0)
    expect(screen.queryByText(/would not open/i)).toBeNull()
  }, 30000)

  it('rebuilds instead of bricking when the cached catalog is unreadable or the wrong shape', async () => {
    for (const bad of ['[', 'null', '{}', '[{"id":"x"}]', '[null]', '"x"']) {
      localStorage.setItem('murdoku_catalog_v26', bad)
      vi.resetModules()
      const fresh = await import('../../src/core/catalog')
      // a cheap probe of the same code path: the cache is rejected and removed before any rebuild would start
      expect(() => fresh.initCatalogAsync().then(() => undefined)).not.toThrow()
      await Promise.resolve()
      expect(localStorage.getItem('murdoku_catalog_v26') === bad).toBe(false)
    }
  }, 30000)

  it('recognises a well-formed puzzle and rejects mangled ones', () => {
    for (const p of puzzles) expect(looksLikePuzzle(p), p.id).toBe(true)
    const p = puzzles[0]
    const broken: unknown[] = [
      null, 7, 'x', [], {},
      { ...p, id: '' }, { ...p, size: 99 }, { ...p, roomOf: [] }, { ...p, rooms: 'x' }, { ...p, people: [] },
      { ...p, clues: [{ text: 1 }] }, { ...p, solution: null }, { ...p, solution: {} },
      { ...p, roomOfByFloor: [[]] },
    ]
    for (const b of broken) expect(looksLikePuzzle(b), JSON.stringify(b)?.slice(0, 40)).toBe(false)
  })
})

describe('ErrorBoundary', () => {
  function Boom(): never { throw new Error('render exploded') }

  it('replaces a crashed tree with a way out instead of a white page', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('renders children untouched when nothing is wrong', () => {
    render(<ErrorBoundary><p>all fine</p></ErrorBoundary>)
    expect(screen.getByText('all fine')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('"Try again" renders the children again once they stop throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let explode = true
    function Flaky() { if (explode) throw new Error('once'); return <p>recovered</p> }
    render(<ErrorBoundary><Flaky /></ErrorBoundary>)
    explode = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('recovered')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('"Clear saved data" wipes this game\'s keys (and only its keys) and reloads', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.setItem(RECORDS_KEY, '{"a":1}')
    localStorage.setItem('murdoku_catalog_v26', '[]')
    localStorage.setItem('someone_elses_key', 'keep')
    const onReload = vi.fn()
    render(<ErrorBoundary onReload={onReload}><Boom /></ErrorBoundary>)
    fireEvent.click(screen.getByRole('button', { name: /clear saved data/i }))
    expect(localStorage.getItem(RECORDS_KEY)).toBeNull()
    expect(localStorage.getItem('murdoku_catalog_v26')).toBeNull()
    expect(localStorage.getItem('someone_elses_key')).toBe('keep')
    expect(onReload).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('wraps the whole app: a render error inside App shows the boundary', async () => {
    // dailyPuzzle is called while rendering the home screen; make it throw for one render pass.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.resetModules()
    vi.doMock('../../src/hooks/useGame', () => ({ useGame: () => { throw new Error('boom in the hook') } }))
    const { default: App } = await import('../../src/App')
    render(<App />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    vi.doUnmock('../../src/hooks/useGame')
    spy.mockRestore()
    void dailyPuzzle
  })
})
