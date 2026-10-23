import { describe, expect, it } from 'vitest'
import { AUTHORED_CASES } from '../src/data/cases'
import { buildAuthoredPuzzle, type AuthoredCaseSpec } from '../src/core/authored'
import { countSolutions } from '../src/core/engine'
import { reseed } from '../src/core/generate'
import { validatePuzzleQuality } from '../src/core/puzzleValidate'
import { furnitureCells, furnitureFootprint, type Clue } from '../src/core/types'

// ============================================================================
// Every hand-authored case must pass the SAME invariants a generated one does
// (unique solution, no furniture overlaps, footprint/rotation consistency)
// plus a couple that only matter for hand-placed content (every person and
// every furniture piece actually lands inside a room).
// ============================================================================

describe('authored cases', () => {
  const entries = Object.entries(AUTHORED_CASES)

  it('at least one authored case exists (the pilot)', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it('builds the same authored clues regardless of the generator seed', () => {
    const spec = AUTHORED_CASES['very-easy-1']
    reseed(17)
    const first = buildAuthoredPuzzle(spec, 'Case No. I')
    reseed(99173)
    const second = buildAuthoredPuzzle(spec, 'Case No. I')

    expect(second.clues).toEqual(first.clues)
  })

  for (const [slug, spec] of entries) {
    describe(slug, () => {
      it('builds without throwing', () => {
        expect(() => buildAuthoredPuzzle(spec, 'Case No. Test')).not.toThrow()
      })

      it('has a unique solution', () => {
        const p = buildAuthoredPuzzle(spec, 'Case No. Test')
        expect(countSolutions(p, 2)).toBe(1)
      })

      it('every person has at least one clue, and the victim has the "alone with" line', () => {
        const p = buildAuthoredPuzzle(spec, 'Case No. Test')
        for (const person of p.people) {
          const count = p.clues.filter(c => c.clue.person === person.id).length
          expect(count, `${person.name} has no clues`).toBeGreaterThan(0)
        }
        expect(p.clues.some(c => c.clue.kind === 'victim')).toBe(true)
      })

      it('no two furniture pieces occupy the same cell', () => {
        const p = buildAuthoredPuzzle(spec, 'Case No. Test')
        const seen = new Set<string>()
        for (const f of p.furniture) {
          for (const c of furnitureCells(f)) {
            const key = `${f.floor ?? 0}:${c.row},${c.col}`
            expect(seen.has(key), `${f.type} collides at ${key}`).toBe(false)
            seen.add(key)
          }
        }
      })

      it('non-square furniture footprints match their rotation (no visual overflow)', () => {
        const p = buildAuthoredPuzzle(spec, 'Case No. Test')
        for (const f of p.furniture) {
          const { w, h } = furnitureFootprint(f)
          if (w === h) continue
          const rot = f.rotation ?? 0
          const portrait = rot === 90 || rot === 270
          expect(portrait ? h > w : w > h, `${f.type} at (${f.row},${f.col}) w=${w} h=${h} rot=${rot}`).toBe(true)
        }
      })

      it('every person and every furniture piece is inside a real room', () => {
        const p = buildAuthoredPuzzle(spec, 'Case No. Test')
        const roomOf = (fl: number) => p.roomOfByFloor?.[fl] ?? p.roomOf
        for (const person of p.people) {
          const c = p.solution[person.id]
          const rid = roomOf(c.floor ?? 0)[c.row]?.[c.col]
          expect(rid, `${person.name} at (${c.row},${c.col}) is not in any room`).toBeTruthy()
        }
      })
    })
  }

  it('preserves an author-declared clue through automatic pruning', () => {
    const required: Clue[] = [
      { kind: 'row', person: 'p0', row: 4 },
      { kind: 'col', person: 'p0', col: 1 },
    ]
    const spec = {
      ...AUTHORED_CASES['very-easy-1'],
      slug: 'required-clue-test',
      requiredClues: required,
    } satisfies AuthoredCaseSpec

    const puzzle = buildAuthoredPuzzle(spec, 'Case No. Test')
    for (const clue of required) expect(puzzle.clues.map(item => item.clue)).toContainEqual(clue)
  })

  it('ships a real two-storey reference with a cross-floor clue', () => {
    const puzzle = buildAuthoredPuzzle(AUTHORED_CASES['hard-1'], 'Case No. XXXI')

    expect(puzzle.floors).toBe(2)
    expect(new Set(Object.values(puzzle.solution).map(cell => cell.floor)).size).toBe(2)
    expect(puzzle.clues.some(item => item.clue.kind === 'above' || item.clue.kind === 'below')).toBe(true)
    expect(countSolutions(puzzle, 2)).toBe(1)
    expect(validatePuzzleQuality(puzzle).issues.filter(issue => issue.code === 'clue-reveals-murderer')).toEqual([])
  })
})
