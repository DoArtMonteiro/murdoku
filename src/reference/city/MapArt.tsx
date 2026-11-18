// The painted night town of Portinhal: pure, deterministic SVG (no remote
// assets). Pins are NOT drawn here; they are HTML buttons layered over this art
// by CityMap so they keep a 44 px target at any zoom.
import { memo } from 'react'
import type { ReactNode } from 'react'
import { Building, Tree } from './buildings'
import { BANDSTAND, BRIDGE, DISTRICTS, MAP_H, MAP_W, RIVER_PATH, hash32, rng } from './cityModel'
import type { CityLayout, Progress, Vec } from './cityModel'

const STARS = (() => {
  const r = rng(hash32('stars'))
  // Sparse: well under one per 120 px.
  return Array.from({ length: 26 }, () => ({ x: 40 + r() * (MAP_W - 80), y: 8 + r() * 70, s: 0.5 + r() * 0.9, o: 0.25 + r() * 0.5 }))
})()

const poly = (pts: Vec[]) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

function Bridge() {
  return (
    <g transform={`translate(${BRIDGE.x} ${BRIDGE.y}) rotate(${BRIDGE.angle + 90})`}>
      {[-1, 0, 1].map(i => <path key={i} d={`M${i * 26 - 12} 58a12 8 0 0 1 24 0z`} fill="#050912" opacity={0.75} />)}
      <rect x={-34} y={-78} width={68} height={156} fill="#2a3550" />
      <rect x={-34} y={-78} width={8} height={156} fill="#4a587a" />
      <rect x={26} y={-78} width={8} height={156} fill="#4a587a" />
      <rect x={-34} y={-78} width={68} height={156} fill="none" stroke="#0a0f1c" strokeWidth={1.5} />
      <path d="M0 -74V74" stroke="#8d9ab8" strokeWidth={1.5} strokeDasharray="8 8" opacity={0.7} />
      {[-70, -35, 0, 35, 70].map(y => <path key={y} d={`M-34 ${y}h8M26 ${y}h8`} stroke="#0a0f1c" strokeWidth={1.2} />)}
      {[[-30, -80], [30, -80], [-30, 80], [30, 80]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={22} fill="url(#ct-glow)" />
          <rect x={x - 2.2} y={y - 5} width={4.4} height={8} fill="#ffb65a" />
          <rect x={x - 3} y={y + 3} width={6} height={3} fill="#20283c" />
        </g>
      ))}
    </g>
  )
}

function Bandstand() {
  return (
    <g transform={`translate(${BANDSTAND.x} ${BANDSTAND.y})`}>
      <ellipse cy={6} rx={42} ry={14} fill="#05070e" opacity={0.5} />
      <ellipse cy={2} rx={36} ry={11} fill="#2a2f3e" stroke="#c9a24a" strokeWidth={1} />
      <path d="M-26 0V-22M26 0V-22M-10 4V-22M10 4V-22" stroke="#d8c9a0" strokeWidth={2} />
      <polygon points="-34,-22 0,-44 34,-22" fill="#5a2f26" stroke="#2a1812" strokeWidth={1} />
      <circle cy={-46} r={2.4} fill="#c9a24a" />
      <circle cy={-14} r={26} fill="url(#ct-glow)" opacity={0.6} />
    </g>
  )
}

function Moon() {
  return (
    <g>
      <circle cx={1470} cy={70} r={60} fill="url(#ct-glow)" opacity={0.55} />
      <circle cx={1470} cy={68} r={15} fill="#f0e6c4" />
      <circle cx={1477} cy={63} r={13} fill="#0b1120" />
    </g>
  )
}

function Compass() {
  return (
    <g transform="translate(1520 970)" opacity={0.9}>
      <circle r={28} fill="#0b1120" stroke="#c9a24a" strokeWidth={1.8} />
      <circle r={22} fill="none" stroke="#c9a24a" strokeWidth={0.6} strokeDasharray="1.5 3" />
      <path d="M0-22L5 0L0 22L-5 0Z" fill="#c9a24a" opacity={0.85} />
      <path d="M-22 0L0 5L22 0L0 -5Z" fill="#efe3c8" opacity={0.55} />
      <path d="M0-22L5 0L-5 0Z" fill="#f0c869" />
      <circle r={2.4} fill="#0b1120" />
    </g>
  )
}

