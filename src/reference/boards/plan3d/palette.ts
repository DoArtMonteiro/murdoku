// F-spec 1.1: the sheet palette. Twelve colours; everything on the board is one
// of these (or an alpha of one). The sheet does not theme.
export const S = {
  paper: '#E9E1CC',     // S1
  ink: '#1A1008',       // S2
  wall: '#2A1D16',      // S3 poche
  wood: '#C9AE8A',      // S4
  tile: '#BFC3B4',      // S5
  rose: '#D6B6B0',      // S6
  olive: '#B9BB98',     // S7
  stone: '#D2C7AE',     // S8
  bone: '#F1E8CE',      // S9 furniture light
  oak: '#B8A27F',       // S10 furniture mid
  amber: '#D89A22',     // S11
  oxblood: '#8C2D24',   // S12
} as const

/** Graphite chrome colour, used only as the vignette's alpha gradient. */
export const GRAPHITE = '#111511'

/** Exterior cells: S7 olive at 60% over paper (an alpha mix of two sheet colours). */
export const OUTSIDE_MIX = 0.6

/** Role of a Kenney material in the pictogram: what colour its faces take. */
export type Role = 'light' | 'dark' | 'leaf' | 'rimDark' | 'glass'

const ROLE: Record<string, Role> = {
  metalDark: 'dark', metalMedium: 'dark', woodDark: 'dark', glass: 'glass',
  plant: 'leaf', leafsGreen: 'leaf', grass: 'leaf',
  carpetDarker: 'rimDark', stoneDark: 'rimDark',
}
export const roleOf = (material: string): Role => ROLE[material] ?? 'light'
