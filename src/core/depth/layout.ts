// ============================================================================
// Houses for the depth generator.
//
// A depth case must look exactly like a shipped one, so rooms, names and
// furniture come from generate.ts's OWN layout and furnishing code
// (buildRooms / buildTwoFloorRooms / placeFurniture), called directly. Those
// functions draw from generate.ts's module-level generator, so each public
// function here reseeds it first: the same seed always gives the same house,
// whatever ran before.
//
// Order matters: rooms first, then the cast is seated (the murderer rule needs
// only the rooms), then the house is furnished around the cast exactly as
// generatePuzzle does (a piece under most people).
// ============================================================================

import type { Cell, Furniture, GridSize, Room } from '../types'
import { buildRooms, buildTwoFloorRooms, placeFurniture, reseed } from '../generate'

export interface LayoutSpec {
  size: GridSize
  floors: 1 | 2
  /** Rooms per floor. */
  rooms: number
}

export interface Layout {
  size: GridSize
  floors: 1 | 2
  rooms: Room[]
  roomOf: string[][]
  roomOfByFloor?: string[][][]
}

export function buildLayout(spec: LayoutSpec, seed: number): Layout {
  reseed(seed)
  if (spec.floors === 2) {
    const built = buildTwoFloorRooms(spec.size, spec.rooms)
    return { size: spec.size, floors: 2, rooms: built.rooms, roomOf: built.roomOf, roomOfByFloor: built.roomOfByFloor }
  }
  const built = buildRooms(spec.size, spec.rooms, 0)
  return { size: spec.size, floors: 1, rooms: built.rooms, roomOf: built.roomOf }
}

/** Furnish a seated house. `place` is the cast's solution. */
export function furnishLayout(layout: Layout, place: Record<string, Cell>, seed: number): Furniture[] {
  reseed(seed)
  if (layout.floors === 2 && layout.roomOfByFloor) {
    const shared = new Set<string>()
    const ground = placeFurniture(layout.rooms.filter(r => (r.floor ?? 0) === 0), layout.roomOfByFloor[0], place, 0, shared)
    const upstairs = placeFurniture(layout.rooms.filter(r => (r.floor ?? 0) === 1), layout.roomOfByFloor[1], place, 1, shared)
    return [...ground, ...upstairs]
  }
  return placeFurniture(layout.rooms, layout.roomOf, place)
}
