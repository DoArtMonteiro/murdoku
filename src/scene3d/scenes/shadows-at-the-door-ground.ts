import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairRun = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairAt: [number, number] = [1.5, 5.96]
const stairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairRun / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairRun / 2,
]

export const shadowsAtTheDoorStairwellBounds = stairwellBounds

export const shadowsAtTheDoorGround: SceneSpec = {
  puzzleId: 'master-2',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 4.45 },
  shell: { features: [
    { wall: 'north', at: 2.9, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 5.6, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  exteriorSupportBays: [
    { id: 'garden-north-west', cells: [4, 4, 5, 6] },
    { id: 'garden-south-west', cells: [4, 7, 5, 7] },
    { id: 'garden-north-east', cells: [6, 4, 7, 6] },
    { id: 'garden-south-east', cells: [6, 7, 7, 7] },
  ],
  floors: [
    { id: 'kitchen-floor', cells: [0, 0, 3, 3], material: 'tile', kind: 'interior' },
    { id: 'dining-floor', cells: [4, 0, 7, 3], material: 'wood', kind: 'interior' },
    { id: 'living-floor', cells: [0, 4, 3, 7], material: 'wood', kind: 'interior' },
    { id: 'garden-ground', cells: [4, 4, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'kitchen-dining-partition', from: [4, 0], to: [4, 4], height: 'half', openings: [{ at: 2.5, width: 1.0, kind: 'door' }] },
    { id: 'kitchen-living-partition', from: [0, 4], to: [4, 4], height: 'half', openings: [{ at: 3.35, width: 1, kind: 'door' }] },
    { id: 'dining-garden-facade', from: [4, 4], to: [8, 4], height: 'half', openings: [{ at: 4.95, width: 1.0, kind: 'door' }] },
    { id: 'living-garden-facade', from: [4, 4], to: [4, 8], height: 'half', openings: [{ at: 5.0, width: 1.0, kind: 'door' }] },
    // Retorno baixo da coluna do frigorífico: o segundo frigorífico fica de pé, virado a sul.
    { id: 'kitchen-fridge-return', from: [3.1, 1], to: [4, 1], height: 'half', freeEnds: ['from'] },
  ],
  furniture: [
    // Cozinha em U: fogão e frigorífico na parede norte, lava-loiça na parede poente,
    // armário no recanto norte e segundo frigorífico de pé contra o retorno junto à porta da sala de jantar; mesa de pequeno-almoço.
    { id: 'kitchen-corner-cabinet', model: 'kitchenCabinet', against: { wall: 'north', at: 0.33 } },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@0,0', against: { wall: 'north', at: 0.87 } },
    { id: 'kitchen-north-cabinet', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 1.41 } },
    { id: 'kitchen-fridge-north', model: 'kitchenFridge', logic: 'fridge@0,1', against: { wall: 'north', at: 1.95 } },
    { id: 'kitchen-west-drawer', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 0.9 } },
    { id: 'kitchen-counter-upper-run', model: 'kitchenCabinet', logic: 'counter@1,0', against: { wall: 'west', at: 1.44 } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'west', at: 1.98 } },
    { id: 'kitchen-counter-lower-run', model: 'kitchenCabinet', logic: 'counter@1,0', against: { wall: 'west', at: 2.52 } },
    { id: 'kitchen-east-cabinet', model: 'kitchenCabinet', against: { wall: 'kitchen-dining-partition', side: 'W', at: 0.35 }, facing: 'W' },
    { id: 'kitchen-fridge-clue', model: 'kitchenFridge', logic: 'fridge@1,3', against: { wall: 'kitchen-fridge-return', side: 'S', at: 3.55 }, facing: 'S' },
    { id: 'kitchen-table', model: 'tableRound', at: [2.1, 2.45] },
    { id: 'kitchen-chair-north', model: 'chair', at: [2.1, 1.75], facing: 'S' },
    { id: 'kitchen-chair-south', model: 'chair', at: [2.1, 3.15], facing: 'N' },
    // Sala de jantar: mesa com quatro cadeiras sobre o tapete, aparador a norte,
    // poltrona de leitura no canto nordeste e candeeiro junto à porta do jardim.
    { id: 'dining-table', model: 'table', logic: 'table@3,6', at: [6.9, 3.15], facing: 'S' },
    { id: 'dining-chair-table-north', model: 'chair', at: [6.6, 2.5], facing: 'S' },
    { id: 'dining-chair-table-north-b', model: 'chair', at: [7.2, 2.5], facing: 'S' },
    { id: 'dining-chair-table-west', model: 'chair', at: [6.05, 3.15], facing: 'E' },
    { id: 'dining-chair-table-south', model: 'chair', at: [7.75, 3.15], facing: 'W' },
    { id: 'dining-chair-anchor', model: 'loungeChair', logic: 'chair@0,7', at: [7.5, 0.5], facing: 'S' },
    { id: 'dining-reading-lamp', model: 'lampSquareFloor', at: [7.8, 1.15] },
    { id: 'dining-hutch', model: 'bookcaseClosedWide', against: { wall: 'north', at: 5.2 } },
    { id: 'dining-plant', model: 'pottedPlant', at: [4.35, 0.35] },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@3,4', at: [4.3, 3.6], facing: 'S' },
    // Sala de estar: a entrada abre junto ao pé da escada; canto da televisão a sudoeste
    // e zona de conversa a nascente, com sofá, poltrona e mesa baixa sobre o tapete.
    { id: 'living-sofa', model: 'loungeChair', logic: 'sofa@5,0', at: [0.45, 6.35], facing: 'S' },
    { id: 'living-tv-cabinet', model: 'cabinetTelevision', logic: 'tv@7,1', against: { wall: 'south', at: 1.1 }, facing: 'N' },
    { id: 'living-tv', model: 'televisionVintage', logic: 'tv@7,1', on: { parent: 'living-tv-cabinet' } },
    { id: 'living-clock', model: 'speaker', logic: 'clock@4,2', at: [2.75, 4.25], facing: 'S' },
    { id: 'living-lounge-sofa', model: 'loungeSofa', against: { wall: 'south', at: 3.0 }, facing: 'N' },
    { id: 'living-lounge-chair', model: 'loungeChair', at: [3.0, 5.85], facing: 'S' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [3.0, 6.75] },
    { id: 'living-floor-lamp', model: 'lampRoundFloor', at: [3.85, 7.75] },
    { id: 'living-shelf', model: 'bookcaseOpenLow', against: { wall: 'living-garden-facade', side: 'W', at: 6.5 }, facing: 'W' },
    // Jardim: canteiros soltos, caminho de pedra entre as duas portas e banco a sul.
    { id: 'garden-plant-west', model: 'pottedPlant', logic: 'plant@4,5', at: [5.6, 4.6], facing: 'S' },
    { id: 'garden-shrub-north-east', model: 'plant_bushSmall', logic: 'shrub@4,7', at: [7.6, 4.4], facing: 'S' },
    { id: 'garden-plant-east', model: 'pottedPlant', logic: 'plant@5,7', at: [7.35, 5.65], facing: 'S' },
    { id: 'garden-shrub-south-east', model: 'plant_bushSmall', logic: 'shrub@6,7', at: [7.4, 6.5], facing: 'S' },
    { id: 'garden-path-a', model: 'path_stone', at: [4.5, 5.0], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [5.45, 5.3], facing: 'E' },
    { id: 'garden-path-c', model: 'path_stone', at: [4.95, 4.45], facing: 'S' },
    { id: 'garden-bench', model: 'bench', at: [5.6, 7.6], facing: 'N' },
    { id: 'garden-rock-a', model: 'rock_smallA', at: [6.45, 6.2] },
    { id: 'garden-rock-b', model: 'rock_smallFlatA', at: [4.6, 7.2] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.3, 4.45], facing: 'E' },
    { id: 'dining-rug', model: 'rugRectangle', at: [6.9, 2.95] },
    { id: 'living-rug', model: 'rugRound', at: [3.0, 6.75] },
  ],
}
