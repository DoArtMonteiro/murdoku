import { describe, expect, it } from 'vitest'
import { getAllPuzzles, initCatalog } from '../src/core/catalog'
import { sceneFor } from '../src/scene3d/scenes'
import { withoutLookalikes } from '../src/scene3d/lookalikes'
import { resolveScene } from '../src/scene3d/resolve'
import { validateScene } from '../src/scene3d/validate'
import { makeStoreyFrame } from '../src/scene3d/units'
import { cellSightBlockers, seeThroughOccluders } from '../src/scene3d/sightlines'

initCatalog()

/** The scene exactly as IsoBoard builds it for a storey and view. */
function renderedScene(puzzleId: string, floor: 0 | 1, view: 'ghost' | 'exploded') {
  const puzzle = getAllPuzzles().find(p => p.id === puzzleId)!
  const raw = resolveScene(withoutLookalikes(sceneFor(puzzle, floor), puzzle), puzzle.size)
  const twoStorey = (puzzle.floors ?? 1) > 1
  return { puzzle, scene: twoStorey ? { ...raw, frame: makeStoreyFrame(puzzle.size, floor, view) } : raw }
}

describe('no playable cell is hidden on the active storey', () => {
  it('holds for every case, storey and storey view, as IsoBoard renders them', () => {
    const offenders: string[] = []
    for (const p of getAllPuzzles()) {
      const floors = (p.floors ?? 1) > 1 ? [0, 1] as const : [0] as const
      for (const floor of floors) for (const view of ['ghost', 'exploded'] as const) {
        const { scene } = renderedScene(p.id, floor, view)
        for (const issue of validateScene(scene, p).filter(v => v.code === 'cell-hidden')) {
          offenders.push(`${p.id}#${floor}@${view} ${issue.message}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('never lets an opaque wall hide a cell: walls are not see-through', () => {
    for (const p of getAllPuzzles()) for (const floor of ((p.floors ?? 1) > 1 ? [0, 1] : [0]) as Array<0 | 1>) {
      const { scene } = renderedScene(p.id, floor, 'ghost')
      expect(cellSightBlockers(scene).filter(cell => cell.walls.length), `${p.id}#${floor}`).toEqual([])
    }
  })

  it('draws every crossing solid and every support post see-through', () => {
    // hard-10 ground: eleven cells were hidden by posts and the stair before.
    const { scene } = renderedScene('hard-10', 0, 'ghost')
    const crossed = cellSightBlockers(scene)
    expect(crossed.length).toBeGreaterThan(0)
    const seeThrough = seeThroughOccluders(scene)
    for (const cell of crossed) {
      for (const id of cell.objects) expect(seeThrough.objects.has(id), `${cell.row},${cell.col} ${id}`).toBe(true)
      for (const id of cell.supports) expect(seeThrough.supports.has(id), `${cell.row},${cell.col} ${id}`).toBe(true)
    }
    expect([...seeThrough.objects].some(id => scene.objects.find(o => o.id === id)?.kind === 'stairs')).toBe(true)
  })

  it('leaves a scene with nothing in the way fully opaque', () => {
    const { scene } = renderedScene('very-easy-2', 0, 'ghost')
    const seeThrough = seeThroughOccluders(scene)
    expect(seeThrough.supports.size).toBe(0)
    expect(cellSightBlockers(scene)).toEqual([])
  })
})
