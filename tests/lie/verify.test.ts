import { describe, expect, it } from 'vitest'
import { clueHolds, countSolutions } from '../../src/core/engine'
import type { Clue } from '../../src/core/types'
import { OFA_01 } from '../../src/lie/cases/ofa-01'
import { OFA_02 } from '../../src/lie/cases/ofa-02'
import { OFA_03 } from '../../src/lie/cases/ofa-03'
import type { LieCase, Statement } from '../../src/lie/model'
import {
  exposure, findMinimalCores, impliedStatements, isMinimalContradiction, laneFree, legibility, liePlacesOutside, placedBySingles, puzzleOf, reconstruct,
  satisfiable, verifyLieCase,
} from '../../src/lie/verify'

const EXPECT_02 = { laneFreeAtLeast: 1, liarBeyondSingles: true }

/** A deep copy of ofa-02 with `edit` applied to its statements; puzzle.clues is rebuilt from them (lie excluded). */
function variant(edit: (stmts: Statement[]) => Statement[], patch: Partial<LieCase> = {}, from: LieCase = OFA_02): LieCase {
  const base = structuredClone(from)
  const statements = edit(base.statements)
  const lieId = patch.lieId ?? base.lieId
  const marker = base.puzzle.clues.find(ct => ct.clue.kind === 'victim')!
  return {
    ...base,
    ...patch,
    statements,
    puzzle: { ...base.puzzle, clues: [...statements.filter(s => s.id !== lieId).map(s => ({ clue: s.clue, text: s.text })), marker] },
  }
}

const without = (...ids: string[]) => (stmts: Statement[]) => stmts.filter(s => !ids.includes(s.id))
const replace = (id: string, clue: Clue, text: string) => (stmts: Statement[]) => stmts.map(s => (s.id === id ? { ...s, clue, text } : s))

const ALL = [OFA_01, OFA_02, OFA_03]
const doubtable = (c: LieCase) => c.statements.filter(s => !s.scene).map(s => s.id)

/** Every subset of `ids` of size 1..max. */
function subsets(ids: string[], max: number): string[][] {
  const out: string[][] = []
  const go = (start: number, chosen: string[]) => {
    if (chosen.length) out.push([...chosen])
    if (chosen.length === max) return
    for (let i = start; i < ids.length; i++) go(i + 1, [...chosen, ids[i]])
  }
  go(0, [])
  return out
}

describe('verifyLieCase: the sound cases', () => {
  it('passes every case and returns a full report', () => {
    for (const c of ALL) {
      const r = verifyLieCase(c, c === OFA_02 ? EXPECT_02 : {})
      expect(r.failures).toEqual([])
      expect(r.report.laneFree).toHaveLength(c.collisions.length)
      expect(r.report.exposure.every(e => e.ok)).toBe(true)
    }
  })
})

