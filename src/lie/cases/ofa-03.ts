// One False Alibi, case ofa-03: "The Bell Ringer". The hardest of the three: the lie has no square
// of its own, and no single contradiction names it.
//
// Written from the story backwards. Rui the net mender cut the bell rope for scrap and Gaspar saw
// him do it, down in the Cellar. The alibi a man reaches for is a witness: "I was with Joana." Joana
// kept the Kitchen that night, so the claim sounds easy to believe and hard to test.
//
// The lie is relational (s2, "in the same room as Joana") and names no place. If it were true Rui
// would be in the Kitchen, the one room three people can share. What an honest reader can find:
//   * s2 + Joana beside the table (s3) + Marta at the desk (s7) + Marta west of Rui (s8): Marta sits
//     in the Study, so Rui, in the Kitchen, cannot be east of her. Lane-free.
//   * s2 + s3 + Fausto on the sofa (s9) + Fausto west of Rui (s10): the same argument through a
//     second witness. Lane-free. These two share TWO statements, the lie and s3, so they cannot yet
//     tell the lie from Joana's account of the table.
//   * s2 + Tomé with Joana (s6) + s10: three people in the Kitchen leave Fausto no column west of
//     Rui. This one does not use s3, so only s2 is in all three: that is the elimination.
// Every speaker's two statements say different things (checked by verifyLieCase): no account is a
// restatement of the other. With s2 struck the other nine statements place everyone only with a
// lane deduction and a suppose (tests/lie/case3.test.ts pins the measure).
import type { Person, Room } from '../../core/types'
import type { LieCase, Statement } from '../model'
import { at, buildCase, piece, rect } from './build'

const rooms: Room[] = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 2, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 1, 5) },
  { id: 'room2', name: 'Study', hue: 270, cells: rect(2, 3, 3, 5) },
  { id: 'room3', name: 'Courtyard', hue: 95, cells: rect(3, 0, 3, 2) },
  { id: 'room4', name: 'Cellar', hue: 330, cells: rect(4, 0, 5, 5) },
]

const furniture = [
  // Kitchen
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('table', 2, 0), piece('chair', 1, 2),
  // Workshop
  piece('lamp', 0, 3), piece('plant', 1, 4),
  // Study
  piece('desk', 2, 3), piece('bookshelf', 2, 5), piece('clock', 3, 3), piece('sofa', 3, 4, 2, 1),
  // Courtyard
  piece('shrub', 3, 0), piece('plant', 3, 2),
  // Cellar
  piece('bed', 4, 0), piece('box', 4, 3), piece('rug', 5, 1, 2, 1),
]

const people: Person[] = [
  { id: 'p0', name: 'Rui', avatarSeed: 'Rui-ofa3-0', accent: '#6E8CA0' },
  { id: 'p1', name: 'Joana', avatarSeed: 'Joana-ofa3-1', accent: '#B08D57' },
  { id: 'p2', name: 'Tomé', avatarSeed: 'Tome-ofa3-2', accent: '#8A7CA8' },
  { id: 'p3', name: 'Marta', avatarSeed: 'Marta-ofa3-3', accent: '#7E9C6E' },
  { id: 'p4', name: 'Fausto', avatarSeed: 'Fausto-ofa3-4', accent: '#A8706E' },
  { id: 'p5', name: 'Gaspar', avatarSeed: 'Gaspar-ofa3-5', accent: '#9C7F6E', isVictim: true },
]

