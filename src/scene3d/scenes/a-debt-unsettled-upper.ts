import type { SceneSpec } from '../schema'
import { aDebtUnsettledStairwellBounds } from './a-debt-unsettled-ground'

const well = aDebtUnsettledStairwellBounds
const rail = 0.07

// A escada chega ao corredor norte. Uma sala de estar no topo distribui para o
// quarto, a casa de banho e o escritório; o quarto fica a nascente, sem passagem.
export const aDebtUnsettledUpper: SceneSpec = {
  puzzleId: 'master-4',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], well[1] - 0.76, well[2], well[1]],
    halls: [
      { id: 'hallway-main-run', bounds: [well[0], 0.65, 7.9, 1.45] },
      { id: 'sitting-entry', bounds: [2.55, 1.45, 3.4, 2.6] },
      { id: 'sitting-path', bounds: [2.05, 2.05, 3.4, 4.95] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [3.0, 4.0, 3.95, 4.8] },
      { id: 'bathroom-entry', bounds: [2.05, 4.2, 2.85, 4.95] },
      { id: 'study-entry', bounds: [2.6, 4.2, 3.95, 4.95] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 5.5, kind: 'window' },
    { wall: 'north', at: 3.25, kind: 'window' },
    { wall: 'west', at: 6.4, kind: 'window' },
  ] },
  floors: [
    { id: 'hallway-floor', cells: [0, 0, 7, 1], material: 'wood', kind: 'interior' },
    { id: 'bedroom-floor', cells: [0, 2, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'bathroom-floor', cells: [0, 5, 2, 7], material: 'tile', kind: 'interior' },
    { id: 'study-floor', cells: [3, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'hallway-bedroom-door', from: [well[2] + rail, 2], to: [8, 2], height: 'half', openings: [{ at: 3.2, width: 1.4, kind: 'open' }] },
    { id: 'sitting-bedroom', from: [4, 2], to: [4, 5], height: 'half', openings: [{ at: 4.4, width: 0.7, kind: 'door' }] },
    { id: 'bedroom-study-door', from: [0, 5], to: [8, 5], height: 'half', openings: [
      { at: 2.4, width: 0.7, kind: 'door' },
      { at: 3.6, width: 0.7, kind: 'door' },
    ] },
    { id: 'bathroom-study-wall', from: [3, 5], to: [3, 8], height: 'half' },
    { id: 'stairwell-east-guard', from: [well[2] + rail, well[1]], to: [well[2] + rail, well[3] + rail], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-south-guard', from: [0, well[3] + rail], to: [well[2] + rail, well[3] + rail], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Corredor: plantas, coluna de som e estante encostadas, passagem livre.
    { id: 'hallway-plant-west', model: 'pottedPlant', logic: 'plant@0,4', at: [4.5, 0.3], facing: 'S' },
    { id: 'hallway-clock', model: 'speaker', logic: 'clock@1,2', at: [2.25, 1.75], facing: 'S' },
    { id: 'hallway-plant-east', model: 'pottedPlant', logic: 'plant@1,4', at: [4.5, 1.75], facing: 'S' },
    { id: 'hallway-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 1.9 } },
    { id: 'hallway-bench', model: 'bench', against: { wall: 'north', at: 7.4 } },
    // Sala de estar do piso: tapete, sofá contra a parede do quarto, poltrona e coluna.
    { id: 'bedroom-rug-bella', model: 'rugRectangle', logic: 'rug@2,2', at: [3.0, 2.9], facing: 'S' },
    { id: 'sitting-sofa', model: 'loungeSofa', against: { wall: 'sitting-bedroom', side: 'W', at: 3.3 }, facing: 'W' },
    { id: 'sitting-armchair', model: 'loungeChair', at: [1.75, 3.0], facing: 'E' },
    { id: 'bedroom-clock', model: 'speaker', logic: 'clock@4,1', at: [1.3, 4.25], facing: 'S' },
    // Quarto: cama com cabeceira a norte, estante de cabeceira com candeeiro, roupeiro, cómoda e poltrona.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@2,4', against: { wall: 'hallway-bedroom-door', side: 'S', at: 5.0 } },
    { id: 'bedroom-nightstand', model: 'bookcaseOpenLow', against: { wall: 'hallway-bedroom-door', side: 'S', at: 5.95 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand', surface: 'top' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'hallway-bedroom-door', side: 'S', at: 7.2 } },
    { id: 'bedroom-dresser', model: 'bookcaseOpenLow', against: { wall: 'east', at: 3.6 }, facing: 'W' },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [7.35, 4.45], facing: 'W' },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@4,4', at: [4.75, 4.25], facing: 'S' },
    // Casa de banho: duche, lavatório e móvel a poente, sanita, banheira a sul.
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@5,1', at: [1.55, 5.4], facing: 'S' },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@7,0', against: { wall: 'south', at: 1.0 }, facing: 'N' },
    { id: 'bathroom-toilet', model: 'toilet', against: { wall: 'bathroom-study-wall', side: 'W', at: 6.6 }, facing: 'W' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 5.6 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 6.3 }, facing: 'E' },
    // Escritório: estante larga a norte, secretária com cadeira na parede nascente,
    // canto de leitura com sofá, candeeiro e poltrona.
    { id: 'study-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@5,4', against: { wall: 'bedroom-study-door', side: 'S', at: 5.0 }, facing: 'S' },
    { id: 'study-desk', model: 'desk', logic: 'desk@6,7', against: { wall: 'east', at: 6.5 }, facing: 'W' },
    { id: 'study-chair', model: 'chairDesk', at: [7.0, 6.5], facing: 'E' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@7,7', at: [7.6, 7.6], facing: 'S' },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'south', at: 4.6 }, facing: 'N' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@7,5', at: [5.5, 7.75], facing: 'S' },
    { id: 'study-armchair', model: 'loungeChair', at: [4.6, 6.4], facing: 'S' },
  ],
}
