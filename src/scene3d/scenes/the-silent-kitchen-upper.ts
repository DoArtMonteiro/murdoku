import type { SceneSpec } from '../schema'
import { theSilentKitchenStairwellBounds } from './the-silent-kitchen-ground'

const well = theSilentKitchenStairwellBounds
const guardOffset = 0.08

// A escada chega a um patamar entre o átrio do corredor (norte) e o quarto (sul);
// uma galeria transversal serve o escritório, a lavandaria e a casa de banho.
export const theSilentKitchenUpper: SceneSpec = {
  puzzleId: 'master-5',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    landing: [well[2], 2.5, 3.95, 3.55],
    halls: [
      { id: 'east-gallery', bounds: [3.15, 2.6, 7.9, 3.4] },
      { id: 'lounge-path', bounds: [3.2, 0.6, 3.95, 2.5] },
    ],
    roomAccessTargets: [
      { id: 'bedroom-access', bounds: [3.15, 2.8, 3.95, 3.55] },
      { id: 'study-north-access', bounds: [4.95, 2.6, 5.65, 3.4] },
      { id: 'study-south-access', bounds: [4.9, 2.6, 5.7, 3.4] },
      { id: 'utility-access', bounds: [6.95, 2.6, 7.65, 3.4] },
      { id: 'bathroom-access', bounds: [6.9, 2.6, 7.7, 3.4] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 2.0, kind: 'window' },
      { wall: 'north', at: 5.2, kind: 'window' },
      { wall: 'west', at: 1.0, kind: 'window' },
      { wall: 'west', at: 6.5, kind: 'window' },
    ],
  },
  floors: [
    { id: 'hallway-stone', cells: [0, 0, 1, 7], material: 'stone', kind: 'interior' },
    { id: 'bedroom-wood', cells: [2, 0, 3, 7], material: 'wood', kind: 'interior' },
    { id: 'study-wood', cells: [4, 0, 5, 7], material: 'wood', kind: 'interior' },
    { id: 'bathroom-tile', cells: [6, 0, 7, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'bedroom-north', from: [0, 3.62], to: [4, 3.62], height: 'half', openings: [
      { at: 1.0, width: 0.65, kind: 'door' },
      { at: 3.55, width: 0.65, kind: 'door' },
    ] },
    { id: 'hall-bedroom', from: [2, 3.62], to: [2, 8], height: 'half' },
    { id: 'gallery-north', from: [4, 2.55], to: [8, 2.55], height: 'half', openings: [
      { at: 5.3, width: 0.7, kind: 'door' },
      { at: 7.3, width: 0.7, kind: 'door' },
    ] },
    { id: 'gallery-south', from: [4, 3.45], to: [8, 3.45], height: 'half', openings: [
      { at: 5.3, width: 0.7, kind: 'door' },
      { at: 7.3, width: 0.7, kind: 'door' },
    ] },
    { id: 'lounge-study', from: [4, 0], to: [4, 2.55], height: 'half' },
    { id: 'bedroom-study', from: [4, 3.45], to: [4, 8], height: 'half' },
    { id: 'study-utility', from: [6, 0], to: [6, 2.55], height: 'half' },
    { id: 'study-bathroom', from: [6, 3.45], to: [6, 8], height: 'half' },
    { id: 'stairwell-north-guard', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[2], well[1] - guardOffset], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'stairwell-west-guard', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[0] - guardOffset, 3.62], height: 'half', treatment: 'railing', freeEnds: ['from'] },
  ],
  furniture: [
    // Átrio de chegada (faixa norte do Hallway): banco sob a janela, consola com candeeiro
    // passadeira da Lena e candeeiro de pé; sem conjunto de sala de estar.
    { id: 'landing-bench', model: 'bench', against: { wall: 'north', at: 2.0 } },
    { id: 'landing-console', model: 'cabinetTelevisionDoors', against: { wall: 'north', at: 3.3 } },
    { id: 'landing-console-lamp', model: 'lampSquareTable', on: { parent: 'landing-console' } },
    { id: 'hallway-rug-lena', model: 'rugSquare', logic: 'rug@1,0', at: [1.0, 1.75] },
    { id: 'lounge-lamp', model: 'lampRoundFloor', at: [0.25, 0.3] },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@3,0', at: [0.4, 3.3] },
    // Corredor sul (faixa do Hallway): consola com o rádio, relógio de pé, banco e aparador.
    { id: 'hallway-console', model: 'cabinetBedDrawerTable', at: [0.2, 6.45], facing: 'E' },
    { id: 'hallway-clock-south', model: 'radio', logic: 'clock@6,0', on: { parent: 'hallway-console' } },
    { id: 'hallway-clock-east', model: 'speaker', logic: 'clock@4,1', at: [1.75, 4.25] },
    { id: 'hallway-bench', model: 'bench', against: { wall: 'west', at: 5.0 } },
    { id: 'hallway-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'south', at: 1.0 }, facing: 'N' },
    // Quarto (faixa do Bedroom): cama com a cabeceira na parede do escritório, ladeada pelos
    // dois candeeiros de pé; relógios nos cantos a sul.
    { id: 'bedroom-bed', model: 'bedDouble', against: { wall: 'bedroom-study', side: 'W', at: 5.45 } },
    { id: 'bedroom-lamp-south', model: 'lampRoundFloor', logic: 'lamp@5,2', at: [2.25, 5.25] },
    { id: 'bedroom-lamp-north', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.75, 4.3], facing: 'W' },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@6,3', at: [3.75, 6.25] },
    { id: 'bedroom-clock-priya', model: 'speaker', logic: 'clock@7,2', at: [2.75, 7.25] },
    // Escritório norte: secretária do Idris sob a janela com cadeira, caixa e poltrona.
    { id: 'study-desk-idris', model: 'desk', logic: 'desk@0,4', against: { wall: 'north', at: 4.5 } },
    { id: 'study-desk-idris-chair', model: 'chairDesk', at: [4.5, 1.1], facing: 'N' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@0,5', at: [5.55, 0.4] },
    { id: 'study-north-armchair', model: 'loungeChair', at: [5.5, 1.6], facing: 'W' },
    // Escritório sul: estante na parede poente, secretária com cadeira e poltrona de leitura.
    { id: 'study-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@4,4', against: { wall: 'bedroom-study', side: 'E', at: 5.0 }, facing: 'E' },
    { id: 'study-reading-chair', model: 'loungeChair', at: [5.5, 4.9], facing: 'W' },
    { id: 'study-desk-extra', model: 'desk', logic: 'desk@6,4', against: { wall: 'bedroom-study', side: 'E', at: 6.5 }, facing: 'E' },
    { id: 'study-desk-extra-chair', model: 'chairDesk', at: [5.1, 6.5], facing: 'W' },
    { id: 'study-lamp', model: 'lampRoundFloor', logic: 'lamp@7,5', at: [5.5, 7.5] },
    // Lavandaria a norte da galeria.
    { id: 'utility-washer', model: 'washer', against: { wall: 'north', at: 6.5 } },
    { id: 'utility-dryer', model: 'dryer', against: { wall: 'north', at: 7.0 } },
    { id: 'utility-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'east', at: 1.5 }, facing: 'W' },
    // Casa de banho fechada: sanita junto à porta, lavatório a poente, móvel a nascente,
    // banheira de parede a parede e duche no canto sul.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@3,6', against: { wall: 'gallery-south', side: 'S', at: 6.4 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'study-bathroom', side: 'E', at: 4.6 }, facing: 'E' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'east', at: 5.1 }, facing: 'W' },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@6,6', at: [7.0, 6.4], facing: 'N' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@7,6', at: [6.45, 7.55], facing: 'S' },
    { id: 'bathroom-washer', model: 'trashcan', at: [7.75, 7.6] },
  ],
}
