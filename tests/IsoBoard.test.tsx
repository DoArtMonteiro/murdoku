import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import IsoBoard from '../src/components/IsoBoard'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { AUTHORED_CASES } from '../src/data/cases'
import { resolveScene, turnedSize, DOOR_GAP } from '../src/scene3d/resolve'
import { validateScene } from '../src/scene3d/validate'
import { midnightDelivery } from '../src/scene3d/scenes/midnight-delivery'
import { sceneFor, hasAuthoredScene, AUTHORED_SCENES } from '../src/scene3d/scenes'
import { initCatalog, getPuzzleById } from '../src/core/catalog'
import { CELL, PARTITION_HEIGHT, WALL_HEIGHT, makeFrame, makeStoreyFrame } from '../src/scene3d/units'
import { MODEL_BOUNDS } from '../src/scene3d/catalog.generated'
import { metaOf } from '../src/scene3d/catalog'
import type { SceneSpec } from '../src/scene3d/schema'
import { emptyMarks, makePuzzle } from './fixtures'

const midnight = () => buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')

// Every authored scene must leave every playable cell un-hidden at standee
// height. Walls are drawn opaque and still count; free-standing solids and
// exterior support posts that cross a cell's sightline are drawn see-through by
// the renderer (src/scene3d/sightlines.ts is the single source for both), so the
// former per-scene "reviewed" lists of hidden cells are gone: the truth is empty.

const catalogueSightlineReview = new Set([
  'hard-11', 'hard-12',
  'expert-1', 'expert-2', 'expert-3', 'expert-4', 'expert-5',
  'expert-6', 'expert-7', 'expert-8', 'expert-9', 'expert-10',
  'master-1', 'master-2', 'master-3', 'master-4', 'master-5',
  'master-6', 'master-7', 'master-8',
])

// ============================================================================
// These tests encode INVARIANTS of the scene system, not the current numbers.
// A scene that moves the sofa must still pass; a scene that puts the sofa in
// a wall must fail. The golden master (Midnight Delivery) is checked against
// the full validator, and the validator itself is checked against deliberately
// broken specs so a regression in a rule cannot hide behind a green run.
// ============================================================================

describe('Midnight Delivery — puzzle semantics are untouched', () => {
  it('keeps the authored rooms, furniture, people and solution', () => {
    const spec = AUTHORED_CASES['very-easy-1']
    expect(spec.rooms.map(r => r.name)).toEqual(['Bedroom', 'Office', 'Hallway', 'Living Room', 'Kitchen'])
    expect(spec.furniture).toHaveLength(16)
    expect(midnight().solution).toEqual({
      p0: { row: 4, col: 1, floor: 0 },
      p1: { row: 5, col: 2, floor: 0 },
      p2: { row: 1, col: 0, floor: 0 },
      p3: { row: 0, col: 5, floor: 0 },
    })
  })
})

