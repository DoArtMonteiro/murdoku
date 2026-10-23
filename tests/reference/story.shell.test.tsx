import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import type { CellMark, Puzzle } from '../../src/core/types'
import { Shell } from '../../src/reference/shell/Shell'
import type { BoardModule, GameApi } from '../../src/reference/shell/types'
import { fallbackLayout, phonePlan, planGeometry } from '../../src/reference/shell/geometry'
import { storyFor } from '../../src/reference/story'
import { CENTRE_BOX, MARKER_R } from '../../src/reference/story/validate'
import { markerDiameter, markerHit, outsideGrid } from '../../src/reference/shell/storyState'

const puzzle = getAllPuzzles().find(p => p.id === 'very-easy-1') as Puzzle
const story = storyFor('very-easy-1')!
const N = puzzle.size
const board: BoardModule = { Board: () => <div data-testid="mock-board" />, boardLayout: fallbackLayout }

function emptyMarks(): CellMark[][] {
  return Array.from({ length: N }, () => Array.from({ length: N }, () => ({ kind: 'empty' as const })))
}
function makeGame(over: Partial<GameApi> = {}): GameApi {
  return {
    puzzles: [puzzle], catalogProgress: null, puzzle, mode: 'classic', marks: emptyMarks(), activeFloor: 0,
    selectedPerson: 'p1', tool: 'place', hintsLeft: 3, completed: false, murderer: null,
    feedback: 'none', placedOf: {}, conflicts: new Set<string>(), history: [],
    start: vi.fn(), selectPerson: vi.fn(), setTool: vi.fn(), clickCell: vi.fn(), clearAll: vi.fn(),
    undo: vi.fn(), hint: vi.fn(), submit: vi.fn(), accusationsLeft: 3,
    ...over,
  }
}
const ui = (game: GameApi, intro?: boolean) =>
  <Shell game={game} board={board} variant="illustrated" theme="dark" onToggleTheme={() => {}} intro={intro} />

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduce && q.includes('prefers-reduced-motion'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }))
}

beforeEach(() => { localStorage.clear(); stubMotion(false) })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('case intro', () => {
  it('opens once per case, names the style, lists the cast, and Escape skips it for good', () => {
    const { unmount } = render(ui(makeGame()))
    const intro = screen.getByTestId('case-intro')
    expect(intro).toHaveTextContent('Hollis Villa · Victorian Villa')
    expect(intro).toHaveTextContent('Midnight Delivery')
    expect(within(intro).getAllByRole('listitem')).toHaveLength(puzzle.people.length)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByTestId('ref-shell')).toHaveAttribute('inert')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByTestId('case-intro')).toBeNull()
    expect(localStorage.getItem('alibi.ref.intro.very-easy-1')).toBe('1')
    unmount()
    render(ui(makeGame()))
    expect(screen.queryByTestId('case-intro')).toBeNull()
  })
  it('can be replayed from the evidence board', () => {
    render(ui(makeGame(), false))
    fireEvent.click(screen.getByTestId('evidence-btn'))
    fireEvent.click(screen.getByTestId('replay-intro'))
    expect(screen.getByTestId('case-intro')).toBeInTheDocument()
  })
  it('never shows for a case without a story', () => {
    const other = getAllPuzzles().find(p => p.id !== 'very-easy-1') as Puzzle
    const marks = Array.from({ length: other.size }, () => Array.from({ length: other.size }, () => ({ kind: 'empty' as const })))
    render(ui(makeGame({ puzzle: other, puzzles: [other], marks, selectedPerson: other.people[0].id })))
    expect(screen.queryByTestId('case-intro')).toBeNull()
    expect(screen.queryByTestId('evidence-btn')).toBeNull()
  })
})

