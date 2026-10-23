// ============================================================================
// SCENE RENDERER — draws a ResolvedScene with three.js.
//
// The renderer owns nothing about the puzzle. It receives world-space boxes
// and model placements from resolve.ts and a highlight state from the board
// component, and paints. It renders on demand (a static diorama has no
// animation loop), builds its orthographic camera from units.ts so it agrees
// with the DOM overlay's projection, and degrades to "no canvas" when WebGL is
// unavailable (jsdom, very old webviews) so the DOM board still works.
// ============================================================================

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CELL, FLOOR_THICKNESS, type StoreyView, type Vec3 } from './units'
import type { ResolvedScene, ResolvedObject, Box3 } from './resolve'
import type { KenneyModel } from './catalog.generated'
import { companionFloorBoxes, companionWallBoxesThroughStairwell } from './companionGeometry'
import { exteriorSupportMembers } from './exteriorSupport'
import { floorPatches } from './floorGeometry'
import { explodedConnectionSegments } from './explodedConnection'
import { SEE_THROUGH_OPACITY, seeThroughOccluders } from './sightlines'

// ---- look: one light, one palette rule -------------------------------------
/** Kenney's palette is authored for a bright render; a mild saturation lift
 *  under our lambert lighting lands it back on their own sample sheet. */
const SATURATION = 1.15
const HEMI_INTENSITY = 1.6, KEY_INTENSITY = 2.2
const HEMI_SKY = '#fff8ec', HEMI_GROUND = '#9c8266', KEY_COLOUR = '#ffe2b8'
/** Key light offset from the scene centre: upper-left-front, so cast shadows
 *  fall right and back, under and behind every object's camera-facing side. */
const KEY_OFFSET: Vec3 = [-4, 9, 2.5]
const NIGHT_GLASS = '#22303f', NIGHT_GLASS_GLOW = '#101a26'
const WALL_FACE = '#f1ebe0', WALL_CAP = '#d9cfbf', PARTITION_FACE = '#ece3d3', PARTITION_CAP = '#cdbfa8', PLINTH = '#d6c19f'
/** Non-wood floors are flat slabs the size of a Kenney tile in a material colour. */
const FLOOR_SLAB: Record<string, { top: string; edge: string }> = {
  tile: { top: '#ded8c8', edge: '#b9ab8f' },
  grass: { top: '#8cbf6c', edge: '#a37b52' },
  stone: { top: '#b8b2a6', edge: '#8d857a' },
  dirt: { top: '#b8946a', edge: '#8a6a48' },
}
/** Kenney `wood` material (229,153,100) — window frames and thresholds. */
const FRAME_WOOD = '#e59964'
const SUPPORT_FACE = '#92704d'
const SUPPORT_CAP = '#b08a5f'
const SUPPORT_GHOST = '#a88a60'
const FOUNDATION = '#c9b493'
/** Neutral placeholder the renderer starts from; every visible colour is set
 *  from the DESIGN.md scene tokens before a frame is shown. */
const NEUTRAL_MATERIAL = '#ffffff'

export interface HighlightState {
  activeRow?: number | null
  activeCol?: number | null
  lockedRows?: ReadonlySet<number>
  lockedCols?: ReadonlySet<number>
  conflictRows?: ReadonlySet<number>
  conflictCols?: ReadonlySet<number>
  blockedRows?: ReadonlySet<number>
  blockedCols?: ReadonlySet<number>
  clueCells?: ReadonlySet<string>
  hoverTarget?: { row: number; col: number; valid: boolean } | null
  /** Environment-only: draw nothing but the house. */
  envOnly?: boolean
  /** Dev diagnostics: draw the physical model (boxes, wall pieces). */
  diag?: boolean
}

export interface SceneRenderer {
  setHighlights: (h: HighlightState) => void
  setSize: (w: number, h: number) => void
  /** Resolves once every model in the scene has loaded and been drawn. */
  ready: Promise<void>
  dispose: () => void
}

export interface CompanionScene {
  scene: ResolvedScene
  offsetY: number
  mode: StoreyView
}

const modelCache = new Map<string, Promise<THREE.Group>>()
const loader = new GLTFLoader()

function boostColour(c: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * SATURATION), hsl.l)
}

