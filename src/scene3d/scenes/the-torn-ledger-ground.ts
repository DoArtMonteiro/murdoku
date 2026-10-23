import type { SceneSpec } from '../schema'

// A west-side living wing meets the kitchen across a sheltered garden edge.
// The upper study and bath sit over the garden on the two declared timber bays.
const stairAt: [number, number] = [5, 5.25]

export const theTornLedgerGround: SceneSpec = {
  puzzleId: 'master-1',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 1.0 },
  shell: {
    features: [
      { wall: 'north', at: 1.35, kind: 'window' },
      { wall: 'north', at: 3.05, kind: 'window' },
      { wall: 'west', at: 2.3, kind: 'window' },

    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    { id: 'garden-study-support', cells: [4, 0, 5, 2] },
    { id: 'garden-bath-support', cells: [6, 0, 7, 2] },
  ],
  floors: [
    { id: 'living-room-wood', cells: [0, 0, 3, 4], material: 'wood' },
    { id: 'office-wood', cells: [0, 5, 3, 7], material: 'wood' },
    { id: 'open-garden-grass', cells: [4, 0, 7, 2], material: 'grass', kind: 'exterior' },
    { id: 'southeast-kitchen-tile', cells: [4, 3, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'living-office', from: [0, 5], to: [4, 5], openings: [
      { at: 2.2, width: 1.4, kind: 'open' },
    ] },
    { id: 'garden-living-facade', from: [4, 0], to: [4, 3], height: 'half', openings: [
      { at: 1.55, width: 1.2, kind: 'door' },
    ] },
    { id: 'kitchen-garden-facade', from: [4, 3], to: [8, 3], height: 'half' },
    { id: 'living-kitchen', from: [4, 3], to: [4, 5], openings: [
      { at: 3.6, width: 1, kind: 'door' },
    ] },
    { id: 'office-kitchen', from: [3.88, 5], to: [3.88, 8], height: 'half' },
  ],
  furniture: [
    // Sala: canto da televisão a sudoeste (sofá na parede poente, televisor em frente);
    // a norte, sob as janelas, um canto de leitura sobre o tapete; cabide junto à entrada.
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@3,0', against: { wall: 'west', at: 4.0 } },
    { id: 'living-television', model: 'cabinetTelevision', logic: 'tv@4,1', at: [1.25, 4.0], facing: 'W' },
    { id: 'living-television-set', model: 'televisionModern', on: { parent: 'living-television' } },
    { id: 'living-tv-lamp', model: 'lampSquareFloor', at: [0.3, 4.85] },
    { id: 'living-reading-sofa', model: 'loungeSofa', against: { wall: 'north', at: 2.95 } },
    { id: 'living-reading-lamp', model: 'lampRoundFloor', at: [1.95, 0.3] },
    { id: 'living-clock-table', model: 'sideTable', against: { wall: 'garden-living-facade', side: 'W', at: 2.62 }, facing: 'W' },
    { id: 'living-clock', model: 'radio', logic: 'clock@2,3', on: { parent: 'living-clock-table' } },
    { id: 'living-coat-rack', model: 'coatRackStanding', at: [0.3, 0.3] },
    { id: 'living-area-rug', model: 'rugRectangle', logic: 'rug@0,2', at: [3, 1], facing: 'E' },
    // Escritório: secretária na parede sul, poltrona de leitura e estantes na parede poente.
    { id: 'office-desk', model: 'desk', logic: 'desk@7,2', against: { wall: 'south', at: 2.55 }, facing: 'N' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-chair-marco', model: 'loungeChair', logic: 'chair@6,0', at: [0.55, 6.45], facing: 'E' },
    { id: 'office-reading-lamp', model: 'lampRoundFloor', at: [0.3, 5.75] },
    { id: 'office-bookcase', model: 'bookcaseClosed', against: { wall: 'west', at: 7.45 } },
    { id: 'office-shelf', model: 'bookcaseOpenLow', against: { wall: 'office-kitchen', side: 'W', at: 6.0 }, facing: 'W' },
    { id: 'office-shelf-books', model: 'books', on: { parent: 'office-shelf', surface: 'top' } },
    // Jardim: caminho de pedra desde a porta da sala, pedras entre os arbustos.
    { id: 'garden-plant', model: 'pottedPlant', logic: 'plant@1,4', at: [4.75, 1.0], facing: 'S' },
    { id: 'garden-shrub-north', model: 'plant_bushSmall', logic: 'shrub@0,5', at: [5.55, 0.5] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@1,7', at: [7.45, 1.5] },
    { id: 'garden-path-a', model: 'path_stone', at: [4.85, 1.95], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [5.9, 1.95], facing: 'E' },
    { id: 'garden-rock-a', model: 'rock_smallA', at: [7.35, 0.45] },
    { id: 'garden-rock-b', model: 'rock_smallFlatA', at: [6.1, 1.0] },
    // Cozinha: bancada em L (fachada do jardim e parede nascente) com lava-loiça e
    // frigorífico de bancada; o fogão fica no nicho junto ao pé da escada; mesas de refeição.
    { id: 'kitchen-dining-table', model: 'table', logic: 'table@3,4', against: { wall: 'kitchen-garden-facade', side: 'S', at: 5.15 }, facing: 'S' },
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@3,6', against: { wall: 'kitchen-garden-facade', side: 'S', at: 6.27 }, facing: 'S' },
    { id: 'kitchen-counter-b', model: 'kitchenCabinetDrawer', logic: 'counter@3,6', against: { wall: 'kitchen-garden-facade', side: 'S', at: 6.81 }, facing: 'S' },
    { id: 'kitchen-corner', model: 'kitchenCabinet', against: { wall: 'kitchen-garden-facade', side: 'S', at: 7.35 }, facing: 'S' },
    { id: 'kitchen-run-east-a', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 4.0 }, facing: 'W' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'east', at: 4.54 }, facing: 'W' },
    { id: 'kitchen-run-east-c', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 5.08 }, facing: 'W' },
    { id: 'kitchen-run-east-d', model: 'kitchenCabinet', against: { wall: 'east', at: 5.62 }, facing: 'W' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,7', against: { wall: 'east', at: 6.25 }, facing: 'W' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@6,4', against: { wall: 'office-kitchen', side: 'E', at: 6.5 }, facing: 'E' },
    { id: 'kitchen-stove-cabinet', model: 'kitchenCabinet', against: { wall: 'office-kitchen', side: 'E', at: 7.04 }, facing: 'E' },
    { id: 'kitchen-table-lena', model: 'table', logic: 'table@7,4', at: [5.45, 7.55], facing: 'S' },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.3, 1.0], facing: 'E' },
    { id: 'living-tv-rug', model: 'rugSquare', at: [0.85, 4.0] },
    { id: 'office-rug', model: 'rugRound', at: [1.4, 6.6] },
  ],
}
