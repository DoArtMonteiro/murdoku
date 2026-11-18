import type { SceneSpec } from '../schema'
import { shadowsAtTheDoorStairwellBounds } from './shadows-at-the-door-ground'

const well = shadowsAtTheDoorStairwellBounds
const guardOffset = 0.065

export const shadowsAtTheDoorUpper: SceneSpec = {
  puzzleId: 'master-2',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  // A escada chega ao escritório pelo sul; a galeria leva à porta do corredor, que
  // serve o quarto e as duas casas de banho, cada uma com a sua banheira em nicho.
  circulation: {
    landing: [well[0], well[3], well[2], well[3] + 0.83],
    halls: [
      { id: 'study-south-gallery', bounds: [1.1, well[3] + 0.07, 3.2, 7.93] },
      { id: 'study-east-gallery', bounds: [2.35, 5.8, 3.2, 7.93] },
      { id: 'study-hall-entry', bounds: [2.35, 5.8, 4.1, 6.8] },
      { id: 'hallway-south-lane', bounds: [4.05, 4.1, 4.95, 7.95] },
      { id: 'hallway-north-lane', bounds: [4.95, 1.2, 5.95, 5.0] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-entry', bounds: [4.05, 2.9, 4.95, 3.7] },
      { id: 'study-entry', bounds: [3.5, 5.85, 4.8, 6.8] },
      { id: 'bathroom-entry', bounds: [5.2, 1.3, 5.95, 2.3] },
      { id: 'bathroom-south-entry', bounds: [4.5, 5.85, 5.95, 6.75] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.5, kind: 'window' },
    { wall: 'north', at: 7, kind: 'window' },
    { wall: 'west', at: 2.0, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [0, 0, 3, 3], material: 'wood', kind: 'interior' },
    { id: 'study-floor', cells: [0, 4, 3, 7], material: 'wood', kind: 'interior' },
    { id: 'hallway-floor', cells: [4, 0, 5, 7], material: 'wood', kind: 'interior' },
    { id: 'bathroom-floor', cells: [6, 0, 7, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'bedroom-study-partition', from: [0, 4], to: [4, 4], height: 'half' },
    { id: 'bedroom-hallway-partition', from: [4, 0], to: [4, 4], height: 'half', openings: [{ at: 3.3, width: 0.8, kind: 'door' }] },
    { id: 'study-hallway-partition', from: [4, 4], to: [4, 8], height: 'half', openings: [{ at: 6.3, width: 1.2, kind: 'door' }] },
    { id: 'hallway-bathroom-partition', from: [6, 0], to: [6, 8], height: 'half', openings: [{ at: 1.8, width: 1, kind: 'door' }, { at: 6.3, width: 1, kind: 'door' }] },
    // Duas casas de banho: cada banheira fica num nicho próprio, separadas por uma meia parede.
    { id: 'bath-north-south-wall', from: [6, 3], to: [7, 3], height: 'half' },
    { id: 'bath-tub-divider', from: [7, 3], to: [7, 5], height: 'half' },
    { id: 'bath-south-north-wall', from: [7, 5], to: [8, 5], height: 'half' },
    { id: 'stairwell-west-guard', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[0] - guardOffset, well[3]], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east-guard', from: [well[2] + guardOffset, well[1] - guardOffset], to: [well[2] + guardOffset, well[3]], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[2] + guardOffset, well[1] - guardOffset], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Quarto: cama de cabeceira na parede do corredor entre o candeeiro e a coluna de som,
    // roupeiro a poente, cómoda baixa com rádio e poltrona de leitura.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'bedroom-hallway-partition', side: 'W', at: 1.3 }, facing: 'W' },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@0,3', at: [3.75, 0.35] },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@2,3', at: [3.75, 2.25] },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'west', at: 1.0 } },
    { id: 'bedroom-dresser', model: 'bookcaseOpenLow', against: { wall: 'bedroom-study-partition', side: 'N', at: 1.5 }, facing: 'N' },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@3,1', on: { parent: 'bedroom-dresser', surface: 'top' } },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [0.45, 3.4], facing: 'E' },
    // Escritório: secretária na parede sul com a cadeira, estantes na parede poente,
    // canto de leitura com sofá e mesa baixa junto à meia parede do quarto.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@4,0', at: [0.35, 4.35], facing: 'S' },
    { id: 'study-desk', model: 'desk', logic: 'desk@7,0', against: { wall: 'south', at: 0.5 }, facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [0.5, 7.05], facing: 'S' },
    { id: 'study-bookcase-a', model: 'bookcaseClosed', against: { wall: 'west', at: 5.3 } },
    { id: 'study-bookcase-b', model: 'bookcaseOpen', against: { wall: 'west', at: 5.85 } },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'bedroom-study-partition', side: 'S', at: 3.0 }, facing: 'S' },
    { id: 'study-coffee-table', model: 'tableCoffee', at: [3.0, 5.2] },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@7,3', at: [3.75, 7.25], facing: 'S' },
    // Corredor: passadeira e consola baixa a norte, plantas e coluna junto às paredes.
    { id: 'hallway-rug', model: 'rugRectangle', logic: 'rug@0,4', at: [5, 0.8], facing: 'S' },
    { id: 'hallway-console', model: 'bookcaseOpenLow', against: { wall: 'north', at: 4.7 } },
    { id: 'hallway-console-plant', model: 'plantSmall1', on: { parent: 'hallway-console' } },
    { id: 'hallway-clock', model: 'speaker', logic: 'clock@5,5', at: [5.8, 5.2], facing: 'S' },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@3,4', at: [4.3, 3.85], facing: 'S' },
    { id: 'hallway-south-plant', model: 'pottedPlant', logic: 'plant@7,5', at: [5.6, 7.55], facing: 'S' },
    // Casa de banho norte: sanita, duche, lavatório e móvel; banheira no nicho a sul.
    { id: 'bathroom-toilet-north', model: 'toilet', logic: 'toilet@0,7', against: { wall: 'north', at: 7.5 } },
    { id: 'bathroom-shower-north', model: 'showerRound', logic: 'shower@1,7', at: [7.6, 1.55], facing: 'S' },
    { id: 'bathroom-sink-north', model: 'bathroomSink', against: { wall: 'hallway-bathroom-partition', side: 'E', at: 0.45 }, facing: 'E' },
    { id: 'bathroom-cabinet-north', model: 'bathroomCabinetDrawer', against: { wall: 'hallway-bathroom-partition', side: 'E', at: 0.95 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'bath-north-south-wall', side: 'N', at: 6.5 }, facing: 'N' },
    { id: 'bathroom-bathtub-east', model: 'bathtub', logic: 'bathtub@3,7', against: { wall: 'east', at: 4.0 }, facing: 'W' },
    // Casa de banho sul: banheira no nicho a norte, sanita, móvel, lavatório e duche.
    { id: 'bathroom-bathtub-west', model: 'bathtub', logic: 'bathtub@3,6', against: { wall: 'hallway-bathroom-partition', side: 'E', at: 4.0 }, facing: 'E' },
    { id: 'bathroom-toilet-clue', model: 'toilet', logic: 'toilet@5,7', against: { wall: 'east', at: 5.5 }, facing: 'W' },
    { id: 'bathroom-cabinet-south', model: 'bathroomCabinetDrawer', against: { wall: 'east', at: 6.35 }, facing: 'W' },
    { id: 'bathroom-shower-south', model: 'showerRound', logic: 'shower@7,7', at: [7.6, 7.55], facing: 'S' },
    { id: 'bathroom-sink-south', model: 'bathroomSink', against: { wall: 'south', at: 6.6 }, facing: 'N' },
  ],
  rugs: [
    { id: 'bedroom-rug', model: 'rugSquare', at: [2.9, 1.3] },
    { id: 'study-rug', model: 'rugRound', at: [3.0, 5.0] },
    { id: 'bath-north-mat', model: 'rugDoormat', at: [6.6, 1.8], facing: 'E' },
    { id: 'bath-south-mat', model: 'rugDoormat', at: [6.6, 6.3], facing: 'E' },
  ],
}
