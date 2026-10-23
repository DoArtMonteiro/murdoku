// ============================================================================
// plan3d SCENE — turns a Plan + loaded model data into a three.js scene.
//
// Draw-call budget: every solid face is baked into one geometry per palette
// colour (about ten meshes for the whole house), plus one edge-line mesh, the
// seam lines, door decals, the lamp pools, the label plane, the paper and the
// vignette. Models are never cloned into the scene graph.
//
// Colours come only from palette.ts (F-spec 1.1). Lighting is the F-spec 11 rig
// normalised so a lit floor renders exactly its hex and a cast shadow darkens
// it by 18% (S2 at alpha 0.18).
// ============================================================================

import * as THREE from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import type { BoardLayout } from '../../contract'
import { CELL } from '../../../scene3d/units'
import type { KenneyModel } from '../../../scene3d/catalog.generated'
import type { Plan, PlanObject } from './plan'
import { GRAPHITE, OUTSIDE_MIX, S, roleOf } from './palette'
import type { ModelData } from './models'
import { MARGIN_NW, MARGIN_SE } from './layout'

export type Models = ReadonlyMap<string, ModelData>

/** Models a plan needs, deduplicated. */
export const modelsFor = (plan: Plan): KenneyModel[] => [...new Set(plan.objects.map(o => o.model))]

// ---- triangle emission ---------------------------------------------------------------
const PLANT_AS_GLYPH = /^(pottedPlant|plantSmall\d)$/

type Bucket = Map<string, number[]>
const push = (b: Bucket, key: string, ...vals: number[]) => {
  let a = b.get(key)
  if (!a) { a = []; b.set(key, a) }
  for (const v of vals) a.push(v)
}

/** Colour key for one furniture triangle. */
function faceKey(o: PlanObject, material: string, ny: number): string {
  const role = roleOf(material)
  const top = ny > 0.7
  // F-spec 5: the TV is a solid dark rectangle
  if (/^television/.test(o.model)) return 'ink'
  if (role === 'dark') return o.kind === 'rug' || o.kind === 'stairs' ? 'oak' : 'ink'
  if (role === 'glass') return /^shower/.test(o.model) ? 'glass' : 'ink'
  if (role === 'leaf') return PLANT_AS_GLYPH.test(o.model) ? (top ? 'bone' : 'oak') : 'olive'
  if (role === 'rimDark') return 'oak'
  return top ? 'bone' : 'oak'
}

/** Emit the world-space triangles of one placed object (cell units, squashed). */
export function emitObject(o: PlanObject, model: ModelData, out: (material: string, tri: Float32Array, ny: number) => void): void {
  const m = new THREE.Matrix4()
    .makeTranslation(o.x, o.y, o.z)
    .multiply(new THREE.Matrix4().makeRotationY((o.rotY * Math.PI) / 180))
    .multiply(new THREE.Matrix4().makeScale(1 / CELL, o.sy / CELL, 1 / CELL))
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3()
  const tri = new Float32Array(9)
  for (const part of model) {
    const p = part.positions
    for (let i = 0; i + 8 < p.length; i += 9) {
      a.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m)
      b.set(p[i + 3], p[i + 4], p[i + 5]).applyMatrix4(m)
      c.set(p[i + 6], p[i + 7], p[i + 8]).applyMatrix4(m)
      e1.subVectors(b, a); e2.subVectors(c, a)
      const n = e1.cross(e2)
      if (n.lengthSq() < 1e-14) continue
      n.normalize()
      tri.set([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z])
      out(part.material, tri, n.y)
    }
  }
}

function addBox(b: Bucket, key: string, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number): void {
  // 6 faces, CCW outward
  const q = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, dx: number, dy: number, dz: number) =>
    push(b, key, ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz)
  q(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0)   // top (+y)
  q(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1)   // bottom
  q(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1)   // +z (south)
  q(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0)   // -z (north)
  q(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1)   // +x
  q(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0)   // -x
}

const FLOOR_KEY: Record<string, string> = { wood: 'wood', tile: 'tile', rose: 'rose', olive: 'olive', stone: 'stone', outside: 'outside', void: 'ink' }

/** Everything solid, grouped by colour key (or by tag in the ID pass). */
export interface SolidSet { buckets: Bucket; furnitureTris: number[]; glassTris: number[] }

