import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [3.2, 3.7]
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)

export const theSecondStudyStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairHalfRun,
  stairAt[1] - stairHalfWidth,
  stairAt[0] + stairHalfRun,
  stairAt[1] + stairHalfWidth,
]

export const theSecondStudyGround: SceneSpec = {
  puzzleId: 'expert-7',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 7.0 },
  shell: {
    features: [
      { wall: 'north', at: 1.5, kind: 'window' },
      { wall: 'west', at: 1.4, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'E' },
  exteriorSupportBays: [
    { id: 'garden-west-frame', cells: [4, 0, 6, 2] },
    { id: 'garden-east-frame', cells: [7, 0, 7, 2] },
  ],
  floors: [
    { id: 'office-wood', cells: [0, 0, 3, 2], material: 'wood' },
    { id: 'garden-grass', cells: [4, 0, 7, 2], material: 'grass', kind: 'exterior' },
    { id: 'dining-wood', cells: [0, 3, 7, 5], material: 'wood' },
    { id: 'hallway-wood', cells: [0, 6, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'office-dining', from: [0, 3], to: [4, 3], height: 'cutaway', openings: [{ at: 0.8, width: 1.0, kind: 'door' }] },
    { id: 'office-garden-facade', from: [4, 0], to: [4, 3], height: 'half', openings: [{ at: 0.6, width: 0.9, kind: 'open' }] },
    { id: 'garden-dining-threshold', from: [4, 3], to: [8, 3], height: 'half', openings: [{ at: 5.5, width: 0.9, kind: 'open' }] },
    { id: 'dining-hallway', from: [0, 6], to: [8, 6], height: 'half', openings: [{ at: 4.2, width: 1.2, kind: 'door' }] },
  ],
  furniture: [
    // Entrada a poente: tapete e candeeiro de pé junto ao arranque da escada.
    { id: 'dining-rug', model: 'rugRectangle', logic: 'rug@3,0', at: [0.7, 4.0], facing: 'E' },
    { id: 'dining-west-lamp', model: 'lampRoundFloor', logic: 'lamp@5,0', at: [0.35, 5.55], facing: 'S' },
    { id: 'foyer-shelf', model: 'bookcaseOpenLow', against: { wall: 'dining-hallway', side: 'N', at: 2.6 }, facing: 'N' },
    { id: 'foyer-shelf-books', model: 'books', on: { parent: 'foyer-shelf' } },
    // Sala de jantar: mesa com quatro cadeiras junto à porta do corredor, candeeiro de pé.
    { id: 'dining-west-table', model: 'table', logic: 'table@5,5', at: [6, 5.45], facing: 'S' },
    { id: 'dining-west-chair-a', model: 'chair', at: [5.7, 4.85], facing: 'S' },
    { id: 'dining-west-chair-b', model: 'chair', at: [6.3, 4.85], facing: 'S' },
    { id: 'dining-west-chair-c', model: 'chair', at: [5.25, 5.45], facing: 'E' },
    { id: 'dining-west-chair-d', model: 'chair', at: [6.75, 5.45], facing: 'W' },
    { id: 'victim-lamp', model: 'lampRoundFloor', logic: 'lamp@4,4', at: [4.55, 4.45], facing: 'S' },
    // Recanto de estar junto ao jardim: sofá na parede nascente, mesa baixa e poltrona.
    { id: 'dining-east-table', model: 'tableCoffee', logic: 'table@3,6', at: [7.0, 3.5] },
    { id: 'dining-east-chair', model: 'loungeChair', logic: 'chair@4,7', at: [7.0, 4.35], facing: 'N' },
    { id: 'dining-east-sofa', model: 'loungeSofa', against: { wall: 'east', at: 3.75 }, facing: 'W' },
    { id: 'dining-east-armchair', model: 'loungeChair', at: [6.27, 3.6], facing: 'E' },
    // Corredor de entrada: porta da rua a poente, roupeiro, banco, consolas com rádios e vaso.
    { id: 'hallway-wardrobe', model: 'bookcaseClosed', against: { wall: 'dining-hallway', side: 'S', at: 0.8 }, facing: 'S' },
    { id: 'hallway-bench', model: 'bench', against: { wall: 'south', at: 1.6 }, facing: 'N' },
    { id: 'hallway-shoe-shelf', model: 'bookcaseOpenLow', against: { wall: 'south', at: 2.4 }, facing: 'N' },
    { id: 'evangeline-plant', model: 'pottedPlant', logic: 'plant@6,2', at: [2.6, 6.35], facing: 'S' },
    { id: 'hallway-clock-north-table', model: 'sideTable', at: [5.5, 6.35] },
    { id: 'hallway-clock-north', model: 'radio', logic: 'clock@6,5', on: { parent: 'hallway-clock-north-table' } },
    { id: 'hallway-clock-south-table', model: 'sideTable', at: [6.5, 7.65] },
    { id: 'hallway-clock-south', model: 'radio', logic: 'clock@7,6', on: { parent: 'hallway-clock-south-table' } },
    { id: 'hallway-shelf-east', model: 'bookcaseOpenLow', against: { wall: 'east', at: 6.9 }, facing: 'W' },
    // Escritório: duas secretárias em linha na parede nascente, cada uma com a sua cadeira;
    // estantes baixas sob a janela, estante alta a poente e poltrona de leitura no canto.
    { id: 'office-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@0,2', against: { wall: 'north', at: 2.4 } },
    { id: 'office-bookcase-2', model: 'bookcaseOpenLow', against: { wall: 'north', at: 2.95 } },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase' } },
    { id: 'office-bookcase-tall', model: 'bookcaseClosed', against: { wall: 'west', at: 2.15 }, facing: 'E' },
    { id: 'viraj-desk', model: 'desk', logic: 'desk@1,3', against: { wall: 'office-garden-facade', side: 'W', at: 1.52 }, facing: 'W' },
    { id: 'viraj-laptop', model: 'laptop', on: { parent: 'viraj-desk' } },
    { id: 'viraj-desk-chair', model: 'chairDesk', at: [3.15, 1.52], facing: 'E' },
    { id: 'office-desk-south', model: 'desk', logic: 'desk@2,3', against: { wall: 'office-garden-facade', side: 'W', at: 2.48 }, facing: 'W' },
    { id: 'office-desk-south-books', model: 'books', on: { parent: 'office-desk-south' } },
    { id: 'office-desk-south-chair', model: 'chairDesk', at: [3.15, 2.48], facing: 'E' },
    { id: 'office-entry-chair', model: 'loungeChair', logic: 'chair@0,0', at: [0.5, 0.55], facing: 'E' },
    { id: 'office-side-table', model: 'tableCoffeeSquare', at: [1.25, 0.4] },
    // Jardim: vaso e arbustos a norte, banco e caminho de pedra entre as duas aberturas.
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@1,7', at: [7.5, 1.5], facing: 'S' },
    { id: 'garden-plant-west', model: 'pottedPlant', logic: 'plant@0,4', at: [4.95, 0.5], facing: 'S' },
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@0,5', at: [5.5, 0.5], facing: 'S' },
    { id: 'garden-bench', model: 'bench', at: [6.6, 0.3], facing: 'S' },
    { id: 'garden-rock', model: 'rock_smallA', at: [7.4, 2.4] },
    { id: 'garden-stump', model: 'stump_round', at: [6.0, 0.35] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.35, 7.0], facing: 'E' },
    { id: 'hallway-runner', model: 'rugRectangle', at: [3.6, 7.2] },
    { id: 'dining-table-rug', model: 'rugRectangle', at: [6.0, 5.2] },
    { id: 'office-rug', model: 'rugRound', at: [1.0, 1.1] },
    { id: 'garden-path-a', model: 'path_stone', at: [4.7, 0.7], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [5.5, 1.6], facing: 'S' },
    { id: 'garden-path-c', model: 'path_stone', at: [5.5, 2.5], facing: 'S' },
  ],
}
