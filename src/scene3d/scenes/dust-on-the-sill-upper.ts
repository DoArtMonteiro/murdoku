import type { PlanRect, SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [2.8, 6.5]
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const stairwellBounds: PlanRect = [
  stairAt[0] - stairHalfRun,
  stairAt[1] - stairHalfWidth,
  stairAt[0] + stairHalfRun,
  stairAt[1] + stairHalfWidth,
]

// A escada chega a uma galeria fechada que serve a casa de banho, a lavandaria e o
// escritório; o quarto abre para o escritório e a copa tem porta própria.
export const dustOnTheSillUpper: SceneSpec = {
  puzzleId: 'expert-4',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds,
  circulation: {
    landing: [stairwellBounds[2], stairwellBounds[1], 4.8, stairwellBounds[3]],
    halls: [
      { id: 'bathroom-gallery', bounds: [4, 0.05, 4.8, 7.95] },
      { id: 'study-cross-gallery', bounds: [2.9, 0.5, 7.15, 1.25] },
      { id: 'study-east-gallery', bounds: [7.15, 0.45, 7.9, 3.6] },
      { id: 'bathroom-entry-bridge', bounds: [4.425, 4, 5.175, 4.75] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [2.1, 0.35, 3, 1.25] },
      { id: 'study-entry', bounds: [3, 0.35, 4.4, 1.25] },
      { id: 'bathroom-entry', bounds: [5.175, 4, 5.925, 4.75] },
      { id: 'laundry-entry', bounds: [4.0, 7.1, 5.3, 7.85] },
      { id: 'pantry-entry', bounds: [7.15, 3.1, 7.9, 3.8] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.2, kind: 'window' },
    { wall: 'north', at: 5.5, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [0, 0, 2, 7], material: 'wood' },
    { id: 'study-floor', cells: [3, 0, 7, 2], material: 'wood' },
    { id: 'bathroom-tile', cells: [3, 3, 5, 7], material: 'tile' },
    { id: 'pantry-floor', cells: [6, 3, 7, 7], material: 'stone' },
  ],
  walls: [
    { id: 'bedroom-study', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 0.8, width: 1, kind: 'door' }] },
    { id: 'bedroom-gallery', from: [3, 3], to: [3, stairwellBounds[1] - 0.08], height: 'half' },
    { id: 'study-gallery', from: [3, 3], to: [3.95, 3], height: 'half', freeEnds: ['to'] },
    // Divisória à altura normal entre o escritório e a casa de banho: o duche do Idris encosta-lhe.
    { id: 'study-bathroom', from: [4.85, 3], to: [6, 3] },
    { id: 'study-pantry', from: [6, 3], to: [8, 3], height: 'half', openings: [{ at: 7.55, width: 0.9, kind: 'door' }] },
    // Casa de banho e lavandaria com duche: duas divisões fechadas, cada uma com porta para a galeria.
    { id: 'bathroom-gallery', from: [4.8, 3], to: [4.8, 8], height: 'half', openings: [
      { at: 4.4, width: 1, kind: 'door' },
      { at: 7.45, width: 0.8, kind: 'door' },
    ] },
    { id: 'bath-laundry', from: [4.8, 6], to: [6, 6], height: 'half' },
    { id: 'bathroom-pantry', from: [6, 3], to: [6, 8], height: 'half' },
    { id: 'stairwell-north-guard', from: [stairwellBounds[0], stairwellBounds[1] - 0.08], to: [stairwellBounds[2], stairwellBounds[1] - 0.08], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-south-guard', from: [stairwellBounds[0], stairwellBounds[3] + 0.08], to: [stairwellBounds[2], stairwellBounds[3] + 0.08], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-west-guard', from: [stairwellBounds[0], stairwellBounds[1] - 0.08], to: [stairwellBounds[0], stairwellBounds[3] + 0.08], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Quarto: cama de cabeceira a poente com mesas de cabeceira, roupeiro, secretária de toucador
    // na divisória, tapete e estante baixa; rádio e candeeiro no canto sudoeste.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@1,0', against: { wall: 'west', at: 2, side: 'E' }, facing: 'E' },
    { id: 'bedroom-nightstand-north', model: 'tableCoffeeSquare', at: [0.32, 1.1] },
    { id: 'bedroom-nightstand-north-books', model: 'books', on: { parent: 'bedroom-nightstand-north' } },
    { id: 'bedroom-nightstand-south', model: 'tableCoffeeSquare', at: [0.32, 2.9] },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedDoors', against: { wall: 'north', at: 1.8 } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@3,0', at: [1, 4], facing: 'E' },
    { id: 'bedroom-desk', model: 'desk', against: { wall: 'bedroom-gallery', side: 'W', at: 4.3 }, facing: 'W' },
    { id: 'bedroom-desk-chair', model: 'chairCushion', at: [2.2, 4.3], facing: 'E' },
    { id: 'bedroom-shelf', model: 'bookcaseOpenLow', against: { wall: 'west', at: 4.6 }, facing: 'E' },
    { id: 'bedroom-shelf-books', model: 'books', on: { parent: 'bedroom-shelf' } },
    { id: 'bedroom-entry-lamp', model: 'lampRoundFloor', logic: 'lamp@5,0', at: [0.4, 5.45] },
    { id: 'pantry-clock-table', model: 'sideTable', against: { wall: 'west', at: 6.5 }, facing: 'E' },
    { id: 'pantry-clock', model: 'radio', logic: 'clock@6,0', on: { parent: 'pantry-clock-table' } },
    { id: 'bedroom-clock', model: 'speaker', logic: 'clock@7,2', at: [2.75, 7.5] },
    // Galeria: banco encostado à parede do quarto.
    { id: 'gallery-bench', model: 'bench', against: { wall: 'bedroom-gallery', side: 'E', at: 4.5 }, facing: 'E' },
    // Escritório: estantes na parede norte, secretária com cadeira junto à copa,
    // mesa redonda de leitura afastada da divisória da casa de banho, caixa e candeeiro junto à porta do quarto.
    { id: 'study-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@0,5', against: { wall: 'north', at: 6.4 } },
    { id: 'study-bookshelf-east', model: 'bookcaseClosedWide', against: { wall: 'north', at: 7.42 } },
    { id: 'study-desk', model: 'desk', logic: 'desk@2,6', against: { wall: 'study-pantry', side: 'N', at: 6.5 }, facing: 'N' },
    { id: 'study-desk-laptop', model: 'laptop', on: { parent: 'study-desk' }, facing: 'N' },
    { id: 'study-chair', model: 'chairDesk', at: [6.5, 2.05], facing: 'S' },
    { id: 'study-table', model: 'tableRound', at: [5.3, 2.15] },
    { id: 'study-table-chair-north', model: 'chair', at: [5.3, 1.42], facing: 'S' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@1,3', at: [3.6, 1.7] },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@2,3', at: [3.4, 2.5] },
    // Casa de banho: duche, sanita e lavatório; lavandaria com o segundo duche e a máquina.
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@3,5', against: { wall: 'study-bathroom', at: 5.6, side: 'S' } },
    // A sanita encosta à parede da lavandaria, não à parede partilhada com a copa.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@5,5', against: { wall: 'bath-laundry', side: 'N', at: 5.56 }, facing: 'N' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'bath-laundry', side: 'N', at: 5.1 }, facing: 'N' },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@6,5', against: { wall: 'bathroom-gallery', at: 6.5, side: 'E' } },
    { id: 'laundry-washer', model: 'washer', against: { wall: 'south', at: 5.65 }, facing: 'N' },
    // Copa: bancada com lava-loiça e armários na parede da lavandaria (longe da sanita),
    // prateleira e frigorífico baixo a nascente.
    { id: 'pantry-box-clue', model: 'cardboardBoxClosed', logic: 'box@3,6', at: [6.35, 3.35] },
    { id: 'pantry-counter-prep', model: 'kitchenCabinet', logic: 'counter@5,6', against: { wall: 'bathroom-pantry', at: 6.55, side: 'E' } },
    { id: 'pantry-counter-sink', model: 'kitchenSink', logic: 'counter@5,6', against: { wall: 'bathroom-pantry', at: 7.09, side: 'E' } },
    { id: 'pantry-stove', model: 'kitchenCabinetDrawer', against: { wall: 'bathroom-pantry', at: 7.63, side: 'E' } },
    { id: 'pantry-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'pantry-counter-prep' } },
    { id: 'pantry-shelf', model: 'bookcaseOpenLow', against: { wall: 'bathroom-pantry', side: 'E', at: 5.45 }, facing: 'E' },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@7,7', against: { wall: 'east', at: 7.3 }, facing: 'W' },
  ],
}
