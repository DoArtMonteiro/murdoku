import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import type { Puzzle } from '../../src/core/types'
import { storyFor } from '../../src/reference/story'
import { deduceChain } from '../../src/reference/story/deduce'
import { buildReconstruction, chainSatisfiesClues, crucialIsFirstPin } from '../../src/reference/story/reconstruct'
import { BANNED_ASYMMETRY, clueMatches, conceptsOf, leaks, placementIssues, suspectMetrics, suspectProse, validateStory, MARKER_R } from '../../src/reference/story/validate'
import type { CaseStory } from '../../src/reference/story/schema'
import { buildPlan } from '../../src/reference/boards/nightplan/plan'
import { labelBoxOf, placeLabels } from '../../src/reference/boards/illustrated/labels'

const puzzle = getAllPuzzles().find(p => p.id === 'very-easy-1') as Puzzle
const story = storyFor('very-easy-1') as CaseStory
const clone = (): CaseStory => JSON.parse(JSON.stringify(story))

describe('story content: very-easy-1', () => {
  it('passes the validator', () => {
    expect(validateStory(puzzle, story)).toEqual([])
  })

  it('every voiced line points at a real clue of its person, and every real clue is voiced', () => {
    for (const s of story.suspects) {
      const own = puzzle.clues.filter(c => c.clue.person === s.personId && c.clue.kind !== 'victim')
      for (const l of s.lines) expect(own.some(c => clueMatches(l.clue, c.clue))).toBe(true)
      for (const c of own) expect(s.lines.some(l => clueMatches(l.clue, c.clue))).toBe(true)
    }
  })

  it('never names the murderer, or accuses, in anything shown before the case is solved', () => {
    const murderer = puzzle.people.find(p => p.id === puzzle.murdererId)!
    const pre = [
      story.premise,
      ...story.evidence.flatMap(e => [e.label, e.description]),
    ]
    for (const t of pre) expect(t).not.toMatch(new RegExp(`\\b${murderer.name}\\b`))
    // the murderer's card is as dressed as everyone's: a motive and no accusation
    for (const s of story.suspects) {
      const all = [s.oneLiner, s.alibi, s.motive.text, ...s.lines.map(l => l.text)].join(' ')
      expect(all).not.toMatch(/murder|killer|guilty|culprit|did it/i)
    }
  })

  it('evidence kinds are not furniture and numbering is 1..k', () => {
    expect(story.evidence.map(e => e.n)).toEqual([1, 2, 3, 4, 5])
    expect(story.evidence.filter(e => !e.showDuringPlay).map(e => e.id)).toEqual(['E5'])
  })
})

describe('symmetry and consistency of the pre-solve prose', () => {
  it('all three suspects carry equal weight: length, evidence references and denial phrases within 20% of the cast mean', () => {
    const m = suspectMetrics(puzzle, story)
    expect(m).toHaveLength(3)
    for (const key of ['chars', 'evidence', 'denials'] as const) {
      const mean = m.reduce((a, x) => a + x[key], 0) / m.length
      for (const x of m) expect(Math.abs(x[key] - mean), `${key} ${x.person}`).toBeLessThanOrEqual(0.2 * mean)
    }
    expect(m.every(x => x.evidence >= 2 && x.denials >= 1)).toBe(true) // concrete and linked to evidence, for everybody
  })
  it('none of the banned asymmetry phrases appears, and the true motive text is not in the pre-solve prose', () => {
    const prose = puzzle.people.map(p => suspectProse(story, p.id)).join(' ').toLowerCase() + story.premise.toLowerCase()
    for (const b of BANNED_ASYMMETRY) expect(prose).not.toContain(b)
    expect(prose).not.toContain('skimming')
    expect(prose).not.toContain('second set')
  })
  it('no narrative line asserts presence or absence in a room or area (Tomas stands in the Office corner, not "out of the rooms")', () => {
    const bad = (mutate: (s: CaseStory) => void) => { const c = clone(); mutate(c); return validateStory(puzzle, c).join() }
    const tomas = (c: CaseStory) => c.suspects.find(x => x.personId === 'p3')!
    expect(bad(c => { tomas(c).alibi = 'I do not walk into strangers rooms.' })).toMatch(/asserts presence or absence/)
    expect(bad(c => { tomas(c).alibi = 'I came in as far as I had to.' })).toMatch(/asserts presence or absence/)
    expect(bad(c => { tomas(c).alibi = 'I stayed in the hall.' })).toMatch(/asserts presence or absence/)
    expect(bad(c => { tomas(c).lines[0].text = 'A corner. I never left it.' })).toMatch(/asserts presence or absence/)
    expect(story.evidence.map(e => e.description).join(' ')).not.toMatch(/before the rooms|never entered/)
  })
  it('negative control: a lopsided card (a murderer-only protest, a longer motive) fails the symmetry check', () => {
    const c = clone()
    c.suspects.find(x => x.personId === 'p1')!.alibi += ' I never laid a hand on him, and I did not see what happened to him, and I never left it.'
    expect(validateStory(puzzle, c).join()).toMatch(/asymmetry phrase/)
    expect(validateStory(puzzle, c).join()).toMatch(/denials of p1|chars of p1/)
  })
})

