import { describe, expect, it } from 'vitest'
import { getPuzzleById, initCatalog } from '../src/core/catalog'
import { exteriorSupportMembers } from '../src/scene3d/exteriorSupport'
import { resolveScene } from '../src/scene3d/resolve'
import { cellSightBlockers, seeThroughOccluders } from '../src/scene3d/sightlines'
import type { SceneSpec } from '../src/scene3d/schema'
import { CELL, TERRAIN_DROP } from '../src/scene3d/units'
import { validateScene, validateStoreyPair } from '../src/scene3d/validate'
import { multistoreyGardenLower, multistoreyGardenUpper } from './fixtures/multistoreyGarden'
import { aNameInPencilGround } from '../src/scene3d/scenes/a-name-in-pencil-ground'
import { aStoryRehearsedGround } from '../src/scene3d/scenes/a-story-rehearsed-ground'
import { AUTHORED_SCENES } from '../src/scene3d/scenes'

const supportBays = [
  { id: 'garden-bay-north', cells: [4, 0, 5, 2] as [number, number, number, number] },
  { id: 'garden-bay-south', cells: [4, 3, 5, 5] as [number, number, number, number] },
]

const upperOverGarden: SceneSpec = {
  ...multistoreyGardenUpper,
  storeyFootprint: { kind: 'cell-rects', rects: [[0, 0, 5, 5]] },
  walls: [],
}

const errorCodes = (lower: SceneSpec, upper: SceneSpec) =>
  validateStoreyPair(resolveScene(lower, 6), resolveScene(upper, 6))
    .filter(issue => issue.severity === 'error')
    .map(issue => issue.code)

const boxesOverlap = (
  a: { min: [number, number, number]; max: [number, number, number] },
  b: { min: [number, number, number]; max: [number, number, number] },
) => a.min[0] < b.max[0] && b.min[0] < a.max[0]
  && a.min[1] < b.max[1] && b.min[1] < a.max[1]
  && a.min[2] < b.max[2] && b.min[2] < a.max[2]

