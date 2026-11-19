import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Casebook from '../../src/casebook/Casebook'
import { firstName } from '../../src/casebook/cells'
import * as sound from '../../src/casebook/sound'
import { easy } from './fixtures'

vi.mock('../../src/casebook/sound', async importOriginal => {
  const real = await importOriginal<typeof import('../../src/casebook/sound')>()
  return { ...real, playCue: vi.fn(), loadSoundPref: () => true, primeAudio: () => true }
})

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks() })

describe('the verdict is not heard before it is read out', () => {
  it('plays the verdict cue only when the roll-call reaches its end', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(easy, easy.murdererId)) }))
    const cues = () => vi.mocked(sound.playCue).mock.calls.map(c => c[0])
    expect(cues()).not.toContain('called')
    expect(cues()).not.toContain('proved')
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(cues()).toContain('called')
  })

  it('still plays the strike cue at once for a wrong name', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    const wrong = easy.people.find(x => x.id !== easy.murdererId && x.id !== easy.victimId)!
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(easy, wrong.id)) }))
    expect(vi.mocked(sound.playCue).mock.calls.map(c => c[0])).toContain('strike')
  })
})
