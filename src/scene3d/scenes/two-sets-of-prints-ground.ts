import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [0.65, 5.3]
const stairwellHalfRun = MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL)
const stairwellHalfWidth = MODEL_BOUNDS.stairsOpen.size[2] / (2 * CELL)
export const twoSetsOfPrintsStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairwellHalfWidth,
  stairAt[1] - stairwellHalfRun,
  stairAt[0] + stairwellHalfWidth,
  stairAt[1] + stairwellHalfRun,
]

export const twoSetsOfPrintsGround: SceneSpec = {
  puzzleId: 'master-6',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 7.2 },
  shell: { features: [
    { wall: 'north', at: 3.5, kind: 'window' },
    { wall: 'north', at: 5.5, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  floors: [
    { id: 'hallway', cells: [0, 0, 1, 7], material: 'wood' },
    { id: 'kitchen', cells: [2, 0, 3, 7], material: 'tile' },
    { id: 'living-room', cells: [4, 0, 5, 7], material: 'wood' },
    { id: 'office', cells: [6, 0, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'hall-kitchen', from: [2, 0], to: [2, 8], height: 'half', openings: [{ at: 1.6, width: 1.4, kind: 'door' }] },
    { id: 'kitchen-living', from: [4, 0], to: [4, 8], height: 'half', openings: [{ at: 7.2, width: 1.2, kind: 'open' }] },
    { id: 'living-office', from: [6, 0], to: [6, 8], height: 'half', openings: [{ at: 1.0, width: 1.2, kind: 'door' }] },
  ],
  furniture: [
    // Átrio: tapete, consola com rádio junto à escada e planta junto à entrada.
    { id: 'hallway-rug', model: 'rugRectangle', logic: 'rug@2,0', at: [1, 2.7], facing: 'E' },
    { id: 'hallway-clock-table', model: 'sideTable', at: [1.8, 5.5], facing: 'E' },
    { id: 'hallway-clock', model: 'radio', logic: 'clock@5,1', on: { parent: 'hallway-clock-table' } },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@7,1', at: [1.5, 7.5] },
    { id: 'hallway-coat-rack', model: 'coatRackStanding', at: [0.3, 0.3] },
    // Cozinha em L: bancada com lava-loiça a norte, armários e frigorífico de bancada na
    // parede nascente, placa na parede do átrio e mesa de refeição a sul.
    { id: 'kitchen-counter', model: 'kitchenCabinetDrawer', logic: 'counter@0,2', against: { wall: 'north', at: 2.35 }, facing: 'S' },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@0,2', against: { wall: 'north', at: 2.89 }, facing: 'S' },
    { id: 'kitchen-counter-east', model: 'kitchenCabinet', logic: 'counter@0,2', against: { wall: 'north', at: 3.43 }, facing: 'S' },
    { id: 'kitchen-east-cabinet', model: 'kitchenCabinet', against: { wall: 'kitchen-living', side: 'W', at: 1.12 }, facing: 'W' },
    { id: 'kitchen-east-drawer', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-living', side: 'W', at: 1.66 }, facing: 'W' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,3', against: { wall: 'kitchen-living', side: 'W', at: 2.2 }, facing: 'W' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@3,2', against: { wall: 'hall-kitchen', side: 'E', at: 3.15 }, facing: 'E' },
    { id: 'kitchen-table', model: 'table', logic: 'table@4,2', at: [3, 4.5], facing: 'N' },
    // Sala: televisor a norte com o sofá em frente; a sul, um segundo recanto de televisão.
    { id: 'living-tv-east', model: 'cabinetTelevision', logic: 'tv@2,5', against: { wall: 'living-office', side: 'W', at: 2.5 }, facing: 'W' },
    { id: 'living-tv-east-set', model: 'televisionVintage', on: { parent: 'living-tv-east' } },
    { id: 'living-north-sofa', model: 'loungeSofa', against: { wall: 'kitchen-living', side: 'E', at: 2.5 }, facing: 'E' },
    { id: 'living-tv-west', model: 'cabinetTelevision', logic: 'tv@4,4', at: [4.6, 4.2], facing: 'S' },
    { id: 'living-tv-west-set', model: 'televisionModern', on: { parent: 'living-tv-west' } },
    { id: 'living-clock-table', model: 'sideTable', at: [5.6, 4.35], facing: 'S' },
    { id: 'living-clock', model: 'radio', logic: 'clock@4,5', on: { parent: 'living-clock-table' } },
    { id: 'living-sofa', model: 'loungeSofa', at: [4.8, 5.6], facing: 'N' },
    { id: 'living-lamp', model: 'lampRoundFloor', at: [5.75, 6.3] },
    // Escritório: cadeira de leitura e estante a norte; secretária com cadeira na parede
    // nascente; estantes viradas para a sala; rádio numa mesa a sul.
    { id: 'office-chair-north', model: 'chair', logic: 'chair@1,7', at: [7.5, 1.5], facing: 'W' },
    { id: 'office-bookcase-north', model: 'bookcaseOpenLow', logic: 'bookshelf@2,7', at: [7.5, 2.5], facing: 'W' },
    { id: 'office-desk', model: 'desk', logic: 'desk@5,7', against: { wall: 'east', at: 5.5 }, facing: 'W' },
    { id: 'office-chair', model: 'chairDesk', logic: 'chair@5,6', at: [6.95, 5.5], facing: 'E' },
    { id: 'office-bookshelf', model: 'bookcaseOpen', logic: 'bookshelf@4,6', at: [6.5, 4.25], facing: 'S' },
    { id: 'office-bookshelf-books', model: 'books', on: { parent: 'office-bookshelf', surface: 'shelf2' } },
    { id: 'office-bookshelf-low', model: 'bookcaseOpenLow', logic: 'bookshelf@4,6', at: [7.4, 4.25], facing: 'S' },
    { id: 'office-clock-table', model: 'sideTable', at: [6.8, 7.5], facing: 'E' },
    { id: 'office-clock', model: 'radio', logic: 'clock@7,6', on: { parent: 'office-clock-table' } },
  ],
}
