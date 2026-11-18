import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAllPuzzles } from '../src/core/catalog'
import { puzzleFingerprint } from '../src/core/progress'
import { UPPER_FLOOR_KEY } from '../src/core/storage'
import type { CellMark, GameMode, Puzzle } from '../src/core/types'
import { IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY } from '../src/core/ux'
import { useGame } from '../src/hooks/useGame'

// R3.2 gate: every case keeps its own progress. The autosave used to be one slot
// shared by all cases and modes, so starting work on another case (or the same
// case in the other mode) overwrote the attempt you meant to come back to, and
// the home Continue strip counted only the ground floor.
// Behavioural only (hook + storage), so the same file runs on the old code.

type Hook = ReturnType<typeof renderHook<ReturnType<typeof useGame>, unknown>>
const byId = (id: string) => getAllPuzzles().find(p => p.id === id)!
const A = byId('hard-9')        // two-storey
const B = byId('very-easy-1')
const C = byId('medium-2')
const onFloor = (p: Puzzle, f: number) => p.people.filter(x => (p.solution[x.id].floor ?? 0) === f)

function place(h: Hook, p: Puzzle, ids: string[]) {
  for (const id of ids) {
    const at = p.solution[id]
    act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
    act(() => h.result.current.selectPerson(id))
    act(() => h.result.current.clickCell(at.row, at.col))
  }
}
const open = (h: Hook, p: Puzzle, mode: GameMode = 'classic') => act(() => h.result.current.start(p.id, mode))
const placed = (h: Hook) => Object.keys(h.result.current.placedOf).sort()
const fresh = () => renderHook(() => useGame())
/** The home summary needs the catalog the hook loads asynchronously. */
const ready = (h: Hook) => waitFor(() => expect(h.result.current.puzzles.length).toBe(60))
/** A half-solved A: one suspect on each storey. */
const aIds = [onFloor(A, 0)[0].id, onFloor(A, 1)[0].id]
const bIds = [B.people[0].id, B.people[1].id]

afterEach(() => vi.restoreAllMocks())

describe('switching cases keeps each case\'s progress', () => {
  it('work on B does not overwrite A; both resume, both storeys, after a reload too', () => {
    const h = fresh()
    open(h, A); place(h, A, aIds)
    open(h, B); place(h, B, bIds)
    open(h, A)
    expect(placed(h)).toEqual([...aIds].sort())
    expect(new Set(Object.values(h.result.current.placedOf).map(x => x.floor))).toEqual(new Set([0, 1]))
    open(h, B)
    expect(placed(h)).toEqual([...bIds].sort())
    h.unmount()
    const r = fresh()
    open(r, A); expect(placed(r)).toEqual([...aIds].sort())
    open(r, B); expect(placed(r)).toEqual([...bIds].sort())
  })

  it('the same case in the other mode is its own attempt', () => {
    const h = fresh()
    open(h, A, 'detective'); place(h, A, aIds)
    open(h, A, 'classic')
    expect(placed(h)).toEqual([])
    place(h, A, [aIds[0]])
    open(h, A, 'detective')
    expect(placed(h)).toEqual([...aIds].sort())
    open(h, A, 'classic')
    expect(placed(h)).toEqual([aIds[0]])
  })

  it('winning, Start over and Reveal on B leave A alone; Clear and Undo touch only the open case', () => {
    const h = fresh()
    open(h, A); place(h, A, aIds)
    open(h, B); place(h, B, B.people.map(x => x.id)); act(() => h.result.current.submit())
    expect(h.result.current.completed).toBe(true)
    open(h, C)
    const [a, b] = C.people.filter(x => x.id !== C.victimId)
    const bad = { ...C.solution, [a.id]: C.solution[b.id], [b.id]: C.solution[a.id] }
    for (const person of C.people) {
      act(() => h.result.current.selectPerson(person.id))
      act(() => h.result.current.clickCell(bad[person.id].row, bad[person.id].col))
    }
    for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
    act(() => h.result.current.startOver())
    act(() => h.result.current.selectPerson(C.people[0].id))
    act(() => h.result.current.clickCell(C.solution[C.people[0].id].row, C.solution[C.people[0].id].col))
    act(() => h.result.current.undo())
    open(h, B); place(h, B, [bIds[0]]); act(() => h.result.current.clearAll())
    open(h, A)
    expect(placed(h)).toEqual([...aIds].sort())
  })

  it('a solved case replays from an empty board', () => {
    const h = fresh()
    open(h, B); place(h, B, B.people.map(x => x.id)); act(() => h.result.current.submit())
    open(h, B)
    expect(placed(h)).toEqual([])
  })
})

