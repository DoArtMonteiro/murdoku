// Tiny night-time elevations of the five architectural styles. Each is drawn
// with its base centre at (0,0) and rises into negative y (about 64 units tall).
// Deterministic: all variation comes from the seed.
import type { ReactNode } from 'react'
import { rng } from './cityModel'
import type { StyleId } from './cityModel'

const LIT = '#f7c96b'
const DARK = '#192033'
const EDGE = '#090d18'

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)))
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

/** lit: 0 = dark, 'one' = a single lit window, 'all' = every window, 0..1 = share of windows. */
export type Lit = number | 'one' | 'all'
interface Ctx { r: () => number; lit: Lit; used: number; v: number }
const on = (c: Ctx) => {
  if (c.lit === 'all') return true
  if (c.lit === 'one') return c.used++ === 0
  return c.lit > 0 && c.r() < c.lit
}
const anyLit = (c: Ctx) => c.lit === 'all' || c.lit === 'one' || c.lit > 0

function Win({ c, x, y, w, h, arch }: { c: Ctx; x: number; y: number; w: number; h: number; arch?: boolean }) {
  const isOn = on(c)
  const fill = isOn ? LIT : DARK
  if (arch) {
    return <path d={`M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}Z`} fill={fill} stroke={EDGE} strokeWidth={0.6} className={isOn ? 'ct-lit' : undefined} />
  }
  return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={EDGE} strokeWidth={0.6} className={isOn ? 'ct-lit' : undefined} />
}

const WALLS: Record<StyleId, string[]> = {
  victorian: ['#7b3b34', '#5f4636', '#46604f', '#6a4a5f'],
  tudor: ['#bda97f', '#c8b58a', '#aa9870'],
  artdeco: ['#cdbf9a', '#b4c4bf', '#d2b9a0'],
  modernist: ['#d4d8dc', '#bcc4cb', '#e0ddd4'],
  mediterranean: ['#d8cfb8', '#cdbfa2', '#e0d6c0'],
}

function Door({ x, y, w, h, c, arch }: { x: number; y: number; w: number; h: number; c: Ctx; arch?: boolean }) {
  const glow = anyLit(c)
  return (
    <>
      {arch
        ? <path d={`M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}Z`} fill="#2b1a12" stroke={EDGE} strokeWidth={0.6} />
        : <rect x={x} y={y} width={w} height={h} fill="#2b1a12" stroke={EDGE} strokeWidth={0.6} />}
      {glow && <rect x={x + w * 0.25} y={y + 2} width={w * 0.5} height={3} fill={LIT} opacity={0.9} />}
    </>
  )
}

function Victorian({ c, wall }: { c: Ctx; wall: string }) {
  const side = shade(wall, 0.78)
  return (
    <>
      <rect x={-20} y={-34} width={40} height={34} fill={wall} />
      <rect x={20} y={-26} width={12} height={26} fill={side} />
      <polygon points="-24,-34 0,-58 24,-34" fill="#2a3042" />
      <polygon points="0,-58 24,-34 0,-34" fill="#1f2536" />
      <polygon points="19,-26 26,-40 33,-26" fill="#23283a" />
      {c.v !== 1 && <><rect x={-31} y={-46} width={13} height={46} fill={shade(wall, 0.9)} />
      <polygon points="-33,-46 -24.5,-68 -16,-46" fill="#23283a" /></>}
      {c.v !== 2 && <rect x={6} y={-58} width={5} height={15} fill="#4a2f2a" />}
      <rect x={-22} y={-35} width={44} height={2.4} fill="#e8d9b0" opacity={0.55} />
      {c.v !== 1 && <><Win c={c} x={-28} y={-40} w={6} h={9} arch />
      <Win c={c} x={-28} y={-22} w={6} h={9} arch /></>}
      <Win c={c} x={-15} y={-28} w={7} h={11} arch />
      <Win c={c} x={8} y={-28} w={7} h={11} arch />
      <Win c={c} x={-15} y={-12} w={7} h={8} />
      <Win c={c} x={8} y={-12} w={7} h={8} />
      <Win c={c} x={23} y={-20} w={6} h={9} />
      <Door x={-3.5} y={-13} w={7} h={13} c={c} arch />
    </>
  )
}

