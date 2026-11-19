import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { readTutorialFlag, writeTutorialFlag } from './storage'
import './tutorial.css'

/**
 * "New here? Play Case 0 (90 s)" over the case picker, until the player has played, skipped or dismissed it.
 * It lives in the tutorial slice so the picker (src/casebook/Route.tsx) stays untouched; App.tsx mounts it
 * next to the picker. While it shows it asks the page for room under the last case (html[data-tut-offer]).
 */
export default function TutorialOffer() {
  const [open, setOpen] = useState(() => readTutorialFlag() === null)
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.tutOffer = ''
    return () => { delete root.dataset.tutOffer }
  }, [open])
  if (!open) return null
  return (
    <aside className="tut-offer" aria-label="First time here?">
      <a href="?tutorial">New here? <span>Play Case 0 (90 s)</span></a>
      <button type="button" aria-label="Dismiss" onClick={() => { writeTutorialFlag('dismissed'); setOpen(false) }}><X size={20} aria-hidden="true" /></button>
    </aside>
  )
}
