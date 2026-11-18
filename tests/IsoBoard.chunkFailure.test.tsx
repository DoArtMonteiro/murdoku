import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAuthoredPuzzle } from '../src/core/authored'
import { AUTHORED_CASES } from '../src/data/cases'
import { emptyMarks } from './fixtures'

const puzzle = buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')

// The renderer is a lazily loaded chunk. After an update its file can be gone, and the
// import then rejects with a chunk-load error. The module mock below rejects the same way
// from inside the promise chain that wraps the import, which is what the board handles.
async function renderWithMissingRenderer(reload: () => boolean) {
  vi.resetModules()
  vi.doMock('../src/scene3d/renderer', () => ({
    createSceneRenderer: () => { throw new TypeError('Failed to fetch dynamically imported module: /assets/renderer-old.js') },
  }))
  vi.doMock('../src/core/chunkErrors', async importOriginal => ({ ...(await importOriginal<typeof import('../src/core/chunkErrors')>()), reloadOnceForChunkError: vi.fn(reload) }))
  const { default: IsoBoard } = await import('../src/components/IsoBoard')
  const chunkErrors = await import('../src/core/chunkErrors')
  const view = render(<IsoBoard puzzle={puzzle} marks={emptyMarks(6)} conflicts={new Set<string>()} onCellClick={vi.fn()} />)
  return { view, reloadSpy: chunkErrors.reloadOnceForChunkError as unknown as ReturnType<typeof vi.fn> }
}

describe('board when the 3D chunk is gone', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined))
  afterEach(() => { vi.doUnmock('../src/scene3d/renderer'); vi.doUnmock('../src/core/chunkErrors'); vi.restoreAllMocks() })

  it('says so, with a reload button, once a reload has already been tried', async () => {
    const { reloadSpy } = await renderWithMissingRenderer(() => false)
    const alert = await screen.findByRole('alert')
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(alert).toHaveTextContent(/3D house did not load/i)
    expect(alert).toHaveTextContent(/progress is not affected/i)
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /clear saved data/i })).toBeNull()
    // The grid itself is still there and usable.
    expect(screen.getAllByRole('gridcell')).toHaveLength(36)
  })

  it('shows nothing while the one allowed reload is under way', async () => {
    const { reloadSpy } = await renderWithMissingRenderer(() => true)
    await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
