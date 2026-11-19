import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import { judgeAccusation, MAX_STRIKES, provedTier, tierOf, TIER_LABEL } from '../../src/casebook/verdict'

describe('judgeAccusation', () => {
  it('proves only the murderer over the exact solution', () => {
    expect(judgeAccusation(hard, hard.murdererId, hard.solution, 0)).toEqual({ kind: 'proved' })
  })

  it('treats a ground-floor cell with and without an explicit floor as equal', () => {
    const noFloor = Object.fromEntries(easy.people.map(x => [x.id, { row: easy.solution[x.id].row, col: easy.solution[x.id].col }]))
    expect(judgeAccusation(easy, easy.murdererId, noFloor, 0).kind).toBe('proved')
  })

  it('calls it when the name is right and the plan is empty, partial or wrong', () => {
    expect(judgeAccusation(hard, hard.murdererId, {}, 0)).toEqual({ kind: 'calledIt' })
    const partial = { p1: hard.solution.p1 }
    expect(judgeAccusation(hard, hard.murdererId, partial, 1)).toEqual({ kind: 'calledIt' })
    const wrong = { ...hard.solution, p2: { ...hard.solution.p2, floor: 0 } }
    expect(judgeAccusation(hard, hard.murdererId, wrong, 0)).toEqual({ kind: 'calledIt' })
  })

  it('a wrong name is a strike, whatever the plan; three make the case cold', () => {
    const innocent = hard.people.find(x => x.id !== hard.murdererId && x.id !== hard.victimId)!.id
    expect(judgeAccusation(hard, innocent, hard.solution, 0)).toEqual({ kind: 'notThem', strikes: 1, cold: false })
    expect(judgeAccusation(hard, innocent, {}, MAX_STRIKES - 1)).toEqual({ kind: 'notThem', strikes: MAX_STRIKES, cold: true })
  })

  it('does not let the victim or a stranger be accused', () => {
    expect(judgeAccusation(hard, hard.victimId, hard.solution, 0).kind).toBe('invalid')
    expect(judgeAccusation(hard, 'nobody', hard.solution, 0).kind).toBe('invalid')
  })

  it('the wrong-name verdict carries nothing but the count', () => {
    const innocent = easy.people.find(x => x.id !== easy.murdererId && x.id !== easy.victimId)!.id
    const v = judgeAccusation(easy, innocent, easy.solution, 0)
    expect(Object.keys(v).sort()).toEqual(['cold', 'kind', 'strikes'])
  })
})

describe('verdict tiers', () => {
  it('"Proved" needs no hint and no strike; either one makes it "Proved with help"', () => {
    expect(judgeAccusation(hard, hard.murdererId, hard.solution, 0, 0)).toEqual({ kind: 'proved' })
    expect(judgeAccusation(hard, hard.murdererId, hard.solution, 0, 1)).toEqual({ kind: 'provedHelp' })
    expect(judgeAccusation(hard, hard.murdererId, hard.solution, 1, 0)).toEqual({ kind: 'provedHelp' })
    expect(judgeAccusation(hard, hard.murdererId, hard.solution, MAX_STRIKES - 1, 7)).toEqual({ kind: 'provedHelp' })
  })

  it('"Called it" is the right name over a plan that is not proven, whatever help was spent', () => {
    expect(judgeAccusation(hard, hard.murdererId, {}, 0, 0)).toEqual({ kind: 'calledIt' })
    expect(judgeAccusation(hard, hard.murdererId, {}, 2, 5)).toEqual({ kind: 'calledIt' })
  })

  it('derives the tier from the saved outcome, hints and strikes; nothing extra is saved', () => {
    expect(provedTier(0, 0)).toBe('proved')
    expect(provedTier(2, 0)).toBe('provedHelp')
    expect(provedTier(0, 1)).toBe('provedHelp')
    expect(tierOf('proved', 0, 0)).toBe('proved')
    expect(tierOf('proved', 3, 1)).toBe('provedHelp')
    expect(tierOf('called', 0, 0)).toBe('calledIt')
    expect(tierOf('cold', 0, 3)).toBeNull()
    expect(tierOf(null, 0, 0)).toBeNull()
    expect(TIER_LABEL).toEqual({ proved: 'Proved', provedHelp: 'Proved with help', calledIt: 'Called it' })
  })
})
