import { act, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getAllPuzzles } from '../src/core/catalog'
import type { CellMark, Puzzle } from '../src/core/types'
import { useGame } from '../src/hooks/useGame'
import { Shell } from '../src/reference/shell/Shell'
import type { GameApi } from '../src/reference/shell/types'

// R3 gate: on a two-storey case the closing board stayed on whatever storey the
// player last touched, with the last-placed suspect still ringed, so "Left alone
// with X in the Front Yard" sat over a board that showed neither of them.
// The case now closes on the scene of the crime.

type Hook = ReturnType<typeof renderHook<ReturnType<typeof useGame>, unknown>>
const murderFloor = (p: Puzzle) => p.solution[p.victimId].floor ?? 0

/** Places `cells` storey by storey, ending on the storey AWAY from the murder. */
function placeEndingAway(h: Hook, p: Puzzle, cells: Puzzle['solution']) {
  const away = 1 - murderFloor(p)
  const order = [...p.people].sort((a, b) => Number((cells[a.id].floor ?? 0) === away) - Number((cells[b.id].floor ?? 0) === away))
  for (const person of order) {
    const c = cells[person.id]
    act(() => h.result.current.switchFloor((c.floor ?? 0) as 0 | 1))
    act(() => h.result.current.selectPerson(person.id))
    act(() => h.result.current.clickCell(c.row, c.col))
  }
  act(() => h.result.current.switchFloor(away as 0 | 1))
}

// Both directions: a ground-floor murder (hard-9) and an upstairs one (master-1).
const cases = ['hard-9', 'master-1'].map(id => getAllPuzzles().find(p => p.id === id)!)

describe('a two-storey case closes on the murder storey', () => {
  it('covers a murder on each storey', () => {
    expect(cases.map(murderFloor).sort()).toEqual([0, 1])
  })

  for (const p of cases) {
    it(`${p.id}: a correct accusation shows the murder storey and drops the selection`, () => {
      const h = renderHook(() => useGame())
      act(() => h.result.current.start(p.id, 'classic'))
      placeEndingAway(h, p, p.solution)
      expect(h.result.current.activeFloor).toBe(1 - murderFloor(p))
      act(() => h.result.current.submit())
      const s = h.result.current
      expect(s.completed).toBe(true)
      expect(s.activeFloor).toBe(murderFloor(p))
      expect(s.selectedPerson).toBeNull()
      const v = p.solution[p.victimId]
      expect(s.marks[v.row][v.col]).toMatchObject({ kind: 'person', person: p.victimId })
    })

    it(`${p.id}: Reveal after three wrong accusations shows the murder storey`, () => {
      const h = renderHook(() => useGame())
      act(() => h.result.current.start(p.id, 'classic'))
      const [a, b] = p.people.filter(x => x.id !== p.victimId)
      placeEndingAway(h, p, { ...p.solution, [a.id]: p.solution[b.id], [b.id]: p.solution[a.id] })
      for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
      expect(h.result.current.feedback).toBe('cold')
      act(() => h.result.current.reveal())
      const s = h.result.current
      expect(s.revealed).toBe(true)
      expect(s.activeFloor).toBe(murderFloor(p))
      expect(s.selectedPerson).toBeNull()
    })
  }

  it('a wrong accusation does not move the board (no storey hint)', () => {
    const p = cases.find(x => murderFloor(x) === 0)!
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(p.id, 'classic'))
    const [a, b] = p.people.filter(x => x.id !== p.victimId)
    placeEndingAway(h, p, { ...p.solution, [a.id]: p.solution[b.id], [b.id]: p.solution[a.id] })
    const before = h.result.current.selectedPerson
    act(() => h.result.current.submit())
    expect(h.result.current.feedback).toBe('wrong')
    expect(h.result.current.activeFloor).toBe(1)
    expect(h.result.current.selectedPerson).toBe(before)
  })
})

describe('shell: the closed board rings the murderer, not the last selection', () => {
  const p = cases[0]
  const marks: CellMark[][] = Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' as const })))
  for (const person of p.people) {
    const at = p.solution[person.id]
    if ((at.floor ?? 0) === murderFloor(p)) marks[at.row][at.col] = { kind: 'person', person: person.id }
  }
  const game = (over: Partial<GameApi>): GameApi => ({
    puzzles: [p], catalogProgress: null, puzzle: p, mode: 'classic', marks, activeFloor: murderFloor(p),
    selectedPerson: null, tool: 'place', hintsLeft: 3, completed: false, murderer: null,
    feedback: 'none', placedOf: {}, conflicts: new Set<string>(), history: [],
    start: vi.fn(), selectPerson: vi.fn(), setTool: vi.fn(), clickCell: vi.fn(), clearAll: vi.fn(),
    undo: vi.fn(), hint: vi.fn(), submit: vi.fn(),
    ...over,
  })
  const shell = (g: GameApi) => <Shell game={g} board={null} variant="illustrated" theme="dark" onToggleTheme={() => {}} story={null} intro={false} />

  it('rings the murderer once the case is closed', () => {
    render(shell(game({ completed: true, murderer: p.murdererId })))
    expect(screen.getByTestId(`token-${p.murdererId}`).className).toContain('rs-token-ring')
    expect(screen.getByTestId(`token-${p.victimId}`).className).not.toContain('rs-token-ring')
  })

  it('rings nobody while the case is open (no answer leak)', () => {
    render(shell(game({ murderer: null })))
    expect(document.querySelector('.rs-token-ring')).toBeNull()
  })
})
