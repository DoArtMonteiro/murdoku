import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [4.3, 4.65]
const halfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const halfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
const well: [number, number, number, number] = [
  stairAt[0] - halfWidth,
  stairAt[1] - halfRun,
  stairAt[0] + halfWidth,
  stairAt[1] + halfRun,
]

// A escada chega a norte do escritório. Um corredor encostado ao quarto liga o
// patamar à porta do quarto e ao escritório a sul, que dá acesso à sala de
// trabalho com casa de banho privativa; a casa de banho principal abre do patamar.
export const theLastGuestUpper: SceneSpec = {
  puzzleId: 'master-3',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [3.8, 2.65, well[2], well[1]],
    halls: [
      { id: 'landing-west-run', bounds: [2.05, 2.65, well[2], 3.45] },
      { id: 'corridor-north', bounds: [2.05, 2.65, 3.05, 4.05] },
      { id: 'corridor-clock', bounds: [2.24, 3.9, 3.05, 4.7] },
      { id: 'corridor-south', bounds: [2.05, 4.5, 3.05, 6.6] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-door', bounds: [2.05, 3.25, 2.9, 3.95] },
      { id: 'study-door', bounds: [2.05, 5.9, 3.05, 6.6] },
      { id: 'bathroom-door', bounds: [4.0, 2.9, 4.95, 3.45] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.0, kind: 'window' },
      { wall: 'north', at: 4.1, kind: 'window' },
      { wall: 'north', at: 6.3, kind: 'window' },
      { wall: 'west', at: 4.0, kind: 'window' },
    ],
  },
  floors: [
    { id: 'bedroom-wood', cells: [0, 0, 2, 7], material: 'wood' },
    { id: 'study-wood', cells: [3, 0, 4, 7], material: 'wood' },
    { id: 'bathroom-tile', cells: [5, 0, 7, 4], material: 'tile' },
    { id: 'office-wood', cells: [5, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'corridor-north-wall', from: [2, 2.6], to: [3.1, 2.6], height: 'half' },
    { id: 'bedroom-corridor', from: [2, 2.6], to: [2, 6.95], height: 'half', openings: [
      { at: 3.6, width: 0.7, kind: 'door' },
    ] },
    { id: 'corridor-south-wall', from: [2, 6.95], to: [3.1, 6.95], height: 'half' },
    { id: 'bedroom-study', from: [3.1, 0], to: [3.1, 8], height: 'half', openings: [
      { at: 3.05, width: 0.8, kind: 'door' },
      { at: 6.25, width: 0.7, kind: 'door' },
    ] },
    { id: 'study-east', from: [5, 0], to: [5, 8], height: 'half', openings: [
      { at: 3.3, width: 0.7, kind: 'door' },
      { at: 6.6, width: 0.7, kind: 'door' },
    ] },
    { id: 'bath-ensuite', from: [5, 3.95], to: [8, 3.95], height: 'half' },
    { id: 'bathroom-office', from: [5, 5], to: [8, 5], height: 'half', openings: [
      { at: 5.85, width: 0.6, kind: 'door' },
    ] },
    { id: 'stairwell-west-guard', from: [well[0] - 0.1, well[1]], to: [well[0] - 0.1, well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [well[2] + 0.1, well[1]], to: [well[2] + 0.1, well[3]], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-south-guard', from: [well[0] - 0.1, well[3]], to: [well[2] + 0.1, well[3]], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Quarto: cama na parede poente com mesa de cabeceira; a sul, sofá entre os dois
    // candeeiros de pé com mesa baixa, e roupeiro.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@2,0', against: { wall: 'west', at: 2.5 }, facing: 'E' },
    { id: 'bedroom-nightstand', model: 'tableCoffeeSquare', at: [0.32, 1.6] },
    { id: 'bedroom-lamp-northwest', model: 'lampRoundFloor', logic: 'lamp@5,0', at: [0.25, 5.1] },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'west', at: 5.85 } },
    { id: 'bedroom-sofa-table', model: 'tableCoffee', at: [1.0, 5.85], facing: 'E' },
    { id: 'bedroom-lamp-southwest', model: 'lampRoundFloor', logic: 'lamp@6,0', at: [0.25, 6.6] },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'west', at: 7.45 } },
    // Corredor: rádio na consola do topo sul e coluna de som junto à parede do quarto.
    { id: 'bedroom-clock-table', model: 'sideTable', against: { wall: 'corridor-south-wall', side: 'N', at: 2.5 }, facing: 'N' },
    { id: 'bedroom-clock', model: 'radio', logic: 'clock@6,2', on: { parent: 'bedroom-clock-table' } },
    { id: 'bedroom-south-clock', model: 'speaker', logic: 'clock@4,2', at: [2.14, 4.2] },
    // Canto de leitura a norte do patamar: estante, sofá e a caixa.
    { id: 'study-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@1,3', against: { wall: 'bedroom-study', side: 'E', at: 1.6 }, facing: 'E' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@2,4', at: [4.25, 2.3] },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'study-east', side: 'W', at: 1.3 }, facing: 'W' },
    // Escritório a sul do vão: secretária no nicho junto à escada.
    { id: 'study-desk', model: 'desk', logic: 'desk@5,3', against: { wall: 'bedroom-study', side: 'E', at: 5.45 }, facing: 'E' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    // Casa de banho principal: duche, lavatório e sanita a norte, banheira a poente, móvel e máquina a nascente.
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@0,5', at: [5.4, 0.4], facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 6.5 }, facing: 'S' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@0,7', against: { wall: 'north', at: 7.5 } },
    { id: 'bathroom-alcove-tub', model: 'bathtub', logic: 'bathtub@2,5', against: { wall: 'study-east', side: 'E', at: 2.2 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'east', at: 2.0 }, facing: 'W' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'east', at: 3.4 }, facing: 'W' },
    // Casa de banho privativa da sala de trabalho: sanita e banheira.
    { id: 'ensuite-toilet', model: 'toilet', at: [5.25, 4.3], facing: 'S' },
    { id: 'bathroom-second-tub', model: 'bathtub', logic: 'bathtub@4,6', against: { wall: 'bath-ensuite', side: 'S', at: 7.0 }, facing: 'S' },
    // Sala de trabalho: secretária com cadeira, cadeira de visita, mesa com rádio e
    // arquivo baixo com planta na parede nascente (sem cama: é um escritório).
    { id: 'office-desk', model: 'desk', logic: 'desk@7,7', against: { wall: 'south', at: 7.5 }, facing: 'N' },
    { id: 'office-desk-chair', model: 'chairDesk', at: [7.5, 7.05], facing: 'S' },
    { id: 'office-chair', model: 'chair', logic: 'chair@6,5', at: [5.75, 6.85], facing: 'E' },
    { id: 'office-clock-table', model: 'sideTable', against: { wall: 'south', at: 5.6 }, facing: 'N' },
    { id: 'office-clock', model: 'radio', logic: 'clock@7,5', on: { parent: 'office-clock-table' } },
    { id: 'office-files', model: 'bookcaseOpenLow', against: { wall: 'east', at: 5.6 }, facing: 'W' },
    { id: 'office-files-b', model: 'bookcaseOpenLow', against: { wall: 'east', at: 6.15 }, facing: 'W' },
    { id: 'office-files-plant', model: 'plantSmall2', on: { parent: 'office-files' } },
  ],
}
