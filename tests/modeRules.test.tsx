/**
 * Mode differentiation tests.
 *
 * Thesis:
 *   Classic — place freely, use hints to nudge, submit when ready.
 *   Detective — every placement must be provable; elimination is first-class,
 *               hints are off, Assist (provable-empty marking) is on.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGame } from '../src/hooks/useGame'
import GameScreen from '../src/components/GameScreen'
import HowToPlay from '../src/components/HowToPlay'
import { emptyMarks, makePuzzle } from './fixtures'

// ---------------------------------------------------------------------------
// Hook — HINT
// ---------------------------------------------------------------------------

describe('HINT — classic vs detective', () => {
  it('classic: HINT places a suspect and decrements hintsLeft', async () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start('very-easy-1', 'classic'))
    const before = result.current.hintsLeft

    act(() => result.current.hint())

    await waitFor(() => {
      expect(result.current.hintsLeft).toBe(before - 1)
    })
  })

  it('detective: HINT is a no-op — hintsLeft and marks unchanged', async () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start('very-easy-1', 'detective'))
    const before = result.current.hintsLeft
    const marksBefore = JSON.stringify(result.current.marks)

    act(() => result.current.hint())

    // Give a tick for any async state flush.
    await waitFor(() => {
      expect(result.current.hintsLeft).toBe(before)
      expect(JSON.stringify(result.current.marks)).toBe(marksBefore)
    })
  })
})

// ---------------------------------------------------------------------------
// Hook — ASSIST
// ---------------------------------------------------------------------------

describe('ASSIST — classic vs detective', () => {
  it('detective: ASSIST adds auto-X marks on provably empty cells after a placement', async () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start('very-easy-1', 'detective'))

    // Place the first selected person somewhere to create row/col occupancy.
    act(() => result.current.clickCell(0, 0))

    const marksBefore = JSON.stringify(result.current.marks)

    act(() => result.current.assist())

    await waitFor(() => {
      // At least one auto-X should appear from the row/col elimination.
      const marks = result.current.marks
      const hasAutoX = marks.some(row => row.some(c => c.kind === 'x' && c.auto))
      expect(hasAutoX).toBe(true)
      expect(JSON.stringify(result.current.marks)).not.toBe(marksBefore)
    })
  })

  it('classic: ASSIST is a no-op — marks unchanged', async () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start('very-easy-1', 'classic'))

    // Place someone so there ARE provably empty cells to mark.
    act(() => result.current.clickCell(0, 0))
    const marksBefore = JSON.stringify(result.current.marks)

    act(() => result.current.assist())

    await waitFor(() => {
      expect(JSON.stringify(result.current.marks)).toBe(marksBefore)
    })
  })
})

// ---------------------------------------------------------------------------
// GameScreen — mode-gated toolbar buttons
// ---------------------------------------------------------------------------

function makeGameScreenProps(overrides: Partial<Parameters<typeof GameScreen>[0]> = {}) {
  const puzzle = makePuzzle()
  return {
    puzzle,
    mode: 'classic' as const,
    marks: emptyMarks(puzzle.size),
    conflicts: new Set<string>(),
    placedOf: {},
    selectedPerson: puzzle.people[0].id,
    tool: 'place' as const,
    hintsLeft: 3,
    timer: '00:00',
    hideTimer: false,
    canUndo: false,
    canRedo: false,
    feedback: 'none' as const,
    resolvedClues: [],
    onSelectPerson: vi.fn(),
    onSetTool: vi.fn(),
    onCell: vi.fn(),
    onToggleClue: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClear: vi.fn(),
    onHint: vi.fn(),
    onAssist: vi.fn(),
    onToggleTimer: vi.fn(),
    onSubmit: vi.fn(),
    onDismissFeedback: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  }
}

describe('GameScreen toolbar — mode-gated buttons', () => {
  beforeEach(() => {
    localStorage.setItem('murdoku_seen_help', '1')
  })

  it('classic: Hint button is visible', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'classic' })} />)
    expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument()
  })

  it('detective: Hint button is NOT visible', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'detective' })} />)
    expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument()
  })

  it('detective: Assist button is visible when onAssist is provided', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'detective' })} />)
    expect(screen.getByRole('button', { name: /assist/i })).toBeInTheDocument()
  })

  it('classic: Assist button is NOT visible', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'classic' })} />)
    expect(screen.queryByRole('button', { name: /assist/i })).not.toBeInTheDocument()
  })

  it('detective: Draft button is visible', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'detective' })} />)
    expect(screen.getByRole('button', { name: /draft/i })).toBeInTheDocument()
  })

  it('classic: Draft button is NOT visible', () => {
    render(<GameScreen {...makeGameScreenProps({ mode: 'classic' })} />)
    expect(screen.queryByRole('button', { name: /draft/i })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// HowToPlay — per-mode copy
// ---------------------------------------------------------------------------

describe('HowToPlay — mode-specific content', () => {
  it('classic: shows Hint tool, no Assist tool', () => {
    render(<HowToPlay mode="classic" onClose={vi.fn()} />)
    expect(screen.getByText('Hint')).toBeInTheDocument()
    expect(screen.queryByText('Assist')).not.toBeInTheDocument()
  })

  it('detective: shows Assist and Draft tools, no Hint tool', () => {
    render(<HowToPlay mode="detective" onClose={vi.fn()} />)
    expect(screen.getByText('Assist')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
  })

  it('classic: shows classic mode identity line', () => {
    render(<HowToPlay mode="classic" onClose={vi.fn()} />)
    expect(screen.getByText(/place freely.*hints if stuck/i)).toBeInTheDocument()
  })

  it('detective: shows detective mode identity line', () => {
    render(<HowToPlay mode="detective" onClose={vi.fn()} />)
    expect(screen.getByText(/every placement must be provable/i)).toBeInTheDocument()
  })
})
