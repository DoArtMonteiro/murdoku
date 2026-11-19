import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { easy } from './fixtures'
import Casebook from '../../src/casebook/Casebook'
import { emptySave, loadSave, parseSave, saveKey, writeSave } from '../../src/casebook/save'
import { puzzleFingerprint } from '../../src/core/progress'
import type { Puzzle } from '../../src/core/types'

const cellAt = (r: number, c: number) => document.querySelector<HTMLElement>(`[role=gridcell][data-row="${r}"][data-col="${c}"]`)!
const placed = { ...emptySave(), placement: { p0: { row: 5, col: 0, floor: 0 } }, hintsUsed: 1 }
// Same id and size, one clue moved: a re-baked puzzle under the same case id.
const changed = (p: Puzzle): Puzzle => ({ ...p, solution: { ...p.solution, p0: { ...p.solution.p0, col: (p.solution.p0.col + 1) % p.size } } })

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('casebook saves carry the puzzle fingerprint', () => {
  it('writes the fingerprint with the save, under the same key', () => {
    writeSave(easy, placed)
    const stored = JSON.parse(localStorage.getItem(saveKey(easy.id))!)
    expect(stored.fp).toBe(puzzleFingerprint(easy))
    expect(stored.placement).toEqual(placed.placement)
  })

  it('loads a save made on this very puzzle', () => {
    writeSave(easy, placed)
    expect(loadSave(easy)).toEqual(placed)
  })

  it('discards a save whose puzzle has changed: nothing stale is applied', () => {
    writeSave(easy, placed)
    expect(puzzleFingerprint(changed(easy))).not.toBe(puzzleFingerprint(easy))
    expect(loadSave(changed(easy))).toEqual(emptySave())
  })

  it('discards a save with no fingerprint, or a wrong or malformed one', () => {
    const raw = { ...placed }
    expect(parseSave(easy, raw)).toEqual(emptySave())
    for (const fp of ['', 'deadbeef', 42, null, {}]) expect(parseSave(easy, { ...raw, fp })).toEqual(emptySave())
    localStorage.setItem(saveKey(easy.id), JSON.stringify(raw))
    expect(loadSave(easy)).toEqual(emptySave())
  })

  it('opens an old-fingerprint save on an empty plan, then saves the new plan under the new fingerprint', () => {
    writeSave(easy, placed)
    const next = changed(easy)
    render(<Casebook puzzle={next} />)
    expect(document.querySelectorAll('[data-testid^=token-]')).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(saveKey(next.id))!).fp).toBe(puzzleFingerprint(next))
    fireEvent.click(cellAt(5, 0))
    expect(JSON.parse(localStorage.getItem(saveKey(next.id))!).placement.p0).toEqual({ row: 5, col: 0, floor: 0 })
  })
})
