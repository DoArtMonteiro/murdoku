import type { StyleKit } from './types'

/** Timbered Hall: elm boards, plaster, dark timber, red wool, flagstone. */
export const tudor: StyleKit = {
  id: 'tudor',
  label: 'Tudor',
  labelEn: 'Tudor',
  nightFill: 0.18,
  floors: {
    hall: { mat: 'flags', a: '#4d4a44' },
    living: { mat: 'planks', a: '#6A4A2E' },
    dining: { mat: 'planks', a: '#664628' },
    kitchen: { mat: 'brick', a: '#7A3E2E', b: '#5e2f24' },
    bath: { mat: 'flags', a: '#4a4d52' },
    bed: { mat: 'planks', a: '#5E4128' },
    study: { mat: 'planks', a: '#4C3220' },
    pantry: { mat: 'flags', a: '#524f48' },
    conservatory: { mat: 'brick', a: '#7A3E2E', b: '#5e2f24' },
    landing: { mat: 'planks', a: '#5E4128' },
    yard: { mat: 'cobble', a: '#6a665c' },
    garden: { mat: 'lawn', a: '#24402a', b: '#193020' },
    porch: { mat: 'flags', a: '#4d4a44' },
    other: { mat: 'planks', a: '#6A4A2E' },
  },
  pal: {
    wood: '#4a3020', woodHi: '#7a5a3a', fabric: '#7A1F26', fabric2: '#2C4A30', accent: '#b8923a',
    metal: '#a9774a', leaf: '#3a6a3a', leaf2: '#5a8a48', stone: '#8c887c', enamel: '#2c2824', glass: '#d89a40',
  },
  wall: { ext: '#d9cdb3', int: '#3B2A1C', trim: '#D9CDB3', extTex: 'plaster', intTex: 'dado', line: '#D9CDB3' },
  garden: {
    lawn: '#24402a', lawnDark: '#193020', hedge: '#2C4A30', hedgeHi: '#4f7a4a', path: '#7a4a3a', bed: '#3a2a22',
    flowers: ['#d8b0c0', '#e8d9a8', '#c05a3a', '#8a7ac0'], trees: ['apple', 'oak'], edge: 'picket',
    features: ['well', 'pots', 'vines'], steps: '#7a766a',
  },
  curtain: '#7A1F26',
  glass: '#26303a',
  lattice: true,
  decor: { fireplace: true, sconce: 'candle', painting: false, curtains: false, rails: false, mirror: false, shelf: true },
  font: 'Georgia, "Palatino Linotype", "Book Antiqua", serif',
}
