// Small seeded PRNG for the depth generator. generate.ts keeps its own module
// level generator private, so everything in this folder that needs randomness
// draws from an explicit instance created from a seed. Same seed, same stream.

export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [0, n). */
  int(n: number): number
  pick<T>(arr: readonly T[]): T
  shuffle<T>(arr: readonly T[]): T[]
}

/** mulberry32: 32-bit state, good enough for layout and ordering decisions. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n: number): number => Math.floor(next() * n)
  return {
    next,
    int,
    pick: arr => arr[int(arr.length)],
    shuffle: arr => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
}

/** FNV-1a, for turning (label, index) into a seed. */
export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
