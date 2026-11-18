import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reloadOnceForChunkError } from './core/chunkErrors'

// Vite raises this when a lazily loaded file cannot be fetched or parsed. After an
// update the old file no longer exists, so load the current version, once. If the
// guard says no (it already reloaded), the error reaches the error boundary, which
// shows a plain reload message.
window.addEventListener('vite:preloadError', event => {
  if (reloadOnceForChunkError()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
