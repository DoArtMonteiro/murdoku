import { describe, expect, it } from 'vitest'
import { resolveClueHighlights, resolveCluePreviewFloor } from '../src/core/ux'
import { makePuzzle } from './fixtures'

describe('clue preview floor', () => {
  it('uses an explicit floor clue without consulting the solution', () => {
    const puzzle = makePuzzle({ floors: 2, clues: [
      { clue: { kind: 'floor', person: 'p0', floorNum: 1 }, text: 'Upstairs.' },
      { clue: { kind: 'row', person: 'p0', row: 2 }, text: 'In row 3.' },
    ] })
    expect(puzzle.solution.p0.floor ?? 0).toBe(0)
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBe(1)
    expect(resolveClueHighlights(puzzle, 'p0', 0)).toEqual([])
    expect(resolveClueHighlights(puzzle, 'p0', 1)).toEqual([
      { cells: [0, 1, 2, 3].map(col => ({ row: 2, col })) },
    ])
  })

  it('uses the floor of a named room', () => {
    const base = makePuzzle()
    const puzzle = makePuzzle({ floors: 2,
      rooms: base.rooms.map(room => ({ ...room, floor: room.id === 'study' ? 1 : 0 })),
      clues: [{ clue: { kind: 'room', person: 'p0', roomId: 'study' }, text: 'In the Study.' }],
    })
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBe(1)
    expect(resolveClueHighlights(puzzle, 'p0', 0)).toEqual([])
  })

  it('keeps furniture clues local when candidates exist on both floors', () => {
    const puzzle = makePuzzle({ floors: 2,
      furniture: [{ type: 'desk', row: 0, col: 0 }, { type: 'desk', row: 1, col: 1, floor: 1 }],
      clues: [{ clue: { kind: 'besideFurniture', person: 'p0', furniture: 'desk' }, text: 'Beside a desk.' }],
    })
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBeNull()
    expect(resolveClueHighlights(puzzle, 'p0', 0)).toEqual([{ furniture: 'desk' }])
    expect(resolveClueHighlights(puzzle, 'p0', 1)).toEqual([{ furniture: 'desk' }])
  })

  it('keeps single-floor and legacy previews compatible', () => {
    const puzzle = makePuzzle({ clues: [{ clue: { kind: 'onFurniture', person: 'p0', furniture: 'rug' }, text: 'On a rug.' }] })
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBeNull()
    expect(resolveClueHighlights(puzzle, 'p0')).toEqual([{ furniture: 'rug' }])
  })

  it('uses the only floor containing a positive furniture target', () => {
    const puzzle = makePuzzle({ floors: 2,
      furniture: [{ type: 'clock', row: 1, col: 1, floor: 1 }],
      clues: [{ clue: { kind: 'onFurniture', person: 'p0', furniture: 'clock' }, text: 'On the clock.' }],
    })
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBe(1)
    expect(resolveClueHighlights(puzzle, 'p0', 0)).toEqual([])
  })

  it('does not infer a floor from alternatives split between floors', () => {
    const puzzle = makePuzzle({ floors: 2,
      furniture: [{ type: 'plant', row: 0, col: 0 }, { type: 'shrub', row: 1, col: 1, floor: 1 }],
      clues: [{ clue: { kind: 'besideAny', person: 'p0', furniture: ['plant', 'shrub'] }, text: 'Beside a plant or shrub.' }],
    })
    expect(resolveCluePreviewFloor(puzzle, 'p0')).toBeNull()
  })
})
