import type { SceneSpec } from '../schema'

export const twoStoreyReferenceUpper: SceneSpec = {
  puzzleId: 'hard-1',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  // O vão e as guardas conservam as cotas medidas do estudo aprovado.
  stairwellBounds: [2.65, 0, 5, 2.6],
  circulation: {
    landing: [5, 0.05, 5.85, 1.1],
    halls: [
      { id: 'east-corridor', bounds: [5.05, 1.1, 5.85, 3.75] },
      { id: 'transverse-hall', bounds: [0.05, 3.75, 7.95, 4.65] },
      { id: 'bathroom-hall', bounds: [3.45, 4.65, 4.3, 7.35] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-door', bounds: [1.2, 2.85, 2.1, 3.85] },
      { id: 'study-door', bounds: [6.4, 2.85, 7.4, 3.85] },
      { id: 'bathroom-door', bounds: [2.9, 6.35, 3.95, 7.25] },
      { id: 'reading-approach', bounds: [4.75, 4.5, 5.65, 5.3] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.8, kind: 'window' },
      { wall: 'north', at: 7, kind: 'window' },
      { wall: 'west', at: 6.5, kind: 'window' },
    ],
  },
  walls: [
    // O quarto fica protegido a este por uma parede completa e abre a sul
    // através de um recorte voltado para a câmara, com porta.
    { id: 'bedroom-east', height: 'full', from: [2.4, 0], to: [2.4, 3.4] },
    { id: 'bedroom-south', height: 'cutaway', from: [0, 3.4], to: [2.4, 3.4], openings: [{ at: 1.65, width: 1, kind: 'door' }] },

    // A chegada permanece aberta junto à guarda original do vão.
    { id: 'study-west', from: [5.05, 1.15], to: [5.05, 2.65], height: 'half', treatment: 'railing', freeEnds: ['from'] },

    // O escritório tem uma entrada própria pelo átrio. A parede oeste usa o
    // recorte específico da divisão para deixar a escada legível na chegada.
    { id: 'office-west', from: [5.9, 0], to: [5.9, 3.7], height: 'room-cutaway' },
    { id: 'office-south', from: [5.9, 3.7], to: [8, 3.7], height: 'cutaway', openings: [{ at: 6.9, width: 1, kind: 'door' }] },

    // O banho fica protegido a norte; a entrada abre para o corredor lateral.
    { id: 'bathroom-north', height: 'full', from: [0, 5.4], to: [3.4, 5.4] },
    { id: 'bathroom-east-private', height: 'full', from: [3.4, 5.4], to: [3.4, 6.1] },
    { id: 'bathroom-east-entry', height: 'cutaway', from: [3.4, 6.1], to: [3.4, 8], openings: [{ at: 6.8, width: 1, kind: 'door' }] },

    // A leitura forma uma sala aberta ao corredor através da porta norte; a
    // parede oeste usa o recorte específico da divisão.
    { id: 'reading-west', from: [4.35, 4.7], to: [4.35, 8], height: 'room-cutaway' },
    { id: 'reading-north', from: [4.35, 4.7], to: [8, 4.7], height: 'cutaway', openings: [{ at: 5.2, width: 1, kind: 'door' }] },

    // Guardas físicas contínuas com leitura visual aberta.
    { id: 'stairwell-west', from: [2.6, 0], to: [2.6, 2.65], height: 'half', treatment: 'railing' },
    { id: 'stairwell-south', from: [2.6, 2.65], to: [5.05, 2.65], height: 'half', treatment: 'railing' },
  ],
  floors: [
    { id: 'bathroom-tile', cells: [0, 6, 2, 7], material: 'tile' },
  ],
  furniture: [
    { id: 'bed', model: 'bedDouble', logic: 'bed@2,0', against: { wall: 'west', at: 2.05 } },
    { id: 'nightstand', model: 'cabinetBedDrawerTable', logic: 'lamp@1,0', against: { wall: 'west', at: 1.1 } },
    { id: 'bedside-lamp', model: 'lampRoundTable', logic: 'lamp@1,0', on: { parent: 'nightstand' } },
    // Quarto: cómoda baixa na parede norte, ao lado da mesa de cabeceira.
    { id: 'bedroom-dresser', model: 'sideTableDrawers', against: { wall: 'north', at: 0.95 } },
    { id: 'bedroom-dresser-books', model: 'books', on: { parent: 'bedroom-dresser' } },

    { id: 'study-desk', model: 'desk', logic: 'desk@1,5', against: { wall: 'office-west', at: 2.05, side: 'E' } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', logic: 'chair@2,6', at: [6.95, 2.05], facing: 'W' },
    { id: 'office-bookcase', model: 'bookcaseOpenLow', against: { wall: 'north', at: 7.5 } },
    // Estudo: sofá de leitura na parede este, sobre tapete redondo.
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'east', at: 1.05 }, facing: 'W' },
    { id: 'study-shelf-plant', model: 'plantSmall1', on: { parent: 'office-bookcase' } },

    { id: 'bath', model: 'bathtub', logic: 'bathtub@6,0', against: { wall: 'west', at: 6.75 } },
    { id: 'bathroom-basin', model: 'bathroomSink', against: { wall: 'bathroom-north', at: 2.2, side: 'S' } },
    { id: 'toilet', model: 'toilet', logic: 'toilet@7,2', against: { wall: 'south', at: 2.08 } },
    // Banho: máquina de lavar e cesto na parede norte, entre a banheira e o lavatório.
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'bathroom-north', at: 1.15, side: 'S' } },
    { id: 'bathroom-bin', model: 'trashcan', at: [1.65, 5.62] },

    { id: 'landing-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@5,7', against: { wall: 'east', at: 5.5 } },
    { id: 'landing-books', model: 'books', on: { parent: 'landing-bookcase' } },
    { id: 'reading-sofa', model: 'loungeSofa', against: { wall: 'reading-west', at: 6.05, side: 'E' } },
    { id: 'reading-table', model: 'tableCoffeeSquare', at: [5.7, 6.05] },
    { id: 'landing-chair', model: 'loungeChair', at: [6.8, 6.05], facing: 'W' },
    { id: 'landing-plant', model: 'pottedPlant', logic: 'plant@6,6', at: [6.95, 6.95], facing: 'S' },
    { id: 'landing-console', model: 'sideTable', logic: 'clock@7,7', against: { wall: 'east', at: 7.4 } },
    { id: 'landing-clock', model: 'radio', logic: 'clock@7,7', on: { parent: 'landing-console' } },
  ],
  rugs: [
    { id: 'bedroom-rug', model: 'rugRectangle', at: [1.05, 2.55], facing: 'E' },
    { id: 'study-rug', model: 'rugRound', at: [6.95, 1.1] },
    { id: 'landing-reading-rug', model: 'rugRectangle', at: [5.7, 6.05], facing: 'S' },
  ],
}
