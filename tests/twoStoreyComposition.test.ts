import { describe, expect, it } from 'vitest'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { hard1 } from '../src/data/cases/hard-1'
import { resolveScene } from '../src/scene3d/resolve'
import { CELL, makeStoreyFrame } from '../src/scene3d/units'
import { twoStoreyReferenceGround as ground } from '../src/scene3d/scenes/two-storey-reference-ground'
import { twoStoreyReferenceUpper as upper } from '../src/scene3d/scenes/two-storey-reference-upper'
import { validateScene, validateStoreyPair } from '../src/scene3d/validate'

const puzzle = buildAuthoredPuzzle(hard1, 'reference')
const lower = resolveScene(ground, 8)
const higher = resolveScene(upper, 8)

const errors = (scene: typeof lower) => validateScene(scene, puzzle).filter(issue => issue.severity === 'error')

const overlapsPlanRect = (box: { min: [number, number, number]; max: [number, number, number] }, bounds: [number, number, number, number]) => (
  box.min[0] < bounds[2] * CELL && box.max[0] > bounds[0] * CELL
  && box.min[2] < bounds[3] * CELL && box.max[2] > bounds[1] * CELL
)

const planRectsConnect = (a: [number, number, number, number], b: [number, number, number, number]) => {
  const xOverlap = Math.min(a[2], b[2]) - Math.max(a[0], b[0])
  const zOverlap = Math.min(a[3], b[3]) - Math.max(a[1], b[1])
  return (xOverlap > 1e-6 && Math.abs(a[3] - b[1]) <= 1e-6)
    || (zOverlap > 1e-6 && Math.abs(a[2] - b[0]) <= 1e-6)
    || (xOverlap > 1e-6 && zOverlap > 1e-6)
}

describe('two-storey reference composition', () => {
  it('protects the well edge beside the arrival without narrowing the flight exit', () => {
    const stair = lower.objects.find(object => object.kind === 'stairs')!
    const guard = higher.walls.find(wall => wall.id === 'study-west')!
    expect(guard.from[1]).toBeGreaterThan(stair.footprint.maxZ)
    expect(guard.from[1] - stair.footprint.maxZ).toBeLessThan(0.05)
    expect(guard.to[1]).toBeGreaterThan(higher.stairwellBounds![3] * CELL)
    expect(validateStoreyPair(lower, higher).filter(issue => issue.severity === 'error')).toEqual([])
  })

  it('keeps placement positions visible in both actual storey views', () => {
    for (const floor of [0, 1] as const) for (const view of ['ghost', 'exploded'] as const) {
      const scene = { ...(floor === 0 ? lower : higher), frame: makeStoreyFrame(8, floor, view) }
      expect(validateScene(scene, puzzle).filter(issue => issue.code === 'cell-hidden')).toEqual([])
    }
  })

  it('keeps a full upper footprint and a fractional well around the measured flight', () => {
    const stair = lower.objects.find(object => object.kind === 'stairs')!
    const well = higher.stairwellBounds!
    expect(stair.facing).toBe('E')
    expect(ground.storeyFootprint).toEqual({ kind: 'full' })
    expect(upper.storeyFootprint).toEqual({ kind: 'full' })
    expect(well[0]).toBeLessThan(stair.box.min[0] / CELL)
    expect(well[2]).toBeGreaterThanOrEqual(stair.box.max[0] / CELL)
    expect(well[1]).toBeLessThan(stair.box.min[2] / CELL)
    expect(well[3]).toBeGreaterThan(stair.box.max[2] / CELL)
    const row = Math.floor(stair.position[2] / CELL), col = Math.floor(stair.box.max[0] / CELL)
    const room = puzzle.rooms.find(room => room.id === puzzle.roomOfByFloor![1][row][col])!
    expect(room.name).toBe('Study')
    expect(validateStoreyPair(lower, higher).filter(issue => issue.severity === 'error')).toEqual([])
  })

  it('keeps bedroom furnishings and solution off the open void', () => {
    const well = higher.stairwellBounds!
    for (const cell of Object.values(puzzle.solution)) {
      if (cell.floor !== 1) continue
      expect(cell.col + 1 <= well[0] || cell.col >= well[2] || cell.row + 1 <= well[1] || cell.row >= well[3]).toBe(true)
    }
    for (const object of higher.objects.filter(object => object.kind === 'rug' || object.logic)) {
      expect(overlapsPlanRect(object.box, well), object.id).toBe(false)
    }
    expect(errors(higher)).toEqual([])
  })

  it('declares a connected arrival, corridor and room approaches around the furniture groups', () => {
    const circulation = upper.circulation!
    expect(circulation.landing[0]).toBeGreaterThanOrEqual(upper.stairwellBounds![2])
    const eastCorridor = circulation.halls.find(hall => hall.id === 'east-corridor')!
    expect(planRectsConnect(circulation.landing, eastCorridor.bounds)).toBe(true)
    const transverseHall = circulation.halls.find(hall => hall.id === 'transverse-hall')!
    expect(planRectsConnect(eastCorridor.bounds, transverseHall.bounds)).toBe(true)
    expect(circulation.roomAccessTargets.map(target => target.id).sort()).toEqual(['bathroom-door', 'bedroom-door', 'reading-approach', 'study-door'])
    expect(errors(higher)).toEqual([])
  })

  it('anchors the bed, desk and bathroom to real walls and gives the bathroom a distinct finish', () => {
    for (const id of ['bed', 'study-desk']) expect(higher.objects.find(object => object.id === id)?.againstWall).toBeTruthy()
    expect(higher.objects.find(object => object.id === 'bathroom-basin')?.againstWall).toBe('bathroom-north')
    expect(higher.floorMaterial[6][1]).toBe('tile')
  })
})
