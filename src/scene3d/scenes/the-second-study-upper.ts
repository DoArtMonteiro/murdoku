import type { SceneSpec } from '../schema'
import { theSecondStudyStairwellBounds } from './the-second-study-ground'

const well = theSecondStudyStairwellBounds
const guardOffset = 0.08

export const theSecondStudyUpper: SceneSpec = {
  puzzleId: 'expert-7',
  floor: 1,
  storeyFootprint: { kind: 'full' },
  stairwellBounds: well,
  circulation: {
    // A escada chega a nascente a um patamar que segue para sul até ao quarto e para
    // norte por um corredor curto com portas para a casa de banho, a copa e o escritório.
    landing: [well[2], well[1], 5.19, 4.95],
    halls: [
      { id: 'upper-corridor', bounds: [well[2], 2.05, 5.19, well[1]] },
    ],
    roomAccessTargets: [
      { id: 'pantry-entry', bounds: [4.4, 1.4, 5.15, 2.4] },
      { id: 'bathroom-entry', bounds: [3.9, 2.2, 4.8, 3.0] },
      { id: 'study-approach', bounds: [4.9, 2.42, 5.9, 3.38] },
      { id: 'bedroom-entry', bounds: [well[2], 4.9, 5.1, 5.8] },
    ],
  },
  shell: {
    features: [
      { wall: 'north', at: 1.8, kind: 'window' },
      { wall: 'north', at: 6.8, kind: 'window' },
      { wall: 'west', at: 6.2, kind: 'window' },
    ],
  },
  floors: [
    { id: 'pantry-tile', cells: [0, 0, 4, 1], material: 'tile' },
    { id: 'bathroom-tile', cells: [0, 2, 4, 4], material: 'tile' },
    { id: 'study-wood', cells: [5, 0, 7, 4], material: 'wood' },
    { id: 'bedroom-wood', cells: [0, 5, 7, 7], material: 'wood' },
  ],
  walls: [
    // A copa e a casa de banho partilham uma parede de divisão (não uma meia-parede):
    // as peças sanitárias encostam-lhe do lado sul, a bancada fica do lado norte.
    { id: 'pantry-bathroom', from: [0, 2], to: [well[2], 2], height: 'low' },
    { id: 'pantry-corridor', from: [well[2], 2], to: [5.25, 2], height: 'half', openings: [{ at: 4.78, width: 0.8, kind: 'door' }] },
    { id: 'pantry-study', from: [5.25, 0], to: [5.25, 2], height: 'cutaway' },
    // Corredor fechado entre a casa de banho e o escritório, cada um com a sua porta.
    { id: 'corridor-bathroom', from: [well[2], 2], to: [well[2], well[1] - guardOffset], height: 'half', openings: [{ at: 2.6, width: 0.9, kind: 'door' }] },
    { id: 'study-west', from: [5.25, 2], to: [5.25, 5], height: 'half', openings: [{ at: 2.9, width: 1.0, kind: 'door' }] },
    { id: 'bedroom-divider', from: [0, 5], to: [8, 5], height: 'half', openings: [{ at: 4.7, width: 0.8, kind: 'door' }] },
    // A casa de banho fecha-se sobre a escada: parede a norte do vão e a poente dele.
    { id: 'bathroom-stair-north', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[2], well[1] - guardOffset], height: 'half' },
    { id: 'stairwell-south', from: [well[0] - guardOffset, well[3] + guardOffset], to: [well[2] - guardOffset, well[3] + guardOffset], height: 'half', treatment: 'railing', freeEnds: ['to'] },
    { id: 'bathroom-stair-west', from: [well[0] - guardOffset, well[1] - guardOffset], to: [well[0] - guardOffset, 5], height: 'half' },
  ],
  furniture: [
    // Copa: bancada com placa, armário e lava-loiça sob a janela, frigorífico junto à porta
    // e estante de despensa a poente.
    { id: 'pantry-shelves', model: 'bookcaseClosed', against: { wall: 'west', at: 1.0 }, facing: 'E' },
    { id: 'pantry-box', model: 'cardboardBoxClosed', logic: 'box@0,1', at: [1.4, 0.78] },
    { id: 'pantry-box-open', model: 'cardboardBoxOpen', at: [0.85, 1.35] },
    { id: 'pantry-stove', model: 'kitchenStove', against: { wall: 'north', at: 2.13 }, facing: 'S' },
    { id: 'pantry-counter', model: 'kitchenCabinet', logic: 'counter@0,2', against: { wall: 'north', at: 2.67 }, facing: 'S' },
    { id: 'pantry-sink-counter', model: 'kitchenSink', logic: 'counter@0,2', against: { wall: 'north', at: 3.21 }, facing: 'S' },
    { id: 'pantry-counter-end', model: 'kitchenCabinetDrawer', against: { wall: 'north', at: 3.75 }, facing: 'S' },
    { id: 'pantry-microwave', model: 'kitchenMicrowave', on: { parent: 'pantry-counter-end' } },
    { id: 'pantry-fridge', model: 'kitchenFridgeSmall', logic: 'fridge@1,4', at: [4.85, 1.12], facing: 'W' },
    // Casa de banho: banheira, sanita e lavatório ao longo da parede norte; duche, móvel
    // e máquina de lavar na ala poente.
    { id: 'nadia-bathtub', model: 'bathtub', logic: 'bathtub@2,0', against: { wall: 'pantry-bathroom', side: 'S', at: 1.0 }, facing: 'S' },
    { id: 'bathroom-toilet', model: 'toilet', logic: 'toilet@2,2', against: { wall: 'pantry-bathroom', side: 'S', at: 2.45 }, facing: 'S' },
    { id: 'bathroom-sink', model: 'bathroomSink', against: { wall: 'pantry-bathroom', side: 'S', at: 3.2 }, facing: 'S' },
    { id: 'bathroom-cabinet', model: 'bathroomCabinetDrawer', against: { wall: 'west', at: 3.55 }, facing: 'E' },
    { id: 'bathroom-shower', model: 'showerRound', logic: 'shower@4,1', at: [1.45, 4.55], facing: 'S' },
    { id: 'bathroom-washer', model: 'washer', against: { wall: 'west', at: 4.55 }, facing: 'E' },
    // Patamar: banco baixo encostado à divisória, por trás da guarda.
    { id: 'landing-bench', model: 'benchCushion', against: { wall: 'bedroom-divider', side: 'N', at: 3.0 }, facing: 'N' },
    // Escritório: secretária contra a divisória do quarto com a cadeira à frente, estantes
    // baixas ao lado, estante alta a norte e cadeira de leitura sob a janela.
    { id: 'study-desk', model: 'desk', logic: 'desk@4,5', against: { wall: 'bedroom-divider', side: 'N', at: 5.78 }, facing: 'N' },
    { id: 'study-laptop', model: 'laptop', on: { parent: 'study-desk' } },
    { id: 'study-chair', model: 'chairDesk', at: [5.78, 4.1], facing: 'S' },
    { id: 'study-bookcase', model: 'bookcaseOpenLow', logic: 'bookshelf@4,6', against: { wall: 'bedroom-divider', side: 'N', at: 6.55 }, facing: 'N' },
    { id: 'study-bookcase-2', model: 'bookcaseOpenLow', against: { wall: 'bedroom-divider', side: 'N', at: 7.1 }, facing: 'N' },
    { id: 'study-bookcase-books', model: 'books', on: { parent: 'study-bookcase-2' } },
    { id: 'study-bookcase-tall', model: 'bookcaseClosedWide', against: { wall: 'north', at: 5.85 } },
    { id: 'study-armchair', model: 'loungeChair', at: [7.45, 1.9], facing: 'W' },
    { id: 'study-side-table', model: 'tableCoffeeSquare', at: [7.6, 1.05] },
    { id: 'study-side-books', model: 'books', on: { parent: 'study-side-table' } },
    { id: 'study-box-north', model: 'cardboardBoxClosed', logic: 'box@0,7', at: [7.65, 0.35] },
    // Quarto: cama com a cabeceira na parede sul, candeeiro e mesa de cabeceira, móvel de
    // televisão aos pés, relógio e cómoda a poente, recanto de estar no tapete e roupeiro.
    { id: 'bed', model: 'bedDouble', against: { wall: 'south', at: 2.6 } },
    { id: 'bedroom-lamp-west', model: 'lampRoundFloor', logic: 'lamp@7,1', at: [1.8, 7.12], facing: 'S' },
    { id: 'bedroom-nightstand', model: 'tableCoffeeSquare', at: [3.5, 7.7] },
    { id: 'bedroom-nightstand-books', model: 'books', on: { parent: 'bedroom-nightstand' } },
    { id: 'bedroom-tv-console', model: 'cabinetTelevisionDoors', against: { wall: 'bedroom-divider', side: 'S', at: 2.6 }, facing: 'S' },
    { id: 'bedroom-tv', model: 'televisionVintage', on: { parent: 'bedroom-tv-console' } },
    { id: 'bedroom-clock-north', model: 'speaker', logic: 'clock@5,0', at: [0.3, 5.35], facing: 'S' },
    { id: 'bedroom-chest', model: 'cabinetTelevision', against: { wall: 'west', at: 6.5 }, facing: 'E' },
    { id: 'bedroom-clock-south', model: 'radio', logic: 'clock@6,0', on: { parent: 'bedroom-chest' } },
    { id: 'bedroom-rug', model: 'rugRectangle', logic: 'rug@5,4', at: [5.2, 6.2], facing: 'S' },
    { id: 'bedroom-armchair-west', model: 'loungeChair', at: [4.5, 6.4], facing: 'E' },
    { id: 'bedroom-armchair-east', model: 'loungeChair', at: [5.95, 6.4], facing: 'W' },
    { id: 'bedroom-tea-table', model: 'tableCoffeeSquare', at: [5.22, 6.4] },
    { id: 'bedroom-lamp-east', model: 'lampRoundFloor', logic: 'lamp@7,5', at: [5.78, 7.12], facing: 'S' },
    { id: 'bedroom-wardrobe', model: 'bookcaseClosedWide', against: { wall: 'bedroom-divider', side: 'S', at: 7.0 }, facing: 'S' },
    { id: 'yuki-clock-table', model: 'sideTable', at: [6.5, 7.65] },
    { id: 'yuki-clock', model: 'radio', logic: 'clock@7,6', on: { parent: 'yuki-clock-table' } },
    { id: 'carol-lamp', model: 'lampRoundFloor', logic: 'lamp@6,7', at: [7.5, 6.5], facing: 'S' },
  ],
  rugs: [
    { id: 'bathroom-mat', model: 'rugDoormat', at: [1.0, 3.3] },
    { id: 'study-rug', model: 'rugRound', at: [6.9, 1.6] },
  ],
}
