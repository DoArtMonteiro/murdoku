// ============================================================================
// SCENE VALIDATION — the machine-checkable half of the recipe.
//
// Every rule here is stated in docs/ISOMETRIC_SCENE_SYSTEM.md. Errors are
// physical impossibilities or contract breaches (a bed inside a wall, a
// microwave on the floor, a room nobody can reach); warnings are things a
// human should look at. Beauty is not checked here and never will be.
// ============================================================================

import { CELL, STOREY_HEIGHT, type Vec3 } from './units'
import { parseLogic, type Box3, type Rect, type ResolvedScene, type ResolvedWall } from './resolve'
import { exteriorSupportMembers } from './exteriorSupport'
import { furnitureCells, type Puzzle } from '../core/types'
import { rayHitsBox, solidObject, cellSightBlockers, seeThroughOccluders } from './sightlines'
import { planRectToWorld, validPlanRect, worldRectCoveredByFloor, type WorldRect } from './floorGeometry'
import { connectedCirculationRects } from './circulationGeometry'
import { validatePhysicalConnection, validateUpperSupport } from './storeyConnection'

export type Severity = 'error' | 'warning'

export interface Violation {
  code:
    | 'unresolved'
    | 'wall-thickness-inconsistent' | 'insert-off-wall'
    | 'zone-boundary-unwalled' | 'envelope-undefined' | 'zone-object-mismatch'
    | 'wall-penetration' | 'furniture-overlap' | 'outside-floor'
    | 'floor-missing' | 'stairwell-collision' | 'wall-unsupported'
    | 'unsupported-prop' | 'prop-overhang'
    | 'door-blocked' | 'wall-free-end'
    | 'room-unreachable' | 'no-entry'
    | 'storey-mismatch' | 'stair-missing' | 'stair-rise-mismatch'
    | 'stairwell-missing' | 'stairwell-size-mismatch' | 'stair-floor-mismatch'
    | 'stair-slab-blocked' | 'stair-landing-blocked' | 'upper-floor-inaccessible'
    | 'upper-floor-unsupported'
    | 'exterior-support-invalid' | 'exterior-support-ground-missing'
    | 'exterior-support-zone-mismatch' | 'exterior-support-orphan' | 'exterior-support-upper-mismatch' | 'exterior-support-collision'
    | 'exterior-support-solution-clearance'
    | 'circulation-missing' | 'circulation-malformed' | 'circulation-too-narrow'
    | 'circulation-blocked' | 'circulation-disconnected'
    | 'object-hidden' | 'cell-hidden' | 'tall-back-exposed'
    | 'logic-missing' | 'logic-unknown' | 'logic-displaced' | 'logic-type'
    | 'solution-floor-missing'
  severity: Severity
  subject: string
  message: string
}

const EPS = 1e-4

function overlaps(a: Box3, b: Box3, shrink = 0): boolean {
  return a.min[0] + shrink < b.max[0] - shrink && b.min[0] + shrink < a.max[0] - shrink
    && a.min[1] + shrink < b.max[1] - shrink && b.min[1] + shrink < a.max[1] - shrink
    && a.min[2] + shrink < b.max[2] - shrink && b.min[2] + shrink < a.max[2] - shrink
}
function rectOverlap(a: Rect, b: Rect, shrink = 0): boolean {
  return a.minX + shrink < b.maxX - shrink && b.minX + shrink < a.maxX - shrink
    && a.minZ + shrink < b.maxZ - shrink && b.minZ + shrink < a.maxZ - shrink
}
function rectContains(outer: Rect, inner: Rect, slack = 0): boolean {
  return inner.minX >= outer.minX - slack && inner.maxX <= outer.maxX + slack
    && inner.minZ >= outer.minZ - slack && inner.maxZ <= outer.maxZ + slack
}

function floodFill(blocked: Uint8Array, m: number, seed: [number, number]): Uint8Array {
  const reach = new Uint8Array(m * m)
  const stack: Array<[number, number]> = [seed]
  while (stack.length) {
    const [i, j] = stack.pop()!
    if (i < 0 || j < 0 || i >= m || j >= m || reach[i * m + j] || blocked[i * m + j]) continue
    reach[i * m + j] = 1
    stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1])
  }
  return reach
}