describe('home Continue strip', () => {
  it('counts placements on both storeys', async () => {
    const h = fresh(); await ready(h)
    open(h, A); place(h, A, aIds)
    expect(h.result.current.inProgress?.id).toBe(A.id)
    expect(h.result.current.inProgress?.placedCount).toBe(2)
  })

  it('offers the most recently played attempt, with its mode', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    const h = fresh(); await ready(h)
    open(h, A, 'detective'); place(h, A, aIds)
    vi.spyOn(Date, 'now').mockReturnValue(2_000)
    open(h, B); place(h, B, bIds)
    expect(h.result.current.inProgress).toMatchObject({ id: B.id, mode: 'classic', placedCount: 2 })
    vi.spyOn(Date, 'now').mockReturnValue(3_000)
    open(h, A, 'detective'); place(h, A, [onFloor(A, 0)[1].id])
    expect(h.result.current.inProgress).toMatchObject({ id: A.id, mode: 'detective', placedCount: 3 })
  })

  it('falls back to the next attempt when the newest one is finished', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    const h = fresh(); await ready(h)
    open(h, A); place(h, A, aIds)
    vi.spyOn(Date, 'now').mockReturnValue(2_000)
    open(h, B); place(h, B, B.people.map(x => x.id)); act(() => h.result.current.submit())
    act(() => h.result.current.navigate('home'))
    expect(h.result.current.inProgress).toMatchObject({ id: A.id, placedCount: 2 })
  })
})

// --- saves written by the previous single-slot implementation --------------
function legacyGrid(p: Puzzle, ids: string[], floor: number): CellMark[][] {
  const g: CellMark[][] = Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' as const })))
  for (const id of ids) {
    const at = p.solution[id]
    if ((at.floor ?? 0) === floor) g[at.row][at.col] = { kind: 'person', person: id }
  }
  return g
}
function writeLegacy(key: string, p: Puzzle, ids: string[], mode: GameMode, idField: 'id' | 'puzzleId' = 'id') {
  localStorage.setItem(key, JSON.stringify({ [idField]: p.id, mode, marks: legacyGrid(p, ids, 0), elapsed: 7, hints: 3, selected: null, fp: puzzleFingerprint(p) }))
}

describe('migration from the single-slot save', () => {
  it('an old two-storey attempt resumes with its upstairs marks, and survives later work elsewhere', async () => {
    writeLegacy(IN_PROGRESS_KEY, A, aIds, 'classic')
    writeLegacy(LEGACY_IN_PROGRESS_KEY, A, aIds, 'classic')
    localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: A.id, marks: legacyGrid(A, aIds, 1) }))
    const h = fresh(); await ready(h)
    expect(h.result.current.inProgress).toMatchObject({ id: A.id, placedCount: 2 })
    open(h, A)
    expect(placed(h)).toEqual([...aIds].sort())
    open(h, B); place(h, B, bIds)
    open(h, A)
    expect(placed(h)).toEqual([...aIds].sort())
  })

  it('a legacy entry keyed by puzzleId is imported', () => {
    writeLegacy(LEGACY_IN_PROGRESS_KEY, B, bIds, 'classic', 'puzzleId')
    const h = fresh()
    open(h, B)
    expect(placed(h)).toEqual([...bIds].sort())
  })

  it('duplicate legacy entries for two cases are both kept', () => {
    writeLegacy(IN_PROGRESS_KEY, B, bIds, 'classic')
    writeLegacy(LEGACY_IN_PROGRESS_KEY, C, [C.people[0].id], 'detective')
    const h = fresh()
    open(h, C, 'detective'); expect(placed(h)).toEqual([C.people[0].id])
    open(h, B); expect(placed(h)).toEqual([...bIds].sort())
  })

  it('an upstairs entry for a different case is not attached', () => {
    writeLegacy(IN_PROGRESS_KEY, A, [aIds[0]], 'classic')
    localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: 'hard-1', marks: legacyGrid(A, aIds, 1) }))
    const h = fresh()
    open(h, A)
    expect(placed(h)).toEqual([aIds[0]])
  })

  it('a legacy attempt made on different case content is not imported', () => {
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ id: B.id, mode: 'classic', marks: legacyGrid(B, bIds, 0), elapsed: 1, hints: 3, selected: null, fp: 'stale' }))
    const h = fresh()
    open(h, B)
    expect(placed(h)).toEqual([])
  })
})

