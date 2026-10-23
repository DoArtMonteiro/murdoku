import type { SceneSpec } from '../schema'
import { MODEL_BOUNDS } from '../catalog.generated'
import { CELL } from '../units'

// The ground storey is a full 8 × 8 built footprint. The upper composition
// carries the fractional stair opening; the staircase keeps its measured
// position. Átrio de entrada com canto de leitura a noroeste, cozinha em L a
// nordeste com península junto à escada, sala de jantar a sudoeste e jardim de
// inverno com pavimento de pedra a sudeste; as quatro divisões formam um anel.
export const twoStoreyReferenceGround: SceneSpec = {
  puzzleId: 'hard-1',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 0.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.5, kind: 'window' },
      { wall: 'north', at: 5.5, kind: 'window' },
      { wall: 'west', at: 2.5, kind: 'window' },
      { wall: 'west', at: 6.6, kind: 'window' },
    ],
  },
  walls: [
    { id: 'spine', from: [3.9, 1.2], to: [3.9, 8], height: 'half', openings: [
      { at: 2.35, kind: 'door' },
      { at: 5.0, kind: 'door' },
    ] },
    { id: 'kitchen-service', from: [3.9, 1.2], to: [5.55, 1.2], height: 'half', freeEnds: ['to'] },
    { id: 'hall-dining', from: [0, 4], to: [3.9, 4], height: 'half', openings: [{ at: 2.55, width: 1.2, kind: 'open' }] },
    { id: 'kitchen-conservatory', from: [3.9, 4], to: [8, 4], height: 'half', openings: [{ at: 6.4, kind: 'door' }] },
  ],
  stairs: { model: 'stairsOpen', at: [5 - MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL), 0.6], facing: 'E' },
  floors: [
    { id: 'kitchen-tile', cells: [4, 0, 7, 3], material: 'tile' },
    { id: 'conservatory-stone', cells: [4, 4, 7, 7], material: 'stone' },
  ],
  furniture: [
    // Átrio: cabide junto à porta, estante alta e canto de leitura sob a janela oeste.
    { id: 'hall-coat-stand', model: 'coatRackStanding', at: [1.1, 0.3] },
    { id: 'hall-bookcase', model: 'bookcaseOpen', logic: 'bookshelf@1,0', against: { wall: 'west', at: 1.5 }, facing: 'E' },
    { id: 'hall-sofa', model: 'loungeSofa', against: { wall: 'west', at: 3.25 }, facing: 'E' },
    { id: 'hall-reading-lamp', model: 'lampRoundFloor', at: [0.25, 2.35] },
    { id: 'hall-coffee-table', model: 'tableCoffeeSquare', at: [1.3, 3.25] },
    { id: 'hall-coffee-books', model: 'books', on: { parent: 'hall-coffee-table' } },
    // Cozinha: península contra a meia parede da escada, bancada em L norte/este
    // com fogão e lava-loiça, frigorífico no fim do lanço e aparador junto à porta sul.
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@1,4', against: { wall: 'kitchen-service', at: 4.5, side: 'S' } },
    { id: 'kitchen-sink', model: 'kitchenSink', logic: 'counter@1,4', against: { wall: 'kitchen-service', at: 5.05, side: 'S' } },
    { id: 'coffee-machine', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-counter' } },
    { id: 'kitchen-cabinet-north', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 5.95 } },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@0,6', against: { wall: 'north', at: 6.5 } },
    { id: 'kitchen-cabinet-corner', model: 'kitchenCabinet', against: { wall: 'north', at: 7.05 } },
    { id: 'kitchen-cabinet-end', model: 'kitchenCabinetCornerInner', against: { wall: 'north', at: 7.62 } },
    { id: 'kitchen-cabinet-east', model: 'kitchenCabinetDrawer', against: { wall: 'east', at: 1.1 }, facing: 'W' },
    { id: 'kitchen-cabinet-east-2', model: 'kitchenCabinet', against: { wall: 'east', at: 1.65 }, facing: 'W' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-east-2' } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,7', against: { wall: 'east', at: 2.22 }, facing: 'W' },
    { id: 'kitchen-trash', model: 'trashcan', at: [7.75, 3.15] },
    { id: 'hall-console', model: 'sideTable', logic: 'clock@3,4', against: { wall: 'kitchen-conservatory', at: 4.6, side: 'N' } },
    { id: 'hall-clock', model: 'radio', logic: 'clock@3,4', on: { parent: 'hall-console' } },
    // Sala de jantar: mesa central com cadeiras frente a frente, aparador e
    // cómoda na parede oeste e candeeiro de pé no canto.
    { id: 'dining-table', model: 'table', logic: 'table@6,1', at: [2.0, 6.55], facing: 'S' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@7,1', at: [1.65, 7.12], facing: 'N' },
    { id: 'dining-chair-opposite', model: 'chair', at: [2.35, 5.98], facing: 'S' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 6.55 }, facing: 'E' },
    { id: 'dining-sideboard-lamp', model: 'lampRoundTable', on: { parent: 'dining-sideboard' } },
    { id: 'dining-dresser', model: 'sideTableDrawers', against: { wall: 'west', at: 4.75 }, facing: 'E' },
    { id: 'dining-dresser-books', model: 'books', on: { parent: 'dining-dresser' } },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@7,3', at: [3.55, 7.55] },
    // Jardim de inverno: sofá contra a meia parede, cadeirão e mesa de centro
    // sobre tapete, planta grande junto à janela e plantas em vaso nas mesas.
    { id: 'conservatory-sofa', model: 'loungeSofa', against: { wall: 'spine', at: 6.85, side: 'E' } },
    { id: 'conservatory-table', model: 'tableCoffee', at: [5.35, 6.85] },
    { id: 'conservatory-table-plant', model: 'plantSmall1', on: { parent: 'conservatory-table' } },
    { id: 'conservatory-chair', model: 'loungeChair', logic: 'chair@6,6', at: [6.45, 6.85], facing: 'W' },
    { id: 'conservatory-plant', model: 'pottedPlant', logic: 'plant@5,5', at: [5.8, 5.25] },
    { id: 'conservatory-side', model: 'sideTableDrawers', against: { wall: 'east', at: 5.3 }, facing: 'W' },
    { id: 'conservatory-side-plant', model: 'plantSmall2', on: { parent: 'conservatory-side' } },
    { id: 'conservatory-lamp', model: 'lampSquareFloor', at: [4.2, 7.75] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.45, 0.5], facing: 'E' },
    { id: 'hall-rug', model: 'rugSquare', at: [1.15, 3.2] },
    { id: 'dining-rug', model: 'rugRectangle', at: [2.0, 6.55] },
    { id: 'conservatory-rug', model: 'rugRectangle', at: [5.3, 6.85], facing: 'E' },
  ],
}
