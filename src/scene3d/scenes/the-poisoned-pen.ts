import type { SceneSpec } from '../schema'

// Moradia de campo com galeria de jantar e jardim de entrada.
export const thePoisonedPen: SceneSpec = {
  puzzleId: 'medium-4',
  floor: 0,
  entry: { wall: 'west', at: 6.8 },
  shell: { features: [{ wall: 'north', at: 6.7, kind: 'window' }] },
  floors: [
    { id: 'dining-gallery', cells: [5, 0, 7, 7], material: 'wood', kind: 'interior' },
    { id: 'front-yard', cells: [0, 0, 4, 2], material: 'stone', kind: 'exterior' },
    { id: 'walled-garden', cells: [0, 3, 4, 5], material: 'grass', kind: 'courtyard' },
    { id: 'south-hallway', cells: [0, 6, 4, 7], material: 'tile', kind: 'interior' },
  ],
  walls: [
    { id: 'dining-front-yard', from: [5, 0], to: [5, 3], height: 'half', openings: [{ at: 1.7, width: 1.2, kind: 'door' }] },
    { id: 'dining-garden', from: [5, 3], to: [5, 6], height: 'half', openings: [{ at: 4.5, width: 1.0, kind: 'open' }] },
    { id: 'dining-hallway', from: [5, 6], to: [5, 8], height: 'half', openings: [{ at: 6.5, width: 0.9, kind: 'door' }] },
    { id: 'yard-garden', from: [0, 3], to: [5, 3], height: 'half', openings: [{ at: 4.4, width: 0.9, kind: 'open' }] },
    { id: 'garden-hallway', from: [0, 6], to: [5, 6], height: 'half', openings: [{ at: 4.5, width: 0.8, kind: 'door' }] },
  ],
  furniture: [
    // Sala de jantar: mesa sob a janela norte com cadeiras à volta e candeeiro no canto;
    // ao centro duas poltronas frente a frente junto à estante; a sul um sofá sobre o tapete.
    { id: 'dining-table-carol', model: 'tableCloth', logic: 'table@0,5', at: [6.4, 0.95] },
    { id: 'dining-chair-carol', model: 'chair', logic: 'chair@1,7', at: [7.12, 0.98], facing: 'W' },
    { id: 'dining-chair-sw', model: 'chair', at: [6.1, 1.55], facing: 'N' },
    { id: 'dining-chair-se', model: 'chair', at: [6.7, 1.55], facing: 'N' },
    { id: 'dining-chair-west', model: 'chair', at: [5.68, 0.98], facing: 'E' },
    { id: 'dining-lamp-north', model: 'lampRoundFloor', logic: 'lamp@0,7', at: [7.7, 0.3] },
    { id: 'dining-chair-dalia', model: 'loungeChair', logic: 'chair@2,5', at: [5.75, 3.0], facing: 'E' },
    { id: 'dining-armchair-east', model: 'loungeChair', at: [7.0, 3.0], facing: 'W' },
    { id: 'dining-shelf-east', model: 'bookcaseOpenLow', against: { wall: 'east', at: 2.2 }, facing: 'W' },
    { id: 'dining-shelf-books', model: 'books', on: { parent: 'dining-shelf-east', surface: 'top' } },
    { id: 'dining-lamp-west', model: 'lampRoundFloor', logic: 'lamp@4,7', at: [7.6, 4.2] },
    { id: 'dining-rug-south', model: 'rugRectangle', logic: 'rug@6,5', at: [6.0, 7.0], facing: 'E' },
    { id: 'dining-sofa-south', model: 'loungeSofa', against: { wall: 'south', at: 6.3 }, facing: 'N' },
    { id: 'dining-lamp-south', model: 'lampRoundFloor', logic: 'lamp@7,7', at: [7.3, 7.2] },
    { id: 'dining-bookcase-hall', model: 'bookcaseOpenLow', against: { wall: 'dining-hallway', at: 7.5, side: 'E' }, facing: 'E' },
    // Pátio da frente: vedação, arbustos e caminho até à porta da sala de jantar.
    { id: 'front-yard-shrub', model: 'plant_bushSmall', logic: 'shrub@0,0', at: [0.5, 0.55] },
    { id: 'front-yard-plant-west', model: 'flower_yellowA', logic: 'plant@0,1', at: [1.5, 0.5] },
    { id: 'front-yard-plant-east', model: 'flower_redA', logic: 'plant@0,4', at: [4.5, 0.5] },
    { id: 'yard-fence-north-a', model: 'fence_simple', at: [0.75, 0.1], facing: 'S' },
    { id: 'yard-fence-north-b', model: 'fence_simple', at: [2.05, 0.1], facing: 'S' },
    { id: 'yard-fence-north-c', model: 'fence_simple', at: [3.35, 0.1], facing: 'S' },
    { id: 'yard-fence-west-a', model: 'fence_simple', at: [0.1, 0.95], facing: 'E' },
    { id: 'yard-fence-west-b', model: 'fence_simple', at: [0.1, 2.22], facing: 'E' },
    { id: 'yard-rock', model: 'rock_smallA', at: [1.3, 2.4] },
    // Jardim murado: canteiros, banco e caminho entre o pátio e o corredor.
    { id: 'garden-shrub-west', model: 'plant_bushDetailed', logic: 'shrub@3,1', at: [1.5, 3.5] },
    { id: 'garden-plant-west', model: 'flower_purpleA', logic: 'plant@3,2', at: [2.5, 3.4] },
    { id: 'garden-shrub-south', model: 'plant_bushSmall', logic: 'shrub@5,3', at: [3.5, 5.5] },
    { id: 'garden-shrub-east', model: 'plant_bushSmall', logic: 'shrub@4,4', at: [4.05, 4.5] },
    { id: 'garden-plant-south', model: 'pottedPlant', logic: 'plant@5,2', at: [2.6, 5.3] },
    { id: 'garden-bench', model: 'bench', against: { wall: 'west', at: 4.5 }, facing: 'E' },
    { id: 'garden-stump', model: 'stump_round', at: [0.45, 5.5] },
    // Corredor: tapete junto à entrada, banco e duas prateleiras baixas com rádios.
    { id: 'hall-rug-west', model: 'rugRectangle', logic: 'rug@6,1', at: [2.0, 7.0] },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'garden-hallway', at: 2.0, side: 'S' } },
    { id: 'hall-clock-table-west', model: 'bookcaseOpenLow', against: { wall: 'south', at: 3.55 }, facing: 'N' },
    { id: 'hall-clock-west', model: 'radio', logic: 'clock@7,3', on: { parent: 'hall-clock-table-west', surface: 'top' } },
    { id: 'hall-clock-table-east', model: 'bookcaseOpenLow', against: { wall: 'south', at: 4.45 }, facing: 'N' },
    { id: 'hall-clock-east', model: 'radio', logic: 'clock@7,4', on: { parent: 'hall-clock-table-east', surface: 'top' } },
  ],
  rugs: [
    { id: 'dining-rug-centre', model: 'rugRound', at: [6.4, 3.0] },
    { id: 'yard-path-a', model: 'path_stone', at: [3.3, 1.7] },
    { id: 'yard-path-b', model: 'path_stone', at: [4.3, 1.7] },
    { id: 'garden-path-a', model: 'path_stone', at: [4.4, 3.6] },
    { id: 'garden-path-b', model: 'path_stone', at: [4.5, 5.4] },
  ],
}
