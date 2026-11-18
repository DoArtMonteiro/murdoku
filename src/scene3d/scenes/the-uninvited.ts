import type { SceneSpec } from '../schema'

// Moradia urbana compacta: sala, cozinha estreita e galeria de entrada.
export const theUninvited: SceneSpec = {
  puzzleId: 'very-easy-7',
  floor: 0,
  entry: { wall: 'north', at: 5.0 },
  shell: {
    features: [
      { wall: 'north', at: 0.9, kind: 'window' },
      { wall: 'north', at: 3.5, kind: 'window' },
      { wall: 'west', at: 4.6, kind: 'window' },
    ],
  },
  floors: [
    { id: 'kitchen-tile', cells: [2, 0, 3, 5], material: 'tile', kind: 'interior' },
  ],
  walls: [
    // passagens abertas, sem caixilhos soltos; meias paredes baixas mostram as bancadas
    { id: 'dining-kitchen', from: [2, 0], to: [2, 6], height: 'half', openings: [{ at: 4.55, width: 1, kind: 'open' }] },
    { id: 'kitchen-gallery', from: [4, 0], to: [4, 6], height: 'half', openings: [{ at: 4.6, width: 1, kind: 'open' }] },
  ],
  furniture: [
    // Sala de jantar a oeste: mesa com quatro cadeiras, estante baixa, aparador sob a janela.
    { id: 'dining-table', model: 'table', at: [1.0, 2.3], facing: 'E' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@2,1', at: [1.6, 2.3], facing: 'W' },
    { id: 'dining-chair-west', model: 'chair', at: [0.4, 2.3], facing: 'E' },
    { id: 'dining-chair-north', model: 'chair', at: [1.0, 1.45], facing: 'S' },
    { id: 'dining-chair-south', model: 'chair', at: [1.0, 3.15], facing: 'N' },
    { id: 'dining-plant', model: 'pottedPlant', at: [1.7, 0.3] },
    { id: 'dining-bookcase', model: 'bookcaseOpenLow', against: { wall: 'west', at: 0.9 } },
    { id: 'sideboard-books', model: 'books', on: { parent: 'dining-bookcase' } },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 4.4 } },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@5,0', at: [0.7, 5.25] },
    // Cozinha em galeria: fogão, máquina de lavar e frigorífico a oeste, bancada com lava-loiça a este,
    // armário de despensa alto no topo sul.
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@0,2', against: { wall: 'north', at: 2.72 } },
    { id: 'kitchen-washer', model: 'washer', against: { wall: 'dining-kitchen', side: 'E', at: 1.05 } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,2', against: { wall: 'dining-kitchen', side: 'E', at: 2.2 } },
    { id: 'kitchen-counter-a', model: 'kitchenCabinet', logic: 'counter@2,3', against: { wall: 'kitchen-gallery', side: 'W', at: 2.35 } },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@2,3', against: { wall: 'kitchen-gallery', side: 'W', at: 2.95 } },
    // The logical counter covers two cells; the run continues over the second one.
    { id: 'kitchen-counter-b', model: 'kitchenCabinetDrawer', logic: 'counter@2,3', against: { wall: 'kitchen-gallery', side: 'W', at: 3.55 } },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-counter-a' } },
    { id: 'kitchen-pantry', model: 'bookcaseClosedDoors', against: { wall: 'dining-kitchen', side: 'E', at: 5.55 } },
    // Galeria de entrada a leste: consola com rádio, banco e plantas; o centro fica livre.
    { id: 'gallery-console', model: 'sideTable', against: { wall: 'kitchen-gallery', side: 'E', at: 1.15 } },
    { id: 'gallery-clock', model: 'radio', logic: 'clock@0,4', on: { parent: 'gallery-console' } },
    { id: 'gallery-bench', model: 'benchCushion', at: [5.75, 3.5], facing: 'W' },
    { id: 'gallery-plant-n', model: 'pottedPlant', at: [5.72, 0.3] },
    { id: 'gallery-plant-a', model: 'pottedPlant', logic: 'plant@5,4', at: [4.8, 5.15] },
    { id: 'gallery-plant-b', model: 'plant_bushSmall', logic: 'plant@5,5', at: [5.45, 5.1], yaw: 8 },
  ],
  rugs: [
    { id: 'gallery-doormat', model: 'rugDoormat', at: [5.0, 0.35], facing: 'S' },
    { id: 'gallery-runner', model: 'rugRectangle', at: [5.0, 2.6], facing: 'S' },
    { id: 'dining-rug', model: 'rugRectangle', at: [1.0, 2.3], facing: 'S' },
  ],
}
