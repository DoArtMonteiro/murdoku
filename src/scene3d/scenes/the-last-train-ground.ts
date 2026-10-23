import type { SceneSpec } from '../schema'

// Moradia duplex: cozinha a noroeste, escritório com a escada a nordeste,
// alpendre de refeições com a entrada a sudoeste e jardim de inverno coberto a
// sudeste, com canteiros relvados e um recanto de estar; as divisões formam um anel.
export const theLastTrainGround: SceneSpec = {
  puzzleId: 'hard-3',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 7.0 },
  shell: { features: [
    { wall: 'north', at: 0.75, kind: 'window' },
    { wall: 'north', at: 6.7, kind: 'window' },
    { wall: 'west', at: 2.0, kind: 'window' },
    { wall: 'west', at: 5.0, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [5.75, 2.0], facing: 'S' },
  floors: [
    { id: 'kitchen', cells: [0, 0, 3, 3], material: 'tile' },
    { id: 'office', cells: [4, 0, 7, 3], material: 'wood' },
    { id: 'covered-porch', cells: [0, 4, 2, 7], material: 'stone' },
    { id: 'glass-garden-room', cells: [3, 4, 6, 6], material: 'stone' },
    { id: 'garden-bed-east', cells: [7, 4, 7, 7], material: 'grass', kind: 'interior' },
    { id: 'garden-bed-south', cells: [3, 7, 6, 7], material: 'grass', kind: 'interior' },
  ],
  walls: [
    { id: 'kitchen-office', from: [4, 0], to: [4, 4], height: 'half', openings: [{ at: 1.2, kind: 'door' }] },
    { id: 'porch-garden', from: [3, 4], to: [3, 8], height: 'half', openings: [{ at: 6.8, kind: 'door' }] },
    { id: 'cross-wing-wall', from: [0, 4], to: [8, 4], height: 'half', openings: [
      { at: 1.2, kind: 'door' },
      { at: 6.0, width: 1.2, kind: 'open' },
    ] },
  ],
  furniture: [
    // Cozinha: bancada com lava-loiça na parede norte, fogão e armário junto à
    // parede do alpendre, frigorífico baixo na parede do escritório e ilha central.
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'north', at: 0.9 } },
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@0,1', against: { wall: 'north', at: 1.45 } },
    { id: 'kitchen-cabinet-north', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 2.0 } },
    { id: 'kitchen-cabinet-north-2', model: 'kitchenCabinet', against: { wall: 'north', at: 2.55 } },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-cabinet-north-2' } },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,3', against: { wall: 'kitchen-office', at: 2.2, side: 'W' } },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@3,2', against: { wall: 'cross-wing-wall', at: 2.5, side: 'N' }, facing: 'N' },
    { id: 'kitchen-cabinet-south', model: 'kitchenCabinet', against: { wall: 'cross-wing-wall', at: 3.05, side: 'N' }, facing: 'N' },
    { id: 'kitchen-island-west', model: 'kitchenBar', at: [1.55, 2.0], facing: 'S' },
    { id: 'kitchen-island-east', model: 'kitchenBar', at: [2.09, 2.0], facing: 'S' },
    // Escritório: secretária no canto nordeste com a cadeira virada para ela,
    // estante a norte, rádio na consola oeste e sofá de leitura na parede este.
    { id: 'office-desk', model: 'desk', logic: 'desk@0,7', at: [7.45, 0.55], facing: 'W' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-chair', model: 'chair', logic: 'chair@0,6', at: [6.8, 0.55], facing: 'E' },
    { id: 'office-bookcase', model: 'bookcaseClosedWide', against: { wall: 'north', at: 4.62 } },
    { id: 'office-clock-table', model: 'sideTable', against: { wall: 'kitchen-office', at: 2.6, side: 'E' }, facing: 'E' },
    { id: 'office-clock', model: 'radio', logic: 'clock@2,4', on: { parent: 'office-clock-table' } },
    { id: 'office-sofa', model: 'loungeSofa', against: { wall: 'east', at: 2.6 }, facing: 'W' },
    { id: 'office-coffee-table', model: 'tableCoffeeSquare', at: [6.95, 2.6] },
    { id: 'office-floor-lamp', model: 'lampSquareFloor', at: [7.8, 1.6] },
    // Alpendre: mesa de refeições com duas cadeiras junto à cozinha, aparador e
    // cabide junto à porta de entrada, vasos de flores na parede norte.
    { id: 'porch-plant-west', model: 'pottedPlant', logic: 'plant@4,0', at: [0.3, 4.35] },
    { id: 'porch-plant-east', model: 'pottedPlant', logic: 'plant@4,1', at: [1.8, 4.3] },
    { id: 'porch-table', model: 'tableCloth', at: [1.5, 5.5], facing: 'S' },
    { id: 'porch-chair-west', model: 'chair', logic: 'chair@5,0', at: [0.75, 5.5], facing: 'E' },
    { id: 'porch-chair', model: 'chair', logic: 'chair@5,2', at: [2.25, 5.5], facing: 'W' },
    { id: 'porch-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'porch-garden', at: 4.95, side: 'W' }, facing: 'W' },
    { id: 'porch-sideboard-lamp', model: 'lampRoundTable', on: { parent: 'porch-sideboard' } },
    { id: 'porch-coat-stand', model: 'coatRackStanding', at: [0.3, 7.75] },
    // Jardim de inverno: sofá e mesa baixa no pavimento de pedra, arbustos e
    // vaso nos canteiros relvados a este e a sul, pedras e um cepo.
    { id: 'garden-sofa', model: 'loungeSofa', against: { wall: 'porch-garden', at: 5.0, side: 'E' } },
    { id: 'garden-table', model: 'tableCoffee', at: [4.05, 5.0], facing: 'E' },
    { id: 'garden-table-books', model: 'books', on: { parent: 'garden-table' } },
    { id: 'garden-shrub-west', model: 'plant_bushSmall', logic: 'shrub@4,4', at: [4.65, 4.3] },
    { id: 'garden-shrub-north', model: 'plant_bushDetailed', logic: 'shrub@5,7', at: [7.55, 5.4] },
    { id: 'garden-plant-east', model: 'pottedPlant', logic: 'plant@6,7', at: [7.7, 6.3] },
    { id: 'garden-shrub-south', model: 'plant_bushDetailed', logic: 'shrub@7,5', at: [5.6, 7.4] },
    { id: 'garden-rock', model: 'rock_smallA', at: [3.5, 7.6] },
    { id: 'garden-rock-b', model: 'rock_smallB', at: [6.6, 7.65] },
    { id: 'garden-stump', model: 'stump_round', at: [7.6, 7.6] },
    { id: 'garden-lamp', model: 'lampRoundFloor', at: [3.25, 4.25] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.35, 7.0], facing: 'E' },
    { id: 'porch-rug', model: 'rugRectangle', at: [1.5, 5.5] },
    { id: 'office-rug', model: 'rugSquare', at: [7.0, 2.6] },
    { id: 'garden-path-a', model: 'path_stone', at: [6.0, 4.55], facing: 'S' },
    { id: 'garden-path-b', model: 'path_stone', at: [5.4, 5.5], facing: 'E' },
    { id: 'garden-path-c', model: 'path_stone', at: [4.0, 6.8], facing: 'E' },
  ],
}