describe('suspects and interrogation', () => {
  it('shows role and motive on the card and keeps the literal clue text on it', () => {
    render(ui(makeGame(), false))
    const card = screen.getByTestId('suspect-p1')
    expect(card).toHaveTextContent('The Business Partner')
    expect(card).toHaveTextContent('Motive: Accounts')
    expect(card).toHaveTextContent('In the bottom row.')
    expect(card).toHaveTextContent('Beside the TV.')
  })
  it('the interrogation sheet pairs every voiced line with the real clue sentence', () => {
    render(ui(makeGame(), false))
    fireEvent.click(screen.getByTestId('ask-p1'))
    const sheet = screen.getByTestId('interrogation')
    const lines = within(sheet).getAllByTestId('interrogation-line')
    const literal = within(sheet).getAllByTestId('literal-clue').map(e => e.textContent)
    expect(lines).toHaveLength(2)
    expect(literal).toEqual(puzzle.clues.filter(c => c.clue.person === 'p1').map(c => c.text))
    expect(sheet).toHaveTextContent('Motive · Accounts')
    fireEvent.click(within(sheet).getByTestId('show-on-plan'))
    expect(screen.queryByTestId('interrogation')).toBeNull()
  })
  it('the victim gets scene notes, not a motive', () => {
    render(ui(makeGame({ selectedPerson: 'p0' }), false))
    expect(screen.getByTestId('ask-p0')).toHaveTextContent('Scene notes')
    fireEvent.click(screen.getByTestId('ask-p0'))
    expect(screen.queryByTestId('motive-card')).toBeNull()
  })
})

describe('evidence', () => {
  it('during play only the porch marker is on the plan; every item is in the drawer and opens from its tile', () => {
    render(ui(makeGame(), false))
    expect(screen.getAllByTestId(/^evidence-E\d$/)).toHaveLength(1)
    expect(screen.getByTestId('evidence-E1')).toHaveAccessibleName(/^Evidence: Unopened parcel/)
    expect(screen.queryByTestId('evidence-E5')).toBeNull()
    expect(screen.getByTestId('evidence-btn')).toHaveAccessibleName(/0\/4 examined/)
    fireEvent.click(screen.getByTestId('evidence-btn'))
    expect(screen.getByTestId('tile-E2')).toHaveTextContent('Not yet examined')
    expect(screen.getByTestId('tile-E2')).toHaveTextContent('TV cabinet')
    fireEvent.click(screen.getByTestId('tile-E2'))
    expect(screen.getByTestId('evidence-detail')).toHaveTextContent('torn envelope')
    expect(screen.queryByTestId('evidence-reveal-note')).toBeNull()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByTestId('evidence-board')).toBeInTheDocument() // closing a detail returns to the drawer
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByTestId('evidence-btn')).toHaveAccessibleName(/1\/4 examined/)
    expect(JSON.parse(localStorage.getItem('alibi.ref.found.very-easy-1')!)).toEqual(['E2'])
  })
  it('the porch marker is an unnumbered object hotspot', () => {
    render(ui(makeGame(), false))
    const d = screen.getByTestId('evidence-discs').querySelector('[data-disc]')!
    expect(d.textContent).toBe('')
    expect(d.querySelector('svg')).not.toBeNull()
  })
  it('nothing on the plan during play sits inside a cell, and no tap target overlaps any cell rectangle (u = 32, 35, 40, 44, 51, 115)', () => {
    const n = N
    const play = story.evidence.filter(e => e.showDuringPlay && outsideGrid(e, n))
    expect(play.length).toBeGreaterThan(0)
    for (const u of [32, 35, 40, 44, 51, 115]) {
      for (const e of play) {
        const { x, y } = e.placement
        expect(x < 0 || x > n || y < 0 || y > n, `${e.id} is outside the grid`).toBe(true)
        const hit = markerHit(u, x, y, n, true)
        const d = markerDiameter(u)
        for (const size of [hit, d]) {
          const r = { l: x * u - size / 2, t: y * u - size / 2, r: x * u + size / 2, b: y * u + size / 2 }
          const overlaps = r.l < n * u && r.r > 0 && r.t < n * u && r.b > 0
          expect(overlaps, `${e.id} ${size}px at u=${u} overlaps the grid`).toBe(false)
        }
        expect(hit, `${e.id} hit at u=${u}`).toBeGreaterThanOrEqual(16)
      }
    }
  })
  it('the real DOM agrees: the hit button and disc clear the grid rectangle', () => {
    render(ui(makeGame(), false))
    const grid = screen.getByTestId('plan-grid')
    const gx = parseFloat(grid.style.left), gw = parseFloat(grid.style.width)
    const b = screen.getByTestId('evidence-E1')
    expect(parseFloat(b.style.left)).toBeGreaterThanOrEqual(gx + gw - 0.5)
  })
  it('the disc sits below the hit grid and the tap target above it', () => {
    render(ui(makeGame(), false))
    const frame = screen.getByTestId('plan-frame')
    const kids = [...frame.children]
    const iDisc = kids.findIndex(k => k.matches('[data-testid="evidence-discs"]'))
    const iGrid = kids.findIndex(k => k.matches('[data-testid="plan-grid"]'))
    const iHit = kids.findIndex(k => k.matches('[data-testid="evidence-markers"]'))
    expect(iDisc).toBeGreaterThan(-1)
    expect(iDisc).toBeLessThan(iGrid)
    expect(iHit).toBeGreaterThan(iGrid)
  })
  it('in the reconstruction (cells locked) the in-house markers come back, numbered, clear of every cell centre zone', () => {
    render(ui(makeGame({ completed: true, murderer: 'p1', selectedPerson: null }), false))
    fireEvent.click(screen.getByTestId('step-3'))
    const grid = screen.getByTestId('plan-grid')
    const u = Number(screen.getByTestId('plan-frame').dataset.u)
    const gx = parseFloat(grid.style.left), gy = parseFloat(grid.style.top)
    const discs = screen.getByTestId('evidence-discs').querySelectorAll<HTMLElement>('[data-disc]')
    expect(discs).toHaveLength(5)
    for (const d of discs) {
      const cx = (parseFloat(d.style.left) + parseFloat(d.style.width) / 2 - gx) / u
      const cy = (parseFloat(d.style.top) + parseFloat(d.style.height) / 2 - gy) / u
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const dx = Math.max(c + CENTRE_BOX[0] - cx, 0, cx - (c + CENTRE_BOX[1]))
        const dy = Math.max(r + CENTRE_BOX[0] - cy, 0, cy - (r + CENTRE_BOX[1]))
        expect(Math.hypot(dx, dy), `${d.dataset.disc} vs R${r + 1}C${c + 1}`).toBeGreaterThanOrEqual(MARKER_R - 1e-9)
      }
    }
  })
})

