import type { StyleKit } from './types'

/** Gaslight Villa: walnut, oxblood, forest green, brass. */
export const victorian: StyleKit = {
  id: 'victorian',
  label: 'Vitoriano',
  labelEn: 'Victorian',
  nightFill: 0.18,
  floors: {
    hall: { mat: 'chequer', a: '#2a2724', b: '#56524b', band: { color: '#2a1a12', line: '#C9A24A', w: 0.13 } },
    living: { mat: 'planks', a: '#4A2E1E', band: { color: '#33200f', line: '#C9A24A', w: 0.1 } },
    dining: { mat: 'planks', a: '#472a1b' },
    kitchen: { mat: 'quarry', a: '#6E3A2A' },
    bath: { mat: 'mosaic', a: '#7a7d76', b: '#26292a', band: { color: '#1b1d1d', w: 0.1 } },
    bed: { mat: 'planks', a: '#55382A' },
    study: { mat: 'herring', a: '#3E2719', band: { color: '#26180f', line: '#C9A24A', w: 0.09 } },
    pantry: { mat: 'flags', a: '#4d4a44' },
    conservatory: { mat: 'hydraulic', a: '#5a3a2a', b: '#2f4a3a' },
    landing: { mat: 'planks', a: '#4A2E1E' },
    yard: { mat: 'lawn', a: '#1F3A2A', b: '#17301F' },
    garden: { mat: 'lawn', a: '#1F3A2A', b: '#17301F' },
    porch: { mat: 'flags', a: '#5f5b52' },
    other: { mat: 'planks', a: '#4A2E1E' },
  },
  pal: {
    wood: '#4f301f', woodHi: '#7a5236', fabric: '#7A1F26', fabric2: '#1F3A2A', accent: '#C9A24A',
    metal: '#C9A24A', leaf: '#2f5a35', leaf2: '#4a7a48', stone: '#8a8478', enamel: '#d8cfb4', glass: '#2f6b4a',
  },
  wall: { ext: '#3a1f1a', int: '#2A2420', trim: '#D9C7A3', extTex: 'brick', intTex: 'dado', line: '#C9A24A' },
  garden: {
    lawn: '#1F3A2A', lawnDark: '#17301F', hedge: '#2C4A30', hedgeHi: '#4A7046', path: '#6E6A5E', bed: '#3B2B36',
    flowers: ['#b8325a', '#e8d9a8', '#8a5fc0'], trees: ['yew', 'yew', 'oak', 'oak'], edge: 'iron-fence',
    features: ['lamp-post', 'urn', 'glasshouse', 'bay'], steps: '#8a8578',
  },
  curtain: '#7A1F26',
  glass: '#1d2a3a',
  decor: { fireplace: true, sconce: 'gas', painting: true, curtains: true, rails: true, mirror: false, shelf: true },
  font: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
}
