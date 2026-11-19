// The walk-through as pure state. The beat is DERIVED from the game state (and one
// monotonic fact: the contradiction has been seen), never stored, so undo, a hint, a
// stray tap or a different order of play can never leave the instruction behind.
//
// The reducer wraps the casebook's own: the rules are the real game's. Three small
// differences keep a newcomer from being punished or stuck:
//   - Greta's statements are lit for her once Lena and Tomas are placed (setup, not a move);
//   - a tap after a supposition places instead of only clearing the ghost;
//   - a wrong name costs nothing, and no name is judged before the plan is finished.
import type { Cell, Puzzle } from '../core/types'
import { firstName, sameCell } from '../casebook/cells'
import type { Placement } from '../casebook/cells'
import { initState, reduce } from '../casebook/game'
import type { Action, GameState } from '../casebook/game'
import { lensCells, statementsOf } from '../casebook/lens'
import { wrongAccusationLine } from '../casebook/rollcall'
import { emptySave } from '../casebook/save'
import { suppose } from '../casebook/suppose'
import { ROLE, WRONG_SQUARE } from './case0'

export interface TutState {
  game: GameState
  /** A supposition has shown the player a contradiction ("No square left for ..."). Never goes back to false. */
  seen: boolean
  /** Greta's statements have been lit for the supposing beat. Done once. */
  primed: boolean
}

export const BEATS = 8

export const initTut = (p: Puzzle): TutState => ({ game: initState(p, emptySave()), seen: false, primed: false })

const placedRight = (p: Puzzle, place: Placement, id: string): boolean => !!place[id] && sameCell(place[id], p.solution[id])

export const planDone = (p: Puzzle, place: Placement): boolean => p.people.every(x => placedRight(p, place, x.id))

export type BeatId = 'lens' | 'place' | 'measure' | 'second' | 'suppose' | 'third' | 'scene' | 'accuse'

/** What a beat wants the player to touch. The view turns each into a soft amber halo. */
export type Target =
  | { kind: 'cell'; cell: Cell }
  /** Position among the selected suspect's statements. */
  | { kind: 'chip'; position: number }
  /** Position on the portrait rail. */
  | { kind: 'who'; position: number }
  | { kind: 'bar'; button: 'accuse' }

export interface Beat {
  id: BeatId
  /** 1-based, of BEATS. */
  n: number
  text: string
  targets: Target[]
}

export const BEAT_TEXT: Record<BeatId, string> = {
  lens: 'Tap a statement — the lamp shows where it can be true.',
  place: 'Only one square fits. Tap it to place her.',
  measure: 'Now this statement can be measured — tap it.',
  second: 'Tap 2: the one lit square places Tomas.',
  suppose: 'Not sure? Hold a square to suppose.',
  third: 'Place the third suspect on the other lit square.',
  scene: 'Set the scene: tap where the victim was found.',
  accuse: 'Who was alone with the victim? Accuse.',
}
/** The second beat is two taps, and says so: first the other statement, then the square. */
export const SECOND_LIGHT_TEXT = 'Placing Tomas takes two taps. Tap 1: light his other statement.'
/** The supposing beat for a player who tapped instead of holding: the tap placed her. A hold on the same square still supposes. */
export const SUPPOSE_PLACED_TEXT = 'That placed Greta. Hold the same square to suppose instead.'

const N: Record<BeatId, number> = { lens: 1, place: 2, measure: 3, second: 4, suppose: 5, third: 6, scene: 7, accuse: 8 }

const railPosition = (p: Puzzle, id: string): number => p.people.findIndex(x => x.id === id)
const chipPosition = (p: Puzzle, person: string, index: number): number => statementsOf(p, person).findIndex(s => s.index === index)

const beat = (id: BeatId, targets: Target[], text = BEAT_TEXT[id]): Beat => ({ id, n: N[id], text, targets })

/** The person a beat is about; the view halos their portrait when someone else is selected. */
function pick(p: Puzzle, g: GameState, id: string, make: () => Beat): Beat {
  if (g.selected === id) return make()
  const b = make()
  return { ...b, targets: [{ kind: 'who', position: railPosition(p, id) }] }
}

