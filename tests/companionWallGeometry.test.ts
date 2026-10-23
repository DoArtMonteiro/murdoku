import { describe, expect, it } from 'vitest'
import { companionWallBoxesThroughStairwell } from '../src/scene3d/companionGeometry'
import type { Box3, ResolvedWall } from '../src/scene3d/resolve'
import { CELL } from '../src/scene3d/units'

const box = (min: Box3['min'], max: Box3['max']): Box3 => ({ min, max })

const wall = (pieces: Box3[], visualPieces?: Box3[]): Pick<ResolvedWall, 'pieces' | 'visualPieces'> => ({
  pieces,
  visualPieces,
})

describe('companion walls visible through a stairwell', () => {
  it('returns geometry only for a lower ghost storey behind an active stairwell', () => {
    const active = { stairwellBounds: [1, 2, 3, 4] as const }
    const lower = { walls: [wall([box([0, 0, 0], [4, 2, 4])])] }

    expect(companionWallBoxesThroughStairwell(active, lower, { mode: 'exploded', offsetY: -2.8 })).toEqual([])
    expect(companionWallBoxesThroughStairwell(active, lower, { mode: 'ghost', offsetY: 0 })).toEqual([])
    expect(companionWallBoxesThroughStairwell(active, lower, { mode: 'ghost', offsetY: 2.8 })).toEqual([])
    expect(companionWallBoxesThroughStairwell({}, lower, { mode: 'ghost', offsetY: -2.8 })).toEqual([])
  })

  it('clips real wall pieces in XZ while retaining their original height and openings', () => {
    const active = { stairwellBounds: [1, 2, 3, 4] as const }
    const lower = {
      walls: [wall([
        box([0.4, 0.1, 2], [1.2, 1.7, 2.2]),
        box([1.8, 0.1, 2], [2.8, 1.7, 2.2]),
        box([3.2, 0.1, 2], [3.6, 1.7, 2.2]),
      ])],
    }

    expect(companionWallBoxesThroughStairwell(active, lower, { mode: 'ghost', offsetY: -2.8 })).toEqual([
      box([CELL, 0.1, 2], [1.2, 1.7, 2.2]),
      box([1.8, 0.1, 2], [3 * CELL, 1.7, 2.2]),
    ])
  })

  it('uses railing members instead of inventing the solid collision envelope', () => {
    const active = { stairwellBounds: [0, 0, 2, 2] as const }
    const solid = box([0, 0, 0.7], [1.6, 1, 0.9])
    const post = box([0.3, 0, 0.7], [0.34, 1, 0.9])
    const lower = { walls: [wall([solid], [post])] }

    expect(companionWallBoxesThroughStairwell(active, lower, { mode: 'ghost', offsetY: -2.8 })).toEqual([post])
  })
})
