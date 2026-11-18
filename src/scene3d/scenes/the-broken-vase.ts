import type { SceneSpec } from '../schema'

// Um escritório com alpendre dá para um pátio ajardinado e murado.
export const theBrokenVase: SceneSpec = {
  puzzleId: 'very-easy-5',
  floor: 0,
  entry: { wall: 'west', at: 1.05 },
  shell: {
    features: [{ wall: 'west', at: 4.0, kind: 'window' }],
  },
  floors: [
    { id: 'porch', cells: [0, 0, 2, 2], material: 'stone', kind: 'interior' },
    { id: 'office', cells: [0, 3, 2, 5], material: 'wood', kind: 'interior' },
    { id: 'courtyard', cells: [3, 0, 5, 5], material: 'grass', kind: 'courtyard' },
  ],
  walls: [
    // passagem larga sem caixilho entre o alpendre e o escritório
    { id: 'porch-office', from: [0, 3], to: [3, 3], height: 'half', openings: [{ at: 1.5, width: 1, kind: 'open' }] },
    { id: 'porch-courtyard', from: [3, 0], to: [3, 3], height: 'half', openings: [{ at: 0.85, width: 1, kind: 'open' }] },
    // o escritório abre para o pátio no canto sul; sem toco de parede junto à célula R6C3
    { id: 'office-courtyard', from: [3, 3], to: [3, 6], height: 'half', openings: [{ at: 5.4, width: 1.2, kind: 'open' }] },
  ],
  furniture: [
    // Escritório: secretária debaixo da janela oeste, estante larga a sul na mesma parede,
    // cómoda de gavetas contra a parede sul e consola com o rádio encostada à meia parede do alpendre.
    { id: 'office-desk', model: 'desk', against: { wall: 'west', at: 4.0 } },
    { id: 'office-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-chair', model: 'chairDesk', at: [1.15, 4.0], facing: 'W' },
    { id: 'office-rug', model: 'rugRound', at: [1.15, 4.1] },
    { id: 'office-shelf-a', model: 'bookcaseClosedWide', logic: 'bookshelf@5,0', against: { wall: 'west', at: 5.45 } },
    { id: 'office-drawers', model: 'sideTableDrawers', against: { wall: 'south', at: 1.35 } },
    { id: 'office-books', model: 'books', on: { parent: 'office-drawers', surface: 'top' } },
    { id: 'office-console', model: 'sideTable', against: { wall: 'porch-office', side: 'S', at: 2.5 } },
    { id: 'office-clock', model: 'radio', logic: 'clock@3,2', on: { parent: 'office-console' } },
    // Alpendre: banco junto à passagem, poltrona e bengaleiro junto à porta de entrada.
    { id: 'porch-plant', model: 'pottedPlant', logic: 'plant@0,1', at: [1.45, 0.4] },
    { id: 'porch-armchair', model: 'loungeChair', against: { wall: 'north', at: 2.05 } },
    { id: 'porch-coat-rack', model: 'coatRackStanding', at: [0.3, 0.3] },
    { id: 'porch-bench', model: 'bench', logic: 'chair@2,0', at: [0.55, 2.5], facing: 'E' },
    { id: 'courtyard-shrub-west', model: 'plant_bushSmall', logic: 'shrub@1,3', at: [3.8, 1.7] },
    { id: 'courtyard-plant-west', model: 'pottedPlant', logic: 'plant@2,3', at: [3.4, 2.4] },
    { id: 'courtyard-shrub-north', model: 'plant_bushSmall', logic: 'shrub@0,4', at: [4.5, 0.5] },
    { id: 'courtyard-shrub-south', model: 'plant_bushSmall', logic: 'shrub@5,4', at: [4.5, 5.5] },
    { id: 'courtyard-plant-south', model: 'pottedPlant', logic: 'plant@5,5', at: [5.5, 5.5] },
    { id: 'courtyard-bench', model: 'benchCushion', at: [5.6, 3.0], facing: 'W' },
  ],
  rugs: [
    { id: 'porch-mat', model: 'rugDoormat', at: [0.3, 1.05], facing: 'E' },
    { id: 'courtyard-path-a', model: 'path_stone', at: [4.5, 4.5] },
    { id: 'courtyard-path-b', model: 'path_stone', at: [4.5, 3.5] },
    { id: 'courtyard-path-c', model: 'path_stone', at: [4.5, 2.5] },
    { id: 'porch-step-a', model: 'path_stone', at: [2.45, 1.55] },
  ],
}
