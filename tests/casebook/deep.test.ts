import { describe, expect, it } from 'vitest'
import { deep, leadCases, parseGenerated } from '../../src/casebook/deep'
import { countSolutions, findMurderer } from '../../src/core/engine'
import { hard } from './fixtures'

// The generator's baked file, when it exists (the other agent writes it): the slice must load it as written.
const generated = Object.values(import.meta.glob<unknown>('../../src/data/casebook.generated.json', { eager: true, import: 'default' }))[0]

describe('deep cases', () => {
  it('ships the two depth fixtures, valid, unique and with a consistent murderer', () => {
    const d = deep()
    expect(d.map(p => p.id)).toEqual(['depth-d-189', 'depth-b-95'])
    for (const p of d) {
      expect(countSolutions(p, 5), p.id).toBe(1)
      expect(findMurderer(p), p.id).toBe(p.murdererId)
    }
    expect(d[0].floors).toBe(2)
    expect(d[0].size).toBe(8)
  })

  it('uses the generator output when the file is present, and the fixtures when it is absent or unusable', () => {
    expect(leadCases({}).map(p => p.id)).toEqual(['depth-d-189', 'depth-b-95'])
    expect(leadCases({ x: 'garbage' }).map(p => p.id)).toEqual(['depth-d-189', 'depth-b-95'])
    const pt01 = { ...hard, id: 'pt-01' }
    expect(leadCases({ f: [pt01] }).map(p => p.id)).toEqual(['pt-01'])
  })

  it('accepts an array, a record keyed by case id, or { puzzles }', () => {
    const { id: _id, ...bare } = hard
    expect(parseGenerated([hard]).map(p => p.id)).toEqual(['hard-2'])
    expect(parseGenerated({ 'pt-02': bare }).map(p => p.id)).toEqual(['pt-02'])
    expect(parseGenerated({ puzzles: [hard] }).map(p => p.id)).toEqual(['hard-2'])
    expect(parseGenerated(null)).toEqual([])
    expect(parseGenerated([{ id: 'x' }])).toEqual([])
  })
})

describe('the generator-baked casebook file', () => {
  it.skipIf(!generated)('is loaded as is: every case valid, ids pt-01..pt-12, in file order', () => {
    const cases = leadCases()
    expect(cases).toHaveLength((generated as unknown[]).length)
    expect(cases.map(p => p.id)).toEqual((generated as Array<{ id: string }>).map(p => p.id))
    expect(cases[0].id).toBe('pt-01')
    for (const p of cases) expect(countSolutions(p, 3), p.id).toBe(1)
  })
})
