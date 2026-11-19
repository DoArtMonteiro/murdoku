// The alibi roll-call: the reveal. Everyone told the truth, so nobody is caught
// lying. The murderer is the one whose true account leaves them alone with the
// victim, and the way to show that is to clear everyone else by theirs.
//
// Pure. Built from the SOLUTION and the room data only (never the player's plan),
// and every fact in a line is derivable from them: the room each person stood in,
// the floor, and whether that room shares a wall with the victim's room.
import type { Cell, Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { roomIdAt } from '../core/engine'
import { firstName, floorsOf } from './cells'

/** How far a cleared suspect stood from the victim. The roll-call runs far to near, so it tightens. */
export type Distance = 'otherFloor' | 'sameFloor' | 'wallAway'

export interface Cleared {
  person: string
  cell: Cell
  distance: Distance
  /** "Yuki: in the Hallway, a wall away from the Study. Cleared." */
  line: string
}

export interface RollCall {
  victim: { person: string; cell: Cell; line: string }
  /** Suspects cleared by their alibi, in the order they are read out. */
  cleared: Cleared[]
  /** The one left in the victim's room with the victim. */
  last: { person: string; cell: Cell; line: string }
}

const RANK: Record<Distance, number> = { otherFloor: 0, sameFloor: 1, wallAway: 2 }

const roomName = (p: Puzzle, id: string): string => p.rooms.find(r => r.id === id)?.name ?? ''
const inRoom = (name: string): string => (name ? `in the ${name}` : 'elsewhere')

/** True only when two different rooms of one floor have an orthogonally adjacent pair of cells. */
export function roomsShareWall(p: Puzzle, a: string, b: string, floor: number): boolean {
  if (!a || !b || a === b) return false
  const at = (r: number, c: number): string => roomIdAt(p, { row: r, col: c, floor })
  for (let r = 0; r < p.size; r++) {
    for (let c = 0; c < p.size; c++) {
      const here = at(r, c)
      if (here !== a && here !== b) continue
      const other = here === a ? b : a
      if (at(r + 1, c) === other || at(r, c + 1) === other) return true
    }
  }
  return false
}

/** "A wall away" needs the same floor AND a shared wall; a cell on the other floor never counts. */
export function distanceFrom(p: Puzzle, victimCell: Cell, cell: Cell): Distance {
  if (cellFloor(cell) !== cellFloor(victimCell)) return 'otherFloor'
  return roomsShareWall(p, roomIdAt(p, victimCell), roomIdAt(p, cell), cellFloor(cell)) ? 'wallAway' : 'sameFloor'
}

function alibiLine(p: Puzzle, name: string, victimCell: Cell, cell: Cell, distance: Distance): string {
  const here = inRoom(roomName(p, roomIdAt(p, cell)))
  if (distance === 'otherFloor') {
    const word = cellFloor(cell) > cellFloor(victimCell) ? 'upstairs' : 'downstairs'
    return `${name}: ${word}, ${here}. Cleared.`
  }
  if (distance === 'wallAway') return `${name}: ${here}, a wall away from the ${roomName(p, roomIdAt(p, victimCell))}. Cleared.`
  return `${name}: ${here}. Cleared.`
}

export function buildRollCall(p: Puzzle): RollCall {
  const victimCell = p.solution[p.victimId]
  const victimRoom = roomName(p, roomIdAt(p, victimCell))
  const vName = firstName(p, p.victimId)
  const where = floorsOf(p) > 1 ? `${inRoom(victimRoom)}, ${cellFloor(victimCell) === 0 ? 'on the ground floor' : 'upstairs'}` : inRoom(victimRoom)

  const suspects = p.people.filter(x => x.id !== p.victimId && x.id !== p.murdererId)
  const cleared: Cleared[] = suspects
    .map((x, order) => {
      const cell = p.solution[x.id]
      const distance = distanceFrom(p, victimCell, cell)
      return { order, entry: { person: x.id, cell, distance, line: alibiLine(p, firstName(p, x.id), victimCell, cell, distance) } }
    })
    .sort((a, b) => RANK[a.entry.distance] - RANK[b.entry.distance] || a.order - b.order)
    .map(x => x.entry)

  const mCell = p.solution[p.murdererId]
  return {
    victim: { person: p.victimId, cell: victimCell, line: `${vName} was found ${where}.` },
    cleared,
    last: {
      person: p.murdererId, cell: mCell,
      line: `${firstName(p, p.murdererId)}: ${inRoom(roomName(p, roomIdAt(p, mCell)))}, with ${vName} and no one else. No alibi.`,
    },
  }
}

/** The closing line when no story is authored: derived from the same facts, and true to the premise. */
export function computedClosing(p: Puzzle): string {
  return `Everyone told the truth. Only ${firstName(p, p.murdererId)}'s account leaves them alone with ${firstName(p, p.victimId)}.`
}

/**
 * A wrong accusation says this and nothing else. It takes a name and nothing more, so it cannot carry a
 * position, a room or a floor by construction.
 */
export const wrongAccusationLine = (name: string): string => `${name} has an alibi.`
