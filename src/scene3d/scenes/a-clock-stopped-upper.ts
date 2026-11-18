import type { SceneSpec } from '../schema'
import { aClockStoppedStairwellBounds } from './a-clock-stopped-ground'

const well = aClockStoppedStairwellBounds
const stairGuardEnd = well[3] - 0.1

export const aClockStoppedUpper: SceneSpec = {
  puzzleId: 'expert-6',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    // A escada chega ao corredor sul; uma passagem a poente do vão leva à galeria,
    // que distribui para o escritório e a casa de banho. O quarto abre para o corredor.
    landing: [well[0], well[3], well[2], well[3] + 0.75],
    halls: [
      { id: 'hallway-crossing', bounds: [0.7, 7, well[2], 7.75] },
      { id: 'gallery-link', bounds: [3.75, 6, 4.55, 7] },
      { id: 'gallery-west', bounds: [3.75, 3.35, 4.55, 6] },
      { id: 'gallery-band', bounds: [3.75, 3.35, 7.0, 4.45] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [2.0, 6.1, 2.8, 7] },
      { id: 'study-entry', bounds: [3.75, 2.5, 4.55, 3.5] },
      { id: 'bathroom-entry', bounds: [6.0, 2.5, 7.0, 3.5] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.5, kind: 'window' },
      { wall: 'north', at: 6.5, kind: 'window' },
      { wall: 'west', at: 4.75, kind: 'window' },
    ],
  },
  walls: [
    { id: 'study-bathroom', from: [5, 0], to: [5, 3], height: 'half' },
    { id: 'study-bedroom', from: [0, 3], to: [5, 3], height: 'half', openings: [{ at: 4.15, width: 0.8, kind: 'door' }] },
    { id: 'bathroom-bedroom', from: [5, 3], to: [8, 3], height: 'cutaway', openings: [{ at: 6.5, width: 1.0, kind: 'door' }] },
    // O quarto fecha-se a nascente; o resto da zona é galeria e sala de estar do piso.
    { id: 'bedroom-gallery', from: [3.7, 3], to: [3.7, 6], height: 'half' },
    { id: 'bedroom-hallway-west', from: [0, 6], to: [well[0], 6], height: 'half', openings: [
      { at: 2.4, width: 0.8, kind: 'door' },
      { at: 4.15, width: 0.8, kind: 'open' },
    ] },
    { id: 'bedroom-hallway-east', from: [well[2], 6], to: [8, 6], height: 'half' },
    { id: 'stairwell-west-guard', from: [well[0], well[1]], to: [well[0], stairGuardEnd], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [well[2], well[1]], to: [well[2], stairGuardEnd], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-north-guard', from: [well[0], well[1]], to: [well[2], well[1]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  floors: [
    { id: 'study-wood', cells: [0, 0, 4, 2], material: 'wood', kind: 'interior' },
    { id: 'bathroom-tile', cells: [5, 0, 7, 2], material: 'tile', kind: 'interior' },
    { id: 'bedroom-wood', cells: [0, 3, 3, 5], material: 'wood', kind: 'interior' },
  ],
  furniture: [
    // Escritório: estante baixa sob a janela, estante alta a poente, secretária contra a
    // divisória com a cadeira à frente, e canto de leitura com candeeiro junto à porta.
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@0,0', against: { wall: 'north', at: 0.75 } },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-bookcase-west', model: 'bookcaseClosed', against: { wall: 'west', at: 1.6 }, facing: 'E' },
    { id: 'study-desk', model: 'desk', logic: 'desk@2,2', against: { wall: 'study-bedroom', side: 'N', at: 2.5 }, facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [2.5, 2.15], facing: 'S' },
    { id: 'study-armchair', model: 'loungeChair', at: [3.55, 0.6], facing: 'S' },
    { id: 'study-side-table', model: 'tableCoffeeSquare', at: [2.85, 0.45] },
    { id: 'study-side-books', model: 'books', on: { parent: 'study-side-table' } },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@0,4', at: [4.3, 0.35], facing: 'S' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@1,4', at: [4.75, 1.55] },
    // Casa de banho: duche e lavatório a norte, banheira a nascente, sanita contra a divisória.
    { id: 'bathroom-shower', model: 'shower', logic: 'shower@0,5', at: [5.5, 0.5], facing: 'E' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@2,5', against: { wall: 'study-bathroom', side: 'E', at: 2.2 }, facing: 'E' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 6.6 }, facing: 'S' },
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@1,7', against: { wall: 'east', at: 1.75 } },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'north', at: 7.45 }, facing: 'S' },
    // Quarto: cama com cabeceira a poente entre duas mesas de cabeceira, roupeiro na
    // divisória norte, banco aos pés e poltrona no canto.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@4,0', against: { wall: 'west', at: 4.75 } },
    { id: 'bedroom-nightstand-north', model: 'cabinetBedDrawer', against: { wall: 'west', at: 3.85 }, facing: 'E' },
    { id: 'bedroom-nightstand-south', model: 'cabinetBedDrawer', against: { wall: 'west', at: 5.65 }, facing: 'E' },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand-north' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'study-bedroom', side: 'S', at: 2.3 }, facing: 'S' },
    { id: 'bedroom-foot-bench', model: 'benchCushionLow', at: [1.68, 4.75], facing: 'E' },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [3.25, 4.1], facing: 'W' },
    // Galeria e sala de estar: relógio junto à porta do escritório; sofá encostado ao
    // corredor entre dois candeeiros, mesa baixa, poltrona e consola com rádio a nascente.
    { id: 'gallery-clock-west', model: 'speaker', logic: 'clock@3,4', at: [4.86, 3.2] },
    { id: 'sitting-sofa', model: 'loungeSofa', against: { wall: 'bedroom-hallway-east', side: 'N', at: 6.86 }, facing: 'N' },
    { id: 'sitting-lamp-west', model: 'lampRoundFloor', logic: 'lamp@5,6', at: [6.1, 5.72], facing: 'S' },
    { id: 'sitting-lamp-east', model: 'lampRoundFloor', logic: 'lamp@5,7', at: [7.15, 5.2], facing: 'S' },
    { id: 'sitting-table', model: 'tableCoffee', at: [6.8, 4.75] },
    { id: 'sitting-armchair', model: 'loungeChair', at: [7.7, 4.9], facing: 'W' },
    { id: 'sitting-console', model: 'sideTable', against: { wall: 'east', at: 3.6 }, facing: 'W' },
    { id: 'sitting-clock', model: 'radio', logic: 'clock@3,7', on: { parent: 'sitting-console' } },
    // Corredor: vasos a nascente da chegada, relógio de pé e banco com cabide no topo poente;
    // estante baixa no topo nascente.
    { id: 'hallway-plant-3', model: 'pottedPlant', logic: 'plant@6,3', at: [3.3, 6.3] },
    { id: 'hallway-plant-5', model: 'pottedPlant', logic: 'plant@6,5', at: [5.85, 6.35] },
    { id: 'hallway-clock', model: 'speaker', logic: 'clock@7,4', at: [4.2, 7.85] },
    { id: 'hallway-plant-south-east', model: 'pottedPlant', logic: 'plant@7,5', at: [5.85, 7.45] },
    { id: 'hallway-bench', model: 'benchCushion', against: { wall: 'west', at: 6.45 }, facing: 'E' },
    { id: 'hallway-coat-rack', model: 'coatRackStanding', at: [0.3, 7.6] },
    { id: 'hallway-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 7.0 }, facing: 'W' },
    { id: 'hallway-shelf-books', model: 'books', on: { parent: 'hallway-shelf' } },
  ],
  rugs: [
    { id: 'study-rug', model: 'rugRound', at: [3.4, 0.9] },
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.6, 4.75], facing: 'E' },
    { id: 'sitting-rug', model: 'rugRectangle', at: [6.86, 4.95] },
    { id: 'hallway-runner', model: 'rugRectangle', at: [2.2, 7.3] },
    { id: 'bathroom-mat', model: 'rugDoormat', at: [6.5, 2.2] },
  ],
}
