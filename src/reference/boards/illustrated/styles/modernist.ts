import type { StyleKit } from './types'

/** Glass Pavilion: travertine, concrete, graphite, pool-blue, pale oak. */
export const modernist: StyleKit = {
  id: 'modernist',
  label: 'Modernista',
  labelEn: 'Modernist',
  nightFill: 0.28,
  floors: {
    hall: { mat: 'slabs', a: '#6f6f6a' },
    living: { mat: 'slabs', a: '#8b8478' },
    dining: { mat: 'slabs', a: '#8b8478' },
    kitchen: { mat: 'slabs', a: '#5f625f' },
    bath: { mat: 'plaster', a: '#6a6d6b' },
    bed: { mat: 'planks', a: '#8a6d48' },
    study: { mat: 'slabs', a: '#6f6f6a' },
    pantry: { mat: 'slabs', a: '#5f625f' },
    conservatory: { mat: 'deck', a: '#7a6a52' },
    landing: { mat: 'slabs', a: '#6f6f6a' },
    yard: { mat: 'gravel', a: '#56575a' },
    garden: { mat: 'lawn', a: '#2a4630', b: '#1c3322' },
    porch: { mat: 'deck', a: '#7a6a52' },
    other: { mat: 'slabs', a: '#8b8478' },
  },
  pal: {
    wood: '#7a5c3c', woodHi: '#a3845a', fabric: '#55585c', fabric2: '#2E2E2E', accent: '#c8c2b2',
    metal: '#b8bcc0', leaf: '#3f6d46', leaf2: '#5f9360', stone: '#a9a39a', enamel: '#a8adb2', glass: '#9FB4D8',
  },
  wall: { ext: '#9FB4D8', int: '#2E2E2E', trim: '#e6e6e0', extTex: 'glass', intTex: 'thin', line: '#9FB4D8' },
  garden: {
    lawn: '#2a4630', lawnDark: '#1c3322', hedge: '#2f4f36', hedgeHi: '#58805a', path: '#7a7a76', bed: '#4a4a4c',
    flowers: ['#d8d8d0', '#9FB4D8'], trees: ['birch'], edge: 'hedge',
    features: ['pool', 'loungers'], steps: '#9a9a96',
  },
  curtain: '#d8d4c8',
  glass: '#2a4352',
  decor: { fireplace: false, sconce: 'none', painting: true, curtains: true, rails: false, mirror: false, shelf: false },
  font: '"Helvetica Neue", "Arial Narrow", Arial, sans-serif',
}
