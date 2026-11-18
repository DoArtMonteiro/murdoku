import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import About from '../src/components/About'
import HowToPlay from '../src/components/HowToPlay'

// Clicking text that cannot take focus moves focus to the nearest focusable ancestor, or to
// <body> if there is none. A browser does that on mousedown; jsdom does not, so the two outcomes
// are reproduced directly: focus on the panel (what tabIndex -1 gives) and focus on <body>.
function Harness({ dialog }: { dialog: 'how' | 'about' }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (dialog === 'how' ? <HowToPlay mode="classic" onClose={close} /> : <About onClose={close} />)}
    </>
  )
}

const dialogs = [
  { name: 'How to Play', dialog: 'how' as const, text: /one per row/i },
  { name: 'About', dialog: 'about' as const, text: /independent deduction puzzle/i },
]

describe.each(dialogs)('$name dialog after a click on its text', ({ dialog, text }) => {
  function open() {
    render(<Harness dialog={dialog} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    // The panel is the dialog itself (How to Play) or the element inside it (About).
    const dialogEl = screen.getByRole('dialog')
    const panel = dialogEl.matches('[tabindex="-1"]') ? dialogEl : dialogEl.querySelector<HTMLElement>('[tabindex="-1"]')
    return { opener, panel }
  }

  it('has a focusable panel, so a click on text keeps focus inside the dialog', () => {
    const { panel } = open()
    expect(panel).not.toBeNull()
    expect(screen.getByRole('dialog').contains(panel)).toBe(true)
    expect(screen.getAllByText(text).length).toBeGreaterThan(0)
  })

  it('closes on Escape and returns focus to the opener when focus is on the panel', () => {
    const { opener, panel } = open()
    act(() => panel!.focus())
    expect(panel).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('still closes on Escape when focus has been lost to <body>', () => {
    const { opener } = open()
    act(() => (document.activeElement as HTMLElement).blur())
    expect(document.body).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab trapped after the click, from the panel and from <body>', () => {
    const { panel } = open()
    const dialogEl = screen.getByRole('dialog')
    const controls = Array.from(dialogEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
    const first = controls[0]
    const last = controls[controls.length - 1]

    act(() => panel!.focus())
    fireEvent.keyDown(panel!, { key: 'Tab' })
    expect(first).toHaveFocus()

    act(() => panel!.focus())
    fireEvent.keyDown(panel!, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()

    act(() => (document.activeElement as HTMLElement).blur())
    fireEvent.keyDown(document.body, { key: 'Tab' })
    expect(dialogEl).toContainElement(document.activeElement as HTMLElement)
    expect(document.activeElement).toBe(first)

    // And the wrap-around at the ends still works.
    act(() => last.focus())
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('stops the Escape key from reaching anything else on the page', () => {
    open()
    const elsewhere = vi.fn()
    window.addEventListener('keydown', elsewhere)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    window.removeEventListener('keydown', elsewhere)
    expect(elsewhere).not.toHaveBeenCalled()
  })
})