describe('validator catches leaks (negative controls)', () => {
  it('rejects a line that names a room, furniture, row or person its clue does not', () => {
    const bad = (mutate: (s: CaseStory) => void) => { const s = clone(); mutate(s); return validateStory(puzzle, s) }
    const faye = (s: CaseStory) => s.suspects.find(x => x.personId === 'p2')!
    expect(bad(s => { faye(s).lines[0].text = 'In the Bedroom, in the Office doorway.' }).join()).toMatch(/Office/i)
    expect(bad(s => { faye(s).lines[0].text = 'In the Bedroom, on the bed.' }).join()).toMatch(/bed/)
    expect(bad(s => { faye(s).lines[0].text = 'In the Bedroom, in row 2.' }).join()).toMatch(/row/)
    expect(bad(s => { faye(s).lines[0].text = 'In the Bedroom, by the TV.' }).join()).toMatch(/tv/i)
    expect(bad(s => { faye(s).lines[0].text = 'In the Bedroom. Priya was elsewhere.' }).join()).toMatch(/names Priya/)
    const tomas = (s: CaseStory) => s.suspects.find(x => x.personId === 'p3')!
    expect(bad(s => { tomas(s).lines[0].text = 'A corner, upstairs.' }).join()).toMatch(/upstairs/)
    expect(bad(s => { tomas(s).lines[0].text = 'A corner, near the edge.' }).join()).toMatch(/edge|near/)
  })
  it('rejects a line whose clue is not that person\'s, and an unvoiced clue', () => {
    const s = clone()
    s.suspects.find(x => x.personId === 'p3')!.lines[0].clue = { kind: 'edge' }
    expect(validateStory(puzzle, s).join()).toMatch(/no such clue/)
    const t = clone()
    t.suspects.find(x => x.personId === 'p1')!.lines.pop()
    expect(validateStory(puzzle, t).join()).toMatch(/no voiced line/)
  })
  it('rejects naming the murderer before the solve', () => {
    const s = clone()
    s.evidence[1].description = 'Priya\'s torn envelope.'
    expect(validateStory(puzzle, s).join()).toMatch(/names Priya/)
    const t = clone()
    t.premise += ' Priya did it.'
    expect(validateStory(puzzle, t).join()).toMatch(/names the murderer/)
  })
  it('allows a clue word only when the clue states it', () => {
    const own = conceptsOf(puzzle.clues.filter(c => c.clue.person === 'p1').map(c => c.clue))
    expect(leaks(puzzle, 'The bottom row, beside the TV.', own)).toEqual([])
    expect(leaks(puzzle, 'Beside the sofa.', own)).toContain('sofa')
    expect(leaks(puzzle, 'In the Kitchen.', own)).toContain('kitchen')
  })
})

