import type { StyleKit } from './types'

/** Grand Foyer: black lacquer, gold, emerald, cream terrazzo. */
export const artdeco: StyleKit = {
  id: 'artdeco',
  label: 'Art Déco',
  labelEn: 'Art Deco',
  nightFill: 0.14,
  floors: {
    hall: { mat: 'terrazzo', a: '#8f8672', b: '#2b2823', c: '#b6a47c', inlay: 'sunburst', band: { color: '#1C1C22', line: '#C9A24A', w: 0.12 } },
    living: { mat: 'marble', a: '#24242C', b: '#8a8aa0', inlay: 'diamonds' },
    dining: { mat: 'marble', a: '#24242C', b: '#8a8aa0', inlay: 'diamonds' },
    kitchen: { mat: 'chequer', a: '#1d1d1f', b: '#8c8777' },
    bath: { mat: 'mosaic', a: '#8a8c88', b: '#1c1c22', band: { color: '#1C1C22', line: '#C9A24A', w: 0.09 } },
    bed: { mat: 'planks', a: '#8E6B45', band: { color: '#5b3f25', line: '#C9A24A', w: 0.08 } },
    study: { mat: 'planks', a: '#3E2719', band: { color: '#1C1C22', line: '#C9A24A', w: 0.09 } },
    pantry: { mat: 'chequer', a: '#222', b: '#7d7868' },
    conservatory: { mat: 'terrazzo', a: '#6d8a80', b: '#1c1c22', c: '#C9A24A' },
    landing: { mat: 'terrazzo', a: '#8f8672', b: '#2b2823', c: '#b6a47c' },
    yard: { mat: 'chequer', a: '#25352e', b: '#2f4238' },
    garden: { mat: 'chequer', a: '#233a32', b: '#2c4a3f' },
    porch: { mat: 'terrazzo', a: '#8f8672', b: '#2b2823', c: '#b6a47c' },
    other: { mat: 'marble', a: '#1c1c22', b: '#8a8aa0' },
  },
  pal: {
    wood: '#1c1c22', woodHi: '#3a3a44', fabric: '#0F5E55', fabric2: '#1c1c22', accent: '#C9A24A',
    metal: '#C9A24A', leaf: '#1f5a46', leaf2: '#3a8a68', stone: '#8f8672', enamel: '#d9d0bd', glass: '#c9d6d0',
  },
  wall: { ext: '#24242C', int: '#24242C', trim: '#C9A24A', extTex: 'lacquer', intTex: 'lacquer', line: '#C9A24A' },
  garden: {
    lawn: '#1d3a31', lawnDark: '#142a24', hedge: '#24493c', hedgeHi: '#3f7a64', path: '#7c786c', bed: '#2d2a33',
    flowers: ['#C9A24A', '#e8d9a8', '#0F5E55'], trees: ['palm', 'cypress'], edge: 'low-wall',
    features: ['fountain', 'topiary', 'lamp-post', 'urn'], steps: '#9a927f',
  },
  curtain: '#b88c2f',
  glass: '#1b2a30',
  decor: { fireplace: true, sconce: 'fan', painting: false, curtains: true, rails: false, mirror: true, shelf: true },
  font: '"Century Gothic", "Futura", "Trebuchet MS", "Gill Sans", sans-serif',
}
