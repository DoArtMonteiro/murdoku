import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { LEGACY_FINGERPRINTS } from '../../src/core/legacyFingerprints'
import {
  loadCaseState, loadRecords, puzzleFingerprint, purgeCaseProgress, reconcileProgress, saveCaseState,
} from '../../src/core/progress'
import {
  CASE_STATE_KEY, CATALOG_KEY_PREFIX, FINGERPRINT_KEY, RECORDS_KEY, SOLVED_KEY, UPPER_FLOOR_KEY,
} from '../../src/core/storage'
import { CASE_NOTES_KEY, IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY } from '../../src/core/ux'

const puzzles = getAllPuzzles()
const byId = (id: string) => puzzles.find(p => p.id === id)!

describe('puzzle fingerprint', () => {
  const p = byId('hard-4')

  it('is stable and distinct per case', () => {
    expect(puzzleFingerprint(p)).toBe(puzzleFingerprint(structuredClone(p)))
    expect(new Set(puzzles.map(puzzleFingerprint)).size).toBe(60)
  })

  it('changes when anything that decides the puzzle changes', () => {
    const base = puzzleFingerprint(p)
    const clone = () => structuredClone(p)
    const mutants: Record<string, (q: ReturnType<typeof clone>) => void> = {
      'a clue': q => { q.clues[0].clue = { ...q.clues[0].clue, person: q.people[q.people.length - 1].id } },
      'the clue order': q => { q.clues.reverse() },
      'one clue removed': q => { q.clues.splice(0, 1) },
      'the solution': q => { const [a, b] = q.people; [q.solution[a.id], q.solution[b.id]] = [q.solution[b.id], q.solution[a.id]] },
      'a furniture piece': q => { q.furniture[0].col = (q.furniture[0].col + 1) % q.size },
      'a furniture type': q => { q.furniture[0].type = q.furniture[0].type === 'lamp' ? 'clock' : 'lamp' },
      'a room name': q => { q.rooms[0].name += 'X' },
      'a room cell': q => { q.rooms[0].cells.pop() },
      'a name': q => { q.people[0].name += 'X' },
      'the victim': q => { q.victimId = q.people.find(x => x.id !== q.victimId)!.id },
    }
    for (const [what, mutate] of Object.entries(mutants)) {
      const q = clone(); mutate(q)
      expect(puzzleFingerprint(q), what).not.toBe(base)
    }
  })

  it('ignores what does not change the puzzle: wording, hues, rotations, portraits, title', () => {
    const q = structuredClone(p)
    q.clues.forEach(c => { c.text += ' (reworded)' })
    q.rooms.forEach(r => { r.hue = (r.hue + 90) % 360 })
    q.furniture.forEach(f => { f.rotation = 90 })
    q.people.forEach(x => { x.avatarSeed += 'x'; x.accent = '#000000' })
    q.title = 'Another Title'
    q.flavor = 'Another flavour.'
    expect(puzzleFingerprint(q)).toBe(puzzleFingerprint(p))
  })
})

describe('legacy fingerprints (catalog v25)', () => {
  it('cover every case of the shipped catalog', () => {
    expect(Object.keys(LEGACY_FINGERPRINTS)).toHaveLength(60)
    for (const p of puzzles) expect(LEGACY_FINGERPRINTS[p.id], p.id).toMatch(/^[0-9a-f]{14}$/)
  })

  it('very-easy-1 and hard-1 are content-identical to what v25 shipped (the reference case keeps its saved progress)', () => {
    expect(puzzleFingerprint(byId('very-easy-1'))).toBe(LEGACY_FINGERPRINTS['very-easy-1'])
    expect(puzzleFingerprint(byId('hard-1'))).toBe(LEGACY_FINGERPRINTS['hard-1'])
  })

  it('every one of the seven formerly broken cases differs from v25, so none keeps a stale tick', () => {
    for (const id of ['hard-9', 'hard-10', 'hard-12', 'expert-5', 'master-1', 'master-2', 'master-4']) {
      expect(puzzleFingerprint(byId(id)), id).not.toBe(LEGACY_FINGERPRINTS[id])
    }
  })
})

function seedAllProgress(ids: string[]) {
  localStorage.setItem(SOLVED_KEY, JSON.stringify(ids))
  localStorage.setItem(RECORDS_KEY, JSON.stringify(Object.fromEntries(ids.map(id => [id, { bestSeconds: 90, hints: 0 }]))))
  localStorage.setItem(CASE_NOTES_KEY, JSON.stringify({ version: 1, notes: Object.fromEntries(ids.map(id => [id, `note for ${id}`])) }))
  localStorage.setItem(CASE_STATE_KEY, JSON.stringify(Object.fromEntries(ids.map(id => [id, { fp: LEGACY_FINGERPRINTS[id], hinted: ['p0'], wrong: 1, attempts: 0 }]))))
}

