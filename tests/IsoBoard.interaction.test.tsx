import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import IsoBoard from '../src/components/IsoBoard'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { AUTHORED_CASES } from '../src/data/cases'
import { emptyMarks } from './fixtures'

const puzzle = buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')
const base = { puzzle, marks: emptyMarks(6), conflicts: new Set<string>(), onCellClick: vi.fn() }

describe('isometric interaction readability', () => {
  it('keeps the clicked cell outlined after the pointer leaves, without an armed person', () => {
    const { container } = render(<IsoBoard {...base} />)
    const cell = container.querySelector('[data-cell="2-3"]')!
    fireEvent.click(cell)
    fireEvent.mouseLeave(cell)
    expect(cell).toHaveAttribute('aria-selected', 'true')
    expect(container.querySelector('[data-active-cell="2-3"]')).toBeTruthy()
    expect(container.querySelector('[data-active-cell] polygon')).toHaveAttribute('vector-effect', 'non-scaling-stroke')
  })

  it('uses one tab stop, arrow navigation, and Enter/Space with the same logical click action', () => {
    const onCellClick = vi.fn()
    const { container } = render(<IsoBoard {...base} onCellClick={onCellClick} />)
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    const first = container.querySelector('[data-cell="0-0"]')! as SVGElement
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    const second = container.querySelector('[data-cell="0-1"]')!
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'Enter' })
    fireEvent.keyDown(second, { key: ' ' })
    expect(onCellClick.mock.calls).toEqual([[0, 1], [0, 1]])
  })

  it('distinguishes local lanes, cross-floor lanes and occupancy without changing placement behaviour', () => {
    const marks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && c === 2 ? { kind: 'person' as const, person: 'p1' } : mark))
    const { container, getByRole } = render(<IsoBoard {...base} marks={marks} armedPerson="p0" blockedCols={new Set([4])} />)
    fireEvent.mouseEnter(container.querySelector('[data-cell="1-0"]')!)
    expect(getByRole('status')).toHaveTextContent('Row occupied on this floor')
    fireEvent.mouseEnter(container.querySelector('[data-cell="0-4"]')!)
    expect(getByRole('status')).toHaveTextContent('Column occupied on the other floor')
    expect(container.querySelector('[data-placement-cue="0-4"]')).toBeNull()
    fireEvent.mouseEnter(container.querySelector('[data-cell="1-2"]')!)
    expect(getByRole('status')).toHaveTextContent('Occupied')
  })

  it('exposes conflicts with text and an icon, and clue footprints above furniture', () => {
    const marks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && c === 2 ? { kind: 'person' as const, person: 'p1' } : mark))
    const { container } = render(<IsoBoard {...base} marks={marks} conflicts={new Set(['p1'])} highlight={{ cells: [{ row: 0, col: 0 }] }} />)
    expect(container.querySelector('[data-cell="1-2"]')).toHaveAccessibleName(/conflict/i)
    expect(container.querySelector('[data-conflict-icon]')).toBeTruthy()
    expect(container.querySelector('[data-placed-cell="1-2"]')).toBeTruthy()
    expect(container.querySelector('[data-clue-cell="0-0"]')).toBeTruthy()
  })

  it('keeps the armed person’s own lanes available when moving that person', () => {
    const marks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && c === 2 ? { kind: 'person' as const, person: 'p0' } : mark))
    const { container, getByRole } = render(<IsoBoard {...base} marks={marks} armedPerson="p0" />)
    fireEvent.mouseEnter(container.querySelector('[data-cell="1-3"]')!)
    expect(getByRole('status')).toHaveTextContent('Row and column free')
    expect(container.querySelector('[data-placement-cue="1-3"]')).toBeTruthy()
  })

  it('ignores the mover’s own other-floor lanes, including automatic exclusion marks', () => {
    const ghostMarks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && c === 2 ? { kind: 'person' as const, person: 'p0' } : mark))
    const marks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && c === 3 ? { kind: 'x' as const, auto: true } : mark))
    const { container, getByRole } = render(<IsoBoard {...base} marks={marks} ghostMarks={ghostMarks} armedPerson="p0" blockedRows={new Set([1])} blockedCols={new Set([2])} />)
    fireEvent.mouseEnter(container.querySelector('[data-cell="1-3"]')!)
    expect(getByRole('status')).toHaveTextContent('Row and column free')
    expect(container.querySelector('[data-placement-target]')).not.toHaveAttribute('stroke', '#C94444')
    expect(container.querySelector('[data-placement-cue="1-4"]')).toBeTruthy()
  })

  it('retains an other-floor lane occupied by another person when the mover shares it', () => {
    const ghostMarks = emptyMarks(6).map((row, r) => row.map((mark, c) => r === 1 && (c === 2 || c === 4) ? { kind: 'person' as const, person: c === 2 ? 'p0' : 'p1' } : mark))
    const { container, getByRole } = render(<IsoBoard {...base} ghostMarks={ghostMarks} armedPerson="p0" blockedRows={new Set([1])} blockedCols={new Set([2, 4])} />)
    fireEvent.mouseEnter(container.querySelector('[data-cell="1-3"]')!)
    expect(getByRole('status')).toHaveTextContent('Row occupied on the other floor')
    expect(container.querySelector('[data-placement-cue="1-3"]')).toBeNull()
  })
})
