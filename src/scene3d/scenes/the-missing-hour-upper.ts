import type { SceneSpec } from '../schema'
import { theMissingHourStairwellBounds } from './the-missing-hour-ground'

const well = theMissingHourStairwellBounds
const partitionClearance = 0.2
const guardHeadInset = 0.15

// A escada chega ao átrio a nascente. Uma galeria a norte do vão leva ao quarto e à
// porta do estúdio; o átrio serve a casa de banho.
export const theMissingHourUpper: SceneSpec = {
  puzzleId: 'hard-11',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[2], well[1], well[2] + 0.95, well[3]],
    halls: [
      { id: 'north-gallery', bounds: [2.75, 4.06, well[2], 4.95] },
      { id: 'arrival-north', bounds: [well[2], 4.06, 5.78, 5.5] },
      { id: 'hallway-arrival-gallery', bounds: [well[2] + 0.75, well[1] + 0.05, 7.15, well[3] - 0.05] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [3.1, 3.45, 4.1, 4.6] },
      { id: 'bathroom-entry', bounds: [6.05, 3.5, 6.95, 5.1] },
      { id: 'study-entry', bounds: [2.1, 4.12, 3.0, 4.94] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.0, kind: 'window' },
    { wall: 'north', at: 6.55, kind: 'window' },
    { wall: 'west', at: 6.45, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [0, 0, 4, 3], material: 'wood', kind: 'interior' },
    { id: 'bathroom-floor', cells: [5, 0, 7, 3], material: 'tile', kind: 'interior' },
    { id: 'study-floor', cells: [0, 4, 4, 7], material: 'wood', kind: 'interior' },
    { id: 'hallway-floor', cells: [5, 4, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'bedroom-study-partition', from: [0, 4], to: [5, 4], height: 'half', openings: [{ at: 3.6, width: 1.0, kind: 'door' }] },
    { id: 'bathroom-hallway-partition', from: [5, 4], to: [8, 4], height: 'half', openings: [{ at: 6.5, width: 0.9, kind: 'door' }] },
    { id: 'bedroom-bathroom-partition', from: [5, 0], to: [5, 4], height: 'half' },
    { id: 'study-gallery-door', from: [2.65, 4], to: [2.65, well[1]], height: 'half', freeEnds: ['to'], openings: [{ at: 4.53, width: 0.9, kind: 'door' }] },
    { id: 'study-hallway-south-partition', from: [5, well[3] + partitionClearance], to: [5, 8], height: 'half', freeEnds: ['from'] },
    { id: 'stairwell-west-guard', from: [well[0], well[1]], to: [well[0], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-north-guard', from: [well[0], well[1]], to: [well[2] - guardHeadInset, well[1]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-south-guard', from: [well[0], well[3]], to: [well[2] - guardHeadInset, well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  furniture: [
    // Quarto: cama com a cabeceira a poente e mesa de cabeceira, toucador com candeeiro
    // e cómoda com rádio sob a janela norte, roupeiros e candeeiro junto à porta.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@2,0', against: { wall: 'west', at: 3 }, facing: 'E' },
    { id: 'bedroom-nightstand', model: 'tableCoffeeSquare', at: [0.33, 2.1] },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-vanity', model: 'desk', against: { wall: 'north', at: 1.45 } },
    { id: 'bedroom-bella-lamp', model: 'lampRoundTable', logic: 'lamp@0,1', on: { parent: 'bedroom-vanity' } },
    { id: 'bedroom-vanity-chair', model: 'chairCushion', at: [1.45, 0.88], facing: 'N' },
    { id: 'bedroom-clock-table', model: 'sideTable', against: { wall: 'north', at: 2.55 } },
    { id: 'bedroom-clock', model: 'radio', logic: 'clock@0,2', on: { parent: 'bedroom-clock-table' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedDoors', against: { wall: 'north', at: 3.75 } },
    { id: 'bedroom-wardrobe-b', model: 'bookcaseClosedDoors', against: { wall: 'north', at: 4.25 } },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [3.0, 2.3], facing: 'W' },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@3,4', at: [4.3, 3.3], facing: 'N' },
    // Estúdio: secretária encostada à meia parede com cadeira, sofá de leitura a sul do
    // vão com estante, e arrumos (caixas e candeeiro) no canto sudoeste.
    { id: 'study-desk', model: 'desk', logic: 'desk@4,1', against: { wall: 'bedroom-study-partition', side: 'S', at: 1.5 } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-desk-chair', model: 'chairDesk', at: [1.5, 4.95], facing: 'N' },
    { id: 'study-sofa', model: 'loungeSofa', at: [3.65, 6.38], facing: 'S' },
    { id: 'study-coffee-table', model: 'tableCoffee', at: [3.65, 7.2] },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@6,4', against: { wall: 'study-hallway-south-partition', side: 'W', at: 7.0 }, facing: 'W' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase' } },
    { id: 'study-armchair', model: 'loungeChair', at: [0.45, 5.6], facing: 'E' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@6,0', at: [0.3, 6.45], facing: 'N' },
    { id: 'study-greta-box', model: 'cardboardBoxClosed', logic: 'box@7,0', at: [0.65, 7.35] },
    { id: 'study-storage-box', model: 'cardboardBoxOpen', logic: 'box@7,1', at: [1.6, 7.55] },
    // Casa de banho: sanita e lavatório a norte, duche no canto, banheira ao longo da
    // parede do quarto e máquina de lavar junto à porta.
    { id: 'bathroom-toilet', model: 'toilet', against: { wall: 'north', at: 6.0 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 6.85 }, facing: 'S' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@1,7', at: [7.55, 1.5], facing: 'S' },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@2,5', against: { wall: 'bedroom-bathroom-partition', side: 'E', at: 3.0 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'east', at: 3.5 }, facing: 'W' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'east', at: 2.6 }, facing: 'W' },
    // Átrio: planta junto à casa de banho, consola com rádio, banco e passadeira.
    { id: 'hallway-yuki-plant', model: 'flower_redA', logic: 'plant@4,5', at: [5.9, 4.2] },
    { id: 'hallway-clock-table', model: 'sideTable', against: { wall: 'study-hallway-south-partition', side: 'E', at: 6.6 }, facing: 'E' },
    { id: 'hallway-clock', model: 'radio', logic: 'clock@6,5', on: { parent: 'hallway-clock-table' } },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@4,7', at: [7.6, 4.4] },
    { id: 'hallway-bench', model: 'benchCushion', against: { wall: 'east', at: 5.6 }, facing: 'W' },
    { id: 'hallway-rug', model: 'rugRectangle', logic: 'rug@6,6', at: [7, 7.2], facing: 'S' },
  ],
}
