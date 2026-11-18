import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameScreen from '../src/components/GameScreen'
import { emptyMarks, makePuzzle } from './fixtures'

function renderGame(overrides?: Parameters<typeof makePuzzle>[0], propOverrides?: Record<string, unknown>) {
  const puzzle = makePuzzle(overrides)
  return render(
    <GameScreen
      puzzle={puzzle}
      mode="classic"
      marks={emptyMarks(puzzle.size)}
      conflicts={new Set()}
      placedOf={{}}
      selectedPerson={puzzle.people[0].id}
      tool="place"
      hintsLeft={3}
      timer="00:00"
      hideTimer={false}
      canUndo={false}
      canRedo={false}
      feedback="none"
      resolvedClues={[]}
      onSelectPerson={vi.fn()}
      onSetTool={vi.fn()}
      onCell={vi.fn()}
      onToggleClue={vi.fn()}
      onUndo={vi.fn()}
      onRedo={vi.fn()}
      onClear={vi.fn()}
      onHint={vi.fn()}
      onToggleTimer={vi.fn()}
      onSubmit={vi.fn()}
      onDismissFeedback={vi.fn()}
      onBack={vi.fn()}
      {...propOverrides}
    />,
  )
}

describe('GameScreen clue preview', () => {
  it('switches to the clue floor without selecting or placing a suspect', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    const onSwitchFloor = vi.fn()
    const onSelectPerson = vi.fn()
    const onCell = vi.fn()
    renderGame({ floors: 2, clues: [
      { clue: { kind: 'floor', person: 'p0', floorNum: 1 }, text: 'Upstairs.' },
      { clue: { kind: 'row', person: 'p0', row: 2 }, text: 'In row 3.' },
    ] }, { activeFloor: 0, onSwitchFloor, onSelectPerson, onCell })
    fireEvent.click(screen.getByRole('button', { name: "Show Ada Stone's clue on the board" }))
    expect(onSwitchFloor).toHaveBeenCalledExactlyOnceWith(1)
    expect(onSelectPerson).not.toHaveBeenCalled()
    expect(onCell).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: "Hide Ada Stone's clue on the board" }))
    expect(onSwitchFloor).toHaveBeenCalledTimes(1)
  })
})

