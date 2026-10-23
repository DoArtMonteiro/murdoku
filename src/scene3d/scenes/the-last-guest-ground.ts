import type { SceneSpec } from '../schema'

const stairAt: [number, number] = [4.3, 4.65]

export const theLastGuestGround: SceneSpec = {
  puzzleId: 'master-3',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6.5 },
  shell: {
    features: [
      { wall: 'north', at: 0.9, kind: 'window' },
      { wall: 'west', at: 3.0, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    { id: 'front-yard-west-frame', cells: [3, 0, 4, 2] },
    { id: 'front-yard-east-frame', cells: [5, 0, 7, 2] },
  ],
  floors: [
    { id: 'living-room-wood', cells: [0, 0, 2, 7], material: 'wood' },
    { id: 'front-yard-grass', cells: [3, 0, 7, 2], material: 'grass', kind: 'exterior' },
    { id: 'dining-room-wood', cells: [3, 3, 5, 7], material: 'wood' },
    { id: 'hallway-stone', cells: [6, 3, 7, 7], material: 'stone' },
  ],
  walls: [
    // The garden stays open on its north and east edges; these runs are its house-facing elevations.
    { id: 'living-yard-facade', from: [3, 0], to: [3, 3], height: 'half', openings: [
      { at: 1.5, width: 1.2, kind: 'door' },
    ] },
    { id: 'garden-south-facade', from: [3, 3], to: [8, 3], height: 'half', openings: [
      { at: 5.5, width: 1.2, kind: 'door' },
      { at: 7.0, width: 1.2, kind: 'door' },
    ] },
    { id: 'living-dining', from: [3, 3], to: [3, 8], height: 'half', openings: [
      { at: 6.5, width: 1.25, kind: 'door' },
    ] },
  ],
  furniture: [
    // Sala, norte: sofá virado para o televisor, mesa baixa entre os dois e tapete ao lado.
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@1,0', at: [1.84, 1.5], facing: 'S' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [1.9, 2.17] },
    { id: 'living-television', model: 'cabinetTelevision', logic: 'tv@2,2', at: [2.45, 2.75], facing: 'N' },
    { id: 'living-television-set', model: 'televisionModern', on: { parent: 'living-television' } },
    { id: 'living-area-rug', model: 'rugRectangle', logic: 'rug@2,0', at: [1.0, 3.0], facing: 'E' },
    { id: 'living-north-clock-table', model: 'sideTable', at: [2.35, 0.55], facing: 'S' },
    { id: 'living-north-clock', model: 'radio', logic: 'clock@0,2', on: { parent: 'living-north-clock-table' } },
    // Sala, sul: canto de leitura com sofá e mesa baixa, estante junto à entrada.
    { id: 'living-reading-sofa', model: 'loungeSofa', against: { wall: 'west', at: 4.8 } },
    { id: 'living-reading-table', model: 'tableCoffee', at: [1.15, 4.8], facing: 'E' },
    { id: 'living-south-clock-table', model: 'sideTable', at: [2.5, 4.5], facing: 'E' },
    { id: 'living-south-clock', model: 'radio', logic: 'clock@4,2', on: { parent: 'living-south-clock-table' } },
    { id: 'living-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 7.45 } },
    // Pátio da frente: arbustos, caminho de pedra desde a porta da sala.
    { id: 'yard-shrub-west', model: 'plant_bushSmall', logic: 'shrub@0,3', at: [3.45, 0.45] },
    { id: 'yard-plant-north', model: 'pottedPlant', logic: 'plant@0,5', at: [5.5, 0.5] },
    { id: 'yard-shrub-east', model: 'plant_bushSmall', logic: 'shrub@0,7', at: [7.55, 0.45] },
    { id: 'yard-plant-south', model: 'pottedPlant', logic: 'plant@2,5', at: [5.5, 2.15] },
    { id: 'yard-path-a', model: 'path_stone', at: [3.6, 1.5], facing: 'E' },
    { id: 'yard-path-b', model: 'path_stone', at: [4.55, 1.75], facing: 'E' },
    { id: 'yard-rock', model: 'rock_smallA', at: [6.6, 1.2] },
    // Sala de jantar: mesa encostada à escada com as duas cadeiras; kitchenette na parede sul.
    { id: 'dining-table', model: 'table', at: [5.5, 4.55], facing: 'E' },
    { id: 'dining-chair-north', model: 'chair', logic: 'chair@3,4', at: [4.92, 3.95], facing: 'E' },
    { id: 'dining-chair-yuki', model: 'chair', logic: 'chair@5,4', at: [4.92, 5.1], facing: 'E' },
    { id: 'dining-lamp-idris', model: 'lampRoundFloor', logic: 'lamp@5,3', at: [3.2, 5.5] },
    { id: 'dining-lamp-idris-anchor', model: 'lampRoundFloor', logic: 'lamp@6,5', at: [5.3, 6.2] },
    { id: 'kitchen-fridge', model: 'kitchenFridge', against: { wall: 'living-dining', side: 'E', at: 7.6 }, facing: 'E' },
    { id: 'kitchen-cabinet-west', model: 'kitchenCabinet', against: { wall: 'south', at: 3.72 }, facing: 'N' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'south', at: 4.26 }, facing: 'N' },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'south', at: 4.8 }, facing: 'N' },
    { id: 'kitchen-cabinet-east', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 5.34 }, facing: 'N' },
    { id: 'dining-chair-south', model: 'chair', logic: 'chair@7,5', at: [5.8, 7.3], facing: 'N' },
    // Átrio: consola com rádio, planta, tapete e aparador baixo junto à parede nascente.
    { id: 'hallway-stair-clock-table', model: 'sideTable', at: [6.5, 3.9], facing: 'E' },
    { id: 'hallway-stair-clock', model: 'radio', logic: 'clock@3,6', on: { parent: 'hallway-stair-clock-table' } },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@4,7', at: [7.75, 4.5] },
    { id: 'hallway-rug', model: 'rugSquare', logic: 'rug@5,6', at: [7.0, 6.0], facing: 'S' },
    { id: 'hallway-console', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 7.3 }, facing: 'W' },
    { id: 'hallway-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 5.4 }, facing: 'W' },
  ],
}
