import type { SceneSpec } from '../schema'

const stairAt: [number, number] = [4.55, 3.5]

// Casa com cozinha em galé a poente, átrio de entrada aberto para a sala de jantar
// e jardim frontal sob a laje do piso de cima.
export const theLateArrivalGround: SceneSpec = {
  puzzleId: 'hard-9',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 4 },
  shell: { features: [
    { wall: 'north', at: 1.6, kind: 'window' },
    { wall: 'north', at: 6.7, kind: 'window' },
    { wall: 'west', at: 6.5, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: stairAt, facing: 'S' },
  exteriorSupportBays: [
    { id: 'yard-west-frame', cells: [3, 5, 4, 7] },
    { id: 'yard-east-frame', cells: [5, 5, 7, 7] },
  ],
  floors: [
    { id: 'kitchen-tile', cells: [0, 0, 2, 7], material: 'tile' },
    { id: 'hallway-wood', cells: [3, 0, 7, 1], material: 'wood' },
    { id: 'dining-wood', cells: [3, 2, 7, 4], material: 'wood' },
    { id: 'front-yard-grass', cells: [3, 5, 7, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'kitchen-hall-dining', from: [3, 0], to: [3, 8], openings: [
      { at: 0.5, width: 1.0, kind: 'door' },
    ] },
    { id: 'dining-yard-facade', from: [3, 5], to: [8, 5], height: 'half', openings: [
      { at: 3.55, width: 1.0, kind: 'door' },
    ] },
  ],
  furniture: [
    // Cozinha em galé: bancada, lava-loiça e fogão na parede poente, frigoríficos e
    // armários em frente; mesa de pequenos-almoços a norte e lavandaria a sul.
    { id: 'kitchen-run-north', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 3.28 } },
    { id: 'kitchen-run-north-b', model: 'kitchenCabinet', against: { wall: 'west', at: 3.82 } },
    { id: 'kitchen-counter', model: 'kitchenCabinet', logic: 'counter@4,0', against: { wall: 'west', at: 4.36 } },
    { id: 'kitchen-counter-b', model: 'kitchenCabinet', logic: 'counter@4,0', against: { wall: 'west', at: 4.9 } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'west', at: 5.44 } },
    { id: 'kitchen-drawers-b', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 5.98 } },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@6,0', against: { wall: 'west', at: 6.52 } },
    { id: 'kitchen-drawers-c', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 7.06 } },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-counter-b' } },
    { id: 'kitchen-fridge-north', model: 'kitchenFridgeSmall', logic: 'fridge@1,2', against: { wall: 'kitchen-hall-dining', side: 'W', at: 1.3 } },
    { id: 'kitchen-fridge-south', model: 'kitchenFridgeSmall', logic: 'fridge@2,2', against: { wall: 'kitchen-hall-dining', side: 'W', at: 2.3 } },
    { id: 'kitchen-east-cabinet', model: 'kitchenCabinet', against: { wall: 'kitchen-hall-dining', side: 'W', at: 2.92 } },
    { id: 'kitchen-east-cabinet-b', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-hall-dining', side: 'W', at: 3.46 } },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-east-cabinet' } },
    { id: 'kitchen-table', model: 'table', logic: 'table@0,1', at: [1.6, 0.6], facing: 'N' },
    { id: 'kitchen-chair-west', model: 'chairCushion', at: [0.8, 0.6], facing: 'E' },
    { id: 'kitchen-chair-south-a', model: 'chairCushion', at: [1.3, 1.25], facing: 'N' },
    { id: 'kitchen-chair-south-b', model: 'chairCushion', at: [1.9, 1.25], facing: 'N' },
    { id: 'kitchen-washer', model: 'washer', against: { wall: 'south', at: 1.45 }, facing: 'N' },
    { id: 'kitchen-dryer', model: 'dryer', against: { wall: 'south', at: 1.95 }, facing: 'N' },
    { id: 'kitchen-bin', model: 'trashcan', at: [0.3, 7.7] },
    // Átrio: consola com rádio, banco e bengaleiro junto à porta da rua.
    { id: 'hallway-clock-table', model: 'sideTable', against: { wall: 'north', at: 5.6 } },
    { id: 'hallway-clock', model: 'radio', logic: 'clock@0,5', on: { parent: 'hallway-clock-table' } },
    { id: 'hallway-plant', model: 'pottedPlant', logic: 'plant@1,6', at: [6.6, 1.6] },
    { id: 'hallway-bench', model: 'benchCushion', against: { wall: 'north', at: 7.3 } },
    { id: 'hallway-coat-rack', model: 'coatRackStanding', at: [3.3, 1.6] },
    { id: 'hallway-mat', model: 'rugDoormat', at: [4.0, 0.35] },
    // Sala de jantar: mesa com quatro cadeiras e tapete a nascente; poltrona de leitura
    // com mesa de apoio a poente da escada; candeeiros de pé nos cantos sul.
    { id: 'dining-chair', model: 'loungeChair', logic: 'chair@3,3', at: [3.35, 3.5], facing: 'E' },
    { id: 'dining-reading-table', model: 'sideTable', at: [3.3, 2.65], facing: 'E' },
    { id: 'dining-table', model: 'table', at: [6.6, 3.3], facing: 'N' },
    { id: 'dining-chair-north-a', model: 'chairCushion', at: [6.3, 2.65], facing: 'S' },
    { id: 'dining-chair-north-b', model: 'chairCushion', at: [6.9, 2.65], facing: 'S' },
    { id: 'dining-chair-south-a', model: 'chairCushion', at: [6.3, 3.95], facing: 'N' },
    { id: 'dining-chair-south-b', model: 'chairCushion', at: [6.9, 3.95], facing: 'N' },
    { id: 'dining-chair-east', model: 'chairCushion', at: [7.6, 3.3], facing: 'W' },
    { id: 'dining-lamp-east', model: 'lampRoundFloor', logic: 'lamp@4,7', at: [7.6, 4.6] },
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@4,4', at: [4.85, 4.8] },
    // Jardim frontal: arbustos e flores em canteiros, caminho de pedra e banco.
    { id: 'yard-shrub-north', model: 'plant_bushDetailed', logic: 'shrub@5,6', at: [6.55, 5.6] },
    { id: 'yard-plant-south-west', model: 'pottedPlant', logic: 'plant@7,5', at: [5.62, 7.4] },
    { id: 'yard-shrub-south-east', model: 'plant_bushSmall', logic: 'shrub@7,7', at: [7.35, 7.4] },
    { id: 'yard-plant-north-east', model: 'flower_yellowA', logic: 'plant@5,7', at: [7.55, 5.45] },
    { id: 'yard-shrub-murder-clue', model: 'plant_bushDetailed', logic: 'shrub@6,3', at: [3.62, 6.45] },
    { id: 'yard-bench', model: 'bench', at: [5.7, 5.3], facing: 'S' },
    { id: 'yard-rock', model: 'rock_smallFlatA', at: [6.7, 7.3] },
  ],
  rugs: [
    { id: 'dining-rug', model: 'rugRectangle', at: [6.6, 3.3], facing: 'E' },
    { id: 'yard-path-door', model: 'path_stone', at: [3.55, 5.5] },
    { id: 'yard-path-mid', model: 'path_stoneCircle', at: [4.45, 6.3] },
  ],
}
