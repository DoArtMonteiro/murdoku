import type { SceneSpec } from '../schema'
import { theSpareKeyStairwellBounds } from './the-spare-key-ground'

const well = theSpareKeyStairwellBounds

export const theSpareKeyUpper: SceneSpec = {
  puzzleId: 'expert-9',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    // A escada chega ao escritório de passagem; a galeria segue a sul da secretária até
    // às portas da casa de banho e do quarto, e a nascente até ao gabinete.
    landing: [well[0] - 1.0, well[1] - 1.0, 7.4, well[1]],
    halls: [
      { id: 'study-west-gallery', bounds: [0.45, 3.7, 4.8, 4.95] },
    ],
    roomAccessTargets: [
      { id: 'bathroom-entry', bounds: [0.85, 2.4, 1.75, 3.8] },
      { id: 'office-entry', bounds: [6.6, 2.4, 7.4, 3.5] },
      { id: 'bedroom-entry', bounds: [1.65, 4.5, 2.75, 5.5] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.2, kind: 'window' },
      { wall: 'north', at: 6.5, kind: 'window' },
      { wall: 'west', at: 6.5, kind: 'window' },
    ],
  },
  floors: [
    { id: 'bathroom', cells: [0, 0, 4, 2], material: 'tile', kind: 'interior' },
    { id: 'office', cells: [5, 0, 7, 2], material: 'wood', kind: 'interior' },
    { id: 'study', cells: [0, 3, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'bedroom', cells: [0, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'bathroom-study-door', from: [0, 3], to: [5, 3], openings: [{ at: 1.3, width: 1.0, kind: 'door' }] },
    { id: 'office-study-door', from: [5, 3], to: [8, 3], height: 'half', openings: [{ at: 7.0, width: 0.9, kind: 'door' }] },
    { id: 'bathroom-office-door', from: [5, 0], to: [5, 3] },
    // A casa de banho divide-se em duas alas: banho a poente, duche e sanita a nascente.
    { id: 'bathroom-bay-partition', from: [3, 0], to: [3, 1.95], height: 'half', freeEnds: ['to'] },
    { id: 'study-bedroom-door-west', from: [0, 5], to: [well[0], 5], height: 'half', openings: [{ at: 2.2, width: 1.2, kind: 'door' }] },
    { id: 'study-bedroom-door-east', from: [well[2], 5], to: [8, 5], height: 'half' },
    { id: 'stairwell-west-guard', from: [well[0], well[1] + 0.12], to: [well[0], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-east-guard', from: [well[2], well[1] + 0.12], to: [well[2], well[3]], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-south-guard', from: [well[0], well[3]], to: [well[2], well[3]], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Escritório de passagem: secretária contra a divisória norte, estantes e caixa.
    { id: 'study-desk-carol', model: 'desk', logic: 'desk@3,3', against: { wall: 'bathroom-study-door', side: 'S', at: 3.5 }, facing: 'S' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk-carol' } },
    { id: 'study-bookcase-tall', model: 'bookcaseClosedWide', against: { wall: 'bathroom-study-door', side: 'S', at: 2.45 }, facing: 'S' },
    { id: 'study-bookcase-low', model: 'bookcaseOpenLow', against: { wall: 'bathroom-study-door', side: 'S', at: 4.4 }, facing: 'S' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase-low' } },
    { id: 'study-bookcase-west', model: 'bookcaseClosed', against: { wall: 'west', at: 4.2 }, facing: 'E' },
    { id: 'study-box-east', model: 'cardboardBoxClosed', logic: 'box@3,7', at: [7.75, 3.25] },
    { id: 'study-lamp-east', model: 'lampRoundFloor', logic: 'lamp@4,6', at: [6.5, 4.8], facing: 'N' },
    // Casa de banho: banheira, lavatório e sanita na ala poente; banheira, sanita e duche
    // na ala nascente, separada por uma meia parede.
    { id: 'bathroom-tub-west', model: 'bathtub', logic: 'bathtub@0,0', against: { wall: 'north', at: 1.0 } },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 1.6 }, facing: 'E' },
    { id: 'bathroom-toilet-west', model: 'toilet', logic: 'toilet@2,2', against: { wall: 'bathroom-study-door', side: 'N', at: 2.5 }, facing: 'N' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 2.45 }, facing: 'E' },
    { id: 'bathroom-tub-east', model: 'bathtub', logic: 'bathtub@0,3', against: { wall: 'north', at: 4.0 } },
    { id: 'bathroom-toilet-east', model: 'toilet', logic: 'toilet@1,4', against: { wall: 'bathroom-office-door', side: 'W', at: 1.5 }, facing: 'W' },
    { id: 'bathroom-shower-east', model: 'shower', logic: 'shower@2,4', at: [4.57, 2.57], facing: 'S' },
    { id: 'bathroom-sink-east', model: 'bathroomSink', against: { wall: 'bathroom-bay-partition', side: 'E', at: 1.3 }, facing: 'E' },
    // Gabinete: secretária sob a janela, estante, sofá de leitura e poltrona à volta de
    // uma mesa baixa.
    { id: 'office-desk', model: 'desk', logic: 'desk@0,6', against: { wall: 'north', at: 6.6 } },
    { id: 'office-desk-books', model: 'books', on: { parent: 'office-desk' } },
    { id: 'office-bookcase', model: 'bookcaseOpen', against: { wall: 'north', at: 5.4 } },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase', surface: 'shelf2' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'office-study-door', side: 'N', at: 5.95 }, facing: 'N' },
    { id: 'office-table', model: 'tableCoffeeSquare', at: [6.45, 1.95] },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@2,7', at: [7.55, 2.0], facing: 'W' },
    // Quarto: cama com cabeceira na divisória e duas mesas de cabeceira, roupeiro a poente,
    // televisão aos pés da cama, rádio e relógio a sudoeste, e recanto com sofá no tapete.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@5,3', against: { wall: 'study-bedroom-door-west', side: 'S', at: 3.9 } },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', at: [3.08, 5.25], facing: 'S' },
    { id: 'bedroom-nightstand-east', model: 'cabinetBedDrawerTable', at: [4.72, 5.2], facing: 'S' },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'west', at: 5.8 }, facing: 'E' },
    { id: 'bedroom-tv-console', model: 'cabinetTelevision', against: { wall: 'south', at: 4.0 }, facing: 'N' },
    { id: 'bedroom-tv', model: 'televisionVintage', on: { parent: 'bedroom-tv-console' }, facing: 'N' },
    { id: 'bedroom-clock-west', model: 'speaker', logic: 'clock@7,0', at: [0.35, 7.6] },
    { id: 'bedroom-clock-east-table', model: 'sideTable', at: [1.5, 7.62] },
    { id: 'bedroom-clock-east', model: 'radio', logic: 'clock@7,1', on: { parent: 'bedroom-clock-east-table' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@5,6', at: [7, 6], facing: 'E' },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'east', at: 5.75 }, facing: 'W' },
    { id: 'bedroom-coffee-table', model: 'tableCoffee', at: [6.8, 5.75], facing: 'E' },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@7,7', at: [7.5, 7.5], facing: 'N' },
  ],
}
