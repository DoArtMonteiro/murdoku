// Pure, deterministic model of "Portinhal", the casebook city (R2 prototype).
// Nothing here touches game logic: it only READS puzzles + completedIds and
// derives where each case lives on the map and whether it is locked.
// Visual language: scratchpad/r2/CITY-LANGUAGE.md.
import type { Difficulty, Puzzle } from '../../core/types'

export type StyleId = 'victorian' | 'artdeco' | 'tudor' | 'modernist' | 'mediterranean'
export type DistrictId = 'centro' | 'avenida' | 'antigo' | 'moderno' | 'quinta'

export const STYLE_NAME: Record<StyleId, string> = {
  victorian: 'Vitoriano',
  artdeco: 'Art Déco',
  tudor: 'Tudor',
  modernist: 'Modernista',
  mediterranean: 'Mediterrânico',
}

export const STYLE_NOTE: Record<StyleId, string> = {
  victorian: 'Torres, tijolo escuro e mansardas',
  artdeco: 'Degraus de mármore e leques dourados',
  tudor: 'Madeira à vista e telhados íngremes',
  modernist: 'Vidro, betão e planta aberta',
  mediterranean: 'Cal branca, arcos e pátio com oliveira',
}

/** Three interior vignettes per style, as on the style board. */
export const VIGNETTES: Record<StyleId, [string, string, string]> = {
  victorian: ['Lareira e biblioteca', 'Sala de jantar', 'Entrada principal'],
  artdeco: ['Hall de mármore', 'Bar e salão', 'Painel Déco'],
  tudor: ['Salão acolhedor', 'Cozinha rústica', 'Vitral'],
  modernist: ['Sala com vista', 'Cozinha moderna', 'Terraço'],
  mediterranean: ['Pátio', 'Cozinha de azulejo', 'Arco e jardim'],
}

export const DIFFICULTY_PT: Record<Difficulty, string> = {
  'Very Easy': 'Muito fácil', Easy: 'Fácil', Medium: 'Médio', Hard: 'Difícil', Expert: 'Perito', Master: 'Mestre',
}
export const TIERS: Difficulty[] = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']
/** Difficulty dots, 1 to 5. */
export const DIFFICULTY_DOTS: Record<Difficulty, number> = { 'Very Easy': 1, Easy: 2, Medium: 3, Hard: 4, Expert: 5, Master: 5 }

export const MAP_W = 1600
export const MAP_H = 1030

// --- the river ----------------------------------------------------------------
const RIVER: [number, number][] = [[300, -40], [600, 120], [1000, 420], [1660, 860]]
export const RIVER_PATH = `M${RIVER[0]} C${RIVER[1]} ${RIVER[2]} ${RIVER[3]}`
export function riverAt(t: number): { x: number; y: number; tx: number; ty: number } {
  const b = (u: number) => {
    const a = (1 - u) ** 3, bb = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3
    return [a * RIVER[0][0] + bb * RIVER[1][0] + c * RIVER[2][0] + d * RIVER[3][0],
      a * RIVER[0][1] + bb * RIVER[1][1] + c * RIVER[2][1] + d * RIVER[3][1]]
  }
  const [x, y] = b(t), [x1, y1] = b(t - 0.004), [x2, y2] = b(t + 0.004)
  const l = Math.hypot(x2 - x1, y2 - y1)
  return { x, y, tx: (x2 - x1) / l, ty: (y2 - y1) / l }
}
const RIVER_SAMPLES = Array.from({ length: 321 }, (_, i) => riverAt(i / 320))
export function riverDistance(x: number, y: number): number {
  let m = Infinity
  for (const s of RIVER_SAMPLES) { const d = Math.hypot(x - s.x, y - s.y); if (d < m) m = d }
  return m
}
export const BRIDGE_T = 0.5
export const BRIDGE = (() => { const r = riverAt(BRIDGE_T); return { x: r.x, y: r.y, angle: Math.atan2(r.ty, r.tx) * 180 / Math.PI } })()

