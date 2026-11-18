import type { SceneSpec } from '../schema'

// Casa urbana: sala de jantar a noroeste, átrio de entrada com a escada,
// sala comprida a nascente (canto de jogos com televisão a norte, estar com
// sofás frente a frente e segunda televisão a sul) e jardim coberto a sudoeste.
export const aNameInPencilGround: SceneSpec = {
  puzzleId: 'hard-6',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'north', at: 4.5 },
  shell: { features: [
    { wall: 'north', at: 1.4, kind: 'window' },
    { wall: 'north', at: 7.4, kind: 'window' },
    { wall: 'west', at: 2.2, kind: 'window' },
  ] },
  stairs: { model: 'stairsOpen', at: [3.8, 2.0], facing: 'S' },
  exteriorSupportBays: [
    { id: 'front-yard-west', cells: [0, 5, 2, 7] },
    { id: 'front-yard-east', cells: [3, 5, 4, 7] },
  ],
  floors: [
    { id: 'dining-room', cells: [0, 0, 2, 4], material: 'wood' },
    { id: 'central-hall', cells: [3, 0, 4, 4], material: 'stone' },
    { id: 'living-room', cells: [5, 0, 7, 7], material: 'wood' },
    { id: 'front-yard', cells: [0, 5, 4, 7], material: 'grass', kind: 'exterior' },
  ],
  walls: [
    { id: 'dining-hall', from: [3, 0], to: [3, 5], openings: [{ at: 3.8, width: 1.2, kind: 'door' }] },
    { id: 'hall-living', from: [5, 0], to: [5, 5], height: 'half', openings: [{ at: 2.6, width: 1.2, kind: 'open' }] },
    { id: 'front-yard-facade', from: [0, 5], to: [5, 5], height: 'half', openings: [
      { at: 3.8, width: 1.2, kind: 'open' },
    ] },
    { id: 'yard-living-facade', from: [5, 5], to: [5, 8], height: 'half', openings: [
      { at: 7.0, width: 1.2, kind: 'open' },
    ] },
  ],
  furniture: [
    // Sala de jantar: mesa ao centro com cinco cadeiras, aparador sob a janela
    // norte, candeeiros de pé junto à parede do átrio e planta no canto.
    { id: 'dining-table', model: 'tableCloth', at: [1.0, 2.75], facing: 'E' },
    { id: 'dining-chair', model: 'chair', logic: 'chair@3,0', at: [0.9, 3.5], facing: 'N' },
    { id: 'dining-chair-north', model: 'chair', at: [1.0, 2.0], facing: 'S' },
    { id: 'dining-chair-east', model: 'chair', at: [1.55, 2.5], facing: 'W' },
    { id: 'dining-chair-east-2', model: 'chairCushion', at: [1.55, 3.0], facing: 'W' },
    { id: 'dining-chair-west', model: 'chairCushion', at: [0.42, 2.75], facing: 'E' },
    { id: 'dining-sideboard', model: 'sideTableDrawers', against: { wall: 'north', at: 1.4 } },
    { id: 'dining-sideboard-lamp', model: 'lampRoundTable', on: { parent: 'dining-sideboard' } },
    { id: 'dining-lamp-north', model: 'lampRoundFloor', logic: 'lamp@1,2', at: [2.75, 1.25] },
    { id: 'dining-lamp-south', model: 'lampRoundFloor', logic: 'lamp@2,2', at: [2.75, 2.25] },
    { id: 'dining-plant', model: 'pottedPlant', at: [0.3, 4.65] },
    // Átrio: vaso e relógio de pé junto à parede da sala.
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@3,4', at: [4.6, 3.6] },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@4,4', at: [4.7, 4.6] },
    // Sala, canto norte: televisão na parede norte com duas cadeiras e mesa de
    // jogo sobre tapete; relógio de pé no canto.
    { id: 'living-tv-north-stand', model: 'tableCoffee', at: [6.5, 0.3] },
    { id: 'living-tv-north', model: 'televisionVintage', logic: 'tv@0,6', on: { parent: 'living-tv-north-stand' } },
    { id: 'living-game-table', model: 'tableCoffeeSquare', at: [6.5, 1.25] },
    { id: 'living-game-chair-west', model: 'chairCushion', at: [5.9, 1.4], facing: 'N' },
    { id: 'living-game-chair-east', model: 'chairCushion', at: [7.1, 1.4], facing: 'N' },
    { id: 'living-clock-north', model: 'speaker', logic: 'clock@1,7', at: [7.8, 1.2] },
    // Sala, centro: cómoda e vasos ao longo da parede este, candeeiro de pé.
    { id: 'living-chest', model: 'sideTableDrawers', against: { wall: 'east', at: 3.0 }, facing: 'W' },
    { id: 'living-chest-plant', model: 'plantSmall1', on: { parent: 'living-chest' } },
    { id: 'living-plant', model: 'pottedPlant', at: [7.7, 2.3] },
    { id: 'living-floor-lamp', model: 'lampSquareFloor', at: [5.25, 3.6] },
    // Sala, sul: dois sofás frente a frente em volta da mesa de centro, com a
    // televisão num banco baixo à cabeceira, junto à parede do átrio.
    { id: 'living-tv-south-stand', model: 'tableCoffee', at: [5.3, 4.45], facing: 'E' },
    { id: 'living-tv-south', model: 'televisionModern', logic: 'tv@4,5', on: { parent: 'living-tv-south-stand' }, facing: 'E' },
    { id: 'living-sofa-east', model: 'loungeSofa', logic: 'sofa@4,6', at: [7.0, 4.3], facing: 'S' },
    { id: 'living-sofa-south', model: 'loungeSofa', logic: 'sofa@5,5', at: [6.0, 5.72], facing: 'N' },
    { id: 'living-coffee-table', model: 'tableCoffee', at: [6.75, 5.0], facing: 'E' },
    { id: 'living-side-table', model: 'sideTableDrawers', against: { wall: 'east', at: 5.3 }, facing: 'W' },
    { id: 'living-side-lamp', model: 'lampRoundTable', on: { parent: 'living-side-table' } },
    { id: 'living-clock-south', model: 'speaker', logic: 'clock@7,5', at: [5.85, 7.2] },
    { id: 'living-reading-lamp', model: 'lampRoundFloor', at: [7.75, 7.2] },
    // Jardim coberto: arbustos e flores em canteiros, pedras e um cepo.
    { id: 'yard-shrub-northwest', model: 'plant_bushSmall', logic: 'shrub@5,0', at: [0.5, 5.5] },
    { id: 'yard-shrub-southwest', model: 'plant_bushSmall', logic: 'shrub@6,0', at: [0.5, 6.5] },
    { id: 'yard-plant-west', model: 'pottedPlant', logic: 'plant@5,4', at: [4.56, 5.33] },
    { id: 'yard-plant-south', model: 'flower_yellowA', logic: 'plant@7,4', at: [4.3, 7.75] },
    { id: 'yard-flower-a', model: 'flower_redA', at: [0.9, 7.4] },
    { id: 'yard-flower-b', model: 'flower_yellowA', at: [1.3, 7.6] },
    { id: 'yard-rock', model: 'rock_smallB', at: [2.4, 7.55] },
    { id: 'yard-stump', model: 'stump_round', at: [1.9, 5.6] },
  ],
  rugs: [
    { id: 'entry-mat', model: 'rugDoormat', at: [4.5, 0.4], facing: 'S' },
    { id: 'dining-rug', model: 'rugRectangle', at: [1.0, 2.75], facing: 'E' },
    { id: 'living-game-rug', model: 'rugSquare', at: [6.5, 1.3] },
    { id: 'living-rug', model: 'rugRectangle', at: [6.5, 5.0] },
    { id: 'yard-path-a', model: 'path_stone', at: [3.8, 5.6], facing: 'S' },
    { id: 'yard-path-b', model: 'path_stone', at: [3.1, 6.4], facing: 'E' },
  ],
}
