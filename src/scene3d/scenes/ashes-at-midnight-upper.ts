import type { SceneSpec } from '../schema'

// Piso superior: a escada chega a um patamar a este do escritório-biblioteca;
// uma galeria a norte do vão leva ao quarto, com casa de banho privativa, e o
// patamar abre a sul para o terraço sobre o jardim.
export const ashesAtMidnightUpper: SceneSpec = {
  puzzleId: 'hard-2',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [4.660625, 2.10625, 6.939375, 3.09375],
  circulation: {
    landing: [6.939375, 2.10625, 7.689375, 3.09375],
    halls: [
      { id: 'study-run', bounds: [7.0, 1.22, 7.95, 4.9] },
      { id: 'study-gallery', bounds: [4.05, 1.22, 7.95, 1.98] },
      { id: 'bedroom-aisle', bounds: [1.5, 1.22, 3.3, 4.65] },
      { id: 'bedroom-foot', bounds: [0.8, 3.8, 2.95, 4.65] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-door', bounds: [3.2, 1.22, 4.6, 1.98] },
      { id: 'bathroom-door', bounds: [0.82, 4.4, 1.68, 5.6] },
      { id: 'terrace-door', bounds: [7.0, 4.05, 7.95, 4.9] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.7, kind: 'window' },
    { wall: 'north', at: 6.6, kind: 'window' },
    { wall: 'west', at: 6.4, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [0, 0, 3, 4], material: 'wood' },
    { id: 'study-floor', cells: [4, 0, 7, 3], material: 'wood' },
    { id: 'bathroom-tile', cells: [0, 5, 3, 7], material: 'tile' },
    { id: 'upper-gallery-floor', cells: [4, 4, 7, 7], material: 'stone', kind: 'exterior' },
  ],
  walls: [
    { id: 'bedroom-study', from: [4, 0], to: [4, 5], height: 'half', openings: [{ at: 1.6, width: 1.0, kind: 'door' }] },
    { id: 'bedroom-bath', from: [0, 5], to: [4, 5], height: 'half', openings: [{ at: 1.25, width: 0.9, kind: 'door' }] },
    { id: 'bathroom-hall', from: [4, 5], to: [4, 8], height: 'half' },
    { id: 'study-gallery-transition', from: [4, 4], to: [8, 4], height: 'half', openings: [{ at: 7.45, width: 1.0, kind: 'open' }] },
    { id: 'gallery-east-railing', from: [8, 5], to: [8, 8], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'gallery-south-railing', from: [4, 8], to: [8, 8], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-west-guard', from: [4.660625, 2.10625], to: [4.660625, 3.09375], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-north-guard', from: [4.660625, 2.02625], to: [6.939375, 2.02625], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-south-guard', from: [4.660625, 3.17375], to: [6.939375, 3.17375], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  furniture: [
    // Quarto: cama encostada a oeste com duas mesas de cabeceira, roupeiro na
    // parede norte, cómoda com rádio a sul e candeeiro de pé no canto sudeste.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@2,0', against: { wall: 'west', at: 3.1 } },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', against: { wall: 'west', at: 2.3 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-lamp-west', model: 'cabinetBedDrawerTable', logic: 'lamp@4,0', against: { wall: 'west', at: 4.08 } },
    { id: 'bedroom-bedside-lamp-south', model: 'lampSquareTable', on: { parent: 'bedroom-lamp-west' } },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'north', at: 2.85 } },
    { id: 'bedroom-clock-table', model: 'sideTable', against: { wall: 'bedroom-bath', at: 2.55, side: 'N' } },
    { id: 'bedroom-clock', model: 'radio', logic: 'clock@4,2', on: { parent: 'bedroom-clock-table' } },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.75, 4.25] },
    // Escritório-biblioteca: estantes e sofá de leitura a norte, galeria livre
    // até ao quarto, secretária no nicho sul e estante baixa junto ao patamar.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,4', at: [4.3, 0.4] },
    { id: 'study-shelves', model: 'bookcaseClosedWide', against: { wall: 'north', at: 5.1 } },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'north', at: 6.3 }, facing: 'S' },
    { id: 'study-floor-lamp', model: 'lampSquareFloor', at: [7.15, 0.25] },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@1,7', at: [7.55, 1.05], facing: 'S' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase' } },
    { id: 'study-desk', model: 'desk', logic: 'desk@3,4', against: { wall: 'study-gallery-transition', at: 4.55, side: 'N' }, facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    // Casa de banho privativa: banheira contra a parede do quarto, sanita junto
    // à parede do terraço, duche no canto, lavatório e máquina a oeste.
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@5,2', against: { wall: 'bedroom-bath', at: 2.95, side: 'S' } },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@6,3', against: { wall: 'bathroom-hall', at: 6.5, side: 'W' } },
    { id: 'bathroom-shower', model: 'shower', logic: 'shower@7,2', at: [2.5, 7.45], facing: 'S' },
    { id: 'bathroom-washbasin', model: 'bathroomSink', against: { wall: 'west', at: 5.55 } },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 7.5 }, facing: 'E' },
    // Terraço: mesa com rádio e vaso junto à parede, sofá de exterior com mesa
    // baixa e vasos ao longo da guarda.
    { id: 'hall-clock-table', model: 'sideTable', against: { wall: 'bathroom-hall', at: 5.5, side: 'E' }, facing: 'E' },
    { id: 'hall-clock', model: 'radio', logic: 'clock@5,4', on: { parent: 'hall-clock-table' } },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@6,4', at: [4.75, 6.12] },
    { id: 'terrace-sofa', model: 'loungeSofa', against: { wall: 'bathroom-hall', at: 6.95, side: 'E' } },
    { id: 'terrace-table', model: 'tableCoffeeSquare', at: [5.55, 6.95] },
    { id: 'terrace-table-plant', model: 'plantSmall3', on: { parent: 'terrace-table' } },
    { id: 'hall-plant-east', model: 'pottedPlant', logic: 'plant@6,7', at: [7.75, 6.3] },
    { id: 'hall-plant-south', model: 'pottedPlant', logic: 'plant@7,7', at: [7.6, 7.6] },
  ],
  rugs: [
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.9, 3.1], facing: 'E' },
    { id: 'study-rug', model: 'rugRectangle', at: [6.0, 0.7] },
  ],
}
