import type { SceneSpec } from '../schema'

// Moradia estreita com corredor de entrada, cozinha transversal e duas salas.
export const theTornLetter: SceneSpec = {
  puzzleId: 'medium-2',
  floor: 0,
  entry: { wall: 'north', at: 3.4 },
  shell: { features: [{ wall: 'west', at: 5.7, kind: 'window' }] },
  floors: [
    { id: 'entrance-hall', cells: [0, 0, 7, 1], material: 'wood', kind: 'interior' },
    { id: 'working-kitchen', cells: [0, 2, 7, 3], material: 'tile', kind: 'interior' },
    { id: 'dining-room', cells: [0, 4, 4, 7], material: 'wood', kind: 'interior' },
    { id: 'study', cells: [5, 4, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    { id: 'hall-kitchen', from: [0, 2], to: [8, 2], height: 'half', openings: [{ at: 4.5, width: 1.0, kind: 'open' }] },
    { id: 'kitchen-south-rooms', from: [0, 4], to: [8, 4], height: 'half', openings: [
      { at: 4.4, width: 1.0, kind: 'open' },
      { at: 5.5, width: 1.0, kind: 'door' },
    ] },
    { id: 'dining-study', from: [5, 4], to: [5, 8], height: 'half', openings: [{ at: 7.25, width: 0.9, kind: 'door' }] },
  ],
  furniture: [
    // Corredor de entrada: relógio de pé, prateleiras baixas com rádios, vasos e bengaleiro.
    { id: 'hall-alexander-flower', model: 'pottedPlant', logic: 'plant@0,2', at: [2.55, 0.3] },
    { id: 'hall-clock-west-shelf', model: 'bookcaseOpenLow', against: { wall: 'hall-kitchen', at: 3.7, side: 'N' } },
    { id: 'hall-clock-west', model: 'radio', logic: 'clock@1,3', on: { parent: 'hall-clock-west-shelf', surface: 'top' } },
    { id: 'hall-clock-east', model: 'speaker', logic: 'clock@0,4', against: { wall: 'north', at: 4.6 } },
    { id: 'hall-plant-east', model: 'pottedPlant', logic: 'plant@0,5', at: [5.6, 0.3] },
    { id: 'hall-plant-greta', model: 'flower_purpleA', logic: 'plant@1,5', at: [5.7, 1.75] },
    { id: 'hall-greta-clock-shelf', model: 'bookcaseOpenLow', against: { wall: 'hall-kitchen', at: 6.8, side: 'N' } },
    { id: 'hall-greta-clock', model: 'radio', logic: 'clock@1,6', on: { parent: 'hall-greta-clock-shelf', surface: 'top' } },
    { id: 'hall-coat-rack', model: 'coatRackStanding', at: [0.35, 0.35] },
    { id: 'hall-shoe-shelf', model: 'bookcaseOpenLow', against: { wall: 'west', at: 1.35 }, facing: 'E' },
    // Cozinha: bancada contínua na parede norte (fogão, lava-loiça, armários) e segundo troço
    // em L com os dois frigoríficos na ponta este.
    { id: 'kitchen-stove', model: 'kitchenStoveElectric', logic: 'stove@2,0', against: { wall: 'hall-kitchen', at: 0.54, side: 'S' } },
    { id: 'kitchen-cabinet-a', model: 'kitchenCabinet', against: { wall: 'hall-kitchen', at: 1.08, side: 'S' } },
    { id: 'kitchen-sink', model: 'kitchenSink', against: { wall: 'hall-kitchen', at: 1.62, side: 'S' } },
    { id: 'kitchen-cabinet-b', model: 'kitchenCabinetDrawer', against: { wall: 'hall-kitchen', at: 2.16, side: 'S' } },
    { id: 'kitchen-cabinet-c', model: 'kitchenCabinet', against: { wall: 'hall-kitchen', at: 2.7, side: 'S' } },
    { id: 'kitchen-coffee', model: 'kitchenCoffeeMachine', on: { parent: 'kitchen-cabinet-c' } },
    { id: 'kitchen-cabinet-d', model: 'kitchenCabinetDrawer', against: { wall: 'kitchen-south-rooms', at: 6.3, side: 'N' } },
    { id: 'kitchen-cabinet-e', model: 'kitchenCabinet', against: { wall: 'kitchen-south-rooms', at: 6.84, side: 'N' } },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-cabinet-e' } },
    { id: 'kitchen-idris-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@2,7', at: [7.6, 2.45], facing: 'W' },
    { id: 'kitchen-fridge-south', model: 'kitchenFridgeSmall', logic: 'fridge@3,7', at: [7.6, 3.15], facing: 'W' },
    // Sala de jantar: mesa sob a janela com a cadeira da Carol, cómoda na parede oeste,
    // canto de leitura (poltrona, candeeiro de pé, estante) junto à divisória da cozinha.
    { id: 'dining-table-bella', model: 'table', logic: 'table@5,0', at: [1.05, 5.5] },
    { id: 'dining-chair-carol', model: 'chair', logic: 'chair@6,0', at: [0.75, 6.12], facing: 'N' },
    { id: 'dining-dresser', model: 'bookcaseClosedWide', against: { wall: 'west', at: 7.3 }, facing: 'E' },
    { id: 'dining-chair-extra', model: 'loungeChair', logic: 'chair@4,2', against: { wall: 'kitchen-south-rooms', at: 2.5, side: 'S' } },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@4,3', at: [3.2, 4.3] },
    { id: 'dining-bookcase', model: 'bookcaseOpen', against: { wall: 'kitchen-south-rooms', at: 1.7, side: 'S' } },
    { id: 'dining-sideboard', model: 'bookcaseOpenLow', against: { wall: 'south', at: 3.2 }, facing: 'N' },
    { id: 'dining-sideboard-b', model: 'bookcaseOpenLow', against: { wall: 'south', at: 3.7 }, facing: 'N' },
    { id: 'dining-sideboard-books', model: 'books', on: { parent: 'dining-sideboard-b', surface: 'top' } },
    { id: 'dining-sideboard-lamp', model: 'lampSquareTable', on: { parent: 'dining-sideboard', surface: 'top' } },
    // Escritório: estante alta na divisória, secretária de trabalho (portátil, candeeiro, livros)
    // com arquivo baixo na parede sul, e canto de leitura com sofá e estante baixa a este.
    { id: 'study-bookshelf', model: 'bookcaseClosedWide', logic: 'bookshelf@5,5', against: { wall: 'dining-study', at: 5.75, side: 'E' }, facing: 'E' },
    { id: 'study-desk', model: 'desk', logic: 'desk@7,6', against: { wall: 'south', at: 6.5 }, facing: 'N' },
    { id: 'study-desk-laptop', model: 'laptop', on: { parent: 'study-desk', offset: [0.08, 0] } },
    { id: 'study-desk-lamp', model: 'lampSquareTable', on: { parent: 'study-desk', offset: [-0.24, 0.05] } },
    { id: 'study-files', model: 'bookcaseOpenLow', against: { wall: 'south', at: 7.45 }, facing: 'N' },
    { id: 'study-files-books', model: 'books', on: { parent: 'study-files', surface: 'top' } },
    { id: 'study-sofa', model: 'loungeSofa', against: { wall: 'east', at: 5.6 }, facing: 'W' },
    { id: 'study-reading-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 4.5 }, facing: 'W' },
    { id: 'study-reading-lamp', model: 'lampRoundTable', on: { parent: 'study-reading-shelf', surface: 'top' } },
  ],
  rugs: [
    { id: 'hall-doormat', model: 'rugDoormat', at: [3.4, 0.35] },
    { id: 'dining-rug', model: 'rugRectangle', at: [1.1, 5.75] },
    { id: 'dining-reading-rug', model: 'rugRound', at: [2.75, 5.2] },
    { id: 'study-rug', model: 'rugSquare', at: [6.45, 5.75] },
  ],
}
