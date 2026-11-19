import { PICKER_CASES, resolveCase } from './cases'
import Casebook from './Casebook'
import { useSliceTheme } from './theme'
import './casebook.css'
import './fonts.css'

/** `?casebook=` shows the picker; `?casebook=<id>` plays that case. An unknown id falls back to the picker. */
export default function CasebookRoute({ caseId }: { caseId: string }) {
  const puzzle = caseId ? resolveCase(caseId) : undefined
  if (puzzle) return <Casebook key={puzzle.id} puzzle={puzzle} />
  return <Picker unknown={caseId} />
}

function Picker({ unknown }: { unknown: string }) {
  const theme = useSliceTheme()
  return (
    <div className="cb-root cb-picker" data-theme={theme}>
      <main className="cb-picker-in">
        <h1 className="cb-picker-title">Alibi</h1>
        <p className="cb-picker-lede">Everyone told the truth. Pick a case.</p>
        {unknown && <p className="cb-note">No case called "{unknown}".</p>}
        <ul className="cb-picker-list">
          {PICKER_CASES.map(c => {
            const p = resolveCase(c.id)
            return p ? (
              <li key={c.id}>
                <a className="cb-case" href={`?casebook=${c.id}`}>
                  <span className="cb-case-title">{p.title}</span>
                  <span className="cb-case-note">{c.note}</span>
                </a>
              </li>
            ) : null
          })}
        </ul>
      </main>
    </div>
  )
}
