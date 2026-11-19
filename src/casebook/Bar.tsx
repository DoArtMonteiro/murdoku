import { CircleHelp, Gavel, Ghost, Pencil, Undo2 } from 'lucide-react'

interface Props {
  pencilOn: boolean
  supposeOn: boolean
  canUndo: boolean
  whyDone: boolean
  accuseDisabled: boolean
  onPencil: () => void
  onSuppose: () => void
  onUndo: () => void
  onWhy: () => void
  onAccuse: () => void
}

/** Bottom action bar, in the thumb zone. Every control is at least 44 px tall. */
export function Bar(p: Props) {
  return (
    <nav className="cb-bar" aria-label="Actions">
      <button type="button" className="cb-act" aria-pressed={p.pencilOn} onClick={p.onPencil}><Pencil size={20} aria-hidden="true" /><span>Pencil</span></button>
      <button type="button" className="cb-act" aria-pressed={p.supposeOn} onClick={p.onSuppose}><Ghost size={20} aria-hidden="true" /><span>Suppose</span></button>
      <button type="button" className="cb-act" disabled={!p.canUndo} onClick={p.onUndo}><Undo2 size={20} aria-hidden="true" /><span>Undo</span></button>
      <button type="button" className="cb-act" disabled={p.whyDone} onClick={p.onWhy}><CircleHelp size={20} aria-hidden="true" /><span>Why?</span></button>
      <button type="button" className="cb-act cb-accuse" disabled={p.accuseDisabled} onClick={p.onAccuse}><Gavel size={20} aria-hidden="true" /><span>Accuse</span></button>
    </nav>
  )
}
