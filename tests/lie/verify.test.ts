import { describe, expect, it } from 'vitest'
import { LIE_CASE_1 } from '../../src/lie/case1'
import type { LieCase, Statement } from '../../src/lie/model'
import { findMinimalCores, legibility, reconstruct, verifyLieCase } from '../../src/lie/verify'

/** A deep copy of ofa-01 with `edit` applied to its statements; puzzle.clues is rebuilt from them (lie excluded). */
function variant(edit: (stmts: Statement[]) => Statement[], patch: Partial<LieCase> = {}): LieCase {
  const base = structuredClone(LIE_CASE_1)
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

const withoutId = (id: string) => (stmts: Statement[]) => stmts.filter(s => s.id !== id)

describe('verifyLieCase: the sound case', () => {
  it('passes ofa-01 and returns a report', () => {
    const r = verifyLieCase(LIE_CASE_1)
    expect(r.failures).toEqual([])
    expect(r.ok).toBe(true)
    expect(r.report.legibilityLevel).toBe(0)
  })
})

describe('verifyLieCase: negative fixtures', () => {
  it('catches a second lie: a "true" statement that is false in the plan', () => {
    const r = verifyLieCase(variant(stmts => stmts.map(s => (s.id === 's5'
      ? { ...s, clue: { kind: 'onFurniture' as const, person: 'p2', furniture: 'stove' as const }, text: 'On the stove.' }
      : s))))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: true statement s5 does not hold in puzzle.solution')
  })

  it('catches a lie that is actually true in the plan', () => {
    const r = verifyLieCase(variant(stmts => stmts.map(s => (s.id === 's3'
      ? { ...s, clue: { kind: 'onFurniture' as const, person: 'p1', furniture: 'shrub' as const }, text: 'On the shrub.' }
      : s))))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: the lie s3 holds in puzzle.solution')
  })

  it('catches a lie that leaves a consistent world (check 1)', () => {
    // without s1, s2 and s9 no collision is left, so the lie contradicts nothing
    const r = verifyLieCase(variant(stmts => stmts.filter(s => !['s1', 's2', 's9'].includes(s.id))))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 1: all statements together still have a solution')
  })

  it('catches a wrong doubt that also solves (check 3)', () => {
    // a lie that only collides through s1 and s7: doubting s1 or s7 instead also gives a consistent world
    const r = verifyLieCase(variant(stmts => stmts.map(s => (s.id === 's3'
      ? { ...s, clue: { kind: 'room' as const, person: 'p1', roomId: 'room1' }, text: 'In the Workshop.' }
      : s))))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 3: doubting s1 instead of the lie leaves a consistent world')
    expect(r.failures).toContain('check 3: doubting s7 instead of the lie leaves a consistent world')
  })

  it('catches collisions that share more than the lie, and a non-minimal collision (check 4)', () => {
    const r = verifyLieCase(variant(s => s, { collisions: [['s3', 's9'], ['s3', 's9', 's1']] }))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 4: the collisions intersect in [s3, s9], expected only s3')
    expect(r.failures).toContain('check 4 (collision 2): not minimal, s1 is not needed')
  })

  it('catches a collision that does not contain the lie, or is satisfiable (check 4)', () => {
    const r = verifyLieCase(variant(s => s, { collisions: [['s1', 's9'], ['s3', 's1']] }))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('check 4 (collision 1): does not contain the lie')
    expect(r.failures).toContain('check 4 (collision 2): is satisfiable, not a collision')
  })

  it('catches two collisions that lean on the same other author (check 4)', () => {
    // both collisions lean on Lúcia: s9 in the first, s10 in the second
    const r = verifyLieCase(variant(s => s, { collisions: [['s3', 's9'], ['s3', 's10', 's1', 's7']] }))
    expect(r.failures).toContain('check 4: the two collisions share an author besides the liar')
  })

  it('catches uneven statement counts between suspects (check 6)', () => {
    const r = verifyLieCase(variant(withoutId('s2')))
    expect(r.ok).toBe(false)
    expect(r.failures.some(f => f.startsWith('check 6: statement counts differ'))).toBe(true)
  })

  it('catches a murderer id that is not the liar', () => {
    const base = structuredClone(LIE_CASE_1)
    base.puzzle.murdererId = 'p0'
    const r = verifyLieCase(base)
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: puzzle.murdererId p0 is not the lie author p1')
  })

  it('catches puzzle.clues that drifted from the statements', () => {
    const base = structuredClone(LIE_CASE_1)
    base.puzzle.clues = base.puzzle.clues.filter(ct => ct.text !== 'On the rug.')
    const r = verifyLieCase(base)
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: puzzle.clues (without the victim marker) is not exactly the statements minus the lie, in order')
  })

  it('refuses a clue kind the mode does not allow', () => {
    const r = verifyLieCase(variant(stmts => stmts.map(s => (s.id === 's4'
      ? { ...s, clue: { kind: 'corner' as const, person: 'p1' }, text: 'In a corner of the board.' }
      : s))))
    expect(r.ok).toBe(false)
    expect(r.failures).toContain('structure: s4 uses clue kind corner, which this mode does not allow')
  })

  it('refuses a stepped direction and a statement about the victim', () => {
    const r = verifyLieCase(variant(stmts => stmts.map(s => (s.id === 's10'
      ? { ...s, clue: { kind: 'direction' as const, person: 'p4', other: 'p5', dir: 'N' as const, steps: 2 }, text: 'Exactly 2 rows north of Álvaro.' }
      : s))))
    expect(r.failures).toContain('structure: s10 is a stepped direction')
    expect(r.failures).toContain('structure: s10 is relational to the victim')
  })
})

describe('legibility and reconstruction helpers', () => {
  const p = LIE_CASE_1.puzzle
  const truths = LIE_CASE_1.statements.filter(s => s.id !== LIE_CASE_1.lieId)

  it('finds no collision in the true statements alone: singles simply place everybody', () => {
    expect(legibility(p, truths).level).toBeNull()
  })

  it('finds a collision in all statements', () => {
    expect(legibility(p, LIE_CASE_1.statements).level).toBe(0)
  })

  it('cannot reconstruct the plan from too few statements', () => {
    expect(reconstruct(p, truths.slice(0, 3)).placed).toBeNull()
  })

  it('reconstructs the plan from the true statements by singles', () => {
    const r = reconstruct(p, truths)
    expect(r.supposes).toBe(0)
    expect(r.placed).not.toBeNull()
    for (const id of Object.keys(p.solution)) expect(r.placed![id].row).toBe(p.solution[id].row)
  })

  it('finds both stored collisions among the minimal ones of size <= 4', () => {
    const cores = findMinimalCores(p, LIE_CASE_1.statements, LIE_CASE_1.lieId, 4)
    for (const stored of LIE_CASE_1.collisions) expect(cores.some(c => c.length === stored.length && stored.every(id => c.includes(id)))).toBe(true)
  })
})