/** Every statement in reading order, the false one (s1) included. Scene facts are the victim's. */
export const statements: Statement[] = [
  { id: 's1', author: 'p0', clue: { kind: 'notRoom', person: 'p0', roomId: 'room3' }, text: 'Never set foot in the Courtyard.', display: 'I never set foot in the Courtyard.' },
  { id: 's2', author: 'p0', clue: { kind: 'sameRoomAs', person: 'p0', other: 'p1' }, text: 'In the same room as Joana.', display: 'I was in the same room as Joana, folding dough with her.' },
  { id: 's3', author: 'p1', clue: { kind: 'besideFurniture', person: 'p1', furniture: 'table' }, text: 'Beside the table.', display: 'I stood next to the table, shaping loaves.' },
  { id: 's4', author: 'p1', clue: { kind: 'besideFurniture', person: 'p1', furniture: 'stove' }, text: 'Beside the stove.', display: 'I was right by the stove, watching the crust.' },
  { id: 's5', author: 'p2', clue: { kind: 'besideFurniture', person: 'p2', furniture: 'stove' }, text: 'Beside the stove.', display: 'I stood next to the stove, warming my hands.' },
  { id: 's6', author: 'p2', clue: { kind: 'sameRoomAs', person: 'p2', other: 'p1' }, text: 'In the same room as Joana.', display: 'I was in the same room as Joana, trimming wicks.' },
  { id: 's7', author: 'p3', clue: { kind: 'onFurniture', person: 'p3', furniture: 'desk' }, text: 'On the desk.', display: 'I was at the desk, drawing up a sail plan.' },
  { id: 's8', author: 'p3', clue: { kind: 'direction', person: 'p3', other: 'p0', dir: 'W' }, text: 'Somewhere west of Rui.', display: 'I was somewhere west of Rui, with sailcloth over my knees.' },
  { id: 's9', author: 'p4', clue: { kind: 'onFurniture', person: 'p4', furniture: 'sofa' }, text: 'On the sofa.', display: 'I was on the sofa, tallying rope and chain.' },
  { id: 's10', author: 'p4', clue: { kind: 'direction', person: 'p4', other: 'p0', dir: 'W' }, text: 'Somewhere west of Rui.', display: 'I was somewhere west of Rui, counting chain.' },
  { id: 's11', author: 'p5', clue: { kind: 'edge', person: 'p5' }, text: 'On the outer edge of the board.', display: 'He was found against an outside wall of the house.', scene: true },
]

export const OFA_03: LieCase = buildCase({
  id: 'ofa-03', title: 'The Bell Ringer', caseNumber: 'One False Alibi 3', difficulty: 'Hard', size: 6,
  flavor: 'The bell rang once at dawn and not again. Eleven accounts, and one of them was bent to fit the night.',
  rooms, furniture, people, victimId: 'p5',
  solution: { p0: at(4, 5), p1: at(1, 0), p2: at(0, 1), p3: at(2, 3), p4: at(3, 4), p5: at(5, 2) },
  statements, lieId: 's2', collisions: [['s2', 's3', 's7', 's8'], ['s2', 's3', 's9', 's10'], ['s2', 's6', 's10']],
  story: {
    title: 'The Bell Ringer',
    premise: 'The man who rang Portinhal’s bell for forty years was found at the foot of his own tower, and the bell has been silent since. I took every account in the harbour before dawn.',
    closing: '{M} borrowed a witness for the night, and honest accounts had no place for a third. {V} rang the hours for forty years; on Sunday another hand will pull the rope, and Portinhal will hear its bell again. The key from the notary’s drawer still fits no lock in town.',
    cast: {
      p0: { name: 'Rui', role: 'Net mender', emblem: 'net', motive: 'Sold the old bell rope for scrap and was seen doing it.' },
      p1: { name: 'Joana', role: 'Baker', emblem: 'bread', motive: 'Fed the bell ringer on credit for years, and was said to resent it.' },
      p2: { name: 'Tomé', role: 'Lamplighter', emblem: 'lantern', motive: 'Quarrelled with the bell ringer over who paid for the tower’s oil.' },
      p3: { name: 'Marta', role: 'Sailmaker', emblem: 'needle', motive: 'Stitched the cloth that muffles the bell, and was told to stop.' },
      p4: { name: 'Fausto', role: 'Chandler', emblem: 'scales', motive: 'Supplied the tower with chain and was never paid for it.' },
      p5: { name: 'Gaspar', role: 'Bell ringer', emblem: 'bell', motive: 'Rang the hours for forty years and knew whose hand had touched the rope.' },
    },
  },
})
