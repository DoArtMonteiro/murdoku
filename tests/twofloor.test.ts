import { describe, expect, it } from 'vitest'
import { clueHolds, countSolutions, findMurderer, roomIdAt } from '../src/core/engine'
import { cellFloor, sameColumnStack } from '../src/core/types'
import { candidateClues, generatePuzzle, reseed } from '../src/core/generate'
import type { Puzzle } from '../src/core/types'

// ============================================================================
// Two-floor support.
//
// The MODEL, the engine, the clue kinds and GENERATION are all implemented.
// Generation is live for Hard/Expert/Master — see DIFF_CONFIG in generate.ts.
// (An earlier revision of this comment said generation was switched off and cost
// ~82s per puzzle. That figure was measured on a machine loaded with stray
// vitest processes and is wrong; the information-driven selector generates a
// two-floor case in a fraction of a second.)
//
// The engine tests below still build a two-floor puzzle BY HAND rather than
// generating one, so floor semantics are verified against a fixture whose answer
// is known by construction rather than against whatever the generator happened
// to produce. Generated cases are covered separately at the end.
// ============================================================================

/** A 2x2 house with two floors: one room per floor. */
function twoFloorPuzzle(): Puzzle {
  const ground = [
    { row: 0, col: 0, floor: 0 }, { row: 0, col: 1, floor: 0 },
    { row: 1, col: 0, floor: 0 }, { row: 1, col: 1, floor: 0 },
  ]
  const upper = ground.map(c => ({ ...c, floor: 1 }))
  return {
    id: 'two-floor', title: 'Stacked', caseNumber: 'No. 0', difficulty: 'Hard',
    size: 2,
    floors: 2,
    rooms: [
      { id: 'g', name: 'Kitchen', hue: 0, cells: ground, floor: 0 },
      { id: 'u', name: 'Bedroom', hue: 0, cells: upper, floor: 1 },
    ],
    roomOf: [['g', 'g'], ['g', 'g']],
    roomOfByFloor: [[['g', 'g'], ['g', 'g']], [['u', 'u'], ['u', 'u']]],
    furniture: [],
    people: [
      { id: 'p0', name: 'Ada', avatarSeed: 'a', accent: '#B08D57' },
      { id: 'p1', name: 'Ben', avatarSeed: 'b', accent: '#6E8CA0' },
      { id: 'v', name: 'Vic', avatarSeed: 'v', accent: '#7FA083', isVictim: true },
    ],
    clues: [],
    solution: {
      p0: { row: 0, col: 0, floor: 0 },
      p1: { row: 1, col: 1, floor: 1 },
      v: { row: 0, col: 0, floor: 0 },
    },
    victimId: 'v', murdererId: 'p0', flavor: '',
  }
}

describe('floor helpers', () => {
  it('treats a missing floor as the ground floor', () => {
    expect(cellFloor({ row: 0, col: 0 })).toBe(0)
    expect(cellFloor({ row: 0, col: 0, floor: 1 })).toBe(1)
  })

  it('detects a cell stacked directly above another', () => {
    expect(sameColumnStack({ row: 2, col: 3, floor: 0 }, { row: 2, col: 3, floor: 1 })).toBe(true)
    // Same floor is not a stack; a different column is not a stack.
    expect(sameColumnStack({ row: 2, col: 3, floor: 0 }, { row: 2, col: 3, floor: 0 })).toBe(false)
    expect(sameColumnStack({ row: 2, col: 3, floor: 0 }, { row: 2, col: 4, floor: 1 })).toBe(false)
  })
})

