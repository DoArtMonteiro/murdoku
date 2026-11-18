import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairRun = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairHeadX = 5
const stairAt: [number, number] = [stairHeadX - stairRun / 2, 5.5]
const stairwellBounds: [number, number, number, number] = [
  stairHeadX - stairRun,
  stairAt[1] - stairWidth / 2,
  stairHeadX,
  stairAt[1] + stairWidth / 2,
]
const stairPartitionClearance = 0.2

export const theMissingHourStairwellBounds = stairwellBounds

export const theMissingHourGround: SceneSpec = {
  puzzleId: 'hard-11',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: stairAt[1] },
  shell: { features: [
    { wall: 'north', at: 1.35, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 6.4, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'E' },
  floors: [
    { id: 'kitchen-floor', cells: [0, 0, 3, 3], material: 'tile', kind: 'interior' },
    { id: 'office-floor', cells: [4, 0, 7, 3], material: 'wood', kind: 'interior' },
    { id: 'living-floor', cells: [0, 4, 2, 7], material: 'wood', kind: 'interior' },
    { id: 'dining-floor', cells: [3, 4, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'kitchen-office-partition', from: [4, 0], to: [4, 4], height: 'half', openings: [{ at: 1.8, width: 1.15, kind: 'door' }] },
    { id: 'front-rear-partition', from: [0, 4], to: [8, 4], height: 'half', openings: [
      { at: 0.55, width: 0.9, kind: 'door' },
      { at: 6.5, width: 1.2, kind: 'door' },
    ] },
    { id: 'living-dining-north-screen', from: [3, 4], to: [3, stairwellBounds[1] - stairPartitionClearance], height: 'half', freeEnds: ['to'] },
    { id: 'living-dining-south-screen', from: [3, stairwellBounds[3] + stairPartitionClearance], to: [3, 8], height: 'half', freeEnds: ['from'] },
  ],
  furniture: [
    // Cozinha: mesa de pequenas refeições no canto, bancada contínua com frigorífico,
    // lava-loiça e fogão contra a meia parede sul e armários na parede poente.
    { id: 'kitchen-table', model: 'table', logic: 'table@0,0', at: [1, 0.55], facing: 'S' },
    { id: 'kitchen-chair-south-a', model: 'chairCushion', at: [0.7, 1.2], facing: 'N' },
    { id: 'kitchen-chair-south-b', model: 'chairCushion', at: [1.3, 1.2], facing: 'N' },
    { id: 'kitchen-chair-east', model: 'chairCushion', at: [1.95, 0.55], facing: 'W' },
    { id: 'kitchen-west-cabinet', model: 'kitchenCabinet', against: { wall: 'west', at: 2.2 }, facing: 'E' },
    { id: 'kitchen-west-cabinet-b', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 2.74 }, facing: 'E' },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-west-cabinet' } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@3,1', against: { wall: 'front-rear-partition', side: 'N', at: 1.3 }, facing: 'N' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'front-rear-partition', side: 'N', at: 1.84 }, facing: 'N' },
    { id: 'kitchen-cabinet-a', model: 'kitchenCabinet', against: { wall: 'front-rear-partition', side: 'N', at: 2.38 }, facing: 'N' },
    { id: 'kitchen-cabinet-b', model: 'kitchenCabinetDrawer', against: { wall: 'front-rear-partition', side: 'N', at: 2.92 }, facing: 'N' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@3,3', against: { wall: 'front-rear-partition', side: 'N', at: 3.46 }, facing: 'N' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-a' } },
    // Escritório: secretária com a cadeira à frente, estantes na parede nascente, sofá de
    // reuniões sob a janela norte e aparador.
    { id: 'office-desk', model: 'desk', logic: 'desk@2,4', at: [4.6, 2.9], facing: 'E' },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@3,5', at: [5.2, 3.15], facing: 'W' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' }, facing: 'E' },
    { id: 'office-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@1,7', against: { wall: 'east', at: 1.45 }, facing: 'W' },
    { id: 'office-bookcase-south', model: 'bookcaseOpenLow', logic: 'bookshelf@1,7', against: { wall: 'east', at: 2.0 }, facing: 'W' },
    { id: 'office-bookcase-books', model: 'books', on: { parent: 'office-bookcase' } },
    { id: 'office-bookcase-south-books', model: 'books', on: { parent: 'office-bookcase-south' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'north', at: 5.9 } },
    { id: 'office-coffee-table', model: 'tableCoffee', at: [5.9, 1.2] },
    { id: 'office-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 3.3 }, facing: 'W' },
    // Sala de estar: sofá de canto virado para o televisor, mesa de centro e rádio.
    { id: 'living-television-stand', model: 'cabinetTelevision', logic: 'tv@4,2', at: [2.45, 4.5], facing: 'S' },
    { id: 'living-television', model: 'televisionVintage', logic: 'tv@4,2', on: { parent: 'living-television-stand' } },
    { id: 'living-sofa', model: 'loungeSofaCorner', logic: 'sofa@6,0', at: [0.7, 7.3], facing: 'N' },
    { id: 'living-coffee-table', model: 'tableCoffeeSquare', at: [1.55, 6.35] },
    { id: 'living-clock-table', model: 'sideTable', at: [1.75, 7.72] },
    { id: 'living-clock', model: 'radio', logic: 'clock@7,1', on: { parent: 'living-clock-table' } },
    { id: 'living-armchair', model: 'loungeChair', at: [2.4, 6.6], facing: 'N' },
    // Sala de jantar: recanto de conversa sobre o tapete com candeeiros de pé a nascente,
    // mesa de jantar com quatro cadeiras a sul e aparador na divisória da sala.
    { id: 'dining-rug', model: 'rugRectangle', logic: 'rug@4,5', at: [6.15, 5], facing: 'S' },
    { id: 'dining-chair', model: 'loungeChair', logic: 'chair@4,4', at: [4.55, 4.6], facing: 'E' },
    { id: 'dining-armchair-east', model: 'loungeChair', at: [6.85, 5.0], facing: 'W' },
    { id: 'dining-coffee-table', model: 'tableCoffeeSquare', at: [5.75, 4.95] },
    { id: 'dining-lamp-south', model: 'lampRoundFloor', logic: 'lamp@5,7', at: [7.3, 5.25], facing: 'N' },
    { id: 'dining-lamp-north', model: 'lampRoundFloor', logic: 'lamp@4,7', at: [7.7, 4.4], facing: 'N' },
    { id: 'dining-table', model: 'table', at: [5.6, 7.0], facing: 'N' },
    { id: 'dining-chair-north-a', model: 'chairCushion', at: [5.3, 6.4], facing: 'S' },
    { id: 'dining-chair-north-b', model: 'chairCushion', at: [5.9, 6.4], facing: 'S' },
    { id: 'dining-chair-south-a', model: 'chairCushion', at: [5.3, 7.6], facing: 'N' },
    { id: 'dining-chair-south-b', model: 'chairCushion', at: [5.9, 7.6], facing: 'N' },
    { id: 'dining-chair-west', model: 'chairCushion', at: [4.75, 7.0], facing: 'E' },
    { id: 'dining-chair-east', model: 'chairCushion', at: [6.45, 7.0], facing: 'W' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'living-dining-south-screen', side: 'E', at: 7.3 }, facing: 'E' },
  ],
}
