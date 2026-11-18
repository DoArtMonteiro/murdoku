import type { SceneSpec } from '../schema'

// A casa conserva as quatro divisões inferiores do puzzle. O jardim central
// ocupa o vão exterior contínuo e recebe a estrutura da galeria superior.
export const theOpenWindowGround: SceneSpec = {
  puzzleId: 'expert-1',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6.4 },
  shell: {
    features: [
      { wall: 'north', at: 2.8, kind: 'window' },
      { wall: 'north', at: 7.2, kind: 'window' },
      { wall: 'west', at: 2.5, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: [6.6, 3.5], facing: 'S' },
  exteriorSupportBays: [
    { id: 'spine-north', cells: [4, 0, 5, 2] },
    { id: 'spine-centre', cells: [4, 3, 5, 5] },
    { id: 'spine-south', cells: [4, 6, 5, 7] },
  ],
  floors: [
    { id: 'hallway-wood', cells: [0, 0, 1, 7], material: 'wood' },
    { id: 'kitchen-tile', cells: [2, 0, 3, 7], material: 'tile' },
    { id: 'front-yard-spine-north', cells: [4, 0, 5, 0], material: 'grass', kind: 'exterior' },
    // Caminho lajeado coberto entre a cozinha e a porta do escritório.
    { id: 'front-yard-path', cells: [4, 1, 5, 1], material: 'stone', kind: 'exterior' },
    { id: 'front-yard-spine-south', cells: [4, 2, 5, 7], material: 'grass', kind: 'exterior' },
    { id: 'office-wood', cells: [6, 0, 7, 7], material: 'wood' },
  ],
  walls: [
    {
      id: 'hall-kitchen',
      from: [2, 0],
      to: [2, 8],
      height: 'cutaway',
      openings: [
        { at: 2.5, width: 1.2, kind: 'open' },
        { at: 6.3, width: 1.2, kind: 'open' },
      ],
    },
    {
      id: 'kitchen-spine-facade',
      from: [4, 0],
      to: [4, 8],
      height: 'half',
      openings: [
        { at: 1.5, width: 1.4, kind: 'open' },
        { at: 4.6, width: 0.9, kind: 'open' },
      ],
    },
    {
      id: 'office-spine-facade',
      from: [6, 0],
      to: [6, 8],
      height: 'half',
      openings: [{ at: 1.5, width: 1.0, kind: 'door' }],
    },
    // Meia parede de estante no escritório: a estante alta de Marco (R7C8) encosta-lhe
    // pelo lado sul e mostra a frente à câmara.
    { id: 'office-book-wall', from: [8, 6], to: [6.9, 6], height: 'half', freeEnds: ['to'] },
  ],
  furniture: [
    { id: 'hall-clock', model: 'speaker', logic: 'clock@3,0', at: [0.5, 3.5] },
    { id: 'hall-plant-north', model: 'pottedPlant', logic: 'plant@0,1', at: [1.5, 0.5], facing: 'E' },
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@1,0', at: [1, 2], facing: 'E' },
    { id: 'hall-plant-south', model: 'pottedPlant', logic: 'plant@7,0', at: [0.5, 7.5], facing: 'S' },

    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@0,2', at: [2.7, 0.5], facing: 'S' },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@0,2', at: [3.3, 0.5], facing: 'S' },
    { id: 'kitchen-coffee-machine', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-counter' } },
    { id: 'kitchen-table', model: 'table', logic: 'table@1,2', at: [3, 1.5], facing: 'E' },
    { id: 'kitchen-chair-north', model: 'chairCushion', at: [2.4, 1.15], facing: 'E' },
    { id: 'kitchen-chair-south', model: 'chairCushion', at: [2.4, 1.7], facing: 'E' },
    // Placa e bancadas em linha contra a parede da entrada; o frigorífico fecha o triângulo de trabalho.
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@3,2', against: { wall: 'hall-kitchen', side: 'E', at: 3.5 }, facing: 'E' },
    { id: 'kitchen-run-a', model: 'kitchenCabinet', against: { wall: 'hall-kitchen', side: 'E', at: 4.04 }, facing: 'E' },
    { id: 'kitchen-run-b', model: 'kitchenCabinetDrawer', against: { wall: 'hall-kitchen', side: 'E', at: 4.58 }, facing: 'E' },
    // Frigorífico e armário na parede do jardim, em frente à placa: cozinha de galé.
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@5,3', against: { wall: 'kitchen-spine-facade', side: 'W', at: 5.4 }, facing: 'W' },
    { id: 'kitchen-run-c', model: 'kitchenCabinet', against: { wall: 'kitchen-spine-facade', side: 'W', at: 5.95 }, facing: 'W' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-run-c' }, facing: 'W' },

    { id: 'spine-shrub-north', model: 'plant_bushSmall', logic: 'shrub@0,4', at: [4.9, 0.5], facing: 'E' },
    { id: 'spine-shrub-centre-west', model: 'plant_bushSmall', logic: 'shrub@3,4', at: [4.5, 3.5], facing: 'S' },
    { id: 'spine-plant-centre-east', model: 'pottedPlant', logic: 'plant@3,5', at: [5.5, 3.7], facing: 'W' },
    { id: 'spine-shrub-south', model: 'plant_bushSmall', logic: 'shrub@5,4', at: [4.9, 5.5], facing: 'S' },
    { id: 'spine-plant-south', model: 'pottedPlant', logic: 'plant@6,4', at: [4.5, 6.5], facing: 'E' },

    // Escritório: banco sob a janela junto ao pé da escada; a sul, secretária com cadeira,
    // estantes baixas na parede nascente e poltrona de leitura sobre o tapete.
    { id: 'office-bench', model: 'bench', against: { wall: 'north', at: 7.25 } },
    { id: 'office-armchair', model: 'loungeChair', at: [7.45, 7.45], facing: 'W' },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@6,6', at: [6.5, 6.95], facing: 'S' },
    { id: 'office-desk', model: 'desk', logic: 'desk@7,6', at: [6.5, 7.6], facing: 'N' },
    { id: 'office-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@5,7', against: { wall: 'office-book-wall', side: 'S', at: 7.42 }, facing: 'S' },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase' } },
    { id: 'office-bookcase-low', model: 'bookcaseOpenLow', logic: 'bookshelf@5,7', against: { wall: 'east', at: 5.5 }, facing: 'W' },
    { id: 'office-bookcase-low-books', model: 'books', on: { parent: 'office-bookcase-low' } },
  ],
  rugs: [
    { id: 'office-rug', model: 'rugRectangle', at: [6.8, 6.55] },
    { id: 'entry-mat', model: 'rugDoormat', at: [0.3, 6.4], facing: 'E' },
  ],
}
