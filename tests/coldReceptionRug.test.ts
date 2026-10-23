import { describe, expect, it } from 'vitest'
import { aColdReception } from '../src/scene3d/scenes/a-cold-reception'
import { MODEL_BOUNDS } from '../src/scene3d/catalog.generated'
import { CELL } from '../src/scene3d/units'

describe('Cold Reception clue rug', () => {
  it('covers every logical rug cell centre with its native mesh footprint', () => {
    const rug = aColdReception.furniture.find(object => object.logic === 'rug@3,3')!
    const [width, , depth] = MODEL_BOUNDS[rug.model].size
    const [x, z] = rug.at!
    for (const col of [3, 4]) for (const row of [3, 4]) {
      const dx = (col + 0.5 - x) * CELL
      const dz = (row + 0.5 - z) * CELL
      if (rug.model === 'rugRound') {
        expect(Math.hypot(dx, dz)).toBeLessThanOrEqual(width / 2)
      } else {
        expect(Math.abs(dx)).toBeLessThanOrEqual(width / 2)
        expect(Math.abs(dz)).toBeLessThanOrEqual(depth / 2)
      }
    }
  })
})
