// Floor legibility. Room membership is the win condition, so every room has to read as its own region at a
// glance on a phone, and no floor may be so dark that a token or a lens highlight is lost on it.
//
// The styles give each room ROLE a floor (a kit is a mood, not a guarantee): two rooms that share a role, or two
// roles that happen to be close in value, end up side by side as the same grey. This pass runs per plan, from the
// plan alone (never from the cell size), and turns the role floors into the floors the board paints:
//   1. adjacent rooms never share a material (and, where the kit has enough, never share a material family);
//   2. every room's lit floor sits in [L_MIN, L_MAX] (CIE L*), and adjacent rooms differ by at least L_STEP.
// A floor is moved as little as possible: a room whose role floor already satisfies both keeps it byte for byte,
// otherwise the kit's colours are re-exposed (scaled in linear light, so hue is kept) to the chosen value.
import { darken, hexToRgb, lighten, luminance, mix, rgbToHex } from './color'
import { roleOf } from './rooms'
import type { FloorSpec, MatId, Role, StyleKit } from './styles/types'
import type { Plan } from '../nightplan/plan'

/** The night ambient the board lays over every floor (see house.tsx, layer "ambient"). */
export const NIGHT = '#1E2436'

/** Lit-floor value window in CIE L* (0 to 100). L* 38 is a luminance of 0.10 (hard-2's clearest floor measures 0.077 before this pass). */
export const L_MIN = 38
export const L_MAX = 68
/** L* gap the solver keeps between two rooms that share a wall: one step of the four-step ladder across the window. */
export const L_STEP = 10
/** What the painted floors must still show after 8-bit colours round the solver's targets (about 0.2 L* per floor). */
export const L_STEP_MIN = 9.5

type Family = 'check' | 'quarry' | 'mosaic' | 'boards' | 'herring' | 'stone' | 'plain' | 'speckle' | 'lawn' | 'gravel'
const FAMILY: Record<MatId, Family> = {
  chequer: 'check', hydraulic: 'check', azulejo: 'check', quarry: 'quarry', mosaic: 'mosaic',
  planks: 'boards', deck: 'boards', herring: 'herring', brick: 'herring',
  flags: 'stone', cobble: 'stone', slabs: 'plain', plaster: 'plain', carpet: 'plain',
  terrazzo: 'speckle', marble: 'speckle', lawn: 'lawn', gravel: 'gravel',
}
export const familyOf = (m: MatId): string => FAMILY[m]

/** The colours a floor is made of, with the share of the floor each covers (what the eye averages at a glance). */
export function floorTones(spec: FloorSpec): [string, number][] {
  switch (spec.mat) {
    case 'chequer': return [[spec.a, 0.5], [spec.b ?? '#888888', 0.5]]
    case 'hydraulic': case 'azulejo': return [[spec.a, 0.5], [spec.b ?? lighten(spec.a, 0.5), 0.5]]
    case 'mosaic': return [[spec.a, 0.725], [mix(spec.a, spec.b ?? '#222222', 0.55), 0.275]]
    // round setts on a dark bed: the stones cover about 60% of the ground and the bed (darkened 45%) the rest, measured
    case 'cobble': return [[spec.a, 0.4], [darken(spec.a, 0.45), 0.6]]
    default: return [[spec.a, 1]]
  }
}

/** WCAG relative luminance of a floor once the night ambient is on it, averaged in linear light. */
export function litLuminance(spec: FloorSpec, nightFill: number): number {
  return floorTones(spec).reduce((s, [c, w]) => s + w * luminance(mix(c, NIGHT, nightFill)), 0)
}

/** CIE L* (0 to 100) of a luminance. */
export const lstar = (y: number) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y)
export const litL = (spec: FloorSpec, nightFill: number) => lstar(litLuminance(spec, nightFill))

// ---- re-exposure ---------------------------------------------------------------------------------------------
const toLin = (v: number) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const fromLin = (v: number) => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055)
/** Scale a colour's light by k (linear RGB), keeping its hue. */
function expose(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex([fromLin(Math.min(1, toLin(r) * k)), fromLin(Math.min(1, toLin(g) * k)), fromLin(Math.min(1, toLin(b) * k))])
}
export function exposeSpec(spec: FloorSpec, k: number): FloorSpec {
  return {
    ...spec,
    a: expose(spec.a, k),
    ...(spec.b ? { b: expose(spec.b, k) } : {}),
    ...(spec.c ? { c: expose(spec.c, k) } : {}),
    ...(spec.band ? { band: { ...spec.band, color: expose(spec.band.color, k) } } : {}),
  }
}
/** `spec` re-exposed so that its lit floor lands on L* `target` (bisection on k; lit luminance is monotone in k). */
export function retone(spec: FloorSpec, nightFill: number, target: number): FloorSpec {
  let lo = 0.02, hi = 64
  for (let i = 0; i < 40; i++) {
    const mid = Math.sqrt(lo * hi)
    if (litL(exposeSpec(spec, mid), nightFill) < target) lo = mid
    else hi = mid
  }
  return exposeSpec(spec, Math.sqrt(lo * hi))
}

