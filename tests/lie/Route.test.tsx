import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AlibiRoute from '../../src/lie/Route'

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-theme') })

describe('the route: the globs resolve and a case really plays', () => {
  it('?alibi=fixture opens the fixture and Begin leads to the first suspect', async () => {
    render(<AlibiRoute alibi="fixture" />)
    const begin = await screen.findByRole('button', { name: 'Begin' })
    expect(screen.getByRole('dialog')).toHaveTextContent('The Quiet Quay')
    fireEvent.click(begin)
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument()
  })

  it('?alibi with no id opens the first real case, which plays: people, statements, a pin, the tray', async () => {
    render(<AlibiRoute alibi="" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Begin' }))
    const people = within(screen.getByRole('list', { name: 'People' }))
    expect(people.getAllByRole('button').length).toBeGreaterThanOrEqual(5)
    const pins = screen.getAllByRole('button', { name: /^Pin / })
    expect(pins.length).toBeGreaterThan(0)
    fireEvent.click(pins[0])
    expect(screen.getByRole('region', { name: 'Pinned statements' })).toBeInTheDocument()
  })

  it('an unknown id says so, and lists what is available', async () => {
    render(<AlibiRoute alibi="nope" />)
    expect(await screen.findByText('No case called "nope".')).toBeInTheDocument()
  })

  it('&truth opens the hidden harness: nothing to pin', async () => {
    render(<AlibiRoute alibi="fixture" truth />)
    fireEvent.click(await screen.findByRole('button', { name: 'Begin' }))
    expect(screen.queryByRole('button', { name: /^Pin / })).toBeNull()
  })
})
