import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../src/core/catalog'
import { UPPER_FLOOR_KEY } from '../src/core/storage'
import { IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY } from '../src/core/ux'
import type { Puzzle } from '../src/core/types'
import { useGame } from '../src/hooks/useGame'

// R3.1 gate: the autosave holds one in-progress attempt. Opening a DIFFERENT case
// left its board empty, and the autosave effect then cleared the slot wholesale,
// silently deleting the other case's saved progress. A case may only clear its
// own save (or a slot nobody can read).

type Hook = ReturnType<typeof renderHook<ReturnType<typeof useGame>, unknown>>
const byId = (id: string) => getAllPuzzles().find(p => p.id === id)!
const A = byId('hard-9')       // two-storey: the save spans the main and the upper-storey key
const B = byId('very-easy-1')
const savedId = (key: string) => (JSON.parse(localStorage.getItem(key) ?? 'null') as { id?: string } | null)?.id
const placedCount = (h: Hook) => Object.keys(h.result.current.placedOf).length

function place(h: Hook, p: Puzzle, cells: Puzzle['solution'], ids: string[]) {
  for (const id of ids) {
    const at = cells[id]
    act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
    act(() => h.result.current.selectPerson(id))
    act(() => h.result.current.clickCell(at.row, at.col))
  }
}
/** A half-solved A with someone on each storey, autosaved. */
function halfSolveA(): Hook {
  const h = renderHook(() => useGame())
  act(() => h.result.current.start(A.id, 'classic'))
  const ground = A.people.find(x => (A.solution[x.id].floor ?? 0) === 0)!
  const upper = A.people.find(x => (A.solution[x.id].floor ?? 0) === 1)!
  place(h, A, A.solution, [ground.id, upper.id])
  expect(savedId(IN_PROGRESS_KEY)).toBe(A.id)
  expect(savedId(UPPER_FLOOR_KEY)).toBe(A.id)
  return h
}
function expectASaved() {
  expect(savedId(IN_PROGRESS_KEY)).toBe(A.id)
  expect(savedId(LEGACY_IN_PROGRESS_KEY)).toBe(A.id)
  expect(savedId(UPPER_FLOOR_KEY)).toBe(A.id)
}

describe('autosave: another case never deletes this one', () => {
  it('opening a different case with an empty board keeps the saved attempt', () => {
    const h = halfSolveA()
    act(() => h.result.current.start(B.id, 'classic'))
    expect(placedCount(h)).toBe(0)
    expectASaved()
  })

  it('tools on the empty different case (Clear, Undo, failed Accuse) keep it too', () => {
    const h = halfSolveA()
    act(() => h.result.current.start(B.id, 'classic'))
    act(() => h.result.current.clearAll())
    act(() => h.result.current.undo())
    act(() => h.result.current.submit())
    expect(h.result.current.feedback).toBe('incomplete')
    expectASaved()
  })

  it('the attempt resumes on both storeys, in the same session and after a reload', () => {
    const h = halfSolveA()
    act(() => h.result.current.start(B.id, 'classic'))
    act(() => h.result.current.start(A.id, 'classic'))
    expect(placedCount(h)).toBe(2)
    h.unmount()
    const reloaded = renderHook(() => useGame())
    act(() => reloaded.result.current.start(B.id, 'classic'))
    act(() => reloaded.result.current.start(A.id, 'classic'))
    expect(placedCount(reloaded)).toBe(2)
    expect(new Set(Object.values(reloaded.result.current.placedOf).map(x => x.floor))).toEqual(new Set([0, 1]))
  })

  it('an upper-storey save left by another case is not deleted by an empty case', () => {
    halfSolveA().unmount()
    localStorage.removeItem(IN_PROGRESS_KEY)
    localStorage.removeItem(LEGACY_IN_PROGRESS_KEY)
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    expect(savedId(UPPER_FLOOR_KEY)).toBe(A.id)
  })
})

