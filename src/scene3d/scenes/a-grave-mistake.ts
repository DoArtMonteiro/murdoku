import type { SceneSpec } from '../schema'

// The east wing holds the hallway and kitchen. Dining rooms extend south-west
// around a small garden open to the north-west.
export const aGraveMistake: SceneSpec = {
  puzzleId: 'easy-6',
  floor: 0,
  entry: { wall: 'north', at: 4.2 },
  shell: {
    features: [
      { wall: 'north', at: 4.85, kind: 'window' },
      { wall: 'west', at: 5.3, kind: 'window' },
    ],
  },
  storeyFootprint: {
    kind: 'cell-rects',
    rects: [
      [3, 0, 6, 6],
      [0, 3, 2, 6],
      [0, 0, 2, 2],
    ],
  },
  floors: [
    { id: 'north-garden', cells: [0, 0, 2, 2], material: 'grass', kind: 'exterior' },
    { id: 'dining-room', cells: [0, 3, 2, 6], material: 'wood', kind: 'interior' },
    { id: 'kitchen', cells: [5, 0, 6, 6], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'garden-hall-dining', from: [3, 0], to: [3, 7], height: 'half', openings: [
      { at: 1.5, width: 1.1, kind: 'door' },
      // passagem larga sem aro: a sala de jantar abre-se ao corredor sem tapar o candeeiro
      { at: 5.5, width: 1.1, kind: 'open' },
    ] },
    { id: 'garden-dining-edge', from: [0, 3], to: [3, 3], height: 'half', openings: [
      { at: 1.45, width: 1.1, kind: 'open' },
    ] },
    { id: 'hall-kitchen', from: [5, 0], to: [5, 7], height: 'half', openings: [
      { at: 6.2, width: 1.1, kind: 'door' },
    ] },
  ],
  furniture: [
    // Corredor: mesa com rádio junto à porta, vaso, banco e estante baixa ao longo das meias paredes.
    { id: 'hall-clock-table', model: 'sideTable', against: { wall: 'hall-kitchen', side: 'W', at: 0.62 } },
    { id: 'hall-clock-radio', model: 'radio', logic: 'clock@0,4', on: { parent: 'hall-clock-table' } },
    { id: 'hall-flowers', model: 'pottedPlant', logic: 'plant@1,4', against: { wall: 'hall-kitchen', side: 'W', at: 1.5 } },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'garden-hall-dining', side: 'E', at: 2.6 } },
    { id: 'hall-shelf', model: 'bookcaseOpenLow', against: { wall: 'hall-kitchen', side: 'W', at: 3.3 } },
    { id: 'hall-books', model: 'books', on: { parent: 'hall-shelf' } },
    // Jardim da frente: arbustos visíveis, flores em grupo, banco e vedação nos limites abertos.
    { id: 'garden-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@2,0', at: [0.45, 2.3] },
    { id: 'garden-shrub-clue', model: 'plant_bushDetailed', logic: 'shrub@2,1', at: [1.55, 2.05] },
    { id: 'garden-flowers', model: 'flower_purpleA', logic: 'plant@0,1', at: [1.5, 0.58] },
    { id: 'garden-flowers-red', model: 'flower_redA', at: [1.8, 0.4], yaw: 20 },
    { id: 'garden-flowers-yellow', model: 'flower_yellowA', at: [1.2, 0.35], yaw: -15 },
    { id: 'garden-fence-north', model: 'fence_simple', at: [0.75, 0.07], facing: 'S' },
    { id: 'garden-fence-west', model: 'fence_simple', at: [0.07, 1.2], facing: 'E' },
    { id: 'garden-bench', model: 'bench', at: [0.38, 1.35], facing: 'E' },
    { id: 'garden-stump', model: 'stump_round', at: [0.5, 0.5] },
    // Sala de jantar: mesa com quatro cadeiras sobre o tapete, aparador e estante na parede oeste.
    { id: 'dining-table', model: 'table', at: [1.0, 4.62] },
    { id: 'dining-chair', model: 'chair', logic: 'chair@3,1', at: [1.3, 3.97], facing: 'S' },
    { id: 'dining-chair-nw', model: 'chair', at: [0.7, 3.97], facing: 'S' },
    { id: 'dining-chair-sw', model: 'chair', at: [0.7, 5.27], facing: 'N' },
    { id: 'dining-chair-se', model: 'chair', at: [1.3, 5.27], facing: 'N' },
    { id: 'dining-rug', model: 'rugRectangle', logic: 'rug@4,0', at: [1, 5] },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@5,2', at: [2.25, 5.2] },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'south', at: 2.1 } },
    { id: 'dining-shelf', model: 'bookcaseOpenLow', against: { wall: 'garden-dining-edge', side: 'S', at: 2.5 } },
    // Cozinha em galé: mesa de pequeno-almoço a norte; bancada com lava-loiça e frigorífico a leste,
    // fogão e armário com micro-ondas na meia parede do corredor, recuados a sul
    // para deixar livre a célula do corredor R4C5.
    { id: 'kitchen-table', model: 'table', at: [6.0, 0.95], facing: 'E' },
    { id: 'kitchen-chair-west', model: 'chair', at: [5.45, 0.95], facing: 'E' },
    { id: 'kitchen-chair-east', model: 'chair', at: [6.55, 0.95], facing: 'W' },
    { id: 'kitchen-cabinet-a', model: 'kitchenCabinet', against: { wall: 'east', at: 2.1 } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'east', at: 2.65 }, facing: 'W' },
    { id: 'kitchen-cabinet-b', model: 'kitchenCabinet', against: { wall: 'east', at: 3.2 } },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-cabinet-b' } },
    { id: 'kitchen-drawers', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 3.75 } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@4,6', at: [6.62, 4.5], facing: 'W' },
    { id: 'kitchen-cabinet-e', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 5.25 } },
    { id: 'kitchen-cabinet-f', model: 'kitchenCabinet', against: { wall: 'east', at: 5.8 } },
    { id: 'kitchen-toaster', model: 'toaster', on: { parent: 'kitchen-cabinet-f' } },
    { id: 'kitchen-bin', model: 'trashcan', at: [6.7, 6.7] },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@4,5', against: { wall: 'hall-kitchen', side: 'E', at: 4.72 } },
    { id: 'kitchen-cabinet-d', model: 'kitchenCabinetDrawer', against: { wall: 'hall-kitchen', side: 'E', at: 5.27 } },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-d' } },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [1.45, 2.75] },
  ],
}