export function validateScene(scene: ResolvedScene, puzzle?: Puzzle): Violation[] {
  const out: Violation[] = []
  const err = (code: Violation['code'], subject: string, message: string) => out.push({ code, severity: 'error', subject, message })
  const warn = (code: Violation['code'], subject: string, message: string) => out.push({ code, severity: 'warning', subject, message })

  for (const p of scene.problems) err('unresolved', 'scene', p)
  for (const p of scene.exteriorSupportProblems ?? []) err('exterior-support-invalid', 'exterior-support', p)

  // ---- structural walls: one thickness per run, inserts on the wall line ----------
  for (const w of scene.walls) {
    if (w.kind === 'foundation') continue
    for (const piece of w.pieces) {
      const depth = w.axis === 'x' ? piece.max[2] - piece.min[2] : piece.max[0] - piece.min[0]
      if (Math.abs(depth - w.thickness) > 1e-6) err('wall-thickness-inconsistent', w.id, `${w.id} has a piece ${depth.toFixed(3)} thick; the wall is ${w.thickness}`)
    }
    const lineAt = w.axis === 'x' ? w.from[1] : w.from[0]
    for (const op of w.openings) {
      if (op.kind === 'open') continue
      const insert = scene.objects.find(o => (o.kind === 'window' || o.kind === 'door' || o.kind === 'entry')
        && Math.abs(o.position[0] - op.centre[0]) < 1e-6 && Math.abs(o.position[2] - op.centre[1]) < 1e-6)
      if (!insert) { err('insert-off-wall', w.id, `${op.kind} opening in ${w.id} has no inserted frame`); continue }
      const depth = w.axis === 'x' ? insert.box.max[2] - insert.box.min[2] : insert.box.max[0] - insert.box.min[0]
      const centre = w.axis === 'x' ? (insert.box.min[2] + insert.box.max[2]) / 2 : (insert.box.min[0] + insert.box.max[0]) / 2
      // a frame or a slightly open leaf may stand proud of the wall by a couple
      // of centimetres per side; a Kenney wall slab (0.09) plus offset would not pass
      if (depth > w.thickness + 0.04 + 1e-6) err('insert-off-wall', insert.id, `${insert.id} is ${depth.toFixed(3)} deep in a ${w.thickness} wall`)
      if (Math.abs(centre - lineAt) > 0.02) err('insert-off-wall', insert.id, `${insert.id} sits ${(centre - lineAt).toFixed(3)} off the wall line`)
    }
  }
  // ---- building envelope -----------------------------------------------------------
  {
    const n = scene.n
    const interiorCells = scene.zoneKind.flatMap((row, r) => row.filter((k, c) => scene.floorPresent[r][c] && k === 'interior')).length
    if (interiorCells === 0) err('envelope-undefined', 'scene', 'no interior cells: the building envelope is undefined')
    const wallOnEdge = (axis: 'x' | 'z', at: number, from: number, to: number) => scene.walls.some(w =>
      w.kind !== 'foundation' && w.axis === axis && Math.abs((axis === 'x' ? w.from[1] : w.from[0]) - at) < 1e-6
      && (axis === 'x' ? w.from[0] : w.from[1]) <= from + 1e-6 && (axis === 'x' ? w.to[0] : w.to[1]) >= to - 1e-6)
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const interior = scene.floorPresent[r][c] && scene.zoneKind[r][c] === 'interior'
      if (c + 1 < n
        && (scene.floorPresent[r][c + 1] && scene.zoneKind[r][c + 1] === 'interior') !== interior) {
        if (!wallOnEdge('z', (c + 1) * CELL, r * CELL, (r + 1) * CELL)) err('zone-boundary-unwalled', `${r},${c}`, `interior meets outside between (${r},${c}) and (${r},${c + 1}) with no facade wall`)
      }
      if (r + 1 < n
        && (scene.floorPresent[r + 1][c] && scene.zoneKind[r + 1][c] === 'interior') !== interior) {
        if (!wallOnEdge('x', (r + 1) * CELL, c * CELL, (c + 1) * CELL)) err('zone-boundary-unwalled', `${r},${c}`, `interior meets outside between (${r},${c}) and (${r + 1},${c}) with no facade wall`)
      }
    }
    for (const o of scene.objects) {
      if (o.kind !== 'furniture' || o.parentId) continue
      const r = Math.min(n - 1, Math.floor(o.position[2] / CELL)), c = Math.min(n - 1, Math.floor(o.position[0] / CELL))
      const expected = scene.floorY[r][c]
      if (Math.abs(o.position[1] - expected) > 1e-6) err('zone-object-mismatch', o.id, `${o.id} stands at y=${o.position[1]} on a cell whose ground is ${expected}`)
    }
  }

  const wallPieces = scene.walls.filter(w => w.kind !== 'foundation').flatMap(w => w.pieces.map(box => ({ wall: w, box })))
  const furniture = scene.objects.filter(o => o.kind === 'furniture' || o.kind === 'stairs')
  const solids = furniture.filter(solidObject)
  const byId = new Map(scene.objects.map(o => [o.id, o]))
  const supportMembers = exteriorSupportMembers(scene)
  const supportColumns = supportMembers.filter(member => member.kind === 'column')
  for (const member of supportMembers) {
    const obstruction = scene.objects.find(object =>
      (object.kind === 'furniture' || object.kind === 'stairs')
      && overlaps(member.box, object.box, 0.004))
    if (obstruction) {
      err('exterior-support-collision', member.id,
        member.id + ' intersects ' + obstruction.id + ' (' + obstruction.model + ')')
    }
  }

  // ---- every architectural/object footprint must have real floor support ------
  const hasFloorBesideWall = (wall: ResolvedWall, along: number) => {
    const lineAt = wall.axis === 'x' ? wall.from[1] : wall.from[0]
    const offset = wall.thickness / 2 + 0.002
    const points: Array<[number, number]> = wall.axis === 'x'
      ? [[along, lineAt - offset], [along, lineAt + offset]]
      : [[lineAt - offset, along], [lineAt + offset, along]]
    const sampleHasFloor = (candidate: ResolvedScene) => points.some(([x, z]) => worldRectCoveredByFloor(candidate, {
      minX: x - 0.001, maxX: x + 0.001, minZ: z - 0.001, maxZ: z + 0.001,
    }))
    if (sampleHasFloor(scene)) return true
    if (!scene.stairwellBounds) return false

    // A wall on a stairwell face may bound the stair volume without adjacent slab.
    const well = planRectToWorld(scene.stairwellBounds)
    const followsWellFace = wall.axis === 'x'
      ? (Math.abs(lineAt - well.minZ) <= EPS || Math.abs(lineAt - well.maxZ) <= EPS)
        && along >= well.minX - EPS && along <= well.maxX + EPS
      : (Math.abs(lineAt - well.minX) <= EPS || Math.abs(lineAt - well.maxX) <= EPS)
        && along >= well.minZ - EPS && along <= well.maxZ + EPS
    return followsWellFace && sampleHasFloor({ ...scene, stairwellBounds: undefined })
  }
  for (const wall of scene.walls) {
    if (wall.kind === 'foundation') continue
    const start = wall.axis === 'x' ? wall.from[0] : wall.from[1]
    const end = wall.axis === 'x' ? wall.to[0] : wall.to[1]
    const samples = Math.max(1, Math.ceil((end - start) / (CELL / 4)))
    const supported = Array.from({ length: samples }, (_, i) => start + (i + 0.5) * (end - start) / samples)
      .every(along => hasFloorBesideWall(wall, along))
    if (!supported) err('wall-unsupported', wall.id, `${wall.id} has no floor support along part of its run`)
  }

  for (const object of scene.objects.filter(o => o.kind === 'furniture' || o.kind === 'rug' || o.kind === 'stairs')) {
    const overlapsWell = !!scene.stairwellBounds && rectOverlap(object.footprint, planRectToWorld(scene.stairwellBounds))
    if (overlapsWell) {
      err('stairwell-collision', object.id, `${object.id} (${object.model}) crosses the open stairwell`)
    } else if (!worldRectCoveredByFloor(scene, object.footprint)) {
      err('floor-missing', object.id, `${object.id} (${object.model}) is not fully supported by this storey's floor`)
    }
  }

  // ---- physical envelope vs walls and floor -----------------------------------
  for (const o of solids) {
    for (const { wall, box } of wallPieces) {
      if (overlaps(o.box, box, 0.004)) err('wall-penetration', o.id, `${o.id} (${o.model}) penetrates wall ${wall.id}`)
    }
    if (o.footprint.minX < -EPS || o.footprint.minZ < -EPS
      || o.footprint.maxX > scene.side + EPS || o.footprint.maxZ > scene.side + EPS) {
      err('outside-floor', o.id, `${o.id} extends past the floor slab`)
    }
  }
  // ---- furniture vs furniture ------------------------------------------------
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const a = solids[i], b = solids[j]
    if (a.parentId === b.id || b.parentId === a.id) continue
    if (overlaps(a.box, b.box, 0.004)) err('furniture-overlap', a.id, `${a.id} (${a.model}) intersects ${b.id} (${b.model})`)
  }
  // ---- surface props ------------------------------------------------------------
  for (const o of furniture) {
    if (o.meta.support !== 'surface') continue
    if (!o.parentId) { err('unsupported-prop', o.id, `${o.id} (${o.model}) needs a supporting surface`); continue }
    const parent = byId.get(o.parentId)!
    if (!rectContains(parent.footprint, o.footprint, 0.03)) err('prop-overhang', o.id, `${o.id} overhangs ${parent.id}`)
  }
  // ---- doors: keep the swing clear on both sides -------------------------------------
  for (const w of scene.walls) for (const op of w.openings) {
    if (w.kind === 'shell-front' || op.kind === 'window') continue
    const clearance = 0.45
    const half = op.width / 2
    const zone: Rect = w.axis === 'x'
      ? { minX: op.centre[0] - half, maxX: op.centre[0] + half, minZ: op.centre[1] - clearance, maxZ: op.centre[1] + clearance }
      : { minX: op.centre[0] - clearance, maxX: op.centre[0] + clearance, minZ: op.centre[1] - half, maxZ: op.centre[1] + half }
    for (const o of solids) {
      if (rectOverlap(o.footprint, zone, 0.01)) err('door-blocked', w.id, `${o.id} blocks the opening in ${w.id}`)
    }
  }
  // ---- wall endpoints must land on something -----------------------------------------
  const onSomeWall = (p: [number, number], self: ResolvedWall) => {
    if (p[0] < EPS || p[1] < EPS || p[0] > scene.side - EPS || p[1] > scene.side - EPS) return true // meets the shell
    return scene.walls.some(w => {
      if (w === self) return false
      const tol = w.thickness / 2 + EPS
      if (w.axis === 'x') return Math.abs(p[1] - w.from[1]) <= tol && p[0] >= w.from[0] - tol && p[0] <= w.to[0] + tol
      return Math.abs(p[0] - w.from[0]) <= tol && p[1] >= w.from[1] - tol && p[1] <= w.to[1] + tol
    })
  }
  for (const w of scene.walls) {
    if (w.kind !== 'partition') continue
    for (const end of ['from', 'to'] as const) {
      if (w.declaredFreeEnds.includes(end)) continue
      const p = w[end]
      if (!onSomeWall(p, w)) err('wall-free-end', w.id, `${w.id} ends in open floor at (${(p[0] / CELL).toFixed(2)}, ${(p[1] / CELL).toFixed(2)}) — join it to a wall or declare freeEnds`)
    }
  }

  // ---- authored upper-storey circulation ------------------------------------
  if (scene.circulation) {
    const circulation = scene.circulation
    const authored = [
      { id: 'landing', bounds: circulation.landing, minimumWidth: true },
      ...circulation.halls.map(hall => ({ ...hall, minimumWidth: true })),
      ...circulation.roomAccessTargets.map(target => ({ ...target, minimumWidth: false })),
    ]
    const ids = new Set<string>()
    const usable: Array<{ id: string; bounds: WorldRect }> = []
    for (const item of authored) {
      if (ids.has(item.id)) err('circulation-malformed', item.id, `duplicate circulation id ${item.id}`)
      ids.add(item.id)
      if (!validPlanRect(item.bounds, scene.n)) {
        err('circulation-malformed', item.id, `${item.id} has invalid bounds [${item.bounds.join(',')}]`)
        continue
      }
      const original = planRectToWorld(item.bounds)
      if (!worldRectCoveredByFloor(scene, original)) {
        err('circulation-blocked', item.id, `${item.id} crosses missing floor or the stairwell`)
        continue
      }
      const clear = { ...original }
      let crossedWall: string | undefined
      for (const { wall, box } of wallPieces) {
        const wallRect: WorldRect = { minX: box.min[0], maxX: box.max[0], minZ: box.min[2], maxZ: box.max[2] }
        if (!rectOverlap(clear, wallRect, 1e-8)) continue
        if (wall.axis === 'z') {
          if (wallRect.minX <= clear.minX + EPS) clear.minX = Math.max(clear.minX, wallRect.maxX)
          else if (wallRect.maxX >= clear.maxX - EPS) clear.maxX = Math.min(clear.maxX, wallRect.minX)
          else crossedWall = wall.id
        } else {
          if (wallRect.minZ <= clear.minZ + EPS) clear.minZ = Math.max(clear.minZ, wallRect.maxZ)
          else if (wallRect.maxZ >= clear.maxZ - EPS) clear.maxZ = Math.min(clear.maxZ, wallRect.minZ)
          else crossedWall = wall.id
        }
      }
      const obstacle = solids.find(object => !object.parentId && rectOverlap(object.footprint, clear, 0.005))
      const supportColumn = supportColumns.find(({ box }) =>
        rectOverlap({ minX: box.min[0], maxX: box.max[0], minZ: box.min[2], maxZ: box.max[2] }, clear, 0.005))
      if (crossedWall || obstacle || supportColumn) {
        const blocker = crossedWall ? `wall ${crossedWall}`
          : obstacle ? `${obstacle.id} (${obstacle.model})` : supportColumn!.id
        err('circulation-blocked', item.id, `${item.id} is blocked by ${blocker}`)
      }
      if (item.minimumWidth && Math.min(clear.maxX - clear.minX, clear.maxZ - clear.minZ) < 0.6 - EPS) {
        err('circulation-too-narrow', item.id, `${item.id} has less than 0.600 clear world units between finished faces`)
      }
      usable.push({ id: item.id, bounds: clear })
    }
    if (usable.length === authored.length) {
      const connected = connectedCirculationRects(usable.map(({ bounds }) => [
        bounds.minX / CELL, bounds.minZ / CELL, bounds.maxX / CELL, bounds.maxZ / CELL,
      ]), 0.6 / CELL)
      authored.forEach((item, index) => {
        if (!connected.has(index)) err('circulation-disconnected', item.id, `${item.id} is not connected to the stair landing`)
      })
    }
  }
  // ---- reachability: every room walkable from the entry ---------------------------
  if (puzzle) {
    const res = 4
    const m = scene.n * res
    const step = CELL / res
    const blocked = new Uint8Array(m * m)
    // A sample is a step×step square, not a point: walls are thinner than the
    // sampling step, so a point test would let the flood fill leak through them.
    const half = step / 2
    const walkable = (px: number, pz: number) => {
      if (!worldRectCoveredByFloor(scene, {
        minX: px - half, maxX: px + half, minZ: pz - half, maxZ: pz + half,
      })) return false
      for (const { box } of wallPieces) {
        if (px + half > box.min[0] && px - half < box.max[0] && pz + half > box.min[2] && pz - half < box.max[2]) return false
      }
      for (const o of solids) if (!o.parentId && px > o.footprint.minX && px < o.footprint.maxX && pz > o.footprint.minZ && pz < o.footprint.maxZ) return false
      const row = Math.min(scene.n - 1, Math.floor(pz / CELL))
      const col = Math.min(scene.n - 1, Math.floor(px / CELL))
      const groundY = scene.floorY[row]?.[col]
      if (groundY !== undefined && supportColumns.some(({ box }) => box.min[1] <= groundY + EPS
        && box.max[1] > groundY + EPS
        && px + half > box.min[0] && px - half < box.max[0]
        && pz + half > box.min[2] && pz - half < box.max[2])) return false
      return true
    }
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) blocked[i * m + j] = walkable((j + 0.5) * step, (i + 0.5) * step) ? 0 : 1
    let seed: [number, number]
    if (scene.entry) {
      const [ex, ez] = scene.entry.centre
      seed = [Math.min(m - 1, Math.floor(ez / step + (scene.entry.wall === 'north' ? 0.5 : 0))),
              Math.min(m - 1, Math.floor(ex / step + (scene.entry.wall === 'west' ? 0.5 : 0)))]
    } else if (scene.floor > 0 && scene.circulation) {
      const landing = scene.circulation.landing
      seed = [Math.floor(((landing[1] + landing[3]) / 2) * res), Math.floor(((landing[0] + landing[2]) / 2) * res)]
    } else if (scene.floor > 0 && scene.stairwellBounds) {
      const [x0, z0, x1, z1] = scene.stairwellBounds
      const candidates: Array<[number, number]> = [
        [Math.floor(((z0 + z1) / 2) * res), Math.ceil(x1 * res)],
        [Math.floor(((z0 + z1) / 2) * res), Math.floor(x0 * res) - 1],
        [Math.ceil(z1 * res), Math.floor(((x0 + x1) / 2) * res)],
        [Math.floor(z0 * res) - 1, Math.floor(((x0 + x1) / 2) * res)],
      ]
      seed = candidates.find(([i, j]) => i >= 0 && j >= 0 && i < m && j < m && !blocked[i * m + j])
        ?? [Math.floor(((z0 + z1) / 2) * res), Math.floor(((x0 + x1) / 2) * res)]
    } else {
      warn('no-entry', 'scene', 'no entry declared — circulation is checked from the front-most free sample')
      seed = [m - 1, Math.floor(m / 2)]
    }
    let reach = floodFill(blocked, m, seed)
    if (!reach.some(v => v)) {
      // the seed sits in the wall line itself; step inward until free
      for (let d = 1; d < res * 2 && !reach.some(v => v); d++) {
        for (const cand of [[seed[0] + d, seed[1]], [seed[0], seed[1] + d]] as Array<[number, number]>) {
          if (cand[0] < m && cand[1] < m && !blocked[cand[0] * m + cand[1]]) { reach = floodFill(blocked, m, cand); break }
        }
      }
    }
    const roomOf = puzzle.roomOfByFloor?.[scene.floor] ?? puzzle.roomOf
    for (const room of puzzle.rooms) {
      if ((room.floor ?? 0) !== scene.floor) continue
      const reachable = room.cells.some(cell => {
        if (roomOf[cell.row]?.[cell.col] !== room.id) return false
        for (let di = 0; di < res; di++) for (let dj = 0; dj < res; dj++) {
          if (reach[(cell.row * res + di) * m + cell.col * res + dj]) return true
        }
        return false
      })
      if (!reachable) err('room-unreachable', room.id, `${room.name} cannot be walked into from the entry`)
    }
  }
  // ---- visibility from the camera ---------------------------------------------------
  const dir = scene.frame.cameraDirection
  const visibleWalls = scene.walls.filter(w => w.kind !== 'foundation')
    .flatMap(wall => (wall.visualPieces ?? wall.pieces).map(box => ({ wall, box })))
  const wallBoxes = visibleWalls.map(p => p.box)
  for (const o of solids) {
    if (o.parentId) continue
    const top: Vec3 = [(o.box.min[0] + o.box.max[0]) / 2, o.box.max[1] * 0.9, (o.box.min[2] + o.box.max[2]) / 2]
    const hit = wallBoxes.find(b => rayHitsBox(top, dir, b) !== null)
    if (hit) {
      const wall = visibleWalls.find(p => p.box === hit)!.wall
      err('object-hidden', o.id, `${o.id} (${o.model}) is hidden behind wall ${wall.id} from the camera`)
    }
  }
  // A cell is hidden when an opaque thing crosses its badge-height sightline.
  // Walls are drawn opaque, so a wall blocker always counts. Free-standing
  // solids and exterior support posts that cross a sightline are drawn at
  // SEE_THROUGH_OPACITY by the renderer (see sightlines.ts, the single source
  // for both), so they leave the cell readable and are not reported here.
  // This is a 3D camera sightline advisory: the suspect's portrait is a DOM
  // overlay above the canvas and is checked separately in browser QA.
  {
    const seeThrough = seeThroughOccluders(scene)
    for (const cell of cellSightBlockers(scene)) {
      const blockers = [
        ...cell.walls.map(id => `wall:${id}`),
        ...cell.objects.filter(id => !seeThrough.objects.has(id)).map(id => `object:${id}`),
        ...cell.supports.filter(id => !seeThrough.supports.has(id)).map(id => `support:${id}`),
      ].sort()
      if (blockers.length) {
        warn('cell-hidden', `${cell.row},${cell.col}`,
          `cell (${cell.row},${cell.col}) has a blocked 3D sightline at standee height: ${blockers.join(', ')}`)
      }
    }
  }
  // ---- tall objects keep their backs to the back walls ----------------------------------
  for (const o of solids) {
    if (!o.meta.tall || o.parentId || o.meta.symmetric || o.kind === 'stairs') continue
    if (o.facing !== 'N' && o.facing !== 'W') continue
    if (o.againstWall === 'south' || o.againstWall === 'east') {
      warn('tall-back-exposed', o.id, `${o.id} (${o.model}) backs onto the cut-away ${o.againstWall} shell; its back faces the camera — check it reads`)
    } else {
      err('tall-back-exposed', o.id, `${o.id} (${o.model}) is tall and shows its back to the camera — face it S or E`)
    }
  }
  // ---- logic contract ---------------------------------------------------------------
  if (puzzle) {
    for (const [personId, cell] of Object.entries(puzzle.solution)) {
      if ((cell.floor ?? 0) !== scene.floor) continue
      const x = (cell.col + 0.5) * CELL, z = (cell.row + 0.5) * CELL
      if (!worldRectCoveredByFloor(scene, { minX: x - 0.001, maxX: x + 0.001, minZ: z - 0.001, maxZ: z + 0.001 })) {
        err('solution-floor-missing', personId, `${personId}'s solved position (${cell.row},${cell.col}) has no floor`)
      }
      const groundY = scene.floorY[cell.row]?.[cell.col]
      if (groundY !== undefined && supportColumns.some(({ box }) => box.min[1] <= groundY + EPS
        && box.max[1] > groundY + EPS
        && x > box.min[0] && x < box.max[0] && z > box.min[2] && z < box.max[2])) {
        err('exterior-support-solution-clearance', personId,
          `${personId}'s solved cell (${cell.row},${cell.col}) is occupied by an exterior support column`)
      }
    }
    const logical = puzzle.furniture.filter(f => (f.floor ?? 0) === scene.floor)
    const ids = new Set(logical.map(f => `${f.type}@${f.row},${f.col}`))
    const represented = new Set<string>()
    for (const o of furniture) {
      if (!o.logic) continue
      const parsed = parseLogic(o.logic)
      if (!parsed || !ids.has(o.logic)) { err('logic-unknown', o.id, `${o.id} claims logic "${o.logic}" which is not in the puzzle`); continue }
      represented.add(o.logic)
      const allowed = o.meta.represents ?? []
      if (!allowed.includes(parsed.type as never)) err('logic-type', o.id, `${o.model} cannot represent a ${parsed.type}`)
      const lf = logical.find(f => `${f.type}@${f.row},${f.col}` === o.logic)!
      const cells = furnitureCells(lf)
      const area: Rect = {
        minX: Math.min(...cells.map(c => c.col)) * CELL, maxX: (Math.max(...cells.map(c => c.col)) + 1) * CELL,
        minZ: Math.min(...cells.map(c => c.row)) * CELL, maxZ: (Math.max(...cells.map(c => c.row)) + 1) * CELL,
      }
      if (!rectOverlap(o.footprint, area, -0.02)) err('logic-displaced', o.id, `${o.id} does not touch the cells of ${o.logic}`)
    }
    for (const id of ids) if (!represented.has(id)) err('logic-missing', id, `logical furniture ${id} has no visual object`)
  }
  return out
}

