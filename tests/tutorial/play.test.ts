import { describe, expect, it } from 'vitest'
import { statementsOf } from '../../src/casebook/lens'
import { cellKey } from '../../src/casebook/cells'
import { suppose } from '../../src/casebook/suppose'
import { case0 as p, ROLE, WRONG_SQUARE } from '../../src/tutorial/case0'
import { accuseReady, beatFor, BEAT_TEXT, BEATS, initTut, SECOND_LIGHT_TEXT, tutReduce } from '../../src/tutorial/play'
import type { TutAction, TutState } from '../../src/tutorial/play'

const run = (ts: TutState, ...as: TutAction[]): TutState => as.reduce((s, a) => tutReduce(p, s, a), ts)
const cell = (r: number, c: number) => ({ row: r, col: c, floor: 0 })

/** A newcomer who only ever does what the highlighted control says. */
function follow(ts: TutState): TutAction {
  const b = beatFor(p, ts)
  const t = b.targets[0]
  switch (t.kind) {
    case 'chip': return { t: 'lit', index: statementsOf(p, ts.game.selected)[t.position].index }
    case 'who': return { t: 'select', id: p.people[t.position].id }
    case 'cell': return { t: b.id === 'suppose' ? 'long' : 'cell', cell: t.cell }
    case 'bar': return { t: 'accuse', id: p.murdererId }
  }
}

function playThrough(): { ts: TutState; beats: string[]; steps: number } {
  let ts = initTut(p)
  const beats: string[] = []
  let steps = 0
  while (steps < 40) {
    const b = beatFor(p, ts)
    beats.push(b.id)
    ts = tutReduce(p, ts, follow(ts))
    steps++
    if (ts.game.outcome === 'proved') break
  }
  return { ts, beats, steps }
}

