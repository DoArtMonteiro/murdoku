import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { candidateClues, clueToText } from '../../src/core/generate'
import type { Clue, Puzzle } from '../../src/core/types'
import { SentenceError, buildModel, holdsIn, judge, parseSentence, storedSolution } from './literal'
import type { Pos } from './literal'

const puzzles = getAllPuzzles()

// A tiny hand-made two-storey house for sentence-by-sentence checks.
//
//   ground (floor 0)           upstairs (floor 1)
//   R0 R0 | R1 R1              R4 R4 | R5 R5
//   R0 R0 | R1 R1              R4 R4 | R5 R5
//   ------+------              ------+------
//   R2 R2 | R3 R3              R6 R6 | R7 R7
//   R2 R2 | R3 R3              R6 R6 | R7 R7
function house(): Puzzle {
  const names = ['Hall', 'Study', 'Kitchen', 'Pantry', 'Bedroom', 'Bath', 'Nook', 'Attic']
  const cellsOf = (i: number) => {
    const floor = i < 4 ? 0 : 1
    const k = i % 4
    const r0 = k < 2 ? 0 : 2, c0 = k % 2 === 0 ? 0 : 2
    return [0, 1].flatMap(dr => [0, 1].map(dc => ({ row: r0 + dr, col: c0 + dc, floor })))
  }
  const rooms = names.map((name, i) => ({ id: `r${i}`, name, hue: 0, cells: cellsOf(i), floor: i < 4 ? 0 : 1 }))
  const grid = (floor: number) => {
    const g = Array.from({ length: 4 }, () => new Array<string>(4).fill(''))
    rooms.filter(r => r.floor === floor).forEach(r => r.cells.forEach(c => { g[c.row][c.col] = r.id }))
    return g
  }
  return {
    id: 'house', title: 't', caseNumber: 'c', difficulty: 'Hard', size: 4, floors: 2,
    rooms, roomOf: grid(0), roomOfByFloor: [grid(0), grid(1)],
    furniture: [
      { type: 'sofa', row: 0, col: 0, w: 2, h: 1, floor: 0 },   // Hall, cells (0,0),(0,1)
      { type: 'lamp', row: 0, col: 2, floor: 0 },               // Study
      { type: 'lamp', row: 3, col: 3, floor: 0 },               // Pantry  (two lamps in the house)
      { type: 'tv', row: 2, col: 1, floor: 0 },                 // Kitchen
      { type: 'clock', row: 0, col: 3, floor: 1 },              // Bath (upstairs)
    ],
    people: [
      { id: 'a', name: 'Ann', avatarSeed: '', accent: '' },
      { id: 'b', name: 'Bo', avatarSeed: '', accent: '', isVictim: true },
      { id: 'c', name: 'Cy', avatarSeed: '', accent: '' },
    ],
    clues: [], solution: { a: { row: 0, col: 0 }, b: { row: 1, col: 2 }, c: { row: 3, col: 1, floor: 1 } },
    victimId: 'b', murdererId: 'a', flavor: '',
  }
}
const at = (f: number, r: number, c: number): Pos => ({ f, r, c })

function holds(p: Puzzle, sentence: string, person: string, asg: Record<string, Pos>): boolean {
  const m = buildModel(p)
  return holdsIn(m, parseSentence(m, person, sentence), asg)
}

