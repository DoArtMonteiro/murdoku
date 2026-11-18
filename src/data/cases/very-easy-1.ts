import type { AuthoredCaseSpec } from '../../core/authored'

// Hand-authored replacement for the procedurally-generated case #1
// ("Midnight Delivery") — the pilot for the isometric-dollhouse art-direction
// reset. This is the ONE scene the new IsoBoard presentation is being built
// and screenshotted against: a small, deliberately composed apartment
// (bedroom / office / hallway / living room / kitchen) rather than a
// procedural room split, so every wall run, doorway gap, and furniture
// cluster below is a real design choice the renderer can be judged against.
export const veryEasy1: AuthoredCaseSpec = {
  slug: 'very-easy-1',
  difficulty: 'Very Easy',
  size: 6,
  rooms: [
    { name: 'Bedroom', hue: 340, r0: 0, c0: 0, r1: 1, c1: 2 },
    { name: 'Office', hue: 230, r0: 0, c0: 3, r1: 1, c1: 5 },
    { name: 'Hallway', hue: 40, r0: 2, c0: 0, r1: 2, c1: 5 },
    { name: 'Living Room', hue: 265, r0: 3, c0: 0, r1: 5, c1: 2 },
    { name: 'Kitchen', hue: 40, r0: 3, c0: 3, r1: 5, c1: 5 },
  ],
  furniture: [
    // Bedroom — bed against the back wall, a lamp in the corner, a rug
    // grounding the open floor between them.
    { type: 'bed', row: 0, col: 0, w: 2, h: 1, rotation: 0 },
    { type: 'lamp', row: 0, col: 2, w: 1, h: 1, rotation: 0 },
    // Office — desk and chair as a pair, a bookshelf against the side wall,
    // a second lamp so the desk reads as a workspace, not a stray table.
    { type: 'desk', row: 0, col: 3, w: 1, h: 1, rotation: 0 },
    { type: 'chair', row: 0, col: 4, w: 1, h: 1, rotation: 0 },
    { type: 'bookshelf', row: 1, col: 5, w: 1, h: 1, rotation: 0 },
    { type: 'lamp', row: 1, col: 4, w: 1, h: 1, rotation: 0 },
    // Hallway — the connective corridor between every room. A lamp and a
    // runner rug, kept otherwise bare — it's a passage, not a room.
    { type: 'lamp', row: 2, col: 0, w: 1, h: 1, rotation: 0 },
    // Living Room — sofa along the west wall, coffee table, a plant, and a
    // TV facing the sofa so the cluster reads as a seating arrangement.
    { type: 'sofa', row: 3, col: 0, w: 1, h: 2, rotation: 90 },
    { type: 'table', row: 3, col: 1, w: 1, h: 1, rotation: 0 },
    { type: 'plant', row: 3, col: 2, w: 1, h: 1, rotation: 0 },
    { type: 'tv', row: 4, col: 2, w: 1, h: 1, rotation: 0 },
    // Kitchen — counter run along the back wall, stove and fridge, plus a
    // small table and chair so it reads as a place to eat, not just cook.
    { type: 'counter', row: 3, col: 3, w: 2, h: 1, rotation: 0 },
    { type: 'stove', row: 3, col: 5, w: 1, h: 1, rotation: 0 },
    { type: 'fridge', row: 4, col: 5, w: 1, h: 1, rotation: 0 },
    { type: 'table', row: 4, col: 3, w: 1, h: 1, rotation: 0 },
    { type: 'chair', row: 5, col: 3, w: 1, h: 1, rotation: 0 },
  ],
  people: [
    { name: 'Owen', accentIndex: 0, isVictim: true, row: 4, col: 1 },
    { name: 'Priya', accentIndex: 1, row: 5, col: 2 },
    { name: 'Faye', accentIndex: 5, row: 1, col: 0 },
    { name: 'Tomas', accentIndex: 7, row: 0, col: 5 },
  ],
  maxDirectness: 3,
  minDirectness: 0,
  // Owen's "In the Living Room." card predates the literal-meaning fix to
  // "Beside" (it now excludes the piece you stand on and anything through a
  // wall). The clue is now redundant for uniqueness, but it is the card the
  // reference presentation was built around, so it is kept on purpose.
  requiredClues: [{ kind: 'room', person: 'p0', roomId: 'room3' }],
  flavor: 'A parcel was left on the porch and never made it inside. Owen was found in the Living Room, the delivery still unopened beside him — trace each alibi to its room, and the one left beside him is the killer.',
}
