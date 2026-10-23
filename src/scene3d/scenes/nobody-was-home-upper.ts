import type { SceneSpec } from '../schema'
import { nobodyWasHomeStairwellBounds } from './nobody-was-home-ground'

const well = nobodyWasHomeStairwellBounds

export const nobodyWasHomeUpper: SceneSpec = {
  puzzleId: 'master-8',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  // A escada chega ao escritório norte; um corredor a nascente do vão serve o quarto
  // e a sala de trabalho. A casa de banho é privativa do quarto.
  circulation: {
    landing: [well[0], 0.1, well[2] + 0.1, well[1]],
    halls: [
      { id: 'study-north-crossing', bounds: [well[0], 0.1, 7.9, 0.95] },
      { id: 'east-corridor-north', bounds: [6.97, 0.95, 7.9, 2.1] },
      { id: 'east-corridor-lamp', bounds: [6.97, 2.0, 7.72, 3.0] },
      { id: 'east-corridor-south', bounds: [6.97, 2.9, 7.9, 4.95] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [6.97, 3.95, 7.9, 4.65] },
      { id: 'office-entry', bounds: [6.97, 4.2, 7.9, 4.95] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.0, kind: 'window' },
      { wall: 'north', at: 6.3, kind: 'window' },
      { wall: 'west', at: 3.3, kind: 'window' },
    ],
  },
  walls: [
    { id: 'study-bedroom-west', from: [0, 2], to: [well[0] - 0.06, 2], height: 'half' },
    { id: 'stairwell-east-guard', from: [6.92, well[1]], to: [6.92, 2], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'corridor-bedroom', from: [6.92, 2], to: [6.92, 5], height: 'half', openings: [{ at: 4.3, width: 0.7, kind: 'door' }] },
    { id: 'bedroom-bathroom', from: [0, 5], to: [4, 5], height: 'half', openings: [{ at: 2.5, width: 0.9, kind: 'door' }] },
    { id: 'bedroom-office', from: [4, 5], to: [8, 5], height: 'half', openings: [{ at: 7.45, width: 0.7, kind: 'door' }] },
    { id: 'bathroom-office-divider', from: [4, 5], to: [4, 8], height: 'half' },
    { id: 'stairwell-west-guard', from: [well[0] - 0.06, well[1]], to: [well[0] - 0.06, well[3] + 0.06], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-foot-guard', from: [well[0] - 0.06, well[3] + 0.06], to: [6.92, well[3] + 0.06], height: 'half', treatment: 'railing' },
  ],
  floors: [
    { id: 'study-wood', cells: [0, 0, 7, 1], material: 'wood', kind: 'interior' },
    { id: 'bedroom-wood', cells: [0, 2, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'bathroom-tile', cells: [0, 5, 3, 7], material: 'tile', kind: 'interior' },
    { id: 'office-wood', cells: [4, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  furniture: [
    // Escritório norte: secretária sob a parede norte com a cadeira, caixa, estantes,
    // sofá de leitura e estante baixa contra a meia parede do quarto.
    { id: 'study-desk', model: 'desk', logic: 'desk@0,4', against: { wall: 'north', at: 4.5 } },
    { id: 'study-desk-chair', model: 'chairDesk', at: [4.5, 0.95], facing: 'N' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,5', at: [5.5, 0.5], facing: 'S' },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@1,2', against: { wall: 'study-bedroom-west', side: 'N', at: 2.9 }, facing: 'N' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase' } },
    { id: 'study-shelves', model: 'bookcaseClosedWide', against: { wall: 'north', at: 3.0 } },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'north', at: 1.4 } },
    // Quarto: cama de cabeceira na meia parede norte, estante de cabeceira,
    // sofá sobre o tapete da Priya; candeeiros e relógios de pé.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'study-bedroom-west', side: 'S', at: 4.65 } },
    { id: 'bedroom-nightstand', model: 'bookcaseOpenLow', against: { wall: 'study-bedroom-west', side: 'S', at: 3.75 } },
    { id: 'bedroom-rug-priya', model: 'rugRectangle', logic: 'rug@2,0', at: [1.0, 3.0], facing: 'E' },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'west', at: 3.65 } },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [2.1, 3.0], facing: 'W' },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@4,4', at: [4.5, 4.02], facing: 'S' },
    { id: 'bedroom-clock-west', model: 'speaker', logic: 'clock@4,3', at: [3.5, 4.02], facing: 'S' },
    { id: 'bedroom-lamp-greta', model: 'lampRoundFloor', logic: 'lamp@3,5', at: [5.5, 3.85], facing: 'S' },
    { id: 'bedroom-lamp-north', model: 'lampRoundFloor', logic: 'lamp@2,7', at: [7.85, 2.5], facing: 'S' },
    // Casa de banho privativa: duche, lavatório, sanita, móvel e banheira na meia parede.
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@6,3', against: { wall: 'bathroom-office-divider', side: 'W', at: 6.9 }, facing: 'W' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@5,1', at: [1.5, 5.5], facing: 'S' },
    { id: 'bathroom-toilet', model: 'toilet', against: { wall: 'west', at: 6.6 }, facing: 'E' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'bedroom-bathroom', side: 'S', at: 0.55 }, facing: 'S' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'south', at: 1.6 }, facing: 'N' },
    // Sala de trabalho: secretária com cadeira, poltrona de visita e estante.
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@5,6', at: [6.4, 5.6], facing: 'S' },
    { id: 'office-desk', model: 'desk', logic: 'desk@7,7', at: [7.5, 7.5], facing: 'N' },
    { id: 'office-desk-chair', model: 'chairDesk', at: [7.25, 6.9], facing: 'S' },
    { id: 'office-bookcase', model: 'bookcaseClosedWide', against: { wall: 'bathroom-office-divider', side: 'E', at: 6.0 }, facing: 'E' },
  ],
  rugs: [
    { id: 'study-rug', model: 'rugRound', at: [1.4, 1.1] },
    { id: 'office-rug', model: 'rugRound', at: [5.7, 6.6] },
  ],
}
