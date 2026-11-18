import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import {
  DOOR_FRAME_CLEAR_HEIGHT,
  DOOR_FRAME_DEPTH,
  DOOR_FRAME_WIDTH,
  DOOR_FRAME_SECTION,
  DOOR_FRAME_TOP,
  DOOR_FACE_CASING_DEPTH,
  DOOR_FINISH_OVERLAP,
  DOOR_INSTALL_ALLOWANCE,
  resolveDoorGeometry,
} from '../src/scene3d/doorGeometry'
import { MODEL_BOUNDS } from '../src/scene3d/catalog.generated'
import { resolveScene } from '../src/scene3d/resolve'
import { twoStoreyReferenceUpper } from '../src/scene3d/scenes/two-storey-reference-upper'
import { midnightDelivery } from '../src/scene3d/scenes/midnight-delivery'
import { theEmptyChair } from '../src/scene3d/scenes/the-empty-chair'
import { theLastNightcap } from '../src/scene3d/scenes/the-last-nightcap'

const wallThickness = 0.08

function span(box: { min: [number, number, number]; max: [number, number, number] }, axis: 'x' | 'z') {
  return axis === 'x' ? box.max[0] - box.min[0] : box.max[2] - box.min[2]
}

function depth(box: { min: [number, number, number]; max: [number, number, number] }, axis: 'x' | 'z') {
  return axis === 'x' ? box.max[2] - box.min[2] : box.max[0] - box.min[0]
}

