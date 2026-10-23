import type { SceneSpec } from '../schema'

// Casa com jardim de inverno envidraçado a noroeste, sala com a escada e a
// entrada a nordeste, escritório a sudoeste e alpendre fechado a sudeste.
// O piso superior cobre toda a planta, pelo que o jardim e o alpendre são
// interiores e dispensam a estrutura de pilares e vigas.
export const theColdKettleGround: SceneSpec = {
  puzzleId: 'hard-5',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 7.2 },
  shell: { features: [
    { wall: 'north', at: 1.0, kind: 'window' },
    { wall: 'north', at: 2.9, kind: 'window' },
    { wall: 'north', at: 4.8, kind: 'window' },
    { wall: 'west', at: 1.5, kind: 'window' },
    { wall: 'west', at: 3.5, kind: 'window' },
    { wall: 'west', at: 6.5, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [6.1, 2.0], facing: 'S' },
  floors: [
    { id: 'front-yard', cells: [0, 0, 3, 4], material: 'tile' },
    { id: 'garden-bed-north', cells: [0, 0, 3, 0], material: 'grass', kind: 'interior' },
    { id: 'garden-bed-west', cells: [0, 1, 0, 2], material: 'grass', kind: 'interior' },
    { id: 'garden-bed-east', cells: [3, 1, 3, 2], material: 'grass', kind: 'interior' },
    { id: 'living-room', cells: [4, 0, 7, 4], material: 'wood' },
    { id: 'office', cells: [0, 5, 4, 7], material: 'wood' },
    { id: 'covered-porch', cells: [5, 5, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'garden-living', from: [4, 0], to: [4, 5], height: 'half', openings: [{ at: 4.35, width: 1.1, kind: 'door' }] },
    { id: 'south-wing-front', from: [0, 5], to: [8, 5], height: 'half', openings: [
      { at: 2.75, kind: 'door' },
      { at: 7.3, width: 1.0, kind: 'open' },
    ] },
    { id: 'office-porch', from: [5, 5], to: [5, 8], height: 'half', openings: [{ at: 6.5, width: 1.0, kind: 'door' }] },
  ],
  furniture: [
    // Jardim de inverno: canteiros relvados em U ao longo das janelas norte e
    // oeste e junto à sala, com arbustos, vasos, pedras e um cepo; ao centro,
    // pavimento claro com dois cadeirões de jardim em volta de uma mesa baixa;
    // estantes baixas com vasos pequenos e bancos almofadados nas paredes.
    { id: 'garden-shrub-north', model: 'plant_bushLarge', logic: 'shrub@0,1', at: [1.45, 0.45] },
    { id: 'garden-plant-north', model: 'pottedPlant', logic: 'plant@0,2', at: [2.6, 0.35] },
    { id: 'garden-plant-south', model: 'pottedPlant', logic: 'plant@1,3', at: [3.7, 1.3] },
    { id: 'garden-shrub-south', model: 'plant_bushLarge', logic: 'shrub@2,3', at: [3.55, 2.45] },
    { id: 'garden-rock', model: 'rock_smallA', at: [0.4, 0.45] },
    { id: 'garden-rock-west', model: 'rock_smallB', at: [0.35, 2.55] },
    { id: 'garden-stump', model: 'stump_round', at: [3.45, 0.5] },
    { id: 'garden-plant-shelf', model: 'bookcaseOpenLow', against: { wall: 'west', at: 3.6 }, facing: 'E' },
    { id: 'garden-plant-shelf-a', model: 'plantSmall1', on: { parent: 'garden-plant-shelf', offset: [-0.12, 0] } },
    { id: 'garden-plant-shelf-b', model: 'plantSmall3', on: { parent: 'garden-plant-shelf', offset: [0.12, 0] } },
    { id: 'garden-bench', model: 'benchCushion', against: { wall: 'south-wing-front', side: 'N', at: 1.4 }, facing: 'N' },
    { id: 'garden-table', model: 'tableCoffeeSquare', at: [1.85, 2.55] },
    { id: 'garden-table-plant', model: 'plantSmall2', on: { parent: 'garden-table' } },
    { id: 'garden-lounger-west', model: 'loungeChair', at: [1.2, 2.0], facing: 'E' },
    { id: 'garden-lounger-east', model: 'loungeChair', at: [2.5, 2.0], facing: 'W' },
    // Sala: sofá comprido na parede este, televisão na parede do jardim com um
    // cadeirão virado para ela a sul da escada, relógio de pé e candeeiro.
    { id: 'living-sofa', model: 'loungeSofaLong', logic: 'sofa@1,7', at: [7.35, 2.0], facing: 'W' },
    { id: 'living-side-table', model: 'sideTableDrawers', against: { wall: 'east', at: 3.45 }, facing: 'W' },
    { id: 'living-side-lamp', model: 'lampRoundTable', on: { parent: 'living-side-table' } },
    { id: 'living-tv', model: 'cabinetTelevision', logic: 'tv@3,4', against: { wall: 'garden-living', side: 'E', at: 3.3 }, facing: 'E' },
    { id: 'living-tv-set', model: 'televisionModern', on: { parent: 'living-tv' } },
    { id: 'living-armchair', model: 'loungeChair', at: [5.6, 3.6], facing: 'W' },
    { id: 'living-coffee-table', model: 'tableCoffeeSquare', at: [6.55, 3.75] },
    { id: 'living-rug', model: 'rugRectangle', logic: 'rug@0,5', at: [5.2, 1.5], facing: 'N' },
    { id: 'living-clock', model: 'speaker', logic: 'clock@4,4', at: [4.8, 4.25] },
    { id: 'living-floor-lamp', model: 'lampRoundFloor', at: [4.3, 0.3] },
    // Escritório: estante larga e secretária com cadeira na parede norte,
    // cadeirão de leitura com candeeiro, cómoda de arquivo junto à janela.
    { id: 'office-chair-west', model: 'loungeChair', logic: 'chair@5,0', at: [0.55, 5.45], facing: 'E' },
    { id: 'office-reading-lamp', model: 'lampSquareFloor', at: [0.2, 5.95] },
    { id: 'office-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@5,1', against: { wall: 'south-wing-front', side: 'S', at: 1.75 }, facing: 'S' },
    { id: 'office-desk', model: 'desk', logic: 'desk@5,3', against: { wall: 'south-wing-front', side: 'S', at: 3.7 }, facing: 'S' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [3.7, 6.05], facing: 'N' },
    { id: 'office-cabinet', model: 'sideTableDrawers', against: { wall: 'west', at: 7.2 }, facing: 'E' },
    { id: 'office-cabinet-books', model: 'books', on: { parent: 'office-cabinet' } },
    // Alpendre envidraçado: duas espreguiçadeiras viradas uma para a outra com
    // mesa baixa, vaso no canto e suporte de plantas junto à parede este.
    { id: 'porch-chair-north', model: 'loungeChairRelax', logic: 'chair@5,6', at: [6.5, 5.5], facing: 'S' },
    { id: 'porch-side-table', model: 'tableCoffeeSquare', at: [6.85, 6.55] },
    { id: 'porch-side-table-plant', model: 'plantSmall1', on: { parent: 'porch-side-table' } },
    { id: 'porch-plant', model: 'pottedPlant', logic: 'plant@7,6', at: [6.25, 7.7] },
    { id: 'porch-chair-south', model: 'loungeChairRelax', logic: 'chair@7,7', at: [7.45, 7.45], facing: 'N' },
    { id: 'porch-plant-stand', model: 'sideTableDrawers', against: { wall: 'east', at: 6.1 }, facing: 'W' },
    { id: 'porch-plant-stand-plant', model: 'plantSmall3', on: { parent: 'porch-plant-stand' } },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [7.2, 0.35] },
    { id: 'office-rug', model: 'rugRectangle', at: [2.6, 6.6] },
    { id: 'garden-grass-a', model: 'grass_leafsLarge', at: [0.5, 1.5] },
    { id: 'garden-grass-b', model: 'grass_leafsLarge', at: [2.1, 0.55] },
    { id: 'garden-grass-c', model: 'grass_leafsLarge', at: [3.5, 1.75] },
    { id: 'porch-mat', model: 'rugDoormat', at: [7.3, 5.4] },
  ],
}
