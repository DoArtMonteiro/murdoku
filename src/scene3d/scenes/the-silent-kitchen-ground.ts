import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

// The east-climbing flight fits inside the kitchen and opens toward the upper bedroom.
const stairAt: [number, number] = [2, 3]
const stairHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)

export const theSilentKitchenStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairHalfRun,
  stairAt[1] - stairHalfWidth,
  stairAt[0] + stairHalfRun,
  stairAt[1] + stairHalfWidth,
]

export const theSilentKitchenGround: SceneSpec = {
  puzzleId: 'master-5',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 1.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.35, kind: 'window' },
      { wall: 'north', at: 4.8, kind: 'window' },
      { wall: 'north', at: 7.2, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'E' },
  exteriorSupportBays: [
    { id: 'garden-west-frame', cells: [0, 5, 2, 7] },
    { id: 'garden-east-frame', cells: [3, 5, 4, 7] },
  ],
  floors: [
    { id: 'kitchen-tile', cells: [0, 0, 3, 4], material: 'tile', kind: 'interior' },
    { id: 'office-wood', cells: [4, 0, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'garden-grass', cells: [0, 5, 4, 7], material: 'grass', kind: 'exterior' },
    { id: 'dining-wood', cells: [5, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    {
      id: 'kitchen-office-divider',
      from: [4, 0],
      to: [4, 5],
      height: 'half',
      openings: [{ at: 4.2, width: 1.2, kind: 'door' }],
    },
    {
      id: 'kitchen-garden-facade',
      from: [0, 5],
      to: [4, 5],
      height: 'half',
      openings: [{ at: 3.6, width: 0.8, kind: 'open' }],
    },
    {
      id: 'office-south-divider',
      from: [4, 5],
      to: [8, 5],
      height: 'half',
      openings: [
        { at: 4.55, width: 0.9, kind: 'open' },
        { at: 6.7, width: 1.2, kind: 'door' },
      ],
    },
    {
      id: 'garden-dining-facade',
      from: [5, 5],
      to: [5, 8],
      height: 'half',
      openings: [{ at: 6.6, width: 1.2, kind: 'open' }],
    },
  ],
  furniture: [
    // Cozinha: mesa com cadeiras sob a janela; bancada com placa na divisória nascente,
    // bancada com lava-loiça na fachada do jardim e frigorífico no canto.
    { id: 'kitchen-table', model: 'table', logic: 'table@0,1', at: [1.5, 0.6], facing: 'N' },
    { id: 'kitchen-chair-a', model: 'chairCushion', at: [1.2, 1.25], facing: 'N' },
    { id: 'kitchen-chair-b', model: 'chairCushion', at: [1.8, 1.25], facing: 'N' },
    { id: 'kitchen-east-cabinet-a', model: 'kitchenCabinet', against: { wall: 'kitchen-office-divider', side: 'W', at: 1.17 }, facing: 'W' },
    { id: 'kitchen-east-cabinet-b', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-office-divider', side: 'W', at: 1.71 }, facing: 'W' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@2,3', against: { wall: 'kitchen-office-divider', side: 'W', at: 2.25 }, facing: 'W' },
    { id: 'kitchen-fridge', model: 'kitchenFridge', logic: 'fridge@4,0', against: { wall: 'west', at: 4.5 }, facing: 'E' },
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@4,1', against: { wall: 'kitchen-garden-facade', side: 'N', at: 1.3 }, facing: 'N' },
    { id: 'kitchen-counter-sink', model: 'kitchenSink', logic: 'counter@4,1', against: { wall: 'kitchen-garden-facade', side: 'N', at: 1.84 }, facing: 'N' },
    { id: 'kitchen-counter-east', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-garden-facade', side: 'N', at: 2.38 }, facing: 'N' },
    // Escritório: estante larga a norte, secretária com cadeira na parede nascente,
    // estantes na célula da Carol e um grupo de conversa com poltrona, mesa baixa e sofá.
    { id: 'office-bookshelf-north', model: 'bookcaseClosedWide', logic: 'bookshelf@0,5', against: { wall: 'north', at: 6.0 } },
    { id: 'office-desk', model: 'desk', logic: 'desk@1,7', against: { wall: 'east', at: 1.3 }, facing: 'W' },
    { id: 'office-desk-chair', model: 'chairDesk', at: [6.85, 1.3], facing: 'E' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-bookshelf-carol', model: 'bookcaseOpen', logic: 'bookshelf@2,7', at: [7.6, 2.2], facing: 'S' },
    { id: 'office-bookshelf-carol-books', model: 'books', on: { parent: 'office-bookshelf-carol', surface: 'shelf2' } },
    { id: 'office-bookshelf-carol-low', model: 'bookcaseOpenLow', logic: 'bookshelf@2,7', against: { wall: 'east', at: 2.75 }, facing: 'W' },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@2,4', at: [4.6, 2.6], facing: 'E' },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [5.4, 2.6] },
    { id: 'office-sofa', model: 'loungeSofa', at: [6.4, 2.6], facing: 'W' },
    { id: 'office-clock-bella-table', model: 'sideTable', at: [5.75, 3.25], facing: 'S' },
    { id: 'office-clock-bella', model: 'radio', logic: 'clock@3,5', on: { parent: 'office-clock-bella-table' } },
    { id: 'office-clock-south-table', model: 'sideTable', at: [5.5, 4.55], facing: 'E' },
    { id: 'office-clock-south', model: 'radio', logic: 'clock@4,5', on: { parent: 'office-clock-south-table' } },
    { id: 'office-lamp', model: 'lampRoundFloor', at: [4.3, 0.35] },
    // Jardim: plantas soltas, caminho de pedra e banco.
    { id: 'garden-plant-west', model: 'pottedPlant', logic: 'plant@5,2', at: [2.35, 5.5] },
    { id: 'garden-shrub-evangeline', model: 'plant_bushSmall', logic: 'shrub@6,4', at: [4.2, 6.5] },
    { id: 'garden-plant-south', model: 'flower_yellowA', logic: 'plant@7,2', at: [2.5, 7.5] },
    { id: 'garden-path-a', model: 'path_stone', at: [3.6, 5.6], facing: 'S' },
    { id: 'garden-path-b', model: 'path_stone', at: [3.3, 6.6], facing: 'S' },
    { id: 'garden-bench', model: 'bench', at: [0.9, 7.55], facing: 'N' },
    { id: 'garden-rock', model: 'rock_smallA', at: [0.5, 5.6] },
    // Sala de jantar: mesa com cadeiras entre os candeeiros.
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@5,5', at: [5.5, 5.5] },
    { id: 'dining-table', model: 'table', at: [6.5, 6.5], facing: 'N' },
    { id: 'dining-chair-north-a', model: 'chair', at: [6.2, 5.85], facing: 'S' },
    { id: 'dining-chair-north-b', model: 'chair', at: [6.8, 5.85], facing: 'S' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@7,6', at: [6.5, 7.3], facing: 'N' },
    { id: 'dining-lamp-east', model: 'lampRoundFloor', logic: 'lamp@7,7', at: [7.5, 7.5] },
  ],
}
