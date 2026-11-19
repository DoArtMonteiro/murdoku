import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Casebook from '../../src/casebook/Casebook'
import { firstName } from '../../src/casebook/cells'
import { deep, leadCases } from '../../src/casebook/deep'
import { chainOf, hintFor } from '../../src/casebook/hint'
import { statementsOf } from '../../src/casebook/lens'
import { buildRecon } from '../../src/casebook/recon'
import { buildRollCall, computedClosing } from '../../src/casebook/rollcall'
import { STORIES, fillNames, storyFor } from '../../src/casebook/stories'
import type { Puzzle } from '../../src/core/types'

afterEach(() => cleanup())

const IDS = Array.from({ length: 12 }, (_, i) => `pt-${String(i + 1).padStart(2, '0')}`)
const season = leadCases().filter(p => IDS.includes(p.id))
// every name the generator hands out: none of them may reach the screen of an overridden case
const POOL = [...new Set([...season, ...deep()].flatMap(p => p.people.map(x => x.name)))]
const RAW = new RegExp(`\\b(${POOL.join('|')})\\b`)

/** Every string a player could see or hear in a container: text, and the attributes read out or shown. */
function scan(root: Element): string {
  const parts = [root.textContent ?? '']
  for (const el of root.querySelectorAll('*')) {
    for (const a of ['aria-label', 'title', 'alt', 'aria-description', 'data-label', 'data-label-full', 'placeholder']) {
      const v = el.getAttribute(a)
      if (v) parts.push(v)
    }
  }
  return parts.join('\n')
}

const rail = () => within(screen.getByRole('list', { name: 'Suspects' })).getAllByRole('button')

describe('the season has its own cast', () => {
  it('has twelve cases, each with a shown name for everyone, and no first name repeats across them', () => {
    expect(season.map(p => p.id).sort()).toEqual(IDS)
    const shown = season.flatMap(p => p.people.map(x => firstName(p, x.id)))
    expect(shown).toHaveLength(72)
    expect(new Set(shown).size).toBe(72)
    // no shown name is a generator name, or contains one, so a leak can always be told from a real name
    for (const n of shown) expect(POOL.some(g => n.toLowerCase().includes(g.toLowerCase())), n).toBe(false)
  })

  it('keeps the initials in a case distinct (the token badge is the initial) and the names short enough for the rail', () => {
    for (const p of season) {
      const names = p.people.map(x => firstName(p, x.id))
      expect(new Set(names.map(n => n[0])).size, `${p.id}: ${names.join(' ')}`).toBe(names.length)
      for (const n of names) expect(n.length, n).toBeLessThanOrEqual(7)
    }
  })

  it('leaves the puzzle data alone: the override is presentation only', () => {
    for (const p of season) {
      const s = STORIES[p.id]
      for (const x of p.people) expect(s.cast[x.id].name).toBe(x.name)
      expect(storyFor(p)).not.toBeNull()
      expect(p.people.every(x => POOL.includes(x.name))).toBe(true)
    }
  })

  it('never lets a generator name into a generated sentence: chips, roll-call, proof, hints, closing', () => {
    for (const p of season) {
      const texts: string[] = []
      for (const x of p.people) for (const st of statementsOf(p, x.id)) texts.push(st.text, st.needs ? `Place ${firstName(p, st.needs)} first` : '')
      const r = buildRollCall(p)
      texts.push(r.victim.line, r.last.line, ...r.cleared.map(c => c.line), computedClosing(p), fillNames(p, STORIES[p.id].closing ?? ''))
      const recon = buildRecon(p)
      texts.push(...recon.frames.map(f => f.line), recon.finale.line)
      const chain = chainOf(p)
      for (let i = 0; i <= chain.steps.length; i++) {
        const place = Object.fromEntries(chain.steps.slice(0, i).map(s => [s.person, s.cell]))
        for (const level of [1, 2, 3] as const) {
          const h = hintFor(p, place, level)
          if (h) texts.push(h.text, ...h.lines)
        }
      }
      for (const t of texts) expect(RAW.test(t), `${p.id}: ${t}`).toBe(false)
      // and the shown names do appear
      expect(texts.join(' ')).toContain(firstName(p, p.murdererId))
    }
  })

  it('writes every closing line with a name, not a pronoun, and fills {M} and {V}', () => {
    for (const p of season) {
      const c = STORIES[p.id].closing!
      expect(c, p.id).not.toMatch(/\b(he|she|him|her|his|hers|they|them|their)\b/i)
      expect(fillNames(p, c)).not.toMatch(/[{}]/)
    }
    expect(fillNames(season[0], STORIES['pt-01'].closing!)).toContain(firstName(season[0], season[0].murdererId))
  })

  it('pt-01 no longer contradicts its premise that everyone told the truth', () => {
    expect(STORIES['pt-01'].closing).not.toMatch(/was not|lied|liar|dishonest/i)
  })
})

describe('no raw generator name reaches the screen of an overridden case', () => {
  it.each(IDS)('%s: play, a wrong name, a right name, the roll-call and the proof', id => {
    const p = season.find(x => x.id === id) as Puzzle
    const { container } = render(<Casebook puzzle={p} />)
    const seen: string[] = [scan(container)]
    for (const b of rail()) {
      fireEvent.click(b)
      seen.push(scan(container))
    }
    // the true plan, one person at a time
    p.people.forEach((x, i) => {
      fireEvent.click(rail()[i])
      const c = p.solution[x.id]
      const fb = document.querySelectorAll('.cb-floors button')
      if (fb.length) fireEvent.click(fb[c.floor ?? 0])
      fireEvent.click(document.querySelector(`[role=gridcell][data-row="${c.row}"][data-col="${c.col}"]`)!)
      seen.push(scan(container))
    })
    // a wrong name
    const wrong = p.people.find(x => x.id !== p.murdererId && x.id !== p.victimId)!
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(p, wrong.id)) }))
    seen.push(scan(document.body))
    fireEvent.click(screen.getByRole('button', { name: 'Back to the plan' }))
    // the right name, the roll-call to its end, then the proof to its finale
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(p, p.murdererId)) }))
    seen.push(scan(document.body))
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    seen.push(scan(document.body))
    fireEvent.click(screen.getByRole('button', { name: 'Show the proof' }))
    for (let i = 0; i < 40 && screen.queryByRole('button', { name: 'Next' }); i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
      seen.push(scan(document.body))
    }
    seen.push(scan(document.body))
    for (const s of seen) expect(RAW.exec(s)?.[0] ?? null, id).toBeNull()
    expect(seen.join('\n')).toContain(firstName(p, p.murdererId))
  })

  it('the hint levels use shown names too', () => {
    render(<Casebook puzzle={season[0]} />)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Why/ }))
      expect(RAW.exec(scan(document.body))?.[0] ?? null).toBeNull()
    }
  })
})