describe('Midnight Delivery — golden master passes every machine-checkable invariant', () => {
  const puzzle = midnight()
  const scene = resolveScene(midnightDelivery, puzzle.size)
  const report = validateScene(scene, puzzle)

  it('resolves without problems and validates with zero errors', () => {
    expect(scene.problems).toEqual([])
    expect(report.filter(v => v.severity === 'error')).toEqual([])
  })
  it('represents every logical furnishing with a visual object on its cells', () => {
    const logical = puzzle.furniture.map(f => `${f.type}@${f.row},${f.col}`)
    const visual = new Set(scene.objects.map(o => o.logic).filter(Boolean))
    for (const id of logical) expect(visual.has(id), id).toBe(true)
  })
  it('places every surface prop on a real parent surface at the measured height', () => {
    const props = scene.objects.filter(o => o.kind === 'furniture' && o.meta.support === 'surface')
    expect(props.length).toBeGreaterThan(0)
    for (const p of props) {
      const parent = scene.objects.find(o => o.id === p.parentId)!
      expect(parent, p.id).toBeDefined()
      const surface = parent.meta.surfaces![p.surface!]
      expect(p.position[1]).toBeCloseTo(parent.position[1] + surface.y, 6)
    }
  })
  it('keeps every floor object grounded at y = 0', () => {
    for (const o of scene.objects.filter(o => o.kind === 'furniture' && !o.parentId)) expect(o.box.min[1], o.id).toBe(0)
  })
  it('builds a closed exterior: two full back walls, two cut front walls, no gaps', () => {
    const back = scene.walls.filter(w => w.kind === 'shell-back')
    const front = scene.walls.filter(w => w.kind === 'shell-front')
    expect(back.map(w => w.id).sort()).toEqual(['shell-north', 'shell-west'])
    expect(front.map(w => w.id).sort()).toEqual(['shell-east', 'shell-south'])
    for (const w of back) expect(w.height).toBe(WALL_HEIGHT)
    // every shell wall's solid pieces plus openings tile its full length
    for (const w of scene.walls.filter(w => w.kind !== 'partition')) {
      const axis = w.axis === 'x' ? 0 : 2
      const covered = [...w.pieces.map(p => [p.min[axis], p.max[axis]]), ...w.openings.map(o => [o.box.min[axis], o.box.max[axis]])]
        .sort((a, b) => a[0] - b[0])
      let cursor = -w.thickness / 2
      for (const [a, b] of covered) { expect(a).toBeLessThanOrEqual(cursor + 1e-6); cursor = Math.max(cursor, b) }
      expect(cursor).toBeGreaterThanOrEqual(scene.side + w.thickness / 2 - 1e-6)
    }
  })
  it('cuts partitions down so no cell is hidden at standee height', () => {
    for (const w of scene.walls.filter(w => w.kind === 'partition')) expect(w.height).toBeLessThanOrEqual(PARTITION_HEIGHT)
    expect(report.filter(v => v.code === 'cell-hidden')).toEqual([])
  })
  it('gives every door opening a door frame model standing in the gap', () => {
    for (const w of scene.walls.filter(w => w.kind === 'partition')) for (const op of w.openings) {
      if (op.kind !== 'door') continue
      const frame = scene.objects.find(o => o.kind === 'door' && Math.abs(o.position[0] - op.centre[0]) < 1e-6 && Math.abs(o.position[2] - op.centre[1]) < 1e-6)
      expect(frame, `${w.id} door`).toBeDefined()
      expect(op.width).toBeCloseTo(DOOR_GAP, 6)
    }
  })
  it('anchors furniture placed against a wall exactly on the wall face', () => {
    const bed = scene.objects.find(o => o.id === 'bed')!
    const north = scene.walls.find(w => w.id === 'shell-north')!
    expect(bed.box.min[2]).toBeCloseTo(north.thickness / 2, 6)
    const sofa = scene.objects.find(o => o.id === 'sofa')!
    expect(sofa.box.min[0]).toBeCloseTo(north.thickness / 2, 6)
    expect(sofa.facing).toBe('E')
  })
})

