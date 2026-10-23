import type { SceneSpec } from '../schema'

const stairAt: [number, number] = [7.25, 2.5]

// Moradia de dois pisos com copa-despensa, escritório de entrada, sala de estar e
// jantar e jardim aberto sob a laje do piso de cima.
export const threeEmptyGlassesGround: SceneSpec = {
  puzzleId: 'hard-8',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 5 },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 3.6, kind: 'window' },
    { wall: 'west', at: 1.0, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    { id: 'garden-north-frame', cells: [0, 3, 2, 4] },
    { id: 'garden-south-frame', cells: [0, 5, 2, 7] },
  ],
  floors: [
    { id: 'pantry-tile', cells: [0, 0, 2, 2], material: 'tile' },
    { id: 'office-wood', cells: [3, 0, 7, 3], material: 'wood' },
    { id: 'dining-wood', cells: [3, 4, 7, 7], material: 'wood' },
    { id: 'open-garden', cells: [0, 3, 2, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'pantry-office', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 1.5, width: 1.2, kind: 'door' }] },
    { id: 'garden-facade', from: [3, 3], to: [3, 8], openings: [{ at: 6.25, width: 1.2, kind: 'door' }] },
    { id: 'garden-north-facade', from: [0, 3], to: [3, 3] },
    { id: 'office-dining-west', from: [3, 4], to: [5, 4], height: 'half', freeEnds: ['to'] },
  ],
  furniture: [
    // Escritório de entrada: secretária encostada à meia parede com cadeira, consola com
    // rádio, estantes a fazer de divisória e um sofá de espera debaixo da janela.
    { id: 'office-clock-table', model: 'sideTable', against: { wall: 'pantry-office', side: 'E', at: 2.6 }, facing: 'E' },
    { id: 'office-clock', model: 'radio', logic: 'clock@2,3', on: { parent: 'office-clock-table' } },
    { id: 'office-bookshelf-west', model: 'bookcaseOpen', logic: 'bookshelf@3,5', at: [5.3, 3.78], facing: 'S' },
    { id: 'office-bookshelf-west-books', model: 'books', on: { parent: 'office-bookshelf-west', surface: 'shelf2' } },
    { id: 'office-bookshelf-west-books-low', model: 'books', on: { parent: 'office-bookshelf-west', surface: 'shelf1' } },
    { id: 'office-bookshelf-east', model: 'bookcaseOpenLow', logic: 'bookshelf@3,5', at: [6.45, 3.78], facing: 'S' },
    { id: 'office-bookshelf-east-books', model: 'books', on: { parent: 'office-bookshelf-east' } },
    { id: 'office-desk', model: 'desk', logic: 'desk@3,4', at: [4.1, 3.6], facing: 'N' },
    { id: 'office-desk-chair', model: 'chairDesk', at: [4.1, 3.0], facing: 'S' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' }, facing: 'N' },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'north', at: 3.9 } },
    { id: 'office-meeting-table', model: 'tableCoffee', at: [4.1, 1.05] },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@0,7', at: [7.45, 0.45], facing: 'W' },
    { id: 'office-side-table', model: 'tableCoffeeSquare', at: [6.75, 0.35] },
    { id: 'office-flower', model: 'flower_yellowA', at: [5.75, 0.25] },
    { id: 'office-rug', model: 'rugRound', at: [4.0, 0.95] },
    // Sala de estar e jantar: sofá e poltronas sobre o tapete com candeeiro de pé, mesa de
    // jantar no canto sudeste com quatro cadeiras e aparador junto à porta do jardim.
    { id: 'dining-rug', model: 'rugRectangle', logic: 'rug@4,4', at: [4.6, 4.85], facing: 'E' },
    { id: 'dining-sofa', model: 'loungeSofa', against: { wall: 'garden-facade', side: 'E', at: 4.72 }, facing: 'E' },
    { id: 'dining-coffee-table', model: 'tableCoffee', at: [4.35, 4.75], facing: 'E' },
    { id: 'dining-armchair-east', model: 'loungeChair', at: [5.35, 4.75], facing: 'W' },
    { id: 'dining-armchair-south', model: 'loungeChair', at: [4.35, 5.7], facing: 'N' },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@5,3', at: [3.3, 5.48] },
    { id: 'dining-table', model: 'table', logic: 'table@7,6', at: [6.95, 7.4], facing: 'N' },
    { id: 'dining-chair-north-west', model: 'chairCushion', at: [6.65, 6.8], facing: 'S' },
    { id: 'dining-chair-north-east', model: 'chairCushion', at: [7.25, 6.8], facing: 'S' },
    { id: 'dining-chair-west', model: 'chairCushion', at: [6.1, 7.4], facing: 'E' },
    { id: 'dining-chair-east', model: 'chairCushion', at: [7.8, 7.4], facing: 'W' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'garden-facade', side: 'E', at: 7.4 }, facing: 'E' },
    // Copa-despensa: frigorífico e armários na parede poente, bancada com lava-loiça a sul.
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@0,2', at: [2.6, 0.32] },
    { id: 'pantry-fridge', model: 'kitchenFridge', against: { wall: 'west', at: 0.35 }, facing: 'E' },
    { id: 'pantry-cupboard', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 0.95 }, facing: 'E' },
    { id: 'pantry-cupboard-south', model: 'kitchenCabinet', against: { wall: 'west', at: 1.49 }, facing: 'E' },
    { id: 'pantry-run-west', model: 'kitchenCabinetDrawer', against: { wall: 'garden-north-facade', side: 'N', at: 1.27 }, facing: 'N' },
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@2,1', against: { wall: 'garden-north-facade', side: 'N', at: 1.81 }, facing: 'N' },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'garden-north-facade', side: 'N', at: 2.35 }, facing: 'N' },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter' } },
    // Jardim: plantas e arbustos em grupos, caminho de pedra da porta da sala e banco.
    { id: 'garden-plant-south-west', model: 'flower_purpleA', logic: 'plant@6,0', at: [0.3, 6.6] },
    { id: 'garden-shrub-south', model: 'plant_bushSmall', logic: 'shrub@7,1', at: [1.45, 7.6] },
    { id: 'garden-shrub-north', model: 'plant_bushSmall', logic: 'shrub@3,0', at: [0.45, 3.5] },
    { id: 'garden-plant-south-edge', model: 'flower_redA', logic: 'plant@7,0', at: [0.5, 7.5] },
    { id: 'garden-bench', model: 'bench', at: [1.5, 3.45], facing: 'S' },
    { id: 'garden-rock', model: 'rock_smallA', at: [1.6, 4.9] },
    { id: 'garden-stump', model: 'stump_round', at: [0.9, 5.4] },
  ],
  rugs: [
    { id: 'garden-path-door', model: 'path_stone', at: [2.3, 6.2], facing: 'E' },
    { id: 'garden-path-mid', model: 'path_stone', at: [1.2, 6.1], facing: 'E' },
  ],
}