export interface MapArtProps {
  layout: CityLayout
  progress: Progress
}

function MapArtImpl({ layout, progress }: MapArtProps) {
  type Item = { by: number; node: ReactNode }
  const items: Item[] = []
  layout.pins.forEach(p => {
    const st = progress.states[p.id] ?? 'locked'
    items.push({
      by: p.by,
      node: (
        <g key={p.id} transform={`translate(${p.x} ${p.by})`}>
          <ellipse cy={5} rx={38} ry={8} fill="none" stroke="#c9a24a" strokeWidth={1.6} opacity={st === 'locked' ? 0.35 : 0.8} />
          {st === 'solved' && <circle cx={0} cy={-28} r={54} fill="url(#ct-halo)" />}
          <g opacity={st === 'locked' ? 0.7 : 1}>
            <Building style={p.style} seed={p.seed} lit={st === 'locked' ? 0 : st === 'open' ? 'one' : 'all'} smoke={st === 'solved'} />
          </g>
        </g>
      ),
    })
  })
  layout.fillers.forEach((f, i) => {
    const r = rng(f.seed)
    items.push({
      by: f.by,
      node: (
        <g key={'f' + i} transform={`translate(${f.x} ${f.by})`} opacity={0.72}>
          <Building style={f.style} seed={f.seed} lit={0.15 + r() * 0.35} scale={f.scale} sx={f.sx} sy={f.sy} />
        </g>
      ),
    })
  })
  layout.trees.forEach((t, i) => items.push({
    by: t.y, node: <g key={'t' + i} transform={`translate(${t.x} ${t.y})`}><Tree r={t.r} seed={t.seed} olive={t.olive} /></g>,
  }))
  items.sort((a, b) => a.by - b.by)

  // The walking route: a dashed gold line that extends as cases are solved.
  const routeD = layout.legs.slice(0, Math.max(0, progress.lastSolved + 1)).join('')

  return (
    <svg className="ct-art" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ct-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c1222" /><stop offset="1" stopColor="#111a2a" /></linearGradient>
        <linearGradient id="ct-river" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12294a" /><stop offset="1" stopColor="#0b1a30" /></linearGradient>
        <radialGradient id="ct-glow"><stop offset="0" stopColor="#ffb65a" stopOpacity="0.5" /><stop offset="1" stopColor="#ffb65a" stopOpacity="0" /></radialGradient>
        <radialGradient id="ct-halo"><stop offset="0" stopColor="#f0c869" stopOpacity="0.34" /><stop offset="1" stopColor="#f0c869" stopOpacity="0" /></radialGradient>
        <radialGradient id="ct-vig" cx="50%" cy="50%" r="72%"><stop offset="0.55" stopColor="#050810" stopOpacity="0" /><stop offset="1" stopColor="#050810" stopOpacity="0.6" /></radialGradient>
        <pattern id="ct-g-centro" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="#1a2130" />
          <g fill="none" stroke="#263349" strokeWidth="1"><rect x="1" y="1" width="9" height="9" rx="3" /><rect x="12" y="1" width="9" height="9" rx="3" /><rect x="6" y="12" width="9" height="9" rx="3" /></g>
        </pattern>
        <pattern id="ct-g-avenida" width="24" height="16" patternUnits="userSpaceOnUse">
          <rect width="24" height="16" fill="#1b2233" /><path d="M0 8L12 0L24 8L12 16Z" fill="none" stroke="#2a3552" strokeWidth="1" />
        </pattern>
        <pattern id="ct-g-antigo" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#1c2128" />
          <g fill="#2a2f38"><circle cx="5" cy="6" r="2" /><circle cx="17" cy="14" r="1.7" /><circle cx="9" cy="21" r="1.9" /><circle cx="22" cy="3" r="1.3" /></g>
        </pattern>
        <pattern id="ct-g-moderno" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#171f2e" /><path d="M0 .5H28M.5 0V28" stroke="#222e44" strokeWidth="1" />
        </pattern>
        <pattern id="ct-g-quinta" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#1c2620" />
          <g fill="#27362b"><circle cx="5" cy="6" r="1.5" /><circle cx="17" cy="14" r="1.3" /><circle cx="9" cy="21" r="1.4" /></g>
        </pattern>
        <filter id="ct-feather" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id="ct-feather-s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>

      <rect width={MAP_W} height={MAP_H} fill="url(#ct-sky)" />
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#efe3c8" opacity={s.o} />)}
      <Moon />

      {/* the river: banks, water, ripples, moon streak */}
      <path d={RIVER_PATH} fill="none" stroke="#6e5f3c" strokeWidth={112} strokeLinecap="round" opacity={0.85} />
      <path d={RIVER_PATH} fill="none" stroke="#0a0f1c" strokeWidth={104} strokeLinecap="round" opacity={0.6} />
      <path d={RIVER_PATH} fill="none" stroke="url(#ct-river)" strokeWidth={96} strokeLinecap="round" />
      <path className="ct-ripples" d={RIVER_PATH} fill="none" stroke="#9fb4d8" strokeWidth={2} strokeDasharray="36 90" strokeLinecap="round" opacity={0.25} transform="translate(0 -14)" />
      <path className="ct-ripples" d={RIVER_PATH} fill="none" stroke="#9fb4d8" strokeWidth={1.6} strokeDasharray="22 120" strokeLinecap="round" opacity={0.2} transform="translate(0 16)" />

      {/* ground: soft district tints with feathered edges, no panels */}
      {DISTRICTS.map(d => (
        <g key={d.id}>
          <mask id={`ct-m-${d.id}`}><polygon points={poly(layout.hull[d.id])} fill="#fff" stroke="#fff" strokeWidth={30} strokeLinejoin="round" filter="url(#ct-feather)" /></mask>
          <rect width={MAP_W} height={MAP_H} fill={`url(#ct-g-${d.id})`} mask={`url(#ct-m-${d.id})`} opacity={0.85} />
        </g>
      ))}
      {/* streets: curved, following the terrain and the river */}
      {layout.streets.map(st => (
        <g key={st.id}>
          <path d={st.d} fill="none" stroke="#3a4766" strokeWidth={st.kind === 'quay' ? 11 : 19} strokeLinecap="round" strokeLinejoin="round" />
          <path d={st.d} fill="none" stroke={st.kind === 'quay' ? '#1d2538' : '#161d2c'} strokeWidth={st.kind === 'quay' ? 7 : 15} strokeLinecap="round" strokeLinejoin="round" />
          {st.kind === 'main' && <path d={st.d} fill="none" stroke="#3e4d6c" strokeWidth={1.2} strokeDasharray="9 9" />}
        </g>
      ))}
      <Bandstand />
      <Bridge />
      {routeD && <path className="ct-route" d={routeD} fill="none" stroke="#c9a24a" strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" opacity={0.9} />}
      {items.map(i => i.node)}
      {/* fog over neighbourhoods that are still locked: feathered, the town stays alive */}
      {DISTRICTS.filter(d => !progress.hoods[d.id].unlocked).map(d => (
        <polygon key={d.id} points={poly(layout.hull[d.id])} fill="#121826" stroke="#121826" strokeWidth={34} strokeLinejoin="round" opacity={0.5} filter="url(#ct-feather)" />
      ))}
      {layout.lamps.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y})`}>
          <circle cy={-6} r={15} fill="url(#ct-glow)" />
          <path d="M0 3V-9" stroke="#20283c" strokeWidth={2} />
          <circle cy={-10} r={2.2} fill="#ffb65a" />
        </g>
      ))}
      <Compass />
      <rect width={MAP_W} height={MAP_H} fill="url(#ct-vig)" />
    </svg>
  )
}

export const MapArt = memo(MapArtImpl)