export function collectSolids(plan: Plan, models: Models, mode: 'beauty' | 'id' = 'beauty'): SolidSet {
  const buckets: Bucket = new Map()
  const furnitureTris: number[] = []
  const glassTris: number[] = []
  const n = plan.n
  // floors
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const key = mode === 'id' ? `floor:${r},${c}` : FLOOR_KEY[plan.tint[r][c]]
    push(buckets, key, c, 0, r + 1, c + 1, 0, r + 1, c + 1, 0, r, c, 0, r + 1, c + 1, 0, r, c, 0, r)
  }
  // walls
  for (const p of plan.pieces) addBox(buckets, mode === 'id' ? 'wall' : p.kind === 'wall' ? 'wall' : 'ink', p.x0, p.z0, p.x1, p.z1, 0, p.h)
  // furniture, rugs, stairs
  for (const o of plan.objects) {
    const model = models.get(o.model)
    if (!model) continue
    emitObject(o, model, (material, tri, ny) => {
      if (mode === 'id') { if (o.kind !== 'rug' && roleOf(material) !== 'glass') push(buckets, `obj:${o.id}`, ...tri); return }
      const key = faceKey(o, material, ny)
      if (key === 'glass') { glassTris.push(...tri); return }
      push(buckets, key, ...tri)
      if (o.kind !== 'rug') furnitureTris.push(...tri)
    })
  }
  return { buckets, furnitureTris, glassTris }
}

// ---- scene assembly ----------------------------------------------------------------------
export interface BuiltScene {
  scene: THREE.Scene
  /** Meshes that carry the sheet (everything except overlays), for diagnostics. */
  solids: THREE.Mesh[]
  labelMaterial: THREE.MeshBasicMaterial
  vignette: THREE.ShaderMaterial
  /** Ink edge lines on the pictograms; linewidth/resolution are set by the renderer. */
  edgeMaterial: LineMaterial
  dispose: () => void
}

/** sRGB blend of two sheet colours (an alpha mix, not a new hue). */
function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

const colourOf = (key: string): string => {
  if (key === 'outside') return mixHex(S.paper, S.olive, OUTSIDE_MIX)
  if (key === 'ink') return S.ink
  if (key === 'wall') return S.wall
  if (key === 'bone') return S.bone
  if (key === 'oak') return S.oak
  return (S as Record<string, string>)[key] ?? S.paper
}

