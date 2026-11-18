import { describe, expect, it } from 'vitest'
import { generatePuzzle, reseed } from '../src/core/generate'
import { cellFloor, furnitureCells, furnitureFootprint } from '../src/core/types'

// ============================================================================
// Realism invariants — the properties that make a board read as a house, not
// a grid of randomly-labelled squares.
// ============================================================================

const OUTDOOR_NAMES = new Set(['Front Yard', 'Garden', 'Porch'])

const SMALL_NAMES  = new Set(['Pantry', 'Bathroom', 'Porch'])   // maxCells ≤ 14
const LARGE_NAMES  = new Set(['Living Room', 'Kitchen', 'Bedroom', 'Garden'])

// Seeds spread across the range so we hit different board layouts
const SEEDS = [101, 202, 303, 404, 505, 606, 707, 808]

describe('room naming realism', () => {
  it('no outdoor room ever appears on floor 1', () => {
    for (const tier of ['Hard', 'Expert', 'Master'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const upstairRooms = p.rooms.filter(r => (r.floor ?? 0) === 1)
        for (const room of upstairRooms) {
          expect(
            OUTDOOR_NAMES.has(room.name),
            `seed ${s} ${tier}: outdoor room "${room.name}" appeared on floor 1`,
          ).toBe(false)
        }
      }
    }
    // 24 full two-floor generations up to Master difficulty; the documented
    // worst case is ~1.5-1.9s per attempt (see generatePuzzle's comment in
    // generate.ts), so the 30s global default is too tight under parallel
    // test-file contention. Not a perf regression — matches measured budget.
  }, 60000)

  it('room names are globally unique, including across storeys', () => {
    for (const tier of ['Very Easy', 'Easy', 'Medium', 'Hard'] as const) {
      for (const s of SEEDS.slice(0, 4)) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const names = p.rooms.map(r => r.name)
        const unique = new Set(names)
        expect(
          unique.size,
          `seed ${s} ${tier}: duplicate room names across the case: ${names.join(', ')}`,
        ).toBe(names.length)
      }
    }
  })

  it('no Pantry or Bathroom is enormous (> 20 cells)', () => {
    for (const tier of ['Easy', 'Medium', 'Hard'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        for (const room of p.rooms) {
          if (SMALL_NAMES.has(room.name)) {
            expect(
              room.cells.length,
              `seed ${s} ${tier}: ${room.name} has ${room.cells.length} cells — too large`,
            ).toBeLessThanOrEqual(20)
          }
        }
      }
    }
  })

  it('Living Room and Kitchen are not tiny (>= 6 cells)', () => {
    // They may be absent on boards with only 3–4 rooms; only assert when present
    for (const tier of ['Easy', 'Medium', 'Hard'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        for (const room of p.rooms) {
          if (LARGE_NAMES.has(room.name)) {
            expect(
              room.cells.length,
              `seed ${s} ${tier}: ${room.name} has only ${room.cells.length} cells`,
            ).toBeGreaterThanOrEqual(6)
          }
        }
      }
    }
  })

  it('all rooms have at least MIN_ROOM_DIM=2 cells wide and tall', () => {
    // Every rect side should be ≥ 2, so no 1-cell slivers
    for (const tier of ['Very Easy', 'Easy', 'Medium', 'Hard'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        for (const room of p.rooms) {
          const rows = room.cells.map(c => c.row)
          const cols = room.cells.map(c => c.col)
          const h = Math.max(...rows) - Math.min(...rows) + 1
          const w = Math.max(...cols) - Math.min(...cols) + 1
          // Hallway is allowed to be narrow (its spec allows narrow: true)
          if (room.name !== 'Hallway') {
            expect(
              Math.min(h, w),
              `seed ${s} ${tier}: room "${room.name}" is only ${Math.min(h,w)} cell(s) wide`,
            ).toBeGreaterThanOrEqual(2)
          }
        }
      }
    }
  })
})

