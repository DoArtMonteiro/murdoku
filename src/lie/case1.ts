// One False Alibi, case ofa-01: "Three Mornings Without the Bell".
//
// A 6x6 house in Portinhal with four rooms, five suspects and the victim. Each suspect gives two
// statements; exactly one statement in the whole case is false, and its author is the murderer.
// Found by scripts/lie-search.mjs (node scripts/lie-search.mjs --seed 22 --trials 1500, the 11-statement hit whose lie is "On the counter") and pinned by tests/lie/case1.test.ts, which
// also checks every sentence against the independent literal interpreter in tests/truth/literal.ts.
//
// The hand-play (all of it done by singles, no supposing, once the lie is out):
//   * Inês (the baker) says she stood on the counter in the Kitchen. Lúcia says she stood on the
//     desk. Both are in the top row: collision one, two accounts that cannot both be true.
//   * Inês on the counter also forces Rui, who says he was beside it, onto a square whose column
//     Marta (on the clock) already holds: collision two, with Rui and Marta.
//   * Remove Inês's counter and the other nine statements plus the scene fact solve the whole plan.
import type { Cell, Furniture, FurnitureType, Person, Room } from '../core/types'
import type { LieCase, Statement } from './model'

export const LIE_CASE_1_ID = 'ofa-01'

const rect = (r0: number, c0: number, r1: number, c1: number): Cell[] => {
  const out: Cell[] = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c })
  return out
}

const rooms: Room[] = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 1, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 2, 5) },
  { id: 'room2', name: 'Living Room', hue: 150, cells: rect(2, 0, 5, 2) },
  { id: 'room3', name: 'Courtyard', hue: 95, cells: rect(3, 3, 5, 5) },
]

const roomOf: string[][] = Array.from({ length: 6 }, () => Array<string>(6).fill(''))
for (const room of rooms) for (const c of room.cells) roomOf[c.row][c.col] = room.id

const piece = (type: FurnitureType, row: number, col: number, w = 1, h = 1): Furniture => ({
  type, row, col, w, h, rotation: w < h ? 90 : 0, floor: 0,
})
const furniture: Furniture[] = [
  // Kitchen
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('table', 1, 1), piece('chair', 1, 2),
  // Workshop
  piece('desk', 0, 4), piece('lamp', 1, 5), piece('box', 2, 3), piece('chair', 2, 5),
  // Living Room
  piece('bookshelf', 2, 0), piece('clock', 2, 2), piece('sofa', 3, 1, 2, 1), piece('rug', 4, 0, 2, 2), piece('plant', 5, 2),
  // Courtyard
  piece('shrub', 3, 5), piece('table', 4, 4), piece('box', 5, 3),
]

const people: Person[] = [
  { id: 'p0', name: 'Rui', avatarSeed: 'Rui-ofa1-0', accent: '#6E8CA0' },
  { id: 'p1', name: 'Inês', avatarSeed: 'Ines-ofa1-1', accent: '#B08D57' },
  { id: 'p2', name: 'Tomé', avatarSeed: 'Tome-ofa1-2', accent: '#8A7CA8' },
  { id: 'p3', name: 'Marta', avatarSeed: 'Marta-ofa1-3', accent: '#7E9C6E' },
  { id: 'p4', name: 'Lúcia', avatarSeed: 'Lucia-ofa1-4', accent: '#A8706E' },
  { id: 'p5', name: 'Álvaro', avatarSeed: 'Alvaro-ofa1-5', accent: '#9C7F6E', isVictim: true },
]

const at = (row: number, col: number): Cell => ({ row, col, floor: 0 })

