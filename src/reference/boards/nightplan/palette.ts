// ============================================================================
// Night Plan palette — F-spec §1.1. The sheet uses these twelve colours and no
// others. Shading / shadows / pools / hairlines are ALPHA variants of them
// (shadow = ink @ 0.18), never a thirteenth hue. The sheet does not theme.
// ============================================================================

export const P = {
  paper: '#E9E1CC',   // S1 sheet ground and margin
  ink: '#1A1008',     // S2 outlines, labels, hairlines
  wall: '#2A1D16',    // S3 poché
  wood: '#C9AE8A',    // S4 floor: Living Room etc.
  tile: '#BFC3B4',    // S5 floor: kitchen / dining / bath
  rose: '#D6B6B0',    // S6 floor: bedroom
  olive: '#B9BB98',   // S7 floor: office / den; garden at 60%; shrub fill
  stone: '#D2C7AE',   // S8 floor: hallway / corridor
  bone: '#F1E8CE',    // S9 furniture light
  oak: '#B8A27F',     // S10 furniture mid
  amber: '#D89A22',   // S11 lamp pool (alpha <= 0.35)
  oxblood: '#8C2D24', // S12 reserved (conflict, victim); unused by the board
} as const

/** Vignette colour: chrome graphite bleeding onto the sheet, alpha only. */
export const VIGNETTE = '#111511'

export const PALETTE_VALUES: readonly string[] = Object.values(P)

/** Alpha constants from the spec. */
export const A = { shadow: 0.18, hairline: 0.1, trim: 0.35, label: 0.72, arc: 0.45, pool: 0.22, vignette: 0.34 } as const

/** The single light direction: shadows fall lower-right by this many cells. */
export const SHADOW_OFFSET = 0.05

export type FloorKind = 'wood' | 'tile' | 'rose' | 'olive' | 'stone' | 'garden' | 'deck'

export interface RoomClass {
  kind: FloorKind
  /** Garden / yard / porch: landscaping, never walled. */
  exterior: boolean
  /** Circulation room: doors prefer to connect to it; front door sits on it. */
  hub: boolean
}

const EXTERIOR_GARDEN = /garden|yard|patio|lawn|courtyard|terrace|driveway|balcony|grounds/i
const EXTERIOR_DECK = /porch|veranda|verandah|loggia|deck|stoop/i
const HUB = /hall|entrance|landing|foyer|corridor|lobby|vestibule|passage|stairs/i
const ROSE = /bed|nursery|guest|dressing/i
const TILE = /kitchen|dining|bath|toilet|wc|pantry|laundry|utility|scullery|conservatory|shower|cloak/i
const OLIVE = /office|den\b/i

export function classifyRoom(name: string): RoomClass {
  if (EXTERIOR_DECK.test(name)) return { kind: 'deck', exterior: true, hub: false }
  if (EXTERIOR_GARDEN.test(name)) return { kind: 'garden', exterior: true, hub: false }
  if (HUB.test(name)) return { kind: 'stone', exterior: false, hub: true }
  if (ROSE.test(name)) return { kind: 'rose', exterior: false, hub: false }
  if (TILE.test(name)) return { kind: 'tile', exterior: false, hub: false }
  if (OLIVE.test(name)) return { kind: 'olive', exterior: false, hub: false }
  return { kind: 'wood', exterior: false, hub: false }
}

export const FLOOR_FILL: Record<FloorKind, string> = {
  wood: P.wood,
  tile: P.tile,
  rose: P.rose,
  olive: P.olive,
  stone: P.stone,
  garden: P.olive,
  deck: P.wood,
}

export const PLAN_FONT = '"Courier Prime", "Courier New", Courier, ui-monospace, monospace'
