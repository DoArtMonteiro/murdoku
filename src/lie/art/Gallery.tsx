// Dev preview of the visual identity: every emblem at 28 / 40 / 64, every furniture piece,
// and the case-0 plan in the states the game uses. The orchestrator wires it to a route.
import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import type { Cell, FurnitureType, Puzzle } from '../../core/types'
import { case0 } from '../../tutorial/case0'
import type { EmblemId } from '../model'
import '../tokens.css'
import './art.css'
import './gallery.css'
import { EMBLEM_IDS, Emblem } from './emblems'
import { FurniturePiece } from './furniture'
import { TilePlan, cellKey } from './TilePlan'

const FURNITURE: FurnitureType[] = [
  'chair', 'sofa', 'bed', 'table', 'box', 'rug', 'plant', 'shrub', 'lamp', 'counter',
  'tv', 'bathtub', 'bookshelf', 'stove', 'fridge', 'clock', 'desk', 'toilet', 'shower',
]
const SIZES: Partial<Record<FurnitureType, { w: number; h: number }>> = {
  sofa: { w: 2, h: 1 }, bed: { w: 2, h: 2 }, table: { w: 2, h: 1 }, rug: { w: 2, h: 2 },
  counter: { w: 2, h: 1 }, tv: { w: 2, h: 1 }, bathtub: { w: 2, h: 1 }, bookshelf: { w: 2, h: 1 },
  desk: { w: 2, h: 1 },
}

const PEOPLE: Record<string, { name: string; emblem: EmblemId }> = {
  p0: { name: 'Lena', emblem: 'scales' },
  p1: { name: 'Tomas', emblem: 'net' },
  p2: { name: 'Greta', emblem: 'lantern' },
  p3: { name: 'Marco', emblem: 'bell' },
}

/** case 0 plus a 2x1 sofa at 180 and a 1x2 counter at 270, so the rotated footprints show. */
const withRotated: Puzzle = {
  ...case0,
  furniture: [
    ...case0.furniture.filter(f => !(f.type === 'chair')),
    { type: 'sofa', row: 3, col: 1, w: 2, h: 1, rotation: 180, floor: 0 },
    { type: 'counter', row: 0, col: 2, w: 1, h: 2, rotation: 270, floor: 0 },
  ],
}

const set = (...cells: Cell[]) => new Set(cells.map(cellKey))

export function Gallery(): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>(undefined)
  const [last, setLast] = useState('tap a tile, or hold one')
  const tokens = useMemo(() => ({ p0: case0.solution.p0, p1: case0.solution.p1, p3: case0.solution.p3 }), [])

  return (
    <div className="lg" data-theme={theme}>
      <header className="lg-head">
        <h1>Portinhal, in tile</h1>
        <div role="group" aria-label="Theme">
          {([undefined, 'light', 'dark'] as const).map(t => (
            <button key={t ?? 'auto'} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t ?? 'auto'}</button>
          ))}
        </div>
      </header>

      <section aria-labelledby="lg-emblems">
        <h2 id="lg-emblems">Emblems</h2>
        {[28, 40, 64].map(size => (
          <div className="lg-row" key={size}>
            {EMBLEM_IDS.map(id => <Emblem key={id} id={id} size={size} title={id} />)}
          </div>
        ))}
      </section>

      <section aria-labelledby="lg-furniture">
        <h2 id="lg-furniture">Furniture</h2>
        <div className="lg-row lg-furn">
          {FURNITURE.map(type => {
            const s = SIZES[type] ?? { w: 1, h: 1 }
            return (
              <figure key={type}>
                <svg className="lg-piece" viewBox={`-8 -8 ${s.w * 100 + 16} ${s.h * 100 + 16}`} width={s.w * 84} height={s.h * 84} role="img" aria-label={type}>
                  <FurniturePiece f={{ type, row: 0, col: 0, ...s, rotation: 0 }} />
                </svg>
                <figcaption>{type}</figcaption>
              </figure>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="lg-plan">
        <h2 id="lg-plan">The plan</h2>
        <p className="lg-note">{last}</p>
        <div className="lg-plans">
          <TilePlan
            puzzle={case0}
            people={PEOPLE}
            tokens={tokens}
            victimId="p3"
            selectedPerson="p0"
            lit={set({ row: 0, col: 2 }, { row: 0, col: 3 })}
            blocked={set({ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 1 })}
            collision={set({ row: 3, col: 0 })}
            ghost={{ person: 'p2', cell: { row: 0, col: 3 } }}
            onTile={c => setLast(`tile ${c.row + 1},${c.col + 1}`)}
            onTileHold={c => setLast(`hold ${c.row + 1},${c.col + 1}`)}
          />
          <TilePlan
            puzzle={withRotated}
            people={PEOPLE}
            tokens={tokens}
            victimId="p3"
            lifted="p1"
            murderer="p0"
          />
        </div>
      </section>
    </div>
  )
}

export default Gallery
