// Small pure helpers shared by the casebook slice. Every cell comparison goes
// through cellFloor() so a puzzle whose ground-floor cells omit `floor` and a
// player placement that always carries it still compare equal.
import type { Cell, Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { roomIdAt } from '../core/engine'
import type { Placement } from '../core/engine'

export type { Placement }

export const cellKey = (c: Cell): string => `${cellFloor(c)}:${c.row}:${c.col}`
export const norm = (c: Cell): Cell => ({ row: c.row, col: c.col, floor: cellFloor(c) })
export const sameCell = (a: Cell, b: Cell): boolean => cellKey(a) === cellKey(b)
export const floorsOf = (p: Puzzle): number => Math.max(1, p.floors ?? 1)

export function allCells(p: Puzzle): Cell[] {
  const out: Cell[] = []
  for (let f = 0; f < floorsOf(p); f++) {
    for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) out.push({ row: r, col: c, floor: f })
  }
  return out
}

export function roomNameAt(p: Puzzle, c: Cell): string {
  const id = roomIdAt(p, c)
  return p.rooms.find(r => r.id === id)?.name ?? ''
}

export const floorWord = (p: Puzzle, f: number): string =>
  floorsOf(p) < 2 ? '' : f === 0 ? 'ground floor' : f === 1 ? 'upstairs' : `floor ${f + 1}`

/** "row 3, column 5, upstairs" */
export function cellName(p: Puzzle, c: Cell): string {
  const fw = floorWord(p, cellFloor(c))
  return `row ${c.row + 1}, column ${c.col + 1}${fw ? `, ${fw}` : ''}`
}

/** People who share a row or a column (on any floor) with someone else. Never blocks; only marks. */
export function conflictIds(place: Placement): Set<string> {
  const ids = Object.keys(place)
  const bad = new Set<string>()
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = place[ids[i]], b = place[ids[j]]
      if (a.row === b.row || a.col === b.col) { bad.add(ids[i]); bad.add(ids[j]) }
    }
  }
  return bad
}

export function samePlacement(p: Puzzle, place: Placement): boolean {
  return p.people.every(x => {
    const c = place[x.id]
    return !!c && sameCell(c, p.solution[x.id])
  })
}

export const firstName = (p: Puzzle, id: string): string => p.people.find(x => x.id === id)?.name ?? id
