import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Puzzle } from '../../src/core/types'
import { Gallery } from '../../src/lie/art/Gallery'
import { TilePlan, cellKey } from '../../src/lie/art/TilePlan'
import { EMBLEM_IDS, Emblem } from '../../src/lie/art/emblems'
import { furnitureByCell, roomLabels, roomMotifs, wallPaths } from '../../src/lie/art/plan'
import type { EmblemId } from '../../src/lie/model'
import { case0 } from '../../src/tutorial/case0'

afterEach(() => cleanup())

const ALL: EmblemId[] = ['scales', 'lantern', 'anchor', 'bell', 'net', 'key', 'needle', 'bread', 'quill', 'bottle', 'salt', 'compass']
const PEOPLE: Record<string, { name: string; emblem: EmblemId }> = {
  p0: { name: 'Lena', emblem: 'scales' },
  p1: { name: 'Tomas', emblem: 'net' },
  p2: { name: 'Greta', emblem: 'lantern' },
  p3: { name: 'Marco', emblem: 'bell' },
}
const sol = case0.solution

function plan(extra: Partial<Parameters<typeof TilePlan>[0]> = {}) {
  return render(<TilePlan puzzle={case0} people={PEOPLE} tokens={{ p0: sol.p0, p1: sol.p1, p3: sol.p3 }} victimId="p3" {...extra} />)
}

