import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import type { Cell } from '../../src/core/types'
import { chainOf, hintFor, nextStep } from '../../src/casebook/hint'
import { buildRecon } from '../../src/casebook/recon'
import { cellKey, sameCell } from '../../src/casebook/cells'
import { lensCells } from '../../src/casebook/lens'
import { deep } from '../../src/casebook/deep'

describe('hint', () => {
  it('points at the first chain step that is not correctly placed', () => {
    const chain = chainOf(hard)
    expect(nextStep(hard, {})!.person).toBe(chain.steps[0].person)
    const placed = { [chain.steps[0].person]: chain.steps[0].cell }
    expect(nextStep(hard, placed)!.person).toBe(chain.steps[1].person)
  })

  it('counts a wrong placement as unplaced', () => {
    const first = chainOf(hard).steps[0]
    const wrong = { [first.person]: { row: 0, col: 0, floor: 0 } }
    expect(nextStep(hard, wrong)!.person).toBe(first.person)
  })

  it('is done once everything is right', () => {
    expect(nextStep(hard, hard.solution)).toBeNull()
    expect(hintFor(hard, hard.solution, 1)).toBeNull()
  })

  it('level 1 names the person and nothing about squares', () => {
    const h = hintFor(hard, {}, 1)!
    const name = hard.people.find(x => x.id === h.person)!.name
    expect(h.text).toContain(name)
    expect(h.text).not.toMatch(/row|column|upstairs|ground/i)
    expect(h.lines).toEqual([])
  })

  it('level 2 lights statements and lists removals with their reasons', () => {
    // Walk to the deepest step of hard-2 (Greta), who has the most removals.
    const chain = chainOf(hard)
    const before = Object.fromEntries(chain.steps.slice(0, 3).map(s => [s.person, s.cell]))
    const h = hintFor(hard, before, 2)!
    expect(h.person).toBe(chain.steps[3].person)
    expect(h.lit.length).toBeGreaterThan(0)
    expect(h.lit.every(i => hard.clues[i].clue.person === h.person)).toBe(true)
    expect(h.lines.length).toBeGreaterThan(0)
    expect(h.lines.join(' ')).toMatch(/would have nowhere left|is .+'s\./)
  })

  it('level 3 names the square and it is the chain square', () => {
    const h = hintFor(easy, {}, 3)!
    expect(sameCell(h.cell, easy.solution[h.person])).toBe(true)
    expect(h.text).toMatch(/row \d+, column \d+/)
  })

  it('every chain step of every case, deep ones included, yields text at every level', () => {
    for (const p of [hard, easy, ...deep()]) {
      const steps = chainOf(p).steps
      const place: Record<string, (typeof steps)[number]['cell']> = {}
      for (const s of steps) {
        for (const lv of [1, 2, 3] as const) expect(hintFor(p, place, lv)!.text.length).toBeGreaterThan(5)
        place[s.person] = s.cell
      }
    }
  })
})

describe('hint level 2 agrees with the lens', () => {
  it('the square count it states is the number of squares the lens lights, and the true square is among them', () => {
    for (const p of [hard, easy, ...deep()]) {
      const place: Record<string, Cell> = {}
      for (const s of chainOf(p).steps) {
        const h = hintFor(p, place, 2)!
        const m = /That allows (\d+) squares?/.exec(h.text)
        const lens = lensCells(p, s.person, h.lit, place)
        const tag = `${p.id} step ${s.n}`
        if (lens) {
          expect(m, tag).not.toBeNull()
          expect(Number(m![1]), tag).toBe(lens.size)
          expect(lens.has(cellKey(s.cell)), `${tag} true square lit`).toBe(true)
        } else {
          expect(m, `${tag} states no count when nothing can be lit`).toBeNull()
        }
        // deep cases remove dozens of squares: the text must stay a few lines, not a list of cells
        expect(h.lines.join(' ').length, tag).toBeLessThan(400)
        place[s.person] = s.cell
      }
    }
  })
})

describe('reconstruction', () => {
  it('replays the chain in order and ends on the solution', () => {
    for (const p of [hard, easy]) {
      const r = buildRecon(p)
      expect(r.frames.map(f => f.person)).toEqual(chainOf(p).steps.map(s => s.person))
      for (const f of r.frames) {
        expect(sameCell(f.cell, p.solution[f.person])).toBe(true)
        expect(f.line).toContain(p.people.find(x => x.id === f.person)!.name)
        expect(f.line.length).toBeGreaterThan(20)
      }
    }
  })

  it('ends in the victim\'s room with two people, murderer named', () => {
    for (const p of [hard, easy]) {
      const { finale } = buildRecon(p)
      expect(finale.group.sort()).toEqual([p.victimId, p.murdererId].sort())
      expect(finale.murderer).toBe(p.murdererId)
    }
  })
})
