import type { SceneSpec } from '../schema'

export const theOpenWindowUpper: SceneSpec = {
  puzzleId: 'expert-1',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [6.10625, 2.360625, 7.09375, 4.639375],
  circulation: {
    // A escada chega a sul, no escritório; a galeria da sala de jantar distribui
    // para o quarto, a casa de banho e o WC, sem atravessar a mesa.
    landing: [6.10625, 4.639375, 7.09375, 5.6],
    halls: [
      { id: 'study-west-link', bounds: [5.05, 4.75, 6.10625, 5.6] },
      { id: 'garden-gallery', bounds: [1.12, 4.08, 6, 4.95] },
      { id: 'bedroom-lane', bounds: [1.12, 2.3, 1.98, 4.95] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-approach', bounds: [1.15, 2.3, 1.95, 3.0] },
      { id: 'study-approach', bounds: [5.05, 4.15, 5.8, 4.9] },
      { id: 'dining-approach', bounds: [2.3, 4.08, 3.2, 4.9] },
      { id: 'bathroom-approach', bounds: [1.1, 4.15, 1.9, 5.6] },
      { id: 'wc-approach', bounds: [4.05, 4.15, 4.75, 5.6] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 4.4, kind: 'window' },
      { wall: 'north', at: 7.2, kind: 'window' },
      { wall: 'west', at: 1.2, kind: 'window' },
    ],
  },
  floors: [
    { id: 'bedroom-wood', cells: [0, 0, 7, 2], material: 'wood' },
    { id: 'dining-wood', cells: [0, 3, 4, 4], material: 'wood' },
    { id: 'study-wood', cells: [5, 3, 7, 7], material: 'wood' },
    { id: 'bathroom-tile', cells: [0, 5, 4, 7], material: 'tile' },
  ],
  walls: [
    { id: 'bedroom-dining', from: [0, 3], to: [5, 3], height: 'half', openings: [{ at: 1.55, width: 0.9, kind: 'door' }] },
    { id: 'bedroom-study-west', from: [5, 3], to: [6.10625, 3], height: 'cutaway', freeEnds: ['to'] },
    { id: 'bedroom-study-east', from: [7.09375, 3], to: [8, 3], height: 'cutaway', freeEnds: ['from'] },
    {
      id: 'study-dining',
      from: [5, 3],
      to: [5, 5],
      height: 'half',
      openings: [{ at: 4.5, width: 1.0, kind: 'open' }],
    },
    // Casa de banho e WC separados, ambos com porta para a galeria.
    {
      id: 'bathroom-north',
      from: [0, 5],
      to: [5, 5],
      height: 'half',
      openings: [
        { at: 1.5, width: 0.9, kind: 'door' },
        { at: 4.4, width: 0.8, kind: 'door' },
      ],
    },
    { id: 'bathroom-east', from: [5, 5], to: [5, 8], height: 'half' },
    { id: 'wc-west', from: [3, 5], to: [3, 6.4], height: 'half' },
    { id: 'wc-south', from: [3, 6.4], to: [5, 6.4], height: 'half' },
    // As guardas acompanham o vão; a extremidade sul fica aberta para a chegada.
    { id: 'stairwell-west', from: [6.05, 2.3], to: [6.05, 4.64], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-east', from: [7.15, 2.3], to: [7.15, 4.64], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-north', from: [6.05, 2.3], to: [7.15, 2.3], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Quarto: cama sobre o tapete com mesa e candeeiro de cabeceira, televisão aos pés,
    // poltrona de leitura junto à janela e recanto de estar com cómoda a nascente.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'north', at: 2.0 } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@0,1', at: [2, 1], facing: 'E' },
    { id: 'bedroom-nightstand', model: 'tableCoffeeSquare', at: [0.98, 0.32] },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@0,3', at: [3.15, 0.3], facing: 'S' },
    { id: 'bedroom-armchair-west', model: 'loungeChair', at: [0.4, 1.85], facing: 'E' },
    { id: 'bedroom-lamp-west', model: 'lampRoundFloor', logic: 'lamp@2,0', at: [0.35, 2.6], facing: 'S' },
    { id: 'bedroom-tv-console', model: 'cabinetTelevision', against: { wall: 'bedroom-dining', side: 'N', at: 3.2 }, facing: 'N' },
    { id: 'bedroom-tv', model: 'televisionVintage', on: { parent: 'bedroom-tv-console' }, facing: 'N' },
    { id: 'bedroom-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'north', at: 5.75 } },
    { id: 'bedroom-dresser-speaker', model: 'speakerSmall', on: { parent: 'bedroom-dresser' } },
    { id: 'bedroom-armchair-a', model: 'loungeChair', at: [4.9, 1.45], facing: 'E' },
    { id: 'bedroom-armchair-b', model: 'loungeChair', at: [6.3, 1.45], facing: 'W' },
    { id: 'bedroom-side-table', model: 'tableCoffeeSquare', at: [5.6, 1.45] },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@0,7', at: [7.6, 0.3], facing: 'S' },
    { id: 'bedroom-clock-spine', model: 'speaker', logic: 'clock@2,5', at: [5.5, 2.55], facing: 'S' },
    // Escritório: caixas arrumadas junto ao vão, secretária de escrita a nascente,
    // secretária principal a sul com estantes baixas e poltrona de leitura.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@3,5', at: [5.35, 3.3], facing: 'S' },
    { id: 'study-box-open', model: 'cardboardBoxOpen', at: [5.75, 3.35], facing: 'S' },
    { id: 'study-desk-north', model: 'desk', logic: 'desk@3,7', against: { wall: 'east', at: 3.5 }, facing: 'W' },
    { id: 'study-desk-north-laptop', model: 'laptop', on: { parent: 'study-desk-north' }, facing: 'W' },
    { id: 'study-desk-north-stool', model: 'stoolBarSquare', at: [7.33, 3.5], facing: 'E' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@4,7', at: [7.55, 4.6], facing: 'S' },
    { id: 'study-desk-south', model: 'desk', logic: 'desk@7,6', at: [6.5, 7.6], facing: 'N' },
    { id: 'study-desk-south-chair', model: 'chairDesk', at: [6.5, 6.95], facing: 'S' },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@6,7', against: { wall: 'east', at: 6.5 }, facing: 'W' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase' } },
    { id: 'study-bookcase-south', model: 'bookcaseOpenLow', logic: 'bookshelf@6,7', against: { wall: 'east', at: 7.4 }, facing: 'W' },
    { id: 'study-armchair', model: 'loungeChair', at: [5.45, 6.1], facing: 'E' },
    { id: 'study-armchair-table', model: 'tableCoffeeSquare', at: [5.45, 6.75] },
    // Sala de jantar: mesa comprida encostada ao quarto, cadeiras a sul e à cabeceira;
    // a galeria fica livre entre a escada e as portas.
    { id: 'dining-table', model: 'table', logic: 'table@3,1', against: { wall: 'bedroom-dining', side: 'S', at: 2.7 } },
    { id: 'dining-table-extension', model: 'table', against: { wall: 'bedroom-dining', side: 'S', at: 3.76 } },
    { id: 'dining-chair-a', model: 'chair', at: [2.45, 3.9], facing: 'N' },
    { id: 'dining-chair-west', model: 'chair', logic: 'chair@3,3', at: [3.3, 3.9], facing: 'N' },
    { id: 'dining-chair-b', model: 'chair', at: [4.0, 3.9], facing: 'N' },
    { id: 'dining-chair-east', model: 'chair', logic: 'chair@3,4', at: [4.6, 3.36], facing: 'W' },
    // Casa de banho: lavatório e máquina a poente, sanita, duche e banheira a sul.
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'west', at: 5.75 }, facing: 'E' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 6.5 }, facing: 'E' },
    { id: 'bathroom-toilet-south', model: 'toilet', logic: 'toilet@7,1', against: { wall: 'south', at: 1.4 }, facing: 'N' },
    { id: 'bathroom-trashcan', model: 'trashcan', at: [0.45, 7.6] },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@7,2', at: [2.5, 7.6], facing: 'S' },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@7,3', against: { wall: 'south', at: 4.0 }, facing: 'N' },
    // WC: sanita e lavatório num compartimento próprio.
    { id: 'bathroom-toilet-north', model: 'toilet', logic: 'toilet@5,3', against: { wall: 'wc-west', side: 'E', at: 5.7 }, facing: 'E' },
    { id: 'wc-sink', model: 'bathroomSink', against: { wall: 'wc-south', side: 'N', at: 4.4 }, facing: 'N' },
  ],
  rugs: [
    { id: 'bedroom-nook-rug', model: 'rugRound', at: [5.6, 1.45] },
    { id: 'dining-rug', model: 'rugRectangle', at: [3.3, 3.62] },
    { id: 'bathroom-mat', model: 'rugRectangle', at: [1.6, 6.3], facing: 'E' },
    { id: 'study-rug', model: 'rugRound', at: [6.5, 6.4] },
  ],
}