function geometryOf(arr: number[]): THREE.BufferGeometry {
  const pos = new Float32Array(arr)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const nrm = new Float32Array(pos.length)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3()
  for (let i = 0; i < pos.length; i += 9) {
    a.fromArray(pos, i); b.fromArray(pos, i + 3); c.fromArray(pos, i + 6)
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize()
    for (let k = 0; k < 3; k++) { nrm[i + k * 3] = n.x; nrm[i + k * 3 + 1] = n.y; nrm[i + k * 3 + 2] = n.z }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  return g
}

/** Light rig, F-spec 11 normalised (see header). Returns the lights. */
export function addLights(scene: THREE.Scene, n: number, mapSize = 2048): void {
  // Shadow of a 0.25 box lands at (+0.05, +0.0526) cells: light travels (0.05, -0.25, 0.0526).
  const dir = new THREE.Vector3(-0.05, 0.25, -0.0526).normalize()
  const cos = dir.y
  const AMBIENT = 0.82, KEY = (1 - AMBIENT) / cos
  scene.add(new THREE.AmbientLight('#FFFFFF', AMBIENT * Math.PI))
  const key = new THREE.DirectionalLight('#FFF4DC', KEY * Math.PI)
  const target = new THREE.Vector3(n / 2, 0, n / 2)
  key.position.copy(target).addScaledVector(dir, 60)
  key.target.position.copy(target)
  key.castShadow = true
  key.shadow.mapSize.set(mapSize, mapSize)
  const half = (n + 2) * 0.75
  const sc = key.shadow.camera
  sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 10; sc.far = 110
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.012
  scene.add(key, key.target)
}

function radialTexture(): THREE.CanvasTexture {
  const size = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const g = cv.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(216,154,34,0.22)')
  grad.addColorStop(1, 'rgba(216,154,34,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const VIGNETTE_VS = 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }'
const VIGNETTE_FS = `
uniform vec4 uSheet;   // left, top, right, bottom in CSS px
uniform vec2 uSize;    // board box in CSS px
uniform float uDpr;
uniform vec3 uColour;
uniform float uMax;
void main(){
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  if (p.x < uSheet.x || p.x > uSheet.z || p.y < uSheet.y || p.y > uSheet.w) discard;
  vec2 c = vec2(uSheet.x + uSheet.z, uSheet.y + uSheet.w) * 0.5;
  float s = uSheet.z - uSheet.x;
  vec2 q = (p - c) / s * vec2(1.0, (uSheet.z - uSheet.x) / (uSheet.w - uSheet.y));
  float d = length(q);
  float a = uMax * smoothstep(0.55, 0.7071, d);
  gl_FragColor = vec4(uColour, a);
}`

export function buildScene(plan: Plan, models: Models, layout: BoardLayout, mode: 'beauty' | 'id' = 'beauty'): BuiltScene {
  const scene = new THREE.Scene()
  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(x: T): T => { disposables.push(x); return x }
  const n = plan.n
  const solids: THREE.Mesh[] = []
  const { buckets, furnitureTris, glassTris } = collectSolids(plan, models, mode)

  const idColour = (key: string): THREE.Color => {
    // ID pass: floors 1..n*n, wall n*n+1, objects after; encoded in linear RGB bytes
    let id = 0
    if (key.startsWith('floor:')) { const [r, c] = key.slice(6).split(',').map(Number); id = r * n + c + 1 }
    else if (key === 'wall') id = n * n + 1
    else if (key.startsWith('obj:')) id = n * n + 2 + plan.objects.findIndex(o => o.id === key.slice(4))
    return new THREE.Color().setRGB(((id >> 16) & 255) / 255, ((id >> 8) & 255) / 255, (id & 255) / 255, THREE.LinearSRGBColorSpace)
  }

  for (const [key, arr] of buckets) {
    const geo = track(geometryOf(arr))
    const mat = mode === 'id'
      ? track(new THREE.MeshBasicMaterial({ color: idColour(key) }))
      : track(new THREE.MeshLambertMaterial({ color: colourOf(key), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData.key = key
    if (mode === 'beauty') {
      const isFloor = FLOOR_KEY[key] !== undefined || key === 'outside'
      mesh.receiveShadow = true
      mesh.castShadow = !isFloor
    }
    scene.add(mesh)
    solids.push(mesh)
  }

  // paper under everything (beauty only; the ID pass leaves it transparent)
  const paperGeo = track(new THREE.PlaneGeometry(n + MARGIN_NW + MARGIN_SE, n + MARGIN_NW + MARGIN_SE))
  paperGeo.rotateX(-Math.PI / 2)
  paperGeo.translate((n + MARGIN_SE - MARGIN_NW) / 2, 0, (n + MARGIN_SE - MARGIN_NW) / 2)
  const labelMaterial = track(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }))
  const vignette = track(new THREE.ShaderMaterial({
    vertexShader: VIGNETTE_VS, fragmentShader: VIGNETTE_FS, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uSheet: { value: new THREE.Vector4() }, uSize: { value: new THREE.Vector2() }, uDpr: { value: 1 },
      // raw sRGB bytes: this shader writes straight to the sRGB framebuffer
      uColour: { value: new THREE.Color().setStyle(GRAPHITE, THREE.LinearSRGBColorSpace) }, uMax: { value: 0.34 },
    },
  }))

  const edgeMaterial = track(new LineMaterial({ color: new THREE.Color(S.ink), linewidth: 1.5, worldUnits: false }))
  if (mode === 'beauty') {
    const paper = new THREE.Mesh(paperGeo, track(new THREE.MeshLambertMaterial({ color: S.paper, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })))
    paper.position.y = -0.002
    paper.receiveShadow = true
    scene.add(paper)

    // trim line at the sheet edge
    const o = [-MARGIN_NW, n + MARGIN_SE]
    const trim = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(o[0], 0.001, o[0]), new THREE.Vector3(o[1], 0.001, o[0]),
      new THREE.Vector3(o[1], 0.001, o[1]), new THREE.Vector3(o[0], 0.001, o[1]), new THREE.Vector3(o[0], 0.001, o[0]),
    ])
    scene.add(new THREE.Line(track(trim), track(new THREE.LineBasicMaterial({ color: S.ink, transparent: true, opacity: 0.35 }))))

    // seams between cells of one room: hairlines
    if (plan.seams.length) {
      const pts: THREE.Vector3[] = []
      for (const [x0, z0, x1, z1] of plan.seams) pts.push(new THREE.Vector3(x0, 0.002, z0), new THREE.Vector3(x1, 0.002, z1))
      scene.add(new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(pts)),
        track(new THREE.LineBasicMaterial({ color: S.ink, transparent: true, opacity: 0.1, depthWrite: false }))))
    }

    // ink edges on the pictograms
    if (furnitureTris.length) {
      const fg = track(new THREE.BufferGeometry())
      fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(furnitureTris), 3))
      const edges = new THREE.EdgesGeometry(fg, 28)
      const fat = track(new LineSegmentsGeometry())
      fat.setPositions(edges.getAttribute('position').array as Float32Array)
      edges.dispose()
      scene.add(new LineSegments2(fat, edgeMaterial))
    }

    // door leaves (2 px ink) and swing arcs (1 px, alpha 0.45)
    const leafPts: number[] = []
    const arcPts: THREE.Vector3[] = []
    const lw = 0.03
    for (const d of plan.doors) {
      if (d.kind === 'open') continue
      const hinge = d.hingeLow ? d.t - d.width / 2 : d.t + d.width / 2
      const other = d.hingeLow ? d.t + d.width / 2 : d.t - d.width / 2
      const at = (alongT: number, off: number): [number, number] => (d.axis === 'h' ? [alongT, d.line + off] : [d.line + off, alongT])
      const [hx, hz] = at(hinge, 0)
      const [tx, tz] = at(hinge, d.swing * d.width)
      // leaf as a thin quad on the floor
      const sx = d.axis === 'h' ? lw / 2 : 0, sz = d.axis === 'h' ? 0 : lw / 2
      const y = 0.022
      leafPts.push(hx - sx, y, hz - sz, tx - sx, y, tz - sz, tx + sx, y, tz + sz, hx - sx, y, hz - sz, tx + sx, y, tz + sz, hx + sx, y, hz + sz)
      // arc from the leaf tip round to the opposite jamb
      const [ox, oz] = at(other, 0)
      const a0 = Math.atan2(tz - hz, tx - hx), a1 = Math.atan2(oz - hz, ox - hx)
      let da = a1 - a0
      while (da > Math.PI) da -= 2 * Math.PI
      while (da < -Math.PI) da += 2 * Math.PI
      const steps = 14
      for (let i = 0; i < steps; i++) {
        const p = a0 + (da * i) / steps, q = a0 + (da * (i + 1)) / steps
        arcPts.push(new THREE.Vector3(hx + Math.cos(p) * d.width, y, hz + Math.sin(p) * d.width), new THREE.Vector3(hx + Math.cos(q) * d.width, y, hz + Math.sin(q) * d.width))
      }
    }
    if (leafPts.length) {
      const g = track(new THREE.BufferGeometry())
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(leafPts), 3))
      const m = new THREE.Mesh(g, track(new THREE.MeshBasicMaterial({ color: S.ink, side: THREE.DoubleSide })))
      m.renderOrder = 3
      scene.add(m)
    }
    if (arcPts.length) {
      const l = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(arcPts)),
        track(new THREE.LineBasicMaterial({ color: S.ink, transparent: true, opacity: 0.45, depthWrite: false })))
      l.renderOrder = 3
      scene.add(l)
    }

    // lamp pools: radius 1.6 cells, amber alpha 0.22 at the centre
    if (plan.lamps.length) {
      const tex = track(radialTexture())
      const poolGeo = track(new THREE.PlaneGeometry(3.2, 3.2))
      poolGeo.rotateX(-Math.PI / 2)
      const poolMat = track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
      for (const lamp of plan.lamps) {
        const m = new THREE.Mesh(poolGeo, poolMat)
        m.position.set(lamp.x, 0.018, lamp.z)
        m.renderOrder = 1
        scene.add(m)
      }
    }

    // glass (shower cabins): translucent bone, never an occluder
    if (glassTris.length) {
      const m = new THREE.Mesh(track(geometryOf(glassTris)), track(new THREE.MeshLambertMaterial({ color: S.bone, transparent: true, opacity: 0.28, depthWrite: false })))
      m.renderOrder = 4
      scene.add(m)
    }

    // room labels: one plane over the grid, texture drawn 1 texel : 1 device px
    const labelGeo = track(new THREE.PlaneGeometry(n, n))
    labelGeo.rotateX(-Math.PI / 2)
    labelGeo.translate(n / 2, 0.02, n / 2)
    const labels = new THREE.Mesh(labelGeo, labelMaterial)
    labels.renderOrder = 2
    scene.add(labels)

    const quad = new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2)), vignette)
    quad.frustumCulled = false
    quad.renderOrder = 100
    scene.add(quad)

    addLights(scene, n)
  }
  void layout

  return {
    scene, solids, labelMaterial, vignette, edgeMaterial,
    dispose: () => {
      for (const d of disposables) d.dispose()
      labelMaterial.map?.dispose()
      scene.traverse(o => { (o as { shadow?: { dispose: () => void } }).shadow?.dispose() })
    },
  }
}

/** Draw the room labels onto a canvas that maps 1 texel to 1 device px over the grid. */
export function drawLabels(plan: Plan, layout: BoardLayout, dpr: number): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.round(plan.n * layout.cellW * dpr))
  cv.height = Math.max(1, Math.round(plan.n * layout.cellH * dpr))
  const g = cv.getContext('2d')
  if (!g) return cv
  const px = (layout.cellW >= 80 ? 11 : 9) * dpr
  g.font = `400 ${px}px "Courier Prime", "Courier New", Courier, ui-monospace, monospace`
  g.textBaseline = 'alphabetic'
  g.fillStyle = 'rgba(26,16,8,0.72)'
  const track = 0.12 * px
  for (const l of plan.labels) {
    const chars = [...l.text]
    const widths = chars.map(ch => g.measureText(ch).width)
    const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1)
    let x = l.x * layout.cellW * dpr - (l.align === 'right' ? total : total / 2)
    const y = l.z * layout.cellH * dpr
    chars.forEach((ch, i) => { g.fillText(ch, x, y); x += widths[i] + track })
  }
  return cv
}