describe('two tabs (two game instances on one storage)', () => {
  it('interleaved work on different cases keeps both', () => {
    const t1 = fresh(), t2 = fresh()
    open(t1, A); open(t2, B)
    place(t1, A, [aIds[0]]); place(t2, B, [bIds[0]]); place(t1, A, [aIds[1]]); place(t2, B, [bIds[1]])
    const r = fresh()
    open(r, A); expect(placed(r)).toEqual([...aIds].sort())
    open(r, B); expect(placed(r)).toEqual([...bIds].sort())
  })

  it('the same case and mode in two tabs: the last write wins (no live sync)', () => {
    const t1 = fresh(), t2 = fresh()
    open(t1, B); open(t2, B)
    place(t1, B, [bIds[0]])
    place(t2, B, [bIds[1]])
    const r = fresh()
    open(r, B)
    expect(placed(r)).toEqual([bIds[1]])
  })
})

describe('storage failures', () => {
  it('a full store is reported, never claimed as saved, and play goes on', () => {
    const real = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith('murdoku_save_v2:')) throw new DOMException('full', 'QuotaExceededError')
      return real.call(this, k, v)
    })
    const h = fresh()
    open(h, B); place(h, B, [bIds[0]])
    expect(placed(h)).toEqual([bIds[0]])
    expect(h.result.current.saveFailed).toBe(true)
    vi.restoreAllMocks()
    place(h, B, [bIds[1]])
    expect(h.result.current.saveFailed).toBe(false)
  })

  it('storage that throws on every call does not break play', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    const h = fresh()
    open(h, B); place(h, B, [bIds[0]])
    expect(placed(h)).toEqual([bIds[0]])
    expect(h.result.current.saveFailed).toBe(true)
  })
})

