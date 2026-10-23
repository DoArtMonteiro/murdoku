// Test-only transformations of a puzzle that must not change what is true of it.
// They work on the SENTENCES and the board, so they exercise the independent
// interpreter, not the engine.

import type { Cell, Puzzle } from '../../src/core/types'

const swapCell = (c: Cell): Cell => ({ ...c, row: c.col, col: c.row })

/** Rewrite one sentence for the transposed board (rows <-> columns, north/south <-> west/east). */
export function transposeSentence(text: string): string {
  const fixed: Record<string, string> = {
    'In the top row.': 'In the leftmost column.',
    'In the bottom row.': 'In the rightmost column.',
    'In the leftmost column.': 'In the top row.',
    'In the rightmost column.': 'In the bottom row.',
  }
  if (fixed[text]) return fixed[text]
  let m = /^In row (\d+)\.$/.exec(text)
  if (m) return `In column ${m[1]}.`
  m = /^In column (\d+)\.$/.exec(text)
  if (m) return `In row ${m[1]}.`
  m = /^Exactly (one|\d+) (row|rows|column|columns) (north|south|east|west) of (.+)\.$/.exec(text)
  if (m) {
    const unit = m[2].startsWith('row') ? (m[2].endsWith('s') ? 'columns' : 'column') : (m[2].endsWith('s') ? 'rows' : 'row')
    const dir = { north: 'west', south: 'east', west: 'north', east: 'south' }[m[3]]
    return `Exactly ${m[1]} ${unit} ${dir} of ${m[4]}.`
  }
  m = /^Somewhere (north|south|east|west) of (.+)\.$/.exec(text)
  if (m) return `Somewhere ${{ north: 'west', south: 'east', west: 'north', east: 'south' }[m[1]]} of ${m[2]}.`
  return text
}

export function transposePuzzle(p: Puzzle): Puzzle {
  const grid = (g: string[][]) => g[0].map((_, c) => g.map(row => row[c]))
  return {
    ...p,
    rooms: p.rooms.map(r => ({ ...r, cells: r.cells.map(swapCell) })),
    roomOf: grid(p.roomOf),
    roomOfByFloor: p.roomOfByFloor?.map(grid),
    furniture: p.furniture.map(f => ({ ...f, row: f.col, col: f.row, w: f.h ?? 1, h: f.w ?? 1 })),
    solution: Object.fromEntries(Object.entries(p.solution).map(([id, c]) => [id, swapCell(c)])),
    clues: p.clues.map(ct => ({ ...ct, text: transposeSentence(ct.text) })),
  }
}

const NEW_NAMES = ['Quincy', 'Rosalind', 'Silas', 'Thea', 'Ulric', 'Wanda', 'Xavier', 'Yolanda']

/**
 * Give everybody a new id and a new name (a rotation by `shift` of the ids, and
 * a reversed people array) and rewrite every sentence that names someone.
 */
export function permutePeople(p: Puzzle, shift = 1): Puzzle {
  const n = p.people.length
  const idMap = new Map(p.people.map((x, i) => [x.id, `q${(i + shift) % n}`]))
  const nameMap = new Map(p.people.map((x, i) => [x.name, NEW_NAMES[(i + shift) % NEW_NAMES.length]]))
  const namePattern = new RegExp(`\\b(${[...nameMap.keys()].join('|')})\\b`, 'g')
  const rename = (text: string) => text.replace(namePattern, found => nameMap.get(found)!)
  const mapId = (id: string) => idMap.get(id) ?? id
  const remapClue = (clue: Puzzle['clues'][number]['clue']) => {
    const out: Record<string, unknown> = { ...clue }
    for (const key of ['person', 'other']) if (typeof out[key] === 'string') out[key] = mapId(out[key] as string)
    if (out.targetKind === 'person') out.target = mapId(out.target as string)
    return out as unknown as Puzzle['clues'][number]['clue']
  }
  return {
    ...p,
    people: [...p.people].reverse().map(x => ({ ...x, id: mapId(x.id), name: nameMap.get(x.name)! })),
    victimId: mapId(p.victimId),
    murdererId: mapId(p.murdererId),
    solution: Object.fromEntries(Object.entries(p.solution).map(([id, c]) => [mapId(id), c])),
    clues: [...p.clues].reverse().map(ct => ({ clue: remapClue(ct.clue), text: rename(ct.text) })),
  }
}

/** Seeded PRNG (mulberry32) so property tests are reproducible. */
export function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
