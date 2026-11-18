import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VictoryScreen from '../src/components/VictoryScreen'
import { makePuzzle } from './fixtures'

function renderVictory(overrides: Partial<React.ComponentProps<typeof VictoryScreen>> = {}) {
  const puzzle = makePuzzle({
    murdererId: 'p0',
    victimId: 'p3',
    clues: [
      { clue: { kind: 'room', person: 'p0', roomId: 'study' }, text: 'She was in the Study.' },
      { clue: { kind: 'row', person: 'p1', row: 1 }, text: 'He was in row 2.' },
      { clue: { kind: 'victim', person: 'p3' }, text: 'Found alone with the killer.' },
    ],
    ...overrides.puzzle,
  })
  return render(
    <VictoryScreen
      puzzle={puzzle}
      murderer="p0"
      timer="02:30"
      elapsedSeconds={150}
      hintsLeft={2}
      completedIds={[]}
      onNext={vi.fn()}
      onPlayUnsolved={vi.fn()}
      onHome={vi.fn()}
      {...overrides}
    />,
  )
}

// ── Task 2: replay is opt-in ──────────────────────────────────────────────────

describe('VictoryScreen clue replay', () => {
  it('does not show the replay panel on initial render (opt-in only)', () => {
    renderVictory()
    expect(screen.queryByRole('region', { name: 'Clue replay' })).not.toBeInTheDocument()
  })

  it('shows a REVIEW CLUES button that opens the replay panel', () => {
    renderVictory()
    const btn = screen.getByRole('button', { name: 'Review clues: how the clues solved the case' })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByRole('region', { name: 'Clue replay' })).toBeInTheDocument()
  })

  it('hides the REVIEW CLUES button after the panel opens', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    expect(screen.queryByRole('button', { name: 'Review clues: how the clues solved the case' })).not.toBeInTheDocument()
  })

  it('shows the first suspect clue text in the replay panel', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    // The first non-victim suspect is p0 (Ada Stone) with clue "She was in the Study."
    expect(screen.getByText('She was in the Study.')).toBeInTheDocument()
  })

  it('steps to the next suspect on NEXT click', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next suspect' }))
    // Should now show p1 (Bram Vale) clue
    expect(screen.getByText('He was in row 2.')).toBeInTheDocument()
  })

  it('steps back on PREV click', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next suspect' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous suspect' }))
    // Back to p0
    expect(screen.getByText('She was in the Study.')).toBeInTheDocument()
  })

  it('PREV is disabled on the first step', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    expect(screen.getByRole('button', { name: 'Previous suspect' })).toBeDisabled()
  })

  it('NEXT is disabled on the last step', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    // Advance to last step (p0, p1, p2 — 3 suspects with clues: p0 and p1 have clues, p2 has none in fixture)
    // p0 has "room" clue, p1 has "row" clue — 2 steps total
    fireEvent.click(screen.getByRole('button', { name: 'Next suspect' }))
    // Now on last step
    expect(screen.getByRole('button', { name: 'Next suspect' })).toBeDisabled()
  })

  it('does not write any storage — VictoryScreen is read-only in replay mode', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next suspect' }))
    // No localStorage.setItem called due to replay
    // (Other calls for unrelated saves are not tested here; we verify
    // the replay itself does not trigger a write)
    const replayCalls = setSpy.mock.calls.filter(([key]) =>
      typeof key === 'string' && key.includes('murdoku'),
    )
    expect(replayCalls).toHaveLength(0)
    setSpy.mockRestore()
  })

  it('shows the step counter inside the replay panel', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    const panel = screen.getByRole('region', { name: 'Clue replay' })
    // The counter is the second p.font-mono in the header (after "CLUE BREAKDOWN")
    const paras = panel.querySelectorAll('p.font-mono')
    const counter = Array.from(paras).find(p => /\d+ \/ \d+/.test(p.textContent ?? ''))
    expect(counter?.textContent).toMatch(/1 \/ \d+/)
  })

  it('shows board target description for positioned clues', () => {
    renderVictory()
    fireEvent.click(screen.getByRole('button', { name: 'Review clues: how the clues solved the case' }))
    const panel = screen.getByRole('region', { name: 'Clue replay' })
    // Ada Stone has a 'room' clue → POINTS AT section and "the Study" inside panel
    expect(panel.textContent).toMatch(/POINTS AT/i)
    expect(panel.textContent).toContain('the Study')
  })
})