describe('evidence placement', () => {
  /** Room plaque boxes exactly as the illustrated board lays them out, at several cell sizes (desktop to phone). */
  const labelSets = [42, 50, 62, 86].map(u => placeLabels(buildPlan(puzzle, 0, u), u).map(l => labelBoxOf(l)))
  it('clears every cell centre zone, eligible token box, door opening and every room label at every board size', () => {
    for (const e of story.evidence) {
      expect(placementIssues(puzzle, story, e), e.id).toEqual([])
      for (const [i, boxes] of labelSets.entries()) expect(placementIssues(puzzle, story, e, boxes), `${e.id} labels@${i}`).toEqual([])
    }
  })
  it('puts the porch parcel on the EAST porch, the envelope on the TV cabinet, the boots in the hall band', () => {
    const at = (id: string) => story.evidence.find(e => e.id === id)!.placement
    expect(at('E1').x).toBeGreaterThan(puzzle.size)
    expect(at('E1').y).toBeCloseTo(2.5)
    expect(Math.floor(at('E2').x)).toBe(2); expect(Math.floor(at('E2').y)).toBe(4) // r4c2 is the TV
    expect(Math.floor(at('E4').y + 0.01)).toBe(3); expect(Math.floor(at('E4').x)).toBe(2)
  })
  it('flags a marker in a cell centre, on a token box, in the gutter, in a door, and on a label', () => {
    const mk = (x: number, y: number) => ({ ...story.evidence[0], placement: { x, y, where: '' } })
    expect(placementIssues(puzzle, story, mk(1.5, 4.5)).join()).toMatch(/centre zone/)
    expect(placementIssues(puzzle, story, mk(2.5, 2.88)).join()).toMatch(/token box/) // free hall floor: a person may stand there
    expect(placementIssues(puzzle, story, mk(-0.4, 2.5)).join()).toMatch(/gutter/)
    expect(placementIssues(puzzle, story, mk(1.5, 3)).join()).toMatch(/door/)
    const b = labelSets[3][0]
    expect(placementIssues(puzzle, story, mk(b[0] - 0.04, (b[1] + b[3]) / 2), labelSets[3]).join()).toMatch(/label/)
    expect(MARKER_R).toBeLessThanOrEqual(0.08)
  })
})

describe('deduction chain (from the real puzzle)', () => {
  const chain = deduceChain(puzzle)
  it('reaches the stored solution without trial and error', () => {
    expect(chain.pure).toBe(true)
    expect(chain.placement).toEqual(Object.fromEntries(Object.entries(puzzle.solution).map(([k, v]) => [k, { row: v.row, col: v.col, floor: v.floor ?? 0 }])))
    expect(chainSatisfiesClues(puzzle, chain)).toBe(true)
  })
  it('pins Priya, Owen, Faye, Tomas in that order, matching the bible', () => {
    expect(chain.steps.map(s => s.person)).toEqual(['p1', 'p0', 'p2', 'p3'])
    expect(chain.steps[0].via).toBe('own')
    expect(chain.steps[0].ownCandidates).toHaveLength(1)
    expect(crucialIsFirstPin(puzzle, story, chain)).toBe(true)
  })
  it('every step\'s removals really come from earlier pins', () => {
    const seen = new Set<string>()
    for (const s of chain.steps) {
      for (const r of s.removed.filter(r => r.reason === 'lane')) expect(seen.has(r.by)).toBe(true)
      expect(s.openBefore.some(c => c.row === s.cell.row && c.col === s.cell.col)).toBe(true)
      seen.add(s.person)
    }
  })
  it('reaches every shipped case\'s stored solution', () => {
    let n = 0
    for (const p of getAllPuzzles()) {
      const c = deduceChain(p)
      for (const [id, cell] of Object.entries(p.solution)) {
        expect(c.placement[id], `${p.id} ${id}`).toMatchObject({ row: cell.row, col: cell.col })
      }
      n++
    }
    expect(n).toBeGreaterThan(50)
  }, 120000)
})

