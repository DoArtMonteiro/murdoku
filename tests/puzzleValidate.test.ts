import { describe, expect, it } from 'vitest'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { AUTHORED_CASES } from '../src/data/cases'
import { initCatalog, getAllPuzzles } from '../src/core/catalog'
import type { Puzzle } from '../src/core/types'
import {
  validatePuzzle, validatePuzzleQuality, validatePuzzleSceneCompatibility, validatePuzzleForProduction, difficultyMetrics,
} from '../src/core/puzzleValidate'

const clone = (p: Puzzle): Puzzle => JSON.parse(JSON.stringify(p))
const midnight = () => buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')
const codes = (p: Puzzle) => validatePuzzle(p).map(i => i.code)

describe('puzzle validator — a known-good case passes', () => {
  it('Midnight Delivery has zero structural, mathematical or scene-compatibility errors', () => {
    const p = midnight()
    expect(validatePuzzle(p)).toEqual([])
    expect(validatePuzzleSceneCompatibility(p).filter(i => i.severity === 'error')).toEqual([])
    const { metrics } = validatePuzzleQuality(p)
    expect(metrics.people).toBe(4)
    expect(metrics.forcedBySingles).toBeGreaterThanOrEqual(1)
  })
})

describe('puzzle validator — mutations are caught', () => {
  it('a removed clue that breaks uniqueness → multiple-solutions', () => {
    const p = clone(midnight())
    const seen = new Set<string>()
    p.clues = p.clues.filter(c => { if (c.clue.kind === 'victim') return true; if (seen.has(c.clue.person)) return false; seen.add(c.clue.person); return true })
    expect(codes(p)).toContain('multiple-solutions')
  })
  it('a clue that contradicts the stated solution → clue-contradiction / no-solution', () => {
    const p = clone(midnight())
    const someone = p.people[1].id
    const wrongRow = (p.solution[someone].row + 1) % p.size
    p.clues.push({ clue: { kind: 'row', person: someone, row: wrongRow }, text: 'In a row they were never in.' })
    const c = codes(p)
    expect(c.some(x => x === 'clue-contradiction' || x === 'no-solution')).toBe(true)
  })
  it('an identical clue twice → clue-duplicate', () => {
    const p = clone(midnight())
    const first = p.clues.find(c => c.clue.kind !== 'victim')!
    p.clues.push({ ...first })
    expect(validatePuzzleQuality(p).issues.map(i => i.code)).toContain('clue-duplicate')
  })
  it('a clue naming an unknown person → clue-person-unknown', () => {
    const p = clone(midnight())
    p.clues.push({ clue: { kind: 'row', person: 'ghost', row: 0 }, text: 'Nobody.' })
    expect(codes(p)).toContain('clue-person-unknown')
  })
  it('a clue naming furniture that is not on the board → clue-furniture-absent', () => {
    const p = clone(midnight())
    p.clues.push({ clue: { kind: 'onFurniture', person: p.people[1].id, furniture: 'bathtub' }, text: 'In the bath.' })
    expect(codes(p)).toContain('clue-furniture-absent')
  })
  it('two victims → victim-count', () => {
    const p = clone(midnight())
    p.people[1].isVictim = true
    expect(codes(p)).toContain('victim-count')
  })
  it('overlapping furniture → furniture-overlap', () => {
    const p = clone(midnight())
    p.furniture.push({ type: 'plant', row: p.furniture[0].row, col: p.furniture[0].col })
    expect(codes(p)).toContain('furniture-overlap')
  })
  it('two people in one row → solution-rows', () => {
    const p = clone(midnight())
    p.solution[p.people[1].id] = { ...p.solution[p.people[1].id], row: p.solution[p.people[0].id].row }
    expect(codes(p)).toContain('solution-rows')
  })
  it('room map disagreeing with rooms → room-map-mismatch', () => {
    const p = clone(midnight())
    p.roomOf[0][0] = p.rooms[1].id
    expect(codes(p)).toContain('room-map-mismatch')
  })
  it('a suspect placed with the victim by clue → clue-reveals-murderer', () => {
    const p = clone(midnight())
    p.clues.push({ clue: { kind: 'sameRoomAs', person: p.victimId, other: p.murdererId }, text: 'With him.' })
    expect(validatePuzzleQuality(p).issues.map(i => i.code)).toContain('clue-reveals-murderer')
  })
  it('a murderer that is not alone with the victim → murderer-mismatch', () => {
    const p = clone(midnight())
    p.murdererId = p.people.find(x => x.id !== p.murdererId && x.id !== p.victimId)!.id
    expect(codes(p)).toContain('murderer-mismatch')
  })
  it('a room name outside the scene vocabulary → room-name-unusual (warning)', () => {
    const p = clone(midnight())
    p.rooms[0].name = 'Teleporter Bay'
    expect(validatePuzzleSceneCompatibility(p).map(i => i.code)).toContain('room-name-unusual')
  })
  it('two rooms with one name → room-name-duplicate (an ambiguous clue text)', () => {
    const p = clone(midnight())
    p.rooms[1].name = p.rooms[0].name
    expect(validatePuzzleSceneCompatibility(p).map(i => i.code)).toContain('room-name-duplicate')
  })
})

describe('puzzle validator — the shipped catalog', () => {
  it('every catalog case passes structure and mathematics, and no clue names the murderer', () => {
    initCatalog()
    const failures: string[] = []
    for (const p of getAllPuzzles()) {
      const errors = validatePuzzleForProduction(p).issues.filter(i => i.severity === 'error')
      if (errors.length) failures.push(`${p.id}: ${errors.map(e => e.code).join(', ')}`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
  it('difficulty metrics are computable for every case', () => {
    initCatalog()
    for (const p of getAllPuzzles()) {
      const m = difficultyMetrics(p)
      expect(m.people).toBeGreaterThan(1)
      expect(m.forcedBySingles + m.needsSearch).toBe(m.people)
      expect(Number.isFinite(m.startingCandidateEntropy)).toBe(true)
      expect(m.startingCandidateEntropy).toBeGreaterThanOrEqual(0)
      expect(m.propagationRounds).toBeGreaterThanOrEqual(0)
      expect(m.relationalClues).toBeGreaterThanOrEqual(0)
      expect(m.crossFloorClues).toBeGreaterThanOrEqual(0)
      expect(m.redundantClues).toBeGreaterThanOrEqual(0)
    }
  })

  it('measures the authored two-storey reference as cross-floor work', () => {
    initCatalog()
    const hard = getAllPuzzles().find(p => p.id === 'hard-1')!
    const m = difficultyMetrics(hard)

    expect(m.crossFloorClues).toBeGreaterThan(0)
    expect(m.startingCandidateEntropy).toBeGreaterThan(0)
  })
})
