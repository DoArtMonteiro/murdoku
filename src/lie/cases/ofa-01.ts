// One False Alibi, case ofa-01: "The Silent Bell". The first case: small, and every minimal
// contradiction in it is one a reader can follow by hand.
//
// Written from the story backwards. Inês the baker was in the harbour master's Office when he
// died, because he meant to read her unpaid-loaves ledger at the town meeting. The alibi a baker
// reaches for is her own counter: "I was at the counter." The counter lies along the top wall of
// the Kitchen.
//
// The case has exactly four minimal contradictions (tests/lie/case1.test.ts pins the list). Every
// one passes the "legible" test (it needs at most one of the row rule and a scene fact), and the
// lie is proved by any two of them that include the pair:
//   * s1 + s4 (Rui somewhere north of Inês, Inês at the counter): the counter is in the top row, and
//     nothing is north of the top row. A pair, lane-free.
//   * s4 + s5 + s6 (Inês at the counter, Tomé never in a room with Inês, Tomé on the chair): the
//     chair and the counter are both in the Kitchen. A triple through one witness, lane-free. The
//     stored collisions are these two; they meet only in s4.
//   * s3 + s4 + s6 (Inês's own "never with Tomé", the counter, the chair): lane-free as well.
//   * s2 + s4 + s6 (Rui beside the lamp, the counter, Tomé on the chair): a triple that leans on the
//     row rule only.
// With s4 struck, the other nine statements place everyone by singles: this is the easy case.
import type { Person, Room } from '../../core/types'
import type { LieCase, Statement } from '../model'
import { at, buildCase, piece, rect } from './build'

const rooms: Room[] = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 1, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 2, 4) },
  { id: 'room2', name: 'Office', hue: 270, cells: rect(2, 0, 4, 1) },
  { id: 'room3', name: 'Porch', hue: 95, cells: [...rect(2, 2, 2, 2), ...rect(3, 2, 4, 4)] },
]

const furniture = [
  // Kitchen
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('table', 1, 1), piece('chair', 1, 2),
  // Workshop
  piece('lamp', 0, 3), piece('box', 0, 4), piece('plant', 1, 4),
  // Office
  piece('desk', 2, 0), piece('bookshelf', 3, 0), piece('clock', 4, 1),
  // Porch
  piece('shrub', 3, 3), piece('plant', 4, 2), piece('sofa', 4, 3, 2, 1),
]

const people: Person[] = [
  { id: 'p0', name: 'Rui', avatarSeed: 'Rui-ofa1-0', accent: '#6E8CA0' },
  { id: 'p1', name: 'Inês', avatarSeed: 'Ines-ofa1-1', accent: '#B08D57' },
  { id: 'p2', name: 'Tomé', avatarSeed: 'Tome-ofa1-2', accent: '#8A7CA8' },
  { id: 'p3', name: 'Marta', avatarSeed: 'Marta-ofa1-3', accent: '#7E9C6E' },
  { id: 'p4', name: 'Álvaro', avatarSeed: 'Alvaro-ofa1-4', accent: '#9C7F6E', isVictim: true },
]

/** Every statement in reading order, the false one (s4) included. Scene facts are the victim's. */
export const statements: Statement[] = [
  { id: 's1', author: 'p0', clue: { kind: 'direction', person: 'p0', other: 'p1', dir: 'N' }, text: 'Somewhere north of Inês.', display: 'I was somewhere north of Inês, mending nets.' },
  { id: 's2', author: 'p0', clue: { kind: 'besideFurniture', person: 'p0', furniture: 'lamp' }, text: 'Beside the lamp.', display: 'I was standing next to the lamp, mending by its glow.' },
  { id: 's3', author: 'p1', clue: { kind: 'notSameRoomAs', person: 'p1', other: 'p2' }, text: 'Was not in the same room as Tomé.', display: 'I never shared a room with Tomé that night.' },
  { id: 's4', author: 'p1', clue: { kind: 'onFurniture', person: 'p1', furniture: 'counter' }, text: 'On the counter.', display: 'I was at the counter — bread doesn’t wait for gossip.' },
  { id: 's5', author: 'p2', clue: { kind: 'notSameRoomAs', person: 'p2', other: 'p1' }, text: 'Was not in the same room as Inês.', display: 'I never shared a room with Inês that night.' },
  { id: 's6', author: 'p2', clue: { kind: 'onFurniture', person: 'p2', furniture: 'chair' }, text: 'On the chair.', display: 'I sat on the chair, warming my hands.' },
  { id: 's7', author: 'p3', clue: { kind: 'besideFurniture', person: 'p3', furniture: 'shrub' }, text: 'Beside the shrub.', display: 'I was next to the shrub, the cloth over my arm.' },
  { id: 's8', author: 'p3', clue: { kind: 'notSameRoomAs', person: 'p3', other: 'p1' }, text: 'Was not in the same room as Inês.', display: 'Inês and I were never in the same room.' },
  { id: 's9', author: 'p4', clue: { kind: 'besideFurniture', person: 'p4', furniture: 'bookshelf' }, text: 'Beside the bookshelf.', display: 'He was found next to the bookshelf.', scene: true },
  { id: 's10', author: 'p4', clue: { kind: 'besideFurniture', person: 'p4', furniture: 'clock' }, text: 'Beside the clock.', display: 'He was found next to the clock.', scene: true },
]

export const OFA_01: LieCase = buildCase({
  id: 'ofa-01', title: 'The Silent Bell', caseNumber: 'One False Alibi 1', difficulty: 'Easy', size: 5,
  flavor: 'The harbour bell has not rung for three mornings. Nine accounts, and one of them was bent to fit the night.',
  rooms, furniture, people, victimId: 'p4',
  solution: { p0: at(0, 4), p1: at(2, 0), p2: at(1, 2), p3: at(4, 3), p4: at(3, 1) },
  statements, lieId: 's4', collisions: [['s1', 's4'], ['s4', 's5', 's6']],
  story: {
    title: 'The Silent Bell',
    premise: 'Portinhal keeps its hours by the harbour bell, and for three mornings it has not rung. The harbour master was the last to hold its rope, and I mean to learn whose hand made sure he never holds anything again.',
    closing: '{M} reached for the alibi a baker would, and honest accounts closed in around it. {V} will sign no more orders, but a page torn from the notary’s book was found in his coat, and Lúcia will have to explain it.',
    cast: {
      p0: { name: 'Rui', role: 'Net mender', emblem: 'net', motive: 'Owed the harbour master a season of mooring dues, and was told the debt would be called before the festival.' },
      p1: { name: 'Inês', role: 'Baker', emblem: 'bread', motive: 'The harbour master kept a ledger of loaves never paid for, and meant to read it aloud at the town meeting.' },
      p2: { name: 'Tomé', role: 'Lamplighter', emblem: 'lantern', motive: 'Was told the quay lights would be taken from his keeping, and knew whose signature was on the order.' },
      p3: { name: 'Marta', role: 'Sailmaker', emblem: 'needle', motive: 'Her finest sails were promised to the harbour board until the harbour master quietly cancelled the order.' },
      p4: { name: 'Álvaro', role: 'Harbour master', emblem: 'compass', motive: 'Held the keys to every mooring and every secret in the harbour, and mistook the second for a privilege.' },
    },
  },
})
