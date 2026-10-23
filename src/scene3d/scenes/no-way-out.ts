import type { SceneSpec } from '../schema'

// A walled urban property with a front court, a transverse entrance hall,
// a compact pantry and a garden court. The two outdoor puzzle zones are real
// exterior ground, joined to the house by visible thresholds.
export const noWayOut: SceneSpec = {
  puzzleId: 'easy-4',
  floor: 0,
  entry: { wall: 'west', at: 4.5 },
  shell: {
    features: [
      { wall: 'north', at: 5.55, kind: 'window' },
    ],
  },
  floors: [
    { id: 'front-yard', cells: [0, 0, 3, 2], material: 'grass', kind: 'exterior' },
    { id: 'pantry-tile', cells: [4, 0, 6, 2], material: 'tile', kind: 'interior' },
    { id: 'entrance-hall', cells: [0, 3, 6, 4], material: 'stone', kind: 'interior' },
    { id: 'garden-court', cells: [0, 5, 6, 6], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'front-yard-hall', from: [0, 3], to: [4, 3], height: 'half', openings: [{ at: 2.8, width: 1.15, kind: 'open' }] },
    { id: 'front-yard-pantry', from: [4, 0], to: [4, 3], height: 'half' },
    { id: 'pantry-hall', from: [4, 3], to: [7, 3], height: 'half', openings: [{ at: 6.3, kind: 'door' }] },
    { id: 'hall-garden', from: [0, 5], to: [7, 5], height: 'half', openings: [{ at: 3.65, width: 1.2, kind: 'open' }] },
  ],
  furniture: [
    // Despensa: bancada com lava-loiça e armário de canto sob a janela norte,
    // prateleira baixa a leste, caixas a oeste e frigorífico encostado à meia parede do átrio.
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@0,4', against: { wall: 'north', at: 4.45 } },
    { id: 'pantry-sink', model: 'kitchenSink', logic: 'counter@0,4', against: { wall: 'north', at: 5.25 } },
    { id: 'pantry-drawers', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 5.95 } },
    { id: 'pantry-corner', model: 'kitchenCabinet', against: { wall: 'east', at: 0.85 } },
    { id: 'pantry-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 1.6 } },
    { id: 'pantry-shelf-books', model: 'books', on: { parent: 'pantry-shelf', surface: 'top' } },
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@1,4', at: [4.3, 1.45] },
    { id: 'pantry-crate', model: 'cardboardBoxOpen', at: [4.3, 1.95] },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,5', at: [5.4, 2.62], facing: 'N' },
    // Átrio de entrada: relógios de pé, banco, consola e cabide ao longo das meias paredes;
    // o centro fica livre entre a porta e os dois pátios.
    { id: 'hall-coat-rack', model: 'coatRackStanding', at: [0.35, 3.7] },
    { id: 'hall-clock-front', model: 'speaker', logic: 'clock@3,0', against: { wall: 'front-yard-hall', side: 'S', at: 0.6 } },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'front-yard-hall', side: 'S', at: 1.1 } },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@3,1', against: { wall: 'front-yard-hall', side: 'S', at: 1.7 } },
    { id: 'hall-clock-garden', model: 'speaker', logic: 'clock@4,2', against: { wall: 'hall-garden', side: 'N', at: 2.5 } },
    { id: 'hall-console', model: 'sideTable', against: { wall: 'hall-garden', side: 'N', at: 5.2 } },
    { id: 'hall-lamp', model: 'lampSquareTable', on: { parent: 'hall-console' } },
    { id: 'hall-shelf', model: 'bookcaseOpenLow', against: { wall: 'hall-garden', side: 'N', at: 6.3 } },
    { id: 'hall-books', model: 'books', on: { parent: 'hall-shelf', surface: 'top' } },
    // Pátio da frente: vedação a norte e oeste, banco junto à vedação, cepo junto ao caminho.
    { id: 'front-plant-victim', model: 'flower_yellowA', logic: 'plant@0,2', at: [2.5, 0.5] },
    { id: 'front-plant-east', model: 'flower_redA', logic: 'plant@0,3', at: [3.5, 0.5] },
    { id: 'front-shrub-yuki', model: 'plant_bushDetailed', logic: 'shrub@2,1', at: [1.5, 2.5] },
    { id: 'front-shrub-east', model: 'plant_bushDetailed', logic: 'shrub@1,3', at: [3.3, 1.35] },
    { id: 'front-fence-a', model: 'fence_simple', at: [0.75, 0.07], facing: 'S' },
    { id: 'front-fence-b', model: 'fence_simple', at: [0.07, 1.4], facing: 'E' },
    { id: 'front-bench', model: 'bench', at: [0.45, 1.2], facing: 'E' },
    { id: 'front-stump', model: 'stump_round', at: [0.55, 2.55] },
    // Jardim: banco contra a meia parede do átrio, cepo e laje de pedra, tronco a leste.
    { id: 'garden-plant', model: 'flower_purpleA', logic: 'plant@5,2', at: [2.5, 5.5] },
    { id: 'garden-shrub-north', model: 'plant_bushLarge', logic: 'shrub@6,4', at: [4.5, 6.5] },
    { id: 'garden-shrub-evangeline', model: 'plant_bush', logic: 'shrub@6,0', at: [0.5, 6.5] },
    { id: 'garden-fence', model: 'fence_simple', at: [0.07, 5.75], facing: 'E' },
    { id: 'garden-bench', model: 'bench', against: { wall: 'hall-garden', side: 'S', at: 5.6 } },
    { id: 'garden-stump', model: 'stump_round', at: [1.45, 6.4] },
    { id: 'garden-rock-b', model: 'rock_smallFlatA', at: [1.2, 5.45] },
    { id: 'garden-log', model: 'log', at: [6.45, 6.3], facing: 'E' },
  ],
  rugs: [
    { id: 'front-path', model: 'path_stone', at: [2.75, 2.45] },
    { id: 'front-path-2', model: 'path_stone', at: [2.2, 1.6] },
    { id: 'hall-runner', model: 'rugRectangle', at: [3.6, 4.0], facing: 'E' },
    { id: 'garden-path', model: 'path_stone', at: [3.6, 5.5] },
    { id: 'garden-path-2', model: 'path_stone', at: [4.7, 5.75] },
  ],
}