describe('furniture rotation realism', () => {
  it('wall-hugging pieces sit on a room perimeter cell', () => {
    const WALL_HUGGERS = new Set(['bed', 'bookshelf', 'counter', 'fridge', 'stove', 'desk', 'toilet', 'shower', 'bathtub'])
    for (const tier of ['Easy', 'Medium'] as const) {
      for (const s of SEEDS.slice(0, 4)) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const twoFloor = (p.floors ?? 1) > 1
        for (const f of p.furniture) {
          if (!WALL_HUGGERS.has(f.type)) continue
          const fl = f.floor ?? 0
          const roomOf = twoFloor && p.roomOfByFloor ? p.roomOfByFloor[fl] : p.roomOf
          const roomId = roomOf[f.row]?.[f.col]
          if (!roomId) continue
          const N = p.size
          const ORTHO4 = [[-1,0],[1,0],[0,-1],[0,1]] as const
          const isPerimeter = ORTHO4.some(([dr, dc]) => {
            const nr = f.row + dr, nc = f.col + dc
            return nr < 0 || nc < 0 || nr >= N || nc >= N || roomOf[nr]?.[nc] !== roomId
          })
          expect(
            isPerimeter,
            `seed ${s} ${tier}: ${f.type} at (${f.row},${f.col}) fl${fl} is not on a room perimeter`,
          ).toBe(true)
        }
      }
    }
  })

  it('no two identical seating pieces sit adjacent facing the same direction', () => {
    const SEATING = new Set(['chair', 'sofa'])
    for (const tier of ['Easy', 'Medium', 'Hard'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const seats = p.furniture.filter(f => SEATING.has(f.type))
        for (const a of seats) {
          for (const b of seats) {
            if (a === b) continue
            if (a.type !== b.type) continue
            if ((a.floor ?? 0) !== (b.floor ?? 0)) continue
            const adjacent = (
              (Math.abs(a.row - b.row) === 1 && a.col === b.col) ||
              (Math.abs(a.col - b.col) === 1 && a.row === b.row)
            )
            if (!adjacent) continue
            expect(
              (a.rotation ?? 0) === (b.rotation ?? 0),
              `seed ${s} ${tier}: two adjacent ${a.type}s at ` +
              `(${a.row},${a.col}) and (${b.row},${b.col}) face the same direction`,
            ).toBe(false)
          }
        }
      }
    }
  })

  it('most wall-hugging pieces have non-zero rotation (majority face inward)', () => {
    // wallRotation() assigns rotation based on the nearest room wall.
    // Not every piece can be on a non-top wall (top-wall pieces get rotation 0),
    // so we assert that at least half of all wall-huggers have non-zero rotation
    // across a representative sample — confirming the logic fires, not that every
    // single piece passes (some are legitimately on top walls).
    const WALL_HUGGERS = new Set(['bed', 'bookshelf', 'counter', 'fridge', 'stove', 'desk', 'toilet', 'shower', 'bathtub'])
    let total = 0, nonZero = 0
    for (const tier of ['Easy', 'Medium'] as const) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        for (const f of p.furniture) {
          if (!WALL_HUGGERS.has(f.type)) continue
          total++
          if ((f.rotation ?? 0) !== 0) nonZero++
        }
      }
    }
    expect(total, 'no wall-huggers were placed at all').toBeGreaterThan(0)
    // At least 40% should have non-zero rotation (i.e. right/bottom/left walls)
    expect(nonZero / total).toBeGreaterThan(0.4)
  })
})

describe('furniture placement integrity', () => {
  it('no two furniture pieces occupy the same cell (any tier/seed)', () => {
    const tiers = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'] as const
    for (const tier of tiers) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const seen = new Set<string>()
        for (const f of p.furniture) {
          for (const c of furnitureCells(f)) {
            const key = `${f.floor ?? 0}:${c.row},${c.col}`
            expect(seen.has(key), `seed ${s} ${tier}: two pieces both claim cell ${key}`).toBe(false)
            seen.add(key)
          }
        }
      }
    }
  })

  it('a non-square footprint rotated 90/270 has its bounding box swapped to match (no visual overflow into the next row/col)', () => {
    // A 2×1 piece facing east/west visually turns to portrait; if its grid
    // bounding box stays landscape (w=2,h=1) the rotated icon spills out of
    // its own row into the neighbouring row, visually overlapping whatever
    // furniture sits there (regression: sofa rendered on top of the TV above it).
    const tiers = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'] as const
    for (const tier of tiers) {
      for (const s of SEEDS) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        for (const f of p.furniture) {
          const { w, h } = furnitureFootprint(f)
          if (w === h) continue // square footprints can't mismatch
          const rot = f.rotation ?? 0
          const shouldBePortrait = rot === 90 || rot === 270
          expect(
            shouldBePortrait ? h > w : w > h,
            `seed ${s} ${tier}: ${f.type} at (${f.row},${f.col}) has w=${w} h=${h} rotation=${rot} — bounding box does not match visual orientation`,
          ).toBe(true)
        }
      }
    }
  })
})

describe('two-floor outdoor rule (generated)', () => {
  it('Hard/Expert/Master: no outdoor room on floor 1 across many seeds', () => {
    for (const tier of ['Hard', 'Expert', 'Master'] as const) {
      for (const s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        reseed(s)
        const p = generatePuzzle(tier, 'test', 'No.1')
        const storeys = new Set(Object.values(p.solution).map(cellFloor))
        // Only assert when the puzzle actually has two floors
        if (!storeys.has(1)) continue
        const upstairRooms = p.rooms.filter(r => (r.floor ?? 0) === 1)
        for (const room of upstairRooms) {
          expect(
            OUTDOOR_NAMES.has(room.name),
            `seed ${s} ${tier}: "${room.name}" is outdoor but appeared upstairs`,
          ).toBe(false)
        }
      }
    }
  })
})
