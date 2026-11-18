import { describe, expect, it } from 'vitest'
import { railingPieces } from '../src/scene3d/railingGeometry'
import { resolveScene, type Box3 } from '../src/scene3d/resolve'
import { validateScene } from '../src/scene3d/validate'

describe('open physical guards', () => {
  it.each(['x', 'z'] as const)('keeps posts and a continuous handrail inside the %s barrier', axis => {
    const box: Box3 = axis === 'x' ? { min: [1, 0, 2], max: [3, 0.35, 2.08] }
      : { min: [1, 0, 2], max: [1.08, 0.35, 4] }
    const pieces = railingPieces(box, axis)
    const coordinate = axis === 'x' ? 0 : 2
    const rail = pieces[0]
    expect(rail.min[coordinate]).toBe(box.min[coordinate])
    expect(rail.max[coordinate]).toBe(box.max[coordinate])
    expect(rail.max[1] - rail.min[1]).toBeCloseTo(0.04)
    for (const piece of pieces) for (const i of [0, 1, 2]) {
      expect(piece.min[i]).toBeGreaterThanOrEqual(box.min[i])
      expect(piece.max[i]).toBeLessThanOrEqual(box.max[i])
      expect(piece.max[i]).toBeGreaterThan(piece.min[i])
    }
    const posts = pieces.slice(1)
    expect(posts[0].min[coordinate]).toBe(box.min[coordinate])
    expect(posts.at(-1)!.max[coordinate]).toBe(box.max[coordinate])
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].min[coordinate] - posts[i - 1].max[coordinate]).toBeGreaterThan(0.1)
      expect(posts[i].min[coordinate] - posts[i - 1].min[coordinate]).toBeLessThanOrEqual(0.18 + 1e-8)
    }
  })

  it('does not invert geometry on a short or low segment', () => {
    const pieces = railingPieces({ min: [0, 0, 0], max: [0.01, 0.02, 0.08] }, 'x')
    for (const piece of pieces) for (const i of [0, 1, 2]) expect(piece.max[i]).toBeGreaterThan(piece.min[i])
  })

  it('keeps an open guard impassable to furniture and a declared route', () => {
    const scene = resolveScene({
      puzzleId: 'guard-barrier',
      walls: [{ id: 'guard', from: [2, 1], to: [2, 5], height: 'half', treatment: 'railing', freeEnds: ['from', 'to'] }],
      furniture: [{ id: 'chair', model: 'chair', at: [2, 2] }],
      circulation: { landing: [1, 3, 3, 4], halls: [], roomAccessTargets: [] },
    }, 6)
    const guard = scene.walls.find(wall => wall.id === 'guard')!
    expect(guard.pieces).toHaveLength(1)
    expect(guard.visualPieces!.length).toBeGreaterThan(10)
    const issues = validateScene(scene)
    expect(issues.some(issue => issue.code === 'wall-penetration' && issue.subject === 'chair')).toBe(true)
    expect(issues.some(issue => issue.code === 'circulation-blocked')).toBe(true)
  })
})
