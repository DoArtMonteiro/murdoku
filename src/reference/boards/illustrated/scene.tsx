// The painted scene for one (puzzle, storey, board box, cell size, style): built once, then served from a small
// module cache, so a re-render, a remount or a theme change with equal inputs never rebuilds it. Ids inside the
// scene derive from the key, not from a per-mount counter, so a cached scene can be mounted again as it is.
import type { ReactNode } from 'react'
import type { Puzzle } from '../../../core/types'
import { hashStr, rng } from './color'
import { clueTypesOf } from './decor'
import { frameFor, GUTTER_SHADE } from './frame'
import { renderGarden, type LotGeom } from './garden'
import { renderHouse } from './house'
import { renderLabels } from './labelsView'
import { illustratedPlan } from './plan'
import { Reg } from './reg'
import { styleFor } from './styles'

export interface Scene {
  reg: Reg
  fr: ReturnType<typeof frameFor>
  garden: ReturnType<typeof renderGarden>
  house: ReturnType<typeof renderHouse>
  vig: string
  grain: string
  labels: ReactNode
  gutTop: string
  gutLeft: string
}

export interface SceneInput {
  puzzle: Puzzle
  floor: number
  width: number
  height: number
  x0: number
  y0: number
  u: number
}

const cache = new Map<string, Scene>()
const MAX = 8
export const sceneStats = { builds: 0, hits: 0 }

/** Everything about a puzzle the picture depends on, folded into one number. */
function puzzleHash(p: Puzzle): number {
  return hashStr(JSON.stringify([p.furniture, p.roomOf, p.roomOfByFloor ?? null, p.rooms.map(r => r.name), [...clueTypesOf(p)].sort()]))
}

export function sceneKey(i: SceneInput): string {
  return `${i.puzzle.id}#${puzzleHash(i.puzzle).toString(36)}|${i.floor}|${i.width}x${i.height}|${i.x0},${i.y0},${i.u}|${styleFor(i.puzzle).id}`
}

export function getScene(i: SceneInput): Scene {
  const key = sceneKey(i)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit) // most recently used last
    sceneStats.hits++
    return hit
  }
  const scene = buildScene(i, `il${hashStr(key).toString(36)}`)
  sceneStats.builds++
  cache.set(key, scene)
  while (cache.size > MAX) cache.delete(cache.keys().next().value as string)
  return scene
}

function buildScene({ puzzle, floor, width, height, x0, y0, u }: SceneInput, uid: string): Scene {
  const n = puzzle.size
  const st = styleFor(puzzle)
  const plan = illustratedPlan(puzzle, floor, u)
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0
  const reg = new Reg(uid)
  const fr = frameFor(width, height, n)
  const seed = hashStr(`${puzzle.id}:${floor}`)
  const mobile = u < 56
  const lot: LotGeom = {
    n, u,
    bx0: -x0 / u, by0: -y0 / u, bx1: (width - x0) / u, by1: (height - y0) / u,
    gut: fr.gut / u, gutOuter: -fr.gut / u,
  }
  const garden = renderGarden(plan, reg, st, lot, seed)
  const house = renderHouse({ plan, puzzle, st, reg, u, mobile })
  // lot-wide vignette: darkens the sheet edge only, never the grid
  const vig = reg.once('vig', i => (
    <radialGradient key={i} id={i} gradientUnits="userSpaceOnUse" cx={fr.sx + fr.S / 2} cy={fr.sy + fr.S / 2} r={fr.S * 0.72}>
      <stop offset="0.6" stopColor="#05080c" stopOpacity={0} /><stop offset="1" stopColor="#05080c" stopOpacity={0.34} />
    </radialGradient>
  ))
  // paper / canvas grain: a small tile of dark and light specks (plain vector, no filter), rasterised once
  const grain = reg.once('grain', i => {
    const r = rng(hashStr(`${puzzle.id}-grain`))
    const specks: ReactNode[] = []
    for (let k = 0; k < 260; k++) {
      const dark = k % 3 !== 0
      specks.push(<rect key={k} x={Math.floor(r() * 128)} y={Math.floor(r() * 128)} width={r() < 0.7 ? 1 : 2} height={r() < 0.8 ? 1 : 2} fill={dark ? '#05060a' : '#fff6e0'} opacity={+((dark ? 0.07 : 0.03) + r() * (dark ? 0.12 : 0.05)).toFixed(2)} />)
    }
    return <pattern key={i} id={i} patternUnits="userSpaceOnUse" width={128} height={128}>{specks}</pattern>
  })
  if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
    try { performance.measure('illustrated-scene', { start: t0, end: performance.now() }) } catch { /* optional instrumentation */ }
  }
  const labels = renderLabels(plan, house.labels, st, u)
  // the numeral strip is the garden itself, only feathered darker (<= 12%) behind the pills: the shade ramps in over
  // 0.3u from the lot side and out again over 0.3u at the wall, so there is no edge to see
  const ramp = (id: string, vertical: boolean) => reg.once(id, i => (
    <linearGradient key={i} id={i} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
      <stop offset="0" stopColor="#03060a" stopOpacity={0} />
      <stop offset="0.35" stopColor="#03060a" stopOpacity={GUTTER_SHADE} />
      <stop offset="0.65" stopColor="#03060a" stopOpacity={GUTTER_SHADE} />
      <stop offset="1" stopColor="#03060a" stopOpacity={0} />
    </linearGradient>
  ))
  return { reg, fr, garden, house, vig, grain, labels, gutTop: reg.url(ramp('gutt', true)), gutLeft: reg.url(ramp('gutl', false)) }
}
