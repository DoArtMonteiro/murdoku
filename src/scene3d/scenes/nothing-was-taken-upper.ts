import type { PlanRect, SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [6.4, 2]
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const stairwellBounds: PlanRect = [
  stairAt[0] - stairHalfWidth,
  stairAt[1] - stairHalfRun,
  stairAt[0] + stairHalfWidth,
  stairAt[1] + stairHalfRun,
]

// A escada chega a uma galeria a nascente, que serve o estúdio e o quarto e desce até
// um corredor a sul do quarto; este dá acesso à cozinha e à casa de banho, sem que
// nenhuma divisão sirva de passagem.
export const nothingWasTakenUpper: SceneSpec = {
  puzzleId: 'hard-12',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds,
  circulation: {
    landing: [5.85, 0.05, 7.1, stairwellBounds[1]],
    halls: [
      { id: 'east-gallery', bounds: [7.05, 0.05, 7.95, 4.1] },
      { id: 'service-hall', bounds: [4.05, 4.05, 7.95, 4.85] },
    ],
    roomAccessTargets: [
      { id: 'study-entry-approach', bounds: [7.1, 0.05, 7.9, 0.85] },
      { id: 'bedroom-entry-approach', bounds: [7.1, 2.2, 7.9, 3] },
      { id: 'bathroom-entry-approach', bounds: [3.6, 4.05, 4.6, 4.86] },
      { id: 'kitchen-entry-approach', bounds: [6.5, 4.4, 7.3, 5.3] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 2.6, kind: 'window' },
    { wall: 'north', at: 5.05, kind: 'window' },
    { wall: 'west', at: 5.3, kind: 'window' },
  ] },
  floors: [
    { id: 'study-floor', cells: [0, 0, 7, 1], material: 'wood' },
    { id: 'bedroom-floor', cells: [0, 2, 7, 3], material: 'wood' },
    { id: 'bathroom-tile', cells: [0, 4, 3, 7], material: 'tile' },
    { id: 'service-hall-floor', cells: [4, 4, 7, 4], material: 'stone' },
    { id: 'kitchen-floor', cells: [4, 5, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'study-bedroom', from: [0, 1.9], to: [stairwellBounds[0], 1.9], height: 'half' },
    { id: 'bedroom-service', from: [0, 4], to: [8, 4], height: 'half', openings: [{ at: 7.5, width: 0.9, kind: 'door' }] },
    { id: 'bathroom-kitchen', from: [4, 4], to: [4, 8], height: 'half', openings: [{ at: 4.47, width: 0.84, kind: 'door' }] },
    { id: 'hall-kitchen', from: [4, 4.9], to: [8, 4.9], height: 'half', openings: [{ at: 6.9, width: 0.8, kind: 'door' }] },
    { id: 'east-gallery-wall', from: [7, 0], to: [7, 4], openings: [
      { at: 0.46, width: 0.82, kind: 'open' },
      { at: 2.65, width: 1, kind: 'door' },
    ] },
    { id: 'stairwell-west-guard', from: [stairwellBounds[0], stairwellBounds[1] + 0.12], to: [stairwellBounds[0], stairwellBounds[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-east-guard', from: [stairwellBounds[2], stairwellBounds[1] + 0.12], to: [stairwellBounds[2], stairwellBounds[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-south-guard', from: [stairwellBounds[0], stairwellBounds[3]], to: [stairwellBounds[2], stairwellBounds[3]], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Estúdio: estante e candeeiro a poente, sofá de leitura sob a janela, caixas de
    // arquivo e secretária com cadeira junto à chegada da escada.
    { id: 'study-bookshelf', model: 'bookcaseOpen', logic: 'bookshelf@1,0', against: { wall: 'west', at: 1.45 } },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf', surface: 'shelf2' } },
    { id: 'study-bookshelf-books-low', model: 'books', on: { parent: 'study-bookshelf', surface: 'shelf1' } },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@0,0', at: [0.4, 0.4] },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'north', at: 2.6 } },
    { id: 'study-boxes', model: 'cardboardBoxClosed', at: [3.95, 0.3] },
    { id: 'study-box-open', model: 'cardboardBoxOpen', at: [4.0, 0.75] },
    { id: 'study-desk', model: 'desk', logic: 'desk@0,5', against: { wall: 'north', at: 5.05 } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [5.05, 1.2], facing: 'N' },
    // Quarto: cama com a cabeceira na meia parede do estúdio, colunas de som de cada
    // lado, candeeiro de pé, toucador e sofá aos pés da cama.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'study-bedroom', side: 'S', at: 1.3 } },
    { id: 'bedroom-clock-west', model: 'speaker', logic: 'clock@3,0', at: [0.3, 3.3] },
    { id: 'bedroom-clock-centre', model: 'speaker', logic: 'clock@2,2', at: [2.2, 2.2] },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@3,3', at: [3.35, 3.25] },
    { id: 'bedroom-vanity', model: 'desk', against: { wall: 'study-bedroom', side: 'S', at: 3.75 } },
    { id: 'bedroom-vanity-books', model: 'books', on: { parent: 'bedroom-vanity' } },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@2,4', at: [4.55, 2.25] },
    { id: 'bedroom-sofa', model: 'loungeSofa', at: [5.3, 3.5], facing: 'N' },
    // Casa de banho: lavatórios, duche e sanita a norte, segundo duche a poente,
    // banheira a nascente e máquina de lavar a sul.
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'bedroom-service', side: 'S', at: 0.45 } },
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@4,1', at: [1.7, 4.8], facing: 'S' },
    { id: 'bathroom-sink-b', model: 'bathroomSink', against: { wall: 'bedroom-service', side: 'S', at: 2.4 } },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@4,3', against: { wall: 'bedroom-service', side: 'S', at: 3.2 } },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@6,0', against: { wall: 'west', at: 6.5 } },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@6,3', against: { wall: 'bathroom-kitchen', side: 'W', at: 6.9 }, facing: 'W' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'south', at: 1.6 }, facing: 'N' },
    { id: 'bathroom-bin', model: 'trashcan', at: [2.3, 7.7] },
    // Cozinha: bancada em linha na meia parede do corredor, com o fogão afastado e
    // sem nada encostado à parede da casa de banho; frigorífico na parede nascente e mesa de refeições a sul.
    { id: 'kitchen-counter-prep', model: 'kitchenCabinet', logic: 'counter@5,4', against: { wall: 'hall-kitchen', at: 4.38, side: 'S' }, facing: 'S' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-counter-prep' } },
    { id: 'kitchen-counter-sink', model: 'kitchenSink', logic: 'counter@5,4', against: { wall: 'hall-kitchen', at: 4.93, side: 'S' }, facing: 'S' },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'hall-kitchen', at: 5.48, side: 'S' }, facing: 'S' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,7', against: { wall: 'east', at: 6.25 }, facing: 'W' },
    { id: 'kitchen-table', model: 'table', logic: 'table@7,5', at: [6, 7.45], facing: 'S' },
    { id: 'kitchen-bench', model: 'loungeDesignSofa', at: [6, 6.85], facing: 'S' },
    { id: 'kitchen-bin', model: 'trashcan', at: [7.7, 5.2] },
  ],
  rugs: [
    { id: 'study-rug', model: 'rugRectangle', at: [2.6, 1.05] },
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.3, 3.2] },
    { id: 'kitchen-rug', model: 'rugRectangle', at: [6, 7.2] },
  ],
}
