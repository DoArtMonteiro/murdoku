import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [6.4, 2.8]
const stairLengthCells = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidthCells = MODEL_BOUNDS.stairsOpen.size[2] / CELL

export const lockedPantryStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidthCells / 2,
  stairAt[1] - stairLengthCells / 2,
  stairAt[0] + stairWidthCells / 2,
  stairAt[1] + stairLengthCells / 2,
]

export const theLockedPantryGround: SceneSpec = {
  puzzleId: 'expert-3',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 6.2 },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 7.0, kind: 'window' },
    { wall: 'west', at: 2.0, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  exteriorSupportBays: [
    { id: 'rear-garden-west-bay', cells: [0, 5, 1, 7] },
    { id: 'rear-garden-east-bay', cells: [2, 5, 3, 7] },
  ],
  floors: [
    { id: 'living-room', cells: [0, 0, 7, 2], material: 'wood' },
    { id: 'hallway', cells: [0, 3, 7, 4], material: 'stone' },
    { id: 'rear-garden', cells: [0, 5, 3, 7], material: 'grass', kind: 'exterior' },
    { id: 'kitchen', cells: [4, 5, 7, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'rear-garden-facade', from: [0, 5], to: [4, 5], height: 'half', openings: [{ at: 3.45, width: 1.0, kind: 'open' }] },
    { id: 'hall-kitchen', from: [4, 5], to: [8, 5], height: 'half', openings: [{ at: 6.5, width: 1.2, kind: 'door' }] },
    { id: 'kitchen-garden-facade', from: [4, 5], to: [4, 8], height: 'half', openings: [{ at: 7.5, width: 0.95, kind: 'door' }] },
  ],
  furniture: [
    // Sala: parede de estar a norte com estante e televisão; o sofá e a poltrona olham para ela
    // sobre o tapete. A poente, um recanto de televisão com sofá contra a janela.
    { id: 'living-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 2.55 } },
    { id: 'living-tv-north', model: 'cabinetTelevision', logic: 'tv@0,4', against: { wall: 'north', at: 4.4 } },
    { id: 'living-tv-north-set', model: 'televisionModern', on: { parent: 'living-tv-north' } },
    { id: 'living-rug', model: 'rugRectangle', logic: 'rug@0,2', at: [3.6, 1.1] },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [4.3, 1.2] },
    { id: 'living-sofa', model: 'loungeSofa', at: [4.25, 2.05], facing: 'N' },
    { id: 'living-armchair', model: 'loungeChair', at: [5.35, 1.2], facing: 'W' },
    { id: 'living-tv-west', model: 'cabinetTelevision', logic: 'tv@2,2', at: [2.84, 2.35], facing: 'W' },
    { id: 'living-tv-west-set', model: 'televisionVintage', on: { parent: 'living-tv-west' }, facing: 'W' },
    { id: 'den-divider-shelf', model: 'bookcaseOpenLow', at: [3.22, 2.35], facing: 'E' },
    { id: 'den-divider-books', model: 'books', on: { parent: 'den-divider-shelf' } },
    { id: 'den-sofa', model: 'loungeSofa', against: { wall: 'west', at: 2.3 }, facing: 'E' },
    { id: 'den-table', model: 'tableCoffeeSquare', at: [1.45, 2.3] },
    { id: 'den-lamp', model: 'lampSquareFloor', at: [0.3, 1.3] },
    // Entrada: o sofá encosta à parede nascente junto à porta, com cabide; o relógio fica ao lado da escada.
    { id: 'living-sofa-east', model: 'loungeSofa', logic: 'sofa@1,7', against: { wall: 'east', at: 2.0 }, facing: 'W' },
    { id: 'entry-coat-rack', model: 'coatRackStanding', at: [7.65, 0.35] },
    { id: 'living-clock-east', model: 'speaker', logic: 'clock@2,6', at: [6.99, 2.85] },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@4,2', at: [2.6, 4.55] },
    { id: 'hall-clock-south', model: 'speaker', logic: 'clock@4,5', at: [5.5, 4.85] },
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@3,0', at: [1.0, 3.8], facing: 'N' },
    // Jardim: sebe de arbustos junto à fachada, flores, pedras e um banco no canto.
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@5,0', at: [0.45, 5.45] },
    { id: 'garden-shrub-centre', model: 'plant_bushSmall', logic: 'shrub@5,1', at: [1.55, 5.5] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@5,2', at: [2.5, 5.4] },
    { id: 'garden-plant-southeast', model: 'flower_purpleA', logic: 'plant@6,3', at: [3.5, 6.5] },
    { id: 'garden-flower-red', model: 'flower_redA', at: [3.55, 6.15] },
    { id: 'garden-flower-yellow', model: 'flower_yellowA', at: [0.35, 6.3] },
    { id: 'garden-rock', model: 'rock_smallA', at: [2.6, 7.6] },
    { id: 'garden-bench', model: 'bench', at: [0.7, 7.6], facing: 'N' },
    // Cozinha: bancadas em L nas paredes nascente e sul, frigorífico a poente e mesa com quatro cadeiras.
    { id: 'kitchen-fridge-west', model: 'kitchenFridge', logic: 'fridge@6,4', against: { wall: 'kitchen-garden-facade', side: 'E', at: 6.72 }, facing: 'E' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'east', at: 5.69 }, facing: 'W' },
    { id: 'kitchen-stove-north', model: 'kitchenStove', logic: 'stove@6,7', against: { wall: 'east', at: 6.23 }, facing: 'W' },
    { id: 'kitchen-counter', model: 'kitchenCabinet', against: { wall: 'east', at: 6.77 }, facing: 'W' },
    { id: 'kitchen-stove-south', model: 'kitchenStove', logic: 'stove@7,7', against: { wall: 'east', at: 7.31 }, facing: 'W' },
    { id: 'kitchen-run-south-a', model: 'kitchenCabinet', against: { wall: 'south', at: 5.3 }, facing: 'N' },
    { id: 'kitchen-run-south-b', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 5.84 }, facing: 'N' },
    { id: 'kitchen-run-south-c', model: 'kitchenCabinet', against: { wall: 'south', at: 6.38 }, facing: 'N' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-run-south-c' } },
    { id: 'kitchen-table', model: 'table', at: [5.75, 6.2] },
    { id: 'kitchen-chair-nw', model: 'chairCushion', at: [5.45, 5.72], facing: 'S' },
    { id: 'kitchen-chair-ne', model: 'chairCushion', at: [6.05, 5.72], facing: 'S' },
    { id: 'kitchen-chair-west', model: 'chairCushion', at: [5.45, 6.72], facing: 'N' },
    { id: 'kitchen-chair-east', model: 'chairCushion', at: [6.05, 6.72], facing: 'N' },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [2.95, 5.75], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [3.0, 7.05], facing: 'E' },
  ],
}