describe('verifyLieCase: negative fixtures', () => {
  it('catches a second lie: a "true" statement that is false in the plan', () => {
    const r = verifyLieCase(variant(replace('s3', { kind: 'onFurniture', person: 'p1', furniture: 'stove' }, 'On the stove.')))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: true statement s3 does not hold in puzzle.solution')
  })

  it('catches a lie that is actually true in the plan', () => {
    const r = verifyLieCase(variant(replace('s10', { kind: 'onFurniture', person: 'p4', furniture: 'rug' }, 'On the rug.')))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: the lie s10 holds in puzzle.solution')
  })

  it('catches a lie that leaves a consistent world (check 1)', () => {
    const r = verifyLieCase(variant(without('s1', 's2', 's3', 's7')))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 1: all statements together still have a solution')
  })

  it('catches a wrong doubt that also solves (check 3)', () => {
    // only the chain s1, s7, s10 is left, so doubting s1 or s7 instead of the lie also gives a consistent world
    const r = verifyLieCase(variant(without('s2', 's3', 's4', 's5', 's8')))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 3: doubting s1 instead of the lie leaves a consistent world')
    expect(r.failures).toContain('check 3: doubting s7 instead of the lie leaves a consistent world')
  })

  it('catches collisions that share more than the lie, and a non-minimal collision (check 4)', () => {
    const r = verifyLieCase(variant(s => s, { collisions: [['s3', 's10'], ['s3', 's10', 's5']] }))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 4: the collisions intersect in [s3, s10], expected only s10')
    expect(r.failures).toContain('check 4 (collision 2): not minimal, s5 is not needed')
  })

  it('catches a collision that does not contain the lie, or is satisfiable (check 4)', () => {
    const r = verifyLieCase(variant(s => s, { collisions: [['s1', 's7'], ['s10', 's9']] }))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 4 (collision 1): does not contain the lie')
    expect(r.failures).toContain('check 4 (collision 2): is satisfiable, not a collision')
  })

  it('catches two collisions that lean on the same other author (check 4)', () => {
    // Joana is the witness in both
    const r = verifyLieCase(variant(s => s, { collisions: [['s3', 's10'], ['s4', 's10']] }))
    expect(r.failures).toContain('check 4: the two collisions share an author besides the liar')
  })

  it('catches a stored collision that names a scene fact, and one stored too few or too many (check 4)', () => {
    expect(verifyLieCase(variant(s => s, { collisions: [['s3', 's10'], ['s10', 's11']] })).failures)
      .toContain('check 4 (collision 2): names a scene fact; those are implicit')
    expect(verifyLieCase(variant(s => s, { collisions: [['s3', 's10']] })).failures).toContain('check 4: 1 collisions stored, expected 2 or 3')
    expect(verifyLieCase(variant(s => s, { collisions: [['s3', 's10'], ['s2', 's10'], ['s1', 's7', 's10'], ['s7', 's8', 's10']] })).failures)
      .toContain('check 4: 4 collisions stored, expected 2 or 3')
  })

  it('catches a collision that only appears with help from a scene fact (check 4)', () => {
    // Joana beside the stove could stand in the first row, but Lúcia found on the Office desk takes that column
    const c = variant(stmts => stmts.map(s => {
      if (s.id === 's3') return { ...s, clue: { kind: 'besideFurniture' as const, person: 'p1', furniture: 'stove' as const }, text: 'Beside the stove.' }
      if (s.id === 's11') return { ...s, clue: { kind: 'onFurniture' as const, person: 'p5', furniture: 'desk' as const }, text: 'On the desk.' }
      return s
    }))
    expect(satisfiable(c, ['s3', 's10'], { scene: false })).toBe(true)
    expect(satisfiable(c, ['s3', 's10'])).toBe(false)
    expect(verifyLieCase(c).failures).toContain('check 4 (collision 1): only collides with help from a scene fact')
  })

  it('catches a collision that cannot be shown on the plan because a witness is too loose (check 10)', () => {
    // Tomé is now only "in the Kitchen": nine squares in the way, never pinned to two
    const c = variant(replace('s6', { kind: 'room', person: 'p2', roomId: 'room0' }, 'In the Kitchen.'), {}, OFA_01)
    const r = verifyLieCase(c)
    expect(r.failures.some(f => f.startsWith('check 10: collision [s4, s5, s6] cannot be exposed'))).toBe(true)
  })

  it('catches uneven statement counts between suspects (check 6)', () => {
    const r = verifyLieCase(variant(without('s2')))
    expect(r.ok).toBe(false)
    expect(r.failures.some(f => f.startsWith('check 6: statement counts differ'))).toBe(true)
  })

  it('catches a lie that does not put the liar outside the victim\'s room (check 9)', () => {
    // Dinis on the Office desk is false (he stood on the rug) and still has him in the victim's room
    const c = variant(replace('s10', { kind: 'onFurniture', person: 'p4', furniture: 'desk' }, 'On the desk.'))
    expect(liePlacesOutside(c)).toBe(false)
    expect(verifyLieCase(c).failures).toContain("check 9: the lie does not put the liar outside the victim's room")
    expect(liePlacesOutside(OFA_02)).toBe(true)
    expect(liePlacesOutside(OFA_03)).toBe(true)
  })

  it("catches a liar whose other true statement already puts them in the victim's room (check 6)", () => {
    // Rui "in the Cellar" is true, and the Cellar is where the victim lay: that would hand the answer over
    const c = variant(replace('s1', { kind: 'room', person: 'p0', roomId: 'room4' }, 'In the Cellar.'), {}, OFA_03)
    expect(verifyLieCase(c).failures).toContain("check 6: the liar's other statement already places them in the victim's room")
    expect(verifyLieCase(OFA_03).failures).not.toContain("check 6: the liar's other statement already places them in the victim's room")
  })

  it('catches a speaker whose second statement restates the first (check 6)', () => {
    // Joana on the chair is already in the Kitchen: "in the Kitchen" adds nothing
    const c = variant(replace('s4', { kind: 'room', person: 'p1', roomId: 'room0' }, 'In the Kitchen.'))
    expect(impliedStatements(c)).toEqual([['s4', 's3']])
    expect(verifyLieCase(c).failures).toContain("check 6: s4 is implied by s3, the same speaker's other statement")
  })

  it('does not call a relational claim a restatement of a unary one, or two claims about different people', () => {
    for (const c of ALL) expect(impliedStatements(c)).toEqual([])
    // same person, same direction family: west of Tomé is implied by west of Rui only if the pairs nest, which they do not
    const d = variant(replace('s4', { kind: 'direction', person: 'p1', other: 'p0', dir: 'W' }, 'Somewhere west of Rui.'))
    expect(impliedStatements(d)).toEqual([])
  })

  it('refuses a direction or "not with" lie: neither places the liar anywhere (check 9)', () => {
    const c = variant(replace('s10', { kind: 'direction', person: 'p4', other: 'p0', dir: 'N' }, 'Somewhere north of Rui.'))
    expect(liePlacesOutside(c)).toBe(false)
  })

  it('catches a murderer id that is not the liar', () => {
    const base = structuredClone(OFA_02)
    base.puzzle.murdererId = 'p0'
    const r = verifyLieCase(base)
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: puzzle.murdererId p0 is not the lie author p4')
  })

  it('catches puzzle.clues that drifted from the statements', () => {
    const base = structuredClone(OFA_02)
    base.puzzle.clues = base.puzzle.clues.filter(ct => ct.text !== 'On the sofa.')
    const r = verifyLieCase(base)
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: puzzle.clues (without the victim marker) is not exactly the statements minus the lie, in order')
  })

  it('refuses a clue kind the mode does not allow', () => {
    const r = verifyLieCase(variant(replace('s4', { kind: 'corner', person: 'p1' }, 'In a corner of the board.')))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: s4 uses clue kind corner, which this mode does not allow')
  })

  it('refuses a stepped direction and a statement about the victim', () => {
    const r = verifyLieCase(variant(replace('s1', { kind: 'direction', person: 'p0', other: 'p5', dir: 'N', steps: 2 }, 'Exactly 2 rows north of Lúcia.')))
    expect(r.failures).toContain('structure: s1 is a stepped direction')
    expect(r.failures).toContain('structure: s1 is relational to the victim')
  })
})

