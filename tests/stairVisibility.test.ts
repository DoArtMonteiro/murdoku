import { readFileSync } from 'node:fs'
import { Box3 as ThreeBox, Matrix4, Ray, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'
import { resolveScene, type Box3, type ResolvedObject } from '../src/scene3d/resolve'
import { resolvedObjectVisibilityBoxes } from '../src/scene3d/stairVisibility'
import { validateScene } from '../src/scene3d/validate'
import type { Facing } from '../src/scene3d/schema'
import { MODEL_BOUNDS } from '../src/scene3d/catalog.generated'
import { CELL, cameraDirection } from '../src/scene3d/units'

const models = ['stairs', 'stairsOpen', 'stairsOpenSingle'] as const
const stair = (model: typeof models[number] | 'stairsCorner', facing: Facing = 'E') => resolveScene({
  puzzleId: 'visibility', walls: [], furniture: [],
  stairs: { model, at: [4, 4], facing },
}, 8).objects.find(object => object.kind === 'stairs')!
const contains = (box: Box3, p: Vector3) => p.toArray().every((value, i) => value >= box.min[i] - 1e-8 && value <= box.max[i] + 1e-8)
const worldPoint = (point: Vector3, object: ResolvedObject) => point.clone()
  .applyMatrix4(new Matrix4().makeRotationY(object.rotY * Math.PI / 180)).add(new Vector3(...object.position))

async function trianglesOf(model: typeof models[number]) {
  const bytes = readFileSync(`public/kenney3d/${model}.glb`)
  const data = new Uint8Array(bytes.byteLength)
  data.set(bytes)
  const gltf = await new GLTFLoader().parseAsync(data.buffer, '')
  gltf.scene.updateMatrixWorld(true)
  const bounds = new ThreeBox().setFromObject(gltf.scene)
  const pivot = new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, (bounds.min.z + bounds.max.z) / 2)
  const triangles: Vector3[][] = []
  gltf.scene.traverse(object => {
    if (!('isMesh' in object) || !object.isMesh) return
    const mesh = object as import('three').Mesh
    const position = mesh.geometry.attributes.position
    const index = mesh.geometry.index
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      triangles.push([0, 1, 2].map(k => new Vector3()
        .fromBufferAttribute(position, index ? index.getX(i + k) : i + k)
        .applyMatrix4(mesh.matrixWorld).sub(pivot)))
    }
  })
  return triangles
}

// Clip each real triangle into the envelope's X bands. A clipped polygon is
// convex; bounding all its vertices proves its entire surface is enclosed.
function clipX(polygon: Vector3[], x: number, above: boolean): Vector3[] {
  return polygon.flatMap((a, i) => {
    const b = polygon[(i + 1) % polygon.length]
    const insideA = above ? a.x >= x : a.x <= x
    const insideB = above ? b.x >= x : b.x <= x
    const crossing = () => a.clone().lerp(b, (x - a.x) / (b.x - a.x))
    return insideA ? (insideB ? [b] : [crossing()]) : (insideB ? [crossing(), b] : [])
  })
}

describe('measured stair visibility envelope', () => {
  it.each(models)('encloses the complete %s GLB mesh, including nosings and supports', async model => {
    const object = stair(model)
    const boxes = resolvedObjectVisibilityBoxes(object)
    const triangles = (await trianglesOf(model)).map(triangle => triangle.map(p => worldPoint(p, object)))
    expect(triangles.length).toBeGreaterThan(100)
    for (const point of triangles.flat()) expect(boxes.some(box => contains(box, point))).toBe(true)
    const boundaries = [...new Set(boxes.flatMap(box => [box.min[0], box.max[0]]))].sort((a, b) => a - b)
    for (let i = 0; i < boundaries.length - 1; i++) {
      const lo = boundaries[i], hi = boundaries[i + 1]
      const enclosing = boxes.filter(box => box.min[0] <= lo && box.max[0] >= hi)
      for (const triangle of triangles) {
        const clipped = clipX(clipX(triangle, lo, true), hi, false)
        if (!clipped.length) continue
        expect(enclosing.some(box => clipped.every(point => contains(box, point))), `${model} band ${lo}..${hi}`).toBe(true)
      }
    }
  })

  it.each(['E', 'S', 'W', 'N'] as const)('keeps the foot clear and the head occluding when facing %s', facing => {
    const object = stair('stairsOpen', facing)
    const boxes = resolvedObjectVisibilityBoxes(object)
    const direction = new Vector3(0, 0, 1).applyMatrix4(new Matrix4().makeRotationY(object.rotY * Math.PI / 180))
    const blocked = (x: number) => {
      const ray = new Ray(worldPoint(new Vector3(x, 0.45, -1), object), direction)
      return boxes.some(box => ray.intersectBox(new ThreeBox(new Vector3(...box.min), new Vector3(...box.max)), new Vector3()) !== null)
    }
    expect(blocked(-0.8)).toBe(false)
    expect(blocked(0.8)).toBe(true)
  })

  it('retains full conservative boxes for the unmeasured corner stair and ordinary furniture', () => {
    const corner = stair('stairsCorner')
    expect(resolvedObjectVisibilityBoxes(corner)).toEqual([corner.box])
    const furniture = { ...stair('stairs'), kind: 'furniture' as const }
    expect(resolvedObjectVisibilityBoxes(furniture)).toEqual([furniture.box])
  })

  it('removes the false positive behind the low stair foot', () => {
    const scene = resolveScene({
      puzzleId: 'visibility', walls: [], furniture: [],
      stairs: { model: 'stairsOpen', at: [4 - MODEL_BOUNDS.stairsOpen.size[0] / (2 * CELL), 0.6], facing: 'E' },
    }, 8)
    const object = scene.objects.find(o => o.kind === 'stairs')!
    const origin = new Vector3(...scene.frame.cellCentre(0, 1, 0)).add(new Vector3(0, 0.45, 0))
    const ray = new Ray(origin, new Vector3(...cameraDirection()))
    // The former full-height AABB really intersects this camera ray.
    expect(ray.intersectBox(new ThreeBox(new Vector3(...object.box.min), new Vector3(...object.box.max)), new Vector3())).not.toBeNull()
    const hidden = validateScene(scene).filter(issue => issue.code === 'cell-hidden').map(issue => issue.subject)
    expect(hidden).not.toContain('0,1')
  })
})
