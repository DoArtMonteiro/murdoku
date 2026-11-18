import type { StyleKit } from './types'

/** Azulejo Quinta: whitewash, terracotta, azulejo blue, sage tile, chestnut. */
export const mediterranean: StyleKit = {
  id: 'mediterranean',
  label: 'Mediterrâneo',
  labelEn: 'Mediterranean',
  nightFill: 0.22,
  floors: {
    hall: { mat: 'azulejo', a: '#1F4E8C', b: '#8f8a7c', band: { color: '#1b3f73', line: '#d8d2c0', w: 0.1 } },
    living: { mat: 'quarry', a: '#9A5538' },
    dining: { mat: 'quarry', a: '#8f4e34' },
    kitchen: { mat: 'hydraulic', a: '#5F7D74', b: '#9a9684' },
    bath: { mat: 'mosaic', a: '#8a8c86', b: '#1F4E8C', band: { color: '#1b3f73', line: '#d8d2c0', w: 0.09 } },
    bed: { mat: 'plaster', a: '#9a7c5e' },
    study: { mat: 'planks', a: '#4C3220' },
    pantry: { mat: 'quarry', a: '#7d4730' },
    conservatory: { mat: 'hydraulic', a: '#1F4E8C', b: '#8f8a7c' },
    landing: { mat: 'quarry', a: '#9A5538' },
    yard: { mat: 'quarry', a: '#8a4a30' },
    garden: { mat: 'quarry', a: '#7d4a34' },
    porch: { mat: 'quarry', a: '#8a4a30' },
    other: { mat: 'quarry', a: '#9A5538' },
  },
  pal: {
    wood: '#4C3220', woodHi: '#7a5236', fabric: '#8f8a7c', fabric2: '#1F4E8C', accent: '#C9A24A',
    metal: '#C9A24A', leaf: '#3f6d46', leaf2: '#6a9a58', stone: '#a49a88', enamel: '#d8d2c0', glass: '#c98a3a',
  },
  wall: { ext: '#E8DFCF', int: '#d8cfbd', trim: '#9A5538', extTex: 'whitewash', intTex: 'whitewash', line: '#9A5538' },
  garden: {
    lawn: '#2a4630', lawnDark: '#1c3322', hedge: '#2f4f36', hedgeHi: '#58805a', path: '#9a6a50', bed: '#4a2f26',
    flowers: ['#c03a6a', '#e8d9a8', '#a05ac0'], trees: ['cypress', 'olive'], edge: 'low-wall',
    features: ['fountain', 'pots', 'vines'], steps: '#a49a88',
  },
  curtain: '#1F4E8C',
  glass: '#26323c',
  decor: { fireplace: false, sconce: 'niche', painting: false, curtains: false, rails: false, mirror: false, shelf: true },
  font: 'Georgia, "Palatino Linotype", serif',
}
