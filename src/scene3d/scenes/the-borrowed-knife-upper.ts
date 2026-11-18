import type { SceneSpec } from '../schema'
import { theBorrowedKnifeStairwellBounds } from './the-borrowed-knife-ground'

const stairwell = theBorrowedKnifeStairwellBounds

// A escada chega a um corredor a norte do escritório que serve a casa de banho, a sala
// de jantar e o quarto; o escritório fica num recanto próprio a nascente.
export const theBorrowedKnifeUpper: SceneSpec = {
  puzzleId: 'expert-5',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: stairwell,
  circulation: {
    landing: [stairwell[0], stairwell[1] - 0.75, stairwell[2], stairwell[1]],
    halls: [
      { id: 'study-corridor', bounds: [stairwell[0], stairwell[1] - 0.75, 4.9, stairwell[1]] },
      { id: 'bedroom-lane', bounds: [3.07, stairwell[1] - 0.75, 3.93, 5.0] },
    ],
    roomAccessTargets: [
      { id: 'bathroom-entry', bounds: [3.07, 2.3, 3.93, stairwell[1] - 0.75] },
      { id: 'dining-entry', bounds: [4.12, 2.3, 4.88, stairwell[1] - 0.75] },
      { id: 'bedroom-entry', bounds: [3.07, 5.0, 3.93, 5.75] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.5, kind: 'window' },
      { wall: 'north', at: 6.6, kind: 'window' },
      { wall: 'west', at: 6.2, kind: 'window' },
    ],
  },
  floors: [
    { id: 'bathroom', cells: [0, 0, 3, 2], material: 'tile', kind: 'interior' },
    { id: 'dining-room', cells: [4, 0, 7, 2], material: 'wood', kind: 'interior' },
    { id: 'study', cells: [0, 3, 7, 4], material: 'wood', kind: 'interior' },
    { id: 'bedroom', cells: [0, 5, 7, 7], material: 'wood', kind: 'interior' },
  ],
  walls: [
    {
      // Divisória completa (0,6) entre a casa de banho e o patamar/estúdio, com porta.
      id: 'bathroom-study-divider',
      from: [0, 3],
      to: [4, 3],
      openings: [{ at: 3.5, width: 0.9, kind: 'door' }],
    },
    {
      id: 'dining-study-divider',
      from: [4, 3],
      to: [8, 3],
      height: 'half',
      openings: [{ at: 4.5, width: 0.8, kind: 'open' }],
    },
    {
      id: 'bathroom-dining-divider',
      from: [4, 0],
      to: [4, 3],
      height: 'half',
    },
    // Biombo dos duches: as duas cabinas encostam-lhe as costas.
    { id: 'shower-screen', from: [1, 1.95], to: [3, 1.95], height: 'half', freeEnds: ['from', 'to'] },
    {
      id: 'study-bedroom-divider-west',
      from: [0, 5],
      to: [0.9, 5],
      height: 'half',
      freeEnds: ['to'],
    },
    {
      id: 'study-bedroom-divider-east',
      from: [2.1, 5],
      to: [8, 5],
      height: 'half',
      openings: [{ at: 3.5, width: 0.9, kind: 'door' }],
      freeEnds: ['from'],
    },
    // O quarto divide-se em zona de vestir e leitura (poente) e zona de dormir (nascente).
    { id: 'bedroom-partition', from: [4, 5], to: [4, 8], height: 'half', openings: [{ at: 7.45, width: 0.9, kind: 'open' }] },
    {
      id: 'stairwell-west-guard',
      from: [stairwell[0], stairwell[1] + 0.1],
      to: [stairwell[0], stairwell[3] - 0.1],
      height: 'half',
      treatment: 'railing',
      freeEnds: ['from', 'to'],
    },
    {
      id: 'stairwell-east-guard',
      from: [stairwell[2], stairwell[1] + 0.1],
      to: [stairwell[2], stairwell[3] - 0.1],
      height: 'half',
      treatment: 'railing',
      freeEnds: ['from', 'to'],
    },
  ],
  furniture: [
    // Quarto: cama de cabeceira contra a divisória interior, mesas de cabeceira, banco aos pés,
    // cómoda e poltrona; a poente, roupeiros, coluna e poltrona de leitura com candeeiro.
    { id: 'bedroom-bed', model: 'bedDouble', logic: 'bed@5,4', against: { wall: 'bedroom-partition', side: 'E', at: 6.0 }, facing: 'E' },
    { id: 'bedroom-nightstand', model: 'cabinetBedDrawerTable', against: { wall: 'bedroom-partition', side: 'E', at: 5.24 }, facing: 'E' },
    { id: 'bedroom-nightstand-south', model: 'cabinetBedDrawerTable', against: { wall: 'bedroom-partition', side: 'E', at: 6.8 }, facing: 'E' },
    { id: 'bedroom-bench', model: 'benchCushion', at: [5.7, 6.0], facing: 'E' },
    { id: 'bedroom-dresser', model: 'cabinetTelevisionDoors', against: { wall: 'study-bedroom-divider-east', side: 'S', at: 7.4 }, facing: 'S' },
    { id: 'bedroom-armchair', model: 'loungeChair', at: [7.3, 6.6], facing: 'W' },
    { id: 'bedroom-clock-east', model: 'speaker', logic: 'clock@7,6', at: [6.5, 7.5] },
    { id: 'bedroom-wardrobe-a', model: 'bookcaseClosedDoors', against: { wall: 'west', at: 7.0 }, facing: 'E' },
    { id: 'bedroom-wardrobe-b', model: 'bookcaseClosedDoors', against: { wall: 'west', at: 7.55 }, facing: 'E' },
    { id: 'bedroom-clock-west', model: 'speaker', logic: 'clock@6,0', at: [0.4, 6.35] },
    { id: 'bedroom-lamp', model: 'lampRoundFloor', logic: 'lamp@7,1', at: [1.5, 7.6] },
    { id: 'bedroom-reading-chair', model: 'loungeChair', at: [2.55, 7.45], facing: 'N' },
    // Escritório: duas secretárias frente a frente com cadeiras, estantes baixas na parede
    // da sala de jantar e poltrona no canto; caixa junto ao corredor.
    { id: 'study-desk-tomas', model: 'desk', logic: 'desk@3,6', against: { wall: 'dining-study-divider', side: 'S', at: 6.5 }, facing: 'S' },
    { id: 'study-chair-tomas', model: 'chairDesk', at: [6.5, 3.95], facing: 'N' },
    { id: 'study-desk-tomas-laptop', model: 'laptop', on: { parent: 'study-desk-tomas' } },
    { id: 'study-bookshelf', model: 'bookcaseOpenLow', logic: 'bookshelf@3,4', against: { wall: 'dining-study-divider', side: 'S', at: 5.25 }, facing: 'S' },
    { id: 'study-bookshelf-books', model: 'books', on: { parent: 'study-bookshelf' } },
    { id: 'study-bookshelf-east', model: 'bookcaseOpenLow', against: { wall: 'dining-study-divider', side: 'S', at: 5.75 }, facing: 'S' },
    { id: 'study-desk-idris', model: 'desk', logic: 'desk@4,4', against: { wall: 'study-bedroom-divider-east', side: 'N', at: 4.6 }, facing: 'N' },
    { id: 'study-chair-idris', model: 'chairDesk', at: [4.6, 4.12], facing: 'S' },
    { id: 'study-armchair', model: 'loungeChair', at: [7.5, 4.45], facing: 'W' },
    { id: 'study-box', model: 'cardboardBoxClosed', logic: 'box@4,2', at: [2.55, 4.7] },
    { id: 'study-bench', model: 'bench', against: { wall: 'west', at: 4.0 }, facing: 'E' },
    // Casa de banho: banheira, lavatório e móvel a norte; duches lado a lado contra o biombo;
    // sanita a poente.
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@2,0', against: { wall: 'west', at: 2.45 }, facing: 'E' },
    { id: 'bathroom-shower-west', model: 'shower', logic: 'shower@2,1', against: { wall: 'shower-screen', side: 'S', at: 1.5 }, facing: 'S' },
    { id: 'bathroom-shower-east', model: 'shower', logic: 'shower@2,2', against: { wall: 'shower-screen', side: 'S', at: 2.5 }, facing: 'S' },
    { id: 'bathroom-bathtub', model: 'bathtub', against: { wall: 'north', at: 1.4 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'north', at: 2.85 }, facing: 'S' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'north', at: 3.45 }, facing: 'S' },
    // Sala de jantar com cozinha: placa, lava-loiça e frigorífico na parede norte com balcão de
    // pequenos-almoços; mesa com cadeiras, aparador e candeeiro.
    { id: 'dining-stove', model: 'kitchenStove', against: { wall: 'north', at: 6.48 }, facing: 'S' },
    { id: 'dining-sink', model: 'kitchenSink', against: { wall: 'north', at: 7.02 }, facing: 'S' },
    { id: 'dining-fridge', model: 'kitchenFridge', against: { wall: 'north', at: 7.6 }, facing: 'S' },
    { id: 'kitchen-bar', model: 'kitchenBar', at: [7.25, 1.3] },
    { id: 'kitchen-bar-west', model: 'kitchenBar', at: [6.71, 1.3] },
    { id: 'dining-chair', model: 'stoolBar', logic: 'chair@1,7', at: [7.25, 1.75], facing: 'N' },
    { id: 'kitchen-stool', model: 'stoolBar', at: [6.71, 1.75], facing: 'N' },
    { id: 'dining-table', model: 'table', logic: 'table@0,4', at: [5.0, 0.65] },
    { id: 'dining-table-chair-a', model: 'chairCushion', at: [4.7, 1.25], facing: 'N' },
    { id: 'dining-table-chair-b', model: 'chairCushion', at: [5.3, 1.25], facing: 'N' },
    { id: 'dining-table-chair-end', model: 'chairCushion', at: [5.8, 0.65], facing: 'W' },
    { id: 'dining-table-chair-west', model: 'chairCushion', at: [4.25, 0.65], facing: 'E' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'bathroom-dining-divider', side: 'E', at: 1.55 }, facing: 'E' },
    { id: 'dining-lamp', model: 'lampRoundFloor', logic: 'lamp@2,5', at: [5.45, 2.6] },
  ],
  rugs: [
    { id: 'bedroom-rug', model: 'rugRectangle', at: [5.5, 6.0], facing: 'E' },
    { id: 'dining-rug', model: 'rugRectangle', at: [5.0, 0.9] },
    { id: 'study-rug', model: 'rugRound', at: [6.5, 4.4] },
    { id: 'bathroom-mat', model: 'rugDoormat', at: [3.4, 2.4], facing: 'E' },
  ],
}
