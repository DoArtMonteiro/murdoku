import type { SceneSpec } from '../schema'

// A escada chega a um átrio transversal aberto sobre o estudo. Uma porta a
// norte dá para a galeria do corredor; o quarto tem porta própria e a casa de
// banho é privativa, com zona de banho a oeste e sanitas e lavatório a este.
export const theColdKettleUpper: SceneSpec = {
  puzzleId: 'hard-5',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [5.60625, 0.860625, 6.59375, 3.139375],
  circulation: {
    landing: [5.60625, 3.139375, 6.59375, 3.95],
    halls: [
      { id: 'study-cross-hall', bounds: [0.9, 3.2, 7.5, 3.95] },
      { id: 'study-door-link', bounds: [4.1, 1.3, 5.1, 3.95] },
      { id: 'north-gallery', bounds: [0.9, 0.65, 5.05, 1.4] },
      { id: 'east-hall-branch', bounds: [6.7, 0.6, 7.5, 3.95] },
      { id: 'bedroom-access-hall', bounds: [2.2, 3.5, 3.0, 5.2] },
      { id: 'bedroom-cross-hall', bounds: [2.2, 4.35, 6.2, 5.1] },
      { id: 'bathroom-transfer', bounds: [5.2, 4.35, 6.1, 6.8] },
    ],
    roomAccessTargets: [
      { id: 'hallway-west-access', bounds: [1.0, 0.65, 1.8, 1.4] },
      { id: 'hallway-east-access', bounds: [6.7, 0.6, 7.5, 1.35] },
      { id: 'study-access', bounds: [0.9, 2.45, 1.9, 3.25] },
      { id: 'bedroom-access', bounds: [2.2, 4.2, 3.0, 4.95] },
      { id: 'bathroom-access', bounds: [5.3, 6.2, 6.1, 6.9] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 6.7, kind: 'window' },
    { wall: 'west', at: 2.6, kind: 'window' },
    { wall: 'west', at: 6.5, kind: 'window' },
  ] },
  floors: [
    { id: 'hallway', cells: [0, 0, 7, 1], material: 'wood' },
    { id: 'study', cells: [0, 2, 7, 3], material: 'wood' },
    { id: 'bedroom', cells: [0, 4, 7, 5], material: 'wood' },
    { id: 'bathroom', cells: [0, 6, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'hall-study-west', from: [0, 2], to: [5.60625, 2], openings: [{ at: 4.6, width: 1.2, kind: 'door' }] },
    { id: 'hall-study-east', from: [6.59375, 2], to: [8, 2], openings: [{ at: 7.25, width: 1.2, kind: 'open' }] },
    { id: 'study-bedroom', from: [0, 4], to: [8, 4], openings: [{ at: 2.6, width: 1.2, kind: 'door' }] },
    { id: 'bedroom-bathroom', from: [0, 6], to: [8, 6], openings: [{ at: 5.7, width: 1.2, kind: 'door' }] },
    // Divisória baixa entre as duas sanitas, com parede de apoio atrás da sanita sul.
    { id: 'wc-stalls', from: [4.0, 7], to: [4.0, 8], height: 'half' },
    { id: 'wc-stall-divider', from: [4.0, 7], to: [4.9, 7], height: 'half', freeEnds: ['to'] },
    { id: 'stairwell-west-guard', from: [5.60625, 0.860625], to: [5.60625, 3.0], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east-guard', from: [6.59375, 0.860625], to: [6.59375, 3.0], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [5.60625, 0.860625], to: [6.59375, 0.860625], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Galeria norte: consola, relógio de pé e vasos; recanto de leitura com sofá
    // sobre o tapete a este.
    { id: 'hallway-console', model: 'sideTableDrawers', against: { wall: 'north', at: 0.5 } },
    { id: 'hallway-console-lamp', model: 'lampRoundTable', on: { parent: 'hallway-console' } },
    { id: 'hallway-clock', model: 'speaker', logic: 'clock@0,2', at: [2.5, 0.4] },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@0,3', at: [3.75, 0.3] },
    { id: 'hallway-plant-south', model: 'pottedPlant', logic: 'plant@1,5', at: [5.4, 1.3] },
    { id: 'hallway-rug', model: 'rugRectangle', logic: 'rug@0,6', at: [7.2, 1.0], facing: 'E' },
    { id: 'hallway-sofa', model: 'loungeSofa', against: { wall: 'north', at: 7.25 }, facing: 'S' },
    // Estudo: estante larga, cadeirão de leitura, secretária com cadeira,
    // caixa de arquivo junto à guarda e candeeiro de pé no canto.
    { id: 'study-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@2,0', against: { wall: 'hall-study-west', side: 'S', at: 1.0 }, facing: 'S' },
    { id: 'study-reading-chair', model: 'loungeChair', at: [2.2, 2.55], facing: 'W' },
    { id: 'study-desk', model: 'desk', logic: 'desk@2,3', against: { wall: 'hall-study-west', side: 'S', at: 3.3 } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-desk-chair', model: 'chairDesk', at: [3.25, 2.85], facing: 'N' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@2,5', at: [5.35, 2.75] },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@2,7', at: [7.84, 2.72] },
    // Quarto: cama encostada a oeste com mesa de cabeceira, roupeiro e
    // cadeirão a este, relógio de pé entre o cadeirão e a porta do banho.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@4,0', against: { wall: 'west', at: 5.25 } },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', against: { wall: 'west', at: 4.3 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@4,3', at: [4.0, 5.0], facing: 'E' },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'study-bedroom', side: 'S', at: 7.3 }, facing: 'S' },
    { id: 'bedroom-clock', model: 'speaker', logic: 'clock@5,6', at: [6.75, 5.3] },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [7.45, 5.35], facing: 'W' },
    // Casa de banho: banheira e duche na parede sul, lavatório e móvel a oeste;
    // sanitas a seguir à divisória, lavatório duplo e máquina a este.
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@7,1', at: [2.0, 7.5], facing: 'S' },
    { id: 'bathroom-shower', model: 'shower', logic: 'shower@7,3', at: [3.5, 7.5], facing: 'S' },
    { id: 'bathroom-washbasin-west', model: 'bathroomSink', against: { wall: 'west', at: 6.55 } },
    { id: 'bathroom-toilet-south', model: 'toilet', logic: 'toilet@7,4', against: { wall: 'wc-stalls', side: 'E', at: 7.5 } },
    { id: 'bathroom-toilet-north', model: 'toilet', logic: 'toilet@6,4', against: { wall: 'bedroom-bathroom', side: 'S', at: 4.5 } },
    { id: 'bathroom-washbasin', model: 'bathroomSink', against: { wall: 'bedroom-bathroom', side: 'S', at: 7.0 } },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'east', at: 7.3 }, facing: 'W' },
  ],
}
