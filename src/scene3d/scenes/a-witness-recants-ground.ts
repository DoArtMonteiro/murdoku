import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [6.5, 5.3]
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairLength = MODEL_BOUNDS.stairsOpen.size[0] / CELL

export const aWitnessRecantsStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairLength / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairLength / 2,
]

export const aWitnessRecantsGround: SceneSpec = {
  puzzleId: 'expert-2',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.1, kind: 'window' },
      { wall: 'north', at: 6.8, kind: 'window' },
      { wall: 'west', at: 1.8, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  exteriorSupportBays: [
    { id: 'garden-north-bay', cells: [2, 0, 4, 2] },
    { id: 'garden-centre-bay', cells: [2, 3, 4, 5] },
    { id: 'garden-south-bay', cells: [2, 6, 4, 7] },
  ],
  floors: [
    { id: 'hallway', cells: [0, 0, 1, 7], material: 'wood', kind: 'interior' },
    { id: 'garden-spine', cells: [2, 0, 4, 7], material: 'grass', kind: 'exterior' },
    { id: 'dining-room', cells: [5, 0, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'pantry', cells: [5, 5, 7, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    {
      id: 'hallway-garden-edge',
      from: [2, 0],
      to: [2, 8],
      height: 'half',
      openings: [{ at: 4.5, width: 1.2, kind: 'open' }],
    },
    {
      id: 'dining-garden-edge',
      from: [5, 0],
      to: [5, 8],
      height: 'half',
      openings: [{ at: 2.5, width: 1.2, kind: 'open' }],
    },
  ],
  furniture: [
    // Jardim: arbustos e vasos em grupos soltos, flores e pedras junto ao caminho lajeado.
    { id: 'garden-plant-southwest', model: 'pottedPlant', logic: 'plant@2,2', at: [2.6, 2.45] },
    { id: 'garden-shrub-east-north', model: 'plant_bushSmall', logic: 'shrub@1,4', at: [4.45, 1.45] },
    { id: 'garden-shrub-east-south', model: 'plant_bushSmall', logic: 'shrub@3,4', at: [4.55, 3.55] },
    { id: 'garden-plant-north', model: 'flower_yellowA', logic: 'plant@0,3', at: [3.5, 0.5] },
    { id: 'garden-idris-shrub', model: 'plant_bushSmall', logic: 'shrub@1,2', at: [2.5, 1.5] },
    { id: 'garden-flower-red', model: 'flower_redA', at: [3.2, 0.35] },
    { id: 'garden-flower-purple', model: 'flower_purpleA', at: [3.8, 0.4] },
    { id: 'garden-flower-red-south', model: 'flower_redA', at: [2.4, 6.9] },
    { id: 'garden-flower-purple-south', model: 'flower_purpleA', at: [2.6, 7.5] },
    { id: 'garden-rock', model: 'rock_smallA', at: [4.4, 6.9] },
    { id: 'garden-rock-flat', model: 'rock_smallFlatA', at: [3.7, 7.35] },
    { id: 'garden-stump', model: 'stump_round', at: [4.5, 5.6] },
    // Átrio: relógios e vaso nas paredes, cabide junto à porta e consola.
    { id: 'hall-clock-south', model: 'speaker', logic: 'clock@3,1', at: [1.5, 3.5] },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@4,1', at: [1.2, 4.5] },
    { id: 'hall-clock-north', model: 'speaker', logic: 'clock@7,0', at: [0.5, 7.5] },
    { id: 'hall-clock-west', model: 'speaker', logic: 'clock@0,1', at: [1.5, 0.5] },
    { id: 'hall-coat-rack', model: 'coatRackStanding', at: [0.3, 5.55] },
    { id: 'hall-console', model: 'sideTableDrawers', against: { wall: 'west', at: 2.6 }, facing: 'E' },
    { id: 'hall-console-books', model: 'books', on: { parent: 'hall-console' } },
    // Sala de jantar: mesa em cabine entre dois bancos estofados, cadeira à cabeceira;
    // aparador com candeeiro na parede do jardim e cómoda a nascente.
    { id: 'dining-banquette', model: 'loungeSofa', against: { wall: 'north', at: 6.6 } },
    { id: 'dining-nook-table', model: 'tableCloth', at: [6.6, 1.0] },
    { id: 'dining-banquette-south', model: 'loungeSofa', at: [6.6, 1.56], facing: 'N' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@0,5', at: [5.68, 0.95], facing: 'E' },
    { id: 'dining-floor-lamp', model: 'lampRoundFloor', logic: 'lamp@3,5', at: [5.75, 3.15] },
    { id: 'dining-table', model: 'cabinetTelevisionDoors', logic: 'table@4,5', against: { wall: 'dining-garden-edge', side: 'E', at: 4.45 }, facing: 'E' },
    { id: 'dining-table-radio', model: 'radio', on: { parent: 'dining-table' }, facing: 'E' },
    { id: 'dining-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'east', at: 2.9 }, facing: 'W' },
    { id: 'dining-dresser-speaker', model: 'speakerSmall', on: { parent: 'dining-dresser' } },
    // Copa: bancada com lava-loiça e placa na parede sul, frigorífico e caixas a nascente.
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@7,7', at: [7.62, 7.55] },
    { id: 'pantry-box-open', model: 'cardboardBoxOpen', at: [7.62, 5.55], facing: 'W' },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,7', at: [7.6, 6.5], facing: 'W' },
    { id: 'pantry-cabinet-west', model: 'kitchenCabinet', against: { wall: 'south', at: 5.36 }, facing: 'N' },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-cabinet-west' } },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'south', at: 5.9 }, facing: 'N' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'south', at: 6.44 }, facing: 'N' },
    { id: 'pantry-cabinet-east', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 6.98 }, facing: 'N' },
    { id: 'pantry-toaster', model: 'toaster', on: { parent: 'pantry-cabinet-east' } },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [2.75, 4.5] },
    { id: 'garden-path-b', model: 'path_stone', at: [3.55, 3.9], facing: 'E' },
    { id: 'garden-path-c', model: 'path_stone', at: [3.6, 2.85], facing: 'E' },
    { id: 'garden-path-d', model: 'path_stone', at: [4.35, 2.5] },
  ],
}
