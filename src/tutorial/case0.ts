// Case 0: the hand-built first-run case for the Alibi casebook. A 4x4, one-floor
// house with three suspects and the victim, built by hand and pinned by tests
// (tests/tutorial/case0.test.ts): one solution, every statement true, and the
// clue text readable by the independent literal interpreter.
//
// The design is the lesson. Every beat of the walk-through is the genuine
// logical path, not a script laid over a puzzle:
//   1  Lena is pinned by her own statement: the lens lights one square.
//   2  Tomas has "2 rows north of Lena": usable only once Lena stands somewhere.
//   3  Greta's two statements leave two squares. Supposing the wrong one takes
//      the column of the victim's only square, so the game answers "No square
//      left for Marco". The victim is deliberately NOT on the plan yet: that is
//      what makes the contradiction a deduction and not a lane that is already taken.
//   4  The victim goes last, on the one square left, and the one suspect alone
//      with him in a room is the murderer.
import type { Cell, Furniture, FurnitureType, Person, Puzzle, Room } from '../core/types'
import type { CaseStory } from '../casebook/stories'

export const CASE0_ID = 'case-0'

/** Roles in the walk-through, by person id. */
export const ROLE = { pinned: 'p0', measured: 'p1', supposed: 'p2', victim: 'p3' } as const

const rect = (r0: number, c0: number, r1: number, c1: number): Cell[] => {
  const out: Cell[] = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c })
  return out
}

const rooms: Room[] = [
  { id: 'room0', name: 'Study', hue: 150, cells: rect(0, 0, 1, 1) },
  { id: 'room1', name: 'Kitchen', hue: 20, cells: rect(0, 2, 1, 3) },
  { id: 'room2', name: 'Hall', hue: 210, cells: rect(2, 0, 3, 3) },
]

const roomOf: string[][] = Array.from({ length: 4 }, () => Array<string>(4).fill(''))
for (const room of rooms) for (const c of room.cells) roomOf[c.row][c.col] = room.id

const piece = (type: FurnitureType, row: number, col: number): Furniture => ({ type, row, col, w: 1, h: 1, rotation: 0, floor: 0 })
const furniture: Furniture[] = [
  piece('lamp', 0, 0), piece('desk', 1, 0), piece('stove', 0, 3), piece('fridge', 1, 3),
  piece('clock', 3, 0), piece('chair', 3, 2), piece('plant', 2, 3),
]

const people: Person[] = [
  { id: 'p0', name: 'Lena', avatarSeed: 'Lena-c0-0', accent: '#B08D57' },
  { id: 'p1', name: 'Tomas', avatarSeed: 'Tomas-c0-1', accent: '#6E8CA0' },
  { id: 'p2', name: 'Greta', avatarSeed: 'Greta-c0-2', accent: '#8A7CA8' },
  { id: 'p3', name: 'Marco', avatarSeed: 'Marco-c0-3', accent: '#9C7F6E', isVictim: true },
]

const at = (row: number, col: number): Cell => ({ row, col, floor: 0 })

export const case0: Puzzle = {
  id: CASE0_ID,
  title: 'The Bell Rang Once',
  caseNumber: 'Case 0',
  difficulty: 'Very Easy',
  size: 4,
  rooms,
  roomOf,
  furniture,
  people,
  clues: [
    { clue: { kind: 'onFurniture', person: 'p0', furniture: 'clock' }, text: 'On the clock.' },
    { clue: { kind: 'direction', person: 'p1', other: 'p0', dir: 'N', steps: 2 }, text: 'Exactly 2 rows north of Lena.' },
    { clue: { kind: 'besideFurniture', person: 'p1', furniture: 'desk' }, text: 'Beside the desk.' },
    { clue: { kind: 'room', person: 'p2', roomId: 'room1' }, text: 'In the Kitchen.' },
    { clue: { kind: 'row', person: 'p2', row: 0 }, text: 'In the top row.' },
    { clue: { kind: 'onFurniture', person: 'p3', furniture: 'plant' }, text: 'On the plant.' },
    { clue: { kind: 'victim', person: 'p3' }, text: 'The victim — found alone with the murderer.' },
  ],
  solution: { p0: at(3, 0), p1: at(1, 1), p2: at(0, 2), p3: at(2, 3) },
  victimId: 'p3',
  murdererId: 'p0',
  flavor: 'The harbour bell rang once, out of turn. Four true accounts, and only one of them keeps a person alone with the ringer.',
  source: 'custom',
}

/** The square the walk-through asks the player to suppose Greta on: one of her two lit squares, and the wrong one. */
export const WRONG_SQUARE: Cell = at(0, 3)

/** Non-positional story slots, in the Portinhal voice of the season. Checked by tests/tutorial/case0.test.ts. */
export const case0Story: CaseStory = {
  title: 'The Bell Rang Once',
  premise:
    'Portinhal sets its hours by the harbour bell, and nobody rings it without the whole town knowing whose hand was on the rope. Last night the bell sounded once, out of turn, and by morning the ringer would never ring it again.',
  closing:
    'Nobody lied to me, and nobody had to. Four true accounts, and only one of them kept a person alone with the ringer.',
  murderer: 'p0',
  cast: {
    p0: { name: 'Lena', role: "Ship's chandler", oneLiner: 'Sells rope by the fathom and promises by the dozen.', motive: 'A rope sold to the ringer, and a debt for it that he meant to raise.' },
    p1: { name: 'Tomas', role: 'Fishmonger', oneLiner: 'Weighs the catch with one thumb and the truth with both.', motive: "A short weight in the ringer's order, and a grudge that outlived it." },
    p2: { name: 'Greta', role: 'Lamplighter', oneLiner: 'Lights the quay at dusk and knows who is not at home by who is not lit.', motive: 'An order from the ringer to leave the quay unlit, and a reason she never heard.' },
    p3: { name: 'Marco', role: 'Bell-ringer', oneLiner: 'Rang the hours for thirty years and never once rang them late.', motive: 'A man with nothing to gain and a great deal to say.' },
  },
}

/** The investigator's line, said before the first move. In voice, and it names the rule the case teaches. {V} is the victim: fillNames() puts the shown name there (story text never holds a cast name). */
export const INVESTIGATOR_LINE = 'Nobody here lied to me. I only have to find whose true account leaves a suspect alone with {V}.'
