import type { FurnitureType, Puzzle } from '../core/types'
import { metaOf } from './catalog'
import type { SceneSpec } from './schema'

/**
 * Drops decorative props that look like a clue target.
 *
 * A clue such as "On the table." or "Beside a chair." refers to the logical
 * furniture only. An authored scene that also draws an unlinked coffee table
 * or a spare dining chair shows the player a second "table" or "chair" the
 * clue does not mean, which contradicts the wording (R1 gate finding A1).
 * Any prop without a `logic` link whose model can represent a furniture type
 * this puzzle uses is removed, together with everything resting on it.
 * Props of types the puzzle never uses stay: no clue can name them. A stand
 * that carries a logical piece (the side table under a logical clock) stays
 * too: it shares that piece's cell and reads as part of it.
 */
export function withoutLookalikes(spec: SceneSpec, puzzle: Puzzle): SceneSpec {
  const used = new Set<FurnitureType>(puzzle.furniture.map(f => f.type))
  const looksLikeClueTarget = (model: Parameters<typeof metaOf>[0]) =>
    (metaOf(model).represents ?? []).some(t => used.has(t))

  const dropped = new Set<string>()
  for (const f of spec.furniture) {
    if (!f.logic && looksLikeClueTarget(f.model)) dropped.add(f.id)
  }
  // A logical piece resting on a decorative one keeps its support.
  const byId = new Map(spec.furniture.map(f => [f.id, f]))
  for (const f of spec.furniture) {
    if (!f.logic) continue
    for (let p = f.on && byId.get(f.on.parent); p; p = p.on && byId.get(p.on.parent)) dropped.delete(p.id)
  }
  // Children sit on a parent's surface; without the parent they would float.
  let grew = true
  while (grew) {
    grew = false
    for (const f of spec.furniture) {
      if (!dropped.has(f.id) && f.on && dropped.has(f.on.parent)) { dropped.add(f.id); grew = true }
    }
  }

  const rugs = spec.rugs?.filter(r => !looksLikeClueTarget(r.model))
  if (!dropped.size && rugs?.length === spec.rugs?.length) return spec
  return { ...spec, furniture: spec.furniture.filter(f => !dropped.has(f.id)), rugs }
}
