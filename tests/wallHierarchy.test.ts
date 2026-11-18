import { describe, expect, it } from 'vitest'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { hard1 } from '../src/data/cases/hard-1'
import type { SceneSpec } from '../src/scene3d/schema'
import { resolveScene, type ResolvedScene } from '../src/scene3d/resolve'
import { twoStoreyReferenceGround as ground } from '../src/scene3d/scenes/two-storey-reference-ground'
import { twoStoreyReferenceUpper as upper } from '../src/scene3d/scenes/two-storey-reference-upper'
import { midnightDelivery } from '../src/scene3d/scenes/midnight-delivery'
import { theEmptyChair } from '../src/scene3d/scenes/the-empty-chair'
import { theLastNightcap } from '../src/scene3d/scenes/the-last-nightcap'
import {
  FULL_PARTITION_HEIGHT,
  HALF_HEIGHT,
  PARTITION_HEIGHT,
  ROOM_PARTITION_HEIGHT,
  WALL_HEIGHT,
  makeStoreyFrame,
} from '../src/scene3d/units'
import { validateScene } from '../src/scene3d/validate'

const puzzle = buildAuthoredPuzzle(hard1, 'reference')

const ROOM_CUTAWAY_IDS = ['office-west', 'reading-west'] as const
const CUTAWAY_IDS = ['bedroom-south', 'office-south', 'bathroom-east-entry', 'reading-north'] as const
const FULL_IDS = ['bedroom-east', 'bathroom-north', 'bathroom-east-private'] as const
const GUARD_IDS = ['study-west', 'stairwell-west', 'stairwell-south'] as const

function wallById(scene: ResolvedScene, id: string) {
  const wall = scene.walls.find(candidate => candidate.id === id)
  if (!wall) throw new Error(`missing wall ${id}`)
  return wall
}

function wallSnapshot(scene: ResolvedScene, omitRoomHeightAndPieces = false) {
  return scene.walls
    .filter(wall => wall.kind !== 'foundation')
    .map(wall => {
      const roomWall = (ROOM_CUTAWAY_IDS as readonly string[]).includes(wall.id)
      return {
        id: wall.id,
        kind: wall.kind,
        axis: wall.axis,
        from: wall.from,
        to: wall.to,
        ...(omitRoomHeightAndPieces && roomWall ? {} : { height: wall.height, pieces: wall.pieces }),
        thickness: wall.thickness,
        visualPieces: wall.visualPieces,
        openings: wall.openings,
        frames: wall.frames,
        declaredFreeEnds: wall.declaredFreeEnds,
      }
    })
}

function legacyHeight(height: string | undefined): 'low' | 'half' | 'full' | undefined {
  return height === 'room-cutaway' || height === 'cutaway' ? 'low' : height as 'low' | 'half' | 'full' | undefined
}

function legacyEquivalentUpper(): SceneSpec {
  return {
    ...upper,
    walls: upper.walls.map(wall => ({ ...wall, height: legacyHeight(wall.height as string | undefined) })),
  }
}

describe('residential V4 wall hierarchy', () => {
  it('uses the two new semantic classes only on their approved upper-storey walls', () => {
    const heights = Object.fromEntries(upper.walls.map(wall => [wall.id, wall.height]))

    expect(ROOM_CUTAWAY_IDS.map(id => heights[id])).toEqual(['room-cutaway', 'room-cutaway'])
    expect(CUTAWAY_IDS.map(id => heights[id])).toEqual(['cutaway', 'cutaway', 'cutaway', 'cutaway'])
    expect(Object.entries(heights)
      .filter(([, height]) => height === 'room-cutaway' || height === 'cutaway')
      .map(([id]) => id)
      .sort()).toEqual([...ROOM_CUTAWAY_IDS, ...CUTAWAY_IDS].sort())
  })

  it('keeps the canonical height values explicit and resolves each class correctly', () => {
    expect(FULL_PARTITION_HEIGHT).toBe(WALL_HEIGHT)
    expect(PARTITION_HEIGHT).toBeCloseTo(0.6, 8)
    expect(ROOM_PARTITION_HEIGHT).toBeCloseTo(0.8, 8)
    expect(HALF_HEIGHT).toBeCloseTo(0.35, 8)

    const scene = resolveScene(upper, 8)
    for (const id of ROOM_CUTAWAY_IDS) expect(wallById(scene, id).height).toBe(ROOM_PARTITION_HEIGHT)
    for (const id of CUTAWAY_IDS) expect(wallById(scene, id).height).toBe(PARTITION_HEIGHT)
    for (const id of FULL_IDS) expect(wallById(scene, id).height).toBe(FULL_PARTITION_HEIGHT)
    for (const id of GUARD_IDS) expect(wallById(scene, id).height).toBe(HALF_HEIGHT)
  })

  it('keeps shell, cuts, guards and openings equivalent to the legacy .6 layout', () => {
    const semantic = resolveScene(upper, 8)
    const legacy = resolveScene(legacyEquivalentUpper(), 8)

    expect(wallSnapshot(semantic, true)).toEqual(wallSnapshot(legacy, true))
  })

  it('keeps the legacy reference scenes on legacy height classes', () => {
    const legacyScenes = [
      { id: 'midnight-delivery', spec: midnightDelivery, size: 6 },
      { id: 'the-empty-chair', spec: theEmptyChair, size: 6 },
      { id: 'the-last-nightcap', spec: theLastNightcap, size: 7 },
    ]

    for (const { id, spec, size } of legacyScenes) {
      expect(spec.walls.some(wall => wall.height === 'room-cutaway' || wall.height === 'cutaway'), id).toBe(false)
      expect(resolveScene(spec, size).problems, id).toEqual([])
    }
  })

  it('keeps both storeys free of hidden cells and hard validation errors in each storey view', () => {
    const lower = resolveScene(ground, 8)
    const higher = resolveScene(upper, 8)

    for (const [floor, scene] of [[0, lower], [1, higher]] as const) {
      for (const view of ['ghost', 'exploded'] as const) {
        const framed = { ...scene, frame: makeStoreyFrame(8, floor, view) }
        const issues = validateScene(framed, puzzle)
        expect(issues.filter(issue => issue.severity === 'error'), `${floor}/${view}`).toEqual([])
        expect(issues.filter(issue => issue.code === 'cell-hidden'), `${floor}/${view}`).toEqual([])
      }
    }
  })
})
