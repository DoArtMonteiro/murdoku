import { act, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGame } from '../src/hooks/useGame'
import { getAllPuzzles } from '../src/core/catalog'
import MapGrid from '../src/components/MapGrid'
import type { Puzzle, CellMark } from '../src/core/types'
import { emptyMarks, makePuzzle } from './fixtures'

const puzzles = getAllPuzzles()
const twoFloorCase = puzzles.find(p => (p.floors ?? 1) === 2)!
const singleFloorCase = puzzles.find(p => (p.floors ?? 1) === 1)!

describe('two-floor play state', () => {
  it('the catalog actually ships two-floor cases', () => {
    expect(twoFloorCase, 'no two-floor case in the catalog').toBeTruthy()
    expect(singleFloorCase).toBeTruthy()
  })

  it('placing upstairs leaves the ground floor untouched', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(twoFloorCase.id, 'classic'))
    const person = twoFloorCase.people[0]
    act(() => result.current.selectPerson(person.id))
    act(() => result.current.switchFloor?.(1))
    act(() => result.current.clickCell(0, 0))

    const upstairs = result.current.marksPerFloor?.[1]
    const ground = result.current.marksPerFloor?.[0]
    expect(upstairs?.[0][0].kind, 'suspect should be upstairs').toBe('person')
    expect(ground?.[0][0].kind, 'ground floor must not be disturbed').not.toBe('person')
  })

  it('detects a row conflict ACROSS floors in classic mode', () => {
    // Classic mode permits an illegal placement and flags it, rather than
    // refusing it. The point here is that the conflict is seen across storeys:
    // floors share one set of rows and columns, which is the whole mechanic.
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(twoFloorCase.id, 'classic'))
    const [a, b] = twoFloorCase.people
    act(() => result.current.selectPerson(a.id))
    act(() => result.current.switchFloor?.(1))
    act(() => result.current.clickCell(2, 2))
    act(() => result.current.switchFloor?.(0))
    act(() => result.current.selectPerson(b.id))
    act(() => result.current.clickCell(2, 3)) // same ROW, other storey

    expect(result.current.conflicts.has(a.id), 'upstairs suspect should conflict').toBe(true)
    expect(result.current.conflicts.has(b.id), 'ground suspect should conflict').toBe(true)
  })

  it('refuses the same row from another storey in detective mode', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(twoFloorCase.id, 'detective'))
    const [a, b] = twoFloorCase.people
    act(() => result.current.selectPerson(a.id))
    act(() => result.current.switchFloor?.(1))
    act(() => result.current.clickCell(2, 2))
    act(() => result.current.switchFloor?.(0))
    act(() => result.current.selectPerson(b.id))
    act(() => result.current.clickCell(2, 3))

    expect(result.current.marksPerFloor?.[0][2][3].kind,
      'row 2 is already spent upstairs').not.toBe('person')
    expect(result.current.feedback).toBe('blocked')
  })

  it('single-floor cases keep exactly one storey of marks', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(singleFloorCase.id, 'classic'))
    const mpf = result.current.marksPerFloor
    const used = mpf?.filter(floor => floor.some(row => row.length > 0)) ?? []
    expect(used.length).toBeLessThanOrEqual(2)
    expect(result.current.marks.length).toBe(singleFloorCase.size)
  })
})

// ── Two-floor MapGrid rendering tests ──────────────────────────────────────
//
// These use a hand-built 4×4 two-floor puzzle where ground floor and upstairs
// have distinct rooms and distinct furniture, so we can assert that switching
// floors produces a visibly different board.

/** Ground floor: Study (top-left quad) + Hall (top-right quad) */
const groundRoomOf = [
  ['study', 'study', 'hall', 'hall'],
  ['study', 'study', 'hall', 'hall'],
  ['study', 'study', 'hall', 'hall'],
  ['study', 'study', 'hall', 'hall'],
]

/** Upstairs: Bedroom (top-left quad) + Bathroom (top-right quad) */
const upstairsRoomOf = [
  ['bedroom', 'bedroom', 'bathroom', 'bathroom'],
  ['bedroom', 'bedroom', 'bathroom', 'bathroom'],
  ['bedroom', 'bedroom', 'bathroom', 'bathroom'],
  ['bedroom', 'bedroom', 'bathroom', 'bathroom'],
]

