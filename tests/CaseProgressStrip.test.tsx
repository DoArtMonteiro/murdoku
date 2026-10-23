import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CaseProgressStrip from '../src/components/CaseProgressStrip'
import { getAllPuzzles } from '../src/core/catalog'

const puzzle = getAllPuzzles()[0]
const allPlaced = Object.fromEntries(puzzle.people.map((person, index) => [person.id, { row: index, col: index }]))

function renderStrip(placedOf: Record<string, { row: number; col: number }>) {
  return render(
    <CaseProgressStrip puzzle={puzzle} selectedPerson={null} placedOf={placedOf} conflicts={new Set()} onSelectPerson={() => {}} />,
  )
}

describe('CaseProgressStrip status line', () => {
  it('shows the full review instruction once everyone is placed, without truncation', () => {
    renderStrip(allPlaced)
    const status = screen.getByTestId('case-progress-status')
    expect(status).toHaveTextContent('All people placed — review the account before accusing.')
    // The instruction must wrap on narrow phones instead of being cut with an ellipsis.
    expect(status.className).not.toMatch(/\btruncate\b/)
    expect(status.className).toMatch(/\bbreak-words\b/)
  })

  it('keeps the placed counter readable and on one line next to the wrapping status', () => {
    renderStrip(allPlaced)
    const counter = screen.getByText(`${puzzle.people.length} / ${puzzle.people.length} placed`)
    expect(counter).toHaveAttribute('aria-live', 'polite')
    expect(counter.parentElement?.className).toMatch(/\bwhitespace-nowrap\b/)
    expect(counter.parentElement?.className).toMatch(/\bflex-shrink-0\b/)
  })

  it('names the next suggested person while placements are missing', () => {
    renderStrip({})
    expect(screen.getByTestId('case-progress-status')).toHaveTextContent(`Next suggested: ${puzzle.people[0].name}`)
    expect(screen.getByRole('heading', { name: /continuity \/ sequence/i })).toBeInTheDocument()
  })
})