describe('validator catches the historical failure classes', () => {
  const puzzle = midnight()
  const base = (): SceneSpec => JSON.parse(JSON.stringify(midnightDelivery))
  const codes = (spec: SceneSpec) => validateScene(resolveScene(spec, puzzle.size), puzzle).filter(v => v.severity === 'error').map(v => v.code)

  it('a bed pushed into a wall → wall-penetration', () => {
    const spec = base()
    spec.furniture.find(f => f.id === 'bed')!.against = { wall: 'north', at: 0.9, gap: -0.2 }
    expect(codes(spec)).toContain('wall-penetration')
  })
  it('a microwave on the floor → unsupported-prop', () => {
    const spec = base()
    const mw = spec.furniture.find(f => f.id === 'microwave')!
    delete mw.on; mw.at = [4.5, 4.5]
    expect(codes(spec)).toContain('unsupported-prop')
  })
  it('a TV on a bed (no surface) → unresolved', () => {
    const spec = base()
    spec.furniture.find(f => f.id === 'tv')!.on = { parent: 'bed' }
    expect(codes(spec)).toContain('unresolved')
  })
  it('a chair in a doorway → door-blocked', () => {
    const spec = base()
    spec.furniture.push({ id: 'blocker', model: 'chair', at: [2.3, 2.0] })
    expect(codes(spec)).toContain('door-blocked')
  })
  it('a partition ending in open floor without a declaration → wall-free-end', () => {
    const spec = base()
    spec.walls.push({ id: 'stub', from: [1, 4], to: [2, 4] })
    expect(codes(spec)).toContain('wall-free-end')
  })
  it('a room walled off from the entry → room-unreachable', () => {
    const spec = base()
    spec.walls.find(w => w.id === 'bedroom-south')!.openings = []
    expect(codes(spec)).toContain('room-unreachable')
  })
  it('a tall bookcase facing the back wall → tall-back-exposed', () => {
    const spec = base()
    spec.furniture.push({ id: 'tall', model: 'bookcaseOpen', at: [1.5, 4.5], facing: 'N' })
    expect(codes(spec)).toContain('tall-back-exposed')
  })
  it('furniture drifting off its logical cells → logic-displaced', () => {
    const spec = base()
    spec.furniture.find(f => f.id === 'plant')!.at = [5.5, 5.5]
    expect(codes(spec)).toContain('logic-displaced')
  })
  it('a logical furnishing with no visual → logic-missing', () => {
    const spec = base()
    spec.furniture = spec.furniture.filter(f => f.id !== 'plant')
    expect(codes(spec)).toContain('logic-missing')
  })
  it('two sofas in the same place → furniture-overlap', () => {
    const spec = base()
    spec.furniture.push({ id: 'sofa2', model: 'loungeSofa', against: { wall: 'west', at: 4.1 } })
    expect(codes(spec)).toContain('furniture-overlap')
  })
})

describe('asset catalogue', () => {
  it('measures every Kenney model from geometry; floor tile is the unit, wall height is the shell height', () => {
    const names = Object.keys(MODEL_BOUNDS)
    expect(names.length).toBeGreaterThanOrEqual(140) // Furniture Kit (140) + vendored Nature Kit subset
    for (const n of names) {
      const b = MODEL_BOUNDS[n as keyof typeof MODEL_BOUNDS]
      expect(b.size.every(v => v > 0), n).toBe(true)
    }
    expect(MODEL_BOUNDS.floorFull.size[0]).toBe(1)
    expect(MODEL_BOUNDS.wall.size[1]).toBe(WALL_HEIGHT)
  })
  it('turns footprints with facing', () => {
    const [w, , d] = MODEL_BOUNDS.loungeSofa.size
    expect(turnedSize('loungeSofa', 'S')).toEqual([w, d])
    expect(turnedSize('loungeSofa', 'E')).toEqual([d, w])
  })
  it('marks surface props and their required parents', () => {
    expect(metaOf('kitchenMicrowave').support).toBe('surface')
    expect(metaOf('kitchenMicrowave').requires).toContain('counter')
    expect(metaOf('kitchenCabinet').surfaces?.top.role).toBe('counter')
    expect(metaOf('kitchenFridge').tall).toBe(true)
    expect(metaOf('chairDesk').tall).toBe(false)
  })
})

