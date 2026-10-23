import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [5, 5.25]
const halfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const halfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const well: [number, number, number, number] = [
  stairAt[0] - halfWidth,
  stairAt[1] - halfRun,
  stairAt[0] + halfWidth,
  stairAt[1] + halfRun,
]

// A escada chega a um patamar que dá para o corredor transversal: a poente o
// corredor liga ao átrio do lado oeste e aos dois quartos; a norte abre-se o
// escritório e a nascente a casa de banho, com a sanita e a lavandaria num
// compartimento próprio a sul.
export const theTornLedgerUpper: SceneSpec = {
  puzzleId: 'master-1',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], 3.35, 5.95, well[1]],
    halls: [
      { id: 'west-hall-spine', bounds: [0.1, 0.1, 1.05, 7.9] },
      { id: 'cross-corridor', bounds: [0.1, 3.35, well[0], 4.1] },
    ],
    roomAccessTargets: [
      { id: 'north-bedroom-door', bounds: [0.9, 0.4, 1.95, 1.2] },
      { id: 'south-bedroom-door', bounds: [3.55, 3.35, 4.15, 4.1] },
      { id: 'study-door', bounds: [5.05, 3.35, 5.9, well[1]] },
      { id: 'bathroom-door', bounds: [5.5, 3.35, 5.95, well[1]] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.0, kind: 'window' },
      { wall: 'north', at: 2.4, kind: 'window' },
      { wall: 'north', at: 5.6, kind: 'window' },
      { wall: 'north', at: 7, kind: 'window' },
      { wall: 'west', at: 2.4, kind: 'window' },
      { wall: 'west', at: 6.5, kind: 'window' },
    ],
  },
  floors: [
    { id: 'hallway-stone', cells: [0, 0, 1, 7], material: 'stone' },
    { id: 'bedroom-wood', cells: [2, 0, 3, 7], material: 'wood' },
    { id: 'study-wood', cells: [4, 0, 5, 7], material: 'wood' },
    { id: 'bathroom-tile', cells: [6, 0, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'hallway-bedroom', from: [2, 0], to: [2, 8], height: 'half', openings: [
      { at: 0.75, width: 0.7, kind: 'door' },
      { at: 3.725, width: 0.85, kind: 'open' },
    ] },
    { id: 'corridor-north', from: [2, 3.3], to: [6, 3.3], height: 'half', openings: [
      { at: 5.5, width: 1, kind: 'open' },
    ] },
    { id: 'bedroom-study', from: [4, 0], to: [4, 3.3], height: 'half' },
    { id: 'corridor-south', from: [2, 4.15], to: [4.4, 4.15], height: 'half', openings: [
      { at: 3.85, width: 0.65, kind: 'door' },
    ] },
    { id: 'study-bathroom', from: [6, 0], to: [6, 4.6], height: 'half', openings: [
      { at: 3.72, width: 0.75, kind: 'door' },
    ] },
    // O WC fecha-se com uma divisória mais alta a poente, do lado do canto de leitura.
    { id: 'wc-west', from: [6, 4.6], to: [6, 8] },
    { id: 'bathroom-wc', from: [6, 4.6], to: [8, 4.6], height: 'half', openings: [
      { at: 7.15, width: 0.7, kind: 'door' },
    ] },
    { id: 'stairwell-west-guard', from: [4.4, 4.15], to: [4.4, 6.45], height: 'half' },
    { id: 'stairwell-south-guard', from: [4.4, 6.45], to: [6, 6.45], height: 'half' },
    { id: 'stairwell-east-guard', from: [well[2] + 0.1, well[1] + 0.06], to: [well[2] + 0.1, 6.45], height: 'half', treatment: 'railing', freeEnds: ['from'] },
  ],
  furniture: [
    // Átrio poente: consola com rádio, planta, estante baixa junto às passadeiras.
    { id: 'hall-clock-table', model: 'sideTable', against: { wall: 'hallway-bedroom', side: 'W', at: 1.62 }, facing: 'W' },
    { id: 'hall-clock', model: 'radio', logic: 'clock@1,1', on: { parent: 'hall-clock-table' } },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@2,1', at: [1.6, 2.55], facing: 'S' },
    { id: 'hall-rug-middle', model: 'rugRectangle', logic: 'rug@4,0', at: [1, 5], facing: 'E' },
    { id: 'hall-rug-south', model: 'rugRectangle', logic: 'rug@6,0', at: [1, 7], facing: 'E' },
    { id: 'hall-shelf', model: 'bookcaseOpenLow', against: { wall: 'hallway-bedroom', side: 'W', at: 5.6 }, facing: 'W' },
    { id: 'hall-shelf-books', model: 'books', on: { parent: 'hall-shelf', surface: 'top' } },
    // Quarto norte: cama encostada à parede do átrio, candeeiro de cabeceira e roupeiro a norte.
    { id: 'bedroom-bed-north', model: 'bedDouble', logic: 'bed@2,2', against: { wall: 'hallway-bedroom', side: 'E', at: 2.65 }, facing: 'E' },
    { id: 'bedroom-north-lamp', model: 'lampRoundFloor', at: [2.2, 1.8] },
    { id: 'bedroom-north-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'north', at: 3.4 } },
    // Quarto sul: cama, estante de cabeceira com rádio, roupeiro e canto de leitura atrás da
    // escada, com o sofá contra a fachada sul virado para a estante.
    { id: 'bedroom-bed-south-bella', model: 'bedDouble', logic: 'bed@4,2', against: { wall: 'hallway-bedroom', side: 'E', at: 4.85 }, facing: 'E' },
    { id: 'bedroom-clock-table', model: 'bookcaseOpenLow', against: { wall: 'hallway-bedroom', side: 'E', at: 6.3 }, facing: 'E' },
    { id: 'bedroom-clock', model: 'radio', logic: 'clock@6,2', on: { parent: 'bedroom-clock-table', surface: 'top' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedDoors', against: { wall: 'hallway-bedroom', side: 'E', at: 7.45 }, facing: 'E' },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@6,3', at: [3.75, 6.25] },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,3', at: [3.75, 7.25] },
    { id: 'bedroom-reading-sofa', model: 'loungeSofa', against: { wall: 'south', at: 5.2 }, facing: 'N' },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@6,5', against: { wall: 'stairwell-south-guard', side: 'S', at: 5.15 }, facing: 'S' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf', surface: 'top' } },
    // Escritório: secretária de costas para o corredor com a cadeira virada para ela,
    // estante larga a norte, sofá de leitura e a caixa do livro-razão.
    { id: 'study-desk-oscar', model: 'desk', logic: 'desk@3,4', against: { wall: 'corridor-north', side: 'N', at: 4.5 }, facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk-oscar' } },
    { id: 'study-chair', model: 'chairDesk', at: [4.5, 2.45], facing: 'S' },
    { id: 'study-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 4.6 } },
    { id: 'study-ledger-box', model: 'cardboardBoxClosed', logic: 'box@0,5', at: [5.6, 0.4] },
    { id: 'study-reading-sofa', model: 'loungeSofa', against: { wall: 'study-bathroom', side: 'W', at: 1.65 }, facing: 'W' },
    { id: 'study-lamp', model: 'lampSquareFloor', at: [5.75, 2.55] },
    // Casa de banho: duche, lavatório e móvel a poente, banheira na parede nascente;
    // a sul, compartimento fechado com sanita, lavatório e máquina de lavar.
    { id: 'bathroom-shower-nadia', model: 'showerRound', logic: 'shower@0,6', at: [6.4, 0.4], facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'study-bathroom', side: 'E', at: 1.55 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'study-bathroom', side: 'E', at: 2.2 }, facing: 'E' },
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@1,7', against: { wall: 'east', at: 2.0 }, facing: 'W' },
    { id: 'bathroom-trash', model: 'trashcan', at: [7.75, 4.3] },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@7,7', against: { wall: 'south', at: 7.45 }, facing: 'N' },
    { id: 'wc-sink', model: 'bathroomSink', against: { wall: 'wc-west', side: 'E', at: 6.4 }, facing: 'E' },
    { id: 'wc-washer', model: 'washer', against: { wall: 'bathroom-wc', side: 'S', at: 6.35 }, facing: 'S' },
  ],
  rugs: [
    { id: 'bedroom-north-rug', model: 'rugSquare', at: [3.05, 2.0] },
    { id: 'bedroom-south-rug', model: 'rugSquare', at: [3.05, 5.4] },
    { id: 'study-rug', model: 'rugRound', at: [4.75, 1.6] },
    { id: 'bath-mat', model: 'rugDoormat', at: [6.8, 2.0], facing: 'E' },
  ],
}
