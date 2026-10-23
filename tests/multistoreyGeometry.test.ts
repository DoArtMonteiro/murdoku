import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../src/core/types'
import { companionFloorBoxes } from '../src/scene3d/companionGeometry'
import { floorPatches } from '../src/scene3d/floorGeometry'
import { resolveScene } from '../src/scene3d/resolve'
import type { PlanRect, SceneSpec } from '../src/scene3d/schema'
import { validateScene, validateStoreyPair } from '../src/scene3d/validate'
import { CELL, FLOOR_THICKNESS } from '../src/scene3d/units'
import {
  gardenStairwellBounds,
  multistoreyGardenLower,
  multistoreyGardenUpper,
} from './fixtures/multistoreyGarden'

const area = (boxes: Array<{ min: [number, number, number]; max: [number, number, number] }>) => boxes.reduce(
  (sum, box) => sum + (box.max[0] - box.min[0]) * (box.max[2] - box.min[2]),
  0,
)

const hardCodes = (spec: SceneSpec, puzzle?: Puzzle) => validateScene(resolveScene(spec, 6), puzzle)
  .filter(issue => issue.severity === 'error')
  .map(issue => issue.code)

describe('explicit storey floor geometry', () => {
  it.each([
    { rect: [0, 0, 3, 5], from: [4, 0], to: [4, 6] },
    { rect: [2, 0, 5, 5], from: [2, 0], to: [2, 6] },
    { rect: [0, 0, 5, 3], from: [0, 4], to: [6, 4] },
    { rect: [0, 2, 5, 5], from: [0, 2], to: [6, 2] },
  ] as const)('requires an authored facade at the setback $rect', ({ rect, from, to }) => {
    const spec: SceneSpec = {
      puzzleId: 'setback-facade', floor: 1,
      storeyFootprint: { kind: 'cell-rects', rects: [[...rect]] },
      walls: [], furniture: [],
    }
    expect(hardCodes(spec)).toContain('zone-boundary-unwalled')
    expect(hardCodes({ ...spec, walls: [{ id: 'facade', from: [...from], to: [...to], height: 'half' }] }))
      .not.toContain('zone-boundary-unwalled')
  })

  it('keeps the omitted single-storey footprint byte-for-byte equivalent to a full slab', () => {
    const scene = resolveScene({ puzzleId: 'legacy', walls: [], furniture: [] }, 6)
    expect(scene.floorPresent).toEqual(Array.from({ length: 6 }, () => Array(6).fill(true)))
    expect(companionFloorBoxes(scene)).toEqual([{
      min: [0, -FLOOR_THICKNESS, 0],
      max: [6 * CELL, 0, 6 * CELL],
    }])
    expect(floorPatches(scene)).toHaveLength(36)
  })

  it('subtracts a fractional stairwell from both active and ghost slab geometry', () => {
    const scene = resolveScene(multistoreyGardenUpper, 6)
    const wellArea = (gardenStairwellBounds[2] - gardenStairwellBounds[0])
      * (gardenStairwellBounds[3] - gardenStairwellBounds[1]) * CELL * CELL
    const active = floorPatches(scene)
    const ghost = companionFloorBoxes(scene)

    expect(area(active.map(patch => patch.box))).toBeCloseTo(24 * CELL * CELL - wellArea)
    expect(area(ghost)).toBeCloseTo(area(active.map(patch => patch.box)))
    for (const box of [...active.map(patch => patch.box), ...ghost]) {
      expect(
        box.max[0] <= gardenStairwellBounds[0] * CELL
          || box.min[0] >= gardenStairwellBounds[2] * CELL
          || box.max[2] <= gardenStairwellBounds[1] * CELL
          || box.min[2] >= gardenStairwellBounds[3] * CELL,
      ).toBe(true)
    }
  })

  it('omits the upper slab above the lower garden while preserving the logical 6×6 extent', () => {
    const lower = resolveScene(multistoreyGardenLower, 6)
    const upper = resolveScene(multistoreyGardenUpper, 6)
    expect(upper.n).toBe(6)
    expect(upper.floorPresent[2][3]).toBe(true)
    expect(upper.floorPresent[2][4]).toBe(false)
    expect(lower.zoneKind[2][4]).toBe('exterior')
    expect(companionFloorBoxes(upper).every(box => box.max[0] <= 4 * CELL)).toBe(true)
  })

  it('rejects malformed footprints and simultaneous legacy and V2 stairwells', () => {
    const bad: SceneSpec = {
      ...multistoreyGardenUpper,
      storeyFootprint: { kind: 'cell-rects', rects: [[0, 0, 6, 5]] },
      stairwell: [0, 0, 1, 1],
    }
    expect(hardCodes(bad)).toContain('unresolved')
  })
})

