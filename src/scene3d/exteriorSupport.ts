import type { Box3, ResolvedScene } from './resolve'
import type { CellRect, ExteriorSupportBaySpec } from './schema'
import { CELL, FLOOR_THICKNESS, STOREY_HEIGHT } from './units'

export const MAX_EXTERIOR_SUPPORT_BAY_CELLS = 3

const POST_WIDTH = 0.14
const PERIMETER_BEAM_WIDTH = 0.14
const PERIMETER_BEAM_HEIGHT = 0.14
const JOIST_WIDTH = 0.08
const JOIST_HEIGHT = 0.08

export interface ExteriorSupportMember {
  id: string
  kind: 'column' | 'perimeter-beam' | 'joist'
  box: Box3
}

export function resolveExteriorSupportBays(value: unknown, n: number, floor: number): {
  bays: ExteriorSupportBaySpec[]
  problems: string[]
} {
  const problems: string[] = []
  if (value === undefined) return { bays: [], problems }
  if (!Array.isArray(value)) return { bays: [], problems: ['exterior support bays must be an array'] }
  if (!value.length) return { bays: [], problems }
  if (floor !== 0) return { bays: [], problems: ['exterior support bays may only be declared on the ground storey'] }

  const bays: ExteriorSupportBaySpec[] = []
  const ids = new Set<string>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      problems.push('exterior support bay must be an object')
      continue
    }
    const candidate = entry as Partial<ExteriorSupportBaySpec>
    const unsupportedProperties = Object.keys(entry).filter(key => key !== 'id' && key !== 'cells').sort()
    if (unsupportedProperties.length) {
      problems.push('exterior support bay has unsupported properties: ' + unsupportedProperties.join(', '))
      continue
    }
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
    if (!id) {
      problems.push('exterior support bay requires a non-empty id')
      continue
    }
    if (ids.has(id)) {
      problems.push('exterior support bay id ' + id + ' is duplicated')
      continue
    }
    ids.add(id)
    const cells = candidate.cells
    if (!isCellRect(cells) || !validCellRect(cells, n)) {
      problems.push('exterior support bay ' + id + ' has malformed or out-of-bounds cell bounds')
      continue
    }
    const width = cells[2] - cells[0] + 1
    const depth = cells[3] - cells[1] + 1
    if (width > MAX_EXTERIOR_SUPPORT_BAY_CELLS || depth > MAX_EXTERIOR_SUPPORT_BAY_CELLS) {
      problems.push('exterior support bay ' + id + ' exceeds the ' + MAX_EXTERIOR_SUPPORT_BAY_CELLS + '-cell maximum span')
      continue
    }
    if (bays.some(bay => cellRectsOverlap(bay.cells, cells))) {
      problems.push('exterior support bay ' + id + ' overlaps another bay')
      continue
    }
    bays.push({ id, cells: [...cells] as CellRect })
  }
  return { bays, problems }
}

function isCellRect(value: unknown): value is CellRect {
  return Array.isArray(value) && value.length === 4
    && value.every(item => typeof item === 'number' && Number.isFinite(item))
}

function validCellRect(cells: CellRect, n: number): boolean {
  const [col0, row0, col1, row1] = cells
  return cells.every(Number.isInteger)
    && col0 >= 0 && row0 >= 0 && col1 < n && row1 < n
    && col0 <= col1 && row0 <= row1
}

function cellRectsOverlap(a: CellRect, b: CellRect): boolean {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]
}

function boundsKey(kind: ExteriorSupportMember['kind'], box: Box3): string {
  return kind + ':' + [...box.min, ...box.max].map(value => value.toFixed(5)).join(',')
}