describe('verifyLieCase: what a case promises beyond the shared checks', () => {
  it('fails a case with no lane-free collision when one is promised', () => {
    // s3 and s2 both lean on the one-per-row and one-per-column rule
    const c = variant(s => s, { collisions: [['s3', 's10'], ['s2', 's10']] })
    expect(verifyLieCase(c, { laneFreeAtLeast: 1 }).failures).toContain('expect: 0 lane-free collisions, expected at least 1')
  })

  it('fails a case whose liar is placed by singles when a harder step is promised', () => {
    expect(verifyLieCase(OFA_01, { liarBeyondSingles: true }).failures).toContain("expect: the liar's true square is found by singles alone")
  })

  it('fails a case that needs no suppose when one is promised', () => {
    expect(verifyLieCase(OFA_01, { supposesAtLeast: 1 }).failures).toContain('expect: reconstruction used 0 supposes, expected at least 1')
  })

  it('fails collisions that share a different number of statements than promised', () => {
    expect(verifyLieCase(OFA_02, { firstTwoShare: 2 }).failures).toContain('expect: the first two collisions share 1 statements, expected 2')
  })
})

describe('rulings: satisfiable, isMinimalContradiction, laneFree', () => {
  it('agrees with the engine on every subset of up to four statements (the largest citation), scene facts included', () => {
    for (const c of ALL) {
      const scene = c.statements.filter(s => s.scene)
      for (const ids of subsets(doubtable(c), 4)) {
        const chosen = [...c.statements.filter(s => ids.includes(s.id)), ...scene]
        expect(satisfiable(c, ids), `${c.id} ${ids.join(',')}`).toBe(countSolutions(puzzleOf(c.puzzle, chosen), 1) > 0)
      }
    }
  })

  it('agrees with the engine on larger citations too', () => {
    for (const c of ALL) {
      const scene = c.statements.filter(s => s.scene)
      const ids = doubtable(c)
      for (let start = 0; start + 5 <= ids.length; start++) {
        const cited = ids.slice(start, start + 5)
        const chosen = [...c.statements.filter(s => cited.includes(s.id)), ...scene]
        expect(satisfiable(c, cited), `${c.id} ${cited.join(',')}`).toBe(countSolutions(puzzleOf(c.puzzle, chosen), 1) > 0)
      }
      expect(satisfiable(c, ids)).toBe(false)
      expect(satisfiable(c, ids.filter(id => id !== c.lieId))).toBe(true)
    }
  })

  it('without the row and column rule, agrees with a brute-force search over every placement', () => {
    for (const c of ALL) {
      const p = c.puzzle
      const scene = c.statements.filter(s => s.scene)
      for (const ids of subsets(doubtable(c), 2)) {
        const stmts = [...c.statements.filter(s => ids.includes(s.id)), ...scene]
        const named = [...new Set(stmts.flatMap(s => [s.clue.person, 'other' in s.clue ? s.clue.other : undefined].filter((x): x is string => !!x)))]
        const cells = Array.from({ length: p.size * p.size }, (_, i) => ({ row: Math.floor(i / p.size), col: i % p.size }))
        let found = false
        const place: Record<string, { row: number; col: number }> = {}
        const rec = (i: number): void => {
          if (found) return
          if (i === named.length) { found = stmts.every(s => clueHolds(p, s.clue, place)); return }
          for (const cell of cells) { place[named[i]] = cell; rec(i + 1); if (found) return }
        }
        rec(0)
        expect(satisfiable(c, ids, { lanes: false }), `${c.id} ${ids.join(',')}`).toBe(found)
      }
    }
  })

  it('rules every stored collision a minimal contradiction, and no strict subset of one', () => {
    for (const c of ALL) {
      for (const core of c.collisions) {
        expect(satisfiable(c, core)).toBe(false)
        expect(isMinimalContradiction(c, core)).toBe(true)
        for (const sub of subsets(core, core.length - 1)) expect(isMinimalContradiction(c, sub)).toBe(false)
      }
    }
  })

  it('does not call a bigger set minimal, or a satisfiable one a contradiction', () => {
    const c = OFA_02
    expect(isMinimalContradiction(c, ['s3', 's10', 's5'])).toBe(false)
    expect(isMinimalContradiction(c, ['s3'])).toBe(false)
    expect(isMinimalContradiction(c, ['s9', 's10'])).toBe(false)
    expect(isMinimalContradiction(c, [])).toBe(false)
  })

  it('ignores scene facts a citation names, includes them silently, and rejects unknown ids', () => {
    const c = OFA_02
    expect(isMinimalContradiction(c, ['s3', 's10', 's11'])).toBe(true)
    expect(satisfiable(c, [])).toBe(true)
    expect(satisfiable(c, ['s3', 's3'])).toBe(true)
    expect(() => satisfiable(c, ['nope'])).toThrow(/unknown statement id/)
  })

  it('tells a lane-free contradiction from one that leans on the row and column rule', () => {
    // ofa-02: chair and box in one row (lanes), but east-of chains and the nothing-north-of-the-top-row pair need none
    expect(laneFree(OFA_02, ['s3', 's10'])).toBe(false)
    expect(satisfiable(OFA_02, ['s3', 's10'], { lanes: false })).toBe(true)
    expect(laneFree(OFA_02, ['s1', 's7', 's10'])).toBe(true)
    expect(laneFree(OFA_01, ['s1', 's4'])).toBe(true)
    expect(laneFree(OFA_01, ['s4', 's5', 's6'])).toBe(true)
  })

  it('answers a ruling in well under 20 ms on a 6x6 board, whatever is cited', () => {
    for (const c of [OFA_02, OFA_03]) {
      const ids = doubtable(c)
      const sets = subsets(ids, 5).filter((_, i) => i % 7 === 0)
      const times: number[] = []
      for (const set of sets) {
        const t = performance.now()
        satisfiable(c, set)
        times.push(performance.now() - t)
      }
      times.sort((a, b) => a - b)
      const mean = times.reduce((a, b) => a + b, 0) / times.length
      // typically ~0.03 ms; the bounds are loose so that a pause in a busy run cannot fail the suite
      expect(mean).toBeLessThan(5)
      expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(20)
    }
  })
})

