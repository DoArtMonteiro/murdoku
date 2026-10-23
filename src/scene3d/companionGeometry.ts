import type { Box3, ResolvedScene, ResolvedWall } from './resolve'
import type { FloorMaterial } from './schema'
import { mergedFloorBoxes } from './floorGeometry'
import { CELL, type StoreyView } from './units'

type CompanionFloor = Pick<ResolvedScene, 'n' | 'floorY'> & Partial<Pick<ResolvedScene,
  'floorMaterial' | 'floorPresent' | 'stairwell' | 'stairwellBounds'>>

/**
 * Merge adjacent cells into continuous floor slabs for the companion storey.
 * Internal cell edges must not expose the hidden Murdoku grid; genuine height
 * changes and the stairwell remain physical boundaries.
 */
export function companionFloorBoxes(scene: CompanionFloor): Box3[] {
  const floorMaterial = scene.floorMaterial
    ?? Array.from({ length: scene.n }, () => Array<FloorMaterial>(scene.n).fill('wood'))
  const floorPresent = scene.floorPresent
    ?? Array.from({ length: scene.n }, () => Array<boolean>(scene.n).fill(true))
  const stairwellBounds = scene.stairwellBounds ?? (scene.stairwell
    ? [scene.stairwell[0], scene.stairwell[1], scene.stairwell[2] + 1, scene.stairwell[3] + 1] as const
    : undefined)
  return mergedFloorBoxes({ ...scene, floorMaterial, floorPresent, stairwellBounds })
}

type StairwellStorey = { stairwellBounds?: readonly [number, number, number, number] }
type WallStorey = { walls: ReadonlyArray<Pick<ResolvedWall, 'pieces' | 'visualPieces'>> }

/** Real lower-storey wall members visible through the active stairwell opening. */
export function companionWallBoxesThroughStairwell(
  active: StairwellStorey,
  companion: WallStorey,
  view: { mode: StoreyView; offsetY: number },
): Box3[] {
  if (view.mode !== 'ghost' || view.offsetY >= 0 || !active.stairwellBounds) return []
  const [x0, z0, x1, z1] = active.stairwellBounds.map(value => value * CELL)
  const boxes: Box3[] = []
  for (const wall of companion.walls) for (const piece of wall.visualPieces ?? wall.pieces) {
    const minX = Math.max(piece.min[0], x0)
    const maxX = Math.min(piece.max[0], x1)
    const minZ = Math.max(piece.min[2], z0)
    const maxZ = Math.min(piece.max[2], z1)
    if (maxX <= minX || maxZ <= minZ) continue
    boxes.push({
      min: [minX, piece.min[1], minZ],
      max: [maxX, piece.max[1], maxZ],
    })
  }
  return boxes
}
