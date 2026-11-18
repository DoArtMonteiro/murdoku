import type { SceneSpec } from '../schema'
import { twoSetsOfPrintsStairwellBounds } from './two-sets-of-prints-ground'

const well = twoSetsOfPrintsStairwellBounds

// A escada chega a um corredor transversal: a norte o escritório e a sala de estar,
// a sul o quarto (com recanto de secretária atrás da escada); a nascente, portas
// separadas para a casa de banho e para a sala de refeições.
export const twoSetsOfPrintsUpper: SceneSpec = {
  puzzleId: 'master-6',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[0], well[1] - 0.76, well[2], well[1]],
    halls: [
      { id: 'cross-corridor', bounds: [well[0], 3.4, 4.95, well[1]] },
      { id: 'dining-stub', bounds: [4.15, well[1], 4.95, 5.05] },
    ],
    roomAccessTargets: [
      { id: 'sitting-entry', bounds: [3.15, 3.4, 3.85, 4.2] },
      { id: 'bedroom-entry', bounds: [2.65, 3.4, 3.35, 4.2] },
      { id: 'bathroom-entry', bounds: [4.3, 3.4, 4.95, 4.2] },
      { id: 'dining-entry', bounds: [4.15, 4.3, 4.95, 5.05] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 6.6, kind: 'window' },
    { wall: 'west', at: 7.4, kind: 'window' },
  ] },
  floors: [
    { id: 'study', cells: [0, 0, 1, 7], material: 'wood' },
    { id: 'bedroom', cells: [2, 0, 4, 7], material: 'wood' },
    { id: 'bathroom', cells: [5, 0, 7, 3], material: 'tile' },
    { id: 'dining-room', cells: [5, 4, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'study-sitting', from: [2, 0], to: [2, 3.35], height: 'half' },
    { id: 'sitting-south', from: [2, 3.35], to: [5, 3.35], height: 'half', openings: [{ at: 3.5, width: 0.7, kind: 'door' }] },
    { id: 'bedroom-north', from: [well[2] + 0.06, 4.25], to: [4.1, 4.25], height: 'half', openings: [{ at: 3.0, width: 0.7, kind: 'door' }] },
    { id: 'stub-west', from: [4.1, 4.25], to: [4.1, 5.1], height: 'half' },
    { id: 'stub-south', from: [4.1, 5.1], to: [5, 5.1], height: 'half' },
    { id: 'bedroom-east-suite', from: [5, 0], to: [5, 8], height: 'half', openings: [
      { at: 3.78, width: 0.6, kind: 'door' },
      { at: 4.65, width: 0.6, kind: 'door' },
    ] },
    { id: 'bathroom-dining', from: [5, 4], to: [8, 4] },
    { id: 'stairwell-west-guard', from: [well[0], well[1] + 0.12], to: [well[0], well[3] + 0.06], height: 'half', treatment: 'railing', freeEnds: ['from'] },
    { id: 'stairwell-east-guard', from: [well[2] + 0.06, 4.25], to: [well[2] + 0.06, well[3] + 0.06], height: 'half', treatment: 'railing' },
    { id: 'stairwell-south-guard', from: [well[0], well[3] + 0.06], to: [well[2] + 0.06, well[3] + 0.06], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Escritório norte: secretária do Tomas na parede poente, estante baixa, caixa e candeeiro.
    { id: 'study-desk-tomas', model: 'desk', logic: 'desk@2,0', against: { wall: 'west', at: 2.5 }, facing: 'E' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk-tomas' } },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@1,1', at: [1.5, 1.25] },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@2,1', against: { wall: 'study-sitting', side: 'W', at: 2.5 }, facing: 'W' },
    { id: 'study-lamp-north', model: 'lampRoundFloor', at: [0.3, 0.3] },
    // Sala de estar: sofá sob a janela sobre o tapete, televisor em frente, rádio e candeeiro.
    { id: 'bedroom-rug', model: 'rugSquare', logic: 'rug@0,2', at: [3, 1], facing: 'E' },
    { id: 'sitting-sofa', model: 'loungeSofa', against: { wall: 'north', at: 3.0 } },
    { id: 'sitting-tv', model: 'cabinetTelevision', at: [3.0, 2.3], facing: 'N' },
    { id: 'sitting-tv-set', model: 'televisionModern', on: { parent: 'sitting-tv' } },
    { id: 'bedroom-clock-table-north', model: 'sideTable', at: [4.5, 1.5], facing: 'E' },
    { id: 'bedroom-clock-north', model: 'radio', logic: 'clock@1,4', on: { parent: 'bedroom-clock-table-north' } },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@3,4', at: [4.6, 3.1] },
    // Quarto: cama com a cabeceira na parede sul, mesa de cabeceira, tapete, candeeiros;
    // recanto de secretária atrás da escada com a caixa e o candeeiro.
    { id: 'bedroom-lamp-west', model: 'lampRoundFloor', logic: 'lamp@4,2', at: [2.25, 4.75] },
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@6,2', against: { wall: 'south', at: 3.3 }, facing: 'N' },
    { id: 'bedroom-nightstand', model: 'sideTable', at: [2.35, 7.7], facing: 'N' },
    { id: 'study-desk-bella', model: 'desk', logic: 'desk@6,0', at: [0.5, 6.85], facing: 'S' },
    { id: 'study-box-priya', model: 'cardboardBoxClosed', logic: 'box@6,1', at: [1.65, 6.6] },
    { id: 'study-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,0', at: [0.3, 7.7] },
    // Casa de banho: banheira na parede poente, lavatório e móvel a norte, dois duches e sanita.
    { id: 'bathroom-bathtub', model: 'bathtub', against: { wall: 'bedroom-east-suite', side: 'E', at: 1.6 }, facing: 'E' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 6.3 }, facing: 'S' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'north', at: 6.85 }, facing: 'S' },
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@0,7', at: [7.55, 0.45], facing: 'S' },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@3,5', at: [5.4, 3.12], facing: 'S' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@3,7', against: { wall: 'east', at: 3.3 }, facing: 'W' },
    // Sala de refeições: aparador baixo (a mesa lógica) na parede da casa de banho, com
    // candeeiro; mesa de jantar de madeira sobre um tapete, com a cadeira (lógica) na cabeceira
    // nascente. `chair` é vocabulário de pista: não há outros assentos nem sofás nesta divisão.
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', logic: 'table@4,5', against: { wall: 'bathroom-dining', side: 'S', at: 6.3 }, facing: 'S' },
    { id: 'dining-sideboard-east', model: 'cabinetTelevisionDoors', against: { wall: 'bathroom-dining', side: 'S', at: 7.3 }, facing: 'S' },
    { id: 'dining-sideboard-lamp', model: 'lampSquareTable', on: { parent: 'dining-sideboard-east', offset: [0.2, 0] } },
    { id: 'dining-sideboard-radio', model: 'radio', on: { parent: 'dining-sideboard', offset: [-0.1, 0] } },
    { id: 'dining-table', model: 'table', at: [6.42, 6.5], facing: 'N' },
    { id: 'dining-centrepiece', model: 'plantSmall1', on: { parent: 'dining-table' } },
    { id: 'dining-chair', model: 'chair', logic: 'chair@6,7', at: [7.17, 6.5], facing: 'W' },
  ],
  rugs: [
    { id: 'bedroom-bed-rug', model: 'rugRectangle', at: [3.3, 6.4] },
    { id: 'dining-rug', model: 'rugRectangle', at: [6.5, 6.5] },
  ],
}
