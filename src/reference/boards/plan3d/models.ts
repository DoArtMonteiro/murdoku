// ============================================================================
// Kenney model data for the plan board: parse a GLB once, keep only what the
// pictogram needs (triangles + material names, pivoted at footprint centre /
// feet on y = 0, in Kenney units), and cache it. Only the models a plan uses
// are ever fetched.
// ============================================================================

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { KenneyModel } from '../../../scene3d/catalog.generated'

export interface ModelPart {
  material: string
  /** Non-indexed triangle positions (9 floats per triangle), Kenney units. */
  positions: Float32Array
}
export type ModelData = ModelPart[]

const cache = new Map<string, Promise<ModelData>>()
let loader: GLTFLoader | null = null

export type GlbSource = (name: string) => Promise<ArrayBuffer>

/** Default source: a static file under /public (no other network access). */
export const fetchGlb: GlbSource = async name => {
  const res = await fetch(`/kenney3d/${name}.glb`)
  if (!res.ok) throw new Error(`model ${name}: HTTP ${res.status}`)
  return res.arrayBuffer()
}

export async function parseModel(buffer: ArrayBuffer): Promise<ModelData> {
  loader ??= new GLTFLoader()
  const gltf = await loader.parseAsync(buffer, '')
  const root = gltf.scene
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  const centre = box.getCenter(new THREE.Vector3())
  const shift = new THREE.Matrix4().makeTranslation(-centre.x, -box.min.y, -centre.z)
  const parts = new Map<string, number[]>()
  const v = new THREE.Vector3()
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const geo = mesh.geometry
    const pos = geo.getAttribute('position')
    const index = geo.getIndex()
    const m = new THREE.Matrix4().multiplyMatrices(shift, mesh.matrixWorld)
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const groups = geo.groups.length ? geo.groups : [{ start: 0, count: index ? index.count : pos.count, materialIndex: 0 }]
    for (const g of groups) {
      const name = mats[g.materialIndex ?? 0]?.name ?? ''
      const out = parts.get(name) ?? []
      for (let i = g.start; i < g.start + g.count; i++) {
        const vi = index ? index.getX(i) : i
        v.fromBufferAttribute(pos, vi).applyMatrix4(m)
        out.push(v.x, v.y, v.z)
      }
      parts.set(name, out)
    }
  })
  return [...parts.entries()].map(([material, positions]) => ({ material, positions: new Float32Array(positions) }))
}

export function loadModelData(name: KenneyModel, source: GlbSource = fetchGlb): Promise<ModelData> {
  let p = cache.get(name)
  if (!p) {
    p = source(name).then(parseModel)
    // a failed fetch must not poison the cache
    p.catch(() => cache.delete(name))
    cache.set(name, p)
  }
  return p
}
