// Small colour + deterministic-noise helpers shared by every illustrated layer.

export type RGB = [number, number, number]

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const to2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
export function rgbToHex([r, g, b]: RGB): string {
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** Linear blend of two hex colours; t = 0 gives a, t = 1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b)
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t])
}
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t)
export const darken = (c: string, t: number) => mix(c, '#000000', t)

/** WCAG relative luminance, 0..1. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b)
  const hi = Math.max(la, lb), lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** Deterministic 32-bit string hash (FNV-1a). */
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** mulberry32 PRNG: same seed, same sequence, on every platform. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Round to 3 decimals so markup stays compact and identical across engines. */
export const f3 = (v: number) => +v.toFixed(3)

/** CIE L* (0..1) of a colour. */
export function lightness(hex: string): number {
  const y = luminance(hex)
  return (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y) / 100
}

/**
 * The overlay alpha that lifts `base` by `dL` of lightness (0..1) when a glow
 * colour is composited over it in sRGB space, as the browser does. Light pools
 * are authored against the floor they fall on so the lift in a cell centre is
 * the same on dark walnut as on pale terrazzo.
 */
export function lightAlpha(base: string, glow: string, dL: number): number {
  const target = lightness(base) + dL
  let lo = 0, hi = 1
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    if (lightness(mix(base, glow, mid)) < target) lo = mid
    else hi = mid
  }
  return +((lo + hi) / 2).toFixed(3)
}
