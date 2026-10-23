import { FramedPortrait } from './Portrait'
import { VillaVignette } from './Intro'

/**
 * Painted vignette frames for the reconstruction filmstrip (generated SVG, no
 * assets): ledger, villa with the lamps on, TV glow and two glasses, the
 * culprit over the Living Room, and the closed dossier.
 */
function Ledger() {
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vg-lamp" cx=".78" cy=".2" r=".7"><stop offset="0" stopColor="#8fe0a8" stopOpacity=".5" /><stop offset="1" stopColor="#8fe0a8" stopOpacity="0" /></radialGradient>
        <linearGradient id="vg-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3e2719" /><stop offset="1" stopColor="#24160d" /></linearGradient>
      </defs>
      <rect width="96" height="64" fill="url(#vg-desk)" />
      <rect width="96" height="64" fill="url(#vg-lamp)" />
      <path d="M10 14 L48 10 L48 54 L10 52 Z" fill="#efe3c8" stroke="#3a2a14" />
      <path d="M48 10 L86 14 L86 52 L48 54 Z" fill="#e6d9bb" stroke="#3a2a14" />
      <g stroke="#7d6a46" strokeWidth=".6" fill="none">
        {[18, 23, 28, 33, 38, 43, 48].map(y => <path key={y} d={`M14 ${y} L45 ${y - 1.4} M51 ${y - 1.4} L82 ${y}`} />)}
        <path d="M30 13 V52 M62 13 V52" />
      </g>
      <ellipse cx="62" cy="31" rx="7" ry="19" fill="none" stroke="#7a1f26" strokeWidth="2" />
      <path d="M58 24h8M58 31h8M58 38h8" stroke="#7a1f26" strokeWidth="1" />
      <path d="M78 8 q10 -4 14 4 l-12 6 z" fill="#1c5a3a" stroke="#0c2a1a" />
    </svg>
  )
}

function Tv() {
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="vg-tv" cx=".5" cy=".42" r=".7"><stop offset="0" stopColor="#ffb65a" stopOpacity=".85" /><stop offset="1" stopColor="#ffb65a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="96" height="64" fill="#140f12" />
      <rect width="96" height="64" fill="url(#vg-tv)" />
      <rect x="24" y="8" width="48" height="30" rx="3" fill="#2a1d14" stroke="#4a2e1e" strokeWidth="2" />
      <rect x="28" y="12" width="40" height="22" rx="2" fill="#ffd9a0" opacity=".9" />
      <path d="M32 30 L44 18 L52 26 L60 16 L66 24" stroke="#c98a3a" strokeWidth="1.4" fill="none" />
      <rect x="16" y="46" width="64" height="5" rx="2" fill="#3a2418" />
      <path d="M32 46 l2 -11 h8 l2 11 z" fill="#ffe2b0" opacity=".85" stroke="#6b4a20" strokeWidth=".6" />
      <path d="M54 46 l2 -9 h8 l1 9 z" fill="#ffe2b0" opacity=".6" stroke="#6b4a20" strokeWidth=".6" />
      <path d="M58 38 l3 -3 2 3" stroke="#fff" strokeWidth=".5" fill="none" />
    </svg>
  )
}

function LivingRoom({ personId }: { personId: string }) {
  return (
    <span className="rs-vig-inner">
      <svg viewBox="0 0 96 64" aria-hidden="true" focusable="false">
        <rect width="96" height="64" fill="#4a2e1e" />
        <path d="M0 0h96v64H0z" fill="#c8a574" opacity=".18" />
        <rect x="14" y="14" width="68" height="40" fill="#7a1f26" opacity=".55" />
        <rect x="6" y="10" width="12" height="30" rx="3" fill="#8a3a38" />
        <circle cx="58" cy="30" r="8" fill="#5a3a24" stroke="#2a1a10" />
        <rect x="76" y="34" width="12" height="9" fill="#1a1a1c" stroke="#0c0c0e" />
        <rect width="96" height="64" fill="none" stroke="#f3c969" strokeWidth="3" opacity=".8" />
      </svg>
      <FramedPortrait personId={personId} size={52} />
    </span>
  )
}

function Dossier() {
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      <rect width="96" height="64" fill="#1b2540" />
      <rect x="12" y="7" width="68" height="50" rx="2" fill="#efe3c8" stroke="#8a7a58" transform="rotate(-3 46 32)" />
      <g stroke="#9a8a66" strokeWidth=".8" transform="rotate(-3 46 32)">{[24, 29, 34, 39, 44].map(y => <path key={y} d={`M20 ${y} H66`} />)}</g>
      <rect x="20" y="13" width="22" height="7" fill="#7d6a46" opacity=".5" transform="rotate(-3 46 32)" />
      <g transform="rotate(-9 62 44)"><rect x="42" y="36" width="38" height="14" fill="none" stroke="#8c2d24" strokeWidth="2" /><path d="M46 43 H76" stroke="#8c2d24" strokeWidth="3" strokeDasharray="3 2" /></g>
      <path d="M70 4 v14 a3 3 0 0 1 -6 0 v-10" fill="none" stroke="#c9a24a" strokeWidth="1.4" />
    </svg>
  )
}

export function Vignette({ slot, killer }: { slot: 0 | 1 | 2 | 3 | 4; killer: string }) {
  return (
    <span className="rs-vig" aria-hidden="true" data-slot={slot}>
      {slot === 0 && <Ledger />}
      {slot === 1 && <VillaVignette decorative />}
      {slot === 2 && <Tv />}
      {slot === 3 && <LivingRoom personId={killer} />}
      {slot === 4 && <Dossier />}
    </span>
  )
}