describe('the interpreter fails on what it cannot read', () => {
  const p = house()
  const m = buildModel(p)

  it('rejects an unknown sentence form instead of skipping it', () => {
    for (const bad of ['Somewhere nearby.', 'Near the TV.', 'Against a wall (on the edge).', 'In a corner.', 'On a unicorn.', 'In the Dungeon.', 'Directly above the Dungeon.', 'Right beside Zed.', 'Exactly one row west of Bo.']) {
      expect(() => parseSentence(m, 'a', bad), bad).toThrow(SentenceError)
    }
  })

  it('rejects "the" for a thing that exists more than once, and accepts it when unique', () => {
    expect(() => parseSentence(m, 'a', 'On the lamp.')).toThrow(/ambiguous/)
    expect(() => parseSentence(m, 'a', 'Beside the lamp.')).toThrow(/ambiguous/)
    expect(() => parseSentence(m, 'a', 'On a lamp.')).not.toThrow()
    expect(() => parseSentence(m, 'a', 'Beside the TV.')).not.toThrow()
  })

  it('rejects a thing the house does not contain', () => {
    expect(() => parseSentence(m, 'a', 'On a fridge.')).toThrow(/no fridge/)
  })

  it('rejects a duplicated room name or person name', () => {
    const dup: Puzzle = { ...p, rooms: p.rooms.map((r, i) => (i === 1 ? { ...r, name: 'Hall' } : r)) }
    expect(() => parseSentence(buildModel(dup), 'a', 'In the Hall.')).toThrow(/2 rooms/)
    const dupPeople: Puzzle = { ...p, people: p.people.map(x => ({ ...x, name: 'Ann' })) }
    expect(() => parseSentence(buildModel(dupPeople), 'a', 'Right beside Ann.')).toThrow(/3 people/)
  })
})

describe('"Beside" means: a piece you are not on, touching you, in your own room', () => {
  const p = house()
  const others = { b: at(0, 3, 0), c: at(1, 3, 1) } // out of the way

  it('is true next to a piece, in the same room', () => {
    expect(holds(p, 'Beside the TV.', 'a', { ...others, a: at(0, 2, 0) })).toBe(true) // (2,0) touches TV at (2,1), both Kitchen
    expect(holds(p, 'Beside the TV.', 'a', { ...others, a: at(0, 3, 1) })).toBe(true)
  })
  it('is false when standing on the piece', () => {
    expect(holds(p, 'Beside the TV.', 'a', { ...others, a: at(0, 2, 1) })).toBe(false)
  })
  it('is false for the other half of a two-cell piece you stand on', () => {
    expect(holds(p, 'Beside the sofa.', 'a', { ...others, a: at(0, 0, 0) })).toBe(false) // on the sofa, next to its other cell
    expect(holds(p, 'Beside the sofa.', 'a', { ...others, a: at(0, 1, 0) })).toBe(true)  // below the sofa, same room
  })
  it('is false through a wall into the next room', () => {
    // the Study lamp at (0,2) is orthogonally next to Hall cell (0,1), but it is in another room
    expect(holds(p, 'Beside a lamp.', 'a', { ...others, a: at(0, 0, 1) })).toBe(false)
    expect(holds(p, 'Beside a lamp.', 'a', { ...others, a: at(0, 1, 2) })).toBe(true)
  })
  it('is false diagonally and false from the other storey', () => {
    expect(holds(p, 'Beside the TV.', 'a', { ...others, a: at(0, 3, 0) })).toBe(false) // diagonal to (2,1)
    expect(holds(p, 'Beside the TV.', 'a', { ...others, a: at(1, 2, 0) })).toBe(false) // directly above the Kitchen
  })
  it('"a lamp" is satisfied by either lamp', () => {
    expect(holds(p, 'Beside a lamp.', 'a', { ...others, a: at(0, 2, 3) })).toBe(true) // next to the Pantry lamp (3,3)
  })
})