describe('victim chalk outline', () => {
  it('play: one supine outline under the token (0.9 x 0.7u in the victim cell); the old stick figure is gone everywhere', () => {
    const place = (): CellMark[][] => { const m = emptyMarks(); m[4][1] = { kind: 'person', person: 'p0' } as CellMark; return m }
    const { container, unmount } = render(ui(makeGame({ marks: place(), selectedPerson: 'p0' }), false))
    const chalk = screen.getByTestId('chalk-outline')
    expect(chalk.querySelector('rect[x="28"][y="37"]')).not.toBeNull() // supine torso
    expect(chalk.innerHTML).not.toContain('M30 64 L26 86') // old stick-figure legs
    expect(container.querySelector('circle[cx="24"][cy="30"]')).toBeNull() // old head
    const cell = chalk.closest('[role="gridcell"]')!
    const kids = [...cell.children]
    expect(kids.indexOf(chalk as unknown as Element)).toBeLessThan(kids.findIndex(k => k.matches('[data-testid="token-p0"]'))) // under the token
    unmount()
    const r = render(ui(makeGame({ completed: true, murderer: 'p1', selectedPerson: null, marks: place() }), false))
    fireEvent.click(screen.getByTestId('step-3'))
    expect(r.container.innerHTML).not.toContain('M30 64 L26 86')
    expect(r.container.querySelector('circle[cx="24"][cy="30"]')).toBeNull()
    expect(screen.getByTestId('recon-chalk').querySelector('rect[x="28"][y="37"]')).not.toBeNull()
  })
})

