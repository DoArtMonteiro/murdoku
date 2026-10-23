import type { SceneSpec } from '../schema'

// A side garden separates the entry hall from the office; the south yard
// continues around it as open ground beneath the measured support frame.
export const aQuietConfessionGround: SceneSpec = {
  puzzleId: 'expert-10',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6 },
  stairs: { model: 'stairsOpen', at: [6.5, 1.97], facing: 'N' },
  exteriorSupportBays: [
    { id: 'garden-north', cells: [2, 0, 3, 2] },
    { id: 'garden-middle', cells: [2, 3, 3, 5] },
    { id: 'garden-south', cells: [2, 6, 3, 7] },
    { id: 'front-yard-west', cells: [4, 5, 5, 7] },
    { id: 'front-yard-east', cells: [6, 5, 7, 7] },
  ],
  shell: { features: [
    { wall: 'north', at: 6, kind: 'window' },
    { wall: 'west', at: 2.5, kind: 'window' },
  ] },
  floors: [
    { id: 'hallway-floor', cells: [0, 0, 1, 7], material: 'stone' },
    { id: 'garden-ground', cells: [2, 0, 3, 7], material: 'grass', kind: 'exterior' },
    { id: 'office-floor', cells: [4, 0, 7, 4], material: 'wood' },
    { id: 'front-yard-ground', cells: [4, 5, 7, 7], material: 'dirt', kind: 'exterior' },
  ],
  walls: [
    { id: 'hall-garden', from: [2, 0], to: [2, 8], height: 'half', openings: [{ at: 6.4, width: 1, kind: 'door' }] },
    { id: 'garden-office', from: [4, 0], to: [4, 5], height: 'half', openings: [{ at: 2, width: 1, kind: 'door' }] },
    { id: 'office-front-yard', from: [4, 5], to: [8, 5], height: 'half', openings: [{ at: 4.75, width: 1, kind: 'door' }] },
  ],
  furniture: [
    // Corredor de entrada: tapete, relógio de pé e vasos, banco e estante nas paredes.
    { id: 'hall-entry-rug', model: 'rugRectangle', logic: 'rug@3,0', at: [1, 4], facing: 'E' },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@2,1', at: [1.5, 2.5] },
    { id: 'hall-plant-south', model: 'pottedPlant', logic: 'plant@1,0', at: [0.5, 1.5] },
    { id: 'hall-plant-north', model: 'pottedPlant', logic: 'plant@0,0', at: [0.5, 0.5] },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'hall-garden', side: 'W', at: 5.3 }, facing: 'W' },
    { id: 'hall-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 4.95 }, facing: 'E' },
    { id: 'hall-console', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 7.35 }, facing: 'E' },
    // Jardim lateral: arbustos e vaso, rochas e caminho de pedra até à porta do escritório.
    { id: 'garden-shrub-north', model: 'plant_bushSmall', logic: 'shrub@0,3', at: [3.5, 0.5] },
    { id: 'garden-shrub-clue', model: 'plant_bushSmall', logic: 'shrub@4,2', at: [2.5, 4.5] },
    { id: 'garden-plant', model: 'pottedPlant', logic: 'plant@3,3', at: [3.5, 3.5] },
    { id: 'garden-shrub-south', model: 'plant_bushSmall', logic: 'shrub@7,3', at: [3.5, 7.5] },
    { id: 'garden-rock', model: 'rock_smallA', at: [2.45, 1.3] },
    { id: 'garden-stump', model: 'stump_round', at: [3.55, 5.6] },
    // Escritório: estantes a norte, cadeira de leitura no canto nordeste, recanto com sofá
    // e mesa baixa a poente, secretária com cadeira e rádio a sul da escada.
    { id: 'office-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@0,4', against: { wall: 'north', at: 4.8 } },
    { id: 'office-bookshelf-books', model: 'books', on: { parent: 'office-bookshelf' } },
    { id: 'office-bookcase-tall', model: 'bookcaseClosedWide', against: { wall: 'north', at: 5.55 } },
    { id: 'office-chair', model: 'chair', logic: 'chair@0,7', at: [7.5, 0.6], facing: 'S' },
    { id: 'office-shelf-east', model: 'bookcaseOpenLow', against: { wall: 'east', at: 2.0 }, facing: 'W' },
    { id: 'office-shelf-east-books', model: 'books', on: { parent: 'office-shelf-east' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'garden-office', side: 'E', at: 3.6 }, facing: 'E' },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [5.1, 3.6], facing: 'E' },
    { id: 'office-clock-table', model: 'sideTable', at: [5.5, 4.3], facing: 'E' },
    { id: 'office-clock', model: 'radio', logic: 'clock@4,5', on: { parent: 'office-clock-table' } },
    { id: 'office-desk', model: 'desk', logic: 'desk@4,6', at: [6.75, 4.5], facing: 'W' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [6.1, 4.5], facing: 'E' },
    // Terreiro da frente: arbustos, vaso, banco, tronco e caminho até à porta do escritório.
    { id: 'yard-shrub-west', model: 'plant_bushSmall', logic: 'shrub@5,4', at: [4.5, 5.8] },
    { id: 'yard-plant-east', model: 'pottedPlant', logic: 'plant@5,7', at: [7.5, 5.5] },
    { id: 'yard-shrub-south', model: 'plant_bushSmall', logic: 'shrub@7,5', at: [5.5, 7.5] },
    { id: 'yard-bench', model: 'bench', at: [7.7, 6.7], facing: 'W' },
    { id: 'yard-log', model: 'log', at: [6.6, 7.6], facing: 'E' },
    { id: 'yard-rock', model: 'rock_smallB', at: [4.4, 7.4] },
  ],
  rugs: [
    { id: 'office-rug', model: 'rugSquare', at: [5.0, 3.6] },
    { id: 'garden-path-a', model: 'path_stone', at: [3.0, 6.4], facing: 'S' },
    { id: 'garden-path-b', model: 'path_stone', at: [3.1, 2.1], facing: 'E' },
    { id: 'yard-path-a', model: 'path_stone', at: [4.75, 5.9], facing: 'S' },
    { id: 'yard-path-b', model: 'path_stone', at: [5.0, 6.9], facing: 'S' },
  ],
}
