import type { SceneSpec } from '../schema'

// Hallway entry opens onto a walled central garden; two broad openings lead to
// the pantry and porch wings along the south.
export const theFinalCurtain: SceneSpec = {
  puzzleId: 'easy-5',
  floor: 0,
  entry: { wall: 'north', at: 3.5 },
  shell: {
    features: [
      { wall: 'north', at: 1.35, kind: 'window' },
      { wall: 'north', at: 5.8, kind: 'window' },
    ],
  },
  floors: [
    { id: 'central-courtyard', cells: [0, 2, 6, 3], material: 'grass', kind: 'courtyard' },
    { id: 'pantry', cells: [0, 4, 2, 6], material: 'tile', kind: 'interior' },
    { id: 'porch', cells: [3, 4, 6, 6], material: 'stone', kind: 'interior' },
  ],
  walls: [
    { id: 'hall-courtyard', from: [0, 2], to: [7, 2], height: 'half', openings: [
      { at: 1.55, width: 1.2, kind: 'open' },
      { at: 5.55, width: 1.2, kind: 'open' },
    ] },
    { id: 'courtyard-wings', from: [0, 4], to: [7, 4], height: 'half', openings: [
      { at: 2.1, width: 1.2, kind: 'open' },
      { at: 5.55, width: 1.2, kind: 'open' },
    ] },
    { id: 'pantry-porch', from: [3, 4], to: [3, 7], height: 'half', openings: [
      { at: 4.7, width: 1.05, kind: 'door' },
    ] },
  ],
  furniture: [
    // Átrio: tapete de entrada com estante e poltrona de leitura a oeste,
    // banco frente à porta, consola sob a janela leste.
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@0,0', at: [1.0, 0.95] },
    { id: 'hall-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 1.0 }, facing: 'E' },
    { id: 'hall-armchair', model: 'loungeChair', at: [1.5, 0.75], facing: 'W' },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@0,3', at: [3.15, 0.65] },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@0,4', against: { wall: 'north', at: 4.5 } },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'hall-courtyard', side: 'N', at: 3.5 } },
    { id: 'hall-console', model: 'sideTable', against: { wall: 'north', at: 5.8 } },
    { id: 'hall-lamp', model: 'lampSquareTable', on: { parent: 'hall-console' } },
    // Pátio: arbustos baixos mantêm visíveis as duas células com pistas; caminho de lajes entre as aberturas.
    { id: 'garden-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@3,0', at: [0.45, 3.4] },
    { id: 'garden-flowers', model: 'flower_yellowA', logic: 'plant@3,2', at: [2.55, 3.3] },
    { id: 'garden-shrub-centre', model: 'plant_bushDetailed', logic: 'shrub@2,3', at: [3.55, 2.5] },
    { id: 'garden-bench', model: 'bench', against: { wall: 'courtyard-wings', side: 'N', at: 4.1 } },
    { id: 'garden-flower-ne', model: 'flower_redA', at: [6.55, 2.35], yaw: 15 },
    { id: 'garden-flower-se', model: 'flower_redA', at: [6.6, 3.65], yaw: -20 },
    // Despensa: bancada contra a meia parede norte, estante alta a oeste,
    // frigorífico e caixa encostados à parede sul.
    { id: 'pantry-counter-a', model: 'kitchenCabinet', logic: 'counter@4,0', against: { wall: 'courtyard-wings', side: 'S', at: 0.4 } },
    { id: 'pantry-counter-b', model: 'kitchenCabinetDrawer', logic: 'counter@4,0', against: { wall: 'courtyard-wings', side: 'S', at: 0.95 } },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter-b' } },
    { id: 'pantry-shelf', model: 'bookcaseClosed', against: { wall: 'west', at: 5.5 }, facing: 'E' },
    { id: 'pantry-shelf-low', model: 'bookcaseOpenLow', against: { wall: 'west', at: 6.2 }, facing: 'E' },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@6,1', at: [1.5, 6.58], facing: 'N' },
    // a caixa fica a sul do centro da célula, à frente da pessoa e longe da meia parede
    { id: 'pantry-box', model: 'cardboardBoxOpen', logic: 'box@6,2', at: [2.4, 6.74] },
    // Alpendre: mesa redonda com três cadeiras, cadeirão e candeeiro, vaso a leste.
    { id: 'porch-table', model: 'tableRound', at: [4.35, 5.5] },
    { id: 'porch-chair-east', model: 'chair', logic: 'chair@4,4', at: [4.4, 4.68], facing: 'S' },
    { id: 'porch-chair-west', model: 'chair', logic: 'chair@5,3', at: [3.7, 5.5], facing: 'E' },
    { id: 'porch-chair-far', model: 'chair', at: [5.0, 5.5], facing: 'W' },
    { id: 'porch-lounge', model: 'loungeChairRelax', at: [6.2, 6.4], facing: 'W' },
    { id: 'porch-lamp', model: 'lampSquareFloor', at: [6.78, 4.3] },
    { id: 'porch-flowers', model: 'pottedPlant', logic: 'plant@5,6', at: [6.6, 5.6] },
  ],
  rugs: [
    { id: 'yard-path-a', model: 'path_stone', at: [1.7, 2.6] },
    { id: 'yard-path-b', model: 'path_stone', at: [2.0, 3.45] },
    { id: 'yard-path-c', model: 'path_stone', at: [5.55, 2.6] },
    { id: 'yard-path-d', model: 'path_stone', at: [5.55, 3.45] },
  ],
}
