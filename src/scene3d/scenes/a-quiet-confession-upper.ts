import type { PlanRect, SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [6.5, 1.97]
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairwellBounds: PlanRect = [
  stairAt[0] - stairHalfWidth,
  stairAt[1] - stairHalfRun,
  stairAt[0] + stairHalfWidth,
  stairAt[1] + stairHalfRun,
]

// A escada sobe para norte e chega a uma galeria no topo nordeste; daí uma porta
// leva ao escritório (que distribui para a casa de banho e a cozinha) e uma faixa a
// nascente do vão leva ao quarto, agora fechado a sul da galeria.
export const aQuietConfessionUpper: SceneSpec = {
  puzzleId: 'expert-10',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds,
  circulation: {
    landing: [6, 0.08, 7, stairwellBounds[1]],
    halls: [
      { id: 'landing-west', bounds: [4.5, 0.05, 6, 0.85] },
      { id: 'landing-north-east', bounds: [6.5, 0.08, 7.95, 0.83] },
      { id: 'landing-east-strip', bounds: [7, 0.08, 7.95, 3.2] },
      { id: 'study-north-gallery', bounds: [2, 0.05, 5, 0.85] },
      { id: 'study-main-spine', bounds: [2, 0.5, 2.8, 2.9] },
      { id: 'study-south-link', bounds: [2, 2.15, 4, 2.9] },
      { id: 'bathroom-entry-bridge', bounds: [2, 2.15, 2.8, 3.75] },
      { id: 'kitchen-entry-bridge', bounds: [3.1, 2.15, 4, 3.75] },
      { id: 'kitchen-gallery', bounds: [3.1, 3.1, 3.9, 6.1] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [7.05, 2.8, 7.95, 3.8] },
      { id: 'study-entry', bounds: [4, 0.05, 5, 0.85] },
      { id: 'bathroom-entry', bounds: [2, 3, 2.8, 3.75] },
      { id: 'kitchen-entry', bounds: [3.1, 3.1, 3.9, 3.75] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.8, kind: 'window' },
    { wall: 'north', at: 7.5, kind: 'window' },
  ] },
  floors: [
    { id: 'study-floor', cells: [0, 0, 4, 2], material: 'wood' },
    { id: 'bedroom-floor', cells: [5, 0, 7, 7], material: 'wood' },
    { id: 'bathroom-tile', cells: [0, 3, 2, 7], material: 'tile' },
    { id: 'kitchen-tile', cells: [3, 3, 4, 7], material: 'stone' },
  ],
  walls: [
    { id: 'bedroom-study', from: [5, 0], to: [5, 3], height: 'half', openings: [{ at: 0.45, width: 0.9, kind: 'door' }] },
    { id: 'study-bathroom', from: [0, 3], to: [3, 3], height: 'half', openings: [{ at: 2.4, width: 0.8, kind: 'door' }] },
    { id: 'study-kitchen', from: [3, 3], to: [5, 3], height: 'half', openings: [{ at: 3.5, width: 1, kind: 'door' }] },
    { id: 'bathroom-kitchen', from: [3, 3], to: [3, 8], height: 'half' },
    { id: 'bedroom-kitchen', from: [5, 3], to: [5, 8], height: 'half' },
    // O quarto fecha-se a sul da galeria da escada, com porta a nascente do vão.
    { id: 'landing-bedroom', from: [5, 3.25], to: [8, 3.25], height: 'half', openings: [{ at: 7.5, width: 0.9, kind: 'door' }] },
    // Guardas do vão da escada; a chegada fica aberta a norte.
    { id: 'stairwell-west-guard', from: [stairwellBounds[0], stairwellBounds[1] + 0.12], to: [stairwellBounds[0], stairwellBounds[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-east-guard', from: [stairwellBounds[2], stairwellBounds[1] + 0.12], to: [stairwellBounds[2], stairwellBounds[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-south-guard', from: [stairwellBounds[0], stairwellBounds[3]], to: [stairwellBounds[2], stairwellBounds[3]], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Galeria da escada: mesa com o rádio de Carol junto à porta do escritório.
    { id: 'bedroom-clock-carol-table', model: 'sideTable', at: [5.75, 1.25], facing: 'E' },
    { id: 'bedroom-clock-carol', model: 'radio', logic: 'clock@1,5', on: { parent: 'bedroom-clock-carol-table' } },
    // Quarto: cama com a cabeceira na parede da galeria, com mesa de cabeceira baixa,
    // e só o flanco ao longo da divisória da cozinha; cómodas baixas e recanto com sofá
    // no tapete entre os candeeiros.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@3,5', against: { wall: 'landing-bedroom', side: 'S', at: 6.3 }, facing: 'S' },
    { id: 'bedroom-nightstand', model: 'bookcaseOpenLow', against: { wall: 'landing-bedroom', side: 'S', at: 5.38 }, facing: 'S' },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-chest', model: 'bookcaseOpenLow', against: { wall: 'bedroom-kitchen', side: 'E', at: 6.05 }, facing: 'E' },
    { id: 'bedroom-chest-2', model: 'bookcaseOpenLow', against: { wall: 'bedroom-kitchen', side: 'E', at: 6.6 }, facing: 'E' },
    { id: 'bedroom-chest-books', model: 'books', on: { parent: 'bedroom-chest' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@5,5', at: [6.2, 6.2], facing: 'S' },
    { id: 'bedroom-lamp-north', model: 'lampRoundFloor', logic: 'lamp@5,7', at: [7.5, 5.5] },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [6.6, 5.6], facing: 'S' },
    { id: 'bedroom-coffee-table', model: 'tableCoffee', at: [6.6, 6.6] },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'south', at: 6.6 }, facing: 'N' },
    { id: 'bedroom-clock-south-table', model: 'sideTable', at: [5.5, 7.65] },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@7,5', on: { parent: 'bedroom-clock-south-table' } },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,7', at: [7.5, 7.5] },
    // Escritório: secretária e estante a poente, recanto de leitura com sofá junto ao
    // candeeiro e caixa no canto.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,0', at: [0.5, 0.5] },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@1,0', against: { wall: 'west', at: 1.5 } },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-desk', model: 'desk', logic: 'desk@2,0', at: [0.5, 2.5], facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [0.6, 1.95], facing: 'S' },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'bedroom-study', side: 'W', at: 1.55 }, facing: 'W' },
    { id: 'study-coffee-table', model: 'tableCoffee', at: [3.7, 1.55], facing: 'E' },
    { id: 'study-armchair', model: 'loungeChair', at: [3.08, 1.55], facing: 'E' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@2,4', at: [4.5, 2.5] },
    // Casa de banho: sanita a norte, lavatório e máquina a poente, banheira a sul, os dois
    // duches encostados à divisória da cozinha e a segunda sanita no canto sudeste.
    { id: 'bathroom-toilet-north', model: 'toilet', logic: 'toilet@3,1', against: { wall: 'study-bathroom', side: 'S', at: 1.5 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 4.2 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 6.55 }, facing: 'E' },
    { id: 'bathroom-tub', model: 'bathtub', against: { wall: 'south', at: 0.85 }, facing: 'N' },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@5,2', at: [2.35, 5.5], facing: 'S' },
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@4,2', at: [2.35, 4.5], facing: 'S' },
    { id: 'bathroom-toilet-south', model: 'toilet', logic: 'toilet@7,2', at: [2.35, 7.5], facing: 'N' },
    { id: 'bathroom-bin', model: 'trashcan', at: [2.6, 6.55] },
    // Cozinha em L: placa no canto nordeste contra a divisória do escritório; frigorífico
    // baixo, lava-loiça e bancada com micro-ondas em linha contra a divisória do quarto;
    // mesa de pequeno-almoço com cadeira ao fundo.
    { id: 'kitchen-stove', model: 'kitchenStoveElectric', logic: 'stove@3,4', against: { wall: 'study-kitchen', side: 'S', at: 4.6 }, facing: 'S' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', against: { wall: 'bedroom-kitchen', side: 'W', at: 4.3 }, facing: 'W' },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@5,4', against: { wall: 'bedroom-kitchen', side: 'W', at: 5.3 }, facing: 'W' },
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@5,4', against: { wall: 'bedroom-kitchen', side: 'W', at: 5.84 }, facing: 'W' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-counter' } },
    { id: 'kitchen-table', model: 'tableRound', at: [3.65, 7.3] },
    { id: 'kitchen-chair-east', model: 'chair', at: [4.3, 7.3], facing: 'W' },
  ],
  rugs: [
    { id: 'study-rug', model: 'rugRound', at: [3.7, 1.55] },
    { id: 'bathroom-mat', model: 'rugDoormat', at: [1.0, 6.9] },
  ],
}
