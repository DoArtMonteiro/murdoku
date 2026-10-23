// Hand-drawn SVG icons for Portinhal: neighbourhood badges, pin marks, evidence, medals.
import type { ReactNode } from 'react'
import type { DistrictId, EvidenceId, HoodState, MedalId, StyleId } from './cityModel'

const GOLD = '#c9a24a'
const GOLD_HI = '#f0c869'
const CREAM = '#efe3c8'
const NAVY = '#1a2133'
const STEEL = '#55607a'

function Glyph({ id, ink }: { id: DistrictId; ink: string }): ReactNode {
  const p = { fill: 'none', stroke: ink, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'centro': // gas lamp
      return (
        <g {...p}>
          <path d="M32 46V27M27 46h10M29 49h6M26 27h12l-2-9h-8zM29 18l3-5 3 5" />
          <path d="M32 21v4" strokeWidth={1.3} />
        </g>
      )
    case 'avenida': // fan / sunburst
      return (
        <g {...p}>
          <path d="M14 44h36M32 44V26M32 44L20 30M32 44L44 30M32 44L15 38M32 44L49 38" />
          <path d="M18 44a14 14 0 0 1 28 0" />
        </g>
      )
    case 'antigo': // lantern with diamond panes
      return (
        <g {...p}>
          <path d="M27 16h10M32 12v4M25 20h14l2 24H23zM23 44h18M32 20v24" />
          <path d="M28 27l4 4-4 4M36 27l-4 4 4 4" strokeWidth={1.3} />
        </g>
      )
    case 'moderno': // slim rectangle with a dot
      return (
        <g {...p}>
          <rect x={25} y={15} width={14} height={32} rx={1} />
          <circle cx={32} cy={24} r={2.4} fill={ink} />
          <path d="M25 33h14M25 40h14" strokeWidth={1.2} />
        </g>
      )
    case 'quinta': // arch with a key
      return (
        <g {...p}>
          <path d="M20 47V28a12 12 0 0 1 24 0v19zM14 47h36" />
          <circle cx={32} cy={28} r={3.2} />
          <path d="M32 31.2V42M32 38h4M32 42h3" strokeWidth={1.5} />
        </g>
      )
  }
}

export function Padlock({ size = 14, color = CREAM }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x={3.2} y={7} width={9.6} height={7} rx={1.4} fill={color} />
      <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke={color} strokeWidth={1.7} />
      <circle cx={8} cy={10.6} r={1.1} fill={NAVY} />
    </svg>
  )
}

const LAUREL = 'M14 54q-8-8-6-20M50 54q8-8 6-20M12 50q-2-4 0-7M52 50q2-4 0-7'

/**
 * Round neighbourhood badge (CITY-LANGUAGE §2): locked = steel ring + padlock tab,
 * available = gold ring with a slow glow, progress = cream arc outside the ring,
 * complete = solid gold disc, navy icon, laurel.
 */
export function DistrictBadge({ id, state, size = 56, numerals, fraction = 0 }: {
  id: DistrictId; state: HoodState; size?: number; numerals: string; fraction?: number
}) {
  const locked = state === 'locked'
  const done = state === 'complete'
  const ring = locked ? STEEL : GOLD
  const R = 31.5, C = 2 * Math.PI * R
  return (
    <span className="ct-badge" data-state={state} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="-4 -4 72 72" aria-hidden="true" focusable="false">
        <circle cx={32} cy={32} r={29} fill={done ? GOLD : NAVY} stroke={ring} strokeWidth={2.4} />
        {!done && <circle cx={32} cy={32} r={25} fill="none" stroke={ring} strokeWidth={0.6} strokeDasharray="1.5 2.5" opacity={0.6} />}
        {state === 'progress' && (
          <circle cx={32} cy={32} r={R} fill="none" stroke={CREAM} strokeWidth={2.2} strokeLinecap="round"
            strokeDasharray={`${C * fraction} ${C}`} transform="rotate(-90 32 32)" />
        )}
        <g opacity={locked ? 0.7 : 1}><Glyph id={id} ink={done ? NAVY : locked ? STEEL : CREAM} /></g>
        {done && <path d={LAUREL} fill="none" stroke={NAVY} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />}
        {locked && <circle cx={32} cy={32} r={29} fill="#121826" opacity={0.4} />}
      </svg>
      <span className="ct-badge-tab">{locked ? <Padlock size={12} /> : numerals}</span>
    </span>
  )
}

