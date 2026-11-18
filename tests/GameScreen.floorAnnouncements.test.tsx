import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameScreen from '../src/components/GameScreen'
import { emptyMarks, makePuzzle } from './fixtures'

vi.mock('../src/components/IsoBoard', () => ({ default: () => <div /> }))

const ground = makePuzzle()
const puzzle = makePuzzle({
  floors: 2,
  roomOfByFloor: [ground.roomOf, ground.roomOf.map(row => row.map(() => 'study'))],
})
const props = {
  puzzle, mode: 'classic' as const, marks: emptyMarks(), conflicts: new Set<string>(),
  placedOf: {}, selectedPerson: 'p0', tool: 'place' as const, hintsLeft: 3,
  timer: '00:00', hideTimer: false, canUndo: false, canRedo: false,
  feedback: 'none' as const, resolvedClues: [],
  onSelectPerson: vi.fn(), onSetTool: vi.fn(), onCell: vi.fn(), onToggleClue: vi.fn(),
  onUndo: vi.fn(), onRedo: vi.fn(), onClear: vi.fn(), onHint: vi.fn(),
  onToggleTimer: vi.fn(), onSubmit: vi.fn(), onDismissFeedback: vi.fn(), onBack: vi.fn(),
}
const announcement = () => screen.getAllByRole('status').find(node => node.getAttribute('aria-atomic') === 'true')!

describe('placement announcements across floors', () => {
  it('names the room on the placed person’s floor, independent of the displayed floor', () => {
    const { rerender } = render(<GameScreen {...props} activeFloor={0} />)
    rerender(<GameScreen {...props} activeFloor={0} placedOf={{ p0: { row: 3, col: 3, floor: 1 } }} />)
    expect(announcement()).toHaveTextContent('Ada Stone placed in the Study, row 4 column 4')
    expect(announcement()).not.toHaveTextContent('Kitchen')
  })

  it('announces a move between floors even when row and column do not change', () => {
    const { rerender } = render(<GameScreen {...props} placedOf={{ p0: { row: 3, col: 3, floor: 0 } }} />)
    rerender(<GameScreen {...props} placedOf={{ p0: { row: 3, col: 3, floor: 1 } }} />)
    expect(announcement()).toHaveTextContent('Ada Stone placed in the Study, row 4 column 4')
  })
})
