import type { SceneSpec } from '../schema'

// The west garden remains open ground; two measured bays carry the bedroom
// above it. Entry arrives at the east hall, with the stair reserved in dining.
export const dustOnTheSillGround: SceneSpec = {
  puzzleId: 'expert-4',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 6.8 },
  shell: { features: [
    { wall: 'north', at: 4.5, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [2.8, 6.5], facing: 'E' },
  exteriorSupportBays: [
    { id: 'front-yard-north', cells: [0, 0, 2, 2] },
    { id: 'front-yard-south', cells: [0, 3, 2, 4] },
  ],
  floors: [
    { id: 'front-yard-ground', cells: [0, 0, 2, 4], material: 'grass', kind: 'exterior' },
    { id: 'living-room-floor', cells: [3, 0, 5, 4], material: 'wood' },
    { id: 'entry-hall-floor', cells: [6, 0, 7, 4], material: 'stone' },
    { id: 'dining-room-floor', cells: [0, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    { id: 'yard-living-facade', from: [3, 0], to: [3, 5], height: 'half', openings: [{ at: 1.5, width: 1, kind: 'door' }] },
    { id: 'yard-dining-facade', from: [0, 5], to: [3, 5], height: 'half', openings: [{ at: 2.4, width: 0.8, kind: 'door' }] },
    { id: 'living-dining', from: [3, 5], to: [6, 5], height: 'half', openings: [{ at: 5.55, width: 0.8, kind: 'open' }] },
    { id: 'hall-dining', from: [6, 5], to: [8, 5], openings: [{ at: 6.6, width: 0.8, kind: 'door' }] },
  ],
  furniture: [
    { id: 'yard-shrub-south-west', model: 'plant_bushSmall', logic: 'shrub@4,0', at: [0.5, 4.5] },
    { id: 'yard-shrub-south-centre', model: 'plant_bushSmall', logic: 'shrub@4,1', at: [1.5, 4.5] },
    { id: 'yard-shrub-clue', model: 'plant_bushSmall', logic: 'shrub@0,1', at: [1.5, 0.5] },
    { id: 'yard-plant-west', model: 'pottedPlant', logic: 'plant@1,0', at: [0.5, 1.5] },
    { id: 'yard-plant-north-west', model: 'pottedPlant', logic: 'plant@0,0', at: [0.5, 0.5] },

    // Sala: grupo principal com o sofá virado para a televisão da parede norte, sobre o tapete;
    // a sul, um recanto de televisão com o segundo sofá virado para a fachada do jardim.
    { id: 'living-tv-north-stand', model: 'cabinetTelevision', against: { wall: 'north', at: 4.75 } },
    { id: 'living-tv-north', model: 'televisionModern', logic: 'tv@0,4', on: { parent: 'living-tv-north-stand' } },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [4.75, 0.95] },
    { id: 'living-sofa-north', model: 'loungeSofa', logic: 'sofa@1,4', at: [4.75, 1.72], facing: 'N' },
    { id: 'living-clock', model: 'speaker', logic: 'clock@2,3', at: [3.5, 2.5] },
    { id: 'living-tv-west-stand', model: 'cabinetTelevision', against: { wall: 'yard-living-facade', at: 4.25, side: 'E' } },
    { id: 'living-tv-west', model: 'televisionVintage', logic: 'tv@4,3', on: { parent: 'living-tv-west-stand' } },
    { id: 'living-den-table', model: 'tableCoffeeSquare', at: [4.1, 4.15] },
    { id: 'living-sofa-south', model: 'loungeSofa', logic: 'sofa@4,4', at: [4.85, 4.3], facing: 'W' },
    // Átrio: coluna e estante baixa com rádio junto à entrada, banco e vaso na parede nascente.
    { id: 'entry-hall-clock-west', model: 'speaker', logic: 'clock@1,6', at: [6.3, 1.4] },
    { id: 'entry-hall-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 1.5 }, facing: 'W' },
    { id: 'entry-hall-clock-east', model: 'radio', logic: 'clock@1,7', on: { parent: 'entry-hall-shelf' }, facing: 'W' },
    { id: 'entry-hall-bench', model: 'bench', against: { wall: 'east', at: 2.8 }, facing: 'W' },
    { id: 'entry-hall-plant', model: 'pottedPlant', logic: 'plant@3,7', at: [7.5, 3.5] },
    // Sala de jantar: mesa com cinco cadeiras junto à sala; cozinha em L no canto sudeste
    // com candeeiros sobre a bancada e de pé; estante e banco junto ao pé da escada.
    { id: 'dining-table', model: 'table', logic: 'table@5,3', at: [4.5, 5.75] },
    { id: 'dining-chair-north-west', model: 'chairCushion', at: [4.2, 5.22], facing: 'S' },
    { id: 'dining-chair-north-east', model: 'chairCushion', at: [4.8, 5.22], facing: 'S' },
    { id: 'dining-chair-south-west', model: 'chairCushion', at: [4.2, 6.3], facing: 'N' },
    { id: 'dining-chair-south-east', model: 'chairCushion', at: [4.8, 6.3], facing: 'N' },
    { id: 'dining-chair-east', model: 'chairCushion', at: [5.3, 5.75], facing: 'W' },
    { id: 'dining-lamp-clue', model: 'lampRoundFloor', logic: 'lamp@5,7', at: [7.5, 5.5] },
    { id: 'kitchen-fridge', model: 'kitchenFridgeSmall', against: { wall: 'east', at: 6.2 }, facing: 'W' },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'east', at: 6.74 }, facing: 'W' },
    { id: 'kitchen-stove', model: 'kitchenStove', against: { wall: 'east', at: 7.28 }, facing: 'W' },
    { id: 'kitchen-cabinet-north', model: 'kitchenCabinet', against: { wall: 'south', at: 6.56 }, facing: 'N' },
    { id: 'dining-lamp-south', model: 'lampSquareTable', logic: 'lamp@7,6', on: { parent: 'kitchen-cabinet-north' } },
    { id: 'kitchen-cabinet-south', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 7.1 }, facing: 'N' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-south' } },
    { id: 'dining-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 5.7 }, facing: 'E' },
    { id: 'dining-chair', model: 'bench', logic: 'chair@7,2', against: { wall: 'south', at: 2.5 }, facing: 'N' },
  ],
  rugs: [
    { id: 'living-rug', model: 'rugRectangle', at: [4.75, 1.15] },
    { id: 'living-den-rug', model: 'rugSquare', at: [4.15, 4.2] },
    { id: 'entry-hall-runner', model: 'rugRectangle', at: [6.9, 3.2], facing: 'E' },
  ],
}
