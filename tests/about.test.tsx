import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeScreen from '../src/components/HomeScreen'
import HowToPlay from '../src/components/HowToPlay'
import { makePuzzle } from './fixtures'

function renderHome() {
  return render(
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
    />,
  )
}

describe('credits', () => {
  it('are reachable from the home screen and say what Alibi is and is not', () => {
    renderHome()
    const opener = screen.getByRole('button', { name: /about & credits/i })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: /alibi and its credits/i })
    const credit = screen.getByTestId('about-credit')
    expect(credit).toHaveTextContent('created by Manuel Garand')
    expect(credit).toHaveTextContent('not affiliated with, endorsed by, or sponsored by Manuel Garand')
    expect(dialog).toHaveTextContent('Kenney')
    expect(dialog).toHaveTextContent('CC0')
    expect(dialog).toHaveTextContent('Zoish')
    expect(dialog).toHaveTextContent('DiceBear')
  })

  it('close with Escape and give the focus back', () => {
    renderHome()
    const opener = screen.getByRole('button', { name: /about & credits/i })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('keep "Murdoku" out of everything except the credit sentence', () => {
    const { container } = renderHome()
    expect(container).not.toHaveTextContent(/murdoku/i)
    fireEvent.click(screen.getByRole('button', { name: /about & credits/i }))
    const credit = screen.getByTestId('about-credit').textContent!
    const outsideCredit = screen.getByRole('dialog').textContent!.replace(credit, '')
    expect(outsideCredit).not.toMatch(/murdoku/i)
  })
})

describe('How to Play', () => {
  it('defines "beside" the way the solver enforces it', () => {
    render(<HowToPlay mode="classic" onClose={vi.fn()} />)
    const rule = screen.getByTestId('beside-rule')
    expect(rule).toHaveTextContent('touches your square along a side')
    expect(rule).toHaveTextContent('same room')
    expect(rule).toHaveTextContent('same floor')
    expect(rule).toHaveTextContent('not standing on it')
    expect(rule).toHaveTextContent('Corners do not count')
    expect(rule).toHaveTextContent('far side of a wall')
  })
})
