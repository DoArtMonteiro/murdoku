import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairRun = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairAt: [number, number] = [3.65, 5.5]
const stairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairRun / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairRun / 2,
]
const stairPartitionClearance = 0.2

export const noOneHeardStairwellBounds = stairwellBounds

export const noOneHeardGround: SceneSpec = {
  puzzleId: 'expert-8',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 4.25 },
  shell: { features: [
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 6.35, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  exteriorSupportBays: [
    { id: 'front-yard-west-frame', cells: [0, 0, 2, 2] },
    { id: 'front-yard-east-frame', cells: [3, 0, 4, 2] },
  ],
  floors: [
    { id: 'front-yard', cells: [0, 0, 4, 2], material: 'grass', kind: 'exterior' },
    { id: 'pantry-floor', cells: [5, 0, 7, 2], material: 'tile', kind: 'interior' },
    { id: 'hallway-floor', cells: [0, 3, 7, 4], material: 'stone', kind: 'interior' },
    { id: 'dining-room-floor', cells: [0, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'yard-hall-facade', from: [0, 3], to: [5, 3], height: 'half', openings: [{ at: 2.5, width: 1.25, kind: 'door' }] },
    { id: 'yard-pantry-partition', from: [5, 0], to: [5, 3], height: 'half', openings: [{ at: 1.5, width: 1.1, kind: 'door' }] },
    { id: 'pantry-hall-partition', from: [5, 3], to: [8, 3], height: 'half', openings: [{ at: 5.5, width: 1, kind: 'door' }] },
    {
      id: 'hall-dining-west-partition',
      from: [0, 5],
      to: [stairwellBounds[0] - stairPartitionClearance, 5],
      height: 'half',
      freeEnds: ['to'],
      openings: [{ at: 2.3, width: 0.9, kind: 'door' }],
    },
    {
      id: 'hall-dining-east-partition',
      from: [stairwellBounds[2] + stairPartitionClearance, 5],
      to: [8, 5],
      height: 'half',
      freeEnds: ['from'],
      openings: [{ at: 5.5, width: 1.15, kind: 'door' }],
    },
  ],
  furniture: [
    // Sala de estar a poente da escada: sofá na parede sul entre dois candeeiros, mesa
    // baixa, poltrona em frente e móvel de televisão na parede poente.
    { id: 'dining-sofa', model: 'loungeSofa', against: { wall: 'south', at: 1.45 }, facing: 'N' },
    { id: 'dining-west-lamp', model: 'lampRoundFloor', logic: 'lamp@7,0', at: [0.35, 7.6], facing: 'N' },
    { id: 'dining-victim-lamp', model: 'lampRoundFloor', logic: 'lamp@7,2', at: [2.45, 7.6], facing: 'N' },
    { id: 'dining-coffee-table', model: 'tableCoffee', at: [1.45, 6.75] },
    { id: 'dining-chair-west', model: 'loungeChair', logic: 'chair@5,1', at: [1.45, 5.65], facing: 'S' },
    { id: 'dining-culprit-lamp', model: 'lampRoundFloor', logic: 'lamp@5,0', at: [0.35, 5.35], facing: 'N' },
    { id: 'dining-tv-console', model: 'cabinetTelevision', against: { wall: 'west', at: 6.6 }, facing: 'E' },
    { id: 'dining-tv', model: 'televisionVintage', on: { parent: 'dining-tv-console' }, facing: 'E' },
    { id: 'living-plant', model: 'pottedPlant', at: [2.85, 5.78] },
    // Sala de jantar a nascente: mesa com quatro cadeiras, aparador na parede sul e vaso.
    { id: 'dining-table', model: 'table', logic: 'table@5,6', at: [6.75, 5.7], facing: 'N' },
    { id: 'dining-chair-table', model: 'chair', logic: 'chair@5,5', at: [5.8, 5.8], facing: 'E' },
    { id: 'dining-chair-south-a', model: 'chair', at: [6.45, 6.35], facing: 'N' },
    { id: 'dining-chair-south-b', model: 'chair', at: [7.05, 6.35], facing: 'N' },
    { id: 'dining-chair-east', model: 'chair', at: [7.65, 5.7], facing: 'W' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'south', at: 6.6 }, facing: 'N' },
    { id: 'dining-bookcase', model: 'bookcaseOpenLow', against: { wall: 'south', at: 4.9 }, facing: 'N' },
    // Corredor de entrada: vasos e rádio junto à porta da rua, banco sob a fachada do
    // pátio e consola com rádio junto à copa.
    { id: 'hallway-plant-north', model: 'pottedPlant', logic: 'plant@3,1', at: [1.5, 3.3] },
    { id: 'hallway-plant-southwest', model: 'pottedPlant', logic: 'plant@4,0', at: [0.3, 4.75] },
    { id: 'hallway-clock-table', model: 'sideTable', at: [2.6, 4.25] },
    { id: 'hallway-clock', model: 'radio', logic: 'clock@4,2', on: { parent: 'hallway-clock-table' } },
    { id: 'hallway-bench', model: 'benchCushion', against: { wall: 'yard-hall-facade', side: 'S', at: 4.3 }, facing: 'S' },
    { id: 'hallway-clock-table-southeast', model: 'sideTable', against: { wall: 'pantry-hall-partition', side: 'S', at: 6.75 }, facing: 'S' },
    { id: 'hallway-clock-southeast', model: 'radio', logic: 'clock@3,6', on: { parent: 'hallway-clock-table-southeast' } },
    { id: 'hallway-shelf-east', model: 'bookcaseOpenLow', against: { wall: 'east', at: 4.2 }, facing: 'W' },
    // Pátio: arbustos e vaso a norte, banco e caminho de pedra até à porta do corredor.
    { id: 'yard-shrub-west', model: 'plant_bushSmall', logic: 'shrub@1,0', at: [0.5, 1.5] },
    { id: 'yard-plant-east', model: 'pottedPlant', logic: 'plant@0,4', at: [4.5, 0.5] },
    { id: 'yard-shrub-east', model: 'plant_bushSmall', logic: 'shrub@0,3', at: [3.5, 0.5] },
    { id: 'yard-bench', model: 'bench', at: [1.6, 0.3], facing: 'S' },
    { id: 'yard-bush', model: 'plant_bush', at: [0.45, 0.45] },
    { id: 'yard-rock', model: 'rock_smallA', at: [4.3, 2.3] },
    { id: 'yard-flowers', model: 'flower_yellowA', at: [0.7, 2.4] },
    // Copa: frigorífico, armário, lava-loiça sob a janela, fogão e segundo frigorífico na
    // parede norte; caixas e balde do lixo a nascente.
    { id: 'pantry-fridge-west', model: 'kitchenFridge', logic: 'fridge@0,5', against: { wall: 'north', at: 5.35 }, facing: 'S' },
    { id: 'pantry-cabinet', model: 'kitchenCabinet', against: { wall: 'north', at: 5.89 }, facing: 'S' },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'north', at: 6.43 }, facing: 'S' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'north', at: 6.97 }, facing: 'S' },
    { id: 'pantry-fridge-east', model: 'kitchenFridge', logic: 'fridge@0,7', against: { wall: 'north', at: 7.6 }, facing: 'S' },
    { id: 'pantry-box-greta', model: 'cardboardBoxClosed', logic: 'box@1,7', at: [7.75, 1.55] },
    { id: 'pantry-box-south', model: 'cardboardBoxClosed', logic: 'box@2,7', at: [7.75, 2.5] },
    { id: 'pantry-bin', model: 'trashcan', at: [7.7, 2.05] },
  ],
  rugs: [
    { id: 'yard-path-a', model: 'path_stone', at: [2.5, 2.4], facing: 'S' },
    { id: 'yard-path-b', model: 'path_stone', at: [2.5, 1.45], facing: 'S' },
  ],
}