// --- neighbourhoods ----------------------------------------------------------------
export interface Vec { x: number; y: number }
export interface District {
  id: DistrictId
  name: string
  style: StyleId
  /** Badge icon, for the record. */
  badge: string
  /** Control points of the main street (Catmull-Rom); the 12 case houses line it, alternating sides. */
  street: Vec[]
  /** Where the name plate sits (top-left, map units). */
  plate: Vec
}

const V = (x: number, y: number): Vec => ({ x, y })

/** The avenue shadows the river on its north-east bank. */
const avenueStreet: Vec[] = (() => {
  const out: Vec[] = []
  for (let t = 0.44; t <= 0.9; t += 0.03) {
    const r = riverAt(t)
    let nx = r.ty, ny = -r.tx
    if (ny > 0) { nx = -nx; ny = -ny }
    out.push(V(r.x + nx * 152, r.y + ny * 152))
  }
  return out
})()

/** The square with the bandstand, in Centro Histórico. */
export const BANDSTAND = V(300, 760)

/** Walking order: Centro first, then along the river, up the hill, across the bridge, out to the quinta. */
export const DISTRICTS: District[] = [
  {
    id: 'centro', name: 'Centro Histórico', style: 'victorian', badge: 'candeeiro a gás',
    street: [V(100, 935), V(170, 880), V(265, 915), V(370, 850), V(470, 880), V(560, 810), V(580, 735)],
    plate: V(36, 640),
  },
  {
    id: 'avenida', name: 'Avenida do Rio', style: 'artdeco', badge: 'leque Déco',
    street: avenueStreet, plate: V(1010, 22),
  },
  {
    id: 'antigo', name: 'Bairro Antigo', style: 'tudor', badge: 'lanterna',
    street: [V(100, 500), V(150, 420), V(240, 455), V(320, 375), V(230, 305), V(320, 235), V(420, 235)],
    plate: V(40, 70),
  },
  {
    id: 'moderno', name: 'Bairro Moderno', style: 'modernist', badge: 'janela e lua',
    street: [V(640, 915), V(770, 895), V(880, 920), V(960, 855), V(830, 840), V(720, 805), V(800, 735), V(930, 715)],
    plate: V(600, 690),
  },
  {
    id: 'quinta', name: 'Quinta das Oliveiras', style: 'mediterranean', badge: 'arco com chave',
    street: [V(1000, 650), V(1100, 695), V(1185, 770), V(1120, 845), V(1200, 910), V(1320, 935), V(1430, 905), V(1500, 930)],
    plate: V(1235, 640),
  },
]
export const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map(d => [d.id, d])) as Record<DistrictId, District>

export const HOOD_SIZE = 12
/** A neighbourhood opens once this many cases of the previous one are solved. */
export const OPEN_NEXT_AT = 9

export function roman(n: number): string {
  const t: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of t) while (n >= v) { out += s; n -= v }
  return out
}

// --- deterministic randomness ------------------------------------------------------------
export function hash32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
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

// --- layout -------------------------------------------------------------------------
export interface CasePin {
  id: string
  title: string
  caseNumber: string
  flavor: string
  difficulty: Difficulty
  district: DistrictId
  style: StyleId
  seed: number
  /** Position in the walking route, 0-based, and its Roman numeral. */
  index: number
  numeral: string
  /** Building base-centre. */
  x: number
  by: number
  /** Pin anchor (centre of the building body). */
  cx: number
  cy: number
  /** Arclength along the district's main street. */
  s: number
}
export interface Filler { x: number; by: number; style: StyleId; seed: number; scale: number; sx: number; sy: number }
export interface Tree { x: number; y: number; r: number; seed: number; olive?: boolean }
export interface Lamp { x: number; y: number }
export interface Street { id: string; d: string; kind: 'main' | 'quay' | 'bridge' }

export interface CityLayout {
  pins: CasePin[]
  fillers: Filler[]
  trees: Tree[]
  lamps: Lamp[]
  streets: Street[]
  /** Dashed route from case i to case i+1, along the street. */
  legs: string[]
  /** Padded outline around each neighbourhood's houses: ground tint and fog. */
  hull: Record<DistrictId, Vec[]>
}