describe('exposure and core enumeration', () => {
  it('finds an order of witnesses that pins each to at most two tiles, for every stored collision', () => {
    for (const c of ALL) for (const core of c.collisions) {
      const e = exposure(c, core)
      expect(e.ok, `${c.id} ${core.join(',')}: ${e.detail}`).toBe(true)
      expect(e.maxTiles).toBeLessThanOrEqual(2)
    }
  })

  it('says so when a witness is too loose to pin', () => {
    // Tomé is only said to have been in the Kitchen: six squares, never pinned to two
    const c = variant(replace('s6', { kind: 'room', person: 'p2', roomId: 'room0' }, 'In the Kitchen.'), {}, OFA_01)
    const e = exposure(c, ['s4', 's5', 's6'])
    expect(e.ok).toBe(false)
    expect(e.maxTiles).toBeNull()
    expect(exposure(OFA_01, ['s4', 's5', 's6']).ok).toBe(true)
  })

  it('enumerates every minimal contradiction of size <= 4, each holding the lie, the stored ones included', () => {
    for (const c of ALL) {
      const cores = findMinimalCores(c, 4)
      for (const core of cores) expect(core).toContain(c.lieId)
      for (const stored of c.collisions) expect(cores.some(k => k.length === stored.length && stored.every(id => k.includes(id)))).toBe(true)
    }
  })
})

