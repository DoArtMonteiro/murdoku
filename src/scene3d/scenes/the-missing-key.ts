import type { SceneSpec } from '../schema'

// Moradia compacta com pátio de entrada, escritório e despensa.
export const theMissingKey: SceneSpec = {
  puzzleId: 'easy-8',
  floor: 0,
  entry: { wall: 'west', at: 1.45 },
  shell: { features: [{ wall: 'north', at: 5.45, kind: 'window' }] },
  floors: [
    { id: 'entry-court', cells: [0, 0, 3, 3], material: 'grass', kind: 'courtyard' },
    { id: 'pantry', cells: [0, 4, 2, 6], material: 'tile', kind: 'interior' },
    { id: 'porch', cells: [3, 4, 6, 6], material: 'stone', kind: 'interior' },
  ],
  walls: [
    { id: 'court-office', from: [4, 0], to: [4, 4], height: 'half', openings: [{ at: 2.8, width: 1.15, kind: 'door' }] },
    { id: 'pantry-porch', from: [3, 4], to: [3, 7], height: 'half', openings: [{ at: 4.7, width: 1.15, kind: 'door' }] },
    { id: 'court-pantry', from: [0, 4], to: [4, 4], height: 'half', openings: [{ at: 1.4, width: 1.15, kind: 'open' }] },
    { id: 'office-porch', from: [4, 4], to: [7, 4], height: 'half', openings: [{ at: 5.5, width: 1.15, kind: 'door' }] },
  ],
  furniture: [
    // Pátio de entrada: plantas das pistas, banco na parede norte, caminho de lajes entre as portas.
    { id: 'court-shrub', model: 'plant_bushSmall', logic: 'shrub@1,3', at: [3.45, 1.55] },
    { id: 'court-flower-west', model: 'flower_yellowA', logic: 'plant@0,1', at: [1.5, 0.5] },
    { id: 'court-flower-east', model: 'flower_purpleA', logic: 'plant@0,3', at: [3.5, 0.5] },
    { id: 'court-bench', model: 'bench', against: { wall: 'north', at: 2.5 } },
    { id: 'court-stump', model: 'stump_round', at: [0.5, 3.4] },
    // Escritório: secretária sob a janela com a cadeira da pista, canto de conversa
    // com duas poltronas e mesa baixa, estante baixa e relógio na parede leste.
    { id: 'office-desk', model: 'desk', against: { wall: 'north', at: 5.2 } },
    { id: 'office-clue-chair', model: 'chairDesk', logic: 'chair@0,5', at: [5.2, 0.75], facing: 'N' },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-lamp', model: 'lampSquareFloor', at: [4.3, 0.35] },
    { id: 'office-armchair-west', model: 'loungeChair', at: [4.55, 1.75], facing: 'E' },
    { id: 'office-coffee-table', model: 'tableCoffeeSquare', at: [5.4, 1.75] },
    { id: 'office-armchair-east', model: 'loungeChair', at: [6.25, 1.75], facing: 'W' },
    { id: 'office-shelf', model: 'bookcaseOpenLow', against: { wall: 'east', at: 0.6 } },
    { id: 'office-books', model: 'books', on: { parent: 'office-shelf' } },
    { id: 'office-clock-table', model: 'sideTable', against: { wall: 'east', at: 3.5 } },
    { id: 'office-clock', model: 'radio', logic: 'clock@3,6', on: { parent: 'office-clock-table' } },
    // Despensa: estante alta e bancada na parede oeste, frigorífico e armário a sul;
    // a caixa fica a sul do centro da célula, à frente da pessoa.
    { id: 'pantry-shelf', model: 'bookcaseClosed', against: { wall: 'west', at: 4.6 }, facing: 'E' },
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@5,0', against: { wall: 'west', at: 5.5 } },
    { id: 'pantry-sink', model: 'kitchenSink', against: { wall: 'west', at: 6.05 } },
    { id: 'pantry-box', model: 'cardboardBoxOpen', logic: 'box@6,0', at: [0.5, 6.75] },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,1', at: [1.5, 6.6], facing: 'N' },
    { id: 'pantry-drawers', model: 'kitchenCabinetDrawer', against: { wall: 'south', at: 2.45 } },
    // Alpendre: mesa redonda com três cadeiras, banco contra o parapeito sul, vaso junto à despensa.
    { id: 'porch-table', model: 'tableRound', at: [5.75, 5.55] },
    { id: 'porch-chair', model: 'chair', logic: 'chair@5,6', at: [6.42, 5.55], facing: 'W' },
    { id: 'porch-chair-west', model: 'chair', at: [5.08, 5.55], facing: 'E' },
    { id: 'porch-chair-south', model: 'chair', at: [5.75, 6.25], facing: 'N' },
    { id: 'porch-bench', model: 'benchCushion', against: { wall: 'south', at: 4.1 } },
    { id: 'porch-flower', model: 'pottedPlant', logic: 'plant@5,3', against: { wall: 'pantry-porch', side: 'E', at: 5.75 } },
    { id: 'porch-lamp', model: 'lampRoundFloor', at: [6.75, 4.35] },
  ],
  rugs: [
    { id: 'court-path-a', model: 'path_stone', at: [0.95, 1.55] },
    { id: 'court-path-b', model: 'path_stone', at: [2.0, 2.15] },
    { id: 'court-path-c', model: 'path_stone', at: [3.05, 2.75] },
    { id: 'office-rug', model: 'rugRound', at: [5.4, 1.75] },
    { id: 'porch-rug', model: 'rugRectangle', at: [5.75, 5.6] },
  ],
}