describe('procedural interior door finish', () => {
  it('uses the measured Kenney doorway section and keeps the installation allowance explicit', () => {
    expect(DOOR_FINISH_OVERLAP).toBeCloseTo(DOOR_FRAME_SECTION / 2, 8)
    expect(DOOR_INSTALL_ALLOWANCE).toBeCloseTo((MODEL_BOUNDS.doorwayOpen.size[0] + 0.02 - DOOR_FRAME_WIDTH) / 2, 5)
  })

  it('matches the measured POSITION accessor of doorwayOpen.glb', () => {
    const bytes = readFileSync(pathResolve(process.cwd(), 'public/kenney3d/doorwayOpen.glb'))
    const jsonLength = bytes.readUInt32LE(12)
    const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8')) as {
      meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>
      accessors: Array<{ bufferView: number; byteOffset?: number; count: number }>
      bufferViews: Array<{ byteOffset?: number; byteStride?: number }>
    }
    const binaryChunk = 20 + jsonLength + 8
    const accessorIndex = json.meshes[0].primitives[0].attributes.POSITION
    const accessor = json.accessors[accessorIndex]
    const view = json.bufferViews[accessor.bufferView]
    const stride = view.byteStride ?? 12
    const base = binaryChunk + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const points = Array.from({ length: accessor.count }, (_, index) => [
      bytes.readFloatLE(base + index * stride),
      bytes.readFloatLE(base + index * stride + 4),
      bytes.readFloatLE(base + index * stride + 8),
    ] as const)
    const values = [0, 1, 2].map(axis => points.map(point => point[axis]).sort((a, b) => a - b)
      .reduce<number[]>((unique, value) => unique.length && Math.abs(value - unique.at(-1)!) < 1e-6 ? unique : [...unique, value], []))
    const [xs, ys, zs] = values
    expect(DOOR_FRAME_WIDTH).toBeCloseTo(xs.at(-1)! - xs[0], 6)
    expect(DOOR_FRAME_DEPTH).toBeCloseTo(zs.at(-1)! - zs[0], 6)
    expect(DOOR_FRAME_SECTION).toBeCloseTo(xs[1] - xs[0], 6)
    expect(DOOR_FRAME_SECTION).toBeCloseTo(xs.at(-1)! - xs.at(-2)!, 6)
    expect(DOOR_FRAME_CLEAR_HEIGHT).toBeCloseTo(ys[1], 6)
    expect(DOOR_FRAME_TOP).toBeCloseTo(ys.at(-1)!, 6)
  })

  for (const axis of ['x', 'z'] as const) {
    it(`adapts jambs and casing to an explicit 0.8-unit ${axis.toUpperCase()} opening`, () => {
      const geometry = resolveDoorGeometry({
        axis,
        centre: 2.4,
        wallAt: 1.6,
        roughWidth: 0.8,
        wallThickness,
      })
      const casing = geometry.members.filter(member => member.role === 'casing')
      const jambs = geometry.members.filter(member => member.role === 'jamb')

      expect(jambs).toHaveLength(2)
      expect(casing).toHaveLength(6)
      expect(geometry.roughOpening.width).toBeCloseTo(0.8, 6)
      expect(geometry.jambs.outerWidth).toBeCloseTo(0.8 - 2 * DOOR_INSTALL_ALLOWANCE, 6)
      expect(geometry.jambs.clearWidth).toBeCloseTo(0.8 - 2 * DOOR_INSTALL_ALLOWANCE - 2 * DOOR_FRAME_SECTION, 6)
      expect(geometry.passage.width).toBeCloseTo(0.7233, 5)
      expect(geometry.members.filter(member => member.role === 'liner').every(member => member.box.max[1] >= DOOR_FRAME_TOP)).toBe(true)

      for (const member of casing) {
        expect(depth(member.box, axis)).toBeGreaterThan(0)
        expect(depth(member.box, axis)).toBeLessThanOrEqual(DOOR_FACE_CASING_DEPTH + 1e-6)
      }
      expect(span(geometry.bounds, axis)).toBeCloseTo(0.8 + 2 * DOOR_FINISH_OVERLAP, 6)
      expect(geometry.bounds.min[1]).toBe(0)
      expect(geometry.bounds.max[1]).toBeCloseTo(1.03 + DOOR_FINISH_OVERLAP, 6)
    })
  }

  it('preserves the measured passage for the default .506-unit rough opening', () => {
    const geometry = resolveDoorGeometry({
      axis: 'x',
      centre: 1.2,
      wallAt: 2.4,
      roughWidth: 0.506,
      wallThickness,
    })

    expect(geometry.roughOpening.centre).toBeCloseTo(1.2, 6)
    expect(geometry.roughOpening.width).toBeCloseTo(0.506, 6)
    expect(geometry.jambs.clearWidth).toBeCloseTo(0.4293, 5)
    expect(geometry.passage.width).toBeCloseTo(0.4293, 5)
    expect(span(geometry.passage.box, 'x')).toBeCloseTo(geometry.passage.width, 6)
  })

  it('covers each rough-opening edge with finish overlap without crossing the clear passage', () => {
    const geometry = resolveDoorGeometry({
      axis: 'z',
      centre: 2.8,
      wallAt: 1.6,
      roughWidth: 0.8,
      wallThickness,
    })
    const rough = geometry.roughOpening
    const clear = geometry.passage
    const casing = geometry.members.filter(member => member.role === 'casing')

    expect(casing.filter(member => member.face === 'negative')).toHaveLength(3)
    expect(casing.filter(member => member.face === 'positive')).toHaveLength(3)
    expect(casing.some(member => member.box.min[2] < rough.box.min[2] && member.box.max[2] > rough.box.min[2])).toBe(true)
    expect(casing.some(member => member.box.max[2] > rough.box.max[2] && member.box.min[2] < rough.box.max[2])).toBe(true)
    expect(clear.width).toBeGreaterThan(0)
    expect(clear.box.max[2] - clear.box.min[2]).toBeCloseTo(clear.width, 6)
    expect(casing.filter(member => member.box.min[1] < DOOR_FRAME_CLEAR_HEIGHT && member.box.max[1] > 0)
      .every(member => member.box.max[2] <= clear.box.min[2] || member.box.min[2] >= clear.box.max[2])).toBe(true)
  })

  it('keeps a low wall door full height while leaving the structural head as an input fact', () => {
    const geometry = resolveDoorGeometry({
      axis: 'x',
      centre: 2.4,
      wallAt: 1.6,
      roughWidth: 0.8,
      wallThickness,
      structuralHead: 0.6,
    })

    expect(geometry.bounds.max[1]).toBeCloseTo(1.03 + DOOR_FINISH_OVERLAP, 6)
    expect(geometry.structuralHead).toBeCloseTo(0.6, 6)
    expect(geometry.passage.height).toBeCloseTo(DOOR_FRAME_CLEAR_HEIGHT, 6)
  })

  it('separates liner, jamb and face-casing volumes while allowing shared boundaries', () => {
    const geometry = resolveDoorGeometry({
      axis: 'x',
      centre: 2.4,
      wallAt: 1.6,
      roughWidth: 0.8,
      wallThickness,
    })
    const overlaps = (a: typeof geometry.members[number]['box'], b: typeof geometry.members[number]['box']) =>
      a.min[0] < b.max[0] - 1e-7 && b.min[0] < a.max[0] - 1e-7
      && a.min[1] < b.max[1] - 1e-7 && b.min[1] < a.max[1] - 1e-7
      && a.min[2] < b.max[2] - 1e-7 && b.min[2] < a.max[2] - 1e-7

    for (let i = 0; i < geometry.members.length; i++) {
      for (let j = i + 1; j < geometry.members.length; j++) {
        const a = geometry.members[i]
        const b = geometry.members[j]
        if (!overlaps(a.box, b.box)) continue
        const casingCount = Number(a.role === 'casing') + Number(b.role === 'casing')
        expect(casingCount).toBe(1)
        expect([a.role, b.role].some(role => role === 'jamb' || role === 'head')).toBe(true)
        const depthOverlap = Math.min(a.box.max[2], b.box.max[2]) - Math.max(a.box.min[2], b.box.min[2])
        expect(depthOverlap).toBeLessThanOrEqual((DOOR_FRAME_DEPTH - wallThickness) / 2 + 1e-6)
      }
    }
  })

  it('resolves all four V3 upper-floor doorways with measured members in both orientations', () => {
    const scene = resolveScene(twoStoreyReferenceUpper, 8)
    const doors = scene.objects.filter(object => object.kind === 'door')
    expect(doors).toHaveLength(4)
    expect(new Set(doors.map(door => door.facing))).toEqual(new Set(['S', 'E']))

    for (const door of doors) {
      expect(door.model).toBe('doorwayOpen')
      expect(door.architecturalMembers).toHaveLength(11)
      expect(door.architecturalMembers?.filter(member => member.role === 'casing')).toHaveLength(6)
      expect(door.architecturalMembers?.filter(member => member.role === 'jamb')).toHaveLength(2)
      expect(door.box.max[1]).toBeGreaterThan(DOOR_FRAME_TOP)
      expect(door.size[0]).toBeGreaterThan(0)
      expect(door.size[2]).toBeGreaterThan(0)
    }

    const openings = scene.walls.flatMap(wall => wall.openings.filter(opening => opening.kind === 'door'))
    expect(openings).toHaveLength(4)
    expect(openings.every(opening => opening.width).valueOf()).toBe(true)
    expect(openings.map(opening => opening.width)).toEqual([0.8, 0.8, 0.8, 0.8])
  })

  it('adds entry casing without replacing the exterior door or touching window inserts', () => {
    for (const { spec, n } of [
      { spec: midnightDelivery, n: 6 },
      { spec: theEmptyChair, n: 6 },
      { spec: theLastNightcap, n: 7 },
    ]) {
      const scene = resolveScene(spec, n)
      expect(scene.problems).toEqual([])
      const entries = scene.objects.filter(object => object.kind === 'entry')
      expect(entries).toHaveLength(1)
      expect(entries[0].model).toBe('doorway')
      expect(entries[0].architecturalMembers).toBeUndefined()

      const entryWall = scene.walls.find(wall => wall.openings.some(opening => opening.kind === 'entry'))
      expect(entryWall).toBeDefined()
      const entryOpening = entryWall!.openings.find(opening => opening.kind === 'entry')!
      const along = entryWall!.axis === 'x' ? 0 : 1
      const nearEntry = entryWall!.frames.filter(frame => {
        const centre = entryWall!.axis === 'x'
          ? (frame.min[0] + frame.max[0]) / 2
          : (frame.min[2] + frame.max[2]) / 2
        return Math.abs(centre - entryOpening.centre[along]) < entryOpening.width / 2 + DOOR_FINISH_OVERLAP + 1e-6
      })
      expect(nearEntry).toHaveLength(6)
      expect(nearEntry.some(frame => frame.max[1] < 0.001)).toBe(false)
      const expectedWindows = spec.shell?.features.filter(feature => feature.kind === 'window').length ?? 0
      const windows = scene.objects.filter(object => object.kind === 'window')
      expect(windows).toHaveLength(expectedWindows)
      expect(windows.every(object => !object.architecturalMembers)).toBe(true)
    }
  })
})
