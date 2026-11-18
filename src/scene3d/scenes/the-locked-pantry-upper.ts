import type { SceneSpec } from '../schema'
import { lockedPantryStairwellBounds } from './the-locked-pantry-ground'

export const theLockedPantryUpper: SceneSpec = {
  puzzleId: 'expert-3',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: lockedPantryStairwellBounds,
  circulation: {
    landing: [
      lockedPantryStairwellBounds[0],
      lockedPantryStairwellBounds[3],
      lockedPantryStairwellBounds[2],
      lockedPantryStairwellBounds[3] + 0.95,
    ],
    halls: [
      { id: 'study-south-cross', bounds: [3.1, 4.05, 7.8, 4.95] },
      { id: 'bathroom-link', bounds: [3.1, 2.8, 3.9, 4.9] },
      { id: 'office-bedroom-spine', bounds: [7.0, 2.8, 7.8, 5.8] },
    ],
    roomAccessTargets: [
      { id: 'bathroom-entry', bounds: [3.1, 2.4, 3.9, 3.7] },
      { id: 'office-entry', bounds: [7.0, 2.4, 7.8, 3.7] },
      { id: 'bedroom-entry', bounds: [7.0, 5.0, 7.8, 5.75] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.5, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 1.5, kind: 'window' },
  ] },
  floors: [
    { id: 'bathroom', cells: [0, 0, 3, 2], material: 'tile' },
    { id: 'office', cells: [4, 0, 7, 2], material: 'wood' },
    { id: 'study', cells: [0, 3, 7, 4], material: 'wood' },
    { id: 'bedroom', cells: [0, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'bathroom-office', from: [4, 0], to: [4, 3], height: 'half' },
    { id: 'bathroom-study-door-wall', from: [0, 3], to: [lockedPantryStairwellBounds[0] - 0.1, 3], height: 'half', freeEnds: ['to'], openings: [{ at: 3.5, width: 1.0, kind: 'door' }] },
    { id: 'office-study-door-wall', from: [lockedPantryStairwellBounds[2] + 0.1, 3], to: [8, 3], height: 'half', freeEnds: ['from'], openings: [{ at: 7.5, width: 1.0, kind: 'door' }] },
    { id: 'study-bedroom', from: [0, 5], to: [8, 5], height: 'half', openings: [{ at: 7.4, width: 1.0, kind: 'door' }] },
    { id: 'stairwell-west-guard', from: [lockedPantryStairwellBounds[0], lockedPantryStairwellBounds[1]], to: [lockedPantryStairwellBounds[0], lockedPantryStairwellBounds[3] - 0.15], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east-guard', from: [lockedPantryStairwellBounds[2], lockedPantryStairwellBounds[1]], to: [lockedPantryStairwellBounds[2], lockedPantryStairwellBounds[3] - 0.15], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [lockedPantryStairwellBounds[0], lockedPantryStairwellBounds[1]], to: [lockedPantryStairwellBounds[2], lockedPantryStairwellBounds[1]], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Escritório de leitura: estante larga e secretária com cadeira na parede da casa de banho;
    // poltrona de leitura com candeeiro no canto e caixa de arquivo. O resto é corredor.
    { id: 'study-bookshelf-west', model: 'bookcaseClosedWide', logic: 'bookshelf@3,0', against: { wall: 'bathroom-study-door-wall', side: 'S', at: 1.0 }, facing: 'S' },
    { id: 'study-desk', model: 'desk', logic: 'desk@3,2', against: { wall: 'bathroom-study-door-wall', side: 'S', at: 2.45 }, facing: 'S' },
    { id: 'study-desk-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [2.45, 3.88], facing: 'N' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@4,1', at: [1.75, 4.7] },
    { id: 'study-lamp-west', model: 'lampRoundFloor', logic: 'lamp@4,0', at: [0.3, 4.7] },
    { id: 'study-armchair', model: 'loungeChair', at: [0.9, 4.45], facing: 'E' },
    // Casa de banho: banheira na parede norte, duche no canto, lavatório com móvel a poente
    // e sanita encostada à parede do escritório, fora da porta.
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@0,0', against: { wall: 'north', at: 1.0 }, facing: 'S' },
    { id: 'bathroom-shower', model: 'showerRound', at: [3.6, 0.42], facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 2.0 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 2.6 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 1.35 }, facing: 'E' },
    { id: 'bathroom-toilet-east', model: 'toilet', logic: 'toilet@2,3', against: { wall: 'bathroom-office', side: 'W', at: 2.15 }, facing: 'W' },
    // Escritório: secretária com cadeira a nascente, estante e coluna na parede norte,
    // mesa redonda de reunião junto ao vão.
    { id: 'office-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 4.6 } },
    { id: 'office-clock-west', model: 'speaker', logic: 'clock@0,5', at: [5.45, 0.3] },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@0,6', at: [6.6, 0.62], facing: 'E' },
    { id: 'office-desk-east', model: 'desk', logic: 'desk@0,7', against: { wall: 'east', at: 0.62 }, facing: 'W' },
    { id: 'office-desk-screen', model: 'computerScreen', on: { parent: 'office-desk-east' }, facing: 'W' },
    { id: 'office-meeting-table', model: 'tableRound', at: [4.95, 1.75] },
    { id: 'office-meeting-chair-west', model: 'chair', at: [4.38, 1.75], facing: 'E' },
    { id: 'office-meeting-chair-east', model: 'chair', at: [5.52, 1.75], facing: 'W' },
    // Quarto: cama de cabeceira a poente com mesas de cabeceira e banco aos pés; cómoda baixa
    // na divisória, consola com candeeiro, cómoda com candeeiro, poltrona virada para a cama e sofá com colunas a nascente.
    { id: 'bedroom-bed-west', model: 'bedDouble', against: { wall: 'west', at: 6.5 }, facing: 'E' },
    { id: 'bedroom-nightstand-north', model: 'sideTable', against: { wall: 'west', at: 5.55 }, facing: 'E' },
    { id: 'bedroom-nightstand-south', model: 'sideTable', against: { wall: 'west', at: 7.45 }, facing: 'E' },
    { id: 'bedroom-bench', model: 'benchCushion', at: [1.72, 6.5], facing: 'E' },
    { id: 'bedroom-chest', model: 'cabinetTelevisionDoors', against: { wall: 'study-bedroom', side: 'S', at: 2.9 }, facing: 'S' },
    { id: 'bedroom-chest-books', model: 'speakerSmall', on: { parent: 'bedroom-chest' } },
    { id: 'bedroom-console', model: 'sideTableDrawers', against: { wall: 'study-bedroom', side: 'S', at: 5.5 }, facing: 'S' },
    { id: 'bedroom-lamp-north', model: 'lampRoundTable', logic: 'lamp@5,5', on: { parent: 'bedroom-console' } },
    { id: 'bedroom-clock-north', model: 'speaker', logic: 'clock@5,6', at: [6.4, 5.3] },
    { id: 'bedroom-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'south', at: 4.5 }, facing: 'N' },
    { id: 'bedroom-lamp-southwest', model: 'lampSquareTable', logic: 'lamp@7,4', on: { parent: 'bedroom-dresser' } },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,5', at: [5.52, 7.52] },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'south', at: 6.5 }, facing: 'N' },
    { id: 'bedroom-coffee-table', model: 'tableCoffee', at: [6.5, 6.8] },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [3.2, 6.8], facing: 'W' },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@7,7', at: [7.5, 7.55] },
  ],
}