function Tudor({ c, wall }: { c: Ctx; wall: string }) {
  const beam = '#35241a'
  return (
    <>
      <rect x={-24} y={-26} width={48} height={26} fill={wall} />
      <polygon points="-30,-24 0,-62 30,-24" fill="#5a2f26" />
      <polygon points="0,-62 30,-24 0,-24" fill="#44231d" />
      {c.v !== 1 && <polygon points="-3,-30 14,-50 31,-30" fill="#6a3a2c" />}
      {c.v !== 2 && <rect x={14} y={-58} width={6} height={16} fill="#6b6459" />}
      <g stroke={beam} strokeWidth={1.8} fill="none">
        <path d="M-24 -26V0M-8 -26V0M8 -26V0M24 -26V0M-24 -13H24M-24 -26H24" />
        <path d="M-24 -13L-8 -26M24 -13L8 -26" strokeWidth={1.2} />
      </g>
      <polygon points="-14,-30 0,-48 14,-30" fill={wall} />
      <path d="M-14 -30L0 -48L14 -30M0 -48V-30" stroke={beam} strokeWidth={1.4} fill="none" />
      <Win c={c} x={-21} y={-23} w={9} h={8} />
      <Win c={c} x={12} y={-23} w={9} h={8} />
      <Win c={c} x={-3} y={-42} w={6} h={7} />
      <Win c={c} x={-21} y={-10} w={9} h={7} />
      <Door x={-4} y={-14} w={8} h={14} c={c} arch />
    </>
  )
}

function ArtDeco({ c, wall }: { c: Ctx; wall: string }) {
  const teal = '#2f6f73'
  const gold = '#d9a441'
  return (
    <>
      <rect x={-26} y={-24} width={52} height={24} fill={wall} />
      <rect x={-18} y={-44} width={36} height={20} fill={shade(wall, 0.92)} />
      {c.v !== 1 && <rect x={-11} y={-60} width={22} height={16} fill={shade(wall, 0.84)} />}
      <rect x={-26} y={-26} width={52} height={3} fill={teal} />
      <rect x={-18} y={-46} width={36} height={3} fill={teal} />
      {c.v !== 1 && <rect x={-11} y={-62} width={22} height={3} fill={teal} />}
      {c.v === 0 && <><path d="M0 -62V-76" stroke={gold} strokeWidth={1.6} /><circle cx={0} cy={-77} r={1.6} fill={gold} /></>}
      {c.v === 1 && <path d="M0 -46V-58" stroke={gold} strokeWidth={1.6} />}
      <g stroke={gold} strokeWidth={0.9}>
        <path d="M-6 -60V-44M0 -60V-44M6 -60V-44" opacity={0.5} />
        <path d="M-14 -44V-24M14 -44V-24" opacity={0.5} />
      </g>
      <Win c={c} x={-22} y={-18} w={4} h={11} />
      <Win c={c} x={-14} y={-18} w={4} h={11} />
      <Win c={c} x={10} y={-18} w={4} h={11} />
      <Win c={c} x={18} y={-18} w={4} h={11} />
      <Win c={c} x={-12} y={-40} w={4} h={11} />
      <Win c={c} x={-2} y={-40} w={4} h={11} />
      <Win c={c} x={8} y={-40} w={4} h={11} />
      {c.v !== 1 && <><Win c={c} x={-6} y={-56} w={3.4} h={9} />
      <Win c={c} x={2.6} y={-56} w={3.4} h={9} /></>}
      <path d="M-8 0V-8a8 8 0 0 1 16 0V0Z" fill="#14121a" stroke={gold} strokeWidth={1} />
      <path d="M-8 -12L0 -17L8 -12M0 -17V-12" stroke={gold} strokeWidth={0.8} fill="none" />
      {anyLit(c) && <rect x={-3} y={-7} width={6} height={7} fill={LIT} opacity={0.85} />}
    </>
  )
}

function Modernist({ c, wall }: { c: Ctx; wall: string }) {
  const glass = (x: number, y: number, w: number, h: number) => {
    const isOn = on(c)
    return <rect x={x} y={y} width={w} height={h} fill={isOn ? LIT : '#1b2740'} stroke={EDGE} strokeWidth={0.6} className={isOn ? 'ct-lit' : undefined} />
  }
  return (
    <>
      <rect x={-28} y={-18} width={50} height={18} fill={wall} />
      <rect x={c.v === 1 ? -28 : -12} y={-38} width={42} height={20} fill={shade(wall, 0.88)} />
      {c.v === 2 && <rect x={22} y={-56} width={9} height={56} fill={shade(wall, 0.8)} />}
      <rect x={-30} y={-20} width={54} height={2.4} fill="#eef0f2" opacity={0.85} />
      <rect x={-14} y={-40} width={46} height={2.4} fill="#eef0f2" opacity={0.85} />
      <rect x={-12} y={-18} width={3} height={18} fill="#8b949c" />
      {glass(-24, -14, 20, 11)}
      {glass(-4, -14, 14, 11)}
      {glass(-8, -34, 15, 11)}
      {glass(10, -34, 16, 11)}
      <path d="M-9 -34V-23M10 -34V-23M-24 -9H-4" stroke={EDGE} strokeWidth={0.6} />
      <circle cx={26} cy={-6} r={5} fill="#2f5d45" />
      <circle cx={24} cy={-8} r={3} fill="#3d7656" />
      <rect x={-8} y={-44} width={10} height={4} fill="#aab2b9" />
    </>
  )
}

