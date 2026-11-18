import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { compareText } from '../src/core/compare'

// Puzzles are generated in each player's browser, so what a player sees must not
// depend on the language the browser is set to. The digest below is the one of
// the catalogue built before the clue ordering stopped using `localeCompare`; a
// change to it is a change to every player's puzzles and saved progress, and has
// to be a decision, not a side effect.
const CATALOGUE_SHA256 = 'ba6c7d93b2926f7e9d0fb074827e8bfb258d3a1eed06d7ccf03ae5c169b4724d'

describe('compareText', () => {
  it('orders by UTF-16 code unit, whatever the language of the browser', () => {
    expect(['b', 'B', 'a', 'A', 'i', 'I', 'ı', '_', '"', '1'].sort(compareText)).toEqual(
      ['"', '1', 'A', 'B', 'I', '_', 'a', 'b', 'i', 'ı'],
    )
    expect(compareText('floor', 'floorNum')).toBeLessThan(0)
    expect(compareText('same', 'same')).toBe(0)
  })
})

describe('catalogue determinism', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('builds the same 60 cases without ever asking the locale to order a string', async () => {
    // Any locale-sensitive comparison on the generator path would hit this.
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('locale-dependent ordering on the puzzle generation path')
    })
    localStorage.clear()
    vi.resetModules()
    const { getAllPuzzles } = await import('../src/core/catalog')
    const puzzles = getAllPuzzles()
    expect(puzzles).toHaveLength(60)
    expect(localeCompare).not.toHaveBeenCalled()
    expect(createHash('sha256').update(JSON.stringify(puzzles)).digest('hex')).toBe(CATALOGUE_SHA256)
  })
})