function catmull(pts: Vec[], per = 10): Vec[] {
  const p = [pts[0], ...pts, pts[pts.length - 1]]
  const out: Vec[] = []
  for (let i = 1; i < p.length - 2; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({ x: f(p[i - 1].x, p[i].x, p[i + 1].x, p[i + 2].x), y: f(p[i - 1].y, p[i].y, p[i + 1].y, p[i + 2].y) })
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

interface Sampler { pts: Vec[]; cum: number[]; length: number; at: (s: number) => Vec & { tx: number; ty: number } }
function sampler(poly: Vec[]): Sampler {
  const cum = [0]
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y))
  const length = cum[cum.length - 1]
  const at = (s: number) => {
    // Past the ends the street simply carries on straight.
    let i = 1
    if (s >= length) i = poly.length - 1
    else if (s > 0) while (cum[i] < s) i++
    const a = poly[i - 1], b = poly[i], seg = Math.max(1e-6, cum[i] - cum[i - 1])
    const tx = (b.x - a.x) / seg, ty = (b.y - a.y) / seg
    const u = s - cum[i - 1]
    return { x: a.x + tx * u, y: a.y + ty * u, tx, ty }
  }
  return { pts: poly, cum, length, at }
}

export function distToPolyline(poly: Vec[], x: number, y: number): number {
  let m = Infinity
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1], b = poly[i]
    const dx = b.x - a.x, dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / Math.max(1e-6, dx * dx + dy * dy)))
    m = Math.min(m, Math.hypot(x - a.x - dx * t, y - a.y - dy * t))
  }
  return m
}

function hull(points: Vec[]): Vec[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: Vec, a: Vec, b: Vec) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lo: Vec[] = [], up: Vec[] = []
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

/** Sort the catalogue into walking order: by difficulty tier, then the catalogue's own order. */
export function routeOrder<T extends Pick<Puzzle, 'difficulty'>>(puzzles: T[]): T[] {
  return puzzles.map((p, i) => ({ p, i })).sort((a, b) => TIERS.indexOf(a.p.difficulty) - TIERS.indexOf(b.p.difficulty) || a.i - b.i).map(x => x.p)
}
export function hoodOfIndex(i: number, n: number): number {
  const size = n === HOOD_SIZE * DISTRICTS.length ? HOOD_SIZE : Math.ceil(n / DISTRICTS.length)
  return Math.min(DISTRICTS.length - 1, Math.floor(i / Math.max(1, size)))
}

