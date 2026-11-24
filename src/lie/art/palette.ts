// Token colour. A suspect's token is a filled tile in a deep version of their accent, with a
// chalk emblem and border on it. The deep tint is derived here, in TS, so the emblem always
// clears WCAG graphics contrast (3:1) whatever accent a case file hands us. Pure functions.

/** Fixed light ink for emblems and borders on a token, in both themes (mirrors --chalk in tokens.css). */
export const CHALK = '#F4EFE4'
/** Used when a person has no usable accent. Deep cobalt, 8.46:1 under chalk. */
export const FALLBACK_TINT = '#1F3F8F'
/** The lowest contrast of chalk over a deep tint that deepTint() will settle for. */
export const MIN_TOKEN_CONTRAST = 4.5

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function parse(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex.trim())
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map(x => x + x).join('') : m[1]
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
const toHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase()

/** WCAG 2.x relative luminance of a #rgb / #rrggbb colour. */
export function luminance(hex: string): number {
  const rgb = parse(hex) ?? [0, 0, 0]
  const [r, g, b] = rgb.map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

const cache = new Map<string, string>()

/**
 * The accent, kept in its hue and darkened until chalk reads on it at 4.5:1 or better.
 * Greys stay grey; a missing or malformed accent gives the cobalt fallback.
 */
export function deepTint(accent: string | undefined | null): string {
  const key = accent ?? ''
  const hit = cache.get(key)
  if (hit) return hit
  const rgb = accent ? parse(accent) : null
  let out = FALLBACK_TINT
  if (rgb) {
    const [h, s0, l0] = toHsl(rgb)
    // muted accents get a little more chroma so five suspects stay tellable apart once darkened
    const s = s0 < 0.04 ? s0 : Math.min(0.7, Math.max(s0 * 1.2, 0.3))
    let l = Math.min(l0, 0.5)
    out = fromHsl(h, s, l)
    while (contrast(CHALK, out) < MIN_TOKEN_CONTRAST + 0.3 && l > 0.1) {
      l -= 0.01
      out = fromHsl(h, s, l)
    }
  }
  cache.set(key, out)
  return out
}
