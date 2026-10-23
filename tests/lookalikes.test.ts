import { describe, expect, it } from 'vitest'
import { getAllPuzzles, initCatalog } from '../src/core/catalog'
import { metaOf } from '../src/scene3d/catalog'
import { withoutLookalikes } from '../src/scene3d/lookalikes'
import { resolveScene } from '../src/scene3d/resolve'
import { sceneFor } from '../src/scene3d/scenes'
import { validateScene } from '../src/scene3d/validate'

// R1 gate finding A1: decorative props that look like a clue target ("the
// table" next to an unlinked coffee table) contradict the clue wording.
describe('withoutLookalikes', () => {
  initCatalog()
  const puzzles = getAllPuzzles()
  const storeys = puzzles.flatMap(p => Array.from({ length: p.floors ?? 1 }, (_, floor) => ({ p, floor })))

  it('leaves no unlinked prop that could stand for a furniture type the puzzle uses', () => {
    const offenders: string[] = []
    for (const { p, floor } of storeys) {
      const used = new Set(p.furniture.map(f => f.type))
      const spec = withoutLookalikes(sceneFor(p, floor), p)
      // A stand that carries a logical piece (the table under a logical clock)
      // shares that piece's cell and reads as part of it, so it may stay.
      const supports = new Set(spec.furniture.filter(f => f.logic && f.on).map(f => f.on!.parent))
      for (const f of spec.furniture) {
        if (!f.logic && !supports.has(f.id) && (metaOf(f.model).represents ?? []).some(t => used.has(t))) offenders.push(`${p.id}#${floor} ${f.id}`)
      }
      for (const r of spec.rugs ?? []) {
        if ((metaOf(r.model).represents ?? []).some(t => used.has(t))) offenders.push(`${p.id}#${floor} rug ${r.id}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps every logical piece and adds no validation error', () => {
    for (const { p, floor } of storeys) {
      const before = sceneFor(p, floor)
      const after = withoutLookalikes(before, p)
      expect(after.furniture.filter(f => f.logic).map(f => f.id)).toEqual(before.furniture.filter(f => f.logic).map(f => f.id))
      const errors = (s: typeof before) => validateScene(resolveScene(s, p.size), p).filter(v => v.severity === 'error').map(v => `${v.code}|${v.subject}`)
      const added = errors(after).filter(e => !errors(before).includes(e))
      expect(added, `${p.id}#${floor}`).toEqual([])
    }
  })
})
