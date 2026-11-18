import type { Puzzle } from '../../core/types'
import { furnitureFootprint } from '../../core/types'
import { DEFAULT_MODEL, metaOf } from '../catalog'
import type { Facing, FurnitureSpec, SceneSpec } from '../schema'

// ============================================================================
// PROCEDURAL FALLBACK — a house for a case that has no authored scene yet.
//
// It is deliberately plain: the shell, one Kenney model per logical
// furnishing standing at its footprint centre, rugs on the floor. No
// partitions, because walls derived from the room grid are exactly the
// "architecture visibly derived from the Murdoku grid" failure. A fallback
// scene is playable and honest; it is not the product. Authored scenes
// replace it case by case (see docs/SCENE_MIGRATION_PLAN.md).
// ============================================================================

const ROT_FACING: Record<number, Facing> = { 0: 'S', 90: 'E', 180: 'N', 270: 'W' }

export function fallbackScene(puzzle: Puzzle, floor: number): SceneSpec {
  const furniture: FurnitureSpec[] = []
  const rugs: NonNullable<SceneSpec['rugs']> = []
  puzzle.furniture.filter(f => (f.floor ?? 0) === floor).forEach((f, i) => {
    const { w, h } = furnitureFootprint(f)
    const at: [number, number] = [f.col + w / 2, f.row + h / 2]
    const logic = `${f.type}@${f.row},${f.col}`
    const model = DEFAULT_MODEL[f.type]
    const facing = ROT_FACING[f.rotation ?? 0] ?? 'S'
    const meta = metaOf(model)
    if (meta.support === 'flat') { rugs.push({ id: `rug-${i}`, model, at, facing }); return }
    // a tall model may not show its back to the camera; turn it to face S
    const safeFacing: Facing = meta.tall && (facing === 'N' || facing === 'W') ? 'S' : facing
    furniture.push({ id: `${f.type}-${i}`, model, logic, at, facing: safeFacing })
  })
  return { puzzleId: puzzle.id, floor, walls: [], furniture, rugs }
}