/** Every statement in reading order, the false one (s3) included. Scene facts are the victim's. */
export const statements: Statement[] = [
  { id: 's1', author: 'p0', clue: { kind: 'besideFurniture', person: 'p0', furniture: 'counter' }, text: 'Beside the counter.', voice: 'I was mending nets until my fingers cramped.' },
  { id: 's2', author: 'p0', clue: { kind: 'direction', person: 'p0', other: 'p1', dir: 'W' }, text: 'Somewhere west of Inês.', voice: 'I keep to my own business, and the harbour keeps to its own.' },
  { id: 's3', author: 'p1', clue: { kind: 'onFurniture', person: 'p1', furniture: 'counter' }, text: 'On the counter.', voice: 'Bread does not wait for gossip, so neither did I.' },
  { id: 's4', author: 'p1', clue: { kind: 'edge', person: 'p1' }, text: 'On the outer edge of the board.', voice: 'My sleeves were white with flour by the end of it.' },
  { id: 's5', author: 'p2', clue: { kind: 'onFurniture', person: 'p2', furniture: 'rug' }, text: 'On the rug.', voice: 'Somebody has to light the quay before the fog does.' },
  { id: 's6', author: 'p2', clue: { kind: 'notRoom', person: 'p2', roomId: 'room1' }, text: 'Never set foot in the Workshop.', voice: 'I would sooner swallow a hook than tell you a story.' },
  { id: 's7', author: 'p3', clue: { kind: 'onFurniture', person: 'p3', furniture: 'clock' }, text: 'On the clock.', voice: 'Sailcloth does not stitch itself, whatever they say.' },
  { id: 's8', author: 'p3', clue: { kind: 'room', person: 'p3', roomId: 'room2' }, text: 'In the Living Room.', voice: 'I was where my work was, and that is all I will say.' },
  { id: 's9', author: 'p4', clue: { kind: 'onFurniture', person: 'p4', furniture: 'desk' }, text: 'On the desk.', voice: 'Everything I witness goes into my ledger, and I witnessed this.' },
  { id: 's10', author: 'p4', clue: { kind: 'direction', person: 'p4', other: 'p0', dir: 'N' }, text: 'Somewhere north of Rui.', voice: 'My ink was still wet when you knocked.' },
  { id: 's11', author: 'p5', clue: { kind: 'besideFurniture', person: 'p5', furniture: 'box' }, text: 'Beside a box.', voice: 'His keys were still in his hand and his ledger lay open.', scene: true },
]

const LIE_ID = 's3'

export const LIE_CASE_1: LieCase = {
  id: LIE_CASE_1_ID,
  puzzle: {
    id: LIE_CASE_1_ID,
    title: 'Three Mornings Without the Bell',
    caseNumber: 'One False Alibi 1',
    difficulty: 'Medium',
    size: 6,
    rooms,
    roomOf,
    furniture,
    people,
    clues: [
      ...statements.filter(s => s.id !== LIE_ID).map(s => ({ clue: s.clue, text: s.text })),
      { clue: { kind: 'victim', person: 'p5' }, text: 'The victim — found alone with the murderer.' },
    ],
    solution: { p0: at(1, 1), p1: at(3, 5), p2: at(5, 0), p3: at(2, 2), p4: at(0, 4), p5: at(4, 3) },
    victimId: 'p5',
    murdererId: 'p1',
    flavor: 'The harbour bell has not rung for three mornings. Ten accounts, and one of them was bent to fit the night.',
    source: 'custom',
  },
  statements,
  lieId: LIE_ID,
  collisions: [['s3', 's9'], ['s3', 's1', 's7']],
  story: {
    title: 'Three Mornings Without the Bell',
    premise:
      'Portinhal keeps its hours by the harbour bell, and for three mornings now the bell has stayed silent. The harbour master was the last to touch its rope, and he will not touch anything again. Everyone who was about that night gave me an account, and a town this small tells the truth by habit and bends it only when it must.',
    closing:
      '{M} bent one account to fit the night, and nine honest ones stood against it. {V} will not sign another order, but Portinhal will sleep easier knowing whose hand it was. By Sunday the bell will ring again.',
    cast: {
      p0: { name: 'Rui', role: 'Net mender', emblem: 'net', motive: 'Owed the harbour master a season of mooring dues, and had been told the debt would be called before the harvest festival.' },
      p1: { name: 'Inês', role: 'Baker', emblem: 'bread', motive: 'The harbour master kept a ledger of loaves never paid for, and meant to read it aloud at the town meeting.' },
      p2: { name: 'Tomé', role: 'Lamplighter', emblem: 'lantern', motive: 'Was told the quay lights would be taken from his keeping, and knew exactly whose signature was on the order.' },
      p3: { name: 'Marta', role: 'Sailmaker', emblem: 'needle', motive: 'Her finest sails were promised to the harbour board until the harbour master quietly cancelled the order.' },
      p4: { name: 'Lúcia', role: 'Notary', emblem: 'quill', motive: 'Had witnessed a will the harbour master wanted changed, and refused to change it.' },
      p5: { name: 'Álvaro', role: 'Harbour master', emblem: 'compass', motive: 'Held the keys to every mooring and every secret in the harbour, and mistook the second for a privilege.' },
    },
  },
}