/** Small round mark used on pins. */
export function PinMark({ kind }: { kind: 'locked' | 'open' | 'solved' }) {
  return (
    <svg width={22} height={22} viewBox="-11 -11 22 22" aria-hidden="true" focusable="false">
      <circle r={10} fill={kind === 'solved' ? GOLD : NAVY} stroke={kind === 'locked' ? STEEL : GOLD} strokeWidth={1.6} />
      {kind === 'solved' && <path d="M-4.6 0.4l3.2 3.2 6-6.6" fill="none" stroke={NAVY} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'open' && <><circle cx={-1.2} cy={-1.2} r={4} fill="none" stroke={GOLD_HI} strokeWidth={1.8} /><path d="M1.8 1.8l3.6 3.6" stroke={GOLD_HI} strokeWidth={1.8} strokeLinecap="round" /></>}
      {kind === 'locked' && <><rect x={-4} y={-1} width={8} height={6} rx={1} fill={CREAM} /><path d="M-2.4 -1v-2a2.4 2.4 0 0 1 4.8 0v2" fill="none" stroke={CREAM} strokeWidth={1.5} /></>}
    </svg>
  )
}

const L = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const EV: Record<EvidenceId, ReactNode> = {
  parcel: (<g {...L} stroke={CREAM} strokeWidth={2}><path d="M8 18l16-8 16 8v20l-16 8-16-8zM8 18l16 8 16-8M24 26v20" fill="#4a3526" /><circle cx={24} cy={26} r={4.4} fill="#8c2d24" stroke="#d3584b" strokeWidth={1.3} /></g>),
  letter: (<g {...L} stroke={CREAM} strokeWidth={2}><rect x={6} y={12} width={36} height={25} rx={2} fill="#2e3550" /><path d="M6 14l18 14 18-14" /><circle cx={24} cy={29} r={5} fill="#8c2d24" stroke="#d3584b" strokeWidth={1.4} /></g>),
  key: (<g {...L} stroke={GOLD_HI} strokeWidth={2.4}><circle cx={16} cy={20} r={8} /><circle cx={16} cy={20} r={2.6} fill={GOLD_HI} /><path d="M23 25l17 17M34 36l4-4M39 41l4-4" /></g>),
  brooch: (<g {...L}><circle cx={24} cy={24} r={15} stroke={GOLD_HI} strokeWidth={2.4} /><circle cx={24} cy={24} r={9} fill="#1f7a5a" stroke={GOLD} strokeWidth={1.6} /><path d="M20 21l4-4 4 4" stroke="#bfe9d6" strokeWidth={1.4} /><g fill={GOLD_HI} stroke="none"><circle cx={24} cy={7} r={2} /><circle cx={24} cy={41} r={2} /><circle cx={7} cy={24} r={2} /><circle cx={41} cy={24} r={2} /></g></g>),
  cocktail: (<g {...L} stroke={CREAM} strokeWidth={2.2}><path d="M10 12h28L24 28zM24 28v14M16 42h16" /><path d="M14 16h20" stroke="#d9a441" /><circle cx={34} cy={10} r={3} fill="#8c2d24" stroke="none" /></g>),
  ticket: (<g {...L} stroke={GOLD_HI} strokeWidth={2}><path d="M6 14h36v7a3 3 0 0 0 0 6v7H6v-7a3 3 0 0 0 0-6z" fill="#2e3550" /><path d="M30 14v20" strokeDasharray="2 3" /><path d="M12 22h12M12 28h8" stroke={CREAM} strokeWidth={1.5} /></g>),
  lamp: (<g {...L}><path d="M12 22q12-14 24 0z" fill="#1f7a5a" stroke={CREAM} strokeWidth={1.6} /><path d="M24 22v14M16 40h16M18 36h12" stroke={GOLD_HI} strokeWidth={2.4} /></g>),
  candle: (<g {...L} stroke={GOLD_HI} strokeWidth={2.2}><path d="M24 14v16M17 40h14M20 40l2-8h4l2 8M14 26q10 8 20 0" /><rect x={21.5} y={14} width={5} height={10} fill={CREAM} stroke="none" /><path d="M24 7q3 3 0 6q-3-3 0-6z" fill="#ffb65a" stroke="none" /></g>),
  shears: (<g {...L} stroke={CREAM} strokeWidth={2.2}><circle cx={13} cy={37} r={5.5} stroke={GOLD_HI} /><circle cx={27} cy={39} r={5.5} stroke={GOLD_HI} /><path d="M16 32L34 8M24 34L14 8" /></g>),
  mug: (<g {...L} stroke={CREAM} strokeWidth={2.2}><path d="M12 14h20v24a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4zM32 20h4a4 4 0 0 1 0 12h-4" fill="#3a4152" /><path d="M12 22h20" stroke={GOLD_HI} strokeWidth={1.4} /></g>),
  blueprint: (<g {...L} stroke={CREAM} strokeWidth={1.8}><rect x={7} y={10} width={34} height={28} rx={2} fill="#1f3d6b" /><path d="M13 30V18h12v12zM25 24h10M13 24h12M30 16v12" strokeWidth={1.3} /></g>),
  watch: (<g {...L} stroke={GOLD_HI} strokeWidth={2.2}><circle cx={24} cy={27} r={13} fill="#1b2438" /><circle cx={24} cy={10} r={3.2} /><path d="M24 27V19M24 27l6 3" stroke={CREAM} strokeWidth={1.8} /></g>),
  photo: (<g {...L} stroke={CREAM} strokeWidth={2}><rect x={8} y={9} width={32} height={30} rx={2} fill="#2b2f3a" /><rect x={12} y={13} width={24} height={18} fill="#41495c" /><circle cx={24} cy={20} r={4} fill="#aab4c8" stroke="none" /><path d="M16 31q8-7 16 0" stroke="#aab4c8" /></g>),
  tile: (<g {...L} stroke={CREAM} strokeWidth={1.8}><rect x={8} y={8} width={32} height={32} rx={2} fill="#1f4e8c" /><path d="M24 8v32M8 24h32" /><path d="M24 14l6 10-6 10-6-10z" fill="#e9e1d1" stroke="none" /></g>),
  ring: (<g {...L}><circle cx={24} cy={29} r={12} stroke={GOLD_HI} strokeWidth={3} /><path d="M18 14l6-6 6 6-6 7z" fill="#bfe9d6" stroke={CREAM} strokeWidth={1.4} /></g>),
  shard: (<g {...L} stroke={CREAM} strokeWidth={1.8}><path d="M8 18l20-8 12 14-6 16-20 2z" fill="#9a5538" /><path d="M14 22l12 4M22 14l4 12" stroke={CREAM} strokeWidth={1.2} /></g>),
}

