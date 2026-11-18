import type { SceneSpec } from '../schema'

// Casa estreita com sala de estar, alpendre, corredor e jardim lateral.
export const aDebtRepaid: SceneSpec = {
  puzzleId: 'medium-9',
  floor: 0,
  entry: { wall: 'west', at: 2.7 },
  shell: { features: [{ wall: 'north', at: 3.5, kind: 'window' }] },
  floors: [
    { id: 'living-room', cells: [0, 0, 3, 4], material: 'wood', kind: 'interior' },
    { id: 'south-porch', cells: [0, 5, 3, 7], material: 'stone', kind: 'exterior' },
    { id: 'central-hall', cells: [4, 0, 5, 7], material: 'tile', kind: 'interior' },
    { id: 'east-front-garden', cells: [6, 0, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'living-hall', from: [4, 0], to: [4, 5], height: 'half', openings: [{ at: 1.5, width: 1.2, kind: 'door' }] },
    { id: 'porch-hall', from: [4, 5], to: [4, 8], height: 'half', openings: [{ at: 7.45, width: 0.9, kind: 'door' }] },
    { id: 'hall-garden', from: [6, 0], to: [6, 8], height: 'half', openings: [{ at: 1.0, width: 1.2, kind: 'open' }] },
    { id: 'living-porch', from: [0, 5], to: [4, 5], height: 'half', openings: [{ at: 1.7, width: 1.2, kind: 'open' }] },
  ],
  furniture: [
    // Sala de estar: televisão na parede oeste com o sofá virado para ela e mesa baixa;
    // estante sob a janela; a sul um segundo sofá com mesa baixa e o relógio de pé.
    { id: 'living-television', model: 'cabinetTelevision', logic: 'tv@1,0', against: { wall: 'west', at: 1.1 }, facing: 'E' },
    { id: 'living-tv-set', model: 'televisionVintage', on: { parent: 'living-television' } },
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@0,0', at: [1.62, 0.7], facing: 'W' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [0.88, 0.95], facing: 'E' },
    { id: 'living-floor-lamp', model: 'lampRoundFloor', at: [2.05, 0.25] },
    { id: 'living-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 2.8 } },
    { id: 'living-sofa-south', model: 'loungeSofa', against: { wall: 'living-porch', at: 3.0, side: 'N' }, facing: 'N' },
    { id: 'living-coffee-table-south', model: 'tableCoffee', at: [3.0, 3.75] },
    { id: 'living-reading-lamp', model: 'lampRoundFloor', at: [3.75, 4.3] },
    { id: 'living-clock', model: 'speaker', logic: 'clock@4,3', against: { wall: 'living-hall', at: 4.65, side: 'W' }, facing: 'W' },
    { id: 'living-desk', model: 'desk', against: { wall: 'west', at: 4.1 }, facing: 'E' },
    { id: 'living-desk-books', model: 'books', on: { parent: 'living-desk' } },
    // Alpendre: mesa de exterior com duas cadeiras, espreguiçadeira junto ao vaso e vedação baixa.
    { id: 'porch-chair-viraj', model: 'chair', logic: 'chair@7,0', at: [0.88, 7.35], facing: 'E' },
    { id: 'porch-table', model: 'table', at: [1.5, 7.35], facing: 'E' },
    { id: 'porch-chair-extra', model: 'chair', logic: 'chair@7,2', at: [2.12, 7.35], facing: 'W' },
    { id: 'porch-chair-yuki', model: 'loungeChair', logic: 'chair@6,3', at: [3.45, 6.4], facing: 'W' },
    { id: 'porch-plant', model: 'pottedPlant', logic: 'plant@5,3', at: [3.65, 5.35] },
    { id: 'porch-fence-west-a', model: 'fence_simpleLow', at: [0.1, 5.75], facing: 'E' },
    { id: 'porch-fence-west-b', model: 'fence_simpleLow', at: [0.1, 7.1], facing: 'E' },
    { id: 'porch-flower', model: 'flower_redA', at: [0.45, 5.4] },
    // Corredor: tapete, dois relógios de pé na meia parede do jardim, aparador e vaso.
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@2,4', at: [5.0, 3.0], facing: 'E' },
    { id: 'hall-clock-north', model: 'speaker', logic: 'clock@4,5', against: { wall: 'hall-garden', at: 4.4, side: 'W' }, facing: 'W' },
    { id: 'hall-clock-south', model: 'speaker', logic: 'clock@6,5', against: { wall: 'hall-garden', at: 6.4, side: 'W' }, facing: 'W' },
    { id: 'hall-console', model: 'cabinetTelevisionDoors', against: { wall: 'living-hall', at: 3.4, side: 'E' }, facing: 'E' },
    { id: 'hall-console-lamp', model: 'lampSquareTable', on: { parent: 'hall-console' } },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@6,4', at: [4.3, 6.25] },
    // Jardim lateral: canteiros, flores e caminho de lajes a partir do corredor.
    { id: 'garden-shrub-north', model: 'plant_bushSmall', logic: 'shrub@0,7', at: [7.5, 0.5] },
    { id: 'garden-shrub-upper', model: 'plant_bushSmall', logic: 'shrub@2,6', at: [6.5, 2.5] },
    { id: 'garden-shrub-middle', model: 'plant_bushDetailed', logic: 'shrub@3,6', at: [6.5, 3.5] },
    { id: 'garden-shrub-south-east', model: 'plant_bushSmall', logic: 'shrub@7,7', at: [7.5, 7.5] },
    { id: 'garden-plant-south', model: 'flower_purpleA', logic: 'plant@4,6', at: [6.5, 4.5] },
    { id: 'garden-flower-a', model: 'flower_yellowA', at: [7.5, 3.0] },
    { id: 'garden-flower-b', model: 'flower_redA', at: [7.4, 5.6] },
    { id: 'garden-rock', model: 'rock_smallA', at: [6.6, 6.4] },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [6.6, 1.0] },
    { id: 'garden-path-b', model: 'path_stone', at: [7.3, 1.6] },
    { id: 'porch-path-a', model: 'path_stone', at: [1.7, 5.7] },
  ],
}
