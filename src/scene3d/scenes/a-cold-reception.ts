import type { SceneSpec } from '../schema'

// Casa em L com um alpendre exterior, escritório e sala de jantar.
export const aColdReception: SceneSpec = {
  puzzleId: 'very-easy-8',
  floor: 0,
  entry: { wall: 'west', at: 4.7 },
  shell: {
    features: [
      { wall: 'north', at: 4.8, kind: 'window' },
    ],
  },
  floors: [
    { id: 'open-porch', cells: [0, 0, 2, 2], material: 'stone', kind: 'exterior' },
    { id: 'office', cells: [3, 0, 5, 2], material: 'wood', kind: 'interior' },
    { id: 'dining-room', cells: [0, 3, 5, 5], material: 'wood', kind: 'interior' },
  ],
  walls: [
    // A fachada a nascente protege o escritório; o lado exposto do alpendre
    // mantém-se aberto para o exterior. Passagens abertas, sem caixilhos soltos.
    { id: 'porch-office', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 1.25, width: 1, kind: 'open' }] },
    { id: 'porch-dining', from: [0, 3], to: [3, 3], height: 'half', openings: [{ at: 1.45, width: 1.2, kind: 'open' }] },
    { id: 'office-dining', from: [3, 3], to: [6, 3], height: 'half', openings: [{ at: 5.4, kind: 'door' }] },
  ],
  furniture: [
    // Alpendre: a cadeira de Bella com uma mesinha ao lado; vegetação no bordo.
    { id: 'porch-chair', model: 'chair', logic: 'chair@0,0', at: [0.5, 0.5], facing: 'E' },
    { id: 'porch-table', model: 'tableCoffeeSquare', at: [1.0, 0.5], facing: 'E' },
    { id: 'porch-shrub', model: 'plant_bushSmall', logic: 'plant@2,0', at: [0.35, 2.0], yaw: -12 },
    { id: 'porch-flower', model: 'flower_yellowA', at: [2.5, 0.4], yaw: 8 },
    { id: 'porch-flower-b', model: 'flower_redA', at: [2.75, 0.6], yaw: -8 },
    // Escritório: estante alta e estante baixa na parede norte, secretária contra a meia parede,
    // relógio-rádio numa consola encostada à parede da sala de jantar. Sem cadeiras decorativas:
    // «chair» é vocabulário das pistas.
    { id: 'office-bookcase-tall', model: 'bookcaseOpen', against: { wall: 'north', at: 3.45 } },
    { id: 'office-desk', model: 'desk', logic: 'desk@2,3', against: { wall: 'porch-office', side: 'E', at: 2.3 } },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-clock-table', model: 'sideTable', against: { wall: 'office-dining', side: 'N', at: 4.5 } },
    { id: 'office-clock', model: 'radio', logic: 'clock@2,4', on: { parent: 'office-clock-table' } },
    { id: 'office-bookcase', model: 'bookcaseOpenLow', against: { wall: 'north', at: 5.6 } },
    { id: 'office-books', model: 'books', on: { parent: 'office-bookcase', surface: 'top' } },
    { id: 'office-plant', model: 'pottedPlant', at: [5.7, 1.4] },
    // Sala de jantar: mesa sobre o tapete lógico com cadeira à cabeceira, candeeiro e aparador
    // a sul; recanto de estar a oeste junto à porta de entrada.
    { id: 'dining-table', model: 'table', at: [4.65, 3.95], facing: 'E' },
    { id: 'dining-chair-east', model: 'chair', logic: 'chair@3,5', at: [5.4, 3.95], facing: 'W' },
    { id: 'dining-rug', model: 'rugRectangle', logic: 'rug@3,3', at: [4, 4] },
    { id: 'dining-lamp-table', model: 'sideTable', logic: 'lamp@5,3', against: { wall: 'south', at: 3.45 } },
    { id: 'dining-lamp', model: 'lampRoundTable', logic: 'lamp@5,3', on: { parent: 'dining-lamp-table' } },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'south', at: 5.15 } },
    { id: 'dining-flowers', model: 'plantSmall2', on: { parent: 'dining-sideboard' } },
    { id: 'lounge-sofa', model: 'loungeSofa', against: { wall: 'south', at: 1.15 } },
    { id: 'lounge-table', model: 'tableCoffee', at: [1.15, 4.95], facing: 'N' },
    { id: 'lounge-plant', model: 'pottedPlant', at: [0.3, 3.35] },
  ],
  rugs: [
    { id: 'porch-path-a', model: 'path_stone', at: [0.5, 1.45], facing: 'E' },
    { id: 'porch-path-b', model: 'path_stone', at: [1.35, 1.45], facing: 'E' },
    { id: 'porch-path-c', model: 'path_stone', at: [1.45, 2.3], facing: 'S' },
  ],
}
