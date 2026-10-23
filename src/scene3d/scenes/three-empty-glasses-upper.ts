import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [7.25, 2.5]
const halfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const halfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const well: [number, number, number, number] = [
  stairAt[0] - halfWidth,
  stairAt[1] - halfRun,
  stairAt[0] + halfWidth,
  stairAt[1] + halfRun,
]
// A escada chega a norte do estúdio; um corredor a poente do vão desce até ao átrio
// sul, que serve a casa de banho, e um ramo pelo estúdio leva à porta do quarto.
export const threeEmptyGlassesUpper: SceneSpec = {
  puzzleId: 'hard-8',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], well[1] - 0.8, well[2], well[1]],
    halls: [
      { id: 'landing-west-link', bounds: [5.9, 0.56, well[0], 1.36] },
      { id: 'stair-west-lane', bounds: [5.9, 0.56, well[0] - 0.05, 5.3] },
      { id: 'bedroom-branch', bounds: [4.05, 2.9, 6.6, 3.75] },
      { id: 'hallway-run', bounds: [5.1, 5.06, 7.5, 7.4] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-door', bounds: [3.4, 2.95, 4.6, 3.7] },
      { id: 'bathroom-door', bounds: [4.45, 6.1, 5.9, 6.9] },
      { id: 'hallway-door', bounds: [5.9, 4.6, 6.7, 5.4] },
    ],
  },
  shell: { features: [
    { wall: 'west', at: 2.3, kind: 'window' },
    { wall: 'north', at: 5.0, kind: 'window' },
    { wall: 'west', at: 6.5, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-wood', cells: [0, 0, 3, 4], material: 'wood' },
    { id: 'study-wood', cells: [4, 0, 7, 4], material: 'wood' },
    { id: 'bathroom-tile', cells: [0, 5, 4, 7], material: 'tile' },
    { id: 'hallway-stone', cells: [5, 5, 7, 7], material: 'stone' },
  ],
  walls: [
    { id: 'bedroom-study', from: [4, 0], to: [4, 5], openings: [{ at: 3.3, width: 0.9, kind: 'door' }] },
    { id: 'bedroom-bathroom', from: [0, 5], to: [5, 5], height: 'half' },
    { id: 'study-hallway', from: [5, 5], to: [8, 5], height: 'half', openings: [{ at: 6.3, width: 1.0, kind: 'open' }] },
    { id: 'bathroom-hallway', from: [5, 5], to: [5, 8], height: 'half', openings: [{ at: 6.5, width: 0.9, kind: 'door' }] },
    { id: 'stairwell-west-guard', from: [well[0], well[1] + 0.12], to: [well[0], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [well[2], well[1] + 0.12], to: [well[2], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-south-guard', from: [well[0], well[3]], to: [well[2], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  furniture: [
    // Quarto: cama de casal na parede norte com mesa de cabeceira e candeeiro de pé,
    // cómoda com rádio junto à porta, secretária-toucador a sul e canto de leitura.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'north', at: 1.5 } },
    { id: 'bedroom-nightstand', model: 'tableCoffeeSquare', at: [0.4, 0.32] },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-lamp-north', model: 'lampRoundFloor', logic: 'lamp@0,2', at: [2.35, 0.3] },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@1,3', at: [3.75, 1.3] },
    { id: 'bedroom-clock-west-table', model: 'sideTable', at: [3.45, 2.3] },
    { id: 'bedroom-clock-west', model: 'radio', logic: 'clock@2,3', on: { parent: 'bedroom-clock-west-table' } },
    { id: 'bedroom-clock-south-table', model: 'sideTable', at: [2.4, 4.6], facing: 'S' },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@4,2', on: { parent: 'bedroom-clock-south-table' } },
    { id: 'bedroom-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 3.3 }, facing: 'E' },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [0.45, 4.4], facing: 'E' },
    { id: 'bedroom-reading-table', model: 'tableCoffeeSquare', at: [1.2, 4.55] },
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.5, 2.3], facing: 'E' },
    // Estúdio: secretária com cadeira e estante na parede do quarto, poltrona de leitura
    // junto ao candeeiro a sul e caixa de arquivo a nascente do vão.
    { id: 'study-desk', model: 'desk', logic: 'desk@1,4', against: { wall: 'bedroom-study', side: 'E', at: 1.5 }, facing: 'E' },
    { id: 'study-chair', model: 'chairDesk', at: [5.0, 1.5], facing: 'W' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' }, facing: 'E' },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@2,4', against: { wall: 'bedroom-study', side: 'E', at: 2.4 }, facing: 'E' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-cabinet', model: 'cabinetTelevisionDoors', against: { wall: 'north', at: 4.6 } },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@4,4', at: [4.75, 4.15] },
    { id: 'study-armchair', model: 'loungeChair', at: [5.3, 4.45], facing: 'W' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@3,7', at: [7.8, 3.88] },
    // Casa de banho: sanita, lavatórios e duche a norte, banheira e segundo duche a sul.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@5,2', against: { wall: 'bedroom-bathroom', side: 'S', at: 2.5 } },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'bedroom-bathroom', side: 'S', at: 1.6 } },
    { id: 'bathroom-sink-west', model: 'bathroomSink', against: { wall: 'bedroom-bathroom', side: 'S', at: 1.05 } },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 5.4 }, facing: 'E' },
    { id: 'bathroom-shower-north', model: 'showerRound', logic: 'shower@5,4', at: [4.55, 5.4], facing: 'S' },
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@7,0', at: [0.95, 7.6], facing: 'N' },
    { id: 'bathroom-shower-east', model: 'showerRound', logic: 'shower@7,3', at: [3.5, 7.6], facing: 'S' },
    { id: 'bathroom-bin', model: 'trashcan', at: [2.2, 7.7] },
    // Átrio: planta e consola com rádio encostadas às paredes.
    { id: 'hallway-plant', model: 'flower_redA', logic: 'plant@5,7', at: [7.75, 5.4] },
    { id: 'hallway-clock-table', model: 'sideTable', at: [5.5, 7.65] },
    { id: 'hallway-clock', model: 'radio', logic: 'clock@7,5', on: { parent: 'hallway-clock-table' } },
  ],
}
