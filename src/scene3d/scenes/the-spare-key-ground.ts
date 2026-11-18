import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

const stairAt: [number, number] = [5.5, 5.5]
const stairRun = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL

export const theSpareKeyStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairRun / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairRun / 2,
]

export const theSpareKeyGround: SceneSpec = {
  puzzleId: 'expert-9',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 6.3 },
  shell: {
    features: [
      { wall: 'north', at: 0.7, kind: 'window' },
      { wall: 'west', at: 3.8, kind: 'window' },
    ],
  },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  exteriorSupportBays: [
    { id: 'garden-north-support', cells: [2, 0, 3, 2] },
    { id: 'garden-middle-support', cells: [2, 3, 3, 5] },
    { id: 'garden-south-support', cells: [2, 6, 3, 7] },
    { id: 'porch-west-support', cells: [4, 0, 5, 2] },
    { id: 'porch-east-support', cells: [6, 0, 7, 2] },
  ],
  floors: [
    { id: 'hallway', cells: [0, 0, 1, 7], material: 'wood', kind: 'interior' },
    { id: 'garden', cells: [2, 0, 3, 7], material: 'grass', kind: 'exterior' },
    { id: 'porch', cells: [4, 0, 7, 2], material: 'stone', kind: 'exterior' },
    { id: 'dining-room', cells: [4, 3, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'hall-garden-facade', from: [2, 0], to: [2, 8], height: 'half', openings: [{ at: 1.5, width: 1.3, kind: 'open' }, { at: 6.3, width: 1.2, kind: 'door' }] },
    { id: 'garden-porch-railing', from: [4, 0], to: [4, 3], height: 'half', treatment: 'railing', openings: [{ at: 1.5, width: 1.4, kind: 'open' }], freeEnds: ['from'] },
    { id: 'porch-dining-entry', from: [4, 3], to: [8, 3], height: 'half', openings: [{ at: 5.5, width: 1.0, kind: 'door' }] },
    // A sala de jantar abre também para o pátio coberto, em frente à porta do corredor.
    { id: 'garden-dining-facade', from: [4, 3], to: [4, 8], height: 'half', openings: [{ at: 6.5, width: 0.9, kind: 'door' }] },
  ],
  furniture: [
    // Corredor: relógios de pé e vaso junto às aberturas, sofá de espera, estante e consola.
    { id: 'hall-clock-north', model: 'speaker', logic: 'clock@0,1', at: [1.5, 0.5] },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@2,1', at: [1.5, 2.5], facing: 'E' },
    { id: 'hall-clock-middle', model: 'speaker', logic: 'clock@3,1', at: [1.5, 3.5] },
    { id: 'hallway-runner', model: 'rugRectangle', logic: 'rug@4,0', at: [1, 5], facing: 'E' },
    { id: 'hall-sofa', model: 'loungeSofa', against: { wall: 'west', at: 2.3 }, facing: 'E' },
    { id: 'hall-bookcase', model: 'bookcaseClosed', against: { wall: 'west', at: 4.9 }, facing: 'E' },
    { id: 'hall-console', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 7.4 }, facing: 'E' },
    // Pátio ajardinado sob a laje: arbustos, rochas e caminho de pedra entre as portas.
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@4,2', at: [2.5, 4.5] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@5,3', at: [3.5, 5.5] },
    { id: 'garden-bush-south', model: 'plant_bush', logic: 'plant@7,3', at: [3.5, 7.5] },
    { id: 'garden-rock', model: 'rock_smallA', at: [2.45, 7.55] },
    { id: 'garden-stump', model: 'stump_round', at: [3.55, 2.6] },
    // Alpendre: duas cadeiras com mesa baixa a norte, cadeira e mesinha junto à porta.
    { id: 'porch-chair-west', model: 'chair', logic: 'chair@0,4', at: [4.5, 0.5], facing: 'E' },
    { id: 'porch-chair-east', model: 'chair', logic: 'chair@0,6', at: [6.5, 0.5], facing: 'W' },
    { id: 'porch-table', model: 'tableCoffeeSquare', at: [5.5, 0.55] },
    { id: 'porch-flower', model: 'pottedPlant', logic: 'plant@0,7', at: [7.55, 0.4] },
    { id: 'porch-victim-chair', model: 'chair', logic: 'chair@2,4', at: [4.7, 2.35], facing: 'E' },
    { id: 'porch-side-table', model: 'tableCoffeeSquare', at: [5.2, 1.9] },
    { id: 'porch-culprit-flower', model: 'pottedPlant', logic: 'plant@1,6', at: [6.75, 1.25] },
    // Sala de jantar e cozinha: candeeiros junto à entrada do alpendre; cozinha em linha
    // contra a fachada poente (placa, lava-loiça, frigorífico) seguida da mesa de apoio;
    // mesa com cadeira e banco estofado a nascente da escada.
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@3,6', at: [6.7, 3.5], facing: 'N' },
    { id: 'dining-lamp-east', model: 'lampRoundFloor', logic: 'lamp@3,7', at: [7.5, 3.5], facing: 'N' },
    { id: 'dining-table', model: 'table', logic: 'table@5,4', against: { wall: 'garden-dining-facade', side: 'E', at: 5.45 }, facing: 'E' },
    { id: 'dining-east-table', model: 'table', at: [6.85, 5.35], facing: 'N' },
    { id: 'dining-chair-south', model: 'chair', logic: 'chair@5,7', at: [7.65, 5.35], facing: 'W' },
    { id: 'dining-banquette', model: 'loungeSofa', at: [6.85, 6.15], facing: 'N' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', against: { wall: 'garden-dining-facade', side: 'E', at: 4.41 }, facing: 'E' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'garden-dining-facade', side: 'E', at: 3.87 }, facing: 'E' },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'garden-dining-facade', side: 'E', at: 3.33 }, facing: 'E' },
  ],
  rugs: [
    { id: 'garden-path-a', model: 'path_stone', at: [2.65, 6.4], facing: 'E' },
    { id: 'garden-path-b', model: 'path_stone', at: [3.4, 6.5], facing: 'E' },
  ],
}