describe('exterior structural support', () => {
  it('rejects upper interior over bare garden ground', () => {
    expect(errorCodes(multistoreyGardenLower, upperOverGarden)).toContain('upper-floor-unsupported')
  })

  it('accepts grounded post-and-beam bays over exterior ground', () => {
    const lower: SceneSpec = { ...multistoreyGardenLower, exteriorSupportBays: supportBays }
    expect(errorCodes(lower, upperOverGarden)).toEqual([])
  })

  it('rejects unsupported cantilever cells beyond the declared frame', () => {
    const lower: SceneSpec = {
      ...multistoreyGardenLower,
      exteriorSupportBays: [supportBays[0]],
    }
    expect(errorCodes(lower, upperOverGarden)).toContain('upper-floor-unsupported')
  })

  it('rejects a support bay whose post foundations have no ground beneath them', () => {
    const lower: SceneSpec = {
      ...multistoreyGardenLower,
      storeyFootprint: { kind: 'cell-rects', rects: [[0, 0, 3, 5]] },
      exteriorSupportBays: supportBays,
    }
    expect(errorCodes(lower, upperOverGarden)).toContain('exterior-support-ground-missing')
  })

  it('rejects support over cells declared as indoor floor', () => {
    const lower: SceneSpec = {
      ...multistoreyGardenLower,
      floors: [{ ...multistoreyGardenLower.floors![0], kind: 'interior' }],
      exteriorSupportBays: supportBays,
    }
    expect(errorCodes(lower, upperOverGarden)).toContain('exterior-support-zone-mismatch')
  })

  it('rejects a support bay that does not carry any upper floor', () => {
    const lower: SceneSpec = { ...multistoreyGardenLower, exteriorSupportBays: supportBays }
    expect(errorCodes(lower, multistoreyGardenUpper)).toContain('exterior-support-orphan')
  })

  it('rejects structural members that cross the upper stair opening', () => {
    const lower: SceneSpec = { ...multistoreyGardenLower, exteriorSupportBays: supportBays }
    const upper: SceneSpec = { ...upperOverGarden, stairwellBounds: [4, 0, 4.5, 0.5] }
    expect(errorCodes(lower, upper)).toContain('exterior-support-upper-mismatch')
  })

  it.each([
    ['overspan', { id: 'overspan-bay', cells: [4, 0, 5, 5] }],
    ['fractional bounds', { id: 'fractional-bay', cells: [4.5, 0, 5, 2] }],
    ['overlapping bays', [supportBays[0], { id: 'overlap-bay', cells: [4, 2, 5, 4] }]],
    ['navigation metadata', { id: 'navigable-bay', cells: [4, 0, 5, 2], navigable: true }],
  ])('rejects malformed support bay geometry: %s', (_label, bay) => {
    const bays = Array.isArray(bay) ? bay as never : [bay as never]
    const lower: SceneSpec = { ...multistoreyGardenLower, exteriorSupportBays: bays }
    expect(validateScene(resolveScene(lower, 6)).map(issue => issue.code)).toContain('exterior-support-invalid')
  })

  it('rejects support bays declared on an upper storey', () => {
    const upper: SceneSpec = { ...multistoreyGardenUpper, exteriorSupportBays: supportBays as never }
    expect(validateScene(resolveScene(upper, 6)).map(issue => issue.code)).toContain('exterior-support-invalid')
  })

  it('derives grounded posts, connected perimeter beams and joists deterministically', () => {
    const lower = resolveScene({
      ...multistoreyGardenLower,
      exteriorSupportBays: supportBays,
    }, 6)
    const members = exteriorSupportMembers(lower)
    const columns = members.filter(member => member.kind === 'column')
    const perimeterBeams = members.filter(member => member.kind === 'perimeter-beam')
    const joists = members.filter(member => member.kind === 'joist')

    expect(members).toEqual(exteriorSupportMembers(resolveScene({
      ...multistoreyGardenLower,
      exteriorSupportBays: supportBays,
    }, 6)))
    expect(columns).toHaveLength(6)
    expect(perimeterBeams.length).toBeGreaterThan(0)
    expect(joists.length).toBeGreaterThan(0)
    for (const post of columns) {
      expect(post.box.min[1]).toBe(-TERRAIN_DROP)
      expect(post.box.max[1]).toBeGreaterThan(post.box.min[1])
      expect(post.box.min[0]).toBeGreaterThanOrEqual(4 * CELL)
      expect(post.box.max[0]).toBeLessThanOrEqual(6 * CELL)
      expect(post.box.min[2]).toBeGreaterThanOrEqual(0)
      expect(post.box.max[2]).toBeLessThanOrEqual(6 * CELL)
      expect(perimeterBeams.filter(beam => boxesOverlap(post.box, beam.box)).length).toBeGreaterThanOrEqual(2)
    }
    for (const beam of perimeterBeams) {
      expect(columns.some(post => boxesOverlap(post.box, beam.box))).toBe(true)
    }
    for (const joist of joists) {
      expect(perimeterBeams.filter(beam => boxesOverlap(joist.box, beam.box)).length).toBe(2)
    }
  })

  it('keeps diagonally touching support bays on independent grounded columns', () => {
    const diagonalBays = [
      { id: 'north-west-bay', cells: [4, 0, 4, 0] as [number, number, number, number] },
      { id: 'south-east-bay', cells: [5, 1, 5, 1] as [number, number, number, number] },
    ]
    const lower = resolveScene({ ...multistoreyGardenLower, exteriorSupportBays: diagonalBays }, 6)
    const members = exteriorSupportMembers(lower)
    const cornerPosts = members.filter(member => member.kind === 'column' && member.id.startsWith('column:5,1'))
    expect(cornerPosts).toHaveLength(2)
    for (const bayId of ['north-west-bay', 'south-east-bay']) {
      const beams = members.filter(member => member.kind === 'perimeter-beam' && member.id.startsWith('perimeter:' + bayId + ':'))
      expect(cornerPosts.filter(post => beams.filter(beam => boxesOverlap(post.box, beam.box)).length >= 2)).toHaveLength(1)
    }
  })

  it('rejects a support column that obstructs exterior furniture', () => {
    const lower: SceneSpec = {
      ...multistoreyGardenLower,
      exteriorSupportBays: [supportBays[0]],
      furniture: [{ id: 'garden-column-obstruction', model: 'flower_redA', at: [5.9125, 0.0875] }],
    }
    expect(validateScene(resolveScene(lower, 6)).map(issue => issue.code)).toContain('exterior-support-collision')
  })

  it('rejects support members that obstruct the lower-storey stair flight', () => {
    const lower: SceneSpec = {
      ...multistoreyGardenLower,
      stairs: { model: 'stairsOpen', at: [3.9, 0.6], facing: 'E' },
      exteriorSupportBays: [{ id: 'stair-overlap-bay', cells: [4, 0, 4, 2] }],
    }
    expect(validateScene(resolveScene(lower, 6)).map(issue => issue.code)).toContain('exterior-support-collision')
  })
  it('keeps exterior ground separate from the support frame and upper slab', () => {
    const baselineLower = resolveScene(multistoreyGardenLower, 6)
    const supportedLower = resolveScene({
      ...multistoreyGardenLower,
      exteriorSupportBays: supportBays,
    }, 6)
    const baselineUpper = resolveScene(upperOverGarden, 6)
    const supportedUpper = resolveScene(upperOverGarden, 6)

    expect(supportedLower.floorPresent).toEqual(baselineLower.floorPresent)
    expect(supportedLower.zoneKind).toEqual(baselineLower.zoneKind)
    expect(supportedLower.floorY).toEqual(baselineLower.floorY)
    expect(supportedLower.objects).toEqual(baselineLower.objects)
    expect(supportedLower.zoneKind[2][4]).toBe('exterior')
    expect(supportedUpper.floorPresent).toEqual(baselineUpper.floorPresent)
    expect(supportedUpper.zoneKind).toEqual(baselineUpper.zoneKind)
  })

  it('finds the grounded support columns on cell sightlines and draws them see-through', () => {
    const cases = [[aNameInPencilGround, 8, '4,2'], [aStoryRehearsedGround, 8, '4,4']] as const
    for (const [spec, size, cell] of cases) {
      const scene = resolveScene(spec, size)
      const [row, col] = cell.split(',').map(Number)
      const crossed = cellSightBlockers(scene).find(entry => entry.row === row && entry.col === col)
      expect(crossed?.supports.length, `${cell} is crossed by a support column`).toBeGreaterThan(0)
      const seeThrough = seeThroughOccluders(scene)
      for (const id of crossed!.supports) expect(seeThrough.supports.has(id), id).toBe(true)
      // drawn see-through, so the cell is not reported hidden
      expect(validateScene(scene).filter(issue => issue.code === 'cell-hidden')).toEqual([])
    }
  })

  it('keeps supported exterior routes and solved cells clear in the five production houses', () => {
    initCatalog()
    for (const puzzleId of ['hard-5', 'hard-6', 'hard-8', 'hard-9', 'hard-10']) {
      const puzzle = getPuzzleById(puzzleId)!
      const lower = resolveScene(AUTHORED_SCENES[`${puzzleId}#0`]!, puzzle.size)
      const issues = validateScene(lower, puzzle)
      expect(issues.filter(issue => issue.code === 'room-unreachable'), puzzleId).toEqual([])
      expect(issues.filter(issue => issue.code === 'exterior-support-solution-clearance'), puzzleId).toEqual([])
    }
  })
})
