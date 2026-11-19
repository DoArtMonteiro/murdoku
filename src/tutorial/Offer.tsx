import { useState } from 'react'
import { X } from 'lucide-react'
import { readTutorialFlag, writeTutorialFlag } from './storage'
import './tutorial.css'

/**
 * "New here? Play Case 0 (90 s)" over the case picker, until the player has played, skipped or dismissed it.
 * It lives in the tutorial slice so the picker (src/casebook/Route.tsx) stays untouched; App.tsx mounts it
 * next to the picker. If the casebook ever wants it inline, the one-line change is in the report.
 */
export default function TutorialOffer() {
  const [open, setOpen] = useState(() => readTutorialFlag() === null)
  if (!open) return null
  return (
    <aside className="tut-offer" aria-label="First time here?">
      <a href="?tutorial">New here? <span>Play Case 0 (90 s)</span></a>
      <button type="button" aria-label="Dismiss" onClick={() => { writeTutorialFlag('dismissed'); setOpen(false) }}><X size={20} aria-hidden="true" /></button>
    </aside>
  )
}