describe('floors: above and below need a storey to exist', () => {
  const p = house()
  const asg = (a: Pos) => ({ a, b: at(0, 1, 2), c: at(0, 3, 3) })
  it('"Directly above the <room>" needs a storey below', () => {
    expect(holds(p, 'Directly above the Kitchen.', 'a', asg(at(1, 2, 0)))).toBe(true)   // (2,0) is Kitchen downstairs
    expect(holds(p, 'Directly above the Kitchen.', 'a', asg(at(1, 0, 0)))).toBe(false)  // below it is the Hall
    expect(holds(p, 'Directly above the Hall.', 'a', asg(at(0, 0, 0)))).toBe(false)      // nothing is below the ground floor
  })
  it('"Directly below the <room>" needs a storey above, and the room must be the one above', () => {
    expect(holds(p, 'Directly below the Nook.', 'a', asg(at(0, 2, 0)))).toBe(true)       // (2,0) upstairs is Nook (R6)
    expect(holds(p, 'Directly below the Nook.', 'a', asg(at(0, 0, 0)))).toBe(false)
    expect(holds(p, 'Directly below the Kitchen.', 'a', asg(at(1, 2, 0)))).toBe(false)   // the top storey has nothing above it
    expect(holds(p, 'Directly below the Hall.', 'a', asg(at(1, 0, 0)))).toBe(false)      // Hall is on the ground floor, never above anyone
  })
  it('"Directly above/below <person>" means same row and column, one storey apart', () => {
    expect(holds(p, 'Directly above Bo.', 'a', { a: at(1, 1, 2), b: at(0, 1, 2), c: at(0, 3, 3) })).toBe(true)
    expect(holds(p, 'Directly above Bo.', 'a', { a: at(0, 1, 2), b: at(1, 1, 2), c: at(0, 3, 3) })).toBe(false)
    expect(holds(p, 'Directly below Bo.', 'a', { a: at(0, 1, 2), b: at(1, 1, 2), c: at(0, 3, 3) })).toBe(true)
    expect(holds(p, 'Directly below Bo.', 'a', { a: at(0, 1, 1), b: at(1, 1, 2), c: at(0, 3, 3) })).toBe(false)
  })
})

describe('rows, columns, edge, corner, rooms, people', () => {
  const p = house()
  const rest = { b: at(0, 1, 2), c: at(0, 3, 3) }
  it('number rows and columns from 1, top row first', () => {
    expect(holds(p, 'In the top row.', 'a', { ...rest, a: at(0, 0, 0) })).toBe(true)
    expect(holds(p, 'In row 2.', 'a', { ...rest, a: at(0, 1, 0) })).toBe(true)
    expect(holds(p, 'In the bottom row.', 'a', { ...rest, a: at(0, 3, 0) })).toBe(true)
    expect(holds(p, 'In the leftmost column.', 'a', { ...rest, a: at(0, 2, 0) })).toBe(true)
    expect(holds(p, 'In column 3.', 'a', { ...rest, a: at(0, 2, 2) })).toBe(true)
    expect(holds(p, 'In the rightmost column.', 'a', { ...rest, a: at(0, 2, 3) })).toBe(true)
    expect(() => parseSentence(buildModel(p), 'a', 'In row 5.')).toThrow(SentenceError)
  })
  it('"outer edge" is the board outline only, "corner" is one of four cells', () => {
    expect(holds(p, 'On the outer edge of the board.', 'a', { ...rest, a: at(0, 0, 2) })).toBe(true)
    expect(holds(p, 'On the outer edge of the board.', 'a', { ...rest, a: at(0, 1, 1) })).toBe(false) // interior, even though it touches a room wall
    expect(holds(p, 'In a corner of the board.', 'a', { ...rest, a: at(0, 0, 3) })).toBe(true)
    expect(holds(p, 'In a corner of the board.', 'a', { ...rest, a: at(0, 0, 2) })).toBe(false)
  })
  it('rooms and people', () => {
    expect(holds(p, 'In the Study.', 'a', { ...rest, a: at(0, 0, 2) })).toBe(true)
    expect(holds(p, 'Never set foot in the Study.', 'a', { ...rest, a: at(0, 0, 2) })).toBe(false)
    expect(holds(p, 'In the same room as Bo.', 'a', { ...rest, a: at(0, 0, 3) })).toBe(true)  // Bo at (1,2) is Study
    expect(holds(p, 'Was not in the same room as Bo.', 'a', { ...rest, a: at(0, 0, 0) })).toBe(true)
    expect(holds(p, 'Right beside Bo.', 'a', { ...rest, a: at(0, 0, 2) })).toBe(true)
    expect(holds(p, 'Right beside Bo.', 'a', { ...rest, a: at(0, 0, 3) })).toBe(false)         // diagonal
    expect(holds(p, 'Right beside Bo.', 'a', { b: at(1, 1, 2), a: at(0, 0, 2), c: at(0, 3, 3) })).toBe(false) // other storey
  })
  it('direction sentences compare rows or columns only', () => {
    expect(holds(p, 'Exactly one row north of Bo.', 'a', { ...rest, a: at(0, 0, 0) })).toBe(true)
    expect(holds(p, 'Exactly one row south of Bo.', 'a', { ...rest, a: at(0, 2, 0) })).toBe(true)
    expect(holds(p, 'Exactly one column west of Bo.', 'a', { ...rest, a: at(0, 3, 1) })).toBe(true)
    expect(holds(p, 'Exactly 2 columns east of Bo.', 'a', { b: at(0, 1, 0), a: at(0, 0, 2), c: at(0, 3, 3) })).toBe(true)
    expect(holds(p, 'Somewhere north of Bo.', 'a', { ...rest, a: at(0, 0, 3) })).toBe(true)
    expect(holds(p, 'Somewhere east of Bo.', 'a', { ...rest, a: at(0, 3, 3), c: at(0, 0, 0) })).toBe(true)
  })
  it('"The only person on a lamp" excludes everyone else on any lamp', () => {
    expect(holds(p, 'The only person on a lamp.', 'a', { a: at(0, 0, 2), b: at(0, 1, 0), c: at(0, 2, 1) })).toBe(true)
    expect(holds(p, 'The only person on a lamp.', 'a', { a: at(0, 0, 2), b: at(0, 3, 3), c: at(0, 2, 1) })).toBe(false)
  })
})

