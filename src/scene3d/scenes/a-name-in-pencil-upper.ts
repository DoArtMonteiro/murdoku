import type { SceneSpec } from '../schema'

// A escada chega a um patamar-sala de leitura. A oeste fica o quarto, com
// porta própria e casa de banho privativa; a norte o estudo, com entradas de
// cada lado do vão; a sul a despensa-copa, com porta para o patamar.
export const aNameInPencilUpper: SceneSpec = {
  puzzleId: 'hard-6',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [3.30625, 0.860625, 4.29375, 3.139375],
  circulation: {
    landing: [3.30625, 3.139375, 4.29375, 3.95],
    halls: [
      { id: 'landing-cross-hall', bounds: [2.5, 3.2, 6.9, 3.95] },
      { id: 'study-entry', bounds: [2.5, 0.9, 3.3, 3.9] },
      { id: 'study-east-link', bounds: [4.45, 1.3, 5.25, 3.95] },
      { id: 'bedroom-door-link', bounds: [1.45, 3.2, 2.6, 3.95] },
      { id: 'west-room-spine', bounds: [1.45, 3.3, 2.2, 5.6] },
      { id: 'pantry-transfer', bounds: [5.9, 3.9, 6.9, 5.6] },
    ],
    roomAccessTargets: [
      { id: 'study-access', bounds: [2.5, 0.9, 3.3, 1.8] },
      { id: 'study-east-access', bounds: [4.45, 1.2, 5.25, 1.9] },
      { id: 'bedroom-access', bounds: [1.45, 3.3, 2.4, 3.95] },
      { id: 'bathroom-access', bounds: [1.3, 5.05, 2.2, 5.6] },
      { id: 'pantry-access', bounds: [6.0, 5.05, 6.9, 5.7] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 0.8, kind: 'window' },
    { wall: 'north', at: 6.6, kind: 'window' },
    { wall: 'west', at: 6.4, kind: 'window' },
  ] },
  floors: [
    { id: 'study', cells: [0, 0, 7, 1], material: 'wood' },
    { id: 'bedroom', cells: [0, 2, 7, 4], material: 'wood' },
    { id: 'bathroom', cells: [0, 5, 4, 7], material: 'tile' },
    { id: 'pantry', cells: [5, 5, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'study-bedroom-west', from: [0, 2], to: [3.30625, 2], height: 'half', openings: [{ at: 2.85, width: 0.9, kind: 'open' }] },
    { id: 'study-bedroom-east', from: [4.29375, 2], to: [8, 2], height: 'half', openings: [{ at: 4.85, width: 0.9, kind: 'open' }] },
    { id: 'bedroom-landing', from: [2.45, 2], to: [2.45, 5], height: 'half', openings: [{ at: 3.6, width: 1.0, kind: 'door' }] },
    { id: 'bedroom-service', from: [0, 5], to: [8, 5], openings: [
      { at: 1.75, width: 1.0, kind: 'door' },
      { at: 6.5, width: 1.2, kind: 'door' },
    ] },
    { id: 'bathroom-pantry', from: [5, 5], to: [5, 8] },
    { id: 'stairwell-west-guard', from: [3.30625, 0.860625], to: [3.30625, 3.0], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east-guard', from: [4.29375, 0.860625], to: [4.29375, 3.0], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [3.30625, 0.860625], to: [4.29375, 0.860625], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Estudo oeste: secretária com cadeira, caixa de arquivo, candeeiro de pé e
    // cómoda sob a janela.
    { id: 'study-lamp-west', model: 'lampRoundFloor', logic: 'lamp@1,0', at: [0.3, 1.7] },
    { id: 'study-box-west', model: 'cardboardBoxClosed', logic: 'box@1,1', at: [1.2, 1.8] },
    { id: 'study-desk-west', model: 'desk', logic: 'desk@1,2', at: [2.15, 1.3], facing: 'W' },
    { id: 'study-chair-west', model: 'chairDesk', at: [1.57, 1.3], facing: 'E' },
    { id: 'study-chest', model: 'sideTableDrawers', against: { wall: 'north', at: 0.8 } },
    { id: 'study-chest-books', model: 'books', on: { parent: 'study-chest' } },
    // Estudo este: caixa junto ao vão, estante baixa, recanto de leitura sob a
    // janela e secretária encostada a este com cadeira.
    { id: 'study-box-north', model: 'cardboardBoxClosed', logic: 'box@0,4', at: [4.85, 0.3] },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@1,5', against: { wall: 'study-bedroom-east', side: 'N', at: 6.0 }, facing: 'N' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-reading-chair', model: 'chairCushion', at: [5.85, 0.55], facing: 'E' },
    { id: 'study-reading-table', model: 'tableCoffeeSquare', at: [6.4, 0.55] },
    { id: 'study-desk-east', model: 'desk', logic: 'desk@1,7', against: { wall: 'east', at: 1.5 } },
    { id: 'study-laptop-east', model: 'laptop', on: { parent: 'study-desk-east' } },
    { id: 'study-chair-east', model: 'chairDesk', at: [6.95, 1.5], facing: 'E' },
    // Quarto: cama encostada a oeste, mesa de cabeceira com candeeiro, cómoda
    // com rádio junto à porta da casa de banho.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'west', at: 2.65 } },
    { id: 'bedroom-lamp-southwest', model: 'cabinetBedDrawerTable', logic: 'lamp@3,0', against: { wall: 'west', at: 3.5 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-lamp-southwest' } },
    { id: 'bedroom-dresser', model: 'sideTableDrawers', against: { wall: 'west', at: 4.45 }, facing: 'E' },
    { id: 'bedroom-clock-west', model: 'radio', logic: 'clock@4,0', on: { parent: 'bedroom-dresser' } },
    // Patamar: tapete, relógio de pé, candeeiro e recanto de leitura a este.
    { id: 'bedroom-rug', model: 'rugRound', logic: 'rug@2,3', at: [4.88, 3.5] },
    { id: 'bedroom-clock-centre', model: 'speaker', logic: 'clock@4,2', at: [2.75, 4.25] },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.75, 4.25] },
    { id: 'landing-table', model: 'tableCoffeeSquare', at: [6.6, 2.6] },
    { id: 'landing-chair-west', model: 'chairCushion', at: [6.05, 2.6], facing: 'E' },
    { id: 'landing-chair-east', model: 'chairCushion', at: [7.2, 2.6], facing: 'W' },
    { id: 'landing-plant', model: 'pottedPlant', at: [7.8, 4.15] },
    // Casa de banho: sanita junto à porta, lavatório e móvel a oeste, banheira
    // e duche na parede sul, segundo duche no canto nordeste.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@5,2', against: { wall: 'bedroom-service', side: 'S', at: 2.55 } },
    { id: 'bathroom-washbasin', model: 'bathroomSink', against: { wall: 'west', at: 5.5 } },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 6.05 }, facing: 'E' },
    { id: 'bathroom-tub', model: 'bathtub', logic: 'bathtub@7,1', at: [2.0, 7.5], facing: 'S' },
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@5,4', at: [4.0, 5.5], facing: 'S' },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@7,3', at: [3.5, 7.5], facing: 'S' },
    // Despensa-copa: frigorífico, bancada, lava-loiça e fogão na parede este,
    // armários a sul.
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@5,7', against: { wall: 'bedroom-service', side: 'S', at: 7.68 }, facing: 'S' },
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@6,7', against: { wall: 'east', at: 6.52 }, facing: 'W' },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter' } },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'east', at: 7.06 }, facing: 'W' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'east', at: 7.6 }, facing: 'W' },
    { id: 'pantry-cabinet-south', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 6.85 } },
    { id: 'pantry-cabinet-south-2', model: 'kitchenCabinet', against: { wall: 'south', at: 6.3 } },
  ],
  rugs: [
    { id: 'bedroom-bed-rug', model: 'rugRectangle', at: [1.2, 2.75], facing: 'E' },
    { id: 'study-rug', model: 'rugSquare', at: [1.6, 1.0] },
  ],
}