function loadModel(name: KenneyModel): Promise<THREE.Group> {
  if (!modelCache.has(name)) {
    modelCache.set(name, loader.loadAsync(`/kenney3d/${name}.glb`).then(g => {
      const root = g.scene
      root.traverse(o => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        m.castShadow = true
        m.receiveShadow = true
        // Kenney exports KHR_materials_unlit; GLTFLoader gives MeshBasicMaterial,
        // which ignores lights and shadows. Rebuild as lit flat colour.
        const rebuild = (src: THREE.Material) => {
          const b = src as THREE.MeshBasicMaterial
          // Window glass is translucent in the kit, which would show the page
          // behind the house. The case plays at night: opaque midnight glass.
          if (b.name === 'glass') return new THREE.MeshLambertMaterial({ color: NIGHT_GLASS, emissive: NIGHT_GLASS_GLOW })
          return new THREE.MeshLambertMaterial({
            color: boostColour(b.color ?? new THREE.Color(NEUTRAL_MATERIAL)),
            transparent: b.transparent, opacity: b.opacity, side: b.side,
          })
        }
        m.material = Array.isArray(m.material) ? m.material.map(rebuild) : rebuild(m.material)
      })
      // canonical pivot: footprint centre at the origin, feet at y = 0
      const box = new THREE.Box3().setFromObject(root)
      const size = box.getSize(new THREE.Vector3())
      root.position.set(-(box.min.x + size.x / 2), -box.min.y, -(box.min.z + size.z / 2))
      const pivot = new THREE.Group()
      pivot.add(root)
      return pivot
    }))
  }
  return modelCache.get(name)!.then(g => g.clone(true))
}

function boxMesh(box: Box3, face: string, cap: string): THREE.Mesh {
  const w = box.max[0] - box.min[0], h = box.max[1] - box.min[1], d = box.max[2] - box.min[2]
  const geo = new THREE.BoxGeometry(w, h, d)
  const faceMat = new THREE.MeshLambertMaterial({ color: face })
  const capMat = new THREE.MeshLambertMaterial({ color: cap })
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const m = new THREE.Mesh(geo, [faceMat, faceMat, capMat, faceMat, faceMat, faceMat])
  m.position.set(box.min[0] + w / 2, box.min[1] + h / 2, box.min[2] + d / 2)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Draws a model's meshes translucent and shadowless: it still reads as an
 *  object, but no playable cell behind it is hidden. Materials are cloned
 *  because model clones share them. */
function makeSeeThrough(group: THREE.Object3D): void {
  group.traverse(node => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    const fade = (material: THREE.Material) => {
      const copy = material.clone()
      copy.transparent = true
      copy.opacity = material.opacity * SEE_THROUGH_OPACITY
      copy.depthWrite = false
      return copy
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fade) : fade(mesh.material)
    mesh.castShadow = false
    mesh.renderOrder = 3
  })
}

function ghostBox(box: Box3, offsetY: number, opacity: number, colour = '#c9ab72'): THREE.LineSegments {
  const w = box.max[0] - box.min[0], h = box.max[1] - box.min[1], d = box.max[2] - box.min[2]
  const boxGeometry = new THREE.BoxGeometry(w, h, d)
  const edges = new THREE.EdgesGeometry(boxGeometry)
  boxGeometry.dispose()
  // Architectural edges only: mesh wireframes expose each face's triangulation.
  const mesh = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: colour, transparent: true, opacity, depthWrite: false,
    }),
  )
  mesh.position.set(box.min[0] + w / 2, box.min[1] + h / 2 + offsetY, box.min[2] + d / 2)
  mesh.renderOrder = 4
  return mesh
}

function isDescendantOf(node: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = node
  while (p) { if (p === ancestor) return true; p = p.parent }
  return false
}

function helperFor(box: Box3, colour: string): THREE.Box3Helper {
  return new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(...box.min), new THREE.Vector3(...box.max)), new THREE.Color(colour))
}

