// Choose the 12 casebook cases from batch sweeps and print the CASEBOOK_PLAN entries.
//   node scripts/depth-pick-casebook.mjs <sweepDir> [suffix=_batch]
// Targets (config:chain depth), a ramp from short chains to long ones:
//   B 3,3,4,4   C 3,4,4,5   D 4,4,5,5
// Within a (config, depth) cell the best-scoring accepted case wins: few statements,
// room-level and furniture clues over direction, kind variety, many live suspects and,
// on two floors, every room on a sensible storey.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [dirArg, suffix = '_batch'] = process.argv.slice(2)
const dir = resolve(dirArg)
const TARGETS = { B: [3, 3, 4, 4], C: [3, 4, 4, 5], D: [4, 4, 5, 5] }
const MIN_CHAIN = { B: 3, C: 3, D: 4 }
const RANK = { B: 0, C: 1, D: 2 }
const UP = new Set(['Bedroom', 'Bathroom', 'Study'])
const DOWN = new Set(['Kitchen', 'Dining Room', 'Living Room', 'Pantry', 'Office', 'Porch', 'Front Yard', 'Garden'])
const realism = p => {
  if ((p.floors ?? 1) < 2) return 1
  return p.rooms.filter(r => ((r.floor ?? 0) === 1 && UP.has(r.name)) || ((r.floor ?? 0) === 0 && DOWN.has(r.name))).length / p.rooms.length
}
const score = r => {
  const a = r.analysis
  const kinds = Object.keys(a.kindMix).filter(k => k !== 'victim').length
  return (a.anchoredCross) * 1 - a.statementsMean * 3 - Math.max(0, a.statementsMax - 2) * 1.5 + kinds * 0.6
    + a.roomLevelShare * 6 - a.directionShare * 4 + a.liveSuspects * 0.3 + realism(r.puzzle) * 4
}
const picks = []
for (const cfg of ['B', 'C', 'D']) {
  const rows = readFileSync(resolve(dir, `accepted-${cfg}${suffix}.jsonl`), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  const used = new Set()
  for (const depth of TARGETS[cfg]) {
    const cell = rows.filter(r => r.analysis.chainDepth === depth && !used.has(r.seed)).sort((x, y) => score(y) - score(x))
    if (!cell.length) { console.error(`no ${cfg} case with chain depth ${depth}`); process.exit(1) }
    used.add(cell[0].seed)
    picks.push({ config: cfg, seed: cell[0].seed, depth, minChainDepth: MIN_CHAIN[cfg], score: score(cell[0]) })
  }
}
picks.sort((x, y) => x.depth - y.depth || RANK[x.config] - RANK[y.config] || y.score - x.score)
const lines = picks.map((p, i) => {
  const n = String(i + 1).padStart(2, '0')
  return `  { id: 'pt-${n}', title: 'Casebook Case ${n}', config: '${p.config}', seed: ${p.seed}, minChainDepth: ${p.minChainDepth} }, // chain depth ${p.depth}`
})
console.log(lines.join('\n'))
