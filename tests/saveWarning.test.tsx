import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GameScreen from '../src/components/GameScreen'
import { getAllPuzzles } from '../src/core/catalog'
import type { CellMark, Puzzle } from '../src/core/types'
import { useGame } from '../src/hooks/useGame'
import { Shell } from '../src/reference/shell/Shell'
import type { GameApi } from '../src/reference/shell/types'
import { emptyMarks, makePuzzle } from './fixtures'

vi.mock('../src/components/IsoBoard', () => ({ default: () => <div /> }))
afterEach(() => vi.restoreAllMocks())

// R3.2: an autosave that could not be stored is said so, plainly, in both UIs.
// Nothing is shown while saving works, so the warning never stands in for a "saved" claim.

const fixture = makePuzzle()
const gameProps = {
  puzzle: fixture, mode: 'classic' as const, marks: emptyMarks(), conflicts: new Set<string>(),
  placedOf: {}, selectedPerson: 'p0', tool: 'place' as const, hintsLeft: 3,
  timer: '00:00', hideTimer: false, canUndo: false, canRedo: false,
  feedback: 'none' as const, resolvedClues: [],
  onSelectPerson: vi.fn(), onSetTool: vi.fn(), onCell: vi.fn(), onToggleClue: vi.fn(),
  onUndo: vi.fn(), onRedo: vi.fn(), onClear: vi.fn(), onHint: vi.fn(),
  onToggleTimer: vi.fn(), onSubmit: vi.fn(), onDismissFeedback: vi.fn(), onBack: vi.fn(),
}

const p = getAllPuzzles().find(x => x.id === 'very-easy-1') as Puzzle
const shellGame = (over: Partial<GameApi>): GameApi => ({
  puzzles: [p], catalogProgress: null, puzzle: p, mode: 'classic',
  marks: Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' as const }))) as CellMark[][],
  activeFloor: 0, selectedPerson: p.people[0].id, tool: 'place', hintsLeft: 3, completed: false, murderer: null,
  feedback: 'none', placedOf: {}, conflicts: new Set<string>(), history: [],
  start: vi.fn(), selectPerson: vi.fn(), setTool: vi.fn(), clickCell: vi.fn(), clearAll: vi.fn(),
  undo: vi.fn(), hint: vi.fn(), submit: vi.fn(),
  ...over,
})
const shell = (g: GameApi) => <Shell game={g} board={null} variant="illustrated" theme="dark" onToggleTheme={() => {}} story={null} intro={false} />

describe('save-failure warning', () => {
  it('main game screen: shown only when the autosave failed', () => {
    const { rerender } = render(<GameScreen {...gameProps} activeFloor={0} />)
    expect(screen.queryByTestId('save-warning')).toBeNull()
    rerender(<GameScreen {...gameProps} activeFloor={0} saveFailed />)
    expect(screen.getByTestId('save-warning')).toHaveTextContent(/isn't being saved/)
    expect(screen.getByTestId('save-warning')).toHaveAttribute('role', 'status')
  })

  it('reference shell: shown only when the autosave failed', () => {
    const { rerender } = render(shell(shellGame({})))
    expect(screen.queryByTestId('save-warning')).toBeNull()
    rerender(shell(shellGame({ saveFailed: true })))
    expect(screen.getByTestId('save-warning')).toHaveTextContent(/isn't being saved/)
  })

  it('the hook raises it when storage refuses the write and lowers it once a write succeeds', () => {
    const real = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith('murdoku_save_v2:')) throw new DOMException('full', 'QuotaExceededError')
      return real.call(this, k, v)
    })
    const h = renderHook(() => useGame())
    act(() => h.result.current.start(p.id, 'classic'))
    expect(h.result.current.saveFailed).toBe(false)              // nothing to save yet
    act(() => h.result.current.selectPerson(p.people[0].id))
    act(() => h.result.current.clickCell(0, 0))
    expect(h.result.current.saveFailed).toBe(true)
    spy.mockRestore()
    act(() => h.result.current.selectPerson(p.people[1].id))
    act(() => h.result.current.clickCell(1, 1))
    expect(h.result.current.saveFailed).toBe(false)
  })
})
