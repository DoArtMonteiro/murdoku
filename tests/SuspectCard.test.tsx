import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SuspectCard from '../src/components/SuspectCard'
import type { Person } from '../src/core/types'

const person: Person = {
  id: 'p0',
  name: 'Ada Stone',
  avatarSeed: 'ada',
  accent: '#d89a22',
}

function renderCard(overrides: Partial<React.ComponentProps<typeof SuspectCard>> = {}) {
  return render(
    <SuspectCard
      person={person}
      clues={['In the Study.', 'Beside the desk.']}
      selected={false}
      placed={false}
      conflicted={false}
      onSelect={vi.fn()}
      {...overrides}
    />,
  )
}

// ── Task 1: satisfiedClues prop ───────────────────────────────────────────────

describe('SuspectCard satisfiedClues', () => {
  it('renders without satisfiedClues prop (backward compat — no ticks)', () => {
    renderCard()
    // Both clues visible, no satisfied tick icons
    expect(screen.getByText('In the Study.')).toBeInTheDocument()
    expect(screen.getByText('Beside the desk.')).toBeInTheDocument()
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  // CHANGED (P0 puzzle truth): these two used to assert that a satisfied clue is
  // ticked. An automatic tick tells the player, for every placement they try,
  // whether the clue holds, so a suspect can be walked to a legal cell without
  // reading the clue. The prop is still accepted; the cue is no longer drawn.
  it('never draws an automatic tick, even for a true entry', () => {
    renderCard({ satisfiedClues: [true, false] })
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  it('never draws ticks when all clues are satisfied', () => {
    renderCard({ satisfiedClues: [true, true] })
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  it('renders no ticks when all are unsatisfied', () => {
    renderCard({ satisfiedClues: [false, false] })
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  it('renders no ticks when satisfiedClues is shorter than clues (missing entry = unsatisfied)', () => {
    renderCard({ satisfiedClues: [] })
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  it('does not disturb the existing resolved line-through when both resolved and satisfied', () => {
    renderCard({ resolved: true, showCheck: true, satisfiedClues: [true, false] })
    // The card-level opacity/line-through still applies — clue text still present
    expect(screen.getByText('In the Study.')).toBeInTheDocument()
    // The automatic tick is gone; the player's own check-off is what remains.
    expect(screen.queryAllByLabelText('clue satisfied')).toHaveLength(0)
  })

  it('shows clues text regardless of satisfaction state', () => {
    renderCard({ satisfiedClues: [true, false] })
    expect(screen.getByText('In the Study.')).toBeInTheDocument()
    expect(screen.getByText('Beside the desk.')).toBeInTheDocument()
  })
})