const twoFloorPuzzle: Puzzle = makePuzzle({
  floors: 2,
  roomOf: groundRoomOf,
  roomOfByFloor: [groundRoomOf, upstairsRoomOf],
  rooms: [
    // Ground floor rooms
    { id: 'study',    name: 'Study',    hue: 20,  floor: 0, cells: [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 3, col: 0 }, { row: 3, col: 1 },
    ]},
    { id: 'hall',     name: 'Hall',     hue: 120, floor: 0, cells: [
      { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 },
    ]},
    // Upstairs rooms
    { id: 'bedroom',  name: 'Bedroom',  hue: 200, floor: 1, cells: [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 3, col: 0 }, { row: 3, col: 1 },
    ]},
    { id: 'bathroom', name: 'Bathroom', hue: 280, floor: 1, cells: [
      { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 },
    ]},
  ],
  furniture: [
    // Ground floor only: desk at (0,0), chair at (2,2)
    { type: 'desk',  row: 0, col: 0, floor: 0 },
    { type: 'chair', row: 2, col: 2, floor: 0 },
    // Upstairs only: bed at (0,0), bathtub at (2,2)
    { type: 'bed',     row: 0, col: 0, floor: 1 },
    { type: 'bathtub', row: 2, col: 2, floor: 1 },
  ],
})

function renderMapGrid(floor: 0 | 1) {
  const marks: CellMark[][] = emptyMarks(twoFloorPuzzle.size)
  const { container } = render(
    <MapGrid
      puzzle={twoFloorPuzzle}
      marks={marks}
      conflicts={new Set()}
      onCellClick={() => {}}
      floor={floor}
    />,
  )
  return container
}

describe('MapGrid two-floor rendering', () => {
  it('furniture icons differ between floor 0 and floor 1', () => {
    const ground = renderMapGrid(0)
    const upstairs = renderMapGrid(1)

    const groundIcons = [...ground.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon'))
      .sort()
    const upstairsIcons = [...upstairs.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon'))
      .sort()

    // Ground has desk+chair; upstairs has bed+bathtub — sets must differ
    expect(groundIcons).not.toEqual(upstairsIcons)
    expect(groundIcons).toContain('desk')
    expect(groundIcons).toContain('chair')
    expect(upstairsIcons).toContain('bed')
    expect(upstairsIcons).toContain('bathtub')
  })

  it('no other-floor furniture leaks into each render', () => {
    const ground = renderMapGrid(0)
    const upstairs = renderMapGrid(1)

    const groundIcons = [...ground.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon'))
    const upstairsIcons = [...upstairs.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon'))

    // Upstairs furniture must not appear on ground floor and vice versa
    expect(groundIcons).not.toContain('bed')
    expect(groundIcons).not.toContain('bathtub')
    expect(upstairsIcons).not.toContain('desk')
    expect(upstairsIcons).not.toContain('chair')
  })

  it('cell aria-label names the floor-0 room when floor=0', () => {
    const ground = renderMapGrid(0)
    // Top-left cell (row 1, col 1) is in Study on ground floor
    const cell = ground.querySelector('[data-cell="0-0"]')
    expect(cell).not.toBeNull()
    expect(cell!.getAttribute('aria-label')).toContain('Study')
    expect(cell!.getAttribute('aria-label')).not.toContain('Bedroom')
  })

  it('cell aria-label names the floor-1 room when floor=1', () => {
    const upstairs = renderMapGrid(1)
    // Same cell position is in Bedroom on upstairs floor
    const cell = upstairs.querySelector('[data-cell="0-0"]')
    expect(cell).not.toBeNull()
    expect(cell!.getAttribute('aria-label')).toContain('Bedroom')
    expect(cell!.getAttribute('aria-label')).not.toContain('Study')
  })

  it('single-floor puzzle (no roomOfByFloor) renders identically with or without floor prop', () => {
    const singlePuzzle = makePuzzle() // standard fixture, no roomOfByFloor
    const marks: CellMark[][] = emptyMarks(singlePuzzle.size)

    const { container: c0 } = render(
      <MapGrid
        puzzle={singlePuzzle}
        marks={marks}
        conflicts={new Set()}
        onCellClick={() => {}}
        floor={0}
      />,
    )
    const { container: c1 } = render(
      <MapGrid
        puzzle={singlePuzzle}
        marks={marks}
        conflicts={new Set()}
        onCellClick={() => {}}
      />,
    )

    // Both should show the same furniture (desk at 1,1 / chair at 2,2 / rug at 3,3)
    const icons0 = [...c0.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon')).sort()
    const icons1 = [...c1.querySelectorAll('[data-furniture-icon]')]
      .map(el => el.getAttribute('data-furniture-icon')).sort()
    expect(icons0).toEqual(icons1)

    // Room names in aria-labels should be identical
    const labels0 = [...c0.querySelectorAll('[data-cell]')]
      .map(el => el.getAttribute('aria-label')).sort()
    const labels1 = [...c1.querySelectorAll('[data-cell]')]
      .map(el => el.getAttribute('aria-label')).sort()
    expect(labels0).toEqual(labels1)
  })
})