export function createSceneRenderer(canvas: HTMLCanvasElement, scene: ResolvedScene, companion?: CompanionScene): SceneRenderer | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setClearColor(0x000000, 0)

  const world = new THREE.Scene()
  const { frame, side } = scene

  // ---- camera from units.ts ------------------------------------------------
  const cam = new THREE.OrthographicCamera(
    -frame.viewWidthUnits / 2, frame.viewWidthUnits / 2,
    frame.viewHeightUnits / 2, -frame.viewHeightUnits / 2, -50, 50,
  )
  const dir = frame.cameraDirection
  const centre = new THREE.Vector3(...frame.centre)
  cam.position.set(centre.x + dir[0] * 20, centre.y + dir[1] * 20, centre.z + dir[2] * 20)
  cam.lookAt(centre)
  cam.updateProjectionMatrix()

  // ---- light -----------------------------------------------------------------
  world.add(new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY))
  const key = new THREE.DirectionalLight(KEY_COLOUR, KEY_INTENSITY)
  key.position.set(side / 2 + KEY_OFFSET[0], KEY_OFFSET[1], side / 2 + KEY_OFFSET[2])
  key.target.position.set(side / 2, 0, side / 2)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  const sc = key.shadow.camera
  const reach = side * 0.8 + 1
  sc.left = -reach; sc.right = reach; sc.top = reach; sc.bottom = -reach; sc.near = 1; sc.far = 30
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.02
  key.shadow.radius = 2
  world.add(key, key.target)

  // ---- highlight decals: clipped to each physical part of a logical cell ----
  const makeCellQuads = (target: ResolvedScene, offsetY: number, colour: string, order: number) => {
    const quads: THREE.Mesh[][][] = Array.from({ length: target.n }, () => Array.from({ length: target.n }, () => []))
    for (const patch of floorPatches(target)) {
      const width = patch.box.max[0] - patch.box.min[0]
      const depth = patch.box.max[2] - patch.box.min[2]
      const geometry = new THREE.PlaneGeometry(width, depth)
      geometry.rotateX(-Math.PI / 2)
      const material = new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0, depthWrite: false })
      const quad = new THREE.Mesh(geometry, material)
      quad.position.set(
        (patch.box.min[0] + patch.box.max[0]) / 2,
        patch.y + offsetY + (order === 10 ? 0.008 : 0.009),
        (patch.box.min[2] + patch.box.max[2]) / 2,
      )
      quad.renderOrder = order
      quad.visible = false
      world.add(quad)
      quads[patch.row][patch.col].push(quad)
    }
    return quads
  }
  // Logical interaction remains N×N; only the floor paint follows the slab.
  const cellQuads = makeCellQuads(scene, 0, NEUTRAL_MATERIAL, 10)
  const companionCellQuads = companion
    ? makeCellQuads(companion.scene, companion.offsetY, '#8a6cff', 9)
    : []
  const diagGroup = new THREE.Group()
  diagGroup.visible = false
  world.add(diagGroup)

  // ---- render on demand -------------------------------------------------------------
  let pending = false
  let disposed = false
  const requestRender = () => {
    if (pending || disposed) return
    pending = true
    requestAnimationFrame(() => { pending = false; if (!disposed) renderer.render(world, cam) })
  }

  // ---- build ----------------------------------------------------------------------------
  const jobs: Promise<unknown>[] = []
  // Fractional wood pieces retain the Kenney floor material and slab height.
  for (const patch of floorPatches(scene)) {
    const [x0, z0, x1, z1] = patch.bounds
    if (patch.material !== 'wood') {
      const slab = FLOOR_SLAB[patch.material]
      const m = boxMesh(patch.box, slab.edge, slab.top)
      m.castShadow = false
      world.add(m)
      continue
    }
    jobs.push(loadModel('floorFull').then(g => {
      g.scale.set((x1 - x0) * CELL, 1, (z1 - z0) * CELL)
      g.position.set((x0 + x1) * CELL / 2, patch.y - FLOOR_THICKNESS, (z0 + z1) * CELL / 2)
      world.add(g)
      requestRender()
    }))
  }
  // Grounded frame members carry the upper slab without adding floor or navigation cells.
  // Only the posts are drawn, and see-through: the overhead beams and joists sit
  // above the standee line and the companion storey already draws the slab
  // outline, so solid members would only hide the ground cells under the overhang.
  const seeThrough = seeThroughOccluders(scene)
  for (const member of exteriorSupportMembers(scene)) {
    diagGroup.add(helperFor(member.box, '#8a6641'))
    if (member.kind !== 'column') continue
    const mesh = boxMesh(member.box, SUPPORT_FACE, SUPPORT_CAP)
    if (seeThrough.supports.has(member.id)) makeSeeThrough(mesh)
    world.add(mesh)
  }
  // thresholds: a half-height step on the low side of every opening to lower ground
  for (const t of scene.thresholds) world.add(boxMesh(t, FOUNDATION, FOUNDATION))
  // walls
  for (const w of scene.walls) {
    const shell = w.kind === 'shell-back' || w.kind === 'shell-front'
    const face = w.kind === 'foundation' ? FOUNDATION : w.kind === 'shell-front' ? PLINTH : shell ? WALL_FACE : PARTITION_FACE
    const cap = w.kind === 'foundation' ? FOUNDATION : w.kind === 'shell-front' ? PLINTH : shell ? WALL_CAP : PARTITION_CAP
    for (const piece of w.visualPieces ?? w.pieces) {
      world.add(boxMesh(piece, w.visualPieces ? FRAME_WOOD : face, w.visualPieces ? FRAME_WOOD : cap))
      diagGroup.add(helperFor(piece, '#2f7dff'))
    }
    for (const f of w.frames) world.add(boxMesh(f, FRAME_WOOD, FRAME_WOOD))
    for (const op of w.openings) diagGroup.add(helperFor(op.box, '#ff9f1c'))
  }
  // objects
  const placeObject = (o: ResolvedObject): Promise<void> => {
    if (o.architecturalMembers?.length) {
      for (const member of o.architecturalMembers) {
        world.add(boxMesh(member.box, FRAME_WOOD, FRAME_WOOD))
        diagGroup.add(helperFor(member.box, '#e59964'))
      }
      requestRender()
      return Promise.resolve()
    }
    return loadModel(o.model).then(g => {
      if (o.part) {
        // keep only the named child (the window pane inside wallWindow) and
        // re-pivot on it: footprint centre at the origin, feet at y = 0
        const root = g.children[0]
        const keep = root.getObjectByName(o.part)
        if (keep) {
          root.traverse(n => { if ((n as THREE.Mesh).isMesh && !isDescendantOf(n, keep)) n.visible = false })
          // The cached clone carries the world matrices of the un-pivoted model; measure the
          // pane from fresh ones or it is re-centred half a unit off and ends up inside the wall.
          g.updateMatrixWorld(true)
          const bb = new THREE.Box3().setFromObject(keep)
          const sz = bb.getSize(new THREE.Vector3())
          root.position.set(root.position.x - (bb.min.x + sz.x / 2), root.position.y - bb.min.y, root.position.z - (bb.min.z + sz.z / 2))
        }
      }
      g.position.set(o.position[0], o.position[1], o.position[2])
      g.rotation.y = (o.rotY * Math.PI) / 180
      g.userData = { id: o.id, model: o.model, logic: o.logic }
      if (seeThrough.objects.has(o.id)) makeSeeThrough(g)
      world.add(g)
      const colour = o.kind === 'furniture' ? (o.parentId ? '#ff4fd8' : '#3ddc84') : '#9aa0a6'
      diagGroup.add(helperFor(o.box, colour))
      requestRender()
    })
  }
  for (const o of scene.objects) jobs.push(placeObject(o))
  if (companion) {
    const ghostOpacity = companion.mode === 'ghost' ? 0.16 : 0.32
    const other = companion.scene
    if (companion.mode === 'exploded') {
      const lower = companion.offsetY > 0 ? scene : other
      for (const stair of lower.objects.filter(object => object.kind === 'stairs')) {
        const segments = explodedConnectionSegments(stair,
          companion.offsetY < 0 ? companion.offsetY : 0,
          companion.offsetY > 0 ? companion.offsetY : 0)
        for (const [index, points] of [segments.slice(0, 2), segments.slice(2)].entries()) {
          const geometry = new THREE.BufferGeometry().setFromPoints(points.flat().map(point => new THREE.Vector3(...point)))
          const appearance = { color: '#99612c', transparent: true, opacity: 0.75, depthTest: false, depthWrite: false }
          const material = index === 0
            ? new THREE.LineDashedMaterial({ ...appearance, dashSize: 0.07, gapSize: 0.04 })
            : new THREE.LineBasicMaterial(appearance)
          const guide = new THREE.LineSegments(geometry, material)
          guide.computeLineDistances()
          guide.renderOrder = 6
          world.add(guide)
        }
      }
    }
    for (const piece of companionWallBoxesThroughStairwell(scene, other, companion)) {
      const patch = boxMesh(piece, WALL_FACE, WALL_CAP)
      patch.position.y += companion.offsetY
      world.add(patch)
    }
    for (const slab of companionFloorBoxes(other)) world.add(ghostBox(slab, companion.offsetY, ghostOpacity))
    for (const member of exteriorSupportMembers(other)) {
      world.add(ghostBox(member.box, companion.offsetY, ghostOpacity, SUPPORT_GHOST))
    }
    for (const wall of other.walls) {
      for (const piece of wall.visualPieces ?? wall.pieces) world.add(ghostBox(piece, companion.offsetY, ghostOpacity))
      for (const frameBox of wall.frames) world.add(ghostBox(frameBox, companion.offsetY, ghostOpacity))
    }
    for (const stair of other.objects.filter(object => object.kind === 'stairs')) {
      jobs.push(loadModel(stair.model).then(group => {
        group.traverse(node => {
          const mesh = node as THREE.Mesh
          if (!mesh.isMesh) return
          const fade = (material: THREE.Material) => {
            const copy = material.clone()
            // At true height the active slab must occlude the lower flight,
            // leaving real, solid treads visible through its stairwell opening.
            const exploded = companion.mode === 'exploded'
            copy.transparent = exploded
            copy.opacity = exploded ? 0.48 : 1
            copy.depthWrite = !exploded
            return copy
          }
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fade) : fade(mesh.material)
        })
        group.position.set(stair.position[0], stair.position[1] + companion.offsetY, stair.position[2])
        group.rotation.y = (stair.rotY * Math.PI) / 180
        group.renderOrder = 5
        world.add(group)
        requestRender()
      }))
    }
  }
  const ready = Promise.all(jobs).then(() => {
    requestRender()
  })

  // ---- highlights ------------------------------------------------------------------------
  const key2 = (r: number, c: number) => `${r},${c}`
  const setHighlights = (h: HighlightState) => {
    diagGroup.visible = !!h.diag
    for (let r = 0; r < scene.n; r++) for (let c = 0; c < scene.n; c++) {
      let colour: string | null = null, opacity = 0
      if (!h.envOnly) {
        const inRow = h.activeRow === r, inCol = h.activeCol === c
        const active = h.activeRow != null || h.activeCol != null
        const locked = h.lockedRows?.has(r) || h.lockedCols?.has(c)
        const conflict = h.conflictRows?.has(r) || h.conflictCols?.has(c)
        const blocked = h.blockedRows?.has(r) || h.blockedCols?.has(c)
        const clue = h.clueCells?.has(key2(r, c))
        if (locked) { colour = '#4caf72'; opacity = 0.14 }
        if (blocked) { colour = '#8a6cff'; opacity = 0.16 }
        if (conflict) { colour = '#ff3b3b'; opacity = 0.30 }
        if (clue) { colour = '#fff2c8'; opacity = 0.42 }
        if (active) {
          if (inRow && inCol) { colour = '#ffd27a'; opacity = 0.55 }
          else if (inRow) { colour = '#ffb547'; opacity = 0.30 }
          else if (inCol) { colour = '#5ac8ff'; opacity = 0.30 }
          else if (!colour) { colour = '#1a120a'; opacity = 0.10 }
        }
        if (h.hoverTarget && h.hoverTarget.row === r && h.hoverTarget.col === c) {
          colour = h.hoverTarget.valid ? '#3fae5c' : '#c94444'; opacity = 0.5
        }
      }
      for (const q of cellQuads[r][c]) {
        const mat = q.material as THREE.MeshBasicMaterial
        q.visible = opacity > 0
        if (colour) mat.color.set(colour)
        mat.opacity = opacity
      }
    }
    if (companion) {
      for (let r = 0; r < companion.scene.n; r++) for (let c = 0; c < companion.scene.n; c++) {
        let colour = '#8a6cff', opacity = 0
        if (!h.envOnly) {
          if (h.blockedRows?.has(r) || h.blockedCols?.has(c)) opacity = 0.12
          if (h.activeRow === r || h.activeCol === c) opacity = Math.max(opacity, 0.10)
          if (h.hoverTarget?.row === r && h.hoverTarget.col === c) {
            colour = h.hoverTarget.valid ? '#3fae5c' : '#c94444'
            opacity = 0.32
          }
        }
        for (const q of companionCellQuads[r][c]) {
          const mat = q.material as THREE.MeshBasicMaterial
          q.visible = opacity > 0
          mat.color.set(colour)
          mat.opacity = opacity
        }
      }
    }
    requestRender()
  }

  const setSize = (w: number, h: number) => {
    renderer.setSize(w, h, false)
    requestRender()
  }

  const dispose = () => {
    disposed = true
    renderer.dispose()
  }

  requestRender()
  return { setHighlights, setSize, ready, dispose }
}