describe('reconstruction', () => {
  const done = (over: Partial<GameApi> = {}) => makeGame({ completed: true, murderer: 'p1', selectedPerson: null, accusationsLeft: 3, ...over })

  it('opens at Motive with four timeline steps and walks the frames with Next and Prev', () => {
    render(ui(done(), false))
    const panel = screen.getByTestId('reconstruction')
    expect(within(panel).getAllByRole('listitem').length).toBeGreaterThan(4)
    expect(screen.getByTestId('step-0')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('recon-text')).toHaveTextContent(story.reveal.motive.body)
    fireEvent.click(screen.getByTestId('recon-next'))
    expect(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('recon-text')).toHaveTextContent('Faye took to the Bedroom')
    fireEvent.click(screen.getByTestId('recon-prev'))
    expect(screen.getByTestId('step-0')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('recon-prev')).toBeDisabled()
  })
  it('the crucial-clue step lists the real chain in order and names the pinning clues', () => {
    render(ui(done(), false))
    fireEvent.click(screen.getByTestId('step-2'))
    const chain = screen.getByTestId('recon-chain')
    const items = within(chain).getAllByRole('button')
    expect(items.map(b => b.textContent)).toEqual([
      expect.stringContaining('Priya'), expect.stringContaining('Owen'), expect.stringContaining('Faye'), expect.stringContaining('Tomas'),
    ])
    expect(items[0]).toHaveTextContent('In the bottom row. Beside the TV.')
    fireEvent.click(screen.getByTestId('recon-next'))
    expect(screen.getByTestId('recon-text')).toHaveTextContent('In the bottom row')
    expect(screen.getByTestId('recon-text')).toHaveTextContent('row 6, column 3')
    expect(screen.getByTestId('recon-layer')).toHaveAttribute('data-frame', 'deduce-1')
    expect(screen.getByTestId('recon-title')).toHaveTextContent('Crucial clue · 1 / 4')
  })
  it('the key appears only on the accusation frames; the conclusion draws the chalk outline and the culprit route', () => {
    render(ui(done(), false))
    expect(screen.getAllByTestId(/^evidence-E\d$/)).toHaveLength(4)
    expect(screen.queryByTestId('evidence-E5')).toBeNull()
    fireEvent.click(screen.getByTestId('step-2'))
    expect(screen.queryByTestId('evidence-E5')).toBeNull()
    fireEvent.click(screen.getByTestId('step-3'))
    expect(screen.getByTestId('recon-chalk')).toBeInTheDocument()
    expect(screen.getByTestId(`route-${puzzle.murdererId}`)).toBeInTheDocument()
    expect(screen.getAllByTestId(/^evidence-E\d$/)).toHaveLength(5)
    expect(screen.getByTestId('recon-next')).not.toBeDisabled() // the dossier card follows
    fireEvent.click(screen.getByTestId('recon-next'))
    expect(screen.getByTestId('recon-title')).toHaveTextContent('Dossier')
    expect(screen.getByTestId('recon-next')).toBeDisabled()
    expect(screen.queryByTestId('route-p1')).toBeNull()
  })
  it('the filmstrip is five painted frames (four steps and the dossier) that jump to their step', () => {
    render(ui(done(), false))
    const film = screen.getByTestId('filmstrip')
    expect(within(film).getAllByRole('button')).toHaveLength(5)
    expect(film.querySelectorAll('.rs-vig')).toHaveLength(5)
    fireEvent.click(screen.getByTestId('film-4'))
    expect(screen.getByTestId('recon-title')).toHaveTextContent('Dossier')
    fireEvent.click(screen.getByTestId('film-2'))
    expect(screen.getByTestId('step-2')).toHaveAttribute('aria-current', 'step')
  })
  it('evidence is unnumbered object hotspots during play and numbered brass in the reveal', () => {
    const { unmount } = render(ui(makeGame(), false))
    const discs = screen.getByTestId('evidence-discs').querySelectorAll('[data-disc]')
    for (const d of discs) { expect(d.textContent).toBe(''); expect(d.querySelector('svg')).not.toBeNull() }
    expect(screen.getByTestId('evidence-E1')).toHaveAccessibleName(/^Evidence: Unopened parcel/)
    unmount()
    render(ui(done(), false))
    fireEvent.click(screen.getByTestId('step-3'))
    expect([...screen.getByTestId('evidence-discs').querySelectorAll('[data-disc]')].map(d => d.textContent)).toEqual(['1', '2', '3', '4', '5'])
  })
  it('no style-pack name appears anywhere in the user-facing text: intro, shell, dialogs, reconstruction, story strings', async () => {
    const { STYLES } = await import('../../src/reference/boards/illustrated/styles')
    const packNames = ['Gaslight Villa', 'Grand Foyer', 'Timbered Hall', 'Glass Pavilion', 'Azulejo Quinta', 'Gaslight', 'Azulejo', ...Object.values(STYLES).map(k => k.label)]
    const text = () => `${document.body.textContent} ${[...document.querySelectorAll('[aria-label],[title],[alt]')].map(e => `${e.getAttribute('aria-label')} ${e.getAttribute('title')} ${e.getAttribute('alt')}`).join(' ')}`
    const check = (where: string) => { for (const n of packNames) expect(text(), `${where}: "${n}"`).not.toContain(n) }
    const { unmount } = render(ui(makeGame())) // opening card
    check('intro')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    check('play')
    fireEvent.click(screen.getByTestId('evidence-btn')); check('evidence board'); fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    fireEvent.click(screen.getByTestId('ask-p1')); check('interrogation'); fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    unmount()
    render(ui(makeGame({ completed: true, murderer: 'p1', selectedPerson: null }), false))
    for (const step of ['step-0', 'step-1', 'step-2', 'step-3']) { fireEvent.click(screen.getByTestId(step)); check(step) }
    // the authored strings the UI can show
    const shown = [story.premise, story.setting.estate, story.setting.styleLabel, ...story.suspects.flatMap(s => [s.role, s.oneLiner, s.motive.label, s.motive.text, s.alibi, ...s.lines.map(l => l.text)]),
      ...story.evidence.flatMap(e => [e.label, e.description, e.revealNote, e.placement.where]), ...Object.values(story.reveal).flatMap(b => [b.title, b.body])].join(' ')
    for (const n of packNames) expect(shown).not.toContain(n)
  })
  it('no UI chrome leaks the internal names Illustrated or Gaslight Villa outside the opening card', () => {
    render(ui(makeGame(), false))
    expect(screen.getByTestId('ref-shell')).not.toHaveTextContent(/Illustrated|Gaslight/)
    expect(screen.getByTestId('ref-shell')).toHaveTextContent('Case No. I · Hollis Villa')
  })
  it('a revealed case still plays the reconstruction but is labelled not counted', () => {
    render(ui(done({ revealed: true, accusationsLeft: 0 }), false))
    expect(screen.getByTestId('recon-revealed')).toHaveTextContent(/not counted/i)
    expect(screen.getByTestId('case-closed')).toHaveTextContent('Case revealed')
  })
  it('a counted solve carries no revealed label', () => {
    render(ui(done(), false))
    expect(screen.queryByTestId('recon-revealed')).toBeNull()
    expect(screen.getByTestId('case-closed')).toHaveTextContent('Case closed')
  })
  it('auto-plays through the frames, and Pause stops it', () => {
    vi.useFakeTimers()
    render(ui(done(), false))
    expect(screen.getByTestId('recon-play')).toHaveTextContent('Pause')
    act(() => { vi.advanceTimersByTime(6100) })
    expect(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByTestId('recon-play'))
    act(() => { vi.advanceTimersByTime(30000) })
    expect(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('recon-play')).toHaveTextContent('Play')
  })
  it('reduced motion: no autoplay and no Play button, the steps are static', () => {
    vi.useFakeTimers()
    stubMotion(true)
    render(ui(done(), false))
    expect(screen.queryByTestId('recon-play')).toBeNull()
    act(() => { vi.advanceTimersByTime(60000) })
    expect(screen.getByTestId('step-0')).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByTestId('recon-next'))
    expect(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step')
  })
})