describe('no resurrection: a closed attempt stays closed after a reload', () => {
  // The attempt at A started life as a previous-format save (the mirror), so the
  // mirror is the one place an ended attempt could come back from.
  const seedOldA = () => {
    writeLegacy(IN_PROGRESS_KEY, A, aIds, 'classic')
    writeLegacy(LEGACY_IN_PROGRESS_KEY, A, aIds, 'classic')
    localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: A.id, marks: legacyGrid(A, aIds, 1) }))
  }
  const keepB = (h: Hook) => { open(h, B, 'detective'); place(h, B, bIds) }
  const reloadAndCheck = () => {
    const r = fresh()
    open(r, A); expect(placed(r)).toEqual([])
    open(r, B, 'detective'); expect(placed(r)).toEqual([...bIds].sort())
  }
  const ends: Record<string, (h: Hook) => void> = {
    Clear: h => act(() => h.result.current.clearAll()),
    'Undo back to empty': h => {
      act(() => h.result.current.clearAll())
      place(h, A, [aIds[0]])
      act(() => h.result.current.undo())
    },
    Win: h => { place(h, A, A.people.map(x => x.id).filter(id => !h.result.current.placedOf[id])); act(() => h.result.current.submit()); expect(h.result.current.completed).toBe(true) },
    'Start over': h => {
      const [a, b] = A.people.filter(x => x.id !== A.victimId)
      // swap two suspects to make three wrong accusations possible
      const bad = { ...A.solution, [a.id]: A.solution[b.id], [b.id]: A.solution[a.id] }
      act(() => h.result.current.clearAll())
      for (const person of A.people) {
        const at = bad[person.id]
        act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
        act(() => h.result.current.selectPerson(person.id))
        act(() => h.result.current.clickCell(at.row, at.col))
      }
      for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
      act(() => h.result.current.startOver())
    },
    Reveal: h => {
      const [a, b] = A.people.filter(x => x.id !== A.victimId)
      const bad = { ...A.solution, [a.id]: A.solution[b.id], [b.id]: A.solution[a.id] }
      act(() => h.result.current.clearAll())
      for (const person of A.people) {
        const at = bad[person.id]
        act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
        act(() => h.result.current.selectPerson(person.id))
        act(() => h.result.current.clickCell(at.row, at.col))
      }
      for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
      act(() => h.result.current.reveal())
    },
  }

  for (const [name, end] of Object.entries(ends)) {
    it(`${name} on a migrated attempt: gone after reload, other attempts intact`, () => {
      seedOldA()
      const h = fresh()
      keepB(h)
      open(h, A)
      expect(placed(h)).toEqual([...aIds].sort())
      end(h)
      h.unmount()
      reloadAndCheck()
    })

    it(`${name} while the mirror still holds the old copy: gone after reload`, () => {
      seedOldA()
      const h = fresh()
      open(h, A)                       // imported; the mirror still holds the old copy
      end(h)
      h.unmount()
      const r = fresh()
      open(r, A); expect(placed(r)).toEqual([])
    })
  }

  it('a cleared attempt is not resurrected by the Continue strip either', async () => {
    seedOldA()
    const h = fresh(); await ready(h)
    open(h, A); act(() => h.result.current.clearAll())
    act(() => h.result.current.navigate('home'))
    expect(h.result.current.inProgress).toBeNull()
  })
})

describe('migration, repeated use', () => {
  it('switching between cases and modes many times keeps every attempt exactly', () => {
    const h = fresh()
    const plan: [Puzzle, GameMode, string[]][] = [[A, 'classic', aIds], [A, 'detective', [aIds[0]]], [B, 'classic', bIds], [B, 'detective', [bIds[1]]], [C, 'classic', [C.people[2].id]]]
    for (const [p, m, ids] of plan) { open(h, p, m); place(h, p, ids) }
    for (let round = 0; round < 3; round++) {
      for (const [p, m, ids] of [...plan].reverse()) { open(h, p, m); expect(placed(h)).toEqual([...ids].sort()) }
    }
    h.unmount()
    const r = fresh()
    for (const [p, m, ids] of plan) { open(r, p, m); expect(placed(r)).toEqual([...ids].sort()) }
  })

  it('malformed per-case records are ignored, never crash, and are replaced by the next save', () => {
    for (const raw of ['{oops', 'null', '[]', '{"v":2}', JSON.stringify({ v: 2, id: B.id, mode: 'classic', fp: puzzleFingerprint(B), floors: [[['bad']]] })]) {
      localStorage.setItem(`murdoku_save_v2:${B.id}:classic`, raw)
      const h = fresh()
      open(h, B); expect(placed(h)).toEqual([])
      place(h, B, [bIds[0]])
      h.unmount()
      const r = fresh(); open(r, B); expect(placed(r)).toEqual([bIds[0]])
      r.unmount(); localStorage.clear()
    }
  })

  it('a per-case record on stale content is not resumed', () => {
    const h = fresh(); open(h, B); place(h, B, bIds); h.unmount()
    const key = `murdoku_save_v2:${B.id}:classic`
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), fp: 'stale' }))
    localStorage.removeItem(IN_PROGRESS_KEY); localStorage.removeItem(LEGACY_IN_PROGRESS_KEY)
    const r = fresh(); open(r, B); expect(placed(r)).toEqual([])
  })

  it('a person duplicated across storeys in an old save drops the upstairs grid, keeps the ground floor', () => {
    writeLegacy(IN_PROGRESS_KEY, A, [aIds[0]], 'classic')
    const upper = legacyGrid(A, [], 1)
    upper[0][0] = { kind: 'person', person: aIds[0] }
    localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: A.id, marks: upper }))
    const h = fresh(); open(h, A)
    expect(h.result.current.placedOf[aIds[0]].floor).toBe(0)
  })
})

