import type { SceneSpec } from '../schema'

// A linear residence opens from the entry hall through dining and office to
// the true exterior front yard. The upper service wing is carried over that
// yard by three measured post-and-beam bays.
export const nothingWasTakenGround: SceneSpec = {
  puzzleId: 'hard-12',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 7 },
  shell: { features: [
    { wall: 'north', at: 1.5, kind: 'window' },
    { wall: 'north', at: 4.2, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [6.4, 2], facing: 'N' },
  exteriorSupportBays: [
    { id: 'front-yard-west', cells: [0, 6, 2, 7] },
    { id: 'front-yard-middle', cells: [3, 6, 5, 7] },
    { id: 'front-yard-east', cells: [6, 6, 7, 7] },
  ],
  floors: [
    { id: 'hallway-floor', cells: [0, 0, 7, 1], material: 'stone' },
    { id: 'dining-room-floor', cells: [0, 2, 7, 3], material: 'wood' },
    { id: 'office-floor', cells: [0, 4, 7, 5], material: 'wood' },
    { id: 'front-yard-ground', cells: [0, 6, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'dining-office', from: [0, 4], to: [8, 4], openings: [{ at: 6.2, width: 1.2, kind: 'door' }] },
    { id: 'front-yard-facade', from: [0, 6], to: [8, 6], height: 'half', openings: [{ at: 6.5, width: 1, kind: 'door' }] },
  ],
  furniture: [
    // Átrio: consola com livros sob a janela, plantas, relógio e tapete junto à escada.
    { id: 'hall-console', model: 'desk', against: { wall: 'north', at: 1.4 } },
    { id: 'hall-console-books', model: 'books', on: { parent: 'hall-console' } },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@0,2', at: [2.5, 0.3] },
    { id: 'hall-plant-west', model: 'pottedPlant', logic: 'plant@1,0', at: [0.35, 1.6] },
    { id: 'hall-plant-centre', model: 'pottedPlant', logic: 'plant@1,3', at: [3.5, 1.6] },
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@0,4', at: [5, 1], facing: 'S' },
    // Sala de jantar: mesa com cadeira à cabeceira e banco estofado, candeeiro de pé e
    // poltrona de leitura no canto nascente, ao pé da escada.
    { id: 'dining-chair-west', model: 'chair', logic: 'chair@2,1', at: [1.95, 2.5], facing: 'E' },
    { id: 'dining-table', model: 'table', logic: 'table@2,2', at: [3.0, 2.5], facing: 'S' },
    { id: 'dining-banquette', model: 'loungeSofa', at: [3.0, 3.3], facing: 'N' },
    { id: 'dining-lamp-east', model: 'lampRoundFloor', logic: 'lamp@3,5', at: [5.3, 3.3] },
    { id: 'dining-chair-east', model: 'loungeChair', logic: 'chair@3,7', at: [7.55, 3.45], facing: 'W' },
    { id: 'dining-rug', model: 'rugRectangle', at: [3.0, 2.75] },
    // Escritório: secretária e cadeira na parede poente, segunda secretária encostada à
    // parede da sala, estantes baixas, sofá e caixas de arquivo.
    { id: 'office-desk', model: 'desk', logic: 'desk@4,0', against: { wall: 'west', at: 4.7 } },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' }, facing: 'E' },
    { id: 'office-chair', model: 'chair', logic: 'chair@5,0', at: [0.85, 5.1], facing: 'W' },
    { id: 'office-clock', model: 'speaker', logic: 'clock@4,2', at: [2.5, 4.3] },
    { id: 'office-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@5,3', at: [3.25, 5.45], facing: 'E' },
    { id: 'office-bookshelf-books', model: 'books', on: { parent: 'office-bookshelf' } },
    { id: 'office-bookshelf-east', model: 'bookcaseOpenLow', logic: 'bookshelf@5,3', at: [4.4, 5.45], facing: 'E' },
    { id: 'office-bookshelf-east-books', model: 'books', on: { parent: 'office-bookshelf-east' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'dining-office', side: 'S', at: 4.4 } },
    { id: 'office-desk-east', model: 'desk', against: { wall: 'east', at: 4.9 }, facing: 'W' },
    { id: 'office-boxes', model: 'cardboardBoxClosed', at: [7.78, 5.75] },
    { id: 'office-box-open', model: 'cardboardBoxOpen', at: [7.3, 5.72] },
    // Jardim da frente: arbustos, flor, caminho de pedra até à porta, pedras e um cepo.
    { id: 'front-yard-shrub-west', model: 'plant_bushSmall', logic: 'shrub@6,0', at: [0.6, 6.6] },
    { id: 'front-yard-shrub-centre', model: 'plant_bushSmall', logic: 'shrub@6,5', at: [5.45, 6.6] },
    { id: 'front-yard-shrub-east', model: 'plant_bushSmall', logic: 'shrub@6,7', at: [7.5, 6.6] },
    { id: 'front-yard-flower', model: 'flower_yellowA', logic: 'plant@7,4', at: [4.6, 7.6] },
    { id: 'front-yard-rock', model: 'rock_smallA', at: [2.2, 7.3] },
    { id: 'front-yard-stump', model: 'stump_round', at: [1.6, 6.6] },
    { id: 'front-yard-log', model: 'log', at: [3.4, 6.7] },
  ],
  rugs: [
    { id: 'office-rug', model: 'rugRound', at: [1.9, 5.0] },
    { id: 'yard-path-door', model: 'path_stone', at: [6.5, 6.5], facing: 'E' },
    { id: 'yard-path-south', model: 'path_stoneCircle', at: [6.5, 7.4] },
  ],
}