describe('reconcileProgress', () => {
  const changed = puzzles.filter(p => puzzleFingerprint(p) !== LEGACY_FINGERPRINTS[p.id]).map(p => p.id)
  const same = puzzles.filter(p => puzzleFingerprint(p) === LEGACY_FINGERPRINTS[p.id]).map(p => p.id)
  const all = puzzles.map(p => p.id)

  it('progress saved before fingerprints existed is kept only for cases whose content did not change', () => {
    expect(changed.length).toBeGreaterThan(0)
    expect(same.length).toBeGreaterThan(0)
    seedAllProgress(all)
    const purged = reconcileProgress(puzzles)
    expect(new Set(purged)).toEqual(new Set(changed))
    expect(new Set(JSON.parse(localStorage.getItem(SOLVED_KEY)!))).toEqual(new Set(same))
    expect(new Set(Object.keys(JSON.parse(localStorage.getItem(RECORDS_KEY)!)))).toEqual(new Set(same))
    expect(new Set(Object.keys(JSON.parse(localStorage.getItem(CASE_NOTES_KEY)!).notes))).toEqual(new Set(same))
    expect(new Set(Object.keys(JSON.parse(localStorage.getItem(CASE_STATE_KEY)!)))).toEqual(new Set(same))
  })

  it('removes a half-finished board for a changed case and leaves one for an unchanged case', () => {
    const play = (id: string) => JSON.stringify({ id, mode: 'classic', marks: [], elapsed: 5, hints: 3, selected: null })
    localStorage.setItem(IN_PROGRESS_KEY, play('hard-9'))
    localStorage.setItem(LEGACY_IN_PROGRESS_KEY, play('hard-9'))
    localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: 'hard-9', marks: [] }))
    reconcileProgress(puzzles)
    expect(localStorage.getItem(IN_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_IN_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(UPPER_FLOOR_KEY)).toBeNull()

    localStorage.setItem(IN_PROGRESS_KEY, play('very-easy-1'))
    reconcileProgress(puzzles)
    expect(localStorage.getItem(IN_PROGRESS_KEY)).not.toBeNull()
  })

  it('records the fingerprints it has seen, and purges when a later catalog changes a case', () => {
    seedAllProgress(['easy-3', 'easy-4'])
    reconcileProgress(puzzles)
    const known = JSON.parse(localStorage.getItem(FINGERPRINT_KEY)!)
    expect(known['easy-3']).toBe(puzzleFingerprint(byId('easy-3')))
    // a newer catalog where easy-3 now has different content:
    const edited = structuredClone(puzzles)
    const easy3 = edited.find(p => p.id === 'easy-3')!
    easy3.clues.pop()
    localStorage.setItem(SOLVED_KEY, JSON.stringify(['easy-3', 'easy-8']))
    const purged = reconcileProgress(edited)
    expect(purged).toEqual(['easy-3'])
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual(['easy-8'])
    // unchanged afterwards: nothing more is purged
    expect(reconcileProgress(edited)).toEqual([])
  })

  it('purgeCaseProgress is safe on empty or corrupt storage', () => {
    localStorage.setItem(SOLVED_KEY, '[')
    localStorage.setItem(RECORDS_KEY, 'null')
    localStorage.setItem(CASE_NOTES_KEY, '"x"')
    localStorage.setItem(CASE_STATE_KEY, '7')
    localStorage.setItem(IN_PROGRESS_KEY, '{{')
    expect(() => purgeCaseProgress('hard-9')).not.toThrow()
  })
})

describe('per-case hint/accusation state', () => {
  const p = byId('easy-5')

  it('round-trips and is capped to sane values', () => {
    saveCaseState(p, { fp: puzzleFingerprint(p), hinted: ['p0', 'p1'], wrong: 2, attempts: 1, revealed: false })
    expect(loadCaseState(p)).toEqual({ fp: puzzleFingerprint(p), hinted: ['p0', 'p1'], wrong: 2, attempts: 1, revealed: false })
    localStorage.setItem(CASE_STATE_KEY, JSON.stringify({ [p.id]: { fp: puzzleFingerprint(p), hinted: ['p0', 'p0', 'zz', 7], wrong: 99, attempts: -4 } }))
    expect(loadCaseState(p)).toEqual({ fp: puzzleFingerprint(p), hinted: ['p0'], wrong: 3, attempts: 0, revealed: false })
  })

  it('is discarded when it was saved against different content', () => {
    saveCaseState(p, { fp: 'deadbeef', hinted: ['p0'], wrong: 3, attempts: 2, revealed: true })
    expect(loadCaseState(p)).toEqual({ fp: puzzleFingerprint(p), hinted: [], wrong: 0, attempts: 0, revealed: false })
  })

  it('records of the wrong shape are ignored one by one', () => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify({ a: { bestSeconds: 5, hints: 0 }, b: { bestSeconds: 'x', hints: 0 }, c: null, d: { bestSeconds: -1, hints: 0 }, e: [] }))
    expect(loadRecords()).toEqual({ a: { bestSeconds: 5, hints: 0 } })
  })
})

describe('catalog cache keys', () => {
  it('building the catalog removes caches written by earlier versions', async () => {
    localStorage.setItem(`${CATALOG_KEY_PREFIX}20`, '[]')
    localStorage.setItem(`${CATALOG_KEY_PREFIX}25`, '[]')
    reconcileProgress(puzzles) // does not touch caches
    const { vi } = await import('vitest')
    vi.resetModules()
    const fresh = await import('../../src/core/catalog')
    // seed a valid current cache so the fresh module adopts it without a rebuild
    localStorage.setItem(`${CATALOG_KEY_PREFIX}26`, JSON.stringify(puzzles))
    fresh.initCatalog()
    expect(localStorage.getItem(`${CATALOG_KEY_PREFIX}20`)).toBeNull()
    expect(localStorage.getItem(`${CATALOG_KEY_PREFIX}25`)).toBeNull()
    expect(localStorage.getItem(`${CATALOG_KEY_PREFIX}26`)).not.toBeNull()
    expect(fresh.getAllPuzzles()).toHaveLength(60)
  })
})