describe('legibility and reconstruction helpers', () => {
  const c = OFA_02
  const p = c.puzzle
  const truths = c.statements.filter(s => s.id !== c.lieId)

  it('finds a collision in all statements by singles', () => {
    expect(legibility(p, c.statements).level).toBe(0)
  })

  it('cannot reconstruct the plan from too few statements', () => {
    expect(reconstruct(p, truths.slice(0, 3)).placed).toBeNull()
  })

  it('reconstructs the plan from the true statements with one suppose, and singles alone leave the liar unplaced', () => {
    const r = reconstruct(p, truths)
    expect(r.supposes).toBe(1)
    expect(r.placed).not.toBeNull()
    for (const id of Object.keys(p.solution)) expect(r.placed![id]).toEqual({ row: p.solution[id].row, col: p.solution[id].col })
    const singles = placedBySingles(p, truths)
    expect(singles.p4).toBeUndefined()
    expect(Object.keys(singles).length).toBeGreaterThan(0)
  })

  it('a first case reconstructs by singles alone, liar included', () => {
    const t = OFA_01.statements.filter(s => s.id !== OFA_01.lieId)
    const r = reconstruct(OFA_01.puzzle, t)
    expect(r.supposes).toBe(0)
    expect(placedBySingles(OFA_01.puzzle, t).p1).toBeDefined()
  })
})