describe('every clue the generator could print, not just the ones it chose, is literally true', () => {
  for (const p of puzzles) {
    it(`${p.id}: all ${candidateClues(p).length} candidate sentences hold at the stored solution`, () => {
      const m = buildModel(p)
      const sol = storedSolution(p)
      const kinds = new Set<string>()
      for (const clue of candidateClues(p)) {
        const text = clueToText(p, clue)
        const pc = parseSentence(m, clue.person, text)
        expect(holdsIn(m, pc, sol), `${p.id} ${clue.person}: ${text}`).toBe(true)
        kinds.add(clue.kind)
      }
      expect(kinds.size).toBeGreaterThan(5)
    })
  }

  it('besideAny and every other kind the generator can word parses to the rule it names', () => {
    const p = puzzles.find(x => x.id === 'hard-1')!
    const m = buildModel(p)
    const sample: [Clue, string][] = [
      [{ kind: 'besideAny', person: 'p0', furniture: ['plant', 'chair'] }, 'beside'],
      [{ kind: 'direction', person: 'p0', other: 'p1', dir: 'N', steps: 1 }, 'offset'],
      [{ kind: 'direction', person: 'p0', other: 'p1', dir: 'E' }, 'offset'],
      [{ kind: 'besidePerson', person: 'p0', other: 'p1' }, 'besidePerson'],
      [{ kind: 'sameRoomAs', person: 'p0', other: 'p1' }, 'sameRoom'],
      [{ kind: 'notSameRoomAs', person: 'p0', other: 'p1' }, 'notSameRoom'],
      [{ kind: 'above', person: 'p0', target: 'p1', targetKind: 'person' }, 'abovePerson'],
      [{ kind: 'below', person: 'p0', target: 'p1', targetKind: 'person' }, 'belowPerson'],
      [{ kind: 'floor', person: 'p0', floorNum: 0 }, 'floor'],
      [{ kind: 'victim', person: p.victimId }, 'victimMark'],
    ]
    for (const [clue, rule] of sample) {
      expect(parseSentence(m, clue.person, clueToText(p, clue)).rule.t, clueToText(p, clue)).toBe(rule)
    }
  })

  it('the catalog as a whole uses a wide vocabulary (the suite is not vacuous)', () => {
    const seen = new Set<string>()
    for (const p of puzzles) for (const pc of judge(p).parsed) seen.add(pc.rule.t)
    for (const t of ['room', 'notRoom', 'on', 'onlyOn', 'beside', 'row', 'col', 'edge', 'corner', 'floor', 'aboveRoom', 'belowRoom', 'sameRoom', 'victimMark']) {
      expect(seen.has(t), `no catalog clue of kind ${t}`).toBe(true)
    }
  })
})
