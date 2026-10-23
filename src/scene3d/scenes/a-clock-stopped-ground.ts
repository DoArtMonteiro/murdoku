import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairRunCells = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidthCells = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairHeadRow = 7
const stairAt: [number, number] = [5.1, stairHeadRow - stairRunCells / 2]
const stairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidthCells / 2,
  stairAt[1] - stairRunCells / 2,
  stairAt[0] + stairWidthCells / 2,
  stairHeadRow,
]

export const aClockStoppedStairwellBounds = stairwellBounds

export const aClockStoppedGround: SceneSpec = {
  puzzleId: 'expert-6',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 1.5 },
  shell: {
    features: [{ wall: 'north', at: 1.5, kind: 'window' }],
  },
  exteriorSupportBays: [
    { id: 'garden-west', cells: [3, 0, 5, 2] },
    { id: 'garden-east', cells: [6, 0, 7, 2] },
    { id: 'front-yard-west-middle', cells: [0, 3, 1, 5] },
    { id: 'front-yard-east-middle', cells: [2, 3, 3, 5] },
    { id: 'front-yard-west-south', cells: [0, 6, 1, 7] },
    { id: 'front-yard-east-south', cells: [2, 6, 3, 7] },
  ],
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  floors: [
    { id: 'garden', cells: [3, 0, 7, 2], material: 'grass', kind: 'exterior' },
    { id: 'front-yard', cells: [0, 3, 3, 7], material: 'dirt', kind: 'exterior' },
    { id: 'pantry-tile', cells: [0, 0, 2, 2], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'pantry-garden', from: [3, 0], to: [3, 3], height: 'cutaway', openings: [{ at: 1.25, width: 1.2, kind: 'open' }] },
    { id: 'pantry-front-yard', from: [0, 3], to: [3, 3], height: 'cutaway', openings: [{ at: 1.5, width: 1, kind: 'door' }] },
    { id: 'office-front-yard', from: [4, 3], to: [4, 8], height: 'cutaway', openings: [{ at: 4.2, width: 1, kind: 'door' }] },
    { id: 'office-garden', from: [4, 3], to: [8, 3], height: 'cutaway' },
  ],
  furniture: [
    // Pátio da frente: terreiro coberto pela laje, com banco e mesa de exterior junto à porta da copa.
    { id: 'front-shrub', model: 'plant_bushSmall', logic: 'shrub@3,3', at: [3.55, 3.45] },
    { id: 'front-plant', model: 'plant_bushSmall', logic: 'plant@7,1', at: [1.5, 7.5] },
    { id: 'front-entry-shrub', model: 'plant_bushSmall', logic: 'shrub@6,0', at: [0.5, 6.5] },
    { id: 'front-bench', model: 'bench', at: [0.3, 4.4], facing: 'E' },
    { id: 'front-table', model: 'tableCoffeeSquare', at: [0.95, 4.4] },
    { id: 'front-stump', model: 'stump_round', at: [1.55, 4.4] },
    { id: 'front-rock', model: 'rock_smallA', at: [2.75, 7.45] },
    { id: 'front-log', model: 'log', at: [0.4, 7.4] },
    // Escritório: secretária de trabalho e cadeira junto à parede do jardim, estante larga
    // à chegada da escada, secretária de pé contra a parede poente e canto de leitura a sudeste.
    { id: 'office-solution-desk', model: 'desk', logic: 'desk@3,7', against: { wall: 'office-garden', side: 'S', at: 7.4 }, facing: 'S' },
    { id: 'office-solution-laptop', model: 'laptop', on: { parent: 'office-solution-desk' } },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@4,7', at: [7.4, 4.1], facing: 'N' },
    { id: 'office-clock-stand', model: 'sideTable', against: { wall: 'office-garden', side: 'S', at: 6.45 }, facing: 'S' },
    { id: 'office-clock', model: 'radio', logic: 'clock@3,6', on: { parent: 'office-clock-stand' } },
    { id: 'office-bookcase-north', model: 'bookcaseOpenLow', against: { wall: 'office-garden', side: 'S', at: 4.75 }, facing: 'S' },
    { id: 'office-bookcase-north-2', model: 'bookcaseOpenLow', against: { wall: 'office-garden', side: 'S', at: 5.3 }, facing: 'S' },
    { id: 'office-bookcase-north-books', model: 'books', on: { parent: 'office-bookcase-north-2' } },
    { id: 'office-desk', model: 'desk', logic: 'desk@5,4', against: { wall: 'office-front-yard', side: 'E', at: 5.6 }, facing: 'E' },
    { id: 'office-desk-books', model: 'books', on: { parent: 'office-desk' } },
    { id: 'office-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@7,4', against: { wall: 'south', at: 5 } },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase' } },
    { id: 'office-reading-west', model: 'loungeChair', at: [6.3, 6.45], facing: 'E' },
    { id: 'office-reading-east', model: 'loungeChair', at: [7.6, 6.45], facing: 'W' },
    { id: 'office-reading-table', model: 'tableCoffeeSquare', at: [6.95, 6.45] },
    { id: 'office-reading-books', model: 'books', on: { parent: 'office-reading-table' } },
    // Copa de entrada: frigorífico na parede poente, bancada com lava-loiça e placa sob a
    // janela norte e estante de despensa junto à abertura do jardim.
    { id: 'pantry-fridge', model: 'kitchenFridge', logic: 'fridge@2,0', against: { wall: 'west', at: 2.5 }, facing: 'E' },
    { id: 'pantry-cabinet', model: 'kitchenCabinet', against: { wall: 'north', at: 0.4 }, facing: 'S' },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'north', at: 0.94 }, facing: 'S' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'north', at: 1.48 }, facing: 'S' },
    { id: 'pantry-counter', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 2.02 }, facing: 'S' },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter' } },
    { id: 'pantry-shelves', model: 'bookcaseClosed', against: { wall: 'north', at: 2.65 }, facing: 'S' },
    { id: 'pantry-box-north', model: 'cardboardBoxClosed', logic: 'box@1,2', at: [2.15, 1.3] },
    { id: 'pantry-box-south', model: 'cardboardBoxClosed', logic: 'box@2,2', at: [2.4, 2.15] },
    { id: 'pantry-bin', model: 'trashcan', at: [0.3, 0.85] },
    // Jardim: vasos no canto nordeste, arbusto a norte e um banco de pedra junto ao caminho.
    { id: 'garden-shrub', model: 'plant_bushSmall', logic: 'shrub@0,4', at: [4.5, 0.5] },
    { id: 'garden-plant-east', model: 'pottedPlant', logic: 'plant@0,7', at: [7.5, 0.5] },
    { id: 'garden-plant-south-east', model: 'pottedPlant', logic: 'plant@1,7', at: [7.5, 1.5] },
    { id: 'garden-bench', model: 'bench', at: [5.9, 0.3], facing: 'S' },
    { id: 'garden-rock', model: 'rock_smallB', at: [6.1, 1.55] },
  ],
  rugs: [
    { id: 'front-path-a', model: 'path_stone', at: [1.5, 3.55], facing: 'S' },
    { id: 'front-path-b', model: 'path_stone', at: [1.9, 5.0], facing: 'S' },
    { id: 'front-path-c', model: 'path_stone', at: [3.2, 4.2], facing: 'E' },
    { id: 'garden-path-a', model: 'path_stone', at: [3.7, 1.25], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [4.9, 1.6], facing: 'E' },
    { id: 'office-rug', model: 'rugSquare', at: [6.95, 6.45] },
    { id: 'pantry-mat', model: 'rugDoormat', at: [0.35, 1.5], facing: 'E' },
  ],
}
