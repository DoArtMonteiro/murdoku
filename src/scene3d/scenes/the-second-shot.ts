import type { SceneSpec } from '../schema'

// Casa urbana compacta com corredor central, cozinha de serviço e jantar.
export const theSecondShot: SceneSpec = {
  puzzleId: 'medium-10',
  floor: 0,
  entry: { wall: 'north', at: 4 },
  shell: { features: [
    { wall: 'north', at: 2.4, kind: 'window' },
    { wall: 'north', at: 6.5, kind: 'window' },
    { wall: 'west', at: 6.6, kind: 'window' },
  ] },
  floors: [
    { id: 'office-floor', cells: [0, 0, 2, 2], material: 'wood' },
    { id: 'dining-floor', cells: [0, 3, 2, 7], material: 'wood' },
    { id: 'gallery-floor', cells: [3, 0, 4, 7], material: 'tile' },
    { id: 'kitchen-floor', cells: [5, 0, 7, 7], material: 'tile' },
  ],
  walls: [
    { id: 'office-dining', from: [0, 3], to: [3, 3], height: 'half', openings: [{ at: 1.45, width: 1.0, kind: 'door' }] },
    { id: 'gallery-west', from: [3, 0], to: [3, 8], height: 'half', openings: [
      { at: 5.7, width: 1.0, kind: 'open' },
    ] },
    { id: 'gallery-kitchen', from: [5, 0], to: [5, 8], height: 'half', openings: [
      { at: 2.6, width: 1.1, kind: 'open' },
      { at: 6.25, width: 1.1, kind: 'open' },
    ] },
  ],
  furniture: [
    // Escritório: secretária sob a janela norte com a cadeira, estante na parede oeste
    // e poltrona de leitura junto à divisória.
    { id: 'office-desk', model: 'desk', logic: 'desk@0,2', against: { wall: 'north', at: 2.4 } },
    { id: 'office-desk-laptop', model: 'laptop', on: { parent: 'office-desk' } },
    { id: 'office-desk-chair', model: 'chairDesk', at: [2.4, 0.95], facing: 'N' },
    { id: 'office-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 1.2 }, facing: 'E' },
    { id: 'office-chair', model: 'loungeChair', logic: 'chair@2,2', at: [2.5, 2.45], facing: 'W' },
    // Sala de jantar: mesa com seis cadeiras sob a janela oeste, aparador com candeeiro,
    // candeeiros de pé junto ao corredor e estante a norte.
    { id: 'dining-bookcase', model: 'bookcaseClosedWide', against: { wall: 'west', at: 3.75 }, facing: 'E' },
    { id: 'dining-sideboard', model: 'cabinetTelevisionDoors', against: { wall: 'west', at: 5.5 }, facing: 'E' },
    { id: 'dining-lamp-west', model: 'lampRoundTable', logic: 'lamp@5,0', on: { parent: 'dining-sideboard' } },
    { id: 'dining-lamp-south', model: 'lampRoundFloor', logic: 'lamp@4,2', at: [2.7, 4.3] },
    { id: 'dining-lamp-east', model: 'lampRoundFloor', logic: 'lamp@5,2', at: [2.25, 5.2] },
    { id: 'dining-table', model: 'tableCloth', at: [1.75, 6.6] },
    { id: 'dining-chair', model: 'chair', logic: 'chair@7,2', at: [2.05, 7.15], facing: 'N' },
    { id: 'dining-chair-sw', model: 'chair', at: [1.45, 7.15], facing: 'N' },
    { id: 'dining-chair-nw', model: 'chair', at: [1.45, 6.05], facing: 'S' },
    { id: 'dining-chair-ne', model: 'chair', at: [2.05, 6.05], facing: 'S' },
    { id: 'dining-chair-w', model: 'chair', at: [0.97, 6.6], facing: 'E' },
    { id: 'dining-chair-e', model: 'chair', at: [2.53, 6.6], facing: 'W' },
    // Corredor: bengaleiro à entrada, relógio de pé, banco, consola, tapete e vaso.
    { id: 'hall-coat-rack', model: 'coatRackStanding', at: [3.3, 0.35] },
    { id: 'hall-clock', model: 'speaker', logic: 'clock@2,3', against: { wall: 'gallery-west', at: 2.6, side: 'E' }, facing: 'E' },
    { id: 'hall-bench', model: 'benchCushion', against: { wall: 'gallery-west', at: 4.0, side: 'E' }, facing: 'E' },
    { id: 'hall-console', model: 'sideTable', against: { wall: 'gallery-kitchen', at: 4.3, side: 'W' }, facing: 'W' },
    { id: 'hall-rug', model: 'rugRectangle', logic: 'rug@5,3', at: [4, 6.0], facing: 'E' },
    { id: 'hall-plant', model: 'pottedPlant', logic: 'plant@7,4', at: [4.5, 7.45] },
    // Cozinha: bancada, lava-loiça e fogão na meia parede do corredor, frigorífico no canto
    // norte, mesa de trabalho com bancos ao centro, bancada com despensa na parede este e mesa de pequenos-almoços a sul.
    { id: 'kitchen-counter-run-a', model: 'kitchenCabinet', logic: 'counter@0,5', against: { wall: 'gallery-kitchen', at: 0.35, side: 'E' }, facing: 'E' },
    { id: 'kitchen-counter-run-b', model: 'kitchenSink', logic: 'counter@0,5', against: { wall: 'gallery-kitchen', at: 0.89, side: 'E' }, facing: 'E' },
    { id: 'kitchen-stove', model: 'kitchenStove', logic: 'stove@1,5', against: { wall: 'gallery-kitchen', at: 1.43, side: 'E' }, facing: 'E' },
    { id: 'kitchen-fridge', model: 'kitchenFridge', logic: 'fridge@0,7', against: { wall: 'north', at: 7.5 } },
    { id: 'kitchen-shelf-north', model: 'bookcaseOpenLow', against: { wall: 'north', at: 6.9 } },
    { id: 'kitchen-pantry-a', model: 'bookcaseOpenLow', against: { wall: 'east', at: 3.4 }, facing: 'W' },
    { id: 'kitchen-island-counter', model: 'kitchenCabinet', logic: 'counter@3,7', against: { wall: 'east', at: 4.0 }, facing: 'W' },
    { id: 'kitchen-microwave', model: 'kitchenMicrowave', on: { parent: 'kitchen-island-counter' } },
    { id: 'kitchen-pantry-b', model: 'bookcaseOpenLow', against: { wall: 'east', at: 4.6 }, facing: 'W' },
    { id: 'kitchen-work-table', model: 'tableCross', at: [6.45, 3.9], facing: 'E' },
    { id: 'kitchen-work-stool-a', model: 'stoolBar', at: [5.85, 3.6], facing: 'E' },
    { id: 'kitchen-work-stool-b', model: 'stoolBar', at: [5.85, 4.2], facing: 'E' },
    { id: 'kitchen-breakfast-table', model: 'table', logic: 'table@7,5', at: [6.0, 7.45] },
    { id: 'kitchen-breakfast-seat', model: 'chair', at: [5.7, 6.85], facing: 'S' },
    { id: 'kitchen-breakfast-seat-b', model: 'chair', at: [6.3, 6.85], facing: 'S' },
    { id: 'kitchen-breakfast-seat-e', model: 'chair', at: [6.78, 7.45], facing: 'W' },
  ],
}