describe('projection', () => {
  it('maps the grid onto two screen diagonals: col → right, row → left, both down', () => {
    const f = makeFrame(6)
    const [x0, y0] = f.project(f.cellCentre(0, 0))
    const [x1, y1] = f.project(f.cellCentre(0, 1))
    const [x2, y2] = f.project(f.cellCentre(1, 0))
    expect(x1).toBeGreaterThan(x0); expect(y1).toBeGreaterThan(y0)
    expect(x2).toBeLessThan(x0); expect(y2).toBeGreaterThan(y0)
  })
  it('inverts on the floor plane', () => {
    const f = makeFrame(6)
    for (const [r, c] of [[0, 0], [2, 5], [5, 1]]) {
      const p = f.cellCentre(r, c)
      const [x, z] = f.unprojectFloor(...f.project(p))
      expect(x).toBeCloseTo(p[0], 6); expect(z).toBeCloseTo(p[2], 6)
    }
  })
  it('is stable for every supported board size', () => {
    for (const n of [4, 5, 6, 7, 8, 9, 10]) {
      const f = makeFrame(n)
      expect(f.width).toBeGreaterThan(0); expect(f.height).toBeGreaterThan(0)
      expect(f.width / f.height).toBeGreaterThan(1)
    }
  })

  it('reserves more vertical space for an exploded overview than a true-height ghost', () => {
    const single = makeFrame(8)
    const ghost = makeStoreyFrame(8, 0, 'ghost')
    const exploded = makeStoreyFrame(8, 0, 'exploded')

    expect(ghost.height).toBeGreaterThan(single.height)
    expect(exploded.height).toBeGreaterThan(ghost.height)
  })
})

describe('every authored scene passes the validator against its real puzzle', () => {
  initCatalog()
  for (const [key, spec] of Object.entries(AUTHORED_SCENES)) {
    it(key, () => {
      const puzzle = getPuzzleById(spec.puzzleId)
      expect(puzzle, `puzzle ${spec.puzzleId}`).toBeDefined()
      const resolved = resolveScene(spec, puzzle!.size)
      const floor = (spec.floor ?? 0) as 0 | 1
      const views = (puzzle!.floors ?? 1) > 1
        ? (catalogueSightlineReview.has(spec.puzzleId)
          ? (['normal', 'ghost', 'exploded'] as const)
          : (['ghost', 'exploded'] as const)).map(view => ({
            view,
            scene: view === 'normal'
              ? resolved
              : { ...resolved, frame: makeStoreyFrame(puzzle!.size, floor, view) },
          }))
        : [{ view: 'single-floor' as const, scene: resolved }]
      for (const { view, scene } of views) {
        const report = validateScene(scene, puzzle!)
        const errors = report.filter(v => v.severity === 'error').map(v => v.message)
        const context = `${key} floor ${floor} view ${view}`
        expect(errors, `${context}: ${errors.join(' | ')}`).toEqual([])
        const hidden = report.filter(v => v.code === 'cell-hidden').map(v => `${v.subject}|${v.message}`)
        expect(hidden, `${context}: ${hidden.join(' | ')}`).toEqual([])
      }
    })
  }
})

describe('scene registry and fallback', () => {
  it('serves authored scenes for produced cases and a valid fallback for unknown cases', () => {
    for (const puzzleId of [
      'very-easy-1',
      'very-easy-3',
      'very-easy-4',
      'very-easy-5',
      'very-easy-6',
      'very-easy-7',
      'very-easy-8',
      'easy-2',
      'easy-3',
      'easy-4',
      'easy-5',
      'easy-6',
      'easy-7',
      'easy-8',
      'easy-9',
      'easy-10',
      'medium-1',
      'medium-2',
      'medium-3',
      'medium-4',
      'medium-5',
      'medium-6',
      'medium-7',
      'medium-8',
      'medium-9',
      'medium-10',
      'medium-11',
      'medium-12',
      'hard-2',
      'hard-3',
      'hard-4',
    ]) {
      expect(hasAuthoredScene(puzzleId), puzzleId).toBe(true)
    }
    for (const puzzleId of ['hard-2', 'hard-3', 'hard-4']) {
      expect(hasAuthoredScene(puzzleId, 1), `${puzzleId} upper storey`).toBe(true)
    }
    const other = { ...buildAuthoredPuzzle(AUTHORED_CASES['very-easy-2'], 'Case No. II'), id: 'un-authored-case' }
    expect(hasAuthoredScene(other.id)).toBe(false)
    const spec = sceneFor(other, 0)
    expect(spec.walls).toEqual([])
    const scene = resolveScene(spec, other.size)
    const errors = validateScene(scene, other).filter(v => v.severity === 'error')
    expect(errors.map(v => v.code)).not.toContain('logic-missing')
    expect(errors.map(v => v.code)).not.toContain('unresolved')
  })
})

