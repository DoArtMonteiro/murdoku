import type { EvidenceKind } from '../story/schema'

/** Small engraved glyphs for the evidence tiles (currentColor, 24x24). Offline, no assets. */
export function EvidenceIcon({ kind, size = 28 }: { kind: EvidenceKind; size?: number }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let g
  switch (kind) {
    case 'parcel':
      g = <g {...p}><rect x="3.5" y="7" width="17" height="12" rx="1" /><path d="M3.5 11h17M12 7v12" /><circle cx="12" cy="11" r="1.4" fill="currentColor" /></g>
      break
    case 'letter':
      g = <g {...p}><rect x="3" y="6" width="18" height="12.5" rx="1" /><path d="M3.5 7l8.5 6.5L20.5 7M15 14l4.5 4M9 14l-4.5 4" /></g>
      break
    case 'key':
      g = <g {...p}><circle cx="8" cy="12" r="3.6" /><path d="M11.6 12H21M18 12v3M15.5 12v2.2" /></g>
      break
    case 'brooch':
      g = <g {...p}><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></g>
      break
    case 'journal':
      g = <g {...p}><path d="M4 6c3-1.4 5.5-1.4 8 .6 2.5-2 5-2 8-.6v12c-3-1.4-5.5-1.4-8 .6-2.5-2-5-2-8-.6z" /><path d="M12 6.6v12" /></g>
      break
    case 'shears':
      g = <g {...p}><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="12.5" cy="19" r="2.2" /><path d="M8 15.5L19 4M13.5 17L20 8" /></g>
      break
    case 'glass':
      g = <g {...p}><path d="M7 4h10l-1.2 7a3.8 3.8 0 0 1-7.6 0z" /><path d="M12 14.8V20M8.5 20h7" /><path d="M9.4 7.5l1.6 2 1-1.6 1.4 2" /></g>
      break
    case 'photo':
      g = <g {...p}><rect x="4" y="5" width="16" height="14" rx="1" /><circle cx="9" cy="10" r="1.6" /><path d="M4.5 17l5-4.5 3.5 3 3-2.5 3.5 3" /></g>
      break
    case 'receipt':
      g = <g {...p}><path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" /><path d="M9 8.5h6M9 12h6M9 15.5h3" /></g>
      break
    case 'ring':
      g = <g {...p}><circle cx="12" cy="14.5" r="5.5" /><path d="M9.5 6.5l2.5-3 2.5 3-2.5 2.2z" /></g>
      break
    case 'matchbook':
      g = <g {...p}><rect x="5" y="9" width="14" height="10" rx="1" /><path d="M8 9V5.5M11 9V4.5M14 9V5.5" /></g>
      break
    case 'glove':
      g = <g {...p}><path d="M7 20V12l-2-3 1.6-1 2 2V5.5a1.1 1.1 0 0 1 2.2 0V10m0-1.5a1.1 1.1 0 0 1 2.2 0V10m0-.8a1.1 1.1 0 0 1 2.2 0V14c0 3-1.5 6-5 6z" /></g>
      break
    case 'button':
      g = <g {...p}><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="10.6" cy="11" r=".5" fill="currentColor" /><circle cx="13.4" cy="11" r=".5" fill="currentColor" /></g>
      break
    case 'ticket':
      g = <g {...p}><path d="M4 8h16v3a1.8 1.8 0 0 0 0 3.6V18H4v-3.4a1.8 1.8 0 0 0 0-3.6z" /><path d="M14 8v10" strokeDasharray="1.5 2" /></g>
      break
    case 'footprint':
      g = <g {...p}><path d="M8 4.5c2 0 3 2 3 4.5s-1 4-2.6 4S6 10.800 6 8.500 6.500 4.500 8 4.500z" /><path d="M16 11c2 0 3 2 3 4.500s-1 4-2.600 4S14 17.300 14 15s.500-4 2-4z" /></g>
      break
    case 'coin':
      g = <g {...p}><circle cx="12" cy="12" r="7.5" /><path d="M12 8v8M9.600 10.200c.4-1 1.400-1.400 2.400-1.400s2.200.500 2.200 1.500c0 2-4.500 1.200-4.500 3.300 0 1 1.100 1.600 2.300 1.600s2-.5 2.400-1.500" /></g>
      break
    default:
      g = <g {...p}><circle cx="10.500" cy="10.500" r="5.500" /><path d="M14.500 14.500L20 20" /></g>
  }
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">{g}</svg>
}
