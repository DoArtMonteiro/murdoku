import type { SceneSpec } from '../schema'

// A escada sobe para oeste ao longo da fachada sul do rés-do-chão e chega a
// um patamar entre o escritório e a casa de banho. Do patamar parte, a norte,
// um átrio de serviço que serve o escritório, a casa de banho e a cozinha em
// galé; a sul, uma abertura leva à galeria de estar e ao quarto.
export const roomWithoutADoorUpper: SceneSpec = {
  puzzleId: 'hard-4',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: [3.210625, 3.86625, 5.489375, 4.85375],
  circulation: {
    landing: [2.35, 3.86625, 3.210625, 4.85375],
    halls: [
      { id: 'service-hall', bounds: [2.35, 2.05, 3.9, 3.72] },
      { id: 'landing-hall', bounds: [2.35, 2.05, 3.15, 4.93] },
      { id: 'gallery-north', bounds: [0.05, 5.05, 4.92, 5.98] },
      { id: 'bedroom-approach', bounds: [4.0, 5.05, 4.92, 7.95] },
    ],
    roomAccessTargets: [
      { id: 'study-door', bounds: [1.8, 2.6, 2.75, 3.4] },
      { id: 'kitchen-door', bounds: [3.1, 1.45, 3.85, 2.4] },
      { id: 'bathroom-door', bounds: [3.3, 2.9, 4.55, 3.7] },
      { id: 'gallery-door', bounds: [2.4, 4.6, 3.15, 5.4] },
      { id: 'bedroom-door', bounds: [4.4, 7.05, 5.6, 7.85] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 5.6, kind: 'window' },
    { wall: 'west', at: 6.9, kind: 'window' },
  ] },
  floors: [
    { id: 'study-floor', cells: [0, 0, 2, 4], material: 'wood' },
    { id: 'kitchen-floor', cells: [3, 0, 7, 1], material: 'tile' },
    { id: 'bathroom-floor', cells: [4, 2, 7, 4], material: 'tile' },
    { id: 'service-corridor-floor', cells: [3, 2, 3, 4], material: 'wood' },
    { id: 'bedroom-floor', cells: [0, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'study-service-wall', from: [3, 0], to: [3, 2], height: 'half' },
    { id: 'study-hall-jog', from: [2.3, 2], to: [3, 2], height: 'half' },
    { id: 'study-east-wall', from: [2.3, 2], to: [2.3, 5], height: 'half', openings: [{ at: 3.0, width: 0.85, kind: 'door' }] },
    { id: 'kitchen-bathroom-wall', from: [3, 2], to: [8, 2], height: 'half', openings: [{ at: 3.475, width: 0.85, kind: 'door' }] },
    { id: 'corridor-bathroom', from: [3.95, 2], to: [3.95, 3.78625], height: 'half', openings: [{ at: 3.3, width: 0.8, kind: 'door' }] },
    { id: 'bathroom-stair-wall', from: [3.95, 3.78625], to: [5.569375, 3.78625], height: 'half' },
    { id: 'bathroom-stair-east', from: [5.569375, 3.78625], to: [5.569375, 5], height: 'half' },
    { id: 'bedroom-north-wall', from: [0, 5], to: [8, 5], height: 'half', openings: [
      { at: 2.78, width: 0.8, kind: 'open' },
    ] },
    { id: 'bedroom-west', from: [5, 5], to: [5, 8], height: 'half', openings: [{ at: 7.45, width: 0.9, kind: 'door' }] },
    // Divisória entre as duas sanitas.
    { id: 'wc-divider', from: [5.45, 2], to: [5.45, 3.0], height: 'half', freeEnds: ['to'] },
    { id: 'stairwell-north-guard', from: [3.210625, 3.78625], to: [3.95, 3.78625], height: 'half', treatment: 'railing', freeEnds: ['from'] },
  ],
  furniture: [
    // Escritório: duas secretárias lado a lado na parede oeste com as cadeiras,
    // estante alta a separar o canto de leitura, cadeirão de leitura sob a janela.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,0', at: [0.4, 0.4] },
    { id: 'study-bookcase', model: 'bookcaseOpen', logic: 'bookshelf@1,2', at: [2.45, 1.2], facing: 'S' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase', surface: 'shelf2' } },
    { id: 'study-desk-north', model: 'desk', logic: 'desk@2,0', at: [0.5, 2.5], facing: 'E' },
    { id: 'study-desk-south', model: 'desk', logic: 'desk@3,0', at: [0.5, 3.5], facing: 'E' },
    { id: 'study-chair-north', model: 'chairDesk', at: [1.05, 2.5], facing: 'W' },
    { id: 'study-chair-south', model: 'chairDesk', at: [1.05, 3.5], facing: 'W' },
    { id: 'study-reading-chair', model: 'loungeChair', at: [1.45, 0.5], facing: 'S' },
    { id: 'study-lamp-south', model: 'lampRoundFloor', logic: 'lamp@4,1', at: [1.3, 4.6] },
    // Cozinha em galé: lava-loiça, fogão e armários a norte; placa, frigorífico
    // e armário a sul, de costas para a casa de banho.
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'north', at: 5.3 } },
    { id: 'kitchen-cabinet', model: 'kitchenCabinet', against: { wall: 'north', at: 5.85 } },
    { id: 'kitchen-stove-north', model: 'kitchenStove', logic: 'stove@0,6', against: { wall: 'north', at: 6.5 } },
    { id: 'kitchen-cabinet-east', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 7.05 } },
    { id: 'kitchen-cabinet-corner', model: 'kitchenCabinet', against: { wall: 'north', at: 7.6 } },
    { id: 'kitchen-stove-south', model: 'kitchenStoveElectric', logic: 'stove@1,4', against: { wall: 'kitchen-bathroom-wall', side: 'N', at: 4.5 }, facing: 'N' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@1,5', against: { wall: 'kitchen-bathroom-wall', side: 'N', at: 5.3 }, facing: 'N' },
    { id: 'kitchen-cabinet-south', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-bathroom-wall', side: 'N', at: 6.1 }, facing: 'N' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-south' } },
    // Casa de banho: duas sanitas separadas por divisória na parede norte,
    // dois duches, banheira e lavatório junto à porta do corredor.
    { id: 'bathroom-toilet-west', model: 'toilet', logic: 'toilet@2,4', against: { wall: 'kitchen-bathroom-wall', side: 'S', at: 4.7 } },
    { id: 'bathroom-toilet-east', model: 'toilet', logic: 'toilet@2,6', against: { wall: 'kitchen-bathroom-wall', side: 'S', at: 6.2 } },
    { id: 'bathroom-washbasin', model: 'bathroomSink', against: { wall: 'corridor-bathroom', side: 'E', at: 2.45 }, facing: 'E' },
    { id: 'bathroom-shower-north', model: 'shower', logic: 'shower@2,7', at: [7.3, 2.5], facing: 'E' },
    { id: 'bathroom-shower-south', model: 'shower', logic: 'shower@4,6', at: [6.5, 3.8], facing: 'E' },
    { id: 'bathroom-tub', model: 'bathtub', against: { wall: 'bedroom-north-wall', side: 'N', at: 7.2 }, facing: 'N' },
    // Galeria de estar: tapete à saída do patamar, sofá a oeste virado para
    // uma mesa baixa com cadeirões, consola com rádio a sul.
    { id: 'bedroom-rug', model: 'rugDoormat', logic: 'rug@5,3', at: [3.6, 5.5] },
    { id: 'gallery-sofa', model: 'loungeSofa', against: { wall: 'west', at: 6.85 }, facing: 'E' },
    { id: 'gallery-coffee-table', model: 'tableCoffee', at: [1.35, 6.85], facing: 'E' },
    { id: 'gallery-armchair-north', model: 'loungeChair', at: [2.35, 6.5], facing: 'W' },
    { id: 'gallery-armchair-south', model: 'loungeChair', at: [2.35, 7.3], facing: 'W' },
    { id: 'gallery-floor-lamp', model: 'lampRoundFloor', at: [0.3, 7.75] },
    { id: 'bedroom-clock-west-table', model: 'sideTable', at: [1.5, 7.65] },
    { id: 'bedroom-clock-west', model: 'radio', logic: 'clock@7,1', on: { parent: 'bedroom-clock-west-table' } },
    // Quarto: cama com cabeceira na parede norte e mesas de cabeceira,
    // candeeiros de pé e cómoda com rádio no canto sudeste.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'bedroom-north-wall', side: 'S', at: 6.5 } },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', against: { wall: 'bedroom-north-wall', side: 'S', at: 5.55 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-nightstand-east', model: 'cabinetBedDrawerTable', against: { wall: 'bedroom-north-wall', side: 'S', at: 7.45 } },
    { id: 'bedroom-bedside-lamp-east', model: 'lampSquareTable', on: { parent: 'bedroom-nightstand-east' } },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@6,7', at: [7.75, 6.25] },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@7,6', at: [6.25, 7.75] },
    { id: 'bedroom-clock-east-table', model: 'sideTable', against: { wall: 'east', at: 7.55 }, facing: 'W' },
    { id: 'bedroom-clock-east', model: 'radio', logic: 'clock@7,7', on: { parent: 'bedroom-clock-east-table' } },
  ],
  rugs: [
    { id: 'study-rug', model: 'rugRectangle', at: [1.15, 3.0], facing: 'E' },
    { id: 'gallery-rug', model: 'rugRectangle', at: [1.6, 6.85], facing: 'E' },
    { id: 'bedroom-bed-rug', model: 'rugRectangle', at: [6.5, 6.6] },
  ],
}
