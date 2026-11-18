import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from '../src/components/ErrorBoundary'
import { RELOAD_GUARD_MS, isChunkLoadError, reloadOnceForChunkError } from '../src/core/chunkErrors'

const chunkError = () => new TypeError('Failed to fetch dynamically imported module: https://example.test/assets/Victory-abc.js')

describe('isChunkLoadError', () => {
  it('recognises the failure in Chromium, Firefox, Safari and Vite wording', () => {
    expect(isChunkLoadError(chunkError())).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: /a.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/x.css'))).toBe(true)
    expect(isChunkLoadError(Object.assign(new Error('boom'), { name: 'ChunkLoadError' }))).toBe(true)
  })
  it('does not mistake other errors for it', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(new SyntaxError('Unexpected token < in JSON'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false)
  })
})

describe('reloadOnceForChunkError', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('reloads the first time and not again inside the guard window', () => {
    const reload = vi.fn()
    expect(reloadOnceForChunkError(reload, 1_000)).toBe(true)
    expect(reloadOnceForChunkError(reload, 1_000 + RELOAD_GUARD_MS - 1)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(reloadOnceForChunkError(reload, 1_000 + RELOAD_GUARD_MS + 1)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('does not reload when the guard cannot be stored, because it could loop', () => {
    const reload = vi.fn()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(reloadOnceForChunkError(reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})

function Boom({ error }: { error: Error }): never { throw error }

describe('ErrorBoundary with a chunk failure', () => {
  beforeEach(() => { sessionStorage.clear(); vi.spyOn(console, 'error').mockImplementation(() => undefined) })
  afterEach(() => vi.restoreAllMocks())

  it('reloads once, then shows a plain reload message that never offers to clear saves', () => {
    localStorage.setItem('murdoku_solved_v2', '["easy-1"]')
    const onReload = vi.fn()
    const { unmount } = render(<ErrorBoundary onReload={onReload}><Boom error={chunkError()} /></ErrorBoundary>)
    expect(onReload).toHaveBeenCalledTimes(1)
    unmount()
    render(<ErrorBoundary onReload={onReload}><Boom error={chunkError()} /></ErrorBoundary>)
    expect(onReload).toHaveBeenCalledTimes(1) // guard: no loop
    expect(screen.getByRole('alert')).toHaveTextContent(/did not load/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/saved progress is not affected/i)
    expect(screen.queryByRole('button', { name: /clear saved data/i })).toBeNull()
    expect(screen.queryByText(/damaged/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(onReload).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('murdoku_solved_v2')).toBe('["easy-1"]')
  })

  it('still offers the data reset for an ordinary crash', () => {
    const onReload = vi.fn()
    render(<ErrorBoundary onReload={onReload}><Boom error={new Error('Cannot read properties of undefined')} /></ErrorBoundary>)
    expect(onReload).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /clear saved data/i })).toBeInTheDocument()
  })
})