describe('reconstruction frames', () => {
  const rec = buildReconstruction(puzzle, story)
  it('covers the four steps in order, ends at the culprit and then the dossier, with five filmstrip slots', () => {
    expect([...new Set(rec.frames.map(f => f.step))]).toEqual([0, 1, 2, 3])
    expect([...new Set(rec.frames.map(f => f.slot))]).toEqual([0, 1, 2, 3, 4])
    expect(rec.frames[0].kind).toBe('motive')
    expect(rec.frames.at(-2)!.kind).toBe('conclusion')
    expect(rec.frames.at(-2)!.routes).toEqual([puzzle.murdererId])
    expect(rec.frames.at(-1)!.kind).toBe('dossier')
    expect(rec.frames.filter(f => f.kind === 'deduce')).toHaveLength(4)
  })
  it('holds back the key until the accusation frames', () => {
    expect(rec.frames.filter(f => f.reveal).map(f => f.kind)).toEqual(['conclusion', 'dossier'])
  })
  const room = (x: number, y: number) => {
    const r = Math.floor(y), c = Math.floor(x)
    return r < 0 || c < 0 || r >= puzzle.size || c >= puzzle.size ? '' : puzzle.roomOf[r][c]
  }
  it('routes start at the real east street door and never cross furniture or a wall outside a door', () => {
    for (const p of puzzle.people) {
      const r = rec.routes[p.id]
      expect(r[0]).toEqual(story.setting.entrance)
      expect(r[0].x).toBeGreaterThan(puzzle.size)
      let prev = r[0]
      for (const q of r.slice(1)) {
        const len = Math.hypot(q.x - prev.x, q.y - prev.y)
        const steps = Math.max(1, Math.ceil(len / 0.02))
        let last = prev
        for (let i = 1; i <= steps; i++) {
          const x = prev.x + ((q.x - prev.x) * i) / steps, y = prev.y + ((q.y - prev.y) * i) / steps
          for (const f of puzzle.furniture) {
            const w = f.w ?? 1, h = f.h ?? 1
            expect(x > f.col + 0.25 && x < f.col + w - 0.25 && y > f.row + 0.25 && y < f.row + h - 0.25, `${p.name} walks through ${f.type} at ${x.toFixed(2)},${y.toFixed(2)}`).toBe(false)
          }
          if (x >= 0 && y >= 0 && x < puzzle.size && y < puzzle.size && last.x >= 0 && last.y >= 0 && last.x < puzzle.size && last.y < puzzle.size && room(x, y) !== room(last.x, last.y)) {
            const mx = (x + last.x) / 2, my = (y + last.y) / 2
            const inDoor = story.setting.doors.some(d => mx >= Math.min(d.x1, d.x2) - 0.03 && mx <= Math.max(d.x1, d.x2) + 0.03 && my >= Math.min(d.y1, d.y2) - 0.03 && my <= Math.max(d.y1, d.y2) + 0.03)
            expect(inDoor, `${p.name} crosses a wall at ${mx.toFixed(2)},${my.toFixed(2)}`).toBe(true)
          }
          last = { x, y }
        }
        prev = q
      }
      const cell = puzzle.solution[p.id]
      const end = r[r.length - 1]
      expect(Math.hypot(end.x - (cell.col + 0.5), end.y - (cell.row + 0.5))).toBeGreaterThanOrEqual(0.45)
    }
  })
  it('footsteps pass through the door openings, never along a jamb', () => {
    const doors = story.setting.doors
    for (const p of puzzle.people) {
      const r = rec.routes[p.id]
      for (let i = 1; i < r.length; i++) {
        const a = r[i - 1], b = r[i]
        for (const d of doors) {
          const vertical = d.x1 === d.x2
          const along = vertical ? a.x === d.x1 && b.x === d.x1 : a.y === d.y1 && b.y === d.y1
          if (!along) continue
          const lo = vertical ? Math.min(d.y1, d.y2) : Math.min(d.x1, d.x2), hi = vertical ? Math.max(d.y1, d.y2) : Math.max(d.x1, d.x2)
          for (const v of vertical ? [a.y, b.y] : [a.x, b.x]) expect(v === lo || v === hi, `${p.name} runs along a jamb of the door at ${lo}-${hi}`).toBe(false)
        }
      }
    }
    for (const p of puzzle.people.filter(q => q.id !== 'p2' || true)) {
      const r = rec.routes[p.id]
      for (const pt of r) for (const d of doors) {
        const onJamb = d.x1 === d.x2 ? pt.x === d.x1 && (pt.y === d.y1 || pt.y === d.y2) : pt.y === d.y1 && (pt.x === d.x1 || pt.x === d.x2)
        expect(onJamb, `${p.name} turns on a jamb at ${pt.x},${pt.y}`).toBe(false)
      }
    }
  })
  it('deduction text names the clue and the resulting square', () => {
    const f = rec.frames.find(x => x.id === 'deduce-1')!
    expect(f.body).toContain('In the bottom row')
    expect(f.body).toContain('row 6, column 3')
    expect(f.title).toBe('Crucial clue · 1 / 4')
  })
})
