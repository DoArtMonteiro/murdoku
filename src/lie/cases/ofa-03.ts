// One False Alibi, case ofa-03: "The Bell Ringer". The hardest of the three: the lie has no square
// of its own, and no single contradiction names it.
//
// Written from the story backwards. Rui the net mender cut the bell rope for scrap and Gaspar saw
// him do it, down in the Cellar. The alibi a man reaches for is a witness: "I was with Joana." Joana
// kept the Kitchen that night, so the claim sounds easy to believe and hard to test.
//
// The lie is relational (s1, "in the same room as Joana"). What an honest reader can find:
//   * s1 + Joana in the Kitchen (s3) + Tomé in the Kitchen (s5): Rui would be a third person in a
//     room that is only two rows high, where nobody may share a row.
//   * s1 + s3 + Tomé on the counter (s6): the same thing again, so these two collisions share TWO
//     statements, the lie and s3. They cannot yet tell the lie from Joana's account of the Kitchen.
//   * s1 + Joana on the chair (s4) + s5: the third collision does not use s3, so doubting s3 does not
//     explain it away. Only s1 is in all three: that is the elimination which isolates the lie.
// Every one of them leans on the one-per-row rule. None of the three needs a scene fact.
//
// With s1 struck, the other ten statements place everyone only with one lane deduction and two
// supposes (tests/lie/case3.test.ts pins the measure): Marta and Fausto share a room but not much else.
import type { Person, Room } from '../../core/types'
import type { LieCase, Statement } from '../model'
import { at, buildCase, piece, rect } from './build'

const rooms: Room[] = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 1, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 1, 5) },
  { id: 'room2', name: 'Study', hue: 270, cells: rect(2, 3, 3, 5) },
  { id: 'room3', name: 'Courtyard', hue: 95, cells: rect(2, 0, 3, 2) },
  { id: 'room4', name: 'Cellar', hue: 330, cells: rect(4, 0, 5, 5) },
]

const furniture = [
  // Kitchen
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('chair', 1, 0),
  // Workshop
  piece('lamp', 0, 3), piece('desk', 0, 5), piece('plant', 1, 4),
  // Study
  piece('table', 2, 3), piece('clock', 2, 4), piece('bookshelf', 2, 5), piece('sofa', 3, 4, 2, 1),
  // Courtyard
  piece('shrub', 2, 1), piece('plant', 3, 2),
  // Cellar
  piece('box', 4, 1), piece('rug', 4, 4, 2, 2), piece('bed', 5, 0),
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
  { id: 's1', author: 'p0', clue: { kind: 'sameRoomAs', person: 'p0', other: 'p1' }, text: 'In the same room as Joana.', display: 'I was in the same room as Joana, folding dough with her.' },
  { id: 's2', author: 'p0', clue: { kind: 'direction', person: 'p0', other: 'p2', dir: 'W' }, text: 'Somewhere west of Tomé.', display: 'I was somewhere west of Tomé, coiling line.' },
  { id: 's3', author: 'p1', clue: { kind: 'room', person: 'p1', roomId: 'room0' }, text: 'In the Kitchen.', display: 'I was in the Kitchen, minding the bread.' },
  { id: 's4', author: 'p1', clue: { kind: 'onFurniture', person: 'p1', furniture: 'chair' }, text: 'On the chair.', display: 'I sat on the chair, resting my floury hands.' },
  { id: 's5', author: 'p2', clue: { kind: 'room', person: 'p2', roomId: 'room0' }, text: 'In the Kitchen.', display: 'I was in the Kitchen, thawing my fingers.' },
  { id: 's6', author: 'p2', clue: { kind: 'onFurniture', person: 'p2', furniture: 'counter' }, text: 'On the counter.', display: 'I was at the counter, trimming wicks.' },
  { id: 's7', author: 'p3', clue: { kind: 'sameRoomAs', person: 'p3', other: 'p4' }, text: 'In the same room as Fausto.', display: 'I was in the same room as Fausto, stitching sailcloth.' },
  { id: 's8', author: 'p3', clue: { kind: 'besideFurniture', person: 'p3', furniture: 'bookshelf' }, text: 'Beside the bookshelf.', display: 'I stood next to the bookshelf, hunting for a pattern book.' },
  { id: 's9', author: 'p4', clue: { kind: 'besideFurniture', person: 'p4', furniture: 'clock' }, text: 'Beside the clock.', display: 'I stood next to the clock, watching the hour.' },
  { id: 's10', author: 'p4', clue: { kind: 'sameRoomAs', person: 'p4', other: 'p3' }, text: 'In the same room as Marta.', display: 'I was in the same room as Marta, trading gossip.' },
  { id: 's11', author: 'p5', clue: { kind: 'edge', person: 'p5' }, text: 'On the outer edge of the board.', display: 'He was found against an outside wall of the house.', scene: true },
]

export const OFA_03: LieCase = buildCase({
  id: 'ofa-03', title: 'The Bell Ringer', caseNumber: 'One False Alibi 3', difficulty: 'Hard', size: 6,
  flavor: 'The bell rang once at dawn and not again. Eleven accounts, and one of them was bent to fit the night.',
  rooms, furniture, people, victimId: 'p5',
  solution: { p0: at(4, 1), p1: at(1, 0), p2: at(0, 2), p3: at(3, 5), p4: at(2, 3), p5: at(5, 4) },
  statements, lieId: 's1', collisions: [['s1', 's3', 's5'], ['s1', 's3', 's6'], ['s1', 's4', 's5']],
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