describe('floor support validation', () => {
  it('accepts the reusable garden and upper-setback fixture without hard errors', () => {
    const lower = resolveScene(multistoreyGardenLower, 6)
    const upper = resolveScene(multistoreyGardenUpper, 6)
    expect(validateScene(lower).filter(issue => issue.severity === 'error')).toEqual([])
    expect(validateScene(upper).filter(issue => issue.severity === 'error')).toEqual([])
    expect(validateStoreyPair(lower, upper).filter(issue => issue.severity === 'error')).toEqual([])
  })

  it.each(['furniture', 'rug'] as const)('rejects %s whose full footprint crosses missing floor', kind => {
    const spec: SceneSpec = {
      ...multistoreyGardenUpper,
      furniture: kind === 'furniture' ? [{ id: 'unsupported', model: 'table', at: [3.9, 2] }] : [],
      rugs: kind === 'rug' ? [{ id: 'unsupported', model: 'rugRound', at: [3.9, 2] }] : [],
    }
    expect(hardCodes(spec)).toContain('floor-missing')
  })

  it('rejects furniture and rugs that cross the fractional void', () => {
    const spec: SceneSpec = {
      ...multistoreyGardenUpper,
      furniture: [{ id: 'void-chair', model: 'chair', at: [2.9, 1] }],
      rugs: [{ id: 'void-rug', model: 'rugRound', at: [2.6, 1] }],
    }
    const codes = hardCodes(spec)
    expect(codes.filter(code => code === 'stairwell-collision')).toHaveLength(2)
  })

  it('rejects an upper interior footprint over exterior ground and an unsupported facade', () => {
    const overGarden: SceneSpec = {
      ...multistoreyGardenUpper,
      storeyFootprint: { kind: 'full' },
    }
    const unsupportedWall: SceneSpec = {
      ...multistoreyGardenUpper,
      walls: [{ id: 'floating-wall', from: [5, 0], to: [5, 6], height: 'full' }],
    }
    expect(validateStoreyPair(resolveScene(multistoreyGardenLower, 6), resolveScene(overGarden, 6))
      .map(issue => issue.code)).toContain('upper-floor-unsupported')
    expect(hardCodes(unsupportedWall)).toContain('wall-unsupported')
  })

  it('rejects a wall through the void while accepting walls on the void and shell boundaries', () => {
    const spec: SceneSpec = {
      puzzleId: 'void-wall-support',
      floor: 1,
      storeyFootprint: { kind: 'full' },
      stairwellBounds: [1, 0, 3, 1],
      walls: [
        { id: 'well-edge', from: [1, 0], to: [1, 1], height: 'half', freeEnds: ['to'] },
        { id: 'through-void', from: [2, 0], to: [2, 1], height: 'half', freeEnds: ['to'] },
      ],
      furniture: [],
    }
    const issues = validateScene(resolveScene(spec, 6))
    const unsupported = issues.filter(issue => issue.code === 'wall-unsupported').map(issue => issue.subject)
    expect(unsupported).toContain('through-void')
    expect(unsupported).not.toContain('well-edge')
    expect(unsupported).not.toContain('shell-north')
  })

  it('rejects solved positions on missing floor or in the fractional void', () => {
    const puzzle = {
      size: 6,
      floors: 2,
      furniture: [],
      rooms: [],
      roomOf: [],
      solution: {
        missing: { floor: 1, row: 2, col: 4 },
        void: { floor: 1, row: 0, col: 2 },
      },
    } as unknown as Puzzle
    const codes = hardCodes(multistoreyGardenUpper, puzzle)
    expect(codes.filter(code => code === 'solution-floor-missing')).toHaveLength(2)
  })
})