const toPath = (pts: Vec[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')
/** Houses stand on the street's north side (base just above it) or its south side (base a body-height below). */
const NORTH = -18, SOUTH = 80
const LOT_STEP = 56

export function layoutCity(puzzles: Puzzle[]): CityLayout {
  const ordered = routeOrder(puzzles)
  const pins: CasePin[] = []
  const fillers: Filler[] = []
  const streets: Street[] = []
  const lamps: Lamp[] = []
  const legMap: Record<number, string> = {}
  const hullOut = {} as Record<DistrictId, Vec[]>
  const lots: Vec[] = []            // every house base, for filler avoidance
  const centrelines: Vec[][] = []   // every street, for filler avoidance
  const samplers = {} as Record<DistrictId, Sampler>
  const rand = rng(hash32('portinhal-fabric'))
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]

  DISTRICTS.forEach((d, di) => {
    const poly = catmull(d.street, 10)
    const sm = sampler(poly)
    samplers[d.id] = sm
    centrelines.push(poly)
    streets.push({ id: d.id, d: toPath(poly), kind: 'main' })
    for (let s = 120; s < sm.length; s += 190) { const p = sm.at(s); lamps.push({ x: p.x - p.ty * 12, y: p.y + p.tx * 12 + 4 }) }
    const cases = ordered.map((p, i) => ({ p, i })).filter(x => hoodOfIndex(x.i, ordered.length) === di)
    const around: Vec[] = []
    const total = Math.max(cases.length, 12)
    const clash = (x: number, y: number) => pins.some(q => {
      // 44x46 px hit boxes at the phone scale (1060 px canvas) may only graze.
      const kk = 1060 / MAP_W
      return 44 - Math.abs(q.cx - x) * kk > 6 && 46 - Math.abs(q.cy - (y - 26)) * kk > 6
    })
    let cursor = 48
    for (let k = 0; k < total + 1; k++) {
      let s = cursor
      let c = sm.at(s)
      const place = (cc: ReturnType<Sampler['at']>) => {
        // On steep stretches the houses stand left and right of the street instead of above and below it.
        const steep = Math.abs(cc.ty) > 0.72
        const north = k % 2 === 0
        return steep
          ? { base: { x: cc.x + (north ? -52 : 52), y: cc.y + 30 }, other: { x: cc.x + (north ? 52 : -52), y: cc.y + 30 } }
          : { base: { x: cc.x, y: cc.y + (north ? NORTH : SOUTH) }, other: { x: cc.x, y: cc.y + (north ? SOUTH : NORTH) } }
      }
      let { base, other } = place(c)
      // Bends can squeeze neighbours together: slide on down the street until the pin has room.
      for (let tries = 0; tries < 40 && clash(base.x, base.y); tries++) {
        s += 8; c = sm.at(s); ({ base, other } = place(c))
      }
      cursor = s + LOT_STEP
      lots.push(base, other)
      around.push(base, other)
      const hit = cases[k]
      if (hit) {
        const seed = hash32(hit.p.id)
        pins.push({
          id: hit.p.id, title: hit.p.title, caseNumber: hit.p.caseNumber, flavor: hit.p.flavor, difficulty: hit.p.difficulty,
          district: d.id, style: d.style, seed, index: hit.i, numeral: roman(hit.i + 1),
          x: base.x, by: base.y, cx: base.x, cy: base.y - 26, s,
        })
        if (k > 0 && cases[k - 1]) {
          const prev = pins[pins.length - 2]
          const leg: Vec[] = []
          for (let u = prev.s; u < s; u += 10) leg.push(sm.at(u))
          leg.push(sm.at(s))
          legMap[prev.index] = toPath(leg)
        }
      }
      // The house opposite is an unpinned neighbour, with its own footprint and height.
      {
        const seed = hash32(`${d.id}:n:${k}`)
        const ws = [0.8, 1, 1.22]
        const hs = [0.8, 1, 1.3]
        fillers.push({ x: other.x, by: other.y, style: d.style, seed, scale: 0.78, sx: ws[seed % 3], sy: hs[(seed >>> 3) % 3] })
      }
    }
    hullOut[d.id] = hull(around.flatMap(p => [[-80, -110], [80, -110], [-80, 50], [80, 50]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))))
  })
  const legs = pins.slice(0, -1).map((a, i) => {
    const b = pins[i + 1]
    if (a.district === b.district) return legMap[a.index] ?? ''
    const pa = samplers[a.district].at(a.s), pb = samplers[b.district].at(b.s)
    return `M${pa.x.toFixed(1)} ${pa.y.toFixed(1)}L${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`
  })

  // The quays and the bridge approach roads.
  for (const side of [-1, 1]) {
    const q: Vec[] = []
    for (let t = 0; t <= 1.0001; t += 0.025) { const r = riverAt(t); q.push({ x: r.x - r.ty * side * 78, y: r.y + r.tx * side * 78 }) }
    streets.push({ id: `quay${side}`, d: toPath(q), kind: 'quay' })
    centrelines.push(q)
  }
  {
    const nx = -Math.sin(BRIDGE.angle * Math.PI / 180), ny = Math.cos(BRIDGE.angle * Math.PI / 180)
    const p: Vec[] = [V(BRIDGE.x - nx * 260, BRIDGE.y - ny * 260), V(BRIDGE.x + nx * 260, BRIDGE.y + ny * 260)]
    streets.push({ id: 'bridge', d: toPath(p), kind: 'bridge' })
    centrelines.push(p)
  }

  // Town fabric: dim buildings of mixed size and trees on every free patch of land.
  const trees: Tree[] = []
  const nearest = (x: number, y: number): District => {
    let best = DISTRICTS[0], bd = Infinity
    for (const d of DISTRICTS) {
      const k = distToPolyline(samplers[d.id].pts, x, y)
      if (k < bd) { bd = k; best = d }
    }
    return best
  }
  const plateBox = (x: number, y: number) => DISTRICTS.some(d => x > d.plate.x - 60 && x < d.plate.x + 360 && y > d.plate.y - 10 && y < d.plate.y + 150)
  const bridgeBox = (x: number, y: number) => Math.hypot(x - BRIDGE.x, y - BRIDGE.y) < 130
  for (let gy = 150; gy < 1020; gy += 70) {
    for (let gx = 40; gx < 1570; gx += 92) {
      const jx = gx + (rand() - 0.5) * 30 + ((gy / 70) % 2 ? 46 : 0), jy = gy + (rand() - 0.5) * 18
      const roll = rand()
      if (jx < 50 || jx > 1550 || jy > 1015) continue
      if (lots.some(f => Math.hypot(f.x - jx, f.y - jy) < 64)) continue
      if (riverDistance(jx, jy - 28) < 100 || bridgeBox(jx, jy) || plateBox(jx, jy)) continue
      if (centrelines.some(c => distToPolyline(c, jx, jy - 30) < 62 && distToPolyline(c, jx, jy - 4) < 36 + 14)) continue
      if (roll < 0.62) {
        const d = nearest(jx, jy), seed = Math.floor(rand() * 1e9)
        const ws = [0.8, 1, 1.22], hs = [0.8, 1, 1.35]
        fillers.push({ x: jx, by: jy, style: rand() < 0.2 ? pick(DISTRICTS).style : d.style, seed, scale: 0.7 + rand() * 0.1, sx: pick(ws), sy: pick(hs) })
        lots.push(V(jx, jy))
      } else if (roll < 0.92) {
        trees.push({ x: jx, y: jy, r: 7 + rand() * 4, seed: Math.floor(rand() * 1e6), olive: nearest(jx, jy).id === 'quinta' })
      }
    }
  }
  return { pins, fillers, trees, lamps, streets, legs, hull: hullOut }
}

