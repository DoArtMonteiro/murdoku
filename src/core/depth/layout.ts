// ============================================================================
// Houses for the depth generator.
//
// A depth case must look exactly like a shipped one, so the rooms, their names,
// the furniture and its rotation come from generate.ts's OWN layout and
// furnishing code (buildRooms / buildTwoFloorRooms / placeFurniture). Those
// functions are not exported, and this round may not edit generate.ts, so the
// layout is obtained by asking generatePuzzle for a small throwaway case and
// keeping its house: rooms, roomOf, roomOfByFloor, furniture. The throwaway
// cast and clues are discarded; the depth generator seats its own people.
//
// generatePuzzle reads its board size, room count and floors from the exported
// DIFFICULTY_CONFIG object at call time, so a synchronous, try/finally-guarded
// override of one tier gives any board shape without touching generate.ts.
// PROPOSED REPLACEMENT (see the sweep report): export buildRooms,
// buildTwoFloorRooms and placeFurniture from generate.ts and delete this hack.
// ============================================================================

import type { Furniture, GridSize, Room } from '../types'
import { DIFFICULTY_CONFIG, generatePuzzle, reseed } from '../generate'

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
  furniture: Furniture[]
}

/**
 * Build a house from a seed. Returns null when generatePuzzle could not give a
 * house of the requested shape (e.g. it degraded a two-floor request to one
 * storey), so the caller can try the next seed.
 */
export function buildLayout(spec: LayoutSpec, seed: number): Layout | null {
  const tier = 'Expert' as const
  const saved = DIFFICULTY_CONFIG[tier]
  let probe
  try {
    // Two-floor generation needs a victim, a murderer and somebody on the other
    // storey, hence three throwaway people; one floor needs two.
    DIFFICULTY_CONFIG[tier] = {
      size: spec.size,
      people: spec.floors === 2 ? 3 : 2,
      maxDirectness: 6,
      minDirectness: 0,
      rooms: spec.rooms,
      ...(spec.floors === 2 ? { floors: 2 } : {}),
    }
    reseed(seed)
    probe = generatePuzzle(tier, 'depth-layout', 'Depth Layout', spec.floors === 1)
  } catch {
    return null
  } finally {
    DIFFICULTY_CONFIG[tier] = saved
  }
  if (spec.floors === 2 && (probe.floors ?? 1) !== 2) return null
  return {
    size: probe.size,
    floors: spec.floors,
    rooms: probe.rooms,
    roomOf: probe.roomOf,
    ...(probe.roomOfByFloor ? { roomOfByFloor: probe.roomOfByFloor } : {}),
    furniture: probe.furniture,
  }
}
