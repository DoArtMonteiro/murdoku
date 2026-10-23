import type { Puzzle } from '../../core/types'
import type { CaseStory } from '../story/schema'
import { FramedPortrait } from './Portrait'

/** Night exterior of the villa as generated SVG (no assets): moon, lit windows, porch lamp, the parcel on the step. */
export function VillaVignette({ decorative }: { decorative?: boolean } = {}) {
  return (
    <svg className={decorative ? undefined : 'rs-vignette'} viewBox="0 0 320 150" {...(decorative ? { 'aria-hidden': true, focusable: false } : { role: 'img', 'aria-label': 'Hollis Villa at night: lit windows, a porch lamp and a parcel on the step' })} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0f1d" /><stop offset="1" stopColor="#1d2a4a" /></linearGradient>
        <radialGradient id="rs-glow"><stop offset="0" stopColor="#ffc872" stopOpacity=".9" /><stop offset="1" stopColor="#ffc872" stopOpacity="0" /></radialGradient>
        <radialGradient id="rs-moon"><stop offset="0" stopColor="#f6efd9" /><stop offset="1" stopColor="#f6efd9" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="150" fill="url(#rs-sky)" />
      <circle cx="262" cy="30" r="34" fill="url(#rs-moon)" opacity=".5" />
      <circle cx="262" cy="30" r="10" fill="#f6efd9" />
      {[[30, 14], [70, 30], [110, 10], [160, 24], [200, 12], [230, 40], [290, 60], [14, 52]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#efe3c8" opacity=".7" />)}
      <path d="M0 118h320v32H0z" fill="#17301f" />
      <path d="M0 118c40-8 70-4 110-6s90 4 130 0 60 2 80 4v6H0z" fill="#1f3a2a" />
      {/* house */}
      <g>
        <path d="M70 112V62h180v50z" fill="#241d1a" />
        <path d="M60 64L160 24l100 40z" fill="#15110f" stroke="#3a2e26" strokeWidth="1" />
        <path d="M120 64l40-22 40 22z" fill="#1d1613" stroke="#3a2e26" />
        <rect x="224" y="30" width="9" height="22" fill="#15110f" />
        <rect x="90" y="46" width="9" height="20" fill="#15110f" />
        {[[88, 74], [118, 74], [186, 74], [216, 74], [88, 94], [216, 94]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x + 8} cy={y + 9} r="18" fill="url(#rs-glow)" opacity=".55" />
            <rect x={x} y={y} width="16" height="18" fill="#f2c068" />
            <path d={`M${x + 8} ${y}v18M${x} ${y + 9}h16`} stroke="#241d1a" strokeWidth="1.5" />
          </g>
        ))}
        <rect x="146" y="82" width="28" height="30" fill="#4a2e1e" />
        <circle cx="168" cy="98" r="1.6" fill="#d4a94b" />
        <path d="M140 112h40v4h-40zM136 116h48v4h-48z" fill="#6e6a5e" />
        <circle cx="132" cy="90" r="16" fill="url(#rs-glow)" />
        <path d="M132 100v12" stroke="#2a2420" strokeWidth="2" /><rect x="128.500" y="84" width="7" height="9" fill="#ffd488" />
      </g>
      <g><rect x="118" y="108" width="12" height="8" fill="#a67c52" /><path d="M124 108v8M118 112h12" stroke="#5a3a22" strokeWidth=".9" /></g>
      <path d="M0 150V132c20-6 28-4 40-8l20 26z" fill="#10231a" opacity=".8" />
      <path d="M320 150V130c-16-4-28 0-40 6l-8 14z" fill="#10231a" opacity=".8" />
    </svg>
  )
}

export function CaseIntro({ puzzle, story, onBegin }: { puzzle: Puzzle; story: CaseStory; onBegin: () => void }) {
  const byId = new Map(story.suspects.map(s => [s.personId, s]))
  return (
    <div className="rs-intro" data-testid="case-intro">
      <div className="rs-intro-hero"><VillaVignette /></div>
      <div className="rs-intro-text">
        <p className="rs-eyebrow rs-rise" style={{ animationDelay: '120ms' }}>{puzzle.caseNumber} · {story.setting.hour}</p>
        <h3 className="rs-intro-title rs-rise" style={{ animationDelay: '240ms' }}>{puzzle.title}</h3>
        <p className="rs-intro-house rs-rise" style={{ animationDelay: '360ms' }}>{story.setting.estate} · {story.setting.styleLabel}</p>
        <p className="rs-intro-premise rs-rise" style={{ animationDelay: '560ms' }}>{story.premise}</p>
        <ul className="rs-lineup" aria-label="The people in the house">
          {puzzle.people.map((p, i) => {
            const s = byId.get(p.id)
            return (
              <li key={p.id} className="rs-lineup-item rs-rise" style={{ animationDelay: `${760 + i * 120}ms` }}>
                <FramedPortrait personId={p.id} size={64} victim={p.isVictim} />
                <span className="rs-lineup-name">{p.name}</span>
                <span className="rs-lineup-role">{s?.role ?? ''}</span>
              </li>
            )
          })}
        </ul>
        <div className="rs-intro-actions rs-rise" style={{ animationDelay: `${760 + puzzle.people.length * 120}ms` }}>
          <button type="button" className="rs-btn rs-btn-primary" onClick={onBegin} data-autofocus data-testid="intro-begin">Begin the investigation</button>
        </div>
      </div>
    </div>
  )
}
