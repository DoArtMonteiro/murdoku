import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BoardLabels, boardLayout } from '../../src/reference/boards/illustrated'
import { LABEL_TIGHT_FS, displayLabel, labelPlateOf, placeLabels, variants } from '../../src/reference/boards/illustrated/labels'
import { LABEL_FONT, LABEL_INK, LABEL_PLATE } from '../../src/reference/boards/illustrated/labelsView'
import { evidenceKeepClear } from '../../src/reference/boards/illustrated/keepClear'
import { illustratedPlan } from '../../src/reference/boards/illustrated/plan'
import { STYLES, styleIdFor } from '../../src/reference/boards/illustrated/styles'
import { occupiedBoxes } from '../../src/reference/tokenGeometry'
import { ALL_CASES, floorsOf } from '../boardLegibility/cases'

const ROOMS = [...new Set(ALL_CASES.flatMap(p => p.rooms.map(r => r.name)))]
const hit = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

/** Relative luminance of a #rrggbb colour (WCAG 2.x). */
function lum(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const hex = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
/** The plate colour over a floor: the plate is translucent. */
const over = (floor: [number, number, number]): [number, number, number] => hex(LABEL_PLATE.fill).map((p, i) => p * LABEL_PLATE.opacity + floor[i] * (1 - LABEL_PLATE.opacity)) as [number, number, number]

describe('one label style for every pack', () => {
  it('sets names in Title Case, from the upper-case key', () => {
    expect(displayLabel('LIVING ROOM')).toBe('Living Room')
    expect(displayLabel('BATH')).toBe('Bath')
    expect(displayLabel('CONSERV.')).toBe('Conserv.')
  })

  it('draws every pack in the interface face, one weight, no stroke, no heavy outline', () => {
    expect(LABEL_FONT).toMatch(/^'Hanken Grotesk'/)
    const styles = new Set<string>()
    for (const p of ALL_CASES) {
      const id = styleIdFor(p)
      if (styles.has(id)) continue
      styles.add(id)
      const floor = 0
      const layout = boardLayout(390, 390, p.size)
      const html = renderToStaticMarkup(createElement(BoardLabels, { puzzle: p, floor, width: 390, height: 390, layout, theme: 'dark' }))
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
      const texts = [...doc.querySelectorAll('text')]
      expect(texts.length, id).toBeGreaterThan(0)
      for (const t of texts) {
        expect(t.getAttribute('font-family'), id).toContain('Hanken Grotesk')
        expect(t.getAttribute('font-weight'), id).toBe('600')
        expect(t.getAttribute('stroke'), id).toBeNull()
        const key = t.parentElement!.getAttribute('data-label')!
        expect(t.textContent, id).toBe(displayLabel(key))
        expect(t.textContent, id).not.toBe(t.textContent!.toUpperCase())
      }
      for (const r of doc.querySelectorAll('rect')) expect(+r.getAttribute('fill-opacity')!, id).toBeLessThan(0.9)
    }
    expect(styles.size).toBe(5)
  })

  it('reads at 4.5:1 or better over the lightest floor of every pack, and over plain white', () => {
    const light: [number, number, number][] = [[255, 255, 255]]
    for (const kit of Object.values(STYLES)) {
      for (const f of Object.values(kit.floors)) {
        for (const c of [f.a, f.b, f.c, f.band?.color]) if (c && /^#[0-9a-f]{6}$/i.test(c)) light.push(hex(c))
      }
    }
    expect(light.length).toBeGreaterThan(40)
    let worst = 99
    for (const floor of light) worst = Math.min(worst, ratio(lum(hex(LABEL_INK)), lum(over(floor))))
    expect(worst).toBeGreaterThanOrEqual(4.5)
  })
})

describe('abbreviations are real words', () => {
  it('no variant is a stub: at least three letters, and only "Bed" is that short', () => {
    for (const r of ROOMS) for (const v of variants(r)) {
      expect(v.length, `${r} -> ${v}`).toBeGreaterThanOrEqual(3)
      if (v.length === 3) expect(v, r).toBe('BED')
      expect(v, r).not.toBe('ROOM')
    }
    expect(variants('Bathroom')).toContain('BATH')
    expect(variants('Hallway')).toContain('HALL')
    expect(variants('Bedroom')).toContain('BED')
  })

  it('on a 320 px phone (cells of 24 to 29 px) every plate is a whole variant, never a stub, and 10 px only there', () => {
    let tight10 = 0, plates = 0, full = 0
    const bad: string[] = []
    for (const p of ALL_CASES) for (const floor of floorsOf(p)) for (const u of [24, 26, 28, 29]) {
      const ls = placeLabels(illustratedPlan(p, floor, u), u, evidenceKeepClear(p.id))
      for (const l of ls) {
        plates++
        const room = p.rooms.find(r => r.id === l.roomId)!.name
        if (!variants(room).includes(l.text)) bad.push(`${p.id} f${floor} @${u}: "${l.text}" is not a variant of ${room}`)
        if (l.text.length < 3) bad.push(`${p.id} @${u}: stub ${l.text}`)
        if (l.fs < LABEL_TIGHT_FS) bad.push(`${p.id} @${u}: ${l.fs}px`)
        if (l.fs === LABEL_TIGHT_FS) tight10++
        if (l.text === variants(room)[0]) full++
      }
    }
    expect(bad.slice(0, 20)).toEqual([])
    expect(tight10).toBeGreaterThan(0)
    // dropping the padding and shrinking to 10 px keeps nearly every name whole
    expect(full / plates).toBeGreaterThan(0.9)
  })

  it('from 30 px up the type never drops below 11 px', () => {
    for (const p of ALL_CASES.slice(0, 20)) for (const u of [30, 37, 50]) {
      for (const l of placeLabels(illustratedPlan(p, 0, u), u, evidenceKeepClear(p.id))) expect(l.fs).toBeGreaterThanOrEqual(11)
    }
  })
})

describe('plates keep clear of a token and its badge', () => {
  it('no plate drawn at full opacity comes within 2 px of a token box', () => {
    const bad: string[] = []
    let seed = 11
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
    for (const p of ALL_CASES.slice(0, 24)) for (const u of [24, 30, 37, 56]) {
      const plan = illustratedPlan(p, 0, u)
      const occ = new Set<string>()
      for (let r = 0; r < p.size; r++) if (rand() < 0.8) occ.add(`${r}:${Math.floor(rand() * p.size)}`)
      const boxes = occupiedBoxes(occ, u)
      const pad = 2 / u
      for (const l of placeLabels(plan, u, evidenceKeepClear(p.id), boxes)) {
        if (l.faded) continue
        const plate = labelPlateOf(l)
        if (boxes.some(b => hit(plate, [b[0] - pad + 1e-6, b[1] - pad + 1e-6, b[2] + pad - 1e-6, b[3] + pad - 1e-6]))) bad.push(`${p.id} @${u}: ${l.text}`)
      }
    }
    expect(bad.slice(0, 20)).toEqual([])
  })
})
