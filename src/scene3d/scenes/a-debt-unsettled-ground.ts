import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

// A escada sobe junto à parede poente da sala e chega ao corredor superior.
const stairAt: [number, number] = [0.56, 2.9]
const stairRun = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const stairWidth = MODEL_BOUNDS.stairsOpen.size[2] / CELL
export const aDebtUnsettledStairwellBounds: [number, number, number, number] = [
  stairAt[0] - stairWidth / 2,
  stairAt[1] - stairRun / 2,
  stairAt[0] + stairWidth / 2,
  stairAt[1] + stairRun / 2,
]
export const aDebtUnsettledGround: SceneSpec = {
  puzzleId: 'master-4',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 2.4 },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'N' },
  // O alpendre é envidraçado (interior); só o jardim precisa de estrutura exterior.
  exteriorSupportBays: [
    { id: 'garden-hall-west', cells: [4, 0, 6, 2] },
    { id: 'garden-hall-east', cells: [7, 0, 7, 2] },
    { id: 'garden-bedroom-west', cells: [4, 3, 6, 4] },
    { id: 'garden-bedroom-east', cells: [7, 3, 7, 4] },
  ],
  shell: { features: [
    { wall: 'north', at: 0.7, kind: 'window' },
    { wall: 'north', at: 3.4, kind: 'window' },
    // Alpendre envidraçado: duas janelas seguidas na parede poente.
    { wall: 'west', at: 5.6, kind: 'window' },
    { wall: 'west', at: 7.2, kind: 'window' },
  ] },
  floors: [
    { id: 'living-room-floor', cells: [0, 0, 3, 4], material: 'wood', kind: 'interior' },
    { id: 'garden-ground', cells: [4, 0, 7, 4], material: 'grass', kind: 'exterior' },
    { id: 'porch-ground', cells: [0, 5, 3, 7], material: 'stone', kind: 'interior' },
    { id: 'dining-room-floor', cells: [4, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'living-garden-opening', from: [4, 0], to: [4, 5], height: 'half', openings: [{ at: 1.0, width: 1.2, kind: 'door' }] },
    { id: 'living-porch-opening', from: [0, 5], to: [4, 5], height: 'half', openings: [{ at: 3.0, width: 1.1, kind: 'door' }] },
    { id: 'garden-dining-boundary', from: [4, 5], to: [8, 5], height: 'half' },
    { id: 'porch-dining-opening', from: [4, 5], to: [4, 8], height: 'half', openings: [{ at: 6.3, width: 1, kind: 'door' }] },
  ],
  furniture: [
    // Sala: televisor principal na meia parede do jardim, com o sofá em frente e a
    // poltrona larga ao lado; segundo televisor num recanto junto à entrada.
    { id: 'living-clock', model: 'speaker', logic: 'clock@0,3', at: [3.4, 0.3], facing: 'S' },
    // Sofá de dois lugares encostado à meia parede do jardim (o antigo cadeirão azul lia-se
    // como uma laje deitada).
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@1,3', against: { wall: 'living-garden-opening', side: 'W', at: 2.25 }, facing: 'W' },
    // Televisor de ecrã plano de pé sobre o móvel, virado para o sofá principal.
    { id: 'living-tv-cabinet-south', model: 'cabinetTelevisionDoors', logic: 'tv@4,3', against: { wall: 'living-garden-opening', side: 'W', at: 4.4 }, facing: 'W' },
    { id: 'living-tv-south', model: 'televisionModern', on: { parent: 'living-tv-cabinet-south' } },
    { id: 'living-main-sofa', model: 'loungeSofa', at: [2.0, 4.3], facing: 'E' },
    { id: 'living-tv-cabinet-north', model: 'cabinetTelevision', logic: 'tv@0,1', against: { wall: 'north', at: 1.5 } },
    { id: 'living-tv-north', model: 'televisionVintage', on: { parent: 'living-tv-cabinet-north' } },
    { id: 'living-armchair', model: 'loungeChair', at: [1.6, 1.2], facing: 'N' },
    { id: 'living-lamp', model: 'lampRoundFloor', at: [2.15, 3.35] },
    // Jardim: canteiros, caminho de pedra e banco.
    { id: 'garden-plant-north', model: 'pottedPlant', logic: 'plant@0,5', at: [5.5, 0.5], facing: 'S' },
    { id: 'garden-plant-west', model: 'pottedPlant', logic: 'plant@1,4', at: [4.75, 1.25], facing: 'S' },
    { id: 'garden-shrub-south', model: 'plant_bushSmall', logic: 'shrub@4,5', at: [5.5, 4.5], facing: 'S' },
    { id: 'garden-path-stone-a', model: 'path_stone', at: [4.6, 1.0], facing: 'E' },
    { id: 'garden-path-stone-b', model: 'path_stone', at: [5.6, 1.3], facing: 'E' },
    { id: 'garden-path-stone-c', model: 'path_stone', at: [6.5, 2.3], facing: 'S' },
    { id: 'garden-bench', model: 'bench', at: [6.5, 4.6], facing: 'N' },
    { id: 'garden-rock', model: 'rock_smallA', at: [7.5, 1.4] },
    // Alpendre envidraçado: sofá a sul entre duas poltronas, planta junto à porta da sala.
    { id: 'porch-chair-yuki', model: 'loungeChair', logic: 'chair@5,0', at: [0.5, 5.8], facing: 'E' },
    { id: 'porch-plant-yuki', model: 'pottedPlant', logic: 'plant@5,3', at: [3.75, 5.25], facing: 'S' },
    { id: 'porch-chair-south', model: 'loungeChair', logic: 'chair@7,1', at: [1.3, 7.45], facing: 'E' },
    { id: 'porch-sofa', model: 'loungeSofa', against: { wall: 'south', at: 2.7 }, facing: 'N' },
    { id: 'porch-lamp', model: 'lampSquareFloor', at: [0.3, 6.6] },
    // Sala de jantar com cozinha: mesa com cadeiras, bancada na parede sul, mesa de apoio a sul.
    { id: 'dining-table-north', model: 'table', logic: 'table@5,5', at: [6.0, 5.55], facing: 'S' },
    { id: 'dining-chair-west', model: 'chair', at: [5.2, 5.55], facing: 'E' },
    { id: 'dining-chair-north-east', model: 'chair', at: [6.8, 5.55], facing: 'W' },
    { id: 'dining-chair-south', model: 'chair', at: [6.3, 6.2], facing: 'N' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@6,4', at: [4.9, 6.15], facing: 'E' },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@5,4', at: [4.3, 5.3], facing: 'N' },
    { id: 'dining-table-alexander', model: 'table', logic: 'table@7,4', at: [4.9, 7.55], facing: 'S' },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', against: { wall: 'south', at: 5.76 }, facing: 'N' },
    { id: 'kitchen-cabinet', model: 'kitchenCabinet', against: { wall: 'south', at: 6.3 }, facing: 'N' },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'south', at: 6.84 }, facing: 'N' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'south', at: 7.38 }, facing: 'N' },
  ],
}