export function EvidenceIcon({ id, size = 44 }: { id: EvidenceId; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">{EV[id]}</svg>
}

/** Interior vignette glyphs for the case card (style-board thumbnails, simplified). */
export function Vignette({ style, n }: { style: StyleId; n: 0 | 1 | 2 }) {
  const warm = '#ffb65a'
  const kinds: ReactNode[] = [
    <g key="h" {...L} stroke={CREAM} strokeWidth={1.8}><path d="M8 38V14h32v24M12 38V22h24v16" /><path d="M20 38q4-10 8 0" fill={warm} stroke="none" opacity={0.9} /><path d="M10 14h28" strokeWidth={3} /></g>,
    <g key="t" {...L} stroke={CREAM} strokeWidth={1.8}><ellipse cx={24} cy={26} rx={13} ry={5} fill="#3b2a22" /><path d="M14 28v10M34 28v10M24 31v8" /><circle cx={24} cy={19} r={2.4} fill={warm} stroke="none" /></g>,
    <g key="d" {...L} stroke={CREAM} strokeWidth={1.8}><path d="M14 40V16a10 10 0 0 1 20 0v24zM10 40h28" fill="#2b1a12" /><circle cx={30} cy={28} r={1.4} fill={GOLD_HI} stroke="none" /></g>,
  ]
  const accent = { victorian: '#7b3b34', artdeco: '#2f6f73', tudor: '#5a2f26', modernist: '#41495c', mediterranean: '#8a4a30' }[style]
  return (
    <svg width="100%" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width={48} height={48} rx={6} fill={accent} opacity={0.5} />
      {kinds[n]}
    </svg>
  )
}

const MEDAL: Record<MedalId, ReactNode> = {
  'primeira-noite': (<g {...L} stroke={NAVY} strokeWidth={2.2}><path d="M24 36V22M19 36h10M21 39h6M20 22h8l-1.4-7h-5.2zM22 15l2-4 2 4" /></g>),
  'sem-rasuras': (<g {...L} stroke={NAVY} strokeWidth={2.2}><path d="M14 36l4-10 14-14 6 6-14 14zM18 26l6 6M12 38l2-4" /></g>),
  'olho-clinico': (<g {...L} stroke={NAVY} strokeWidth={2.6}><circle cx={21} cy={21} r={8} /><path d="M27 27l9 9" strokeWidth={3.4} /></g>),
  vizinhanca: (<g {...L} stroke={NAVY} strokeWidth={2}><circle cx={24} cy={24} r={12} /><path d="M24 14v20M16 20l8-6 8 6M18 34V24M30 34V24" /></g>),
  arquivista: (<g {...L} stroke={NAVY} strokeWidth={2}><circle cx={24} cy={22} r={9} fill="#8c2d24" stroke="#5a1a14" /><path d="M18 30l-3 9 6-3 3 6 3-6 6 3-3-9" /><path d="M20 22l3 3 6-6" stroke={CREAM} strokeWidth={2} /></g>),
  'meia-noite': (<g {...L} stroke={NAVY} strokeWidth={2.2}><circle cx={24} cy={24} r={12} /><path d="M24 24V14M24 24l0 0" /><circle cx={24} cy={24} r={1.4} fill={NAVY} /></g>),
}

/** Brass medal on a short oxblood ribbon. Locked: steel silhouette. */
export function Medal({ id, earned, size = 64 }: { id: MedalId; earned: boolean; size?: number }) {
  const gid = `ct-md-${id}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 56" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={earned ? '#e5c46f' : '#6a7490'} /><stop offset="1" stopColor={earned ? '#a67f2c' : '#3e475f'} />
        </linearGradient>
      </defs>
      <path d="M15 0h8l4 16h-9zM33 0h-8l-4 16h9z" fill={earned ? '#8c2d24' : '#4a4658'} />
      <circle cx={24} cy={34} r={20} fill={`url(#${gid})`} />
      <circle cx={24} cy={34} r={16.5} fill="none" stroke={earned ? '#f6e3a4' : '#7d87a3'} strokeWidth={0.8} opacity={0.7} />
      <g transform="translate(0 10)" opacity={earned ? 1 : 0.55}>
        <g stroke={earned ? NAVY : '#2a3146'}>{MEDAL[id]}</g>
      </g>
    </svg>
  )
}
