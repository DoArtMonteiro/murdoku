import type { CaseStory } from '../schema'

/**
 * Case No. I, "Midnight Delivery". Authored against the STORY-BIBLE and the
 * Victorian style pack. Every voiced line restates exactly one clue; nothing
 * here may name a square, a neighbour or an object the clue does not mention
 * (enforced by validate.ts and tests/reference/story.test.ts).
 *
 * Evidence markers sit at wall junctions / the porch margin, never inside a
 * cell's central 50% and never under a token box.
 */
export const veryEasy1Story: CaseStory = {
  caseId: 'very-easy-1',
  lang: 'en',
  premise:
    'Hollis Villa, 23:40. A courier left a parcel on the porch and rang once; nobody came. Inside, Owen Hollis, importer, widower, a man who kept his promises in writing, lies dead in the Living Room, and the parcel is still on the step, addressed to him in his own hand. Four people were in the house. Each has told you one thing about where they stood. Place them. The one left alone with Owen is your murderer.',
  setting: {
    estate: 'Hollis Villa',
    house: 'Gaslight Villa', // internal pack name, never shown
    styleLabel: 'Victorian Villa',
    style: 'Victorian',
    hour: '23:40',
    // The built front door is on the Hallway's EAST wall (r2c5); the porch slab sits just outside it.
    entrance: { x: 6.4, y: 2.5 },
    entranceCell: { row: 2, col: 5 },
    hubRoomId: 'room2',
    // Door openings as the board builds them (wall segments, cell units).
    doors: [
      { x1: 1, y1: 2, x2: 2, y2: 2 },
      { x1: 3, y1: 2, x2: 4, y2: 2 },
      { x1: 1, y1: 3, x2: 2, y2: 3 },
      { x1: 4, y1: 3, x2: 5, y2: 3 },
      { x1: 6, y1: 2, x2: 6, y2: 3 },
    ],
  },
  suspects: [
    {
      personId: 'p0',
      fullName: 'Owen Hollis',
      portrait: 4,
      role: 'The Victim',
      oneLiner: 'He wrote everything down, which is how he knew exactly who owed him.',
      motive: { label: 'Ledgers', text: 'A careful man with a long memory for what others owed him.' },
      alibi: 'The coroner reads the scene for him, since he can no longer speak.',
      lines: [
        { text: 'The body was found in the Living Room. He had not been moved.', clue: { kind: 'room' } },
        { text: 'He had fallen beside the TV; the set was still on.', clue: { kind: 'besideFurniture', furniture: 'tv' } },
      ],
    },
    {
      personId: 'p1',
      fullName: 'Priya Nandakumar',
      portrait: 1,
      role: 'The Business Partner',
      oneLiner: 'Calm under pressure, exact with figures, and not given to raising her voice.',
      motive: { label: 'Accounts', text: 'Owen had asked to see the import accounts again, and the parcel on the porch is addressed to him in his own hand.' },
      alibi: 'I watched the late news and minded my own business. I had nothing to do with the torn envelope.',
      lines: [
        { text: 'The bottom row of the plan, if you must have it like that. That is where I was, all evening.', clue: { kind: 'row' } },
        { text: 'Yes, I was beside the TV, with the late news on and a cup of tea cooling beside me.', clue: { kind: 'besideFurniture', furniture: 'tv' } },
      ],
    },
    {
      personId: 'p2',
      fullName: 'Faye Hollis',
      portrait: 3,
      role: 'The Sister',
      oneLiner: 'Turns every argument into a headache and every headache into an early night.',
      motive: { label: 'Money', text: 'Owen had refused to lend her money again that evening; the torn envelope carries the same hand that wrote her refusal.' },
      alibi: 'I took one of my powders and tried to sleep through it. I had nothing to do with the broken glass.',
      lines: [
        { text: 'In the Bedroom. With the light off and a cold cloth on my eyes. Ask anyone who has ever had one of my heads.', clue: { kind: 'room' } },
      ],
    },
    {
      personId: 'p3',
      fullName: 'Tomas Ferreira',
      portrait: 6,
      role: 'The Night Courier',
      oneLiner: 'Paid by the parcel, so he is not one to stand about, except tonight.',
      motive: { label: 'Grudge', text: 'A damaged consignment last month and a claim Owen put off paying; the parcel on the porch is the delivery he was due to hand over.' },
      alibi: 'I rang, asked for a signature and kept an eye on my watch. I had nothing to do with the muddy boot prints.',
      lines: [
        { text: 'A corner. I stood in a corner of the house and waited for someone to sign. That is all a courier does.', clue: { kind: 'corner' } },
      ],
    },
  ],
  evidence: [
    {
      id: 'E1', n: 1, refs: ['parcel'], kind: 'parcel', label: 'Unopened parcel', showDuringPlay: true,
      description: 'Brown paper, string and a red wax seal, left on the porch step. It is addressed to Owen Hollis, in Owen Hollis\'s own handwriting.',
      revealNote: 'Owen posted himself the real invoices, his insurance. It never came in, and Priya never knew it existed.',
      placement: { x: 6.4, y: 2.5, where: 'on the porch slab, by the front door' },
    },
    {
      id: 'E2', n: 2, refs: ['envelope'], kind: 'letter', label: 'Torn envelope', showDuringPlay: true,
      description: 'A torn envelope, marked "O. Hollis, to be opened only by me". It lies on top of the TV cabinet.',
      revealNote: 'The first copy of the invoices. Owen was reading it aloud when he was confronted.',
      placement: { x: 2.5, y: 4.12, where: 'on top of the TV cabinet' },
    },
    {
      id: 'E3', n: 3, refs: ['glass', 'glasses', 'decanter'], kind: 'glass', label: 'Spilled decanter', showDuringPlay: true,
      description: 'A spilled decanter and a broken glass on the rim of the pedestal table. Two glasses were poured.',
      revealNote: 'Two glasses: Owen was sharing a drink with someone he still trusted.',
      placement: { x: 1.5, y: 3.88, where: 'on the rim of the pedestal table' },
    },
    {
      id: 'E4', n: 4, refs: ['boot prints', 'footprints'], kind: 'footprint', label: 'Muddy boot prints', showDuringPlay: true,
      description: 'Muddy boot prints cross the hall boards, drying fast, and then fade.',
      revealNote: 'The courier came in from the porch, wiped his boots too late, and went no further than a corner.',
      placement: { x: 2.5, y: 3, where: 'along the hall boards' },
    },
    {
      id: 'E5', n: 5, refs: ['key'], kind: 'key', label: 'Ledger key', showDuringPlay: false,
      description: 'A small brass key on a blue ribbon, left on the counter.',
      revealNote: 'Priya\'s key to the ledger drawer, dropped where she wiped her hands. It shows she was in the house, which was never in doubt.',
      placement: { x: 4.5, y: 3.88, where: 'on the kitchen counter' },
    },
  ],
  reveal: {
    motive: {
      title: 'Motive',
      body: 'Two years of import invoices, two sets of numbers. Owen found the second set and posted the originals to himself: a parcel that would arrive while his partner was in the house.',
    },
    movements: {
      title: 'Movements',
      body: 'Faye took to the Bedroom with a headache. Tomas, the courier, rang, waited, and came in no further than a corner. Owen settled in the Living Room with the television on. Priya came to find him.',
    },
    crucial: {
      title: 'Crucial clue',
      person: 'p1',
      clue: { kind: 'besideFurniture', furniture: 'tv' },
      body: 'Two clues meet on one square. Priya says she stayed in the bottom row. She also says she was beside the TV. Only one square on the whole plan is both. Everything else follows from it.',
    },
    conclusion: {
      title: 'Conclusion',
      body: 'One room, two people. Owen read the invoices aloud; Priya poured the second glass, and when he reached for the telephone she made sure he never dialled. The parcel on the step was the copy she never knew existed.',
    },
    dossier: {
      title: 'Dossier',
      body: 'Case closed. Priya Nandakumar, Owen\'s business partner, was the only person left alone with him in the Living Room. The evidence: the real invoices on the porch, a torn envelope, two glasses, a trail of muddy boots, and a ledger key.',
    },
  },
}
