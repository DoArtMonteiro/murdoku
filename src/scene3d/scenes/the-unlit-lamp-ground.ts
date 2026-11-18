import type { SceneSpec } from '../schema'

// Habitação compacta com alpendre de entrada fechado, usado como vestíbulo.
// A escada separa a sala do corredor; a cozinha-copa ocupa toda a ala nascente.
export const theUnlitLampGround: SceneSpec = {
  puzzleId: 'hard-7',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 7.2 },
  shell: { features: [
    { wall: 'north', at: 1.0, kind: 'window' },
    { wall: 'north', at: 6.6, kind: 'window' },
    { wall: 'west', at: 2.4, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [2.65, 2.0], facing: 'S' },
  floors: [
    { id: 'living-room', cells: [0, 0, 2, 4], material: 'wood' },
    { id: 'central-hall', cells: [3, 0, 4, 7], material: 'wood' },
    { id: 'entry-vestibule', cells: [0, 5, 2, 7], material: 'stone' },
    { id: 'kitchen', cells: [5, 0, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'living-hall', from: [3, 3.3], to: [3, 5], height: 'half', freeEnds: ['from'] },
    { id: 'living-vestibule', from: [0, 5], to: [3, 5] },
    { id: 'vestibule-hall', from: [3, 5], to: [3, 8], openings: [{ at: 7.0, width: 1.2, kind: 'door' }] },
    { id: 'hall-kitchen', from: [5, 0], to: [5, 8], openings: [{ at: 3.9, width: 1.4, kind: 'open' }] },
  ],
  furniture: [
    // Sala: sofá virado a sul para o móvel da televisão, poltrona e mesa de centro;
    // o móvel de portas ao lado guarda a aparelhagem.
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@1,0', at: [1.0, 1.55], facing: 'S' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [1.0, 2.65] },
    { id: 'living-armchair', model: 'loungeChair', at: [0.3, 2.65], facing: 'E' },
    { id: 'living-armchair-east', model: 'loungeChair', at: [1.8, 3.4], facing: 'W' },
    { id: 'living-tv-console', model: 'cabinetTelevision', at: [1.15, 4.45], facing: 'N' },
    { id: 'living-tv', model: 'televisionVintage', logic: 'tv@4,1', on: { parent: 'living-tv-console' }, facing: 'N' },
    { id: 'living-media-cabinet', model: 'cabinetTelevisionDoors', logic: 'tv@4,2', at: [2.35, 4.45], facing: 'N' },
    { id: 'living-media-speaker', model: 'speakerSmall', on: { parent: 'living-media-cabinet' } },
    { id: 'living-clock', model: 'speaker', logic: 'clock@0,2', at: [1.88, 0.3] },
    { id: 'living-lamp', model: 'lampRoundFloor', at: [0.3, 1.0] },
    { id: 'living-plant', model: 'pottedPlant', at: [0.3, 4.6] },
    // Corredor: consola com rádio, plantas e passadeira junto à porta do vestíbulo.
    { id: 'hall-clock-table', model: 'sideTable', at: [4.55, 2.5], facing: 'E' },
    { id: 'hall-clock', model: 'radio', logic: 'clock@2,4', on: { parent: 'hall-clock-table' } },
    { id: 'hall-plant-north', model: 'pottedPlant', logic: 'plant@0,4', at: [4.7, 0.3] },
    { id: 'hall-plant-south', model: 'pottedPlant', logic: 'plant@5,4', at: [4.72, 5.4] },
    { id: 'hall-coat-rack', model: 'coatRackStanding', at: [3.3, 5.3] },
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@6,3', at: [4.0, 7.0], facing: 'E' },
    // Cozinha: bancada norte com fogão e lava-loiça debaixo da janela, mesa de refeições
    // ao centro, e copa a sul com fogão, bancadas e frigorífico frente a frente.
    { id: 'kitchen-stove-north', model: 'kitchenStove', logic: 'stove@0,5', against: { wall: 'north', at: 5.57 } },
    { id: 'kitchen-north-cabinet', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 6.11 } },
    { id: 'kitchen-north-sink', model: 'kitchenSink', against: { wall: 'north', at: 6.65 } },
    { id: 'kitchen-table', model: 'table', at: [6.5, 2.3] },
    { id: 'kitchen-chair-nw', model: 'chair', at: [6.2, 1.8], facing: 'S' },
    { id: 'kitchen-chair-ne', model: 'chair', at: [6.8, 1.8], facing: 'S' },
    { id: 'kitchen-chair-sw', model: 'chair', at: [6.2, 2.8], facing: 'N' },
    { id: 'kitchen-chair-se', model: 'chair', at: [6.8, 2.8], facing: 'N' },
    { id: 'kitchen-cabinet-east', model: 'kitchenCabinet', against: { wall: 'east', at: 3.96 }, facing: 'W' },
    { id: 'kitchen-stove-south', model: 'kitchenStove', logic: 'stove@4,7', against: { wall: 'east', at: 4.5 }, facing: 'W' },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@5,7', against: { wall: 'east', at: 5.3 }, facing: 'W' },
    { id: 'kitchen-counter', model: 'kitchenCabinet', against: { wall: 'east', at: 5.84 }, facing: 'W' },
    { id: 'kitchen-counter-end', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 6.38 }, facing: 'W' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-counter-end' } },
    { id: 'kitchen-west-cabinet', model: 'kitchenCabinet', against: { wall: 'hall-kitchen', side: 'E', at: 4.96 } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@5,5', against: { wall: 'hall-kitchen', side: 'E', at: 5.5 } },
    { id: 'kitchen-west-cabinet-south', model: 'kitchenCabinetDrawer', against: { wall: 'hall-kitchen', side: 'E', at: 6.04 } },
    { id: 'kitchen-bin', model: 'trashcan', at: [5.25, 7.6] },
    // Vestíbulo: banco junto à parede, sapateira e planta ao lado da porta da rua.
    { id: 'vestibule-chair', model: 'benchCushion', logic: 'chair@5,0', against: { wall: 'west', at: 5.5 }, facing: 'E' },
    { id: 'vestibule-cabinet', model: 'sideTableDrawers', against: { wall: 'living-vestibule', side: 'S', at: 1.6 }, facing: 'S' },
    { id: 'vestibule-plant', model: 'pottedPlant', logic: 'plant@6,0', at: [0.3, 6.3] },
  ],
}
