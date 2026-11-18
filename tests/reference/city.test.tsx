import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import CityMap from '../../src/reference/city/CityMap'
import {
  DISTRICTS, MAP_H, MAP_W, OPEN_NEXT_AT, layoutCity, progressOf, riverDistance, routeOrder,
} from '../../src/reference/city/cityModel'

const puzzles = getAllPuzzles()
const layout = layoutCity(puzzles)

describe('city model', () => {
  it('places every case once, 12 per neighbourhood in route order', () => {
    expect(layout.pins).toHaveLength(puzzles.length)
    expect(new Set(layout.pins.map(p => p.id)).size).toBe(puzzles.length)
    for (const d of DISTRICTS) expect(layout.pins.filter(p => p.district === d.id)).toHaveLength(12)
    expect(layout.pins.map(p => p.index)).toEqual(layout.pins.map((_, i) => i))
    expect(layout.pins.map(p => p.id)).toEqual(routeOrder(puzzles).map(p => p.id))
  })
  it('is deterministic', () => {
    expect(JSON.stringify(layoutCity(puzzles))).toBe(JSON.stringify(layout))
  })
  it('keeps pins on the canvas, off the water and apart (no overlapping hit boxes on a phone)', () => {
    for (const p of layout.pins) {
      expect(p.cx).toBeGreaterThan(40); expect(p.cx).toBeLessThan(MAP_W - 40)
      expect(p.by).toBeGreaterThan(100); expect(p.by).toBeLessThan(MAP_H)
      expect(riverDistance(p.cx, p.cy)).toBeGreaterThan(75)
    }
    for (let i = 0; i < layout.pins.length; i++) for (let j = i + 1; j < layout.pins.length; j++) {
      const a = layout.pins[i], b = layout.pins[j]
      // 44x46 px hit boxes may only graze each other (<= 8 px) at the phone scale (1060 px canvas).
      const k = 1060 / MAP_W
      const ox = 44 - Math.abs(a.cx - b.cx) * k, oy = 46 - Math.abs(a.cy - b.cy) * k
      expect(ox <= 8 || oy <= 8).toBe(true)
    }
  })
  it('derives locks from completedIds: sequential cases, 9 of 12 opens the next neighbourhood', () => {
    const none = progressOf(layout.pins, [])
    expect(layout.pins.filter(p => none.states[p.id] === 'open').map(p => p.index)).toEqual([0])
    expect(none.hoods.avenida.unlocked).toBe(false)
    const ids = layout.pins.map(p => p.id)
    const nine = progressOf(layout.pins, ids.slice(0, OPEN_NEXT_AT))
    expect(nine.states[ids[0]]).toBe('solved')
    expect(nine.states[ids[OPEN_NEXT_AT]]).toBe('open')
    expect(nine.hoods.avenida.state).toBe('available')
    expect(nine.states[ids[13]]).toBe('locked')
    expect(progressOf(layout.pins, ids.slice(0, 12)).hoods.centro.state).toBe('complete')
  })
})

describe('CityMap page', () => {
  const game = { puzzles, completedIds: [puzzles[0].id], records: {}, streak: undefined }

  it('renders a pin per case with a lock on the locked ones', () => {
    render(<CityMap game={game} />)
    expect(screen.getAllByRole('button', { name: /Trancado\.$/ }).length).toBeGreaterThan(40)
    expect(screen.getByTestId('pin-very-easy-1').getAttribute('aria-label')).toMatch(/Resolvido/)
  })

  it('opens a case card from a pin and links Investigar to the illustrated case', () => {
    render(<CityMap game={game} />)
    fireEvent.click(screen.getByTestId('pin-very-easy-1'))
    const card = screen.getByTestId('case-card')
    expect(within(card).getByRole('heading', { name: /Midnight Delivery/i })).toBeTruthy()
    expect(within(card).getByText('Vitoriano')).toBeTruthy()
    const go = within(card).getByRole('link')
    expect(go.getAttribute('href')).toBe('/?ref=illustrated&case=very-easy-1')
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(screen.queryByTestId('case-card')).toBeNull()
  })

  it('a locked case explains itself and offers no link', () => {
    render(<CityMap game={{ ...game, completedIds: [] }} />)
    const locked = layout.pins.find(p => p.index === 3)!
    fireEvent.click(screen.getByTestId(`pin-${locked.id}`))
    const card = screen.getByTestId('case-card')
    expect(within(card).queryByRole('link')).toBeNull()
    expect(card.textContent).toMatch(/Resolva primeiro/)
  })

  it('shows the evidence shelf and six medals', () => {
    render(<CityMap game={game} />)
    expect(screen.getByRole('heading', { name: 'Arquivo de Provas' })).toBeTruthy()
    expect(screen.getAllByRole('img', { name: /Prova do caso/ })).toHaveLength(12)
    expect(screen.getByRole('heading', { name: 'Medalhas' })).toBeTruthy()
    expect(screen.getByText('Primeira Noite')).toBeTruthy()
  })

  it('waits for the catalogue', () => {
    render(<CityMap game={{ puzzles: [], completedIds: [], catalogProgress: { done: 3, total: 60 } }} />)
    expect(screen.getByRole('status').textContent).toMatch(/3 de 60/)
  })
})