function Mediterranean({ c, wall }: { c: Ctx; wall: string }) {
  const clay = '#8a4a30'
  return (
    <>
      <rect x={-28} y={-24} width={34} height={24} fill={wall} />
      {c.v !== 1 && <rect x={6} y={-40} width={14} height={40} fill={shade(wall, 0.94)} />}
      <polygon points="-31,-24 -22,-33 3,-33 9,-24" fill={clay} />
      {c.v !== 1 && <polygon points="4,-40 13,-49 22,-40" fill={clay} />}
      <rect x={20} y={-14} width={14} height={14} fill={shade(wall, 0.85)} />
      <path d="M22 0v-8a5 5 0 0 1 10 0v8z" fill="#14121a" />
      <circle cx={34} cy={-12} r={7} fill="#1d4431" /><circle cx={32} cy={-15} r={4} fill="#2b5a40" />
      <path d="M-28 -8h34" stroke={shade(wall, 0.7)} strokeWidth={1} />
      <Win c={c} x={-24} y={-21} w={6} h={9} arch />
      <Win c={c} x={-14} y={-21} w={6} h={9} arch />
      <Win c={c} x={-4} y={-21} w={6} h={9} arch />
      {c.v !== 1 && <Win c={c} x={9} y={-36} w={6} h={9} arch />}
      <Win c={c} x={9} y={-22} w={6} h={7} />
      <Door x={-14} y={-12} w={8} h={12} c={c} arch />
    </>
  )
}

const ART: Record<StyleId, (p: { c: Ctx; wall: string }) => ReactNode> = {
  victorian: Victorian, tudor: Tudor, artdeco: ArtDeco, modernist: Modernist, mediterranean: Mediterranean,
}

export function Building({ style, seed, lit, scale = 1, smoke, sx, sy }: { style: StyleId; seed: number; lit: Lit; scale?: number; smoke?: boolean; sx?: number; sy?: number }) {
  const r = rng(seed ^ 0x9e3779b9)
  const walls = WALLS[style]
  const wall = walls[seed % walls.length]
  const Art = ART[style]
  // Variety inside a style: mirror, proportions, and one structural variant.
  const flip = (seed >>> 5) % 2 ? -1 : 1
  const w = sx ?? [0.9, 1, 1.1][(seed >>> 7) % 3]
  const h = sy ?? [0.92, 1, 1.1][(seed >>> 9) % 3]
  const v = (seed >>> 11) % 3
  return (
    <g transform={`scale(${flip * w * scale} ${h * scale})`}>
      <ellipse cx={0} cy={1.5} rx={32} ry={5} fill="#05070e" opacity={0.45} />
      <Art c={{ r, lit, used: 0, v }} wall={wall} />
      {smoke && <path className="ct-smoke" d="M12 -64q-5-6 0-11t0-11" fill="none" stroke="#efe3c8" strokeWidth={2} strokeLinecap="round" opacity={0.5} />}
    </g>
  )
}

/** Same building in its own little SVG (case card). */
export function BuildingThumb({ style, seed, lit, size = 96 }: { style: StyleId; seed: number; lit: Lit; size?: number }) {
  return (
    <svg width={size} height={size * 0.95} viewBox="-42 -86 84 92" aria-hidden="true" focusable="false">
      <rect x={-42} y={-86} width={84} height={92} rx={10} fill="#0c1220" />
      <ellipse cx={0} cy={-26} rx={36} ry={34} fill="#d9a441" opacity={lit === 0 ? 0 : 0.1} />
      <Building style={style} seed={seed} lit={lit} />
    </svg>
  )
}

export function Tree({ r, seed, olive }: { r: number; seed: number; olive?: boolean }) {
  const g = olive ? '#4a5a3c' : seed % 2 ? '#183a2c' : '#1d4431'
  return (
    <g>
      <ellipse cx={0} cy={1} rx={r * 0.9} ry={r * 0.32} fill="#05070e" opacity={0.4} />
      <rect x={-1} y={-r * 0.6} width={2} height={r * 0.7} fill="#2a1d14" />
      <circle cx={0} cy={-r * 1.3} r={r} fill={g} />
      <circle cx={-r * 0.3} cy={-r * 1.55} r={r * 0.55} fill="#2a5a40" opacity={0.7} />
    </g>
  )
}