describe('two-floor engine semantics', () => {
  const puzzle = twoFloorPuzzle()

  it('resolves rooms per floor, so the same row and column differ by storey', () => {
    expect(roomIdAt(puzzle, { row: 0, col: 0, floor: 0 })).toBe('g')
    expect(roomIdAt(puzzle, { row: 0, col: 0, floor: 1 })).toBe('u')
  })

  it('keeps rows and columns exclusive across floors', () => {
    // The product owner's rule: blocking a row downstairs blocks the same row
    // upstairs. The two suspects must not share a row or a column with each
    // other regardless of which floor they stand on.
    const suspects = ['p0', 'p1'].map(id => puzzle.solution[id])
    expect(suspects[0].row).not.toBe(suspects[1].row)
    expect(suspects[0].col).not.toBe(suspects[1].col)
    expect(cellFloor(suspects[0])).not.toBe(cellFloor(suspects[1]))
  })

  it('finds the murderer on the victim\'s own floor', () => {
    // Ben is upstairs, so he cannot be the one left alone with the victim.
    expect(findMurderer(puzzle)).toBe('p0')
  })

  it('evaluates furniture clues on the person\'s own storey', () => {
    const furnished: Puzzle = {
      ...puzzle,
      furniture: [
        { type: 'chair', row: 0, col: 0, floor: 0 },
        { type: 'bed', row: 0, col: 0, floor: 1 },
      ],
    }
    const upstairs = {
      ...furnished.solution,
      p1: { row: 0, col: 0, floor: 1 },
    }

    expect(clueHolds(furnished, { kind: 'onFurniture', person: 'p1', furniture: 'bed' }, upstairs)).toBe(true)
    expect(clueHolds(furnished, { kind: 'onFurniture', person: 'p1', furniture: 'chair' }, upstairs)).toBe(false)
  })

  it('generates furniture candidates from the correct storey', () => {
    const furnished: Puzzle = {
      ...puzzle,
      furniture: [
        { type: 'chair', row: 1, col: 1, floor: 0 },
        { type: 'bed', row: 1, col: 1, floor: 1 },
      ],
    }
    const upstairsFurniture = candidateClues(furnished).filter(
      clue => clue.kind === 'onFurniture' && clue.person === 'p1',
    )

    expect(upstairsFurniture).toContainEqual({ kind: 'onFurniture', person: 'p1', furniture: 'bed' })
    expect(upstairsFurniture).not.toContainEqual({ kind: 'onFurniture', person: 'p1', furniture: 'chair' })
  })

  it('never creates a same-room clue involving the victim', () => {
    const relational = candidateClues(puzzle).filter(clue => clue.kind === 'sameRoomAs')

    expect(relational).not.toContainEqual({ kind: 'sameRoomAs', person: 'v', other: 'p0' })
    expect(relational.every(clue => clue.kind !== 'sameRoomAs' || (
      clue.person !== puzzle.victimId && clue.other !== puzzle.victimId
    ))).toBe(true)
  })
})

describe('generated two-floor cases', () => {
  // Generation is enabled for Hard/Expert/Master. These guard the two properties
  // that make a second storey mean anything: it must exist, and it must be USED.
  // A two-floor board with everybody downstairs is a single-floor board with a
  // decorative upstairs — floor clues carry no information and "directly above"
  // can never fire. Measured over real seeds, that degenerate case did occur.
  for (const tier of ['Hard', 'Expert', 'Master'] as const) {
    it(`${tier} builds two storeys and puts suspects on both`, () => {
      reseed(4242)
      const p = generatePuzzle(tier, `${tier}-floors`, 'No. 1')
      expect(p.floors).toBe(2)
      const storeys = new Set(Object.values(p.solution).map(cellFloor))
      expect(storeys.size, 'both storeys must be occupied').toBe(2)
      expect(countSolutions(p, 5)).toBe(1)
      expect(findMurderer(p)).toBeTruthy()
    })
  }

  it('keeps single-floor tiers single-floor', () => {
    reseed(4242)
    const p = generatePuzzle('Very Easy', 've-floors', 'No. 2')
    expect(p.floors ?? 1).toBe(1)
  })

  it('furnishes rooms in proportion to their area, so big rooms do not look abandoned', () => {
    // Rooms are now 16–24 cells. A flat 1–4 pieces per room left a 20-cell
    // pantry holding a single box. Guard the density that fixed it.
    reseed(4242)
    const p = generatePuzzle('Hard', 'furn-density', 'No. 4')
    const ground = p.rooms.filter(r => (r.floor ?? 0) === 0)
    const cells = ground.reduce((a, r) => a + r.cells.length, 0)
    const pieces = p.furniture.filter(f => (f.floor ?? 0) === 0).length
    expect(pieces, `only ${pieces} pieces across ${cells} cells`).toBeGreaterThanOrEqual(Math.floor(cells / 12))
    // And not so crowded there is nowhere left to stand.
    expect(pieces).toBeLessThan(cells / 2)
  })

  it('builds rooms large enough to read as a floor plan, not a grid of cubicles', () => {
    // The room count is a measured design choice (see DIFF_CONFIG). Guard the
    // property that motivated it: a two-floor board's rooms must be substantial.
    // Before the change these averaged 9.8 cells; the target is ~16.
    reseed(4242)
    const p = generatePuzzle('Hard', 'room-size', 'No. 3')
    const groundRooms = p.rooms.filter(r => (r.floor ?? 0) === 0)
    const avgCells = groundRooms.reduce((a, r) => a + r.cells.length, 0) / groundRooms.length
    expect(avgCells, `rooms averaged ${avgCells.toFixed(1)} cells — too cramped`).toBeGreaterThanOrEqual(12)
    // Sanity in the other direction: one room swallowing a whole storey would
    // make every room clue worthless.
    expect(groundRooms.length).toBeGreaterThanOrEqual(3)
  })
})
