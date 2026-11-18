import type { SceneSpec } from '../schema'

// Moradia térrea entre um pátio verde e um pequeno jardim de entrada.
export const nobodyLeft: SceneSpec = {
  puzzleId: 'medium-11',
  floor: 0,
  entry: { wall: 'west', at: 6.5 },
  shell: { features: [
    { wall: 'north', at: 1.2, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 1.6, kind: 'window' },
  ] },
  floors: [
    { id: 'living-room', cells: [0, 0, 2, 3], material: 'wood' },
    { id: 'walled-garden', cells: [3, 0, 7, 3], material: 'grass', kind: 'courtyard' },
    { id: 'arrival-garden', cells: [0, 4, 2, 7], material: 'stone', kind: 'courtyard' },
    { id: 'office-floor', cells: [3, 4, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'living-garden', from: [3, 0], to: [3, 4], height: 'half', openings: [{ at: 2.15, width: 1.2, kind: 'open' }] },
    { id: 'arrival-office', from: [3, 4], to: [3, 8], height: 'half', openings: [{ at: 6.15, width: 1.2, kind: 'door' }] },
    { id: 'living-arrival', from: [0, 4], to: [3, 4], height: 'half', openings: [{ at: 1.45, width: 1.2, kind: 'open' }] },
    { id: 'garden-office', from: [3, 4], to: [8, 4], height: 'half', openings: [{ at: 5.65, width: 1.25, kind: 'open' }] },
  ],
  furniture: [
    // Sala de estar: televisão na parede norte, sofá virado para ela com mesa baixa e tapete,
    // poltrona junto à janela oeste, estante e relógio de pé.
    { id: 'living-television', model: 'cabinetTelevision', logic: 'tv@0,2', against: { wall: 'north', at: 2.3 } },
    { id: 'living-tv-set', model: 'televisionModern', on: { parent: 'living-television' } },
    { id: 'living-sofa', model: 'loungeSofa', at: [1.8, 2.05], facing: 'N' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [1.8, 1.3] },
    { id: 'living-armchair', model: 'loungeChair', at: [0.5, 1.35], facing: 'E' },
    { id: 'living-floor-lamp', model: 'lampRoundFloor', at: [0.35, 2.4] },
    { id: 'living-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 3.3 }, facing: 'E' },
    { id: 'living-clock', model: 'speaker', logic: 'clock@3,2', against: { wall: 'living-garden', at: 3.5, side: 'W' }, facing: 'W' },
    // Pátio verde: canteiros, mesa de jardim com duas cadeiras e caminho de lajes.
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@0,3', at: [3.45, 0.45] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@0,6', at: [6.45, 0.45] },
    { id: 'garden-plant', model: 'pottedPlant', logic: 'plant@1,7', at: [7.6, 1.35] },
    { id: 'garden-table', model: 'tableRound', at: [4.7, 1.75] },
    { id: 'garden-chair-west', model: 'chair', at: [4.7, 1.12], facing: 'S' },
    { id: 'garden-chair-east', model: 'chair', at: [4.7, 2.38], facing: 'N' },
    { id: 'garden-bench', model: 'bench', against: { wall: 'garden-office', at: 7.3, side: 'N' }, facing: 'N' },
    { id: 'garden-rock', model: 'rock_smallA', at: [3.6, 3.4] },
    // Jardim de entrada: canteiros, banco junto à porta do escritório.
    { id: 'yard-shrub', model: 'plant_bushSmall', logic: 'shrub@4,0', at: [0.48, 4.5] },
    { id: 'yard-plant-border', model: 'flower_redA', logic: 'plant@4,1', at: [1.75, 4.8] },
    { id: 'yard-plant', model: 'pottedPlant', logic: 'plant@6,2', at: [2.15, 6.5] },
    { id: 'yard-bench', model: 'benchCushion', against: { wall: 'west', at: 5.2 }, facing: 'E' },
    // Escritório: estantes baixas e relógio de pé na divisória do pátio, secretária com cadeira ao
    // centro e um canto de estar a sudeste (sofá, poltrona, mesa baixa).
    { id: 'office-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@4,3', against: { wall: 'garden-office', at: 3.75, side: 'S' } },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase', surface: 'top' } },
    { id: 'office-shelf-low', model: 'bookcaseOpenLow', against: { wall: 'garden-office', at: 4.25, side: 'S' } },
    { id: 'office-shelf-radio', model: 'radio', on: { parent: 'office-shelf-low', surface: 'top' } },
    { id: 'office-clock', model: 'speaker', logic: 'clock@4,6', against: { wall: 'garden-office', at: 6.6, side: 'S' } },
    { id: 'office-desk', model: 'desk', logic: 'desk@5,5', at: [5.45, 5.4] },
    { id: 'office-desk-screen', model: 'computerScreen', on: { parent: 'office-desk' } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [5.45, 6.0], facing: 'N' },
    { id: 'office-floor-lamp', model: 'lampRoundFloor', at: [4.65, 5.2] },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'south', at: 6.7 }, facing: 'N' },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [6.7, 6.85] },
    { id: 'office-visitor-chair', model: 'loungeChair', logic: 'chair@5,7', at: [7.45, 5.7], facing: 'W' },
  ],
  rugs: [
    { id: 'living-rug', model: 'rugRectangle', at: [1.8, 1.6] },
    { id: 'yard-mat', model: 'rugDoormat', at: [0.35, 6.5], facing: 'E' },
    { id: 'office-rug', model: 'rugSquare', at: [5.45, 5.7] },
    { id: 'garden-path-a', model: 'path_stone', at: [3.55, 2.2] },
    { id: 'garden-path-b', model: 'path_stone', at: [5.6, 3.35] },
  ],
}
