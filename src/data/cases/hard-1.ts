import type { AuthoredCaseSpec } from '../../core/authored'

// Playable two-storey reference case. Puzzle rooms remain logical regions;
// the architectural shell and staircase live independently in scene3d.
export const hard1: AuthoredCaseSpec = {
  slug: 'hard-1',
  difficulty: 'Hard',
  size: 8,
  floors: 2,
  rooms: [
    { name: 'Entrance Hall', hue: 36, r0: 0, c0: 0, r1: 3, c1: 3, floor: 0 },
    { name: 'Kitchen', hue: 52, r0: 0, c0: 4, r1: 3, c1: 7, floor: 0 },
    { name: 'Dining Room', hue: 18, r0: 4, c0: 0, r1: 7, c1: 3, floor: 0 },
    { name: 'Conservatory', hue: 112, r0: 4, c0: 4, r1: 7, c1: 7, floor: 0 },
    { name: 'Bedroom', hue: 338, r0: 0, c0: 0, r1: 3, c1: 3, floor: 1 },
    { name: 'Study', hue: 224, r0: 0, c0: 4, r1: 3, c1: 7, floor: 1 },
    { name: 'Bathroom', hue: 192, r0: 4, c0: 0, r1: 7, c1: 3, floor: 1 },
    { name: 'Landing', hue: 42, r0: 4, c0: 4, r1: 7, c1: 7, floor: 1 },
  ],
  furniture: [
    // Ground floor
    { type: 'bookshelf', row: 1, col: 0, floor: 0 },
    { type: 'clock', row: 3, col: 4, floor: 0 },
    { type: 'counter', row: 1, col: 4, w: 2, h: 1, rotation: 0, floor: 0 },
    { type: 'stove', row: 0, col: 6, floor: 0 },
    { type: 'fridge', row: 2, col: 7, floor: 0 },
    { type: 'table', row: 6, col: 1, w: 2, h: 1, rotation: 0, floor: 0 },
    { type: 'chair', row: 7, col: 1, floor: 0 },
    { type: 'lamp', row: 7, col: 3, floor: 0 },
    { type: 'plant', row: 5, col: 5, floor: 0 },
    { type: 'chair', row: 6, col: 6, floor: 0 },
    // Upper floor
    { type: 'bed', row: 2, col: 0, w: 2, h: 1, rotation: 0, floor: 1 },
    { type: 'lamp', row: 1, col: 0, floor: 1 },
    { type: 'desk', row: 1, col: 5, floor: 1 },
    { type: 'chair', row: 2, col: 6, floor: 1 },
    { type: 'bathtub', row: 6, col: 0, w: 2, h: 1, rotation: 0, floor: 1 },
    { type: 'toilet', row: 7, col: 2, floor: 1 },
    { type: 'bookshelf', row: 5, col: 7, floor: 1 },
    { type: 'plant', row: 6, col: 6, floor: 1 },
    { type: 'clock', row: 7, col: 7, floor: 1 },
  ],
  people: [
    { name: 'Evelyn', accentIndex: 2, isVictim: true, row: 1, col: 1, floor: 0 },
    { name: 'Silas', accentIndex: 6, row: 2, col: 2, floor: 0 },
    { name: 'Mara', accentIndex: 4, row: 5, col: 5, floor: 0 },
    { name: 'Jonas', accentIndex: 1, row: 3, col: 6, floor: 1 },
    { name: 'Clara', accentIndex: 7, row: 6, col: 3, floor: 1 },
  ],
  maxDirectness: 6,
  // Hard cases must not identify the killer with a direct room clue.
  minDirectness: 1,
  requiredClues: [
    { kind: 'above', person: 'p3', target: 'room1', targetKind: 'room' },
  ],
  flavor: 'A blackout split the house between two storeys. Evelyn was found in the Entrance Hall; reconstruct both floors, follow the staircase and test every alibi across the same rows and columns.',
}
