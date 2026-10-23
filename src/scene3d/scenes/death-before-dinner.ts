import type { SceneSpec } from '../schema'

// A service entrance opens into a pantry, with the kitchen and dining table
// beyond it. The office faces a planted side garden. The generous kitchen is
// the centre of this case; the dining setting gives its title a visual anchor.
export const deathBeforeDinner: SceneSpec = {
  puzzleId: 'easy-2',
  floor: 0,
  entry: { wall: 'west', at: 0.65 },
  shell: {
    features: [
      { wall: 'north', at: 4.15, kind: 'window' },
      { wall: 'north', at: 6.2, kind: 'window' },
      { wall: 'west', at: 2.15, kind: 'window' },
    ],
  },
  floors: [
    { id: 'service-tile', cells: [0, 0, 2, 2], material: 'tile' },
    { id: 'kitchen-tile', cells: [3, 0, 6, 3], material: 'tile' },
    { id: 'side-garden', cells: [0, 3, 2, 6], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'service-spine', from: [3, 0], to: [3, 7], openings: [
      { at: 2.5, kind: 'door' },
      { at: 5.25, width: 1.2, kind: 'open' },
    ] },
    { id: 'garden-threshold', from: [0, 3], to: [3, 3], height: 'half', openings: [
      { at: 2.25, width: 1.15, kind: 'open' },
    ] },
    // meia parede: a bancada sul da cozinha encosta-lhe e continua legível
    { id: 'office-divider', from: [3, 4], to: [7, 4], height: 'half', openings: [
      { at: 3.8, kind: 'door' },
    ] },
  ],
  furniture: [
    // Despensa: estantes na parede norte, frigorífico e armário na parede oeste.
    { id: 'arrival-box', model: 'cardboardBoxClosed', logic: 'box@0,0', at: [0.85, 0.45], yaw: 8 },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@1,0', against: { wall: 'west', at: 1.5 } },
    { id: 'pantry-cabinet', model: 'kitchenCabinet', against: { wall: 'west', at: 2.3 } },
    { id: 'pantry-shelf', model: 'bookcaseClosed', against: { wall: 'north', at: 1.55 } },
    { id: 'pantry-shelf-open', model: 'bookcaseOpen', against: { wall: 'north', at: 2.15 } },
    { id: 'pantry-crate', model: 'cardboardBoxOpen', at: [1.55, 0.6] },
    // Cozinha-copa: fogão na parede oeste, bancada com lava-loiça e segundo fogão
    // na meia parede sul, mesa de jantar debaixo da janela norte.
    { id: 'kitchen-fridge', model: 'kitchenFridge', logic: 'fridge@0,3', against: { wall: 'north', at: 3.5 } },
    { id: 'west-cabinet', model: 'kitchenCabinet', against: { wall: 'service-spine', side: 'E', at: 0.95 } },
    { id: 'west-stove', model: 'kitchenStove', logic: 'stove@1,3', against: { wall: 'service-spine', side: 'E', at: 1.5 } },
    { id: 'south-prep', model: 'kitchenCabinetDrawer', against: { wall: 'office-divider', side: 'N', at: 4.7 } },
    { id: 'south-sink', model: 'kitchenSink', logic: 'counter@3,4', against: { wall: 'office-divider', side: 'N', at: 5.25 } },
    { id: 'south-counter', model: 'kitchenCabinet', logic: 'counter@3,4', against: { wall: 'office-divider', side: 'N', at: 5.8 } },
    { id: 'coffee-machine', model: 'kitchenCoffeeMachine', on: { parent: 'south-counter' } },
    { id: 'east-stove', model: 'kitchenStoveElectric', logic: 'stove@3,6', against: { wall: 'office-divider', side: 'N', at: 6.38 } },
    { id: 'east-cabinet', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 3.12 } },
    { id: 'east-toaster', model: 'toaster', on: { parent: 'east-cabinet' } },
    { id: 'dining-table', model: 'table', logic: 'table@0,4', at: [5.0, 0.6] },
    { id: 'dining-chair-west', model: 'chair', at: [4.7, 1.15], facing: 'N' },
    { id: 'dining-chair-south', model: 'chair', at: [5.3, 1.15], facing: 'N' },
    { id: 'dining-chair-east', model: 'chair', at: [5.8, 0.6], facing: 'W' },
    // Escritório: secretária com cadeira junto à parede sul, estante alta a oeste,
    // canto de leitura com relógio a leste.
    { id: 'office-desk', model: 'desk', logic: 'desk@6,4', against: { wall: 'south', at: 4.5 } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [4.5, 6.1], facing: 'S' },
    { id: 'laptop', model: 'laptop', on: { parent: 'office-desk', offset: [-0.12, 0] } },
    { id: 'desk-lamp', model: 'lampSquareTable', on: { parent: 'office-desk', offset: [0.25, 0] } },
    { id: 'office-low-shelf', model: 'bookcaseOpenLow', against: { wall: 'service-spine', side: 'E', at: 6.45 }, facing: 'E' },
    { id: 'office-shelf-books', model: 'books', on: { parent: 'office-low-shelf' } },
    { id: 'office-bookcase', model: 'bookcaseOpenLow', against: { wall: 'east', at: 4.7 } },
    { id: 'office-books', model: 'books', on: { parent: 'office-bookcase' } },
    { id: 'reading-chair', model: 'loungeChair', logic: 'chair@6,6', at: [6.35, 6.65], facing: 'W' },
    { id: 'reading-table', model: 'tableCoffeeSquare', at: [5.7, 6.45] },
    { id: 'clock-console', model: 'sideTable', logic: 'clock@5,6', against: { wall: 'east', at: 5.9 } },
    { id: 'clock-radio', model: 'radio', logic: 'clock@5,6', on: { parent: 'clock-console' } },
    // The garden has a destination, a path, and varied planting along its edge.
    { id: 'garden-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@4,0', at: [0.45, 4.55] },
    { id: 'garden-plant-door', model: 'flower_yellowA', logic: 'plant@4,2', at: [2.45, 4.45], yaw: -12 },
    { id: 'garden-shrub-south', model: 'plant_bushLarge', logic: 'shrub@6,1', at: [1.55, 6.4], yaw: 14 },
    { id: 'garden-plant-south', model: 'flower_redA', logic: 'plant@6,0', at: [0.55, 6.55], yaw: 20 },
    { id: 'garden-flowers', model: 'flower_purpleA', at: [0.9, 6.45], yaw: -18 },
    { id: 'garden-bench', model: 'bench', at: [1.45, 5.45], facing: 'E' },
  ],
  rugs: [
    { id: 'arrival-mat', model: 'rugDoormat', at: [0.45, 0.65], facing: 'E' },
    { id: 'garden-path-1', model: 'path_stone', at: [2.3, 3.55] },
    { id: 'garden-path-2', model: 'path_stone', at: [2.1, 4.3] },
    { id: 'garden-path-3', model: 'path_stone', at: [1.9, 5.05] },
    { id: 'dining-rug', model: 'rugRectangle', at: [5.05, 0.75] },
    { id: 'reading-rug', model: 'rugRound', at: [5.9, 6.2] },
  ],
}
