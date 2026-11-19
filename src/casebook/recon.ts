// Reconstruction: the night replayed in deduction order. Computed from
// deduceChain, never authored positionally. Each frame is one person arriving
// at their square with a one-line reason built from clue and chain data.
import type { Cell, Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { findMurderer, roomIdAt } from '../core/engine'
import { firstName, floorWord } from './cells'
import { chainOf, removalLines } from './hint'
import { cluePhrase, joinList, laneOf } from './phrase'

export interface ReconFrame {
  person: string
  cell: Cell
  line: string
}

export interface Finale {
  murderer: string
  /** Everyone in the victim's room, victim included. */
  group: string[]
  victimCell: Cell
  line: string
}

export interface Recon { frames: ReconFrame[]; finale: Finale }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function buildRecon(p: Puzzle): Recon {
  const chain = chainOf(p)
  const who = (id: string) => firstName(p, id)
  const frames: ReconFrame[] = chain.steps.map(step => {
    const name = who(step.person)
    const phrases = joinList(step.clues.map(ct => cluePhrase(p, ct.clue)).filter(Boolean))
    const lead = phrases ? `${name}: ${phrases}.` : `${name}:`
    let tail: string
    if (step.via === 'own') {
      tail = 'That leaves one square.'
    } else if (step.via === 'trial') {
      tail = 'Nothing forces it outright. It is the square that survives.'
    } else if (step.via === 'lanes') {
      const lanes = step.removed.filter(r => r.reason === 'lane' && chain.placement[r.by])
        .map(r => `${laneOf(r.cell, chain.placement[r.by])} is ${who(r.by)}'s`)
      tail = `${cap(joinList([...new Set(lanes)]))}, so ${name} takes the last square.`
    } else {
      const by = [...new Set(step.removed.filter(r => r.reason === 'pair').map(r => who(r.by)))]
      const lanes = removalLines(p, step, chain).filter(l => l.includes(' is ')).slice(0, 2)
      tail = `${lanes.length ? `${lanes.join(' ')} ` : ''}Anywhere else, ${joinList(by)} would have nowhere left.`
    }
    return { person: step.person, cell: step.cell, line: `${lead} ${tail}` }
  })

  const murderer = findMurderer(p, chain.placement) ?? p.murdererId
  const victimCell = chain.placement[p.victimId] ?? p.solution[p.victimId]
  const room = roomIdAt(p, victimCell)
  const group = p.people.filter(x => roomIdAt(p, chain.placement[x.id] ?? p.solution[x.id]) === room).map(x => x.id)
  const roomName = p.rooms.find(r => r.id === room)?.name ?? 'the room'
  const fw = floorWord(p, cellFloor(victimCell))
  const line = `${who(p.victimId)} is in the ${roomName}${fw ? `, ${fw}` : ''}. ${who(murderer)} is the only suspect in there with ${who(p.victimId)}.`
  return { frames, finale: { murderer, group, victimCell, line } }
}
