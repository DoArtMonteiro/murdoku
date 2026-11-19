// "Why?": three levels, all driven by deduceChain (which never reads the
// solution) and worded from clue and chain data.
//   1. whom to look at
//   2. which statements to light, which squares were removed and why
//   3. the placement itself
import type { Cell, Puzzle } from '../core/types'
import { deduceChain } from '../reference/story/deduce'
import type { DeductionChain, DeductionStep } from '../reference/story/deduce'
import { cellName, firstName, sameCell } from './cells'
import type { Placement } from './cells'
import { cellList, cluePhrase, joinList, laneOf } from './phrase'

const chains = new WeakMap<Puzzle, DeductionChain>()
export function chainOf(p: Puzzle): DeductionChain {
  let c = chains.get(p)
  if (!c) { c = deduceChain(p); chains.set(p, c) }
  return c
}

/** First chain step whose person is not correctly placed. A wrong placement counts as unplaced. */
export function nextStep(p: Puzzle, place: Placement): DeductionStep | null {
  return chainOf(p).steps.find(s => !place[s.person] || !sameCell(place[s.person], s.cell)) ?? null
}

export type HintLevel = 1 | 2 | 3

export interface Hint {
  level: HintLevel
  person: string
  cell: Cell
  text: string
  /** Removed squares and why, level 2 and up. */
  lines: string[]
  /** puzzle.clues indices of the statements to light with the lens (level 2 and up). */
  lit: number[]
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Why each removed square left the list, grouped so it reads as a few lines. */
export function removalLines(p: Puzzle, step: DeductionStep, chain: DeductionChain): string[] {
  const who = (id: string) => firstName(p, id)
  const name = who(step.person)
  const lanes = new Map<string, string>()
  const pairs = new Map<string, Cell[]>()
  for (const r of step.removed) {
    if (r.reason === 'lane') {
      const holder = chain.placement[r.by]
      if (holder) lanes.set(`${laneOf(r.cell, holder)}|${r.by}`, `${cap(laneOf(r.cell, holder))} is ${who(r.by)}'s`)
    } else {
      pairs.set(r.by, [...(pairs.get(r.by) ?? []), r.cell])
    }
  }
  const out = [...lanes.values()].map(l => `${l}.`)
  for (const [by, cells] of pairs) out.push(`If ${name} stood in ${cellList(p, cells)}, ${who(by)} would have nowhere left.`)
  return out
}

export function hintFor(p: Puzzle, place: Placement, level: HintLevel): Hint | null {
  const step = nextStep(p, place)
  if (!step) return null
  const chain = chainOf(p)
  const name = firstName(p, step.person)
  const base = { level, person: step.person, cell: step.cell, lines: [] as string[], lit: [] as number[] }
  if (level === 1) {
    return { ...base, text: `Look at ${name}. What is already settled leaves ${name} a single square.` }
  }
  const lit = step.clues.map(ct => p.clues.indexOf(ct)).filter(i => i >= 0)
  const own = step.ownCandidates.length
  const phrases = joinList(step.clues.map(ct => cluePhrase(p, ct.clue)).filter(Boolean))
  const head = `${name}: ${phrases || 'no statement of their own'}. That allows ${own} square${own === 1 ? '' : 's'}.`
  const lines = step.via === 'trial'
    ? ['Nothing forces this one outright. It is the square that survives when the rest is played out.']
    : removalLines(p, step, chain)
  if (level === 2) return { ...base, text: head, lines, lit }
  return { ...base, text: `${name} belongs in ${cellName(p, step.cell)}.`, lines, lit }
}