describe('walk-through: the beats', () => {
  it('opens on the lens beat with Lena selected and her only statement highlighted', () => {
    const b = beatFor(p, initTut(p))
    expect(b.id).toBe('lens')
    expect(b.n).toBe(1)
    expect(b.text).toBe(BEAT_TEXT.lens)
    expect(b.targets).toEqual([{ kind: 'chip', position: 0 }])
  })

  it('a player who does only what is highlighted walks every beat in order and proves the case with no help and no strike', () => {
    const { ts, beats, steps } = playThrough()
    expect(beats).toEqual(['lens', 'place', 'measure', 'second', 'second', 'suppose', 'third', 'scene', 'accuse'])
    expect(steps).toBe(9)
    expect(ts.game.outcome).toBe('proved')
    expect(ts.game.verdict?.kind).toBe('proved')
    expect(ts.game.strikes).toBe(0)
    expect(ts.game.hintsUsed).toBe(0)
    expect(BEATS).toBe(8)
  })

  it('stays on the instruction when the player does something else, and never changes the plan for them', () => {
    let ts = initTut(p)
    // wander: pencil, a stray square, another suspect, a floor change
    ts = run(ts, { t: 'pencil' }, { t: 'pencil' }, { t: 'cell', cell: cell(0, 0) }, { t: 'select', id: ROLE.victim })
    // a stray placement of Lena (her own statement is not lit): still the first beat
    ts = run(ts, { t: 'select', id: ROLE.pinned }, { t: 'cell', cell: cell(2, 2) })
    expect(beatFor(p, ts).id).toBe('lens')
    expect(beatFor(p, ts).targets).toEqual([{ kind: 'who', position: 0 }])
    // her statement lit, with her standing on the wrong square: the second beat, still pointing at her true one
    ts = run(ts, { t: 'select', id: ROLE.pinned }, { t: 'lit', index: statementsOf(p, ROLE.pinned)[0].index })
    const b = beatFor(p, ts)
    expect(b.id).toBe('place')
    expect(b.targets).toEqual([{ kind: 'cell', cell: p.solution.p0 }])
    ts = run(ts, { t: 'cell', cell: p.solution.p0 })
    expect(beatFor(p, ts).id).toBe('measure')
  })

  it('points at a portrait when the beat is about someone who is not selected', () => {
    const ts = run(initTut(p), { t: 'select', id: ROLE.victim })
    const b = beatFor(p, ts)
    expect(b.id).toBe('lens')
    expect(b.targets).toEqual([{ kind: 'who', position: 0 }])
  })

  it('waits on the measured statement until Lena stands somewhere, then asks for it', () => {
    let ts = run(initTut(p), { t: 'select', id: ROLE.measured })
    expect(beatFor(p, ts).id).toBe('lens')
    ts = run(ts, { t: 'select', id: ROLE.pinned }, { t: 'lit', index: statementsOf(p, ROLE.pinned)[0].index }, { t: 'cell', cell: p.solution.p0 })
    expect(ts.game.selected).toBe(ROLE.measured)
    const b = beatFor(p, ts)
    expect(b.id).toBe('measure')
    expect(b.text).toBe(BEAT_TEXT.measure)
    expect(b.targets).toEqual([{ kind: 'chip', position: 0 }])
  })

  it('the second beat asks for the other statement, then the one lit square', () => {
    let ts = run(initTut(p), { t: 'lit', index: statementsOf(p, ROLE.pinned)[0].index }, { t: 'cell', cell: p.solution.p0 })
    const rel = statementsOf(p, ROLE.measured)[0].index
    ts = run(ts, { t: 'lit', index: rel })
    let b = beatFor(p, ts)
    expect(b.id).toBe('second')
    expect(b.text).toBe(SECOND_LIGHT_TEXT)
    expect(b.targets).toEqual([{ kind: 'chip', position: 1 }])
    ts = run(ts, { t: 'lit', index: statementsOf(p, ROLE.measured)[1].index })
    b = beatFor(p, ts)
    expect(b.text).toBe(BEAT_TEXT.second)
    expect(b.targets).toEqual([{ kind: 'cell', cell: p.solution.p1 }])
  })

  describe('the supposing beat', () => {
    const toGreta = (): TutState => {
      let ts = initTut(p)
      for (let i = 0; i < 5; i++) ts = run(ts, follow(ts))
      return ts
    }

    it('lights Greta\'s statements for her once Lena and Tomas stand, and points at the wrong square', () => {
      const ts = toGreta()
      expect(ts.game.selected).toBe(ROLE.supposed)
      expect(ts.primed).toBe(true)
      expect(ts.game.lit.p2).toHaveLength(2)
      const b = beatFor(p, ts)
      expect(b.id).toBe('suppose')
      expect(b.targets).toEqual([{ kind: 'cell', cell: WRONG_SQUARE }])
    })

    it('holding the RIGHT square shows no contradiction, so the beat does not move', () => {
      const ts = run(toGreta(), { t: 'long', cell: p.solution.p2 })
      expect(ts.seen).toBe(false)
      expect(beatFor(p, ts).id).toBe('suppose')
    })

    it('holding the wrong square shows "No square left" for the victim and moves on', () => {
      const ts = run(toGreta(), { t: 'long', cell: WRONG_SQUARE })
      expect(suppose(p, ts.game.ghost!).contradictions).toEqual([ROLE.victim])
      expect(ts.seen).toBe(true)
      const b = beatFor(p, ts)
      expect(b.id).toBe('third')
      expect(b.targets).toEqual([{ kind: 'cell', cell: p.solution.p2 }])
    })

    it('one tap on the right square puts the ghost away AND places her', () => {
      const ts = run(toGreta(), { t: 'long', cell: WRONG_SQUARE }, { t: 'cell', cell: p.solution.p2 })
      expect(ts.game.ghost).toBeNull()
      expect(cellKey(ts.game.placement.p2)).toBe(cellKey(p.solution.p2))
      expect(beatFor(p, ts).id).toBe('scene')
    })

    it('the Suppose button then a tap does the same job as a hold', () => {
      const ts = run(toGreta(), { t: 'suppose' }, { t: 'cell', cell: WRONG_SQUARE })
      expect(ts.seen).toBe(true)
    })

    it('a Suppose switch left on does not strand her: the next tap on the right square switches it off and places her', () => {
      const ts = run(toGreta(), { t: 'suppose' }, { t: 'cell', cell: WRONG_SQUARE }, { t: 'cell', cell: p.solution.p2 })
      expect(ts.game.supposeOn).toBe(false)
      expect(ts.game.ghost).toBeNull()
      expect(cellKey(ts.game.placement.p2)).toBe(cellKey(p.solution.p2))
      expect(beatFor(p, ts).id).toBe('scene')
    })

    it('a plain TAP on the wrong square places her there, brings her back to the front, and a hold on it still shows the contradiction', () => {
      let ts = run(toGreta(), { t: 'cell', cell: WRONG_SQUARE })
      // she stands on the wrong square, selection did not run on to Marco, and the beat still points at that square
      expect(cellKey(ts.game.placement.p2)).toBe(cellKey(WRONG_SQUARE))
      expect(ts.game.selected).toBe(ROLE.supposed)
      expect(beatFor(p, ts).id).toBe('suppose')
      expect(beatFor(p, ts).targets).toEqual([{ kind: 'cell', cell: WRONG_SQUARE }])
      ts = run(ts, { t: 'long', cell: WRONG_SQUARE })
      expect(ts.seen).toBe(true)
      ts = run(ts, { t: 'cell', cell: p.solution.p2 })
      expect(cellKey(ts.game.placement.p2)).toBe(cellKey(p.solution.p2))
      expect(beatFor(p, ts).id).toBe('scene')
    })

    it('a stray tap that is not on her squares is also brought back, and she can still be lifted by tapping her own square', () => {
      const ts = run(toGreta(), { t: 'cell', cell: cell(2, 2) })
      expect(ts.game.selected).toBe(ROLE.supposed)
      const lifted = run(ts, { t: 'cell', cell: cell(2, 2) })
      expect(lifted.game.placement.p2).toBeUndefined()
    })

    it('a contradiction seen once is never un-seen', () => {
      const ts = run(toGreta(), { t: 'long', cell: WRONG_SQUARE }, { t: 'dropGhost' }, { t: 'undo' })
      expect(ts.seen).toBe(true)
    })
  })

  it('the accuse beat comes only with a finished plan; a wrong name is an alibi with no strike, a right one is proved', () => {
    let ts = initTut(p)
    for (let i = 0; i < 8; i++) ts = run(ts, follow(ts))
    expect(accuseReady(p, ts)).toBe(true)
    const b = beatFor(p, ts)
    expect(b.id).toBe('accuse')
    expect(b.text).toBe(BEAT_TEXT.accuse)
    expect(b.targets).toEqual([{ kind: 'bar', button: 'accuse' }])
    const wrong = run(ts, { t: 'accuse', id: ROLE.measured })
    expect(wrong.game.strikes).toBe(0)
    expect(wrong.game.outcome).toBeNull()
    expect(wrong.game.verdict?.kind).toBe('notThem')
    expect(wrong.game.announce).toMatch(/Tomas has an alibi/)
    const right = run(wrong, { t: 'accuse', id: p.murdererId })
    expect(right.game.outcome).toBe('proved')
  })

  it('refuses to judge an unfinished plan, even a right name', () => {
    const ts = run(initTut(p), { t: 'accuse', id: p.murdererId })
    expect(ts.game.verdict).toBeNull()
    expect(ts.game.outcome).toBeNull()
    expect(ts.game.announce).toMatch(/Place everyone first/)
  })

  it('a hint that places someone moves the walk-through on, and replays start clean', () => {
    let ts = run(initTut(p), { t: 'why' }, { t: 'why' }, { t: 'why' })
    expect(ts.game.placement.p0).toEqual(p.solution.p0)
    expect(beatFor(p, ts).id).toBe('measure')
    ts = run(ts, { t: 'tutorialReset' })
    expect(beatFor(p, ts).id).toBe('lens')
    expect(ts.game.placement).toEqual({})
  })
})
