import { describe, expect, it } from 'vitest'
import { companionFloorBoxes } from '../src/scene3d/companionGeometry'
import { CELL, FLOOR_THICKNESS } from '../src/scene3d/units'

const floor = (n: number, y = 0) => Array.from({ length: n }, () => Array(n).fill(y))

describe('multi-storey companion floor geometry', () => {
  it('renders a uniform floor as one continuous slab instead of a visible cell grid', () => {
    expect(companionFloorBoxes({ n: 8, floorY: floor(8) })).toEqual([{
      min: [0, -FLOOR_THICKNESS, 0],
      max: [8 * CELL, 0, 8 * CELL],
    }])
  })

  it('preserves the stairwell while using only a few continuous slab regions', () => {
    const boxes = companionFloorBoxes({
      n: 8,
      floorY: floor(8),
      stairwell: [2, 4, 4, 4],
    })
    const area = boxes.reduce((sum, box) => (
      sum + (box.max[0] - box.min[0]) * (box.max[2] - box.min[2])
    ), 0)

    expect(boxes).toHaveLength(4)
    expect(area).toBeCloseTo((64 - 3) * CELL * CELL)
    expect(boxes.every(box => (
      box.max[0] <= 2 * CELL || box.min[0] >= 5 * CELL ||
      box.max[2] <= 4 * CELL || box.min[2] >= 5 * CELL
    ))).toBe(true)
  })
})
