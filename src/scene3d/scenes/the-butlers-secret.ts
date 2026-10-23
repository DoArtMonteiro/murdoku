import type { SceneSpec } from '../schema'

// Casa de serviço organizada em torno de um jardim murado e um pátio de chegada.
export const theButlersSecret: SceneSpec = {
  puzzleId: 'medium-6',
  floor: 0,
  entry: { wall: 'north', at: 6.5 },
  shell: {
    features: [
      { wall: 'north', at: 4.9, kind: 'window' },
      { wall: 'west', at: 5.5, kind: 'window' },
    ],
  },
  floors: [
    { id: 'walled-garden', cells: [0, 0, 3, 2], material: 'grass', kind: 'courtyard' },
    { id: 'service-office', cells: [4, 0, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'dining-room', cells: [0, 3, 3, 7], material: 'wood', kind: 'interior' },
    { id: 'arrival-court', cells: [4, 5, 7, 7], material: 'stone', kind: 'exterior' },
  ],
  walls: [
    { id: 'garden-office', from: [4, 0], to: [4, 3], height: 'half', openings: [{ at: 2.35, width: 1.0, kind: 'door' }] },
    { id: 'garden-dining', from: [0, 3], to: [4, 3], height: 'half', openings: [{ at: 3.5, width: 1.0, kind: 'open' }] },
    { id: 'office-court', from: [4, 5], to: [8, 5], height: 'half', openings: [{ at: 7.5, width: 1.0, kind: 'door' }] },
    { id: 'dining-court', from: [4, 3], to: [4, 8], height: 'half', openings: [{ at: 5.2, width: 1.0, kind: 'open' }] },
  ],
  furniture: [
    // Jardim murado: canteiros e caminho de lajes entre o escritório e a sala de jantar.
    { id: 'garden-shrub', model: 'plant_bushSmall', logic: 'shrub@0,1', at: [1.5, 0.45] },
    { id: 'garden-plant-west', model: 'flower_yellowA', logic: 'plant@1,0', at: [0.45, 1.5] },
    { id: 'garden-plant-south', model: 'flower_purpleA', logic: 'plant@2,2', at: [2.4, 2.4] },
    { id: 'court-plant-north', model: 'flower_yellowA', logic: 'plant@0,2', at: [2.6, 0.4] },
    { id: 'garden-rock', model: 'rock_smallA', at: [0.6, 0.5] },
    { id: 'garden-stump', model: 'stump_round', at: [1.3, 2.5] },
    // Escritório: zona de receção junto à entrada (sofá, mesa baixa, aparador com arquivo) e posto de trabalho
    // a sul: secretária na divisória com a cadeira, relógio de pé e estantes baixas na parede este.
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'garden-office', at: 0.85, side: 'E' }, facing: 'E' },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [5.25, 0.85], facing: 'E' },
    { id: 'office-credenza', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 1.2 }, facing: 'W' },
    { id: 'office-credenza-speaker', model: 'speakerSmall', on: { parent: 'office-credenza' } },
    { id: 'office-coffee-books', model: 'books', on: { parent: 'office-coffee-table' } },
    { id: 'office-desk', model: 'desk', logic: 'desk@3,4', against: { wall: 'dining-court', at: 3.9, side: 'E' }, facing: 'E' },
    { id: 'office-desk-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@4,4', at: [4.78, 4.25], facing: 'W' },
    { id: 'office-clock', model: 'speaker', logic: 'clock@4,5', against: { wall: 'office-court', at: 5.6, side: 'N' } },
    // Estante lógica 1×2: estante alta virada a sul (frente legível pela câmara) e estante baixa
    // à frente, ambas na coluna 8, linhas 4–5. Encostadas à parede este mostrariam o tardoz.
    { id: 'office-bookshelf', model: 'bookcaseOpen', logic: 'bookshelf@3,7', at: [7.5, 3.3], facing: 'S' },
    { id: 'office-bookshelf-b', model: 'bookcaseOpenLow', logic: 'bookshelf@3,7', at: [7.5, 3.95], facing: 'S' },
    { id: 'office-bookshelf-books', model: 'books', on: { parent: 'office-bookshelf', surface: 'shelf2' } },
    { id: 'office-bookshelf-books-top', model: 'books', on: { parent: 'office-bookshelf', surface: 'top' } },
    { id: 'office-bookshelf-books-b', model: 'books', on: { parent: 'office-bookshelf-b' } },
    { id: 'office-filing', model: 'kitchenCabinetDrawer', against: { wall: 'office-court', at: 6.4, side: 'N' } },
    { id: 'office-filing-radio', model: 'radio', on: { parent: 'office-filing' } },
    // Sala de jantar: mesa sob a janela oeste com a cadeira, aparador; a sul um canto de estar
    // com sofá, mesa baixa e os dois candeeiros de pé.
    { id: 'dining-chair', model: 'chair', logic: 'chair@4,0', at: [0.75, 4.9], facing: 'S' },
    { id: 'dining-table', model: 'tableCloth', logic: 'table@5,0', at: [1.0, 5.5] },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 7.0 }, facing: 'E' },
    { id: 'dining-lamp-north', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.7, 4.3] },
    { id: 'dining-sofa', model: 'loungeSofa', against: { wall: 'south', at: 2.6 }, facing: 'N' },
    { id: 'dining-coffee-table', model: 'tableCoffee', at: [2.6, 6.75] },
    { id: 'dining-lamp-south', model: 'lampRoundFloor', logic: 'lamp@6,3', at: [3.55, 6.45] },
    // Pátio de chegada.
    { id: 'court-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@5,6', at: [6.2, 5.6] },
    { id: 'court-plant-south-west', model: 'flower_redA', logic: 'plant@6,4', at: [4.5, 6.5] },
    { id: 'court-shrub-south-east', model: 'plant_bushSmall', logic: 'shrub@7,7', at: [7.5, 7.5] },
    { id: 'court-rock', model: 'rock_smallB', at: [5.2, 7.5] },
  ],
  rugs: [
    { id: 'office-rug', model: 'rugRectangle', at: [5.9, 1.0] },
    { id: 'dining-rug', model: 'rugRectangle', at: [1.05, 5.6] },
    { id: 'dining-lounge-rug', model: 'rugSquare', at: [2.6, 6.8] },
    { id: 'garden-path-a', model: 'path_stone', at: [3.4, 2.35] },
    { id: 'court-path-a', model: 'path_stone', at: [7.3, 5.75] },
    { id: 'court-path-b', model: 'path_stone', at: [6.9, 6.6] },
    { id: 'court-path-c', model: 'path_stone', at: [5.6, 6.6] },
  ],
}