/**
 * Validate the physical contract between two separately rendered storeys.
 * Each scene remains local to y=0 for active-floor rendering; this check joins
 * them conceptually at STOREY_HEIGHT and proves that the real Kenney flight,
 * the slab opening and both circulation landings agree.
 */
export function validateStoreyPair(lower: ResolvedScene, upper: ResolvedScene): Violation[] {
  const out: Violation[] = []
  const err = (code: Violation['code'], subject: string, message: string) => out.push({ code, severity: 'error' as const, subject, message })

  if (lower.puzzleId !== upper.puzzleId || lower.n !== upper.n || upper.floor !== lower.floor + 1) {
    err('storey-mismatch', 'storeys', `expected consecutive storeys of one ${lower.n}×${lower.n} case; got ${lower.puzzleId}#${lower.floor} and ${upper.puzzleId}#${upper.floor}`)
    return out
  }

  out.push(...validateUpperSupport(lower, upper))

  const stair = lower.objects.find(object => object.kind === 'stairs')
  if (!stair) {
    err('stair-missing', 'stairs', 'the lower storey has no physical staircase')
    err('upper-floor-inaccessible', 'upper-storey', 'the upper storey cannot be reached without a staircase')
    return out
  }

  if (Math.abs(stair.size[1] - STOREY_HEIGHT) > 0.08) {
    err('stair-rise-mismatch', stair.id, `${stair.model} rises ${stair.size[1].toFixed(3)}; the storey pitch is ${STOREY_HEIGHT.toFixed(3)}`)
  }

  if (upper.stairwellSource === 'bounds') {
    return [...out, ...validatePhysicalConnection(lower, upper)]
  }

  const stairwell = upper.stairwell
  if (!stairwell) {
    err('stairwell-missing', 'stairwell', 'the upper slab has no opening above the staircase')
    err('upper-floor-inaccessible', 'upper-storey', 'the staircase terminates below an unbroken upper slab')
    return out
  }
  if (stairwell[0] < 0 || stairwell[1] < 0 || stairwell[2] >= upper.n || stairwell[3] >= upper.n
    || stairwell[0] > stairwell[2] || stairwell[1] > stairwell[3]) {
    err('stairwell-size-mismatch', 'stairwell', `stairwell [${stairwell.join(',')}] lies outside the ${upper.n}×${upper.n} upper slab`)
    err('upper-floor-inaccessible', 'upper-storey', 'the upper stairwell is malformed')
    return out
  }

  const stairwellCells = new Set<string>()
  for (let row = stairwell[1]; row <= stairwell[3]; row++) {
    for (let col = stairwell[0]; col <= stairwell[2]; col++) stairwellCells.add(`${row},${col}`)
  }
  const flightCells = new Set<string>()
  for (let row = 0; row < lower.n; row++) for (let col = 0; col < lower.n; col++) {
    const cell: Rect = { minX: col * CELL, maxX: (col + 1) * CELL, minZ: row * CELL, maxZ: (row + 1) * CELL }
    if (rectOverlap(stair.footprint, cell, 1e-5)) flightCells.add(`${row},${col}`)
  }
  const uncovered = [...flightCells].filter(cell => !stairwellCells.has(cell))
  if (uncovered.length) {
    err('stairwell-size-mismatch', 'stairwell', `the slab opening misses staircase cell(s): ${uncovered.join(', ')}`)
  }

  const dir = stair.facing === 'E' ? [1, 0] : stair.facing === 'W' ? [-1, 0]
    : stair.facing === 'S' ? [0, 1] : [0, -1]
  const runHalf = (stair.facing === 'E' || stair.facing === 'W')
    ? (stair.box.max[0] - stair.box.min[0]) / 2
    : (stair.box.max[2] - stair.box.min[2]) / 2
  const pointAt = (distance: number): [number, number] => [
    stair.position[0] + dir[0] * distance,
    stair.position[2] + dir[1] * distance,
  ]
  const cellAt = ([x, z]: [number, number]): [number, number] => [Math.floor(z / CELL), Math.floor(x / CELL)]
  const topFlightCell = cellAt(pointAt(runHalf - 0.02))
  if (!stairwellCells.has(`${topFlightCell[0]},${topFlightCell[1]}`)) {
    err('stair-slab-blocked', 'stairwell', `the stair head at (${topFlightCell.join(',')}) is covered by the upper slab`)
  }

  const landing = (scene: ResolvedScene, which: 'lower' | 'upper', distance: number) => {
    const [row, col] = cellAt(pointAt(distance))
    if (row < 0 || col < 0 || row >= scene.n || col >= scene.n) {
      err('stair-floor-mismatch', `${which}-landing`, `${which} landing falls outside the floor at (${row},${col})`)
      return
    }
    if (which === 'upper' && stairwellCells.has(`${row},${col}`)) {
      err('stair-floor-mismatch', 'upper-landing', `upper landing (${row},${col}) is still inside the stairwell instead of on a slab`)
    }
    const inset = 0.08
    const area: Rect = {
      minX: col * CELL + inset, maxX: (col + 1) * CELL - inset,
      minZ: row * CELL + inset, maxZ: (row + 1) * CELL - inset,
    }
    const obstacle = scene.objects.find(object => object.kind === 'furniture' && !object.parentId && rectOverlap(object.footprint, area, 0.01))
    const wall = scene.walls.find(candidate => candidate.kind !== 'foundation' && candidate.pieces.some(piece => rectOverlap({
      minX: piece.min[0], maxX: piece.max[0], minZ: piece.min[2], maxZ: piece.max[2],
    }, area, 0.01)))
    if (obstacle || wall) {
      const blocker = obstacle ? `${obstacle.id} (${obstacle.model})` : `wall ${wall!.id}`
      err('stair-landing-blocked', `${which}-landing`, `${blocker} blocks the ${which} landing at (${row},${col})`)
    }
  }

  landing(lower, 'lower', -runHalf - CELL / 2)
  landing(upper, 'upper', runHalf + CELL / 2)
  if (out.some(issue => issue.code.startsWith('stair') && issue.severity === 'error')) {
    err('upper-floor-inaccessible', 'upper-storey', 'the stair connection is not physically usable')
  }
  return out
}

export function formatViolations(v: Violation[]): string {
  return v.map(x => `${x.severity === 'error' ? 'ERROR' : 'warn '} [${x.code}] ${x.message}`).join('\n')
}
