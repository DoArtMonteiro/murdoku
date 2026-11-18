import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Avatar from '../src/components/Avatar'
import SuspectCard from '../src/components/SuspectCard'
import type { Person } from '../src/core/types'

const person: Person = { id: 'p0', name: 'Ada Stone', avatarSeed: 'ada-1', accent: '#d89a22' }

describe('suspect avatars', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('draws the illustration from the bundle, with no network request', async () => {
    const fetchSpy = vi.fn(() => { throw new Error('network used') })
    vi.stubGlobal('fetch', fetchSpy)
    const { container } = render(<Avatar seed="ada-1" accent="#d89a22" name="Ada Stone" />)
    // The monogram stands in until the illustration is ready.
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('A')
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    const src = container.querySelector('img')!.getAttribute('src')!
    expect(src).toMatch(/^data:image\/svg\+xml/)
    expect(decodeURIComponent(src)).not.toMatch(/(?:href|src)=["']https?:/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('is a different picture for a different suspect', async () => {
    const a = render(<Avatar seed="ada-1" accent="#d89a22" />)
    const b = render(<Avatar seed="bram-2" accent="#d89a22" />)
    await waitFor(() => expect(a.container.querySelector('img')).not.toBeNull())
    await waitFor(() => expect(b.container.querySelector('img')).not.toBeNull())
    expect(a.container.querySelector('img')!.getAttribute('src')).not.toBe(b.container.querySelector('img')!.getAttribute('src'))
  })

  it('replaces the photographic portrait on the suspect card', async () => {
    const { container, getByRole } = render(
      <SuspectCard person={person} clues={['In the Study.']} selected={false} placed={false} conflicted={false} onSelect={vi.fn()} />,
    )
    expect(getByRole('img', { name: 'Ada Stone portrait' })).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('img[src^="data:image/svg+xml"]')).not.toBeNull())
    expect(container.innerHTML).not.toMatch(/\.jpg|contact-sheet/)
  })
})
