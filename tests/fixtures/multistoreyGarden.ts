import { MODEL_BOUNDS } from '../../src/scene3d/catalog.generated'
import type { PlanRect, SceneSpec } from '../../src/scene3d/schema'
import { CELL } from '../../src/scene3d/units'

const STAIR_HEAD_X = 3.1
const STAIR_Z = 0.6
const STAIR_LENGTH = MODEL_BOUNDS.stairsOpen.size[0] / CELL
const STAIR_WIDTH = MODEL_BOUNDS.stairsOpen.size[2] / CELL

export const gardenStairwellBounds: PlanRect = [
  STAIR_HEAD_X - STAIR_LENGTH,
  STAIR_Z - STAIR_WIDTH / 2,
  STAIR_HEAD_X,
  STAIR_Z + STAIR_WIDTH / 2,
]

export const multistoreyGardenLower: SceneSpec = {
  puzzleId: 'multistorey-garden-fixture',
  floor: 0,
  storeyFootprint: { kind: 'full' },
  entry: { wall: 'west', at: 3 },
  floors: [{ id: 'garden', cells: [4, 0, 5, 5], material: 'grass', kind: 'exterior' }],
  walls: [{ id: 'garden-facade', from: [4, 0], to: [4, 6], height: 'full' }],
  furniture: [],
  stairs: {
    model: 'stairsOpen',
    at: [STAIR_HEAD_X - STAIR_LENGTH / 2, STAIR_Z],
    facing: 'E',
  },
}

export const multistoreyGardenUpper: SceneSpec = {
  puzzleId: 'multistorey-garden-fixture',
  floor: 1,
  storeyFootprint: { kind: 'cell-rects', rects: [[0, 0, 3, 5]] },
  stairwellBounds: gardenStairwellBounds,
  circulation: {
    landing: [STAIR_HEAD_X, 0, 4, 1.15],
    halls: [{ id: 'east-gallery', bounds: [3, 1.15, 4, 4] }],
    roomAccessTargets: [{ id: 'west-room-door', bounds: [2.5, 3.25, 3, 4] }],
  },
  walls: [{ id: 'upper-garden-facade', from: [4, 0], to: [4, 6], height: 'full' }],
  furniture: [],
}
