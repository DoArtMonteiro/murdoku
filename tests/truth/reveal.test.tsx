import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { computeBadges, loadStreak, STREAK_KEY } from '../../src/core/daily'
import { loadCaseState, puzzleFingerprint, saveCaseState } from '../../src/core/progress'
import { CASE_STATE_KEY, RECORDS_KEY, SOLVED_KEY } from '../../src/core/storage'
import { useGame } from '../../src/hooks/useGame'

// Gate finding B1: Reveal -> reload -> Start over -> place the shown solution was
// counted as a normal solve (tick, best time 6 s, 0 hints). Revealing is now sticky
// for the content it was done on.

const p = getAllPuzzles().find(x => x.id === 'very-easy-1')!

type Hook = ReturnType<typeof renderHook<ReturnType<typeof useGame>, unknown>>
function placeAll(h: Hook, cells: Record<string, { row: number; col: number; floor?: number }>) {
  for (const person of p.people) {
    const c = cells[person.id]
    const here = h.result.current.marksPerFloor[c.floor ?? 0][c.row][c.col]
    if (here.kind === 'person' && here.person === person.id) continue
    act(() => h.result.current.selectPerson(person.id))
    act(() => h.result.current.clickCell(c.row, c.col))
  }
}
const wrong = (() => {
  const [a, b] = p.people.filter(x => x.id !== p.victimId)
  return { ...p.solution, [a.id]: p.solution[b.id], [b.id]: p.solution[a.id] }
})()

describe('a revealed case never counts as solved (gate B1)', () => {
  it('Reveal -> reload -> Start over -> place the shown solution -> Accuse earns nothing', () => {
    const first = renderHook(() => useGame())
    act(() => first.result.current.start(p.id, 'classic'))
    placeAll(first, wrong)
    for (let i = 0; i < 3; i++) act(() => first.result.current.submit())
    expect(first.result.current.feedback).toBe('cold')
    act(() => first.result.current.reveal())
    expect(first.result.current.revealed).toBe(true)
    expect(first.result.current.completed).toBe(true)
    first.unmount()

    // "reload": a fresh hook instance reading only what is in storage
    const again = renderHook(() => useGame())
    act(() => again.result.current.start(p.id, 'classic'))
    expect(again.result.current.revealed).toBe(true)          // sticky
    expect(again.result.current.feedback).toBe('cold')        // budget still spent
    act(() => again.result.current.hint())
    expect(again.result.current.hintsLeft).toBe(3)             // no hints while cold
    act(() => again.result.current.startOver())
    expect(again.result.current.attempts).toBe(1)
    expect(again.result.current.revealed).toBe(true)
    act(() => again.result.current.hint())
    expect(again.result.current.hintsLeft).toBe(3)             // nor on a revealed case
    placeAll(again, p.solution)
    act(() => again.result.current.submit())

    const s = again.result.current
    expect(s.completed).toBe(true)
    expect(s.screen).toBe('game')                              // never the "Case closed" victory screen
    expect(s.revealed).toBe(true)
    expect(s.completedIds).toEqual([])
    expect(localStorage.getItem(SOLVED_KEY)).toBeNull()
    expect(localStorage.getItem(RECORDS_KEY)).toBeNull()
    expect(localStorage.getItem(STREAK_KEY)).toBeNull()
    expect(loadStreak().current).toBe(0)
    expect(s.records).toEqual({})
    const badges = computeBadges({ puzzles: getAllPuzzles(), completedIds: s.completedIds, records: s.records, streak: s.streak })
    expect(badges.every(b => !b.earned)).toBe(true)
    // and it stays revealed on the next visit
    expect(loadCaseState(p).revealed).toBe(true)
    expect(loadCaseState(p).attempts).toBe(1)
  })

  it('a different, never-revealed case is unaffected and still counts', () => {
    const q = getAllPuzzles().find(x => x.id === 'very-easy-3')!
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(q.id, 'classic'))
    expect(h.result.current.revealed).toBe(false)
    for (const person of q.people) {
      const c = q.solution[person.id]
      act(() => h.result.current.selectPerson(person.id))
      act(() => h.result.current.clickCell(c.row, c.col))
    }
    act(() => h.result.current.submit())
    expect(h.result.current.screen).toBe('victory')
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toContain(q.id)
  })

  it('the revealed mark belongs to the content: it is dropped when the fingerprint changes', () => {
    saveCaseState(p, { fp: puzzleFingerprint(p), hinted: [], wrong: 3, attempts: 2, revealed: true })
    expect(loadCaseState(p).revealed).toBe(true)
    const raw = JSON.parse(localStorage.getItem(CASE_STATE_KEY)!)
    raw[p.id].fp = 'older-content'
    localStorage.setItem(CASE_STATE_KEY, JSON.stringify(raw))
    expect(loadCaseState(p)).toEqual({ fp: puzzleFingerprint(p), hinted: [], wrong: 0, attempts: 0, revealed: false })
  })

  it('garbage in the revealed field means "not revealed"', () => {
    for (const bad of ['yes', 1, null, {}, []]) {
      localStorage.setItem(CASE_STATE_KEY, JSON.stringify({ [p.id]: { fp: puzzleFingerprint(p), hinted: [], wrong: 0, attempts: 0, revealed: bad } }))
      expect(loadCaseState(p).revealed).toBe(false)
    }
  })
})