describe('IsoBoard component', () => {
  function renderBoard(extra: Partial<Parameters<typeof IsoBoard>[0]> = {}) {
    const puzzle = midnight()
    const onCellClick = vi.fn()
    const utils = render(
      <IsoBoard puzzle={puzzle} marks={emptyMarks(6)} conflicts={new Set()} onCellClick={onCellClick} {...extra} />,
    )
    return { ...utils, onCellClick, puzzle }
  }
  it('renders a canvas plus a full DOM hit grid with room names, and survives a jsdom without WebGL', () => {
    const { container } = renderBoard()
    expect(container.querySelector('[data-scene-canvas]')).toBeTruthy()
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(36)
    expect(container.querySelector('[data-cell="0-0"]')).toHaveAttribute('aria-label', 'Row 1, column 1, Bedroom')
    expect(container.querySelector('[data-iso-board]')).toHaveAttribute('data-scene-authored', 'true')
  })
  it('routes a cell click to the logical coordinates', () => {
    const { container, onCellClick } = renderBoard()
    fireEvent.click(container.querySelector('[data-cell="4-1"]')!)
    expect(onCellClick).toHaveBeenCalledWith(4, 1)
  })
  it('shows placement cues only while a suspect is armed', () => {
    const { container, rerender, puzzle } = renderBoard()
    expect(container.querySelectorAll('[data-placement-cue]')).toHaveLength(0)
    rerender(<IsoBoard puzzle={puzzle} marks={emptyMarks(6)} conflicts={new Set()} onCellClick={vi.fn()} armedPerson="p0" />)
    expect(container.querySelectorAll('[data-placement-cue]').length).toBe(36)
  })
  it('stands a suspect standee on a placed cell', () => {
    const puzzle = midnight()
    const marks = emptyMarks(6)
    marks[4][1] = { kind: 'person', person: 'p0' }
    const { container } = render(<IsoBoard puzzle={puzzle} marks={marks} conflicts={new Set()} onCellClick={vi.fn()} />)
    expect(container.querySelectorAll('[data-scene-object="suspect"]')).toHaveLength(1)
    expect(container.querySelector('[data-cell-token="4-1"]')).toBeTruthy()
  })
  it('renders an un-authored storey with the fallback scene and a full hit grid', () => {
    const puzzle = makePuzzle({ id: 'x', size: 6, rooms: [{ id: 'h', name: 'House', hue: 1, cells: [] }], roomOf: Array.from({ length: 6 }, () => Array(6).fill('h')), furniture: [] })
    const { container } = render(<IsoBoard puzzle={puzzle} marks={emptyMarks(6)} conflicts={new Set()} onCellClick={vi.fn()} floor={1} />)
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(36)
    expect(container.querySelector('[data-iso-board]')).toHaveAttribute('data-scene-authored', 'false')
  })
  it('shares one CELL constant between the DOM overlay and the renderer', () => {
    expect(CELL).toBeGreaterThan(0.5); expect(CELL).toBeLessThanOrEqual(1)
  })

  it('shows the other storey as non-interactive context in ghost and exploded modes', () => {
    initCatalog()
    const puzzle = getPuzzleById('hard-1')!
    const { container, rerender } = render(
      <IsoBoard
        puzzle={puzzle}
        marks={emptyMarks(8)}
        conflicts={new Set()}
        onCellClick={vi.fn()}
        floor={0}
        storeyView="ghost"
      />,
    )
    const board = container.querySelector('[data-iso-board]')!
    expect(board).toHaveAttribute('data-storey-view', 'ghost')
    expect(board).toHaveAttribute('data-companion-floor', '1')
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(64)

    rerender(
      <IsoBoard
        puzzle={puzzle}
        marks={emptyMarks(8)}
        conflicts={new Set()}
        onCellClick={vi.fn()}
        floor={0}
        storeyView="exploded"
      />,
    )
    expect(container.querySelector('[data-iso-board]')).toHaveAttribute('data-storey-view', 'exploded')
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(64)
  })
})
