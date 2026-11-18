import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairRunCells = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidthCells = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairHeadRow = 1.0
const stairAt: [number, number] = [6.32, stairHeadRow + stairRunCells / 2]
const stairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidthCells / 2,
  stairHeadRow,
  stairAt[0] + stairWidthCells / 2,
  stairHeadRow + stairRunCells,
]

export const nobodyWasHomeStairwellBounds = stairwellBounds

export const nobodyWasHomeGround: SceneSpec = {
  puzzleId: 'master-8',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 7.4 },
  shell: {
    features: [
      { wall: 'north', at: 4.6, kind: 'window' },
      { wall: 'west', at: 1.2, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    { id: 'garden-north-bay', cells: [0, 3, 2, 4] },
    { id: 'garden-south-bay', cells: [0, 5, 2, 7] },
  ],
  floors: [
    { id: 'pantry-tile', cells: [0, 0, 2, 2], material: 'tile', kind: 'interior' },
    { id: 'living-room-wood', cells: [3, 0, 5, 7], material: 'wood', kind: 'interior' },
    { id: 'hallway-stone', cells: [6, 0, 7, 7], material: 'stone', kind: 'interior' },
    { id: 'garden-earth', cells: [0, 3, 2, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    {
      id: 'pantry-living-room',
      from: [3, 0],
      to: [3, 3],
      height: 'cutaway',
      openings: [{ at: 2.4, width: 1.0, kind: 'door' }],
    },
    {
      id: 'garden-living-room-facade',
      from: [3, 3],
      to: [3, 8],
      height: 'half',
      openings: [{ at: 6.5, width: 1.2, kind: 'open' }],
    },
    {
      id: 'pantry-garden-edge',
      from: [0, 3],
      to: [3, 3],
      height: 'cutaway',
      openings: [{ at: 1.5, width: 1.1, kind: 'door' }],
    },
    {
      id: 'living-room-hallway',
      from: [6, 5.6],
      to: [6, 8],
      height: 'cutaway',
      openings: [{ at: 6.4, width: 1.6, kind: 'open' }],
      freeEnds: ['from'],
    },
  ],
  furniture: [
    // Sala: televisor norte com o sofá em frente sobre o tapete; poltrona virada para o
    // segundo televisor; a sul, mesa de refeições com quatro cadeiras.
    { id: 'living-clock-north', model: 'speaker', logic: 'clock@0,5', at: [5.5, 0.5], facing: 'S' },
    { id: 'living-tv-north', model: 'cabinetTelevision', logic: 'tv@0,3', at: [3.65, 0.4], facing: 'S' },
    { id: 'living-tv-north-set', model: 'televisionModern', on: { parent: 'living-tv-north' } },
    { id: 'living-rug', model: 'rugRectangle', logic: 'rug@2,3', at: [4.1, 3.0], facing: 'E' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [4.1, 2.25], facing: 'N' },
    { id: 'living-sofa', model: 'loungeSofa', at: [4.1, 3.55], facing: 'N' },
    { id: 'living-armchair', model: 'loungeChair', at: [5.3, 4.45], facing: 'S' },
    { id: 'living-tv-south', model: 'cabinetTelevision', logic: 'tv@5,5', at: [5.5, 5.35], facing: 'N' },
    { id: 'living-tv-south-set', model: 'televisionVintage', on: { parent: 'living-tv-south' } },
    { id: 'dining-table', model: 'table', at: [4.5, 6.9], facing: 'S' },
    { id: 'dining-chair-nw', model: 'chair', at: [4.2, 6.3], facing: 'S' },
    { id: 'dining-chair-ne', model: 'chair', at: [4.8, 6.3], facing: 'S' },
    { id: 'dining-chair-west', model: 'chair', at: [3.75, 6.9], facing: 'E' },
    { id: 'dining-chair-east', model: 'chair', at: [5.25, 6.9], facing: 'W' },
    { id: 'dining-rug', model: 'rugRectangle', at: [4.5, 6.85] },
    // Átrio: a porta de entrada abre a norte, junto ao topo da escada; banco, planta,
    // tapete ao pé da escada e mesas de apoio com relógios a sul.
    { id: 'hallway-bench', model: 'bench', against: { wall: 'east', at: 1.6 }, facing: 'W' },
    { id: 'hallway-plant-north', model: 'pottedPlant', logic: 'plant@1,6', at: [6.99, 1.5], facing: 'E' },
    { id: 'hallway-rug', model: 'rugRectangle', logic: 'rug@3,6', at: [7.425, 4.0], facing: 'E' },
    { id: 'hallway-clock-south-table', model: 'sideTable', at: [7.72, 6.5], facing: 'W' },
    { id: 'hallway-clock-south', model: 'radio', logic: 'clock@6,7', on: { parent: 'hallway-clock-south-table' } },
    { id: 'hallway-plant-south', model: 'pottedPlant', logic: 'plant@7,6', at: [6.5, 7.5], facing: 'S' },
    { id: 'hallway-clock-corner-table', model: 'sideTable', at: [7.72, 7.5], facing: 'W' },
    { id: 'hallway-clock-corner', model: 'radio', logic: 'clock@7,7', on: { parent: 'hallway-clock-corner-table' } },
    // Copa: bancada com placa a norte, lava-loiça a poente e frigorífico de bancada junto à porta.
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@0,1', against: { wall: 'north', at: 1.27 }, facing: 'S' },
    { id: 'pantry-counter-b', model: 'kitchenCabinetDrawer', logic: 'counter@0,1', against: { wall: 'north', at: 1.81 }, facing: 'S' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'north', at: 2.35 }, facing: 'S' },
    { id: 'pantry-corner', model: 'kitchenCabinet', against: { wall: 'west', at: 0.75 }, facing: 'E' },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'west', at: 1.29 }, facing: 'E' },
    { id: 'pantry-west-drawer', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 1.83 }, facing: 'E' },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@1,2', against: { wall: 'pantry-living-room', side: 'W', at: 1.1 }, facing: 'W' },
    // Jardim: arbustos e plantas em grupos soltos.
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@7,0', at: [0.5, 7.5], facing: 'S' },
    { id: 'garden-plant-south', model: 'pottedPlant', logic: 'plant@7,1', at: [1.5, 7.5], facing: 'S' },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@5,2', at: [2.5, 5.5], facing: 'S' },
    { id: 'garden-shrub-oscar', model: 'plant_bushSmall', logic: 'shrub@4,1', at: [1.5, 4.5], facing: 'S' },
    { id: 'garden-path-a', model: 'path_stone', at: [1.5, 3.5], facing: 'S' },
    { id: 'garden-rock', model: 'rock_smallA', at: [0.5, 5.6] },
  ],
}
