import { describe, expect, it } from 'vitest'
import baked from '../../src/data/catalog.generated.json'
import type { Puzzle } from '../../src/core/types'
import { labelBoxOf, placeLabels } from '../../src/reference/boards/illustrated/labels'
import { illustratedPlan } from '../../src/reference/boards/illustrated/plan'
import { easy, hard } from './fixtures'
import { deep, leadCases } from '../../src/casebook/deep'

// Every case the slice can show: the 60 baked cases, the frozen fixtures and the deep cases.
const all: Puzzle[] = [...(baked as unknown as Puzzle[]), hard, easy, ...deep(), ...leadCases()]
const floorsOf = (p: Puzzle) => Array.from({ length: p.floors ?? 1 }, (_, i) => i)
// Cell sizes from the smallest phone (24) to the largest the slice draws (84, past it for margin).
const SIZES = Array.from({ length: 69 }, (_, i) => 24 + i)

describe('room-name plates never collide', () => {
  it('no two plates overlap or crowd each other, on every floor of every case, at every cell size', () => {
    let checked = 0
    const bad: string[] = []
    for (const p of all) for (const floor of floorsOf(p)) for (const u of SIZES) {
      const labels = placeLabels(illustratedPlan(p, floor, u), u)
      const boxes = labels.map(labelBoxOf)
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        // plates are 0.06 cell wider than their box (0.03 on each side); keep a visible gutter of at least 10 px between plates
        const gx = Math.max(a[0] - b[2], b[0] - a[2]) * u - 0.06 * u
        const gy = Math.max(a[1] - b[3], b[1] - a[3]) * u
        const apart = Math.max(gx, gy)
        if (apart < 10 - 0.01) bad.push(`${p.id} f${floor} @${u}: ${labels[i].text}/${labels[j].text} ${apart.toFixed(1)}px`)
      }
      checked++
    }
    expect(bad.slice(0, 40)).toEqual([])
    expect(checked).toBeGreaterThan(6000)
  })
})