describe('autosave: closing a case only drops its own save (each call site passes its id)', () => {
  // In one tab the slot already belongs to B by the time B can close, so another
  // case's save is written here directly, as a second tab would.
  const otherSave = () => {
    const h = halfSolveA()
    const saved = [IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY, UPPER_FLOOR_KEY].map(k => [k, localStorage.getItem(k)!] as const)
    h.unmount()
    return () => saved.forEach(([k, v]) => localStorage.setItem(k, v))
  }
  const [a, b] = B.people.filter(x => x.id !== B.victimId)
  const bad = { ...B.solution, [a.id]: B.solution[b.id], [b.id]: B.solution[a.id] }

  it('win', () => {
    const writeA = otherSave()
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    place(h, B, B.solution, B.people.map(x => x.id))
    writeA()
    act(() => h.result.current.submit())
    expect(h.result.current.completed).toBe(true)
    expectASaved()
  })

  it('Start over and Reveal', () => {
    const writeA = otherSave()
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    place(h, B, bad, B.people.map(x => x.id))
    for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
    writeA()
    act(() => h.result.current.startOver())
    expectASaved()
    place(h, B, bad, B.people.map(x => x.id))
    for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
    writeA()
    act(() => h.result.current.reveal())
    expect(h.result.current.revealed).toBe(true)
    expectASaved()
  })

  it('a legacy save keyed by puzzleId, and a slot split across two cases', () => {
    localStorage.setItem(LEGACY_IN_PROGRESS_KEY, JSON.stringify({ puzzleId: A.id, mode: 'classic', marks: [] }))
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ id: B.id, mode: 'classic', marks: [] }))
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
    expect((JSON.parse(localStorage.getItem(LEGACY_IN_PROGRESS_KEY)!) as { puzzleId: string }).puzzleId).toBe(A.id)
  })
})

describe('autosave: a case still manages its own save', () => {
  it('clearing the board removes that case\'s own save, both storeys', () => {
    const h = halfSolveA()
    act(() => h.result.current.clearAll())
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_IN_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(UPPER_FLOOR_KEY)).toBeNull()
  })

  it('solving a case drops its own save, and replay starts empty', () => {
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    place(h, B, B.solution, B.people.map(x => x.id))
    expect(savedId(IN_PROGRESS_KEY)).toBe(B.id)
    act(() => h.result.current.submit())
    expect(h.result.current.completed).toBe(true)
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
    act(() => h.result.current.start(B.id, 'classic'))
    expect(placedCount(h)).toBe(0)
  })

  it('Start over and Reveal drop the case\'s own save', () => {
    const [a, b] = B.people.filter(x => x.id !== B.victimId)
    const bad = { ...B.solution, [a.id]: B.solution[b.id], [b.id]: B.solution[a.id] }
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(B.id, 'classic'))
    place(h, B, bad, B.people.map(x => x.id))
    for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
    act(() => h.result.current.startOver())
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
    place(h, B, bad, B.people.map(x => x.id))
    expect(savedId(IN_PROGRESS_KEY)).toBe(B.id)
    for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
    act(() => h.result.current.reveal())
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
  })
})

describe('autosave: corrupted slots', () => {
  for (const [label, raw] of [['not JSON', '{oops'], ['JSON null', 'null'], ['an array', '[]'], ['no id', '{"mode":"classic"}']] as const) {
    it(`${label}: opening a case recovers and the unreadable slot is cleaned up`, () => {
      localStorage.setItem(IN_PROGRESS_KEY, raw)
      localStorage.setItem(LEGACY_IN_PROGRESS_KEY, raw)
      const h = renderHook(() => useGame())
      act(() => h.result.current.start(B.id, 'classic'))
      expect(placedCount(h)).toBe(0)
      expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
      expect(localStorage.getItem(LEGACY_IN_PROGRESS_KEY)).toBeNull()
      place(h, B, B.solution, [B.people[0].id])
      expect(savedId(IN_PROGRESS_KEY)).toBe(B.id)
    })
  }
})
