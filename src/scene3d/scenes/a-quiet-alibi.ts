import type { SceneSpec } from '../schema'

// Casa térrea com alpendre em loggia, galeria central e sala a nascente.
export const aQuietAlibi: SceneSpec = {
  puzzleId: 'medium-12',
  floor: 0,
  entry: { wall: 'west', at: 1.55 },
  shell: { features: [
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 4.6, kind: 'window' },
  ] },
  floors: [
    { id: 'north-loggia', cells: [0, 0, 2, 3], material: 'stone', kind: 'courtyard' },
    { id: 'south-office', cells: [0, 4, 2, 7], material: 'wood' },
    { id: 'central-gallery', cells: [3, 0, 4, 7], material: 'tile' },
    { id: 'east-living-room', cells: [5, 0, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'loggia-gallery', from: [3, 0], to: [3, 8], height: 'half', openings: [
      { at: 1.6, width: 1.2, kind: 'open' },
      { at: 5.9, width: 1.0, kind: 'door' },
    ] },
    { id: 'gallery-living', from: [5, 0], to: [5, 8], height: 'half', openings: [
      { at: 1.4, width: 1.0, kind: 'open' },
      { at: 7.2, width: 1.0, kind: 'open' },
    ] },
    { id: 'loggia-office', from: [0, 4], to: [3, 4], height: 'half', openings: [{ at: 0.6, width: 1.0, kind: 'open' }] },
  ],
  furniture: [
    // Loggia: poltrona junto à entrada, mesa de exterior com cadeiras e vasos.
    { id: 'loggia-chair-north', model: 'loungeChair', logic: 'chair@0,0', at: [0.6, 0.5], facing: 'S' },
    { id: 'loggia-table', model: 'table', at: [1.55, 2.9] },
    { id: 'loggia-chair-south', model: 'chair', logic: 'chair@3,1', at: [1.55, 3.5], facing: 'N' },
    { id: 'loggia-chair-north-b', model: 'chair', at: [1.55, 2.3], facing: 'S' },
    { id: 'loggia-chair-west', model: 'chair', at: [0.85, 2.9], facing: 'E' },
    { id: 'office-plant', model: 'pottedPlant', logic: 'plant@2,2', at: [2.6, 2.45] },
    { id: 'loggia-plant-corner', model: 'pottedPlant', at: [2.7, 0.3] },
    // Galeria: relógio de pé e vaso a norte, segundo relógio e vaso na meia parede da sala,
    // banco, candeeiro e passadeira.
    { id: 'gallery-plant-north', model: 'pottedPlant', logic: 'plant@0,3', at: [3.3, 0.3] },
    { id: 'hall-clock-north', model: 'speaker', logic: 'clock@0,4', against: { wall: 'north', at: 4.6 } },
    { id: 'hall-clock-middle', model: 'speaker', logic: 'clock@2,4', against: { wall: 'gallery-living', at: 2.6, side: 'W' }, facing: 'W' },
    { id: 'gallery-plant-south', model: 'pottedPlant', logic: 'plant@3,4', at: [4.72, 3.25] },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'loggia-gallery', at: 3.4, side: 'E' }, facing: 'E' },
    { id: 'hall-lamp', model: 'lampRoundFloor', at: [3.3, 7.6] },
    // Escritório: estante alta na parede oeste, duas secretárias com cadeiras na parede sul
    // e estante virada para o corredor de passagem junto à porta da galeria.
    { id: 'office-bookcase-west', model: 'bookcaseClosedWide', logic: 'bookshelf@5,0', against: { wall: 'west', at: 6.0 }, facing: 'E' },
    { id: 'office-desk-lena', model: 'desk', logic: 'desk@7,0', against: { wall: 'south', at: 0.55 }, facing: 'N' },
    { id: 'office-desk-idris', model: 'desk', logic: 'desk@7,1', against: { wall: 'south', at: 1.5 }, facing: 'N' },
    { id: 'office-desk-lena-lamp', model: 'lampSquareTable', on: { parent: 'office-desk-lena' } },
    { id: 'office-desk-idris-laptop', model: 'laptop', on: { parent: 'office-desk-idris' } },
    { id: 'office-desk-lena-chair', model: 'chairDesk', at: [0.55, 6.95], facing: 'S' },
    { id: 'office-desk-idris-chair', model: 'chairDesk', at: [1.5, 6.95], facing: 'S' },
    { id: 'office-bookcase-east', model: 'bookcaseClosedWide', logic: 'bookshelf@6,2', at: [2.2, 7.15], facing: 'E' },
    { id: 'office-floor-lamp', model: 'lampRoundFloor', at: [2.7, 4.35] },
    // Sala de estar: recanto de televisão a norte (sofá sobre o tapete, mesa baixa, televisão);
    // a sul a sala principal com a segunda televisão, o sofá, poltrona, mesa baixa e relógio.
    { id: 'living-rug-north', model: 'rugRectangle', logic: 'rug@0,6', at: [7.0, 1.0] },
    { id: 'living-media-sofa', model: 'loungeSofa', against: { wall: 'north', at: 6.9 } },
    { id: 'living-den-table', model: 'tableCoffee', at: [6.9, 1.35] },
    { id: 'living-television-north', model: 'cabinetTelevision', logic: 'tv@2,7', at: [7.35, 2.72], facing: 'N' },
    { id: 'living-screen-north', model: 'televisionVintage', logic: 'tv@2,7', on: { parent: 'living-television-north' } },
    { id: 'living-television-south', model: 'cabinetTelevision', logic: 'tv@3,7', at: [7.35, 3.28], facing: 'S' },
    { id: 'living-screen-south', model: 'televisionVintage', logic: 'tv@3,7', on: { parent: 'living-television-south' } },
    { id: 'living-clock', model: 'speaker', logic: 'clock@3,5', against: { wall: 'gallery-living', at: 3.6, side: 'E' }, facing: 'E' },
    { id: 'living-rug-south', model: 'rugRectangle', logic: 'rug@4,5', at: [6.1, 5.0], facing: 'E' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [6.9, 5.3] },
    { id: 'living-armchair', model: 'loungeChair', at: [5.7, 5.1], facing: 'E' },
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@6,5', at: [6.9, 6.55], facing: 'N' },
    { id: 'living-plant', model: 'pottedPlant', at: [5.3, 0.3] },
  ],
  rugs: [
    { id: 'hall-runner', model: 'rugRectangle', at: [4.0, 5.2], facing: 'E' },
    { id: 'office-rug', model: 'rugSquare', at: [1.0, 5.6] },
  ],
}
