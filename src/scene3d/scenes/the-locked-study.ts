import type { SceneSpec } from '../schema'

// Casa formal com jardim da frente exterior e uma alcova de estudo na sala de jantar.
export const theLockedStudy: SceneSpec = {
  puzzleId: 'very-easy-6',
  floor: 0,
  entry: { wall: 'north', at: 5.45 },
  shell: {
    features: [
      { wall: 'north', at: 4.7, kind: 'window' },
      { wall: 'west', at: 4.55, kind: 'window' },
    ],
  },
  floors: [
    { id: 'front-yard', cells: [0, 0, 2, 3], material: 'grass', kind: 'exterior' },
    { id: 'dining-study', cells: [3, 0, 5, 5], material: 'wood', kind: 'interior' },
    { id: 'pantry', cells: [0, 4, 2, 5], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'courtyard-dining', from: [3, 0], to: [3, 4], height: 'half', openings: [{ at: 2.4, width: 1.2, kind: 'open' }] },
    { id: 'courtyard-pantry', from: [0, 4], to: [3, 4], height: 'half', openings: [{ at: 2.45, width: 1.0, kind: 'open' }] },
    { id: 'pantry-dining', from: [3, 4], to: [3, 6], openings: [{ at: 5.0, kind: 'door' }] },
  ],
  furniture: [
    // Alcova de estudo no extremo norte da sala de jantar: cadeira encaixada na secretária.
    { id: 'study-desk', model: 'desk', against: { wall: 'north', at: 3.9 } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', logic: 'chair@1,3', at: [3.85, 1.1], facing: 'N' },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', against: { wall: 'east', at: 1.4 }, facing: 'W' },
    { id: 'study-books', model: 'books', on: { parent: 'study-bookcase', surface: 'top' } },
    // Sala de jantar: mesa com toalha e cadeira à cabeceira, consola com candeeiro e aparador
    // na parede este; o candeeiro de pé marca o canto de Idris.
    { id: 'dining-table', model: 'tableCloth', at: [4.45, 3.45], facing: 'N' },
    { id: 'dining-chair-east', model: 'chair', logic: 'chair@3,5', at: [5.3, 3.45], facing: 'W' },
    { id: 'reading-table', model: 'sideTable', logic: 'lamp@2,5', against: { wall: 'east', at: 2.4 } },
    { id: 'reading-lamp', model: 'lampRoundTable', logic: 'lamp@2,5', on: { parent: 'reading-table' } },
    { id: 'buffet-lamp', model: 'lampRoundFloor', logic: 'lamp@4,5', at: [5.78, 4.22] },
    { id: 'buffet', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 5.4 } },
    { id: 'buffet-radio', model: 'radio', on: { parent: 'buffet' } },
    // Despensa: bancada contra a meia parede do pátio, frigorífico na parede oeste, caixas de reserva.
    { id: 'pantry-counter-a', model: 'kitchenCabinet', logic: 'counter@4,0', against: { wall: 'courtyard-pantry', side: 'S', at: 0.4 } },
    { id: 'pantry-sink', model: 'kitchenSink', logic: 'counter@4,0', against: { wall: 'courtyard-pantry', side: 'S', at: 1.0 } },
    { id: 'pantry-counter-b', model: 'kitchenCabinetDrawer', logic: 'counter@4,0', against: { wall: 'courtyard-pantry', side: 'S', at: 1.6 } },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter-b' } },
    { id: 'pantry-fridge', model: 'kitchenFridge', against: { wall: 'west', at: 5.4 } },
    { id: 'pantry-box', model: 'cardboardBoxClosed', at: [1.75, 5.7], yaw: 10 },
    { id: 'pantry-box-open', model: 'cardboardBoxOpen', at: [2.2, 5.72] },
    // Vegetação em grupos, fora da faixa de circulação.
    { id: 'courtyard-plant', model: 'pottedPlant', logic: 'plant@0,1', at: [1.72, 0.32] },
    { id: 'courtyard-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@2,0', at: [0.55, 2.65], yaw: 12 },
    { id: 'courtyard-shrub-east', model: 'plant_bushLarge', logic: 'shrub@1,2', at: [2.3, 1.4], yaw: -10 },
    { id: 'courtyard-stump', model: 'stump_round', at: [0.45, 3.55] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [5.45, 0.3] },
    { id: 'courtyard-path-a', model: 'path_stone', at: [1.5, 2.35], facing: 'E' },
    { id: 'courtyard-path-b', model: 'path_stone', at: [2.25, 3.2], facing: 'S' },
    { id: 'dining-rug', model: 'rugRectangle', at: [4.5, 3.45] },
    { id: 'study-rug', model: 'rugSquare', at: [4.2, 1.0] },
  ],
}
