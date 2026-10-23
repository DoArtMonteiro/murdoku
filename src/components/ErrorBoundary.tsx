import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { keysWithPrefix, removeKey } from '../core/storage'

interface Props {
  children: ReactNode
  /** Called instead of reloading the page; for tests and embedding. */
  onReload?: () => void
}

interface State { error: Error | null }

/**
 * Last line of defence: a render error anywhere below this boundary used to
 * unmount the whole React tree and leave a white page, with no way back short
 * of clearing site data by hand. The boundary replaces that with a plain
 * message and two ways out: try again, or wipe this game's saved data (the
 * likeliest cause of a crash that repeats on every load) and reload.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Murdoku crashed while rendering', error, info.componentStack)
  }

  private reload = () => {
    if (this.props.onReload) this.props.onReload()
    else window.location.reload()
  }

  private resetSavedData = () => {
    for (const key of keysWithPrefix('murdoku_')) removeKey(key)
    this.setState({ error: null })
    this.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        role="alert"
        className="min-h-screen bg-bg-deep text-paper font-sans flex items-center justify-center p-6"
        style={{ background: 'var(--color-bg-deep, #14110d)', color: 'var(--color-text-primary, #f1e9d6)' }}
      >
        <div className="max-w-md w-full grid gap-4 border p-5" style={{ borderColor: 'var(--color-border-strong, #5a4f3c)' }}>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.12em]">The case file would not open</h1>
          <p className="text-sm leading-relaxed">
            Something went wrong while drawing this screen. Your detective work is probably safe: try again first.
            If it keeps happening, the saved data on this device may be damaged — clearing it starts you from a clean file.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="focus-ring min-h-[44px] px-4 border font-display font-bold uppercase tracking-[0.12em]"
              style={{ borderColor: 'currentColor' }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.resetSavedData}
              className="focus-ring min-h-[44px] px-4 border font-display font-bold uppercase tracking-[0.12em]"
              style={{ borderColor: 'currentColor' }}
            >
              Clear saved data and reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