export function exteriorSupportMembers(scene: Pick<ResolvedScene, 'n' | 'floorY' | 'exteriorSupportBays'>): ExteriorSupportMember[] {
  const members = new Map<string, ExteriorSupportMember>()
  const add = (id: string, kind: ExteriorSupportMember['kind'], box: Box3) => {
    const key = boundsKey(kind, box)
    if (!members.has(key)) members.set(key, { id, kind, box })
  }
  const supportTop = STOREY_HEIGHT - FLOOR_THICKNESS
  const beamBottom = supportTop - PERIMETER_BEAM_HEIGHT
  const sortedBays = [...scene.exteriorSupportBays].sort((a, b) => a.id.localeCompare(b.id))
  const posts = new Map<string, { col: number; row: number; groundCells: Array<{ col: number; row: number }> }>()

  for (const bay of sortedBays) {
    const [col0, row0, col1, row1] = bay.cells
    const x0 = col0 * CELL, x1 = (col1 + 1) * CELL
    const z0 = row0 * CELL, z1 = (row1 + 1) * CELL
    const corners = [
      { col: col0, row: row0, groundCol: col0, groundRow: row0 },
      { col: col1 + 1, row: row0, groundCol: col1, groundRow: row0 },
      { col: col0, row: row1 + 1, groundCol: col0, groundRow: row1 },
      { col: col1 + 1, row: row1 + 1, groundCol: col1, groundRow: row1 },
    ]
    for (const corner of corners) {
      const key = corner.col + ',' + corner.row
      const post = posts.get(key) ?? {
        col: corner.col,
        row: corner.row,
        groundCells: [],
      }
      const groundKey = corner.groundCol + ',' + corner.groundRow
      if (!post.groundCells.some(cell => cell.col + ',' + cell.row === groundKey)) {
        post.groundCells.push({ col: corner.groundCol, row: corner.groundRow })
      }
      posts.set(key, post)
    }

    const beamHalf = PERIMETER_BEAM_WIDTH / 2
    const beamX = (z: number, edge: 'north' | 'south') => add(
      'perimeter:' + bay.id + ':' + edge, 'perimeter-beam',
      { min: [x0, beamBottom, z - beamHalf], max: [x1, supportTop, z + beamHalf] },
    )
    const beamZ = (x: number, edge: 'west' | 'east') => add(
      'perimeter:' + bay.id + ':' + edge, 'perimeter-beam',
      { min: [x - beamHalf, beamBottom, z0], max: [x + beamHalf, supportTop, z1] },
    )
    beamX(z0, 'north')
    beamX(z1, 'south')
    beamZ(x0, 'west')
    beamZ(x1, 'east')
    for (let row = row0 + 1; row <= row1; row++) {
      const z = row * CELL
      add('joist:' + bay.id + ':' + row, 'joist', {
        min: [x0, supportTop - JOIST_HEIGHT, z - JOIST_WIDTH / 2],
        max: [x1, supportTop, z + JOIST_WIDTH / 2],
      })
    }
  }

  const postHalf = POST_WIDTH / 2
  const postTop = beamBottom + 0.002
  const addPost = (
    post: { col: number; row: number },
    signs: Array<{ x: number; z: number; cell: { col: number; row: number } }>,
    idSuffix = '',
  ) => {
    let insetX = 0, insetZ = 0
    if (signs.length === 1) {
      insetX = signs[0].x * postHalf
      insetZ = signs[0].z * postHalf
    } else if (signs.length === 2 && signs[0].x === signs[1].x) {
      insetX = signs[0].x * postHalf
    } else if (signs.length === 2 && signs[0].z === signs[1].z) {
      insetZ = signs[0].z * postHalf
    } else if (signs.length === 3) {
      const present = new Set(signs.map(sign => sign.x + ',' + sign.z))
      const missing = [
        { x: -1, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }, { x: 1, z: 1 },
      ].find(sign => !present.has(sign.x + ',' + sign.z))!
      insetX = -missing.x * postHalf
      insetZ = -missing.z * postHalf
    }
    const anchor = signs[0].cell
    const x = post.col * CELL + insetX, z = post.row * CELL + insetZ
    add('column:' + post.col + ',' + post.row + idSuffix, 'column', {
      min: [x - postHalf, scene.floorY[anchor.row][anchor.col], z - postHalf],
      max: [x + postHalf, postTop, z + postHalf],
    })
  }
  for (const post of posts.values()) {
    const cells = [...post.groundCells].sort((a, b) => a.row - b.row || a.col - b.col)
    const signs = cells.map(cell => ({
      x: cell.col < post.col ? -1 : 1,
      z: cell.row < post.row ? -1 : 1,
      cell,
    }))
    if (signs.length === 2 && signs[0].x !== signs[1].x && signs[0].z !== signs[1].z) {
      // Diagonal bays share only a grid vertex. Keep their corner columns
      // separate so both frames have a direct load path into their own ground.
      for (const sign of signs) {
        addPost(post, [sign], ':' + sign.cell.col + ',' + sign.cell.row)
      }
      continue
    }
    addPost(post, signs)
  }
  return [...members.values()].sort((a, b) => a.id.localeCompare(b.id))
}
