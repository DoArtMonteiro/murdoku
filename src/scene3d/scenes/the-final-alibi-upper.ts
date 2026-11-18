import type { PlanRect, SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [5.55, 1.4]
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const stairwellBounds: PlanRect = [
  stairAt[0] - stairHalfRun,
  stairAt[1] - stairHalfWidth,
  stairAt[0] + stairHalfRun,
  stairAt[1] + stairHalfWidth,
]
const w = stairwellBounds
// A escada chega a poente, a um corredor que serve o WC (a norte), a casa de banho e
// o escritório; a sul do vão, uma faixa de corredor leva ao quarto.
export const theFinalAlibiUpper: SceneSpec = {
  puzzleId: 'master-7',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds,
  circulation: {
    landing: [3.05, w[1], w[0], w[3]],
    halls: [
      { id: 'west-corridor', bounds: [3.05, 0.95, 4.35, 2.95] },
      { id: 'south-strip', bounds: [4.3, 2.02, 5.75, 2.95] },
    ],
    roomAccessTargets: [
      { id: 'wc-entry', bounds: [3.6, w[1], 4.4, 1.5] },
      { id: 'bathroom-entry', bounds: [3.05, 1.2, 3.85, 2.0] },
      { id: 'study-entry', bounds: [3.1, 2.3, 3.9, 2.95] },
      { id: 'bedroom-entry', bounds: [4.5, 2.0, 5.7, 2.95] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 7.3, kind: 'window' },
    { wall: 'west', at: 5.8, kind: 'window' },
  ] },
  floors: [
    { id: 'bathroom-tile', cells: [0, 0, 3, 2], material: 'tile' },
    { id: 'hallway-floor', cells: [4, 0, 7, 2], material: 'stone' },
    { id: 'study-floor', cells: [0, 3, 3, 7], material: 'wood' },
    { id: 'bedroom-floor', cells: [4, 3, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'bathroom-corridor', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 1.6, width: 0.7, kind: 'door' }] },
    { id: 'wc-south', from: [3, 0.85], to: [w[0], 0.85], height: 'half', openings: [{ at: 4.0, width: 0.6, kind: 'door' }] },
    { id: 'wc-east', from: [w[0], 0], to: [w[0], 0.85], height: 'half' },
    { id: 'bathroom-study', from: [0, 3], to: [4, 3], height: 'half', openings: [{ at: 3.5, width: 0.7, kind: 'door' }] },
    { id: 'hallway-bedroom', from: [4, 3], to: [8, 3], height: 'half', openings: [{ at: 5.1, width: 1.2, kind: 'door' }] },
    { id: 'study-bedroom', from: [4, 3], to: [4, 8], height: 'half' },
    { id: 'stairwell-north-guard', from: [w[0], 0.85], to: [w[2] + 0.06, 0.85], height: 'half', treatment: 'railing' },
    { id: 'stairwell-east-guard', from: [w[2] + 0.06, 0.85], to: [w[2] + 0.06, w[3] + 0.06], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-south-guard', from: [w[0], w[3] + 0.06], to: [w[2] + 0.06, w[3] + 0.06], height: 'half', treatment: 'railing', freeEnds: ['from'] },
  ],
  furniture: [
    // Escritório: secretária de costas para a casa de banho com a cadeira, estante baixa,
    // caixas, candeeiro e sofá de leitura sobre um tapete.
    { id: 'study-bookshelf-marco', model: 'bookcaseOpenLow', logic: 'bookshelf@4,0', against: { wall: 'west', at: 5.0 } },
    { id: 'study-box-north', model: 'cardboardBoxClosed', logic: 'box@3,0', at: [0.5, 3.5] },
    { id: 'study-lamp-south', model: 'lampRoundFloor', logic: 'lamp@5,3', at: [3.125, 5.5] },
    { id: 'study-desk', model: 'desk', logic: 'desk@3,2', against: { wall: 'bathroom-study', side: 'S', at: 2.4 }, facing: 'S' },
    { id: 'study-chair', model: 'chairDesk', at: [2.4, 4.08], facing: 'N' },
    { id: 'study-box-marco', model: 'cardboardBoxClosed', logic: 'box@4,1', at: [1.5, 4.5] },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'south', at: 2.0 }, facing: 'N' },
    // Quarto: cama com a cabeceira na parede do corredor, mesinha com candeeiro,
    // roupeiro, poltrona e candeeiro de pé sobre o tapete.
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@6,4', at: [5.0, 7.0], facing: 'S' },
    { id: 'bedroom-clock', model: 'speaker', logic: 'clock@3,4', at: [4.25, 3.25] },
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@3,6', against: { wall: 'hallway-bedroom', side: 'S', at: 7.0 } },
    { id: 'bedroom-nightstand', model: 'bookcaseOpenLow', against: { wall: 'hallway-bedroom', side: 'S', at: 6.05 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand', surface: 'top' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'study-bedroom', side: 'E', at: 5.0 }, facing: 'E' },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [5.0, 6.8], facing: 'E' },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,6', at: [6.75, 7.25] },
    // Casa de banho: sanita, lavatório, banheira e duche; WC separado com a sanita da Yuki.
    { id: 'bathroom-toilet-west', model: 'toilet', logic: 'toilet@0,1', against: { wall: 'north', at: 1.5 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 2.5 }, facing: 'S' },
    { id: 'bathroom-tub', model: 'bathtub', against: { wall: 'west', at: 1.8 }, facing: 'E' },
    { id: 'bathroom-shower', model: 'shower', logic: 'shower@2,2', at: [2.45, 2.5], facing: 'S' },
    { id: 'bathroom-toilet-yuki', model: 'toilet', logic: 'toilet@0,3', against: { wall: 'bathroom-corridor', side: 'E', at: 0.42 }, facing: 'E' },
    // Corredor: coluna de som, plantas e banco encostados às paredes.
    { id: 'hallway-plant-southwest', model: 'pottedPlant', logic: 'plant@2,5', at: [5.88, 2.2] },
    { id: 'hallway-clock-north', model: 'speaker', logic: 'clock@0,5', at: [5.5, 0.4] },
    { id: 'hallway-plant-east', model: 'pottedPlant', logic: 'plant@1,7', at: [7.6, 1.3] },
    { id: 'hallway-bench', model: 'bench', against: { wall: 'east', at: 2.4 }, facing: 'W' },
  ],
}
