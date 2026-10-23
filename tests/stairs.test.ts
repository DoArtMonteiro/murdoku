import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { resolveScene } from '../src/scene3d/resolve'
import type { SceneSpec } from '../src/scene3d/schema'
import { validateScene, validateStoreyPair } from '../src/scene3d/validate'
import { twoStoreyReferenceGround } from '../src/scene3d/scenes/two-storey-reference-ground'
import { twoStoreyReferenceUpper } from '../src/scene3d/scenes/two-storey-reference-upper'

const lowerSpec = (): SceneSpec => ({
  puzzleId: 'two-storey-reference',
  floor: 0,
  entry: { wall: 'west', at: 4.5 },
  walls: [],
  furniture: [],
  stairs: { model: 'stairsOpen', at: [3.5, 4.5], facing: 'E' },
})

const upperSpec = (): SceneSpec => ({
  puzzleId: 'two-storey-reference',
  floor: 1,
  walls: [],
  furniture: [],
  // The measured straight flight crosses columns 2–4 in row 4. Column 5 is
  // the upper landing; column 1 is the lower landing.
  stairwell: [2, 4, 4, 4],
})

const pairCodes = (lower = lowerSpec(), upper = upperSpec()) => validateStoreyPair(
  resolveScene(lower, 8),
  resolveScene(upper, 8),
).filter(issue => issue.severity === 'error').map(issue => issue.code)

describe('two-storey stair validation', () => {
  it.each([
    ['E', 1, 0], ['S', 0, 1], ['W', -1, 0], ['N', 0, -1],
  ] as const)('renders the measured +X stair climb toward %s', (facing, x, z) => {
    const spec = { ...lowerSpec(), stairs: { ...lowerSpec().stairs!, facing } }
    const stair = resolveScene(spec, 8).objects.find(object => object.kind === 'stairs')!
    const climb = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), stair.rotY * Math.PI / 180)
    expect(climb.x).toBeCloseTo(x)
    expect(climb.z).toBeCloseTo(z)
  })

  it('accepts the real playable reference pair', () => {
    expect(validateStoreyPair(
      resolveScene(twoStoreyReferenceGround, 8),
      resolveScene(twoStoreyReferenceUpper, 8),
    ).filter(issue => issue.severity === 'error')).toEqual([])
  })

  it('accepts a measured flight, matching stairwell and clear landings', () => {
    expect(pairCodes()).toEqual([])
  })

  it('rejects an upper floor with no stairwell', () => {
    const upper = upperSpec()
    delete upper.stairwell
    expect(pairCodes(lowerSpec(), upper)).toContain('stairwell-missing')
  })

  it('rejects a stairwell that does not expose the full physical flight', () => {
    const upper = upperSpec()
    upper.stairwell = [3, 4, 4, 4]
    expect(pairCodes(lowerSpec(), upper)).toContain('stairwell-size-mismatch')
  })

  it('rejects a slab that covers the head of the flight', () => {
    const upper = upperSpec()
    upper.stairwell = [2, 4, 3, 4]
    expect(pairCodes(lowerSpec(), upper)).toContain('stair-slab-blocked')
  })

  it('rejects furniture on either landing', () => {
    const lower = lowerSpec()
    lower.furniture.push({ id: 'lower-blocker', model: 'chair', at: [1.5, 4.5] })
    expect(pairCodes(lower, upperSpec())).toContain('stair-landing-blocked')

    const upper = upperSpec()
    upper.furniture.push({ id: 'upper-blocker', model: 'chair', at: [5.5, 4.5] })
    expect(pairCodes(lowerSpec(), upper)).toContain('stair-landing-blocked')
  })

  it('rejects a pair that does not describe consecutive storeys of one case', () => {
    const upper = upperSpec()
    upper.puzzleId = 'another-case'
    expect(pairCodes(lowerSpec(), upper)).toContain('storey-mismatch')
  })

  it('keeps ordinary wall collision validation active for the staircase', () => {
    const lower = lowerSpec()
    lower.walls.push({ id: 'through-stairs', from: [3.5, 3], to: [3.5, 6], freeEnds: ['from', 'to'] })
    const scene = resolveScene(lower, 8)
    expect(validateScene(scene).map(issue => issue.code)).toContain('wall-penetration')
  })
})