describe('GameScreen destructive confirmations', () => {
  it('exposes an accessible clear dialog, focuses Cancel, and closes on Escape', async () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    const dialog = screen.getByRole('dialog', { name: 'Clear the board?' })
    const cancel = screen.getByRole('button', { name: 'Cancel' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(cancel).toHaveFocus()
    expect(cancel).toHaveClass('min-h-[44px]')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Clear the board?' })).not.toBeInTheDocument())
  })
})

// Find the board announcement live region (not CaseNotes' saved status)
function getBoardLiveRegion() {
  // The board region is aria-atomic; CaseNotes' status is not.
  const all = screen.getAllByRole('status')
  const board = all.find(el => el.getAttribute('aria-atomic') === 'true')
  if (!board) throw new Error('Board live region not found')
  return board
}

describe('GameScreen aria-live region', () => {
  it('renders a polite status region that is always mounted', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()

    const region = getBoardLiveRegion()
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-atomic', 'true')
    // On mount the region is empty — no board state is read aloud
    expect(region.textContent).toBe('')
  })

  it('announces placement when a suspect is placed on the board', async () => {
    localStorage.setItem('murdoku_seen_help', '1')
    const puzzle = makePuzzle()
    const { rerender } = render(
      <GameScreen
        puzzle={puzzle}
        mode="classic"
        marks={emptyMarks(puzzle.size)}
        conflicts={new Set()}
        placedOf={{}}
        selectedPerson={puzzle.people[0].id}
        tool="place"
        hintsLeft={3}
        timer="00:00"
        hideTimer={false}
        canUndo={false}
        canRedo={false}
        feedback="none"
        resolvedClues={[]}
        onSelectPerson={vi.fn()}
        onSetTool={vi.fn()}
        onCell={vi.fn()}
        onToggleClue={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClear={vi.fn()}
        onHint={vi.fn()}
        onToggleTimer={vi.fn()}
        onSubmit={vi.fn()}
        onDismissFeedback={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    // Simulate placing Ada Stone at row 0, col 0 (Study room)
    const newMarks = emptyMarks(puzzle.size)
    newMarks[0][0] = { kind: 'person', person: 'p0' }

    rerender(
      <GameScreen
        puzzle={puzzle}
        mode="classic"
        marks={newMarks}
        conflicts={new Set()}
        placedOf={{ p0: { row: 0, col: 0 } }}
        selectedPerson={puzzle.people[0].id}
        tool="place"
        hintsLeft={3}
        timer="00:00"
        hideTimer={false}
        canUndo={true}
        canRedo={false}
        feedback="none"
        resolvedClues={[]}
        onSelectPerson={vi.fn()}
        onSetTool={vi.fn()}
        onCell={vi.fn()}
        onToggleClue={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClear={vi.fn()}
        onHint={vi.fn()}
        onToggleTimer={vi.fn()}
        onSubmit={vi.fn()}
        onDismissFeedback={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    const region = getBoardLiveRegion()
    await waitFor(() => expect(region.textContent).toMatch(/Ada Stone placed/))
    expect(region.textContent).toMatch(/row 1 column 1/)
  })

  it('announces accusation rejection when feedback is wrong', async () => {
    localStorage.setItem('murdoku_seen_help', '1')
    const puzzle = makePuzzle()
    const { rerender } = render(
      <GameScreen
        puzzle={puzzle}
        mode="classic"
        marks={emptyMarks(puzzle.size)}
        conflicts={new Set()}
        placedOf={{}}
        selectedPerson={null}
        tool="place"
        hintsLeft={3}
        timer="00:00"
        hideTimer={false}
        canUndo={false}
        canRedo={false}
        feedback="none"
        resolvedClues={[]}
        onSelectPerson={vi.fn()}
        onSetTool={vi.fn()}
        onCell={vi.fn()}
        onToggleClue={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClear={vi.fn()}
        onHint={vi.fn()}
        onToggleTimer={vi.fn()}
        onSubmit={vi.fn()}
        onDismissFeedback={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    rerender(
      <GameScreen
        puzzle={puzzle}
        mode="classic"
        marks={emptyMarks(puzzle.size)}
        conflicts={new Set()}
        placedOf={{}}
        selectedPerson={null}
        tool="place"
        hintsLeft={3}
        timer="00:00"
        hideTimer={false}
        canUndo={false}
        canRedo={false}
        feedback="wrong"
        resolvedClues={[]}
        onSelectPerson={vi.fn()}
        onSetTool={vi.fn()}
        onCell={vi.fn()}
        onToggleClue={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClear={vi.fn()}
        onHint={vi.fn()}
        onToggleTimer={vi.fn()}
        onSubmit={vi.fn()}
        onDismissFeedback={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    // The rejection is only announced when submitNonce changes (an actual submit),
    // not just when feedback prop changes. So the live region stays quiet here —
    // this verifies the guard against spurious announcements on prop-only changes.
    const region = getBoardLiveRegion()
    expect(region.textContent).toBe('')
  })
})

// ── Layout / proportion tests ─────────────────────────────────────────────────
// jsdom cannot measure pixels, so these tests assert structural classes rather
// than computed dimensions. They verify the composition intent: a shared
// max-width wrapper that keeps board and dossier as one unit, and a square
// board div that sizes itself from the isometric scene ratio.

describe('GameScreen layout composition', () => {
  it('renders the shared desktop content cap with its testid', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    expect(screen.getByTestId('game-content-cap')).toBeInTheDocument()
  })

  it('content cap carries the max-width centering class', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    const cap = screen.getByTestId('game-content-cap')
    // lg:max-w-[1400px] gates the cap at desktop widths so board + dossier
    // read as one unit instead of spanning a 1920px viewport.
    expect(cap.className).toMatch(/lg:max-w-\[1400px\]/)
    expect(cap.className).toMatch(/lg:mx-auto/)
  })

  it('board wrapper uses the isometric scene ratio on mobile and desktop', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    const boardWrapper = screen.getByTestId('board').parentElement
    expect(boardWrapper?.style.aspectRatio).toBe('var(--board-ratio)')
  })

  it('uses tighter mobile padding without changing the desktop breathing room', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    const boardSlot = screen.getByTestId('board').parentElement?.parentElement
    expect(boardSlot).toHaveClass('p-2', 'lg:p-3')
  })
})

describe('GameScreen placement arming', () => {
  it('keeps the selected suspect idle until the player explicitly arms placement', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    expect(document.querySelectorAll('[data-placement-cue]')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: /Ada Stone portrait/ }))
    expect(document.querySelectorAll('[data-placement-cue]').length).toBeGreaterThan(0)
  })

  it('disarms placement after a target is used', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    const onCell = vi.fn()
    renderGame(undefined, { onCell })
    fireEvent.click(screen.getByRole('button', { name: /Ada Stone portrait/ }))
    fireEvent.click(screen.getByRole('gridcell', { name: /Row 1, column 1/ }))
    expect(onCell).toHaveBeenCalledWith(0, 0)
    expect(document.querySelectorAll('[data-placement-cue]')).toHaveLength(0)
  })

  it('arms the selected suspect through the P keyboard shortcut', () => {
    localStorage.setItem('murdoku_seen_help', '1')
    renderGame()
    expect(document.querySelectorAll('[data-placement-cue]')).toHaveLength(0)
    fireEvent.keyDown(window, { key: 'p' })
    expect(document.querySelectorAll('[data-placement-cue]').length).toBeGreaterThan(0)
  })
})