describe('review follow-ups: quota, old builds, old loader', () => {
  const failFor = (prefix: string) => {
    const real = Storage.prototype.setItem
    return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith(prefix)) throw new DOMException('full', 'QuotaExceededError')
      return real.call(this, k, v)
    })
  }

  it('a per-case write that failed is recovered from the mirror after a reload', () => {
    const spy = failFor('murdoku_save_v2:')
    const h = fresh(); open(h, B); place(h, B, bIds)
    expect(h.result.current.saveFailed).toBe(true)
    h.unmount(); spy.mockRestore()
    const r = fresh(); open(r, B)
    expect(placed(r)).toEqual([...bIds].sort())
  })

  it('an attempt held only by the mirror is not overwritten by another case while it cannot be stored', () => {
    const spy = failFor(`murdoku_save_v2:${A.id}:`)
    const h = fresh(); open(h, A); place(h, A, aIds)
    open(h, B); place(h, B, bIds)                 // B saves fine; A is still only in the mirror
    h.unmount(); spy.mockRestore()
    const r = fresh()
    open(r, A); expect(placed(r)).toEqual([...aIds].sort())
    open(r, B); expect(placed(r)).toEqual([...bIds].sort())
  })

  it('a board a previous-format build saved after this build wins, once, and is then stamped', () => {
    const h = fresh(); open(h, A); place(h, A, aIds); h.unmount()
    // an old tab plays on: rewrites the single slot without savedAt
    writeLegacy(IN_PROGRESS_KEY, A, [aIds[0]], 'classic')
    writeLegacy(LEGACY_IN_PROGRESS_KEY, A, [aIds[0]], 'classic')
    localStorage.removeItem(UPPER_FLOOR_KEY)
    const r = fresh(); open(r, A)
    expect(placed(r)).toEqual([aIds[0]])
    expect(typeof (JSON.parse(localStorage.getItem(IN_PROGRESS_KEY)!) as { savedAt?: unknown }).savedAt).toBe('number')
    place(r, A, [aIds[1]]); r.unmount()
    const again = fresh(); open(again, A)
    expect(placed(again)).toEqual([...aIds].sort())   // the newer board, not the imported one again
  })

  it('clearing case X while the mirror holds case Y leaves Y and its upstairs key', () => {
    // In one tab, reopening X resumes it and the mirror follows; a second tab is what leaves it on Y.
    const tabX = fresh(); open(tabX, B); place(tabX, B, bIds)
    const tabY = fresh(); open(tabY, A); place(tabY, A, aIds)   // mirror (and upper key) now hold A
    act(() => tabX.result.current.clearAll())
    expect((JSON.parse(localStorage.getItem(IN_PROGRESS_KEY)!) as { id: string }).id).toBe(A.id)
    expect((JSON.parse(localStorage.getItem(UPPER_FLOOR_KEY)!) as { id: string }).id).toBe(A.id)
    tabX.unmount(); tabY.unmount()
    const r = fresh(); open(r, A); expect(placed(r)).toEqual([...aIds].sort())
  })

  it('the mirror this build writes is read by the unchanged previous-format loader (parseInProgress, parseMarksGrid)', async () => {
    const { parseInProgress, parseMarksGrid } = await import('../src/core/ux')
    const h = fresh(); open(h, A, 'detective'); place(h, A, aIds)
    const main = JSON.parse(localStorage.getItem(IN_PROGRESS_KEY)!)
    expect(localStorage.getItem(LEGACY_IN_PROGRESS_KEY)).toBe(localStorage.getItem(IN_PROGRESS_KEY))
    expect(parseInProgress(main, [A])).toMatchObject({ id: A.id, mode: 'detective', placedCount: 1 })
    expect(main.fp).toBe(puzzleFingerprint(A))
    const upper = JSON.parse(localStorage.getItem(UPPER_FLOOR_KEY)!)
    expect(upper.id).toBe(A.id)
    const grid = parseMarksGrid(upper.marks, A.size, new Set(A.people.map(x => x.id)))
    expect(grid?.flat().filter(m => m.kind === 'person')).toHaveLength(1)
  })
})