describe('V2 stair and circulation validation', () => {
  const rotateBounds = (bounds: PlanRect, facing: 'E' | 'S' | 'W' | 'N'): PlanRect => {
    if (facing === 'E') return bounds
    const [x0, z0, x1, z1] = bounds
    if (facing === 'W') return [6 - x1, z0, 6 - x0, z1]
    if (facing === 'S') return [z0, x0, z1, x1]
    return [z0, 6 - x1, z1, 6 - x0]
  }

  it.each(['E', 'S', 'W', 'N'] as const)('matches the real stair head to the %s void edge', facing => {
    const baseStair = multistoreyGardenLower.stairs!
    const baseAt = baseStair.at
    const at = facing === 'E' ? baseAt
      : facing === 'W' ? [6 - baseAt[0], baseAt[1]] as [number, number]
      : facing === 'S' ? [baseAt[1], baseAt[0]] as [number, number]
      : [baseAt[1], 6 - baseAt[0]] as [number, number]
    const bounds = rotateBounds(gardenStairwellBounds, facing)
    const lower: SceneSpec = { ...multistoreyGardenLower, floors: [], walls: [], stairs: { ...baseStair, at, facing } }
    const upper: SceneSpec = {
      ...multistoreyGardenUpper,
      storeyFootprint: { kind: 'full' },
      walls: [],
      stairwellBounds: bounds,
      circulation: undefined,
    }
    const pair = validateStoreyPair(resolveScene(lower, 6), resolveScene(upper, 6))
    expect(pair.map(issue => issue.code)).not.toContain('stair-slab-blocked')
    expect(pair.map(issue => issue.code)).not.toContain('stairwell-size-mismatch')
  })

  it('rejects a void whose edge does not meet the real stair head', () => {
    const upper: SceneSpec = {
      ...multistoreyGardenUpper,
      stairwellBounds: [
        gardenStairwellBounds[0], gardenStairwellBounds[1],
        gardenStairwellBounds[2] + 0.2, gardenStairwellBounds[3],
      ],
    }
    expect(validateStoreyPair(resolveScene(multistoreyGardenLower, 6), resolveScene(upper, 6))
      .map(issue => issue.code)).toContain('stair-slab-blocked')
  })

  it('rejects narrow, blocked and disconnected circulation rectangles', () => {
    const narrow: SceneSpec = {
      ...multistoreyGardenUpper,
      circulation: { ...multistoreyGardenUpper.circulation!, landing: [3.1, 0, 3.5, 1.15] },
    }
    const blocked: SceneSpec = {
      ...multistoreyGardenUpper,
      furniture: [{ id: 'landing-blocker', model: 'chair', at: [3.6, 1] }],
    }
    const disconnected: SceneSpec = {
      ...multistoreyGardenUpper,
      circulation: {
        ...multistoreyGardenUpper.circulation!,
        roomAccessTargets: [{ id: 'isolated', bounds: [0, 5, 0.5, 5.5] }],
      },
    }
    expect(hardCodes(narrow)).toContain('circulation-too-narrow')
    expect(hardCodes(blocked)).toContain('circulation-blocked')
    expect(hardCodes(disconnected)).toContain('circulation-disconnected')
  })

  it('permits a circulation endpoint through a real door gap but rejects a closed wall crossing', () => {
    const wall = { id: 'door-wall', from: [2, 4], to: [4, 4], openings: [{ at: 3.5, width: 0.8, kind: 'open' as const }] }
    const circulation = {
      landing: multistoreyGardenUpper.circulation!.landing,
      halls: [{ id: 'door-route', bounds: [3.1, 1.15, 3.9, 4.5] as PlanRect }],
      roomAccessTargets: [{ id: 'room-beyond-door', bounds: [3.1, 4, 3.9, 4.5] as PlanRect }],
    }
    const throughGap: SceneSpec = { ...multistoreyGardenUpper, circulation, walls: [...multistoreyGardenUpper.walls, wall] }
    const closed: SceneSpec = { ...throughGap, walls: [...multistoreyGardenUpper.walls, { ...wall, openings: [] }] }
    expect(hardCodes(throughGap)).not.toContain('circulation-blocked')
    expect(hardCodes(closed)).toContain('circulation-blocked')
  })

  it('rejects a pinched connection between otherwise wide circulation rectangles', () => {
    const spec: SceneSpec = {
      puzzleId: 'pinched-circulation',
      floor: 1,
      storeyFootprint: { kind: 'full' },
      walls: [],
      furniture: [],
      circulation: {
        landing: [1, 1, 3, 2],
        halls: [{ id: 'wide-hall', bounds: [2.99, 2, 3.99, 4] }],
        roomAccessTargets: [],
      },
    }
    expect(hardCodes(spec)).toContain('circulation-disconnected')
  })

  it('accepts a shallow room approach with 0.600 world units along the doorway seam', () => {
    const spec: SceneSpec = {
      puzzleId: 'door-approach',
      floor: 1,
      storeyFootprint: { kind: 'full' },
      walls: [],
      furniture: [],
      circulation: {
        landing: [1, 1, 3, 2],
        halls: [{ id: 'hall', bounds: [1, 2, 3, 3] }],
        roomAccessTargets: [{ id: 'door', bounds: [1.2, 2.9, 1.95, 3.01] }],
      },
    }
    expect(hardCodes(spec)).not.toContain('circulation-disconnected')
    expect(hardCodes(spec)).not.toContain('circulation-too-narrow')
  })
})
