// One False Alibi, case ofa-02: "The Notary's Last Page".
//
// Written from the story backwards. Dinis the chandler forged the notary's last page, and Lúcia
// caught him at it in her Office. The alibi a chandler reaches for is his own stock: "I sat on the
// box all night." The box is in the Workshop, so the lie puts him far from the Office.
//
// What an honest reader can find:
//   * s3 + s10 (Joana on the chair, Dinis on the box): a pair. They cannot share a lane, because the
//     chair and the box stand in the same row. This one leans on the one-per-row rule.
//   * s1 + s7 + s10 (Rui east of Marta, Marta east of Dinis, Dinis on the box): a chain through a
//     third person. The box stands in the fifth column of six, so Marta would have to be in the last
//     column and Rui east of her, off the plan. No row or column rule is needed (lane-free).
// The two meet only in s10. Doubting any other statement leaves one of the stories standing.
//
// With s10 struck, the other eleven statements place everyone, but Dinis's own square is not
// forced by singles: it takes one suppose (tests/lie/case-ofa-02.test.ts pins the measure).
import type { Person, Room } from '../../core/types'
import type { LieCase, Statement } from '../model'
import { at, buildCase, piece, rect } from './build'

const rooms: Room[] = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 1, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 2, 5) },
  { id: 'room2', name: 'Office', hue: 270, cells: rect(2, 0, 5, 2) },
  { id: 'room3', name: 'Courtyard', hue: 95, cells: rect(3, 3, 5, 5) },
]

const furniture = [
  // Kitchen
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('chair', 1, 0), piece('plant', 1, 1),
  // Workshop
  piece('lamp', 0, 3), piece('table', 0, 4), piece('box', 1, 4),
  // Office
  piece('bookshelf', 2, 0), piece('desk', 2, 1), piece('clock', 2, 2), piece('plant', 5, 0), piece('rug', 4, 1, 2, 2),
  // Courtyard
  piece('shrub', 3, 4), piece('lamp', 4, 4), piece('sofa', 5, 3, 2, 1),
]

const people: Person[] = [
  { id: 'p0', name: 'Rui', avatarSeed: 'Rui-ofa2-0', accent: '#6E8CA0' },
  { id: 'p1', name: 'Joana', avatarSeed: 'Joana-ofa2-1', accent: '#B08D57' },
  { id: 'p2', name: 'Tomé', avatarSeed: 'Tome-ofa2-2', accent: '#8A7CA8' },
  { id: 'p3', name: 'Marta', avatarSeed: 'Marta-ofa2-3', accent: '#7E9C6E' },
  { id: 'p4', name: 'Dinis', avatarSeed: 'Dinis-ofa2-4', accent: '#A8706E' },
  { id: 'p5', name: 'Lúcia', avatarSeed: 'Lucia-ofa2-5', accent: '#9C7F6E', isVictim: true },
]

/** Every statement in reading order, the false one (s10) included. Scene facts are the victim's. */
export const statements: Statement[] = [
  { id: 's1', author: 'p0', clue: { kind: 'direction', person: 'p0', other: 'p3', dir: 'E' }, text: 'Somewhere east of Marta.', display: 'I was somewhere east of Marta, mending until the light failed.' },
  { id: 's2', author: 'p0', clue: { kind: 'besideFurniture', person: 'p0', furniture: 'box' }, text: 'Beside the box.', display: 'I stood right next to the box, splicing rope.' },
  { id: 's3', author: 'p1', clue: { kind: 'onFurniture', person: 'p1', furniture: 'chair' }, text: 'On the chair.', display: 'I sat on the chair with my floury arms in my lap.' },
  { id: 's4', author: 'p1', clue: { kind: 'room', person: 'p1', roomId: 'room0' }, text: 'In the Kitchen.', display: 'I was in the Kitchen, where the dough was proving.' },
  { id: 's5', author: 'p2', clue: { kind: 'room', person: 'p2', roomId: 'room3' }, text: 'In the Courtyard.', display: 'I was in the Courtyard, trimming wicks for the evening.' },
  { id: 's6', author: 'p2', clue: { kind: 'besideFurniture', person: 'p2', furniture: 'shrub' }, text: 'Beside the shrub.', display: 'I stood next to the shrub, out of the wind.' },
  { id: 's7', author: 'p3', clue: { kind: 'direction', person: 'p3', other: 'p4', dir: 'E' }, text: 'Somewhere east of Dinis.', display: 'I was somewhere east of Dinis, with sailcloth over my knees.' },
  { id: 's8', author: 'p3', clue: { kind: 'onFurniture', person: 'p3', furniture: 'sofa' }, text: 'On the sofa.', display: 'I was on the sofa, stitching until my eyes hurt.' },
  { id: 's9', author: 'p4', clue: { kind: 'notRoom', person: 'p4', roomId: 'room3' }, text: 'Never set foot in the Courtyard.', display: 'I never set foot in the Courtyard.' },
  { id: 's10', author: 'p4', clue: { kind: 'onFurniture', person: 'p4', furniture: 'box' }, text: 'On the box.', display: 'I sat on the box, counting coils of rope.' },
  { id: 's11', author: 'p5', clue: { kind: 'room', person: 'p5', roomId: 'room2' }, text: 'In the Office.', display: 'She was found in the Office.', scene: true },
  { id: 's12', author: 'p5', clue: { kind: 'besideFurniture', person: 'p5', furniture: 'clock' }, text: 'Beside the clock.', display: 'She was found next to the clock.', scene: true },
]

export const OFA_02: LieCase = buildCase({
  id: 'ofa-02', title: 'The Notary’s Last Page', caseNumber: 'One False Alibi 2', difficulty: 'Medium', size: 6,
  flavor: 'The harbour master’s will has lost its last page. Twelve accounts, and one of them was bent to fit the night.',
  rooms, furniture, people, victimId: 'p5',
  solution: { p0: at(0, 4), p1: at(1, 0), p2: at(3, 5), p3: at(5, 3), p4: at(4, 2), p5: at(2, 1) },
  statements, lieId: 's10', collisions: [['s3', 's10'], ['s1', 's7', 's10']],
  story: {
    title: 'The Notary’s Last Page',
    premise: 'Portinhal’s notary witnessed every will in the harbour, and she was the last to read the harbour master’s. I found her pen stopped mid-line and a page missing from the archive.',
    closing: '{M} reached for the alibi of a man who sells rope, and honest accounts took it apart. {V} will not finish her entry, but the missing page is found, and with it a key to the bell tower. Whoever kept that tower has not answered a knock since.',
    cast: {
      p0: { name: 'Rui', role: 'Net mender', emblem: 'net', motive: 'Owed the harbour master a season of mooring dues and feared the will would call the debt in.' },
      p1: { name: 'Joana', role: 'Baker', emblem: 'bread', motive: 'Was promised the bakehouse lease in a will she had never seen on paper.' },
      p2: { name: 'Tomé', role: 'Lamplighter', emblem: 'lantern', motive: 'Had been told his post would lapse the day the will was read.' },
      p3: { name: 'Marta', role: 'Sailmaker', emblem: 'needle', motive: 'Her cancelled order for the harbour sails was meant to be restored in the last page.' },
      p4: { name: 'Dinis', role: 'Chandler', emblem: 'scales', motive: 'Had lent the harbour master money against a signature that was not quite the harbour master’s.' },
      p5: { name: 'Lúcia', role: 'Notary', emblem: 'quill', motive: 'Kept the town’s papers in order and noticed what did not belong in them.' },
    },
  },
})
