import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [4.55, 3.5]
const halfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const halfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const well: [number, number, number, number] = [
  stairAt[0] - halfWidth,
  stairAt[1] - halfRun,
  stairAt[0] + halfWidth,
  stairAt[1] + halfRun,
]
// A escada chega a sul do estúdio; a galeria a nascente do vão leva à casa de banho,
// a sala abre para o patamar e o quarto tem uma única porta junto à chegada.
export const theLateArrivalUpper: SceneSpec = {
  puzzleId: 'hard-9',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], well[3], well[2], 5.65],
    halls: [
      { id: 'west-bedroom-branch', bounds: [3.05, 4.9, well[0], 5.75] },
      { id: 'east-landing-connector', bounds: [well[2], well[3], 6.05, 5.9] },
      { id: 'east-north-gallery', bounds: [5.1, 1.25, 6.05, well[3]] },
    ],
    roomAccessTargets: [
      { id: 'study-arrival', bounds: [3.1, 4.9, 4.0, 5.7] },
      { id: 'bedroom-door', bounds: [2.3, 5.0, 3.05, 5.75] },
      { id: 'bathroom-door', bounds: [5.3, 1.25, 6.8, 2.0] },
      { id: 'living-room-door', bounds: [5.1, 5.65, 6.2, 6.1] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 6.4, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-wood', cells: [0, 0, 2, 7], material: 'wood' },
    { id: 'study-wood', cells: [3, 0, 4, 7], material: 'wood' },
    { id: 'bathroom-tile', cells: [5, 0, 7, 3], material: 'tile' },
    { id: 'living-wood', cells: [5, 4, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'bedroom-study', from: [3, 0], to: [3, 8], height: 'half', openings: [
      { at: 5.5, width: 1.2, kind: 'door' },
    ] },
    { id: 'study-service-wing', from: [6.1, 0], to: [6.1, 4], height: 'half', openings: [
      { at: 1.5, width: 1.2, kind: 'door' },
    ] },
    { id: 'bathroom-living', from: [6.1, 4], to: [8, 4], height: 'half', openings: [] },
    { id: 'stairwell-west-guard', from: [well[0], well[1]], to: [well[0], well[3] - 0.12], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [well[2], well[1]], to: [well[2], well[3] - 0.12], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-north-guard', from: [well[0], well[1]], to: [well[2], well[1]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  furniture: [
    // Quarto: cama na parede norte com mesas de cabeceira, roupeiros e cómoda com rádio
    // na parede poente, e recanto de estar a sul junto à janela.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@0,0', against: { wall: 'north', at: 1.2 } },
    { id: 'bedroom-nightstand', model: 'sideTable', at: [2.25, 0.3], facing: 'S' },
    { id: 'bedroom-nightstand-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-nightstand-west', model: 'cabinetBedDrawerTable', against: { wall: 'north', at: 0.3 } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedDoors', against: { wall: 'west', at: 2.7 }, facing: 'E' },
    { id: 'bedroom-wardrobe-b', model: 'bookcaseClosedDoors', against: { wall: 'west', at: 3.2 }, facing: 'E' },
    { id: 'bedroom-clock-east-table', model: 'sideTableDrawers', against: { wall: 'west', at: 4.4 }, facing: 'E' },
    { id: 'bedroom-clock-east', model: 'radio', logic: 'clock@4,0', on: { parent: 'bedroom-clock-east-table' } },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'west', at: 6.3 }, facing: 'E' },
    { id: 'bedroom-coffee-table', model: 'tableCoffeeSquare', at: [1.05, 6.3] },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [1.9, 6.3], facing: 'W' },
    { id: 'bedroom-clock-south-table', model: 'sideTable', at: [0.5, 7.6] },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@7,0', on: { parent: 'bedroom-clock-south-table' } },
    { id: 'bedroom-lamp-south-west', model: 'lampRoundFloor', logic: 'lamp@7,1', at: [1.4, 7.6] },
    { id: 'bedroom-lamp-south-east', model: 'lampRoundFloor', logic: 'lamp@7,2', at: [2.25, 7.25] },
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.2, 2.1], facing: 'E' },
    { id: 'bedroom-sitting-rug', model: 'rugRound', at: [1.2, 6.3] },
    // Estúdio: posto de trabalho em L com cadeira, estante alta na parede norte e caixa
    // de arquivo; canto de leitura a poente do vão e estantes junto à parede do quarto.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,4', at: [4.7, 0.3] },
    { id: 'study-bookcase-north', model: 'bookcaseClosedWide', against: { wall: 'north', at: 3.6 } },
    { id: 'study-desk-viraj', model: 'desk', logic: 'desk@1,4', at: [4.75, 1.25], facing: 'W' },
    { id: 'study-desk-second', model: 'desk', logic: 'desk@2,4', at: [4.5, 2.0], facing: 'N' },
    { id: 'study-chair', model: 'chairDesk', at: [4.25, 1.45], facing: 'E' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk-viraj' }, facing: 'W' },
    { id: 'study-armchair', model: 'loungeChair', at: [3.4, 3.3], facing: 'E' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.25, 4.2] },
    { id: 'study-bookshelf-north', model: 'bookcaseOpenLow', logic: 'bookshelf@6,3', against: { wall: 'bedroom-study', side: 'E', at: 6.6 }, facing: 'E' },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@6,3', against: { wall: 'bedroom-study', side: 'E', at: 7.15 }, facing: 'E' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-bookshelf-north-books', model: 'books', on: { parent: 'study-bookshelf-north' } },
    { id: 'study-reading-chair', model: 'loungeChair', at: [4.55, 6.9], facing: 'W' },
    { id: 'study-reading-table', model: 'tableCoffeeSquare', at: [4.55, 7.6] },
    // Casa de banho: sanita e lavatório a norte, duche no canto, banheira ao longo da
    // parede da galeria e máquina de lavar a sul.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@0,6', against: { wall: 'north', at: 6.6 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 7.4 }, facing: 'S' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@1,7', at: [7.55, 1.5], facing: 'S' },
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@3,5', against: { wall: 'study-service-wing', side: 'E', at: 3.2 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'bathroom-living', side: 'N', at: 7.6 }, facing: 'N' },
    // Sala: sofá virado para o televisor principal; um segundo televisor faz um canto
    // de jogos a sudoeste, com a sua poltrona.
    { id: 'living-tv-stand', model: 'cabinetTelevision', at: [6.6, 5.4], facing: 'E' },
    { id: 'living-tv-north-east', model: 'televisionVintage', logic: 'tv@5,6', on: { parent: 'living-tv-stand' }, facing: 'E' },
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@5,7', at: [7.5, 5.4], facing: 'W' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [7.0, 5.4], facing: 'E' },
    { id: 'living-side-table', model: 'tableCoffee', at: [5.5, 6.45] },
    { id: 'living-tv-south-west', model: 'televisionVintage', logic: 'tv@6,5', on: { parent: 'living-side-table' }, facing: 'S' },
    { id: 'living-games-chair', model: 'loungeChair', at: [5.5, 7.45], facing: 'N' },
    { id: 'living-clock-table', model: 'sideTable', at: [7.5, 7.6] },
    { id: 'living-clock', model: 'radio', logic: 'clock@7,7', on: { parent: 'living-clock-table' } },
    { id: 'living-armchair', model: 'loungeChair', at: [7.45, 6.75], facing: 'W' },
  ],
}
