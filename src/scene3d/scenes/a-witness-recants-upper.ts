import type { SceneSpec } from '../schema'
import { aWitnessRecantsStairwellBounds } from './a-witness-recants-ground'

const well = aWitnessRecantsStairwellBounds
const guardOffset = 0.1

export const aWitnessRecantsUpper: SceneSpec = {
  puzzleId: 'expert-2',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    // A escada chega a sul, no escritório; um corredor fechado a poente serve
    // o escritório de leitura, o quarto e as duas casas de banho.
    landing: [well[0], well[3], well[2], 7.3],
    halls: [
      { id: 'west-corridor', bounds: [2.85, 0.1, 3.7, 7.27] },
      { id: 'south-cross-gallery', bounds: [3.6, well[3] + 0.07, well[0], 7.27] },
    ],
    roomAccessTargets: [
      { id: 'study-access', bounds: [2.85, 2.25, 3.6, 2.95] },
      { id: 'bedroom-access', bounds: [2.85, 4.65, 3.6, 5.35] },
      { id: 'bathroom-access', bounds: [2.9, 0.95, 3.7, 1.75] },
      { id: 'guest-bathroom-access', bounds: [2.9, 2.5, 3.7, 3.3] },
      { id: 'office-access', bounds: [4.05, 6.5, 4.8, 7.15] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.7, kind: 'window' },
      { wall: 'north', at: 5.0, kind: 'window' },
      { wall: 'west', at: 6.2, kind: 'window' },
    ],
  },
  floors: [
    { id: 'study', cells: [0, 0, 3, 3], material: 'wood', kind: 'interior' },
    { id: 'bathroom', cells: [4, 0, 7, 3], material: 'tile', kind: 'interior' },
    { id: 'bedroom', cells: [0, 4, 3, 7], material: 'wood', kind: 'interior' },
    { id: 'office', cells: [4, 4, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'corridor-west', from: [2.8, 0], to: [2.8, 8], height: 'half', openings: [
      { at: 2.6, width: 0.8, kind: 'door' },
      { at: 5.0, width: 0.8, kind: 'door' },
    ] },
    { id: 'study-bedroom-divider', from: [0, 4], to: [2.8, 4], height: 'half' },
    {
      id: 'west-east-wings',
      from: [4, 0],
      to: [4, 8],
      height: 'half',
      openings: [
        { at: 1.35, width: 0.8, kind: 'door' },
        { at: 2.9, width: 0.7, kind: 'door' },
        { at: 6.8, width: 1.0, kind: 'open' },
      ],
    },
    // Casa de banho principal a norte, com WC e duche num compartimento próprio;
    // segunda casa de banho a sudoeste do quadrante.
    { id: 'bath-main-south', from: [4, 1.85], to: [8, 1.85], height: 'half', openings: [{ at: 6.95, width: 0.7, kind: 'door' }] },
    { id: 'bath-guest-east', from: [6, 1.85], to: [6, 4], height: 'half' },
    // A segunda casa de banho fica separada do escritório por uma divisória
    // mais alta do que as meias-paredes, para não se ler como parte dele.
    { id: 'bath-guest-south', from: [4, 4], to: [6, 4], height: 'low' },
    {
      id: 'bathroom-office-divider',
      from: [6, 4],
      to: [8, 4],
      height: 'half',
    },
    {
      id: 'stairwell-west-guard',
      from: [well[0] - guardOffset, well[1]],
      to: [well[0] - guardOffset, well[3]],
      height: 'half',
      treatment: 'railing',
      freeEnds: ['from', 'to'],
    },
    {
      id: 'stairwell-east-guard',
      from: [well[2] + guardOffset, well[1]],
      to: [well[2] + guardOffset, well[3]],
      height: 'half',
      treatment: 'railing',
      freeEnds: ['from', 'to'],
    },
    {
      id: 'stairwell-north-guard',
      from: [well[0], well[1] - guardOffset],
      to: [well[2], well[1] - guardOffset],
      height: 'half',
      treatment: 'railing',
      freeEnds: ['from', 'to'],
    },
  ],
  furniture: [
    // Escritório de leitura: secretária com pufe a norte, sofá e mesa baixa, estantes e caixa de arquivo.
    { id: 'study-desk', model: 'desk', logic: 'desk@0,0', against: { wall: 'north', at: 0.6 } },
    { id: 'study-desk-seat', model: 'loungeSofaOttoman', at: [0.6, 0.95] },
    { id: 'study-desk-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@0,2', at: [2.45, 0.3], facing: 'S' },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'corridor-west', side: 'W', at: 1.25 }, facing: 'W' },
    { id: 'study-coffee-table', model: 'tableCoffee', at: [1.55, 1.25], facing: 'E' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@1,0', at: [0.3, 1.7] },
    { id: 'study-bookshelf', model: 'bookcaseOpen', logic: 'bookshelf@3,0', against: { wall: 'west', at: 3.45 }, facing: 'E' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf', surface: 'shelf2' } },
    { id: 'study-shelf-low', model: 'bookcaseOpenLow', against: { wall: 'study-bedroom-divider', side: 'N', at: 1.4 }, facing: 'N' },
    { id: 'study-shelf-low-books', model: 'books', on: { parent: 'study-shelf-low' } },
    // Quarto: cama de cabeceira a sul com mesa e candeeiro de cabeceira, roupeiro a poente
    // e televisão na parede norte, em frente à cama, sobre o tapete.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'south', at: 1.6 }, facing: 'N' },
    { id: 'bedroom-nightstand', model: 'sideTable', at: [0.55, 7.7], facing: 'N' },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,2', at: [2.45, 7.6], facing: 'S' },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedDoors', against: { wall: 'west', at: 4.45 }, facing: 'E' },
    { id: 'bedroom-tv-console', model: 'cabinetTelevision', against: { wall: 'study-bedroom-divider', side: 'S', at: 1.4 }, facing: 'S' },
    { id: 'bedroom-tv', model: 'televisionVintage', on: { parent: 'bedroom-tv-console' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@4,0', at: [1.0, 5.0] },
    // Corredor: os relógios de pé encostam à parede nascente.
    { id: 'bedroom-clock-north', model: 'speaker', logic: 'clock@5,3', against: { wall: 'west-east-wings', side: 'W', at: 5.6 } },
    { id: 'bedroom-clock-south', model: 'speaker', logic: 'clock@7,3', at: [3.4, 7.62] },
    // Casa de banho principal: banheira, móvel, lavatório e duche na parede norte.
    { id: 'bathroom-tub-north', model: 'bathtub', logic: 'bathtub@0,4', against: { wall: 'north', at: 5.0 }, facing: 'S' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'north', at: 6.05 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 6.62 }, facing: 'S' },
    { id: 'bathroom-shower-north', model: 'showerRound', logic: 'shower@0,7', at: [7.58, 0.45], facing: 'S' },
    // Compartimento de WC e duche, aberto da casa de banho principal.
    { id: 'bathroom-toilet-tomas', model: 'toilet', logic: 'toilet@2,6', against: { wall: 'bath-guest-east', side: 'E', at: 2.68 }, facing: 'E' },
    { id: 'bathroom-shower-south', model: 'showerRound', logic: 'shower@2,7', at: [7.6, 2.82], facing: 'S' },
    { id: 'bathroom-wc-sink', model: 'bathroomSink', against: { wall: 'bathroom-office-divider', side: 'N', at: 7.0 }, facing: 'N' },
    // Segunda casa de banho: sanita, lavatório e banheira.
    { id: 'bathroom-toilet-west', model: 'toilet', logic: 'toilet@2,4', against: { wall: 'bath-main-south', side: 'S', at: 4.55 }, facing: 'S' },
    { id: 'bathroom-guest-sink', model: 'bathroomSink', against: { wall: 'bath-guest-east', side: 'W', at: 2.5 }, facing: 'W' },
    { id: 'bathroom-tub-evangeline', model: 'bathtub', logic: 'bathtub@3,4', against: { wall: 'bath-guest-south', side: 'N', at: 5.0 }, facing: 'N' },
    // Escritório: secretária com pufe junto à divisória, estante larga a poente,
    // poltronas de leitura nos cantos e coluna de som a nascente.
    { id: 'office-desk', model: 'desk', logic: 'desk@4,5', against: { wall: 'bath-guest-south', side: 'S', at: 5.4 }, facing: 'S' },
    { id: 'office-desk-seat', model: 'loungeSofaOttoman', at: [5.4, 4.95] },
    { id: 'office-desk-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@5,4', against: { wall: 'west-east-wings', side: 'E', at: 5.75 }, facing: 'E' },
    { id: 'office-chair-north', model: 'loungeChair', logic: 'chair@4,7', at: [7.55, 4.42], facing: 'S' },
    { id: 'office-clock', model: 'speaker', logic: 'clock@6,7', against: { wall: 'east', at: 6.6 }, facing: 'W' },
    { id: 'office-greta-chair', model: 'loungeChair', logic: 'chair@7,5', at: [5.45, 7.62], facing: 'N' },
    { id: 'office-side-table', model: 'sideTable', at: [4.6, 7.72], facing: 'N' },
    { id: 'office-side-table-books', model: 'books', on: { parent: 'office-side-table' } },
  ],
}
