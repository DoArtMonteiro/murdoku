import { describe, expect, it } from 'vitest'
import { cellKey } from '../../src/casebook/cells'
import { lensCells, statementsOf } from '../../src/casebook/lens'
import { ALL_CASES } from '../boardLegibility/cases'

describe('lens, every case', () => {
  it("lighting all of a person's unary statements lights their solution square", () => {
    const bad: string[] = []
    let people = 0
    for (const p of ALL_CASES) for (const person of p.people) {
      const sts = statementsOf(p, person.id).filter(s => !s.needs)
      if (!sts.length) continue
      people++
      const lens = lensCells(p, person.id, sts.map(s => s.index), {})
      if (!lens?.has(cellKey(p.solution[person.id]))) bad.push(`${p.id} ${person.id}`)
    }
    expect(bad.slice(0, 20)).toEqual([])
    expect(people).toBeGreaterThan(300)
  })

  it("lighting one statement at a time keeps the solution square lit, with the others placed where they truly stand", () => {
    const bad: string[] = []
    for (const p of ALL_CASES) for (const person of p.people) {
      const { [person.id]: _own, ...others } = p.solution
      for (const s of statementsOf(p, person.id)) {
        const lens = lensCells(p, person.id, [s.index], others)
        if (lens === null) bad.push(`${p.id} ${person.id} #${s.index}: unlit`)
        else if (!lens.has(cellKey(p.solution[person.id]))) bad.push(`${p.id} ${person.id} #${s.index} ${s.clue.kind}: solution dark`)
      }
    }
    expect(bad.slice(0, 20)).toEqual([])
  })
})
