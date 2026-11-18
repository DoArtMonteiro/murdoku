import type { SceneSpec } from '../schema'
import { noOneHeardStairwellBounds } from './no-one-heard-ground'

const well = noOneHeardStairwellBounds
// A divisória do quarto recua ligeiramente para nascente, para que a galeria
// a nascente do vão tenha largura útil até à parte norte do escritório.
const bedroomWallX = 5.35

export const noOneHeardUpper: SceneSpec = {
  puzzleId: 'expert-8',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], well[3], well[2], well[3] + 0.75],
    halls: [
      { id: 'study-south-hall', bounds: [3.05, well[3] + 0.06, bedroomWallX - 0.05, 7.6] },
      { id: 'study-east-gallery', bounds: [4.5, 1.05, bedroomWallX - 0.05, well[3] + 0.3] },
      { id: 'study-north-hall', bounds: [3.05, 1.05, bedroomWallX - 0.05, 2.0] },
    ],
    roomAccessTargets: [
      { id: 'office-access', bounds: [2.3, 1.05, 3.6, 1.95] },
      { id: 'bathroom-access', bounds: [2.3, 6.72, 3.6, 7.5] },
      { id: 'bedroom-access', bounds: [4.6, 6.72, 6.0, 7.5] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.45, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 1.5, kind: 'window' },
    { wall: 'west', at: 5.5, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [5, 0, 7, 7], material: 'wood', kind: 'interior' },
    { id: 'study-floor', cells: [3, 0, 4, 7], material: 'wood', kind: 'interior' },
    { id: 'office-floor', cells: [0, 0, 2, 2], material: 'wood', kind: 'interior' },
    { id: 'bathroom-floor', cells: [0, 3, 2, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'office-study-partition', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 1.5, width: 1.0, kind: 'door' }] },
    { id: 'office-bathroom-partition', from: [0, 3], to: [3, 3], height: 'half' },
    { id: 'bathroom-study-partition', from: [3, 3], to: [3, 8], height: 'half', openings: [{ at: 7.05, width: 1.0, kind: 'door' }] },
    { id: 'study-bedroom-partition', from: [bedroomWallX, 0], to: [bedroomWallX, 8], height: 'half', openings: [{ at: 7.05, width: 1.0, kind: 'door' }] },
    { id: 'stairwell-west-guard', from: [well[0] - 0.05, well[1] - 0.05], to: [well[0] - 0.05, well[3]], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east-guard', from: [well[2] + 0.05, well[1] - 0.05], to: [well[2] + 0.05, well[3]], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [well[0] - 0.05, well[1] - 0.05], to: [well[2] + 0.05, well[1] - 0.05], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Quarto: cama com a cabeceira na parede nascente e mesas baixas dos dois lados;
    // cómoda com televisão e rádio aos pés, roupeiro na divisória, recanto de estar no
    // tapete a norte e poltrona de leitura entre os candeeiros a sul.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'east', at: 4.0 }, facing: 'W' },
    { id: 'bedroom-nightstand-north', model: 'tableCoffeeSquare', at: [7.66, 3.08] },
    { id: 'bedroom-nightstand-north-books', model: 'books', on: { parent: 'bedroom-nightstand-north' } },
    { id: 'bedroom-nightstand-south', model: 'tableCoffeeSquare', at: [7.66, 4.92] },
    { id: 'bedroom-dresser', model: 'cabinetTelevision', against: { wall: 'study-bedroom-partition', side: 'E', at: 3.55 }, facing: 'E' },
    { id: 'bedroom-clock-north', model: 'radio', logic: 'clock@3,5', on: { parent: 'bedroom-dresser' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'study-bedroom-partition', side: 'E', at: 5.4 }, facing: 'E' },
    { id: 'bedroom-carol-rug', model: 'rugRectangle', logic: 'rug@0,5', at: [6.2, 1.0], facing: 'E' },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'north', at: 6.3 } },
    { id: 'bedroom-coffee-table', model: 'tableCoffee', at: [6.3, 1.25] },
    { id: 'bedroom-armchair-north', model: 'loungeChair', at: [7.55, 1.25], facing: 'W' },
    { id: 'bedroom-floor-lamp-east', model: 'lampRoundFloor', logic: 'lamp@6,7', at: [7.25, 6.2], facing: 'N' },
    { id: 'bedroom-reading-chair', model: 'loungeChair', at: [7.45, 7.5], facing: 'W' },
    { id: 'bedroom-floor-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,6', at: [6.25, 7.25], facing: 'N' },
    { id: 'bedroom-clock-table-south', model: 'sideTable', at: [5.75, 7.8] },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@7,5', on: { parent: 'bedroom-clock-table-south' } },
    // Escritório de passagem: estante baixa a norte, secretária virada a poente com a
    // cadeira, e caixa encostada à guarda do vão.
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@0,3', against: { wall: 'north', at: 3.75 } },
    { id: 'study-bookshelf-2', model: 'bookcaseOpenLow', against: { wall: 'north', at: 4.3 } },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-desk', model: 'desk', logic: 'desk@3,4', at: [4.25, 3.3], facing: 'W' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-desk-chair', model: 'chairDesk', at: [3.75, 3.25], facing: 'E' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@4,3', at: [3.5, 4.05] },
    // Escritório: secretária sob a janela norte com cadeira, poltrona de canto,
    // estante alta a poente e mesa baixa.
    { id: 'office-desk', model: 'desk', logic: 'desk@0,0', against: { wall: 'north', at: 0.75 } },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [0.75, 0.95], facing: 'N' },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@0,2', at: [2.45, 0.45], facing: 'S' },
    { id: 'office-bookcase', model: 'bookcaseClosed', against: { wall: 'west', at: 2.5 }, facing: 'E' },
    // Casa de banho: banheira contra a divisória norte, lavatório e móvel a poente,
    // máquinas de roupa na divisória nascente, duche e sanita a sul.
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@3,0', against: { wall: 'office-bathroom-partition', side: 'S', at: 1.0 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 5.0 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 6.25 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'bathroom-study-partition', side: 'W', at: 4.5 }, facing: 'W' },
    { id: 'bathroom-dryer', model: 'dryer', against: { wall: 'bathroom-study-partition', side: 'W', at: 5.1 }, facing: 'W' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@7,0', at: [0.5, 7.5], facing: 'S' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@7,1', against: { wall: 'south', at: 1.5 }, facing: 'N' },
    { id: 'bathroom-bin', model: 'trashcan', at: [2.0, 7.75] },
  ],
}
