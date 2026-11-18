import type { SceneSpec } from '../schema'
import { aStoryRehearsedStairwellBounds } from './a-story-rehearsed-ground'

// A escada chega a uma galeria a poente: daí abrem o estúdio a norte, a cozinha a sul e
// um corredor que serve a casa de banho e termina no quarto, que tem um WC próprio.
export const aStoryRehearsedUpper: SceneSpec = {
  puzzleId: 'hard-10',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: aStoryRehearsedStairwellBounds,
  circulation: {
    landing: [0.50625, 2.610625, 1.56, 3.360625],
    halls: [
      { id: 'west-stair-gallery', bounds: [1.56, 2.08, 2.38, 4.6] },
      { id: 'south-passage', bounds: [1.56, 3.8, 6.6, 4.6] },
    ],
    roomAccessTargets: [
      { id: 'study-door', bounds: [1.4, 1.4, 2.35, 2.4] },
      { id: 'bathroom-approach', bounds: [4.6, 3.3, 5.4, 4.3] },
      { id: 'kitchen-entry', bounds: [2.15, 4.2, 2.95, 5.1] },
      { id: 'bedroom-entry', bounds: [5.6, 3.85, 6.5, 4.6] },
    ],
  },
  shell: { features: [
    { wall: 'north', at: 1.6, kind: 'window' },
    { wall: 'north', at: 5.5, kind: 'window' },
    { wall: 'west', at: 6.6, kind: 'window' },
  ] },
  floors: [
    { id: 'study', cells: [0, 0, 7, 1], material: 'wood', kind: 'interior' },
    { id: 'gallery', cells: [0, 2, 1, 3], material: 'wood', kind: 'interior' },
    { id: 'bathroom', cells: [2, 2, 7, 3], material: 'tile', kind: 'interior' },
    { id: 'kitchen', cells: [0, 4, 2, 7], material: 'tile', kind: 'interior' },
    { id: 'bedroom', cells: [3, 4, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'study-bathroom', from: [0, 2], to: [8, 2], height: 'half', openings: [{ at: 1.9, width: 1.2, kind: 'door' }] },
    { id: 'bathroom-west-screen', from: [2.4375, 2], to: [2.4375, 3.75], height: 'half' },
    { id: 'bathroom-south-screen', from: [2.4375, 3.75], to: [8, 3.75], height: 'half', openings: [
      { at: 5.0, width: 0.8, kind: 'door' },
      { at: 7.25, width: 0.8, kind: 'door' },
    ] },
    // WC próprio do quarto, com porta a partir do quarto.
    { id: 'en-suite-wc', from: [6.6, 2], to: [6.6, 3.75], height: 'half' },
    { id: 'kitchen-west-screen', from: [0, 4], to: [0.42, 4], height: 'half', freeEnds: ['to'] },
    { id: 'kitchen-north', from: [1.54, 4.65], to: [3, 4.65], height: 'half', freeEnds: ['from'], openings: [{ at: 2.55, width: 0.8, kind: 'door' }] },
    { id: 'bedroom-north', from: [3, 4.65], to: [5.5, 4.65], height: 'half', freeEnds: ['to'] },
    { id: 'kitchen-bedroom', from: [3, 4.65], to: [3, 8] },
    { id: 'stairwell-west-guard', from: [0.50625, 3.45], to: [0.50625, 5.639375], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-east-guard', from: [1.49375, 3.45], to: [1.49375, 5.639375], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] },
    { id: 'stairwell-south-guard', from: [0.50625, 5.639375], to: [1.49375, 5.639375], height: 'half', treatment: 'railing' },
  ],
  furniture: [
    // Estúdio: sofá de leitura sob a janela poente, estante larga e secretária na parede
    // norte, aparador e candeeiro a nascente.
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@1,0', at: [0.35, 1.65] },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'north', at: 1.6 } },
    { id: 'study-coffee-table', model: 'tableCoffee', at: [1.6, 1.05] },
    { id: 'study-reading-lamp', model: 'lampRoundFloor', at: [0.3, 0.3] },
    { id: 'study-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@0,3', against: { wall: 'north', at: 4.0 } },
    { id: 'study-desk', model: 'desk', logic: 'desk@0,5', against: { wall: 'north', at: 5.5 } },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-desk-lamp', model: 'lampSquareFloor', at: [6.2, 0.3] },
    { id: 'study-credenza', model: 'cabinetTelevisionDoors', against: { wall: 'north', at: 7.3 } },
    { id: 'study-rug', model: 'rugRound', at: [1.6, 1.0] },
    // Casa de banho: sanita, duche, lavatório e móvel a norte, banheira a sul e máquina
    // de lavar junto à porta; o WC do quarto tem sanita e lavatório.
    { id: 'bathroom-toilet-west', model: 'toilet', logic: 'toilet@2,2', against: { wall: 'study-bathroom', side: 'S', at: 2.75 } },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@2,3', at: [3.45, 2.4], facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'study-bathroom', side: 'S', at: 4.3 } },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'study-bathroom', side: 'S', at: 4.85 } },
    { id: 'bathroom-bathtub', model: 'bathtub', logic: 'bathtub@3,1', against: { wall: 'bathroom-south-screen', side: 'N', at: 3.25 }, facing: 'N' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'en-suite-wc', side: 'W', at: 3.3 } },
    { id: 'bathroom-toilet-east', model: 'toilet', logic: 'toilet@2,7', against: { wall: 'study-bathroom', side: 'S', at: 7.5 } },
    { id: 'en-suite-sink', model: 'bathroomSink', against: { wall: 'en-suite-wc', side: 'E', at: 2.3 } },
    // Cozinha: frigorífico junto à porta, fogão, lava-loiça e bancadas em L nas paredes
    // poente e sul, e uma ilha ao centro.
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@4,1', at: [1.84, 4.9], facing: 'S' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@5,0', against: { wall: 'west', at: 6.0 } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'west', at: 6.6 } },
    { id: 'kitchen-cabinet', model: 'kitchenCabinet', against: { wall: 'west', at: 7.14 } },
    { id: 'kitchen-corner', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 1.0 }, facing: 'N' },
    { id: 'kitchen-south-cabinet', model: 'kitchenCabinet', against: { wall: 'south', at: 1.54 }, facing: 'N' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-south-cabinet' } },
    { id: 'kitchen-island', model: 'kitchenCabinet', at: [2.3, 6.2], facing: 'W' },
    { id: 'kitchen-island-b', model: 'kitchenCabinetDrawer', at: [2.3, 6.74], facing: 'W' },
    // Quarto: cama com a cabeceira na parede da cozinha e mesas de cabeceira, cómoda na
    // meia parede norte, recanto de estar a nascente e candeeiro de pé.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@6,3', against: { wall: 'kitchen-bedroom', side: 'E', at: 6.85 } },
    { id: 'bedroom-nightstand-north', model: 'cabinetBedDrawer', against: { wall: 'kitchen-bedroom', side: 'E', at: 5.9 } },
    { id: 'bedroom-clock', model: 'radio', logic: 'clock@5,3', on: { parent: 'bedroom-nightstand-north' } },
    { id: 'bedroom-nightstand-south', model: 'cabinetBedDrawerTable', against: { wall: 'kitchen-bedroom', side: 'E', at: 7.72 } },
    { id: 'bedroom-bedside-lamp', model: 'lampRoundTable', on: { parent: 'bedroom-nightstand-south' } },
    { id: 'bathroom-floor-lamp', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.3, 4.95] },
    { id: 'bedroom-chest', model: 'cabinetTelevisionDoors', against: { wall: 'bedroom-north', side: 'S', at: 4.5 } },
    { id: 'bedroom-sofa', model: 'loungeSofa', against: { wall: 'east', at: 5.4 }, facing: 'W' },
    { id: 'bedroom-coffee-table', model: 'tableCoffeeSquare', at: [6.75, 5.4] },
    { id: 'bedroom-floor-lamp', model: 'lampRoundFloor', logic: 'lamp@6,7', at: [7.25, 6.25] },
    { id: 'bedroom-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 7.3 }, facing: 'W' },
    { id: 'bedroom-rug', model: 'rugRectangle', at: [4.6, 7.0] },
  ],
}
