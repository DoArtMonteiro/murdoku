import type { SceneSpec } from '../schema'

// Moradia de dois pisos: sala comum a norte (conversa a oeste, televisão ao
// centro, refeições a este), átrio de entrada com a escada encostada à fachada
// sul, jardim frontal exterior sob o piso superior (apoiado em pórticos) e
// escritório a sudeste.
export const roomWithoutADoorGround: SceneSpec = {
  puzzleId: 'hard-4',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 4.0 },
  shell: { features: [
    { wall: 'north', at: 1.5, kind: 'window' },
    { wall: 'north', at: 4.6, kind: 'window' },
    { wall: 'north', at: 6.6, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [4.35, 4.36], facing: 'W' },
  exteriorSupportBays: [
    { id: 'yard-bay-west', cells: [0, 5, 2, 7] },
    { id: 'yard-bay-east', cells: [3, 5, 4, 7] },
  ],
  floors: [
    { id: 'living-room', cells: [0, 0, 7, 2], material: 'wood' },
    { id: 'central-hall', cells: [0, 3, 7, 4], material: 'wood' },
    { id: 'front-yard', cells: [0, 5, 4, 7], material: 'grass', kind: 'exterior' },
    { id: 'ground-office', cells: [5, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'living-hall', from: [0, 3], to: [8, 3], height: 'half', openings: [
      { at: 2.6, width: 1.6, kind: 'open' },
    ] },
    { id: 'hall-south', from: [0, 5], to: [8, 5], height: 'half', openings: [
      { at: 1.0, kind: 'door' },
      { at: 7.4, kind: 'door' },
    ] },
    { id: 'court-office', from: [5, 5], to: [5, 8], height: 'half' },
  ],
  furniture: [
    // Sala: sofá comprido a oeste com cadeirões e mesa de centro sobre o tapete;
    // televisão encostada à parede do átrio com sofá virado para ela; mesa de
    // refeições a este entre o relógio de pé e o aparador com rádio.
    { id: 'living-sofa', model: 'loungeSofaLong', logic: 'sofa@1,0', against: { wall: 'west', at: 2.0 }, facing: 'E' },
    { id: 'living-rug-north', model: 'rugRectangle', logic: 'rug@0,1', at: [2.0, 1.45], facing: 'E' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [2.1, 1.55], facing: 'E' },
    { id: 'living-chair', model: 'loungeChair', at: [2.25, 0.45], facing: 'S' },
    { id: 'living-chair-east', model: 'loungeChair', at: [3.1, 1.75], facing: 'W' },
    { id: 'living-floor-lamp', model: 'lampRoundFloor', at: [0.25, 0.3] },
    { id: 'living-television', model: 'cabinetTelevision', logic: 'tv@2,5', against: { wall: 'living-hall', at: 5.5, side: 'N' }, facing: 'N' },
    { id: 'living-television-set', model: 'televisionModern', on: { parent: 'living-television' } },
    { id: 'living-tv-sofa', model: 'loungeSofa', at: [5.5, 1.25], facing: 'S' },
    { id: 'dining-table', model: 'table', at: [7.05, 1.35], facing: 'E' },
    { id: 'dining-chair-nw', model: 'chair', at: [7.05, 0.62], facing: 'S' },
    { id: 'dining-chair-sw', model: 'chair', at: [6.55, 1.35], facing: 'E' },
    { id: 'dining-chair-east', model: 'chair', at: [7.6, 1.35], facing: 'W' },
    { id: 'living-clock-east', model: 'speaker', logic: 'clock@0,7', at: [7.75, 0.25] },
    { id: 'living-clock-south-table', model: 'sideTable', against: { wall: 'east', at: 2.55 }, facing: 'W' },
    { id: 'living-clock-south', model: 'radio', logic: 'clock@2,7', on: { parent: 'living-clock-south-table' } },
    // Átrio: tapete, vasos nas extremidades e mesa de apoio com rádio junto à porta do escritório.
    { id: 'living-rug-south', model: 'rugRectangle', logic: 'rug@3,1', at: [2.0, 4.0], facing: 'S' },
    { id: 'hall-plant-west', model: 'pottedPlant', logic: 'plant@3,3', at: [3.7, 3.3] },
    { id: 'hall-plant-east', model: 'pottedPlant', logic: 'plant@3,7', at: [7.75, 3.3] },
    { id: 'hall-clock-table', model: 'sideTable', against: { wall: 'hall-south', at: 6.62, side: 'N' }, facing: 'N' },
    { id: 'hall-clock', model: 'radio', logic: 'clock@4,6', on: { parent: 'hall-clock-table' } },
    // Átrio: cabide junto à porta da rua.
    { id: 'hall-coat-stand', model: 'coatRackStanding', at: [0.3, 3.3] },
    // Jardim frontal: canteiro de arbustos junto à fachada oeste, vaso de
    // flores, banco de jardim encostado ao escritório, flores e pedras soltas.
    { id: 'court-plant', model: 'pottedPlant', logic: 'plant@5,1', at: [1.75, 5.4] },
    { id: 'court-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@6,0', at: [0.45, 6.4] },
    { id: 'court-shrub-middle', model: 'plant_bushDetailed', logic: 'shrub@7,2', at: [2.4, 7.55] },
    { id: 'court-shrub-east', model: 'plant_bushDetailed', logic: 'shrub@7,3', at: [3.5, 7.45] },
    { id: 'court-bench', model: 'bench', against: { wall: 'court-office', at: 6.3, side: 'W' }, facing: 'W' },
    { id: 'yard-flowers-a', model: 'flower_redA', at: [0.35, 7.3] },
    { id: 'yard-flowers-b', model: 'flower_yellowA', at: [0.7, 7.65] },
    { id: 'yard-flowers-c', model: 'flower_purpleA', at: [4.55, 5.35] },
    // Escritório: estante larga na parede norte, mesa de trabalho com portátil e
    // a cadeira virada para ela, cadeirão de leitura com candeeiro.
    { id: 'office-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@5,5', against: { wall: 'hall-south', at: 6.0, side: 'S' } },
    { id: 'office-table', model: 'table', at: [6.85, 6.75], facing: 'S' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-table' } },
    { id: 'office-chair', model: 'chair', logic: 'chair@7,7', at: [7.25, 7.3], facing: 'N' },
    { id: 'office-armchair', model: 'loungeChair', at: [5.45, 7.3], facing: 'E' },
    { id: 'office-lamp', model: 'lampSquareFloor', at: [5.2, 7.8] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.35, 4.0], facing: 'E' },
    { id: 'yard-path-a', model: 'path_stone', at: [1.0, 5.55], facing: 'S' },
    { id: 'yard-path-b', model: 'path_stone', at: [1.2, 6.4], facing: 'S' },
    { id: 'office-rug', model: 'rugSquare', at: [6.85, 6.9] },
  ],
}
