import { afterEach, describe, expect, it, vi } from 'vitest'
import { compareText } from '../src/core/compare'

// The generator must not depend on the language of the machine it runs on. The
// catalogue players load is baked data guarded by tests/bakedCatalog.test.ts;
// this only guards the generator's own determinism for future cases.
describe('compareText', () => {
  it('orders by UTF-16 code unit, whatever the language of the browser', () => {
    expect(['b', 'B', 'a', 'A', 'i', 'I', 'ı', '_', '"', '1'].sort(compareText)).toEqual(
      ['"', '1', 'A', 'B', 'I', '_', 'a', 'b', 'i', 'ı'],
    )
    expect(compareText('floor', 'floorNum')).toBeLessThan(0)
    expect(compareText('same', 'same')).toBe(0)
  })
})

describe('generator determinism', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('builds the same 60 cases twice without ever asking the locale to order a string', async () => {
    // Any locale-sensitive comparison on the generator path would hit this.
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('locale-dependent ordering on the puzzle generation path')
    })
    const { buildCatalog } = await import('../src/core/catalogBuild')
    const first = buildCatalog()
    expect(first).toHaveLength(60)
    expect(JSON.stringify(buildCatalog())).toBe(JSON.stringify(first))
    expect(localeCompare).not.toHaveBeenCalled()
  })
})