describe('emblems', () => {
  it('covers every EmblemId in the model and renders each one', () => {
    expect([...EMBLEM_IDS].sort()).toEqual([...ALL].sort())
    for (const id of ALL) {
      const { container, unmount } = render(<Emblem id={id} />)
      const svg = container.querySelector('svg')!
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).not.toHaveAttribute('role')
      expect(svg.querySelector('.lem-glyph')!.children.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('is an image with a name when given a title, and takes its size', () => {
    render(<Emblem id="anchor" size={64} title="Anchor" />)
    const img = screen.getByRole('img', { name: 'Anchor' })
    expect(img).toHaveAttribute('width', '64')
    expect(img).toHaveAttribute('height', '64')
    expect(img).not.toHaveAttribute('aria-hidden')
  })

  it('draws twelve different glyphs', () => {
    const drawn = ALL.map(id => {
      const { container, unmount } = render(<Emblem id={id} />)
      const html = container.querySelector('.lem-glyph')!.innerHTML
      unmount()
      return html
    })
    expect(new Set(drawn).size).toBe(ALL.length)
  })
})

describe('TilePlan', () => {
  it('has size x size gridcells whose labels name the room', () => {
    plan()
    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(case0.size * case0.size)
    expect(screen.getAllByRole('row')).toHaveLength(case0.size)
    const rooms = new Map(case0.rooms.map(r => [r.id, r.name]))
    cells.forEach((cell, i) => {
      const r = Math.floor(i / case0.size)
      const c = i % case0.size
      const label = cell.getAttribute('aria-label')!
      expect(label).toContain(`Row ${r + 1}, column ${c + 1}.`)
      expect(label).toContain(rooms.get(case0.roomOf[r][c])!)
    })
  })

  it('names furniture and occupants, and marks the victim', () => {
    plan()
    const label = (r: number, c: number) => screen.getAllByRole('gridcell')[r * 4 + c].getAttribute('aria-label')!
    expect(label(0, 0)).toContain('lamp')
    expect(label(3, 0)).toContain('clock')
    expect(label(3, 0)).toContain('Lena.')
    expect(label(2, 3)).toContain('plant')
    expect(label(2, 3)).toContain('Marco, the victim.')
    expect(label(0, 1)).not.toMatch(/Lena|Tomas|Marco/)
  })

  it('calls onTile on click and on Enter and Space, with the tile coordinates', () => {
    const onTile = vi.fn()
    plan({ onTile })
    const cells = screen.getAllByRole('gridcell')
    fireEvent.click(cells[5])
    expect(onTile).toHaveBeenLastCalledWith({ row: 1, col: 1 })
    fireEvent.keyDown(cells[2], { key: 'Enter' })
    expect(onTile).toHaveBeenLastCalledWith({ row: 0, col: 2 })
    fireEvent.keyDown(cells[15], { key: ' ' })
    expect(onTile).toHaveBeenLastCalledWith({ row: 3, col: 3 })
    expect(onTile).toHaveBeenCalledTimes(3)
  })

  it('moves focus with the arrow keys and keeps one tab stop', () => {
    plan()
    const cells = screen.getAllByRole('gridcell')
    expect(cells.filter(c => c.getAttribute('tabindex') === '0')).toHaveLength(1)
    cells[0].focus()
    fireEvent.keyDown(cells[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[1])
    fireEvent.keyDown(cells[1], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[5])
    fireEvent.keyDown(cells[5], { key: 'ArrowLeft' })
    fireEvent.keyDown(cells[4], { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[4])
    expect(screen.getAllByRole('gridcell').filter(c => c.getAttribute('tabindex') === '0')).toHaveLength(1)
  })

  it('fires onTileHold after 450ms of holding, swallows the click that follows, and not when moved', () => {
    vi.useFakeTimers()
    try {
      const onTile = vi.fn()
      const onTileHold = vi.fn()
      plan({ onTile, onTileHold })
      const cell = screen.getAllByRole('gridcell')[6]
      fireEvent.pointerDown(cell, { clientX: 10, clientY: 10 })
      act(() => { vi.advanceTimersByTime(449) })
      expect(onTileHold).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(2) })
      expect(onTileHold).toHaveBeenCalledWith({ row: 1, col: 2 })
      fireEvent.pointerUp(cell)
      fireEvent.click(cell)
      expect(onTile).not.toHaveBeenCalled()
      fireEvent.click(cell)
      expect(onTile).toHaveBeenCalledTimes(1)

      onTileHold.mockClear()
      fireEvent.pointerDown(cell, { clientX: 10, clientY: 10 })
      fireEvent.pointerMove(cell, { clientX: 40, clientY: 10 })
      act(() => { vi.advanceTimersByTime(600) })
      expect(onTileHold).not.toHaveBeenCalled()

      fireEvent.pointerDown(cell, { clientX: 10, clientY: 10 })
      fireEvent.pointerUp(cell)
      act(() => { vi.advanceTimersByTime(600) })
      expect(onTileHold).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows lit, blocked, collision, ghost, lifted and murderer states', () => {
    const { container } = plan({
      lit: new Set(['0,2', '0,3']),
      blocked: new Set(['2,0']),
      collision: new Set(['3,0', '1,1']),
      ghost: { person: 'p2', cell: { row: 0, col: 3 } },
      lifted: 'p1',
      murderer: 'p0',
      selectedPerson: 'p0',
    })
    expect(container.querySelectorAll('.lp-glaze[data-lit]')).toHaveLength(2)
    expect(container.querySelectorAll('.lp-blocked[data-on]')).toHaveLength(1)
    expect(container.querySelectorAll('.lp-crack')).toHaveLength(2)
    expect(container.querySelectorAll('.lp-ghost')).toHaveLength(1)
    expect(container.querySelectorAll('.lp-lift')).toHaveLength(1)
    expect(container.querySelector('.lp-lift')).toHaveAttribute('data-person', 'p1')
    expect(container.querySelectorAll('.lp-ring-murderer')).toHaveLength(1)
    expect(container.querySelectorAll('.lp-ring')).toHaveLength(1)
    const cells = screen.getAllByRole('gridcell')
    expect(cells[2].getAttribute('aria-label')).toContain('A statement can hold here.')
    expect(cells[12].getAttribute('aria-label')).toContain('Collision.')
    expect(cells[8].getAttribute('aria-label')).toContain('Ruled out.')
    expect(cells[3].getAttribute('aria-label')).toContain('Supposed: Greta.')
  })

  it('drops the ochre glaze under a collision, where almagre would sit on ochre', () => {
    const { container } = plan({ lit: new Set(['0,2', '1,1']), collision: new Set(['1,1']) })
    expect(container.querySelectorAll('.lp-glaze[data-lit]')).toHaveLength(1)
  })

  it('staggers the glaze by distance with buckets, not inline styles', () => {
    const { container } = plan({ lit: new Set(['0,0', '0,1', '1,2', '3,3']) })
    const d = [...container.querySelectorAll('.lp-glaze[data-lit]')].map(e => e.getAttribute('data-d'))
    expect(d).toEqual([null, '1', '3', '6'])
  })

  it('has no <style> elements and no inline style attributes (CSP: style-src self)', () => {
    const { container } = plan({
      lit: new Set(['0,2']), blocked: new Set(['2,0']), collision: new Set(['3,0']),
      ghost: { person: 'p2', cell: { row: 0, col: 3 } }, lifted: 'p1', murderer: 'p0', selectedPerson: 'p0',
      onTileHold: () => {},
    })
    expect(container.querySelectorAll('style')).toHaveLength(0)
    expect(container.querySelectorAll('[style]')).toHaveLength(0)
    expect(container.querySelectorAll('pattern, filter, clipPath, image, foreignObject, use')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/https?:/)
  })

  it('draws the victim differently from a suspect, and every suspect with their emblem', () => {
    const { container } = plan()
    expect(container.querySelectorAll('.lp-victim-ground')).toHaveLength(1)
    expect(container.querySelectorAll('.lp-token .lem-ground')).toHaveLength(2)
  })

  it('survives a token with no entry in people and an absent victim', () => {
    const { container } = render(<TilePlan puzzle={case0} people={{}} tokens={{ p0: sol.p0 }} victimId="p3" />)
    expect(container.querySelectorAll('.lp-token')).toHaveLength(1)
    expect(screen.getAllByRole('gridcell')[12].getAttribute('aria-label')).toContain('Lena.')
  })

  it('draws every piece of furniture, and only floor 0', () => {
    const upstairs: Puzzle = { ...case0, furniture: [...case0.furniture, { type: 'bed', row: 0, col: 0, w: 2, h: 2, floor: 1 }] }
    const { container } = render(<TilePlan puzzle={upstairs} people={PEOPLE} tokens={{}} victimId="p3" />)
    expect(container.querySelectorAll('[data-furniture]')).toHaveLength(case0.furniture.length)
    expect(container.querySelector('[data-furniture="bed"]')).toBeNull()
  })

  it('rotates a piece about the centre of its real footprint', () => {
    const p: Puzzle = {
      ...case0,
      furniture: [
        { type: 'sofa', row: 2, col: 0, w: 2, h: 1, rotation: 180, floor: 0 },
        { type: 'counter', row: 0, col: 2, w: 1, h: 2, rotation: 270, floor: 0 },
      ],
    }
    const { container } = render(<TilePlan puzzle={p} people={PEOPLE} tokens={{}} victimId="p3" />)
    // centre of the 2x1 sofa at (2,0): x = 100, y = 250. Drawn 174 x 74 in its natural box.
    expect(container.querySelector('[data-furniture="sofa"]')).toHaveAttribute('transform', 'translate(100 250) rotate(-180) translate(-87 -37)')
    // the 1x2 counter at (0,2) has its natural box swapped back to 2x1: centre (250,100)
    expect(container.querySelector('[data-furniture="counter"]')).toHaveAttribute('transform', 'translate(250 100) rotate(-270) translate(-87 -37)')
  })
})

describe('plan geometry', () => {
  it('opens exactly one door between each pair of touching rooms, on a furniture-free edge', () => {
    const furn = new Set(furnitureByCell(case0).keys())
    const walls = wallPaths(case0, furn)
    expect(walls.doors).toBe(3) // Study-Kitchen, Study-Hall, Kitchen-Hall
    expect(wallPaths(case0, furn)).toEqual(walls) // deterministic
    expect(walls.outer.length).toBeGreaterThan(0)
  })

  it('places each room label inside its room, off every piece of furniture', () => {
    const furn = new Set(furnitureByCell(case0).keys())
    const labels = roomLabels(case0, furn)
    expect(labels.map(l => l.name).sort()).toEqual(['Hall', 'Kitchen', 'Study'])
    for (const l of labels) {
      const row = Math.floor(l.y / 100)
      const col = Math.floor(l.x / 100)
      expect(case0.roomOf[row][col]).toBe(l.roomId)
      expect(furn.has(cellKey({ row, col }))).toBe(false)
      expect(l.w).toBeLessThanOrEqual(100 * 4)
    }
  })

  it('gives touching rooms different motifs', () => {
    const m = roomMotifs(case0)
    expect(new Set(m.values()).size).toBe(3)
  })
})

describe('Gallery', () => {
  it('renders every emblem, furniture piece and the plans, without styles', () => {
    const { container } = render(<Gallery />)
    expect(within(container).getAllByRole('img', { name: /scales|bell|compass/ }).length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.lem')).toHaveLength(ALL.length * 3)
    expect(container.querySelectorAll('.lg-piece')).toHaveLength(19)
    expect(container.querySelectorAll('.lp')).toHaveLength(2)
    expect(container.querySelectorAll('style')).toHaveLength(0)
  })
})
