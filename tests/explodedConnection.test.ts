import { describe, expect, it } from 'vitest'
import { resolveScene, type ResolvedObject } from '../src/scene3d/resolve'
import { resolvedObjectVisibilityBoxes } from '../src/scene3d/stairVisibility'
import type { Facing } from '../src/scene3d/schema'
import { explodedConnectionSegments, type Vec3Segment } from '../src/scene3d/explodedConnection'

const LOWER_OFFSET = -2.5
const UPPER_Y = 0.25

function stairFor(facing: Facing): ResolvedObject {
  const scene = resolveScene({
    puzzleId: 'exploded-connection',
    walls: [],
    furniture: [],
    stairs: { model: 'stairsOpen', at: [4, 4], facing },
  }, 8)
  return scene.objects.find(object => object.kind === 'stairs')!
}

function topBox(stair: ResolvedObject) {
  return resolvedObjectVisibilityBoxes(stair).reduce((top, box) => (
    box.max[1] > top.max[1] ? box : top
  ))
}

function isVertical(segment: Vec3Segment) {
  const [a, b] = segment
  return a[0] === b[0] && a[2] === b[2] && a[1] !== b[1]
}

function isCrossbar(segment: Vec3Segment, facing: Facing, y: number) {
  const [a, b] = segment
  if (a[1] !== y || b[1] !== y) return false
  const alongAxis = facing === 'E' || facing === 'W' ? 0 : 2
  const acrossAxis = facing === 'E' || facing === 'W' ? 2 : 0
  return a[alongAxis] === b[alongAxis] && a[acrossAxis] !== b[acrossAxis]
}

function connectorSegments(stair: ResolvedObject): Vec3Segment[] {
  const lowY = topBox(stair).max[1] + LOWER_OFFSET
  return explodedConnectionSegments(stair, LOWER_OFFSET, UPPER_Y)
    .filter(segment => isVertical(segment))
    .filter(([a, b]) => {
      const ys = [a[1], b[1]].sort((left, right) => left - right)
      return ys[0] === lowY && ys[1] === UPPER_Y
    })
}

describe('exploded stair connection geometry', () => {
  it('connects the measured top tread to the displaced upper arrival', () => {
    const stair = stairFor('E')
    const top = topBox(stair)
    const lowY = top.max[1] + LOWER_OFFSET
    const segments = explodedConnectionSegments(stair, LOWER_OFFSET, UPPER_Y)
    const connectors = connectorSegments(stair)

    expect(connectors).toHaveLength(2)
    for (const [a, b] of connectors) {
      expect(a[1] === lowY || b[1] === lowY).toBe(true)
      expect(a[1] === UPPER_Y || b[1] === UPPER_Y).toBe(true)
      expect(a[0]).toBe(b[0])
      expect(a[2]).toBe(b[2])
    }
    expect(segments.filter(segment => isCrossbar(segment, 'E', lowY))).toHaveLength(1)
    expect(segments.filter(segment => isCrossbar(segment, 'E', UPPER_Y))).toHaveLength(1)
  })

  it.each([
    ['E', 'maxX', 'z'] as const,
    ['W', 'minX', 'z'] as const,
    ['S', 'maxZ', 'x'] as const,
    ['N', 'minZ', 'x'] as const,
  ])('places both vertical traces at the measured %s arrival edge', (facing, edge, acrossAxis) => {
    const stair = stairFor(facing)
    const connectors = connectorSegments(stair)
    const edgeValue = stair.footprint[edge]
    const sideValues = acrossAxis === 'z'
      ? [stair.footprint.minZ, stair.footprint.maxZ]
      : [stair.footprint.minX, stair.footprint.maxX]

    expect(connectors).toHaveLength(2)
    expect(connectors.map(([a]) => a[acrossAxis === 'z' ? 2 : 0]).sort((a, b) => a - b))
      .toEqual(sideValues)
    for (const [a, b] of connectors) {
      expect(a[acrossAxis === 'z' ? 0 : 2]).toBe(edgeValue)
      expect(b[acrossAxis === 'z' ? 0 : 2]).toBe(edgeValue)
    }
  })

  it('keeps the stair profile within the real lower-floor footprint', () => {
    const stair = stairFor('E')
    const top = topBox(stair)
    const lowY = top.max[1] + LOWER_OFFSET
    const segments = explodedConnectionSegments(stair, LOWER_OFFSET, UPPER_Y)
    const profile = segments.filter(segment => {
      if (isCrossbar(segment, 'E', lowY) || isCrossbar(segment, 'E', UPPER_Y)) return false
      if (!isVertical(segment)) return true
      const [a, b] = segment
      const ys = [a[1], b[1]].sort((left, right) => left - right)
      return !(ys[0] === lowY && ys[1] === UPPER_Y)
    })

    expect(profile.length).toBeGreaterThan(4)
    for (const [a, b] of profile) {
      expect(a[0]).toBeGreaterThanOrEqual(stair.footprint.minX)
      expect(a[0]).toBeLessThanOrEqual(stair.footprint.maxX)
      expect(a[2]).toBeGreaterThanOrEqual(stair.footprint.minZ)
      expect(a[2]).toBeLessThanOrEqual(stair.footprint.maxZ)
      expect(b[0]).toBeGreaterThanOrEqual(stair.footprint.minX)
      expect(b[0]).toBeLessThanOrEqual(stair.footprint.maxX)
      expect(b[2]).toBeGreaterThanOrEqual(stair.footprint.minZ)
      expect(b[2]).toBeLessThanOrEqual(stair.footprint.maxZ)
      expect(Math.max(a[1], b[1])).toBeLessThanOrEqual(lowY)
    }
  })

  it('does not mutate the resolved stair or reuse its point arrays', () => {
    const stair = stairFor('N')
    const before = {
      position: [...stair.position],
      boxMin: [...stair.box.min],
      boxMax: [...stair.box.max],
      footprint: { ...stair.footprint },
    }
    const segments = explodedConnectionSegments(stair, LOWER_OFFSET, UPPER_Y)

    expect(stair.position).toEqual(before.position)
    expect(stair.box.min).toEqual(before.boxMin)
    expect(stair.box.max).toEqual(before.boxMax)
    expect(stair.footprint).toEqual(before.footprint)
    for (const [a, b] of segments) {
      expect(a).not.toBe(stair.position)
      expect(b).not.toBe(stair.position)
      expect(a).not.toBe(stair.box.min)
      expect(b).not.toBe(stair.box.max)
    }
  })
})
