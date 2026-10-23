import type { SceneSpec } from '../schema'

// Hall central com galeria de entrada, alpendre e jardim.
export const shadowsInTheHall: SceneSpec = {
  puzzleId: 'medium-3',
  floor: 0,
  entry: { wall: 'west', at: 3.1 },
  shell: { features: [{ wall: 'north', at: 3.2, kind: 'window' }] },
  floors: [
    { id: 'west-gallery', cells: [0, 0, 1, 7], material: 'tile', kind: 'interior' },
    { id: 'central-hall', cells: [2, 0, 4, 7], material: 'wood', kind: 'interior' },
    { id: 'north-porch-court', cells: [5, 0, 7, 3], material: 'stone', kind: 'courtyard' },
    { id: 'south-garden', cells: [5, 4, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'gallery-hall', from: [2, 0], to: [2, 8], height: 'half', openings: [{ at: 3.15, width: 1.25, kind: 'door' }] },
    { id: 'hall-porch', from: [5, 0], to: [5, 4], height: 'half', openings: [{ at: 3.3, width: 1.2, kind: 'open' }] },
    { id: 'hall-garden', from: [5, 4], to: [5, 8], height: 'half', openings: [{ at: 4.75, width: 1.2, kind: 'open' }] },
    { id: 'porch-garden', from: [5, 4], to: [8, 4], height: 'half', openings: [{ at: 6.0, width: 1.25, kind: 'open' }] },
  ],
  furniture: [
    // Galeria de entrada: tapete junto à porta, estantes na parede oeste, relógio de pé e vasos ao fundo.
    { id: 'gallery-rug', model: 'rugRectangle', logic: 'rug@1,0', at: [1.0, 2.0] },
    { id: 'gallery-bookcase-a', model: 'bookcaseClosed', against: { wall: 'west', at: 4.6 }, facing: 'E' },
    { id: 'gallery-bookcase-b', model: 'bookcaseClosed', against: { wall: 'west', at: 5.1 }, facing: 'E' },
    { id: 'gallery-clock', model: 'speaker', logic: 'clock@7,0', against: { wall: 'west', at: 7.45 }, facing: 'E' },
    { id: 'gallery-plant-north', model: 'pottedPlant', logic: 'plant@6,1', at: [1.72, 6.15] },
    { id: 'gallery-plant-south', model: 'pottedPlant', logic: 'plant@7,1', at: [1.72, 7.15] },
    { id: 'gallery-plant-door', model: 'pottedPlant', at: [0.3, 0.3] },
    // Sala de jantar: aparador sob a janela entre os dois candeeiros, mesa comprida ao centro
    // com as duas cadeiras em lados opostos, e recanto de televisão a sul.
    { id: 'dining-lamp-north', model: 'lampRoundFloor', logic: 'lamp@0,2', at: [2.35, 0.35] },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'north', at: 3.2 } },
    { id: 'dining-sideboard-plant', model: 'plantSmall1', on: { parent: 'dining-sideboard' } },
    { id: 'dining-tomas-lamp-table', model: 'sideTable', against: { wall: 'north', at: 4.3 } },
    { id: 'dining-tomas-lamp', model: 'lampRoundTable', logic: 'lamp@0,4', on: { parent: 'dining-tomas-lamp-table' } },
    { id: 'dining-table-north', model: 'tableCloth', at: [3.6, 2.53], facing: 'E' },
    { id: 'dining-table-south', model: 'tableCloth', at: [3.6, 3.58], facing: 'E' },
    { id: 'dining-chair-west', model: 'chair', logic: 'chair@1,4', at: [4.1, 1.98], facing: 'W' },
    { id: 'dining-chair-north', model: 'chair', logic: 'chair@4,2', at: [2.95, 4.05], facing: 'E' },
    { id: 'dining-sofa', model: 'loungeSofa', against: { wall: 'gallery-hall', at: 6.1, side: 'E' }, facing: 'E' },
    { id: 'dining-coffee-table', model: 'tableCoffee', at: [3.25, 6.1], facing: 'E' },
    { id: 'dining-tv-cabinet', model: 'cabinetTelevision', against: { wall: 'hall-garden', at: 6.05, side: 'W' }, facing: 'W' },
    { id: 'dining-tv', model: 'televisionModern', on: { parent: 'dining-tv-cabinet' } },
    { id: 'dining-lena-lamp', model: 'lampRoundFloor', logic: 'lamp@6,4', at: [4.35, 6.2] },
    { id: 'dining-plant-south', model: 'pottedPlant', at: [2.3, 7.65] },
    // Alpendre: mesa de exterior com as cadeiras nas cabeceiras, sofá na parede este,
    // cadeira junto ao jardim e vasos.
    { id: 'porch-tomas-chair', model: 'chair', logic: 'chair@0,5', at: [5.55, 0.7], facing: 'S' },
    { id: 'porch-table', model: 'table', at: [5.55, 1.5], facing: 'E' },
    { id: 'dining-chair-centre', model: 'chair', logic: 'chair@2,5', at: [5.55, 2.3], facing: 'N' },
    { id: 'porch-sofa', model: 'loungeSofa', against: { wall: 'east', at: 1.5 }, facing: 'W' },
    { id: 'porch-plant', model: 'pottedPlant', logic: 'plant@3,6', at: [6.8, 3.3] },
    { id: 'porch-yuki-chair', model: 'loungeChair', logic: 'chair@3,7', at: [7.55, 3.5], facing: 'W' },
    { id: 'porch-plant-corner', model: 'pottedPlant', at: [7.7, 0.3] },
    // Jardim da frente.
    { id: 'dining-east-shrub', model: 'plant_bushSmall', logic: 'shrub@4,7', at: [7.5, 4.5] },
    { id: 'garden-rock', model: 'rock_smallA', at: [5.5, 6.3] },
    { id: 'garden-shrub', model: 'plant_bushDetailed', logic: 'shrub@7,5', at: [5.5, 7.5] },
    { id: 'garden-plant-east', model: 'flower_purpleA', logic: 'plant@7,6', at: [6.5, 7.5] },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [6.0, 4.6] },
    { id: 'garden-path-b', model: 'path_stone', at: [6.2, 5.5] },
    { id: 'garden-path-c', model: 'path_stone', at: [6.4, 6.4] },
  ],
}
