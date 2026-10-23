import type { SceneSpec } from '../schema'

// ============================================================================
// MIDNIGHT DELIVERY — the golden-master scene.
//
// Puzzle topology (src/data/cases/very-easy-1.ts) is untouched: 6×6, five
// rooms, sixteen logical furnishings, four people. This file is the HOUSE:
// where the walls, doors and windows really are, and which Kenney model
// stands for each logical furnishing. Every object is placed by relationship
// (against a wall, on a surface, at a cell-unit point) — never by pixel.
//
// Plan (cell units, x → columns, z → rows):
//
//     z=0 ┌────────── north shell (windows) ──────────┐
//         │  BEDROOM          ║ spine   OFFICE          │
//     z=2 ├── door ───────────╫──── door ───────────────┤   ← cut-down partitions
//         │  hall / vestibule (front door on the west) │
//     z=3 │  LIVING           ║ KITCHEN ← counters on this wall
//         │  (open to hall)   ║ pass-through at z≈5.3
//     z=6 └── plinth (south/east shell cut to the slab) ┘
//                                x=3
// ============================================================================

export const midnightDelivery: SceneSpec = {
  puzzleId: 'very-easy-1',
  floor: 0,
  entry: { wall: 'west', at: 2.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.6, kind: 'window' },   // over the bedroom nightstand
      { wall: 'north', at: 4.6, kind: 'window' },   // over the desk
      { wall: 'west', at: 4.0, kind: 'window' },    // behind the sofa
    ],
  },
  walls: [
    // bedroom | office
    { id: 'spine', from: [3, 0], to: [3, 2] },
    // bedroom | hall, door beside the spine
    { id: 'bedroom-south', from: [0, 2], to: [3, 2], openings: [{ at: 2.3, kind: 'door' }] },
    // office | hall
    { id: 'office-south', from: [3, 2], to: [6, 2], openings: [{ at: 3.7, kind: 'door' }] },
    // hall | kitchen — the counter wall
    { id: 'kitchen-back', from: [3, 3], to: [6, 3] },
    // living | kitchen: a waist-high pony wall the TV cabinet backs onto; it stops at z=4.8 and
    // the front 1.2 cells stay open as the pass-through (no stub at the plinth)
    { id: 'kitchen-west', from: [3, 3], to: [3, 4.8], height: 'half', freeEnds: ['to'] },
    // a short return off the east shell: the fridge backs onto it and faces the
    // kitchen, so its door — not its back — is what the camera sees
    { id: 'kitchen-return', from: [6, 4], to: [5.35, 4], freeEnds: ['to'] },
  ],
  furniture: [
    // ---- bedroom --------------------------------------------------------------
    { id: 'bed', model: 'bedDouble', logic: 'bed@0,0', against: { wall: 'north', at: 0.9 } },
    { id: 'nightstand', model: 'cabinetBedDrawerTable', logic: 'lamp@0,2', against: { wall: 'north', at: 2.05 } },
    { id: 'bedside-lamp', model: 'lampRoundTable', logic: 'lamp@0,2', on: { parent: 'nightstand' } },
    // tapete ao lado da cama, entre a cama e a porta
    // ---- office ---------------------------------------------------------------
    { id: 'desk', model: 'desk', logic: 'desk@0,3', against: { wall: 'north', at: 4.0 } },
    { id: 'laptop', model: 'laptop', on: { parent: 'desk', offset: [0.02, 0.02] } },
    { id: 'desk-chair', model: 'chairDesk', logic: 'chair@0,4', at: [4.3, 0.9], facing: 'N' },
    // floor props stand in FRONT of the furniture they belong to (south/east), never behind it:
    // behind the desk end the bin's base is hidden and it reads as sitting on the desk
    { id: 'wastebasket', model: 'trashcan', at: [3.4, 0.85] },
    { id: 'floor-lamp', model: 'lampRoundFloor', logic: 'lamp@1,4', at: [4.5, 1.35] },
    { id: 'low-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@1,5', against: { wall: 'east', at: 1.25 } },
    { id: 'books', model: 'books', on: { parent: 'low-bookcase' } },
    { id: 'office-plant', model: 'pottedPlant', at: [3.25, 1.25] },
    // ---- hall -----------------------------------------------------------------
    // consola baixa no limite sul do corredor (encostada à parede do quarto escondia a célula do quarto);
    // uma segunda consola e o bengaleiro ficam na ponta leste do corredor
    { id: 'hall-console', model: 'sideTable', logic: 'lamp@2,0', at: [0.95, 2.86], facing: 'N' },
    { id: 'hall-console-lamp', model: 'lampRoundTable', logic: 'lamp@2,0', on: { parent: 'hall-console' } },
    { id: 'console', model: 'sideTable', against: { wall: 'office-south', side: 'S', at: 5.0 } },
    { id: 'hall-lamp', model: 'lampRoundTable', on: { parent: 'console' } },
    { id: 'coat-rack', model: 'coatRackStanding', at: [5.5, 2.5] },
    // ---- living room ------------------------------------------------------------
    { id: 'sofa', model: 'loungeSofa', logic: 'sofa@3,0', against: { wall: 'west', at: 4.0 } },
    { id: 'coffee-table', model: 'tableCoffee', logic: 'table@3,1', at: [1.35, 3.85], facing: 'E' },
    { id: 'plant', model: 'pottedPlant', logic: 'plant@3,2', at: [2.6, 3.4] },
    { id: 'tv-stand', model: 'cabinetTelevision', logic: 'tv@4,2', against: { wall: 'kitchen-west', side: 'W', at: 4.2 } },
    { id: 'tv', model: 'televisionVintage', logic: 'tv@4,2', on: { parent: 'tv-stand' } },
    { id: 'parcel', model: 'cardboardBoxClosed', at: [1.5, 4.6], yaw: 15 },
    { id: 'armchair', model: 'loungeChair', at: [0.4, 5.35], facing: 'E' },
    // ---- kitchen ------------------------------------------------------------------
    { id: 'counter-1', model: 'kitchenCabinet', logic: 'counter@3,3', against: { wall: 'kitchen-back', side: 'S', at: 3.35 } },
    { id: 'sink', model: 'kitchenSink', logic: 'counter@3,3', against: { wall: 'kitchen-back', side: 'S', at: 3.9 } },
    { id: 'counter-2', model: 'kitchenCabinetDrawer', logic: 'counter@3,3', against: { wall: 'kitchen-back', side: 'S', at: 4.45 } },
    { id: 'microwave', model: 'kitchenMicrowave', on: { parent: 'counter-2' } },
    { id: 'stove', model: 'kitchenStove', logic: 'stove@3,5', against: { wall: 'kitchen-back', side: 'S', at: 5.0 } },
    { id: 'fridge', model: 'kitchenFridge', logic: 'fridge@4,5', against: { wall: 'kitchen-return', side: 'S', at: 5.65 } },
    { id: 'dining-table', model: 'table', logic: 'table@4,3', at: [3.9, 4.75], facing: 'E' },
    { id: 'dining-chair-front', model: 'chair', logic: 'chair@5,3', at: [3.9, 5.6], facing: 'N' },
    { id: 'dining-chair-back', model: 'chair', at: [3.9, 3.95], facing: 'S' },
    { id: 'dining-chair-east', model: 'chair', at: [4.7, 4.75], facing: 'W' },
  ],
  rugs: [
    { id: 'doormat', model: 'rugDoormat', at: [0.4, 2.5], facing: 'E' },
    { id: 'living-rug', model: 'rugRectangle', at: [1.2, 4.0], facing: 'E' },
    { id: 'bedroom-rug', model: 'rugRound', at: [2.05, 1.15] },
  ],
}
