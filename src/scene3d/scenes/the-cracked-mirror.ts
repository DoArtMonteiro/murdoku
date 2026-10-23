import type { SceneSpec } from '../schema'

// Bungalow urbano com gabinete, alpendre frontal e jardim nas traseiras.
export const theCrackedMirror: SceneSpec = {
  puzzleId: 'medium-8',
  floor: 0,
  entry: { wall: 'west', at: 1.5 },
  shell: { features: [{ wall: 'north', at: 3.4, kind: 'window' }] },
  floors: [
    { id: 'office', cells: [0, 0, 4, 3], material: 'wood', kind: 'interior' },
    { id: 'front-porch', cells: [5, 0, 7, 3], material: 'stone', kind: 'courtyard' },
    { id: 'cross-hall', cells: [0, 4, 7, 5], material: 'tile', kind: 'interior' },
    { id: 'rear-garden', cells: [0, 6, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'office-porch', from: [5, 0], to: [5, 4], height: 'half', openings: [{ at: 0.65, width: 0.9, kind: 'door' }] },
    { id: 'office-hall', from: [0, 4], to: [5, 4], height: 'half', openings: [{ at: 2.5, width: 1.0, kind: 'door' }] },
    { id: 'porch-hall', from: [5, 4], to: [8, 4], height: 'half', openings: [{ at: 7.3, width: 1.0, kind: 'open' }] },
    { id: 'hall-garden', from: [0, 6], to: [8, 6], height: 'half', openings: [{ at: 4.0, width: 1.6, kind: 'open' }] },
  ],
  furniture: [
    // Gabinete: parede de estantes e relógio de pé a norte, duas poltronas frente a frente com
    // mesa baixa ao centro, e as duas secretárias lado a lado na divisória do corredor.
    { id: 'office-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@0,1', against: { wall: 'north', at: 2.0 } },
    { id: 'office-bookshelf-west', model: 'bookcaseClosedWide', against: { wall: 'north', at: 1.0 } },
    { id: 'office-clock', model: 'speaker', logic: 'clock@0,4', against: { wall: 'north', at: 4.3 } },
    { id: 'office-coat-rack', model: 'coatRackStanding', at: [0.3, 0.75] },
    { id: 'office-chair-reading', model: 'loungeChair', logic: 'chair@1,2', at: [2.7, 1.65], facing: 'E' },
    { id: 'office-coffee-table', model: 'tableCoffeeSquare', at: [3.65, 2.05] },
    { id: 'office-chair-east', model: 'loungeChair', logic: 'chair@2,4', at: [4.4, 2.45], facing: 'W' },
    { id: 'office-reading-lamp', model: 'lampRoundFloor', at: [2.3, 1.15] },
    { id: 'office-desk-south-east', model: 'desk', logic: 'desk@3,0', against: { wall: 'office-hall', at: 0.55, side: 'N' } },
    { id: 'office-desk-screen', model: 'computerScreen', on: { parent: 'office-desk-south-east' } },
    { id: 'office-desk-south-west', model: 'desk', logic: 'desk@3,1', against: { wall: 'office-hall', at: 1.5, side: 'N' } },
    { id: 'office-desk-laptop', model: 'laptop', on: { parent: 'office-desk-south-west' } },
    { id: 'office-desk-lamp', model: 'lampSquareTable', on: { parent: 'office-desk-south-west', offset: [0.25, 0.05] } },
    { id: 'office-cabinet', model: 'kitchenCabinetDrawer', against: { wall: 'office-porch', at: 3.4, side: 'W' }, facing: 'W' },
    // Alpendre: sofá de exterior e mesa baixa, poltrona e vasos.
    { id: 'porch-plant-north', model: 'pottedPlant', logic: 'plant@0,6', at: [6.5, 0.3] },
    { id: 'porch-plant-south', model: 'pottedPlant', logic: 'plant@2,5', at: [5.45, 2.3] },
    { id: 'porch-sofa', model: 'loungeSofa', against: { wall: 'east', at: 2.5 }, facing: 'W' },
    { id: 'porch-table', model: 'tableCoffee', at: [6.6, 2.5], facing: 'E' },
    { id: 'porch-chair', model: 'loungeChair', logic: 'chair@3,5', at: [5.55, 3.35], facing: 'E' },
    // Corredor: tapete e consola com candeeiro a oeste, relógio de pé junto à porta do gabinete,
    // estante baixa e vaso a este.
    { id: 'hall-rug-west', model: 'rugRectangle', logic: 'rug@4,0', at: [1.0, 5.0] },
    { id: 'hall-console', model: 'sideTableDrawers', against: { wall: 'west', at: 5.0 }, facing: 'E' },
    { id: 'hall-console-lamp', model: 'lampRoundTable', on: { parent: 'hall-console' } },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@4,3', against: { wall: 'office-hall', at: 3.6, side: 'S' } },
    { id: 'hall-shelf', model: 'bookcaseOpenLow', against: { wall: 'porch-hall', at: 5.6, side: 'S' } },
    { id: 'hall-shelf-books', model: 'books', on: { parent: 'hall-shelf', surface: 'top' } },
    { id: 'hall-plant-east', model: 'pottedPlant', logic: 'plant@5,7', at: [7.4, 5.3] },
    // Jardim das traseiras: canteiros, caminho, pedras e um cepo.
    { id: 'garden-plant-west', model: 'pottedPlant', logic: 'plant@6,1', at: [1.4, 6.35] },
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@7,1', at: [1.5, 7.5] },
    { id: 'garden-shrub-centre-west', model: 'plant_bushDetailed', logic: 'shrub@6,2', at: [2.5, 6.5] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@7,6', at: [6.5, 7.5] },
    { id: 'garden-shrub-east-corner', model: 'plant_bushDetailed', logic: 'shrub@7,7', at: [7.5, 7.5] },
    { id: 'garden-rock', model: 'rock_smallA', at: [5.4, 6.5] },
    { id: 'garden-stump', model: 'stump_round', at: [0.5, 7.4] },
  ],
  rugs: [
    { id: 'office-rug', model: 'rugRound', at: [3.6, 2.05] },
    { id: 'office-door-mat', model: 'rugDoormat', at: [0.35, 1.5], facing: 'E' },
    { id: 'garden-path-a', model: 'path_stone', at: [4.0, 6.5] },
    { id: 'garden-path-b', model: 'path_stone', at: [4.3, 7.4] },
  ],
}
