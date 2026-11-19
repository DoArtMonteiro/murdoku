import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import type { Clue, Puzzle } from '../../src/core/types'
import { deep, leadCases } from '../../src/casebook/deep'
import { statementsOf } from '../../src/casebook/lens'
import { chipPhrase, chipText, cluePhrase, thing } from '../../src/casebook/phrase'

const ALL: Puzzle[] = [hard, easy, ...deep(), ...leadCases()]

/** A case with a single clue of the given kind, found in the catalogue, so the wording runs on real data. */
function find<K extends Clue['kind']>(kind: K, pred: (c: Extract<Clue, { kind: K }>) => boolean = () => true): { p: Puzzle; clue: Extract<Clue, { kind: K }> } {
  for (const p of ALL) {
    for (const ct of p.clues) if (ct.clue.kind === kind && pred(ct.clue as Extract<Clue, { kind: K }>)) return { p, clue: ct.clue as Extract<Clue, { kind: K }> }
  }
  throw new Error(`no ${kind} clue in the catalogue`)
}

describe('statement chips', () => {
  it('use digits, drop "Exactly", and say "anywhere" for a loose direction', () => {
    const exact = find('direction', c => !!c.steps && c.dir === 'N' && c.steps >= 2)
    const name = (p: Puzzle, id: string) => p.people.find(x => x.id === id)!.name
    expect(chipPhrase(exact.p, exact.clue)).toBe(`${exact.clue.steps} rows north of ${name(exact.p, exact.clue.other)}`)
    const one = find('direction', c => c.steps === 1 && (c.dir === 'E' || c.dir === 'W'))
    expect(chipPhrase(one.p, one.clue)).toBe(`1 column ${one.clue.dir === 'E' ? 'east' : 'west'} of ${name(one.p, one.clue.other)}`)
    const loose = find('direction', c => !c.steps)
    expect(chipPhrase(loose.p, loose.clue)).toMatch(/^Anywhere (north|south|east|west) of /)
    for (const p of ALL) {
      for (const ct of p.clues) {
        const t = chipPhrase(p, ct.clue)
        expect(t, `${p.id}: ${t}`).not.toMatch(/exactly|\b(one|two|three|four|five|six|seven)\b (row|column)/i)
        expect(t).not.toMatch(/[.!?]$/)
      }
    }
  })

  it('say "house", not "board"', () => {
    expect(chipPhrase(hard, { kind: 'corner', person: 'p0' })).toBe('In a corner of the house')
    expect(chipPhrase(hard, { kind: 'edge', person: 'p0' })).toBe('On the outer edge of the house')
  })

  it('keep "on" and "beside" apart: on is the furniture\'s own square, beside is next to it', () => {
    const on = find('onFurniture')
    expect(chipPhrase(on.p, on.clue)).toMatch(/^On (a|the) [\w ]+ square$/)
    const beside = find('besideFurniture')
    expect(chipPhrase(beside.p, beside.clue)).toMatch(/^Beside (a|the) [\w ]+$/)
    const only = find('onlyOnFurniture')
    expect(chipPhrase(only.p, only.clue)).toMatch(/^The only one on (a|the) [\w ]+ square$/)
  })

  it('"the" only when the house holds exactly one such piece, as the clue semantics say', () => {
    for (const p of ALL) {
      for (const f of p.furniture) {
        const count = p.furniture.filter(x => x.type === f.type).length
        expect(thing(p, f.type).startsWith(count === 1 ? 'the ' : 'a ')).toBe(true)
      }
    }
  })

  it('keep the meaning of every other kind', () => {
    const rm = find('room')
    expect(chipPhrase(rm.p, rm.clue)).toBe(`In the ${rm.p.rooms.find(r => r.id === rm.clue.roomId)!.name}`)
    expect(chipPhrase(hard, { kind: 'floor', person: 'p0', floorNum: 1 })).toBe('Upstairs')
    expect(chipPhrase(hard, { kind: 'floor', person: 'p0', floorNum: 0 })).toBe('On the ground floor')
    expect(chipPhrase(hard, { kind: 'row', person: 'p0', row: 2 })).toBe('In row 3')
    expect(chipPhrase(hard, { kind: 'col', person: 'p0', col: 0 })).toBe('In column 1')
    expect(chipPhrase(hard, { kind: 'notSameRoomAs', person: 'p2', other: 'p0' })).toMatch(/^Not in the same room as \w+$/)
  })

  it('give every statement of every case some text, and never touch ClueText.text', () => {
    for (const p of ALL) {
      for (const x of p.people) {
        for (const st of statementsOf(p, x.id)) {
          expect(st.text.length, `${p.id} ${x.id}`).toBeGreaterThan(3)
          expect(st.text).toBe(chipText(p, st.clue, x.id === p.victimId))
        }
      }
      for (const ct of p.clues) expect(typeof ct.text).toBe('string')
    }
  })

  it('frame the victim\'s statements as the scene, not as testimony', () => {
    for (const p of ALL) {
      // a negation has no "found" in it: "Never in the Pantry", not "Found: not in the Pantry"
      for (const st of statementsOf(p, p.victimId)) expect(st.text, `${p.id}: ${st.text}`).toMatch(/^(Found: [a-z0-9]|Never in )/)
      for (const st of statementsOf(p, p.victimId)) expect(st.text).not.toMatch(/Found: (not|never)/i)
      for (const x of p.people.filter(y => y.id !== p.victimId)) {
        for (const st of statementsOf(p, x.id)) expect(st.text).not.toMatch(/^Found/)
      }
    }
  })

  it('the lower-case phrase used in hints is the same wording', () => {
    const d = find('direction', c => !!c.steps)
    expect(cluePhrase(d.p, d.clue)).toBe(chipPhrase(d.p, d.clue).replace(/^./, m => m.toLowerCase()))
  })
})
