import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import CaseProgressStrip from '../src/components/CaseProgressStrip'
import HomeScreen from '../src/components/HomeScreen'
import HowToPlay from '../src/components/HowToPlay'
import { makePuzzle } from './fixtures'

describe('page landmark', () => {
  it('has exactly one main landmark on the home screen and on the release notes', async () => {
    window.matchMedia = ((query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => undefined, removeEventListener: () => undefined,
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    render(<App />)
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument(), { timeout: 20000 })
    expect(screen.getAllByRole('main')).toHaveLength(1)
    fireEvent.click(await screen.findByRole('button', { name: /what.s new/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /release notes/i })).toBeInTheDocument(), { timeout: 10000 })
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('keeps one main when a tier list is open', () => {
    render(
      <main>
        <HomeScreen
          puzzles={[makePuzzle({ id: 'case-1', title: 'The Empty Chair', difficulty: 'Easy' })]}
          completedIds={[]}
          records={{}}
          mode="classic"
          onSetMode={vi.fn()}
          onSelect={vi.fn()}
          onOpenReleases={vi.fn()}
          resolvedTheme="dark"
          onToggleTheme={vi.fn()}
        />
      </main>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Easy cases/i }))
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})

describe('labels contain their visible text', () => {
  it('tier buttons say the tier, the size and the solved count they show', () => {
    render(
      <HomeScreen
        puzzles={[makePuzzle({ id: 'case-1', title: 'The Empty Chair', difficulty: 'Easy' })]}
        completedIds={['case-1']}
        records={{}}
        mode="classic"
        onSetMode={vi.fn()}
        onSelect={vi.fn()}
        onOpenReleases={vi.fn()}
        resolvedTheme="dark"
        onToggleTheme={vi.fn()}
      />,
    )
    const tier = screen.getByRole('button', { name: /Easy cases/i })
    expect(tier).not.toHaveAttribute('aria-label')
    const name = tier.textContent!
    expect(name).toContain('Easy')
    expect(name).toContain('1/1')
  })

  it('step buttons keep the step number, the name and the state in their name, with no aria-label to override the text', () => {
    const puzzle = makePuzzle()
    render(
      <CaseProgressStrip
        puzzle={puzzle}
        placedOf={{}}
        conflicts={new Set()}
        selectedPerson={puzzle.people[0].id}
        onSelectPerson={vi.fn()}
      />,
    )
    const first = screen.getByRole('button', { name: /Step 1,\s*.*next suggested/i })
    expect(first).not.toHaveAttribute('aria-label')
    expect(first.textContent).toContain(puzzle.people[0].name)
  })
})

describe('How to Play dialog', () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Help</button>
        {open && <HowToPlay mode="classic" onClose={() => setOpen(false)} />}
      </>
    )
  }

  it('takes focus on open, closes on Escape and returns focus to its opener', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Help' })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(document.activeElement).toHaveAccessibleName('Close')
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab inside the dialog', () => {
    render(<HowToPlay mode="classic" onClose={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    const last = buttons[buttons.length - 1]
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(buttons[0]).toHaveFocus()
    fireEvent.keyDown(buttons[0], { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })
})
