import type { SceneSpec } from '../schema'

// Moradia de receção com sala de jantar central, escritório e jardim de entrada.
export const aToastToMurder: SceneSpec = {
  puzzleId: 'medium-1',
  floor: 0,
  entry: { wall: 'north', at: 7.0 },
  shell: {
    features: [
      { wall: 'north', at: 1.0, kind: 'window' },
      { wall: 'north', at: 4.4, kind: 'window' },
      { wall: 'west', at: 4.0, kind: 'window' },
    ],
  },
  floors: [
    { id: 'office', cells: [0, 0, 2, 4], material: 'wood', kind: 'interior' },
    { id: 'front-garden', cells: [0, 5, 2, 7], material: 'grass', kind: 'exterior' },
    { id: 'dining-spine', cells: [3, 0, 5, 7], material: 'wood', kind: 'interior' },
    { id: 'east-hall', cells: [6, 0, 7, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'office-dining', from: [3, 0], to: [3, 5], height: 'half', openings: [{ at: 4.0, width: 1.0, kind: 'door' }] },
    { id: 'office-garden', from: [0, 5], to: [3, 5], height: 'half', openings: [] },
    { id: 'garden-dining', from: [3, 5], to: [3, 8], height: 'half', openings: [{ at: 7.4, width: 1.2, kind: 'door' }] },
    { id: 'dining-east-hall', from: [6, 0], to: [6, 8], height: 'half', openings: [{ at: 3.4, width: 1.3, kind: 'open' }] },
  ],
  furniture: [
    // Escritório: secretária sob a janela norte com a cadeira, estantes na parede oeste,
    // estante baixa divisória atrás da cadeira, segunda secretária junto à janela oeste e sofá de leitura.
    { id: 'office-greta-desk', model: 'desk', logic: 'desk@0,0', against: { wall: 'north', at: 0.95 } },
    { id: 'office-desk-laptop', model: 'laptop', on: { parent: 'office-greta-desk' } },
    { id: 'office-idris-chair', model: 'chairDesk', logic: 'chair@0,1', at: [1.12, 0.8], facing: 'N' },
    { id: 'office-clock', model: 'speaker', logic: 'clock@0,2', against: { wall: 'north', at: 2.5 } },
    { id: 'office-idris-bookshelf-west', model: 'bookcaseOpen', logic: 'bookshelf@1,0', against: { wall: 'west', at: 1.5 }, facing: 'E' },
    { id: 'office-bookshelf-west-b', model: 'bookcaseOpen', against: { wall: 'west', at: 2.0 }, facing: 'E' },
    { id: 'office-bookshelf-north', model: 'bookcaseOpenLow', logic: 'bookshelf@1,1', at: [1.8, 1.3], facing: 'S' },
    { id: 'office-bookshelf-north-books', model: 'books', on: { parent: 'office-bookshelf-north', surface: 'top' } },
    { id: 'office-bookshelf-north-b', model: 'bookcaseOpenLow', at: [2.3, 1.3], facing: 'S' },
    { id: 'dining-desk-extra', model: 'desk', logic: 'desk@3,0', against: { wall: 'west', at: 3.5 }, facing: 'E' },
    { id: 'office-desk-lamp', model: 'lampSquareTable', on: { parent: 'dining-desk-extra' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'office-garden', at: 1.7, side: 'N' }, facing: 'N' },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [1.7, 3.95] },
    // Sala de jantar: recanto de estar a norte (televisão, sofá, mesa baixa e candeeiros);
    // mesa de jantar a sul com as duas cadeiras nas cabeceiras e aparador na parede oeste.
    { id: 'dining-media', model: 'cabinetTelevision', against: { wall: 'office-dining', at: 0.85, side: 'E' }, facing: 'E' },
    { id: 'dining-tv', model: 'televisionVintage', on: { parent: 'dining-media' } },
    { id: 'dining-sofa', model: 'loungeSofa', against: { wall: 'dining-east-hall', at: 0.95, side: 'W' }, facing: 'W' },
    { id: 'dining-coffee-table', model: 'tableCoffee', at: [4.75, 0.95], facing: 'E' },
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@0,4', at: [4.2, 0.3] },
    { id: 'dining-lamp-east-table', model: 'sideTable', against: { wall: 'dining-east-hall', at: 1.95, side: 'W' }, facing: 'W' },
    { id: 'dining-lamp-east', model: 'lampRoundTable', logic: 'lamp@1,5', on: { parent: 'dining-lamp-east-table' } },
    { id: 'dining-table', model: 'table', at: [5.05, 5.5], facing: 'E' },
    { id: 'dining-viraj-chair', model: 'chair', logic: 'chair@4,5', at: [5.08, 4.62], facing: 'S' },
    { id: 'hall-nadia-chair', model: 'chair', logic: 'chair@6,5', at: [5.08, 6.38], facing: 'N' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'garden-dining', at: 5.5, side: 'E' }, facing: 'E' },
    { id: 'dining-sideboard-lamp', model: 'lampSquareTable', on: { parent: 'dining-sideboard' } },
    // Corredor: consola junto à entrada, relógio de pé, tapete e vasos.
    { id: 'hall-console', model: 'sideTableDrawers', against: { wall: 'east', at: 1.4 }, facing: 'W' },
    { id: 'hall-console-lamp', model: 'lampSquareTable', on: { parent: 'hall-console' } },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@3,7', against: { wall: 'east', at: 3.5 }, facing: 'W' },
    { id: 'hall-plants-east', model: 'pottedPlant', logic: 'plant@2,6', at: [6.4, 2.3] },
    { id: 'hall-victim-flower', model: 'flower_purpleA', logic: 'plant@7,7', at: [7.6, 7.55] },
    { id: 'hall-nadia-rug', model: 'rugRectangle', logic: 'rug@4,6', at: [7.0, 5.0] },
    { id: 'hall-low-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 6.4 }, facing: 'W' },
    // Jardim de entrada.
    { id: 'garden-flower', model: 'flower_redA', logic: 'plant@7,0', at: [0.5, 7.5] },
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@6,0', at: [0.45, 6.45] },
    { id: 'garden-shrub-east', model: 'plant_bushDetailed', logic: 'shrub@6,2', at: [2.35, 6.2] },
    { id: 'garden-rock', model: 'rock_smallA', at: [1.2, 5.55] },
    { id: 'garden-stump', model: 'stump_round', at: [0.55, 5.5] },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [2.45, 7.4] },
    { id: 'garden-path-b', model: 'path_stone', at: [1.5, 7.3] },
  ],
}