export function beatFor(p: Puzzle, ts: TutState): Beat {
  const g = ts.game
  const sol = p.solution

  if (!placedRight(p, g.placement, ROLE.pinned)) {
    const lit = g.lit[ROLE.pinned] ?? []
    const lens = lensCells(p, ROLE.pinned, lit, g.placement)
    if (g.selected === ROLE.pinned && lens?.size === 1) return beat('place', [{ kind: 'cell', cell: sol[ROLE.pinned] }])
    const chip = statementsOf(p, ROLE.pinned)[0]
    return pick(p, g, ROLE.pinned, () => beat('lens', [{ kind: 'chip', position: chipPosition(p, ROLE.pinned, chip.index) }]))
  }

  if (!placedRight(p, g.placement, ROLE.measured)) {
    const sts = statementsOf(p, ROLE.measured)
    const rel = sts.find(s => s.needs)!
    const own = sts.find(s => !s.needs)!
    const lit = g.lit[ROLE.measured] ?? []
    if (!lit.includes(rel.index)) return pick(p, g, ROLE.measured, () => beat('measure', [{ kind: 'chip', position: sts.indexOf(rel) }]))
    if (!lit.includes(own.index)) return pick(p, g, ROLE.measured, () => beat('second', [{ kind: 'chip', position: sts.indexOf(own) }], SECOND_LIGHT_TEXT))
    return pick(p, g, ROLE.measured, () => beat('second', [{ kind: 'cell', cell: sol[ROLE.measured] }]))
  }

  if (!placedRight(p, g.placement, ROLE.supposed)) {
    if (!ts.seen) {
      // a tap that placed her on the wrong square is not a supposition: say what it did and what to do instead
      const text = g.placement[ROLE.supposed] ? SUPPOSE_PLACED_TEXT : undefined
      return pick(p, g, ROLE.supposed, () => beat('suppose', [{ kind: 'cell', cell: WRONG_SQUARE }], text))
    }
    return pick(p, g, ROLE.supposed, () => beat('third', [{ kind: 'cell', cell: sol[ROLE.supposed] }]))
  }

  if (!placedRight(p, g.placement, ROLE.victim)) {
    return pick(p, g, ROLE.victim, () => beat('scene', [{ kind: 'cell', cell: sol[ROLE.victim] }]))
  }

  return beat('accuse', [{ kind: 'bar', button: 'accuse' }])
}

// ---- reducer ---------------------------------------------------------------

export type TutAction = Action | { t: 'tutorialReset' }

function prime(p: Puzzle, ts: TutState): TutState {
  const g = ts.game
  if (ts.primed || !placedRight(p, g.placement, ROLE.pinned) || !placedRight(p, g.placement, ROLE.measured) || g.selected !== ROLE.supposed) return ts
  let next = g
  for (const st of statementsOf(p, ROLE.supposed)) if (!(next.lit[ROLE.supposed] ?? []).includes(st.index)) next = reduce(p, next, { t: 'lit', index: st.index })
  return { ...ts, game: { ...next, announce: `${g.announce} ${firstName(p, ROLE.supposed)}'s statements are lit. Two squares fit them both.` }, primed: true }
}

function noticed(p: Puzzle, ts: TutState): TutState {
  const g = ts.game
  if (ts.seen || !g.ghost) return ts
  return suppose(p, g.ghost).contradictions.length ? { ...ts, seen: true } : ts
}

/** Greta stands on a wrong square she was only meant to suppose: bring her back to the front, so the halo and the portrait agree. */
function reselect(p: Puzzle, ts: TutState): TutState {
  const g = ts.game
  const stuck = !ts.seen && placedRight(p, g.placement, ROLE.pinned) && placedRight(p, g.placement, ROLE.measured)
    && !!g.placement[ROLE.supposed] && !placedRight(p, g.placement, ROLE.supposed) && g.selected !== ROLE.supposed
  return stuck ? { ...ts, game: reduce(p, g, { t: 'select', id: ROLE.supposed }) } : ts
}

export function tutReduce(p: Puzzle, ts: TutState, a: TutAction): TutState {
  if (a.t === 'tutorialReset') return initTut(p)
  let g = ts.game
  // Once the contradiction has been seen a tap should place, not only put the ghost away, and a Suppose
  // switch left on from the button must not turn every tap into another supposition.
  if (a.t === 'cell' && ts.seen && !planDone(p, g.placement)) {
    if (g.supposeOn) g = reduce(p, g, { t: 'suppose' })
    else if (g.ghost) g = reduce(p, g, { t: 'dropGhost' })
  }

  if (a.t === 'accuse') {
    // Never judged on an unfinished plan, and a wrong name is a plain "alibi", not a strike.
    if (!planDone(p, g.placement)) return { ...ts, game: { ...g, announce: 'Place everyone first. The accusation comes last.' } }
    if (a.id !== p.murdererId) {
      return { ...ts, game: { ...g, verdict: { kind: 'notThem', strikes: 0, cold: false }, announce: `${wrongAccusationLine(firstName(p, a.id))} Nothing counts here.` } }
    }
  }
  const next = prime(p, noticed(p, { ...ts, game: reduce(p, g, a) }))
  return a.t === 'cell' ? reselect(p, next) : next
}

/** True once the plan holds every person on their true square, for the Accuse button. */
export const accuseReady = (p: Puzzle, ts: TutState): boolean => planDone(p, ts.game.placement)
