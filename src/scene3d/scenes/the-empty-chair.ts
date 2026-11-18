import type { SceneSpec } from '../schema'

// ============================================================================
// THE EMPTY CHAIR (very-easy-2) — transfer pilot #1.
//
// Same 6×6 as the golden master, but half the house is a GARDEN: a walled
// courtyard on the camera side, entered from the living room through wide
// patio doors. Tests the recipe on an outdoor floor material, a pony wall
// carrying furniture on its camera side, and a desk that must back onto the
// cut-away east shell.
//
//     z=0 ┌──── north shell ────┬────────┐
//         │ LIVING              ║ OFFICE │
//     z=3 ├─ pony wall / patio ─╫─ pony ─┤
//         │        GARDEN (grass)        │
//     z=6 └──────────────────────────────┘
//                             x=4
// ============================================================================

export const theEmptyChair: SceneSpec = {
  puzzleId: 'very-easy-2',
  floor: 0,
  entry: { wall: 'west', at: 0.7 },
  shell: {
    features: [
      { wall: 'north', at: 2.6, kind: 'window' },
      { wall: 'north', at: 4.9, kind: 'window' },
      { wall: 'west', at: 2.0, kind: 'window' },
    ],
  },
  // the garden is OUTSIDE the building: no shell along its edges, ground a step
  // below the floor, a foundation edge and a threshold at the patio doors
  floors: [{ id: 'garden', cells: [0, 3, 5, 5], material: 'grass', kind: 'exterior' }],
  walls: [
    // living | office, door near the middle
    { id: 'spine', from: [4, 0], to: [4, 3], openings: [{ at: 1.3, kind: 'door' }] },
    // living | garden: waist-high wall with wide patio opening
    { id: 'patio', from: [0, 3], to: [4, 3], height: 'half', openings: [{ at: 2.6, width: 1.3, kind: 'open' }] },
    // office | garden: waist-high wall
    { id: 'office-garden', from: [4, 3], to: [6, 3], height: 'half' },
  ],
  furniture: [
    // ---- living room ---------------------------------------------------------
    // o sofá encosta à meia parede do pátio e olha para a televisão na parede norte;
    // a poltrona fecha o grupo em L junto à parede oeste
    { id: 'sofa', model: 'loungeSofa', logic: 'sofa@1,0', against: { wall: 'patio', side: 'N', at: 0.8 } },
    { id: 'coffee-table', model: 'tableCoffee', at: [1.0, 1.75], facing: 'S' },
    { id: 'tv-stand', model: 'cabinetTelevision', logic: 'tv@0,1', against: { wall: 'north', at: 1.15 } },
    { id: 'tv', model: 'televisionVintage', logic: 'tv@0,1', on: { parent: 'tv-stand' } },
    { id: 'armchair', model: 'loungeChair', against: { wall: 'west', at: 1.7 } },
    { id: 'console', model: 'sideTable', logic: 'clock@0,3', against: { wall: 'north', at: 3.3 } },
    { id: 'clock-radio', model: 'radio', logic: 'clock@0,3', on: { parent: 'console' } },
    { id: 'living-plant', model: 'pottedPlant', at: [2.3, 0.35] },
    // ---- office ----------------------------------------------------------------
    { id: 'desk', model: 'desk', logic: 'desk@0,5', against: { wall: 'east', at: 0.55 } },
    { id: 'laptop', model: 'laptop', on: { parent: 'desk' } },
    { id: 'desk-chair', model: 'chairDesk', at: [5.15, 0.55], facing: 'E' },
    // estante larga e fechada contra a espinha, de frente para o escritório: lê-se como estante
    { id: 'shelf-a', model: 'bookcaseClosedWide', logic: 'bookshelf@2,4', against: { wall: 'spine', side: 'E', at: 2.45 } },
    { id: 'books', model: 'books', on: { parent: 'shelf-a', surface: 'top' } },
    { id: 'office-plant', model: 'pottedPlant', at: [5.55, 2.5] },
    // ---- garden ------------------------------------------------------------------
    // four logical plants, four different species, each pulled off its cell
    // centre toward something (the fence, the path, the bench) so the lawn
    // reads as a garden and not as a grid of identical pots
    { id: 'garden-tree', model: 'tree_small', logic: 'plant@3,1', at: [1.25, 3.7] },
    { id: 'garden-bush', model: 'plant_bushDetailed', logic: 'shrub@4,2', at: [2.3, 4.7], yaw: 20 },
    { id: 'garden-flowers', model: 'flower_redA', logic: 'plant@5,3', at: [3.3, 5.35], yaw: -15 },
    { id: 'garden-flowers-b', model: 'flower_purpleA', at: [3.62, 5.62], yaw: 30 },
    { id: 'garden-flowers-c', model: 'flower_yellowA', at: [3.05, 5.7], yaw: 10 },
    { id: 'garden-hedge', model: 'plant_bushLarge', logic: 'shrub@3,4', at: [4.7, 3.55], yaw: 10 },
    // canteiros baixos junto à orla sul, longe da célula central
    { id: 'garden-bush-se', model: 'plant_bushSmall', at: [5.65, 5.65], yaw: -20 },
    { id: 'garden-bush-se-b', model: 'plant_bush', at: [4.95, 5.6], yaw: 35 },
    { id: 'garden-bench', model: 'bench', at: [0.5, 4.6], facing: 'E' },
    { id: 'garden-bush-sw', model: 'plant_bushLarge', at: [0.55, 5.6], yaw: 15 },
    // garden fence along the open west edge, starting clear of the shell corner
    { id: 'fence-a', model: 'fence_simple', at: [0.07, 3.7], facing: 'E' },
    { id: 'fence-b', model: 'fence_simple', at: [0.07, 4.95], facing: 'E' },
  ],
  rugs: [
    { id: 'living-rug', model: 'rugRectangle', at: [1.05, 1.75] },
    { id: 'patio-mat', model: 'rugDoormat', at: [2.6, 2.75] },
    { id: 'path-a', model: 'path_stone', at: [2.6, 3.6] },
    { id: 'path-b', model: 'path_stone', at: [2.6, 4.35] },
  ],
}
