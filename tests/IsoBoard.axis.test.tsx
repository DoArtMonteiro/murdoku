import { readFileSync } from 'node:fs'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import IsoBoard from '../src/components/IsoBoard'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { AUTHORED_CASES } from '../src/data/cases'
import { resolveScene } from '../src/scene3d/resolve'
import { sceneFor } from '../src/scene3d/scenes'
import { CELL } from '../src/scene3d/units'
import { emptyMarks } from './fixtures'

const puzzle = buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')
const N = puzzle.size
const base = { puzzle, marks: emptyMarks(N), conflicts: new Set<string>(), onCellClick: vi.fn() }
const scene = resolveScene(sceneFor(puzzle, 0), N)
const frame = scene.frame

/** `calc(12.5% + 4px)` -> the percentage, which is the on-edge anchor before the outward nudge. */
const anchor = (style: string) => Number(/calc\(([-\d.]+)%/.exec(style)![1])
const numerals = (container: HTMLElement, kind: 'row' | 'col') =>
  [...container.querySelectorAll<HTMLElement>(`[data-axis-numeral="${kind}"]`)]

describe('isometric board coordinates', () => {
  it('prints rows 1..N and columns 1..N as permanent, decorative numerals', () => {
    const { container } = render(<IsoBoard {...base} />)
    for (const kind of ['row', 'col'] as const) {
      expect(numerals(container, kind).map(el => el.textContent)).toEqual(Array.from({ length: N }, (_, i) => String(i + 1)))
    }
    // the cells already announce "Row r, column c"; the numerals are sighted-only
    expect(container.querySelector('[data-axis-numerals]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-cell="0-0"]')).toHaveAttribute('aria-label', expect.stringMatching(/^Row 1, column 1/))
  })

  it('is at least 11px and does not shrink with the scaled board', () => {
    const { container } = render(<IsoBoard {...base} />)
    for (const el of container.querySelectorAll<HTMLElement>('[data-axis-numeral], [data-axis-title]')) {
      expect(parseFloat(el.style.fontSize), el.textContent ?? '').toBeGreaterThanOrEqual(11)
    }
  })

  it('anchors each numeral on the strip it names, from the same projection as the cell polygons', () => {
    const { container } = render(<IsoBoard {...base} />)
    const side = N * CELL
    numerals(container, 'row').forEach((el, i) => {
      const y = scene.floorY[i][N - 1]
      const edge = frame.project([side, y, (i + 0.5) * CELL])
      expect(anchor(el.style.left)).toBeCloseTo((edge[0] / frame.width) * 100, 3)
      expect(anchor(el.style.top)).toBeCloseTo((edge[1] / frame.height) * 100, 3)
    })
    numerals(container, 'col').forEach((el, i) => {
      const y = scene.floorY[N - 1][i]
      const edge = frame.project([(i + 0.5) * CELL, y, side])
      expect(anchor(el.style.left)).toBeCloseTo((edge[0] / frame.width) * 100, 3)
      expect(anchor(el.style.top)).toBeCloseTo((edge[1] / frame.height) * 100, 3)
    })
  })

  it('puts "top row" and "rightmost column" where the numerals say', () => {
    const { container } = render(<IsoBoard {...base} />)
    const rows = numerals(container, 'row'), cols = numerals(container, 'col')
    const centre = (r: number, c: number) => frame.project(frame.cellCentre(r, c, scene.floorY[r][c]))
    // numeral "1" of the row axis lies on the line through the cells of row 0 (the generator's "top row"),
    // numeral N of the column axis on the line through the cells of column N-1 (its "rightmost column").
    const onLine = (a: [number, number], b: [number, number], el: HTMLElement) => {
      const px = (anchor(el.style.left) / 100) * frame.width, py = (anchor(el.style.top) / 100) * frame.height
      const dx = b[0] - a[0], dy = b[1] - a[1]
      return Math.abs((px - a[0]) * dy - (py - a[1]) * dx) / Math.hypot(dx, dy)
    }
    expect(onLine(centre(0, 0), centre(0, N - 1), rows[0])).toBeLessThan(0.5)
    expect(onLine(centre(N - 1, 0), centre(N - 1, N - 1), rows[N - 1])).toBeLessThan(0.5)
    expect(onLine(centre(0, N - 1), centre(N - 1, N - 1), cols[N - 1])).toBeLessThan(0.5)
    expect(onLine(centre(0, 0), centre(N - 1, 0), cols[0])).toBeLessThan(0.5)
    // On screen: row 1 is the upper-right strip (its numeral is above row N's); column N is the strip
    // that ends at the screen's right-hand corner, so its cells are to the right of column 1's.
    expect(anchor(rows[0].style.top)).toBeLessThan(anchor(rows[N - 1].style.top))
    expect(centre(0, N - 1)[0]).toBeGreaterThan(centre(0, 0)[0])
    expect(centre(0, 0)[1]).toBeLessThan(centre(N - 1, 0)[1])
  })

  it('marks the active row and column numerals and words the caption to match', () => {
    const { container, getByRole } = render(<IsoBoard {...base} />)
    fireEvent.mouseEnter(container.querySelector('[data-cell="0-5"]')!)
    expect(container.querySelectorAll('[data-axis-active]')).toHaveLength(2)
    expect(container.querySelector('[data-axis-numeral="row"][data-axis-active]')).toHaveTextContent('1')
    expect(container.querySelector('[data-axis-numeral="col"][data-axis-active]')).toHaveTextContent('6')
    expect(getByRole('status')).toHaveTextContent(/^Row 1 · Column 6 · /)
  })
})

describe('axis numeral contrast against the page', () => {
  const css = readFileSync('src/styles/theme.css', 'utf8')
  const token = (block: string, name: string) => new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(block)![1]
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  const blocks = {
    dark: css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: light)')),
    light: css.slice(css.indexOf(':root.theme-light {'), css.indexOf(':root.theme-dark {')),
  }
  for (const theme of ['dark', 'light'] as const) {
    it(`uses a text token with at least 4.5:1 on the ${theme} page`, () => {
      const source = readFileSync('src/components/IsoBoard.tsx', 'utf8')
      expect(source).toContain("'var(--color-text-primary)'")
      expect(ratio(token(blocks[theme], '--color-text-primary'), token(blocks[theme], '--color-bg-base'))).toBeGreaterThanOrEqual(4.5)
    })
  }
})
