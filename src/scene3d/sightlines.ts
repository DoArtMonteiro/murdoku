// ============================================================================
// CELL SIGHTLINES — what stands between the camera and a playable cell.
//
// The board is a puzzle first: every playable cell of the ACTIVE storey must
// stay readable. A suspect stands on a cell with a portrait badge at chest
// height, so the test is a ray from that badge towards the camera.
//
//   - Walls are never softened: an authored wall that hides a cell is a
//     scene-authoring defect and `validateScene` reports it.
//   - Free-standing solids (stairs, a fridge, a lamp, a shower) and the
//     exterior support posts that carry an overhanging upper storey are
//     SEE-THROUGH occluders: the renderer draws any of them that really
//     crosses a cell's sightline at SEE_THROUGH_OPACITY, so the floor, the
//     standee and the highlight behind them stay legible. Because the renderer
//     and the validator both ask this module, what is checked is what is drawn.
//
// This file owns no three.js and no DOM, so the renderer, the validator and
// the tests agree on a single definition.
// ============================================================================

import type { Vec3 } from './units'
import type { Box3, ResolvedObject, ResolvedScene } from './resolve'
import { exteriorSupportMembers } from './exteriorSupport'
import { worldRectCoveredByFloor } from './floorGeometry'
import { resolvedObjectVisibilityBoxes } from './stairVisibility'

/** Opacity of a solid that crosses a playable cell's sightline. */
export const SEE_THROUGH_OPACITY = 0.3
/** Height of a suspect's portrait badge above its cell floor. */
export const BADGE_HEIGHT = 0.45

/** Ray/AABB slab test. Returns the entry distance or null. */
export function rayHitsBox(origin: Vec3, dir: Vec3, box: Box3): number | null {
  let tmin = 0, tmax = Infinity
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-9) {
      if (origin[i] < box.min[i] || origin[i] > box.max[i]) return null
    } else {
      let t1 = (box.min[i] - origin[i]) / dir[i], t2 = (box.max[i] - origin[i]) / dir[i]
      if (t1 > t2) [t1, t2] = [t2, t1]
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2)
      if (tmin > tmax) return null
    }
  }
  return tmin > 1e-6 ? tmin : null
}

/** Furniture and stairs that occupy floor space (not wall or surface props). */
export const solidObject = (o: ResolvedObject) =>
  (o.kind === 'furniture' || o.kind === 'stairs') && o.meta.support !== 'flat' && o.meta.support !== 'wall'

export interface CellBlockers {
  row: number
  col: number
  walls: string[]
  objects: string[]
  supports: string[]
}

/** Every playable cell whose badge-height sightline to the camera is crossed. */
export function cellSightBlockers(scene: ResolvedScene): CellBlockers[] {
  const dir = scene.frame.cameraDirection
  const walls = scene.walls.filter(w => w.kind !== 'foundation')
    .flatMap(wall => (wall.visualPieces ?? wall.pieces).map(box => ({ wall, box })))
  const solids = scene.objects.filter(o => (o.kind === 'furniture' || o.kind === 'stairs') && solidObject(o))
  const columns = exteriorSupportMembers(scene).filter(member => member.kind === 'column')
  const found: CellBlockers[] = []
  for (let r = 0; r < scene.n; r++) for (let c = 0; c < scene.n; c++) {
    const p = scene.frame.cellCentre(r, c, scene.floorY[r][c])
    if (!worldRectCoveredByFloor(scene, { minX: p[0] - 0.001, maxX: p[0] + 0.001, minZ: p[2] - 0.001, maxZ: p[2] + 0.001 })) continue
    const occupant = solids.find(o => !o.parentId && p[0] > o.footprint.minX && p[0] < o.footprint.maxX
      && p[2] > o.footprint.minZ && p[2] < o.footprint.maxZ)
    const badge: Vec3 = [p[0], p[1] + BADGE_HEIGHT, p[2]]
    const blockers: CellBlockers = {
      row: r, col: c,
      walls: walls.filter(({ box }) => rayHitsBox(badge, dir, box) !== null).map(({ wall }) => wall.id),
      objects: solids.filter(object => object !== occupant && !object.parentId
        && resolvedObjectVisibilityBoxes(object).some(box => rayHitsBox(badge, dir, box) !== null)).map(object => object.id),
      supports: columns.filter(({ box }) => rayHitsBox(badge, dir, box) !== null).map(member => member.id),
    }
    if (blockers.walls.length || blockers.objects.length || blockers.supports.length) found.push(blockers)
  }
  return found
}

export interface SeeThroughOccluders {
  /** Object ids drawn at SEE_THROUGH_OPACITY, children of those included. */
  objects: ReadonlySet<string>
  /** Exterior support members drawn at SEE_THROUGH_OPACITY. */
  supports: ReadonlySet<string>
}

/**
 * The solids the renderer draws translucent so that no playable cell of this
 * storey is hidden. Exterior support posts are always translucent on the
 * active storey (they are structure, not scenery); other solids only when they
 * really cross a cell's sightline.
 */
export function seeThroughOccluders(scene: ResolvedScene): SeeThroughOccluders {
  const objects = new Set<string>()
  const supports = new Set<string>(
    exteriorSupportMembers(scene).filter(member => member.kind === 'column').map(member => member.id))
  for (const cell of cellSightBlockers(scene)) for (const id of cell.objects) objects.add(id)
  // Props resting on a see-through piece must not float above it as opaque.
  let grew = true
  while (grew) {
    grew = false
    for (const o of scene.objects) {
      if (o.parentId && objects.has(o.parentId) && !objects.has(o.id)) { objects.add(o.id); grew = true }
    }
  }
  return { objects, supports }
}
