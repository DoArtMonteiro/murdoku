import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
const stairLength = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairAt: [number, number] = [1, 4.5]
const stairwell: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairLength / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairLength / 2,
]

export const aStoryRehearsedStairwellBounds = stairwell

export const aStoryRehearsedGround: SceneSpec = {
  puzzleId: 'hard-10',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6.5 },
  shell: { features: [
    { wall: 'north', at: 1.3, kind: 'window' },
    { wall: 'west', at: 2.7, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    // Vãos de 3 linhas no alpendre (linhas 6-8): a fila de pilares fica na linha 5|6
    // em vez de 6|7, fora da linha de vista da cadeira de Tomas (R6C8).
    { id: 'northwest-garden-bay', cells: [2, 0, 4, 2] },
    { id: 'northeast-garden-bay', cells: [5, 0, 7, 2] },
    { id: 'middlewest-garden-bay', cells: [2, 3, 4, 4] },
    { id: 'middleeast-garden-bay', cells: [5, 3, 7, 4] },
    { id: 'southwest-porch-bay', cells: [2, 5, 4, 7] },
    { id: 'southeast-porch-bay', cells: [5, 5, 7, 7] },
  ],
  floors: [
    { id: 'hallway', cells: [0, 0, 1, 7], material: 'wood', kind: 'interior' },
    { id: 'front-yard', cells: [2, 0, 3, 7], material: 'grass', kind: 'exterior' },
    { id: 'garden', cells: [4, 0, 7, 4], material: 'grass', kind: 'exterior' },
    { id: 'porch', cells: [4, 5, 7, 7], material: 'stone', kind: 'exterior' },
  ],
  walls: [
    { id: 'hallway-garden-edge', from: [2, 0], to: [2, 8], openings: [{ at: 6.5, width: 1.3, kind: 'open' }] },
  ],
  furniture: [
    // Átrio: estante e consola na parede norte, tapete, bengaleiro junto à porta da rua;
    // a escada sobe a partir da entrada.
    { id: 'hallway-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 0.6 } },
    { id: 'hallway-clock-north', model: 'speaker', logic: 'clock@0,1', at: [1.75, 0.3] },
    // O vaso de Carol (R3C1) fica no canto nordeste da célula, à frente do topo da escada.
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@2,0', at: [0.85, 2.25] },
    { id: 'hallway-clock-south', model: 'speaker', logic: 'clock@3,0', at: [0.23, 3.5] },
    { id: 'hallway-console', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 1.45 }, facing: 'E' },
    { id: 'hallway-coat-rack', model: 'coatRackStanding', at: [0.3, 7.65] },
    // Jardim da frente e jardim: arbustos e flores em canteiros, pedras, cepos e um
    // caminho de pedra da porta do átrio ao alpendre.
    { id: 'front-yard-shrub-north', model: 'plant_bushSmall', logic: 'shrub@1,3', at: [3.5, 1.5] },
    { id: 'front-yard-plant-south', model: 'flower_yellowA', logic: 'plant@5,3', at: [3.6, 5.6] },
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@2,2', at: [2.5, 2.5] },
    { id: 'front-yard-plant-east', model: 'flower_redA', logic: 'plant@4,2', at: [2.6, 4.6] },
    { id: 'garden-shrub-northwest', model: 'plant_bushSmall', logic: 'shrub@0,4', at: [4.5, 0.5] },
    { id: 'garden-alexander-plant', model: 'flower_purpleA', logic: 'plant@0,5', at: [5.62, 0.62] },
    { id: 'garden-shrub-southwest', model: 'plant_bushSmall', logic: 'shrub@4,5', at: [5.5, 4.5] },
    { id: 'garden-shrub-southeast', model: 'plant_bushSmall', logic: 'shrub@4,7', at: [7.5, 4.5] },
    { id: 'garden-rock-north', model: 'rock_smallA', at: [6.6, 1.3] },
    { id: 'garden-rock-flat', model: 'rock_smallFlatA', at: [7.2, 2.6] },
    { id: 'garden-stump', model: 'stump_round', at: [4.6, 2.4] },
    { id: 'garden-log', model: 'log', at: [6.3, 3.4] },
    { id: 'garden-lantern', model: 'lampRoundFloor', at: [2.4, 7.6] },
    // Alpendre: mesa comprida de exterior com as quatro cadeiras e um vaso de flores.
    { id: 'porch-table-west', model: 'table', at: [5.48, 6.4] },
    { id: 'porch-table-east', model: 'table', at: [6.53, 6.4] },
    { id: 'porch-chair-west', model: 'chair', logic: 'chair@5,4', at: [4.6, 5.75], facing: 'S' },
    { id: 'porch-tomas-chair', model: 'chair', logic: 'chair@5,7', at: [7.15, 5.85], facing: 'S' },
    { id: 'porch-chair-north', model: 'chair', logic: 'chair@7,5', at: [5.5, 7.1], facing: 'N' },
    { id: 'porch-chair-east', model: 'chair', logic: 'chair@7,6', at: [6.5, 7.1], facing: 'N' },
    { id: 'porch-yuki-plant', model: 'flower_redA', logic: 'plant@6,7', at: [7.6, 6.65] },
  ],
  rugs: [
    { id: 'hallway-rug', model: 'rugRectangle', at: [1.0, 1.9] },
    { id: 'hallway-mat', model: 'rugDoormat', at: [0.35, 6.5], facing: 'E' },
    { id: 'yard-path-door', model: 'path_stone', at: [2.6, 6.5] },
    { id: 'yard-path-porch', model: 'path_stone', at: [3.6, 6.5] },
  ],
}
