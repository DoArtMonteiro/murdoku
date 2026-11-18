import type { SceneSpec } from '../schema'

// O piso superior reúne o quarto a oeste, um átrio central, o escritório com
// a escada a nordeste e a casa de banho fechada a sudeste, com porta para o átrio.
export const theLastTrainUpper: SceneSpec = {
  puzzleId: 'hard-3',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [5.25625, 0.860625, 6.24375, 3.139375],
  circulation: {
    landing: [5.25625, 3.139375, 6.24375, 3.889375],
    halls: [
      { id: 'study-link', bounds: [3.1, 3.139375, 6.02, 3.95] },
      { id: 'hall-north', bounds: [3.75, 0.5, 4.5, 1.7] },
      { id: 'clock-bypass', bounds: [3.75, 1.7, 4.5, 3.95] },
      { id: 'hall-south', bounds: [3.0, 3.2, 3.9, 7.1] },
      { id: 'kitchen-transfer', bounds: [3.1, 0.5, 4.8, 1.4] },
      { id: 'kitchen-branch', bounds: [4.0, 0.1, 5.9, 0.85] },
      { id: 'bedroom-branch', bounds: [3.0, 5.3, 4.57, 6.1] },
      { id: 'bathroom-branch', bounds: [3.1, 5.1, 5.9, 5.85] },
    ],
    roomAccessTargets: [
      { id: 'study-door', bounds: [5.05, 3.2, 5.9, 3.95] },
      { id: 'hall-door', bounds: [3.1, 3.95, 3.85, 4.7] },
      { id: 'kitchen-door', bounds: [5.05, 0.1, 5.8, 0.85] },
      { id: 'bedroom-door', bounds: [3.0, 5.3, 3.85, 6.1] },
      { id: 'bathroom-door', bounds: [5.05, 5.1, 5.9, 5.85] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.5, kind: 'window' },
    { wall: 'north', at: 6.7, kind: 'window' },
    { wall: 'west', at: 6.5, kind: 'window' },
  ] },
  floors: [
    { id: 'bedroom-floor', cells: [0, 0, 2, 7], material: 'wood' },
    { id: 'upper-hall-floor', cells: [3, 0, 4, 7], material: 'wood' },
    { id: 'study-floor', cells: [5, 0, 7, 3], material: 'wood' },
    { id: 'bathroom-floor', cells: [5, 4, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'bedroom-hall', from: [3, 0], to: [3, 8], height: 'half', openings: [
      { at: 5.7, width: 1.2, kind: 'door' },
    ] },
    { id: 'hall-east-north', from: [5, 0], to: [5, 2.4], height: 'half', openings: [{ at: 0.65, width: 1.2, kind: 'door' }], freeEnds: ['to'] },
    { id: 'hall-east-south', from: [5, 4.0], to: [5, 8], height: 'half', freeEnds: ['from'], openings: [
      { at: 5.4, width: 1.2, kind: 'door' },
    ] },
    { id: 'study-bathroom', from: [5, 4], to: [8, 4], height: 'half' },
    { id: 'stairwell-west-guard', from: [5.25625, 0.95], to: [5.25625, 2.95], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [6.24375, 0.95], to: [6.24375, 2.95], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-north-guard', from: [6.1, 0.780625], to: [6.24375, 0.780625], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
  ],
  furniture: [
    // Quarto: roupeiro e candeeiro a norte, cama encostada a oeste sobre o
    // tapete com duas mesas de cabeceira, recanto de leitura sob a janela oeste
    // e, a sul, relógio de pé, candeeiro e cómoda com rádio.
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'west', at: 1.0 }, facing: 'E' },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@0,0', at: [0.75, 0.3] },
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'west', at: 3.0 } },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', against: { wall: 'west', at: 2.05 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-nightstand-south', model: 'cabinetBedDrawerTable', against: { wall: 'west', at: 3.95 } },
    { id: 'bedroom-bedside-lamp-south', model: 'lampSquareTable', on: { parent: 'bedroom-nightstand-south' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@2,0', at: [1.0, 3.0], facing: 'E' },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'west', at: 5.9 }, facing: 'E' },
    { id: 'bedroom-coffee-table', model: 'tableCoffeeSquare', at: [1.25, 5.9] },
    { id: 'bedroom-clock-west', model: 'speaker', logic: 'clock@7,0', at: [0.3, 7.65] },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,1', at: [1.75, 7.25] },
    { id: 'bedroom-clock-east-table', model: 'sideTable', against: { wall: 'bedroom-hall', at: 7.35, side: 'W' }, facing: 'W' },
    { id: 'bedroom-clock-east', model: 'radio', logic: 'clock@7,2', on: { parent: 'bedroom-clock-east-table' } },
    // Átrio: vasos e rádios ao longo das paredes, centro livre para circular.
    { id: 'hall-plant-north', model: 'pottedPlant', logic: 'plant@0,3', at: [3.2, 0.3] },
    { id: 'hall-plant-east', model: 'flower_purpleA', logic: 'plant@1,4', at: [4.65, 1.6] },
    { id: 'hall-clock-west-table', model: 'sideTable', at: [3.4, 2.05] },
    { id: 'hall-clock-west', model: 'radio', logic: 'clock@2,3', on: { parent: 'hall-clock-west-table' } },
    { id: 'hall-clock-east', model: 'speaker', logic: 'clock@2,4', at: [4.8, 2.6] },
    { id: 'hall-plant-south', model: 'pottedPlant', logic: 'plant@6,4', at: [4.3, 6.6] },
    // Escritório: secretária no canto nordeste com portátil e candeeiro,
    // estante baixa sob a janela, sofá de leitura na parede este e caixa.
    { id: 'study-desk', model: 'desk', logic: 'desk@0,7', at: [7.45, 0.5], facing: 'W' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-shelf', model: 'bookcaseOpenLow', against: { wall: 'north', at: 6.65 } },
    { id: 'study-shelf-books', model: 'books', on: { parent: 'study-shelf' } },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'east', at: 2.25 }, facing: 'W' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@3,7', at: [7.35, 3.5] },
    // Casa de banho: máquina no canto nordeste, sanita a este, banheira a sul,
    // lavatório a norte e cesto junto à parede do átrio.
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@7,6', against: { wall: 'south', at: 7.0 }, facing: 'N' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@5,7', at: [7.35, 5.45], facing: 'W' },
    { id: 'bathroom-washbasin', model: 'bathroomSink', against: { wall: 'study-bathroom', side: 'S', at: 6.2 } },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'study-bathroom', side: 'S', at: 7.5 } },
    { id: 'bathroom-bin', model: 'trashcan', at: [5.3, 7.0] },
  ],
}
