// A small hand-made case so the game can be played and tested before the real case lands.
// 5x5, four suspects and a victim. Ana (the murderer) lies: she says she was in the Net Loft.
// Removing that one statement leaves exactly one solution (checked in tests/lie/game.test.ts).
import type { Cell, Puzzle } from '../core/types'
import type { LieCase, Statement } from './model'

const roomMap = [
  ['loft', 'loft', 'loft', 'shop', 'shop'],
  ['loft', 'loft', 'loft', 'shop', 'shop'],
  ['quay', 'quay', 'house', 'house', 'house'],
  ['quay', 'quay', 'house', 'house', 'house'],
  ['quay', 'quay', 'house', 'house', 'house'],
]
const cellsOf = (id: string): Cell[] => {
  const out: Cell[] = []
  roomMap.forEach((row, r) => row.forEach((x, c) => { if (x === id) out.push({ row: r, col: c }) }))
  return out
}

const statements: Statement[] = [
  { id: 's1', author: 'a', clue: { kind: 'edge', person: 'a' }, text: 'I was against a wall.', voice: 'I keep to the edges. Always have.' },
  { id: 's2', author: 'a', clue: { kind: 'room', person: 'a', roomId: 'loft' }, text: 'I was in the Net Loft.', voice: 'Mending, all evening.' },
  { id: 's3', author: 'b', clue: { kind: 'onFurniture', person: 'b', furniture: 'chair' }, text: 'I was sitting in the chair.' },
  { id: 's4', author: 'b', clue: { kind: 'edge', person: 'b' }, text: 'I was against a wall.' },
  { id: 's5', author: 'c', clue: { kind: 'room', person: 'c', roomId: 'shop' }, text: 'I was in the Chandlery.' },
  { id: 's6', author: 'c', clue: { kind: 'besideFurniture', person: 'c', furniture: 'table' }, text: 'I was beside the table.' },
  { id: 's7', author: 'c', clue: { kind: 'notSameRoomAs', person: 'c', other: 'b' }, text: 'I was not in the same room as Bruno.' },
  { id: 's8', author: 'd', clue: { kind: 'besideFurniture', person: 'd', furniture: 'plant' }, text: 'I was beside the plant.' },
  { id: 's9', author: 'd', clue: { kind: 'direction', person: 'd', other: 'a', dir: 'N' }, text: 'I was north of Ana.' },
  { id: 's10', author: 'v', clue: { kind: 'onFurniture', person: 'v', furniture: 'desk' }, text: 'Found at the desk.', scene: true },
]

const LIE = 's2'

const puzzle: Puzzle = {
  id: 'fixture',
  title: 'The Quiet Quay',
  caseNumber: 'F-1',
  difficulty: 'Easy',
  size: 5,
  rooms: [
    { id: 'loft', name: 'Net Loft', hue: 200, cells: cellsOf('loft') },
    { id: 'shop', name: 'Chandlery', hue: 40, cells: cellsOf('shop') },
    { id: 'quay', name: 'Quay', hue: 160, cells: cellsOf('quay') },
    { id: 'house', name: 'Counting-house', hue: 20, cells: cellsOf('house') },
  ],
  roomOf: roomMap,
  furniture: [
    { type: 'chair', row: 0, col: 0 },
    { type: 'table', row: 1, col: 3 },
    { type: 'desk', row: 2, col: 3 },
    { type: 'plant', row: 3, col: 0 },
  ],
  people: [
    { id: 'a', name: 'Ana', avatarSeed: 'ana', accent: '#a0432d' },
    { id: 'b', name: 'Bruno', avatarSeed: 'bruno', accent: '#2f5d7c' },
    { id: 'c', name: 'Cleo', avatarSeed: 'cleo', accent: '#c58b2a' },
    { id: 'd', name: 'Davi', avatarSeed: 'davi', accent: '#5a8a7a' },
    { id: 'v', name: 'Ines', avatarSeed: 'ines', accent: '#777777', isVictim: true },
  ],
  clues: statements.filter(s => s.id !== LIE).map(s => ({ clue: s.clue, text: s.text })),
  solution: {
    a: { row: 4, col: 2 }, b: { row: 0, col: 0 }, c: { row: 1, col: 4 }, d: { row: 3, col: 1 }, v: { row: 2, col: 3 },
  },
  victimId: 'v',
  murdererId: 'a',
  flavor: 'A hand-made case for testing.',
}

export const LIE_FIXTURE: LieCase = {
  id: 'fixture',
  puzzle,
  statements,
  lieId: LIE,
  collisions: [['s2', 's1', 's3'], ['s2', 's8', 's9']],
  story: {
    title: 'The Quiet Quay',
    premise: 'Ines was found at her desk in the counting-house. Everyone was asked where they had been. One of them lied.',
    closing: '{M} had told the harbour bell where to look. {V} had seen the ledger, and that was enough.',
    cast: {
      a: { name: 'Ana', role: 'Net-mender', emblem: 'net', motive: "The ledger Ines held would have ended her family's licence." },
      b: { name: 'Bruno', role: 'Ferry deckhand', emblem: 'anchor', motive: 'A small debt, long forgiven.' },
      c: { name: 'Cleo', role: 'Chandler', emblem: 'lantern', motive: 'Nothing but a dull rivalry over rope prices.' },
      d: { name: 'Davi', role: 'Dock clerk', emblem: 'key', motive: 'He owed Ines a favour, not a grudge.' },
      v: { name: 'Ines', role: 'Harbour notary', emblem: 'quill', motive: '' },
    },
  },
}

export default LIE_FIXTURE
