import type { SceneSpec } from '../schema'

// Four rooms share a single shell. Openings on all four sides of the cross
// partition let visitors follow a clear loop around the house.
export const theVanishingAct: SceneSpec = {
  puzzleId: 'easy-7',
  floor: 0,
  entry: { wall: 'west', at: 5.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.45, kind: 'window' },
      { wall: 'north', at: 2.65, kind: 'window' },
    ],
  },
  floors: [
    { id: 'kitchen', cells: [0, 0, 3, 3], material: 'tile', kind: 'interior' },
    { id: 'front-yard', cells: [4, 0, 6, 3], material: 'grass', kind: 'courtyard' },
    { id: 'porch', cells: [0, 4, 3, 6], material: 'stone', kind: 'interior' },
    { id: 'pantry', cells: [4, 4, 6, 6], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'kitchen-yard', from: [4, 0], to: [4, 4], height: 'half', openings: [
      { at: 0.8, width: 1.1, kind: 'door' },
    ] },
    { id: 'porch-pantry', from: [4, 4], to: [4, 7], height: 'half', openings: [
      { at: 5.5, width: 1.1, kind: 'door' },
    ] },
    { id: 'kitchen-porch', from: [0, 4], to: [4, 4], height: 'half', openings: [
      { at: 0.8, width: 1.1, kind: 'door' },
    ] },
    // a porta da despensa desloca-se para leste: o aro deixava de tapar o arbusto da célula R4C5
    { id: 'yard-pantry', from: [4, 4], to: [7, 4], height: 'half', openings: [
      { at: 6.0, width: 1.1, kind: 'door' },
    ] },
  ],
  furniture: [
    // Cozinha: bancada em L (lava-loiça e frigorífico a norte, fogão a oeste),
    // balcão de serviço junto à meia parede do pátio e mesa com três cadeiras sob a janela.
    { id: 'kitchen-corner', model: 'kitchenCabinet', against: { wall: 'north', at: 0.35 } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'north', at: 0.9 } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@0,1', against: { wall: 'north', at: 1.5 } },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'west', at: 1.0 } },
    { id: 'kitchen-west-drawers', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 1.55 } },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-west-drawers' } },
    { id: 'kitchen-west-cabinet', model: 'kitchenCabinet', against: { wall: 'west', at: 2.1 } },
    { id: 'kitchen-toaster', model: 'toaster', on: { parent: 'kitchen-west-cabinet' } },
    { id: 'kitchen-counter-a', model: 'kitchenCabinet', logic: 'counter@2,3', against: { wall: 'kitchen-yard', side: 'W', at: 2.3 } },
    { id: 'kitchen-sink-run', model: 'kitchenCabinetDrawer', logic: 'counter@2,3', against: { wall: 'kitchen-yard', side: 'W', at: 2.85 } },
    { id: 'kitchen-counter-b', model: 'kitchenCabinet', logic: 'counter@2,3', against: { wall: 'kitchen-yard', side: 'W', at: 3.4 } },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-counter-a' } },
    { id: 'kitchen-table', model: 'table', logic: 'table@0,2', at: [2.65, 0.8], facing: 'E' },
    { id: 'kitchen-chair-west', model: 'chair', at: [2.12, 0.8], facing: 'E' },
    { id: 'kitchen-chair-east', model: 'chair', at: [3.18, 0.8], facing: 'W' },
    { id: 'kitchen-chair-south', model: 'chair', at: [2.45, 1.5], facing: 'N' },
    // Pátio: arbustos e flores das pistas, banco, cepo e caminho entre as duas portas.
    { id: 'yard-shrub-east', model: 'plant_bushSmall', logic: 'shrub@2,6', at: [6.68, 2.55] },
    { id: 'yard-flowers-north', model: 'flower_yellowA', logic: 'plant@0,4', at: [4.75, 0.25] },
    { id: 'yard-flowers-east', model: 'flower_purpleA', logic: 'plant@1,6', at: [6.55, 1.5] },
    { id: 'yard-shrub-victim', model: 'plant_bushDetailed', logic: 'shrub@3,4', at: [4.55, 3.3] },
    { id: 'yard-shrub-killer', model: 'plant_bushSmall', logic: 'shrub@1,5', at: [5.72, 1.45] },
    { id: 'yard-bench', model: 'bench', at: [5.45, 0.2], facing: 'S' },
    { id: 'yard-flowers-red', model: 'flower_redA', at: [6.3, 0.3], yaw: 15 },
    { id: 'yard-stump', model: 'stump_round', at: [4.35, 2.35] },
    // Alpendre: mesa baixa com cadeira e cadeirão junto à entrada, banco contra o parapeito sul, vaso e candeeiro.
    { id: 'porch-table', model: 'tableCoffeeSquare', at: [2.55, 5.45] },
    { id: 'porch-chair', model: 'chair', logic: 'chair@5,3', at: [3.15, 5.45], facing: 'W' },
    { id: 'porch-armchair', model: 'loungeChair', at: [1.9, 5.45], facing: 'E' },
    { id: 'porch-bench', model: 'benchCushion', against: { wall: 'south', at: 2.5 } },
    { id: 'porch-flowers', model: 'pottedPlant', logic: 'plant@4,2', against: { wall: 'kitchen-porch', side: 'S', at: 2.5 } },
    { id: 'porch-lamp', model: 'lampRoundFloor', at: [3.55, 4.35] },
    // Despensa: frigorífico no canto noroeste, estante alta a oeste, armário e prateleira baixa, caixas a leste.
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@4,4', against: { wall: 'yard-pantry', side: 'S', at: 4.4 } },
    { id: 'pantry-shelf', model: 'bookcaseClosed', against: { wall: 'porch-pantry', side: 'E', at: 6.4 } },
    { id: 'pantry-cabinet', model: 'kitchenCabinet', against: { wall: 'south', at: 5.3 } },
    { id: 'pantry-low-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 4.75 } },
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@5,6', at: [6.6, 5.6] },
    { id: 'pantry-crate', model: 'cardboardBoxOpen', at: [6.6, 6.25] },
  ],
  rugs: [
    { id: 'kitchen-rug', model: 'rugRound', at: [2.65, 0.95] },
    { id: 'porch-rug', model: 'rugRectangle', at: [2.5, 5.5] },
    { id: 'yard-path-a', model: 'path_stone', at: [4.7, 0.85], facing: 'E' },
    { id: 'yard-path-b', model: 'path_stone', at: [5.2, 2.0] },
    { id: 'yard-path-c', model: 'path_stone', at: [6.0, 3.3] },
  ],
}