// ---- the plan's graph ----------------------------------------------------------------------------------------
/** Rooms that share an edge (a wall, a fence or an open seam). */
export function adjacency(plan: Plan): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>(plan.rooms.map(r => [r.id, new Set<string>()]))
  for (const e of plan.edges) {
    if (!e.m || !e.p) continue
    const a = plan.roomAt[e.m[0]][e.m[1]], b = plan.roomAt[e.p[0]][e.p[1]]
    if (a && b && a !== b) { adj.get(a)?.add(b); adj.get(b)?.add(a) }
  }
  return adj
}

const INDOOR_ALT: Role[] = ['living', 'hall', 'kitchen', 'study', 'bed', 'bath', 'pantry', 'dining', 'conservatory']
const OUTDOOR_ALT: Role[] = ['garden', 'yard', 'porch']
const OUTDOOR = new Set<Role>(['yard', 'garden', 'porch'])

const sameSpec = (x: FloorSpec, y: FloorSpec) => x.mat === y.mat && x.a === y.a && x.b === y.b && x.c === y.c

export interface RoomFloor {
  spec: FloorSpec
  /** Lit floor, CIE L*, after the pass. */
  L: number
}

/**
 * The floor each room of a plan is painted with. Deterministic, independent of the cell size.
 * Materials first (graph colouring over the kit's floors), then values (the cheapest assignment on the
 * window that keeps every adjacent pair L_STEP apart and every floor inside [L_MIN, L_MAX]).
 */
export function resolveFloors(plan: Plan, st: StyleKit): Map<string, RoomFloor> {
  const adj = adjacency(plan)
  const order = [...plan.rooms].sort((a, b) => (adj.get(b.id)!.size - adj.get(a.id)!.size) || a.r0 - b.r0 || a.c0 - b.c0 || (a.id < b.id ? -1 : 1))
  const roleById = new Map(plan.rooms.map(r => [r.id, roleOf(r.name)]))
  const spec = new Map<string, FloorSpec>()

  // 1. materials
  for (const room of order) {
    const role = roleById.get(room.id)!
    const own = st.floors[role]
    const taken = [...adj.get(room.id)!].map(id => spec.get(id)).filter((s): s is FloorSpec => !!s)
    const mats = new Set(taken.map(s => s.mat)), fams = new Set(taken.map(s => FAMILY[s.mat]))
    const alts = (OUTDOOR.has(role) ? [...OUTDOOR_ALT, ...INDOOR_ALT] : INDOOR_ALT).map(r => st.floors[r])
    const pool = [own, ...alts].filter((s, i, all) => all.findIndex(o => sameSpec(o, s)) === i)
    spec.set(room.id, pool.find(s => !fams.has(FAMILY[s.mat])) ?? pool.find(s => !mats.has(s.mat)) ?? own)
  }

  // 2. values
  const ids = order.map(r => r.id)
  const nat = new Map(ids.map(id => [id, litL(spec.get(id)!, st.nightFill)]))
  const clamp = (v: number) => Math.min(L_MAX, Math.max(L_MIN, v))
  const cands = new Map(ids.map(id => {
    const n = nat.get(id)!
    const set = new Set<number>([+clamp(n).toFixed(3)])
    for (let m = -3; m <= 3; m++) set.add(+clamp(n + m * L_STEP).toFixed(3))
    for (let k = 0; k < 4; k++) set.add(+(L_MIN + (k * (L_MAX - L_MIN)) / 3).toFixed(3))
    return [id, [...set].sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b)] as const
  }))
  let best = null as Map<string, number> | null
  let bestCost = Infinity
  const cur = new Map<string, number>()
  const dfs = (i: number, cost: number) => {
    if (cost >= bestCost) return
    if (i === ids.length) { best = new Map(cur); bestCost = cost; return }
    const id = ids[i]
    for (const L of cands.get(id)!) {
      let ok = true
      for (const nb of adj.get(id)!) { const o = cur.get(nb); if (o !== undefined && Math.abs(o - L) < L_STEP - 1e-6) { ok = false; break } }
      if (!ok) continue
      cur.set(id, L)
      dfs(i + 1, cost + (L - nat.get(id)!) ** 2)
      cur.delete(id)
    }
  }
  dfs(0, 0)
  const picked = best as Map<string, number> | null
  const out = new Map<string, RoomFloor>()
  for (const id of ids) {
    const s = spec.get(id)!
    const L = picked?.get(id) ?? clamp(nat.get(id)!)
    const fin = Math.abs(L - nat.get(id)!) > 0.05 ? retone(s, st.nightFill, L) : s
    out.set(id, { spec: fin, L: litL(fin, st.nightFill) })
  }
  return out
}
