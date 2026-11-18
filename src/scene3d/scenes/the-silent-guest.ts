import type { SceneSpec } from '../schema'

// A quiet reception house: living room (with the front door) and office to the
// north, kitchen-pantry and dining room to the south. The four rooms form a ring
// of doorways, so the kitchen serves the dining room directly.
export const theSilentGuest: SceneSpec = {
  puzzleId: 'easy-3',
  floor: 0,
  entry: { wall: 'north', at: 0.65 },
  shell: {
    features: [
      { wall: 'north', at: 1.6, kind: 'window' },
      { wall: 'north', at: 5.7, kind: 'window' },
      { wall: 'west', at: 1.5, kind: 'window' },
    ],
  },
  floors: [
    { id: 'pantry-tile', cells: [0, 4, 2, 6], material: 'tile' },
  ],
  walls: [
    { id: 'living-office', from: [3, 0], to: [3, 4], height: 'half', openings: [{ at: 3.3, kind: 'door' }] },
    { id: 'pantry-dining', from: [3, 4], to: [3, 7], height: 'half', openings: [{ at: 5.5, kind: 'door' }] },
    { id: 'north-south-partition', from: [0, 4], to: [7, 4], height: 'half', openings: [
      { at: 1.5, kind: 'door' },
      { at: 5.5, kind: 'door' },
    ] },
  ],
  furniture: [
    // Escritório: estante larga e secretária na parede norte, debaixo da janela;
    // cadeira de leitura junto à estante e um canto de conversa no centro.
    { id: 'office-bookcase', model: 'bookcaseClosedWide', logic: 'bookshelf@0,3', against: { wall: 'north', at: 4.0 } },
    { id: 'office-desk', model: 'desk', logic: 'desk@0,5', against: { wall: 'north', at: 5.6 } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [5.6, 0.95], facing: 'N' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@1,3', at: [3.55, 1.45], facing: 'E' },
    { id: 'office-clock', model: 'speaker', logic: 'clock@1,6', against: { wall: 'east', at: 1.2 }, facing: 'S' },
    { id: 'office-armchair-west', model: 'loungeChair', at: [4.35, 2.75], facing: 'E' },
    { id: 'office-armchair-east', model: 'loungeChair', at: [5.65, 2.75], facing: 'W' },
    { id: 'office-shelf-east', model: 'bookcaseOpenLow', against: { wall: 'east', at: 2.75 }, facing: 'W' },
    { id: 'office-shelf-books', model: 'books', on: { parent: 'office-shelf-east', surface: 'top' } },
    { id: 'office-plant', model: 'pottedPlant', at: [6.7, 0.35] },
    // Sala de estar: a porta de entrada abre aqui; o sofá encosta à meia parede e olha para a televisão.
    { id: 'living-sofa', model: 'loungeSofa', logic: 'sofa@1,2', at: [2.6, 2.15], facing: 'W' },
    { id: 'living-media', model: 'cabinetTelevision', against: { wall: 'west', at: 3.2 } },
    { id: 'living-tv', model: 'televisionVintage', logic: 'tv@3,0', on: { parent: 'living-media' } },
    { id: 'living-clock', model: 'speaker', logic: 'clock@0,2', against: { wall: 'north', at: 2.5 } },
    // Sala de jantar: mesa com cadeiras em três lados e dois candeeiros de pé.
    { id: 'dining-table', model: 'table', logic: 'table@5,3', at: [4.15, 5.6], facing: 'E' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@6,3', at: [3.8, 6.25], facing: 'N' },
    { id: 'dining-chair-south', model: 'chair', at: [4.5, 6.25], facing: 'N' },
    { id: 'dining-chair-east', model: 'chair', at: [4.95, 5.6], facing: 'W' },
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@4,4', at: [4.5, 4.5] },
    { id: 'dining-lamp-east', model: 'lampSquareFloor', logic: 'lamp@4,6', at: [6.5, 4.5] },
    { id: 'dining-plant', model: 'pottedPlant', at: [6.6, 6.6] },
    // Cozinha-despensa: bancada com lava-loiça e fogão na parede sul, frigorífico junto à porta
    // da sala de jantar e armário de despensa na parede oeste.
    { id: 'pantry-cupboard', model: 'kitchenCabinetDrawer', against: { wall: 'west', at: 4.6 }, facing: 'E' },
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@5,0', at: [0.35, 5.45] },
    { id: 'pantry-cabinet', model: 'kitchenCabinet', against: { wall: 'south', at: 0.85 }, facing: 'N' },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'south', at: 1.4 }, facing: 'N' },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'south', at: 1.95 }, facing: 'N' },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,2', at: [2.68, 6.5], facing: 'W' },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [0.65, 0.35] },
    { id: 'living-rug', model: 'rugSquare', at: [1.45, 2.6] },
    { id: 'office-rug', model: 'rugRound', at: [5.0, 2.75] },
    { id: 'dining-rug', model: 'rugRectangle', at: [4.3, 5.75], facing: 'E' },
  ],
}
