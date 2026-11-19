// ============================================================================
// The clue pool for a seated house: every clue that is TRUE of the stored
// solution and is allowed in a depth case.
//
// Allowed kinds (the ones the engine already evaluates, no new semantics):
//   room, notRoom, onFurniture, besideFurniture, onlyOnFurniture, row, col, edge,
//   corner, floor, above/below (room-targeted), direction (with and without
//   steps, row/column index only), sameRoomAs, notSameRoomAs.
// Not used: besidePerson (the one-person-per-row/column rule makes "orthogonally
// adjacent" a near-certain pin and the original generator's reason for never
// emitting relational clues), besideAny, above/below targeting a person (that
// needs the same row AND column, which the lane rule forbids).
// ============================================================================

import type { Clue, Puzzle } from '../types'
import { candidateClues } from '../generate'
import { roomIdAt } from '../engine'
import { buildCtx, unaryMask } from './model'

export const DEPTH_KINDS: ReadonlySet<Clue['kind']> = new Set<Clue['kind']>([
  'room', 'notRoom', 'onFurniture', 'besideFurniture', 'onlyOnFurniture', 'row', 'col', 'edge', 'corner',
  'floor', 'above', 'below', 'direction', 'sameRoomAs', 'notSameRoomAs', 'victim',
])

/** Every direction clue that is true between two people, exact-step and "somewhere". */
export function directionClues(p: Puzzle): Clue[] {
  const out: Clue[] = []
  for (const a of p.people) {
    for (const b of p.people) {
      if (a.id === b.id) continue
      const ca = p.solution[a.id], cb = p.solution[b.id]
      const dr = cb.row - ca.row
      const dc = cb.col - ca.col
      if (dr > 0) {
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'N' })
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'N', steps: dr })
      } else if (dr < 0) {
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'S' })
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'S', steps: -dr })
      }
      if (dc > 0) {
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'W' })
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'W', steps: dc })
      } else if (dc < 0) {
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'E' })
        out.push({ kind: 'direction', person: a.id, other: b.id, dir: 'E', steps: -dc })
      }
    }
  }
  return out
}

/**
 * All usable true clues. Murderer-leak filtering at the clue level:
 *  - nothing on a suspect's card names the victim's room (room / notRoom /
 *    above / below): "In the Study" next to a victim in the Study is the answer,
 *    and "Never set foot in the Study" on four of five suspects is the answer by
 *    elimination;
 *  - no unary clue may, by itself, confine a suspect to the victim's room
 *    ("On the only sofa" when the only sofa is in that room);
 *  - sameRoomAs / notSameRoomAs never involve the victim (candidateClues
 *    already excludes them; directionClues involving the victim are harmless
 *    because they say nothing about rooms).
 */
export function buildPool(p: Puzzle): Clue[] {
  const ctx = buildCtx(p)
  const victimCell = p.solution[p.victimId]
  const victimRoomId = roomIdAt(p, victimCell)
  const victimIdx = (victimCell.floor ?? 0) * ctx.N * ctx.N + victimCell.row * ctx.N + victimCell.col
  const victimRoom = ctx.roomOfCell[victimIdx]

  const raw = [...candidateClues(p), ...directionClues(p)].filter(c => DEPTH_KINDS.has(c.kind))
  return raw.filter(c => {
    if (c.person === p.victimId) return true
    if ((c.kind === 'room' || c.kind === 'notRoom') && c.roomId === victimRoomId) return false
    if ((c.kind === 'above' || c.kind === 'below') && c.targetKind === 'room' && c.target === victimRoomId) return false
    if (c.kind === 'sameRoomAs' || c.kind === 'notSameRoomAs') return c.other !== p.victimId
    if (c.kind === 'direction') return true
    // A unary clue whose every legal square lies in the victim's room.
    const mask = unaryMask(ctx, c)
    let legal = 0
    let inVictimRoom = 0
    for (let i = 0; i < ctx.NC; i++) {
      if (!mask[i]) continue
      legal++
      if (ctx.roomOfCell[i] === victimRoom) inVictimRoom++
    }
    return !(legal > 0 && legal === inVictimRoom)
  })
}
