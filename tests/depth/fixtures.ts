// Loads the accepted depth cases saved next to the tests. Each file is
// { config, seed, puzzle } where `puzzle` is the full Puzzle the generator produced.
import type { Puzzle } from '../../src/core/types'

export interface DepthFixture { name: string; config: 'A' | 'B' | 'C' | 'D' | 'E'; seed: number; puzzle: Puzzle }

const files = import.meta.glob<{ config: DepthFixture['config']; seed: number; puzzle: Puzzle }>('./fixtures/*.json', {
  eager: true,
  import: 'default',
})

export function loadFixtures(): DepthFixture[] {
  return Object.keys(files)
    .sort()
    .map(path => {
      const raw = files[path]
      return { name: path.replace(/^.*\//, '').replace(/\.json$/, ''), config: raw.config, seed: raw.seed, puzzle: raw.puzzle }
    })
}