// --- progression (read-only, derived from completedIds) ----------------------------------
export type CaseState = 'locked' | 'open' | 'solved'
export type HoodState = 'locked' | 'available' | 'progress' | 'complete'

export interface HoodStat { id: DistrictId; total: number; solved: number; unlocked: boolean; state: HoodState; first: number; last: number }

export interface Progress {
  solved: ReadonlySet<string>
  hoods: Record<DistrictId, HoodStat>
  states: Record<string, CaseState>
  /** Index of the last solved case in the route, or -1. */
  lastSolved: number
}

/**
 * Rules from CITY-LANGUAGE §3: case N+1 opens when case N is solved; the first
 * case of a neighbourhood opens with the neighbourhood, which opens when 9 of
 * the previous one's cases are solved. A solved case always stays open.
 */
export function progressOf(pins: CasePin[], completedIds: readonly string[]): Progress {
  const solved = new Set(completedIds)
  const hoods = {} as Record<DistrictId, HoodStat>
  let prevSolved = OPEN_NEXT_AT
  const states: Record<string, CaseState> = {}
  let lastSolved = -1
  DISTRICTS.forEach((d, di) => {
    const mine = pins.filter(p => p.district === d.id)
    const nSolved = mine.filter(p => solved.has(p.id)).length
    const unlocked = di === 0 || prevSolved >= OPEN_NEXT_AT || nSolved > 0
    const total = mine.length
    hoods[d.id] = {
      id: d.id, total, solved: nSolved, unlocked,
      state: !unlocked ? 'locked' : total > 0 && nSolved >= total ? 'complete' : nSolved > 0 ? 'progress' : 'available',
      first: mine[0]?.index ?? 0, last: mine[mine.length - 1]?.index ?? 0,
    }
    mine.forEach((p, k) => {
      states[p.id] = solved.has(p.id) ? 'solved' : unlocked && (k === 0 || solved.has(mine[k - 1].id)) ? 'open' : 'locked'
      if (solved.has(p.id)) lastSolved = Math.max(lastSolved, p.index)
    })
    prevSolved = nSolved
  })
  return { solved, hoods, states, lastSolved }
}