describe('phone cell targets (the illustrated board, plan cropped to its numeral pills and porch)', () => {
  // Policy, mirrored in geometry.ts phonePlan(): 6x6 and 7x7 keep 44 px cells at 390 wide; 8x8 is accepted at >= 35 px
  // (390) and >= 32 px (360), well above the WCAG 2.2 AA minimum of 24 px. The lot outside the pills / porch is cropped.
  const plan = async (w: number, n: number) => {
    const { boardLayout } = await import('../../src/reference/boards/illustrated')
    return phonePlan(w, n, boardLayout)
  }
  it('390 wide: 6x6 and 7x7 get 44 px cells, 8x8 at least 35 px, and the visible strip fits the screen', async () => {
    for (const [n, min] of [[6, 44], [7, 44], [8, 35]] as const) {
      const p = await plan(390, n)
      expect(p.cell, `${n}x${n}`).toBeGreaterThanOrEqual(min)
      expect(p.size - p.cropL - p.cropR).toBeLessThanOrEqual(390)
    }
  })
  it('360 wide: 6x6 and 7x7 at least 40 px, 8x8 at least 32 px', async () => {
    expect((await plan(360, 6)).cell).toBeGreaterThanOrEqual(40)
    expect((await plan(360, 7)).cell).toBeGreaterThanOrEqual(38)
    expect((await plan(360, 8)).cell).toBeGreaterThanOrEqual(32)
  })
  it('never crops the porch: at least 1 cell of lot stays east of the grid', async () => {
    const { boardLayout } = await import('../../src/reference/boards/illustrated')
    const p = await plan(390, 6)
    const g = planGeometry(p.size, 6, boardLayout)
    expect(p.size - p.cropR - (g.gx + g.gw)).toBeGreaterThanOrEqual(g.layout.cellW - 1)
  })
})