/** Why a case is locked, in words. */
export function lockReason(p: CasePin, pins: CasePin[], pr: Progress): string {
  const h = pr.hoods[p.district]
  if (!h.unlocked) {
    const di = DISTRICTS.findIndex(d => d.id === p.district)
    const prev = DISTRICTS[di - 1]
    const need = Math.max(0, OPEN_NEXT_AT - pr.hoods[prev.id].solved)
    return `Bairro trancado: resolva mais ${need} ${need === 1 ? 'caso' : 'casos'} em ${prev.name} para o abrir.`
  }
  const before = pins.filter(q => q.district === p.district)[pins.filter(q => q.district === p.district).indexOf(p) - 1]
  return before ? `Resolva primeiro «${before.title}» (caso ${before.numeral}) para abrir esta casa.` : 'Esta casa ainda está trancada.'
}

// --- evidence shelf ----------------------------------------------------------------------
export type EvidenceId =
  | 'parcel' | 'letter' | 'key' | 'brooch' | 'cocktail' | 'ticket' | 'lamp' | 'candle' | 'shears' | 'mug'
  | 'blueprint' | 'watch' | 'photo' | 'tile' | 'ring' | 'shard'

/** Hero objects by style (CITY-LANGUAGE §4). */
export const HERO: Record<StyleId, { id: EvidenceId; name: string }[]> = {
  victorian: [{ id: 'parcel', name: 'Embrulho lacrado' }, { id: 'letter', name: 'Carta' }, { id: 'key', name: 'Chave de latão' }, { id: 'brooch', name: 'Broche' }],
  artdeco: [{ id: 'cocktail', name: 'Copo de cocktail' }, { id: 'ticket', name: 'Bilhete' }, { id: 'lamp', name: 'Candeeiro de latão' }],
  tudor: [{ id: 'candle', name: 'Castiçal' }, { id: 'shears', name: 'Tesoura de jardim' }, { id: 'mug', name: 'Caneca de estanho' }],
  modernist: [{ id: 'blueprint', name: 'Planta' }, { id: 'watch', name: 'Relógio' }, { id: 'photo', name: 'Fotografia' }],
  mediterranean: [{ id: 'tile', name: 'Azulejo' }, { id: 'ring', name: 'Anel' }, { id: 'shard', name: 'Caco de cerâmica' }],
}
export function heroOf(p: CasePin): { id: EvidenceId; name: string } {
  const list = HERO[p.style]
  return list[p.index % list.length]
}

// --- medals ---------------------------------------------------------------------------------
export type MedalId = 'primeira-noite' | 'sem-rasuras' | 'olho-clinico' | 'vizinhanca' | 'arquivista' | 'meia-noite'
export interface MedalDef { id: MedalId; name: string; text: string }
export const MEDALS: MedalDef[] = [
  { id: 'primeira-noite', name: 'Primeira Noite', text: 'Resolva o Caso N.º I.' },
  { id: 'sem-rasuras', name: 'Sem Rasuras', text: 'Resolva um caso sem nenhuma colocação errada.' },
  { id: 'olho-clinico', name: 'Olho Clínico', text: 'Resolva um caso sem usar uma pista.' },
  { id: 'vizinhanca', name: 'Vizinhança Segura', text: 'Complete um bairro.' },
  { id: 'arquivista', name: 'Arquivista', text: 'Encha uma prateleira: 12 provas.' },
  { id: 'meia-noite', name: 'Meia-Noite', text: 'Resolva um caso entre as 00:00 e a 01:00.' },
]
