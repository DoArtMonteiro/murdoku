// Turn sweep output (candidates-*.jsonl) into markdown tables.
//   node scripts/depth-report.mjs <sweepDir> [suffix ...]      e.g.  _anchored _ac
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [dirArg, ...suffixes] = process.argv.slice(2)
const dir = resolve(dirArg)
const CONFIGS = ['A', 'B', 'C', 'D', 'E']
const DESC = { A: '5 people, 5x5, 1 floor', B: '6 people, 6x6, 1 floor', C: '6 people, 8x8, 1 floor', D: '6 people, 8x8, 2 floors', E: '7 people, 7x7, 1 floor' }

const load = (cfg, suffix) => {
  const f = resolve(dir, `candidates-${cfg}${suffix}.jsonl`)
  return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : null
}
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN)
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-')
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-')
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(0)}%` : '-')
const hist = (a) => {
  const h = {}
  for (const x of a) h[x] = (h[x] ?? 0) + 1
  return Object.keys(h).map(Number).sort((x, y) => x - y).map(k => `${k}:${h[k]}`).join(' ')
}
const quant = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN }

for (const suffix of suffixes) {
  console.log(`\n### Sweep \`${suffix}\`\n`)
  console.log('| config | shape | candidates | accepted | first-try | ms/candidate | ms/accepted (wall) | rejects (count of candidates failing each check) |')
  console.log('|---|---|---|---|---|---|---|---|')
  for (const cfg of CONFIGS) {
    const rows = load(cfg, suffix)
    if (!rows) continue
    const acc = rows.filter(r => r.accepted)
    const rej = {}
    for (const r of rows) for (const c of r.rejected) rej[c] = (rej[c] ?? 0) + 1
    const wall = rows.reduce((s, r) => s + r.ms, 0)
    console.log(`| ${cfg} | ${DESC[cfg]} | ${rows.length} | ${acc.length} (${pct(acc.length, rows.length)}) | ${pct(rows.filter(r => r.firstTry).length, rows.length)} | ${f1(mean(rows.map(r => r.ms)))} | ${f1(acc.length ? wall / acc.length : NaN)} | ${Object.entries(rej).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '-'} |`)
  }
  console.log('\nAccepted cases only (histograms are value:count):\n')
  console.log('| config | clues (mean) | statements/person mean (min..max) | max on one card | forcedAtStart | needsSearch | cross-person steps | lane-only steps | chain depth | live suspects (mean) | relational clues (mean) | coordinate share | engine-free solve ms (fast solver, mean/max) |')
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const cfg of CONFIGS) {
    const rows = load(cfg, suffix)
    if (!rows) continue
    const acc = rows.filter(r => r.accepted)
    if (!acc.length) { console.log(`| ${cfg} | no accepted cases |`); continue }
    const sm = acc.map(r => r.statementsMean)
    console.log(`| ${cfg} | ${f1(mean(acc.map(r => r.clues)))} | ${f2(mean(sm))} (${f2(Math.min(...sm))}..${f2(Math.max(...sm))}) | ${hist(acc.map(r => r.statementsMax))} | ${hist(acc.map(r => r.forcedAtStart))} | ${hist(acc.map(r => r.needsSearch))} | ${hist(acc.map(r => r.crossDirect))} | ${hist(acc.map(r => r.laneSetSteps + r.laneSteps))} | ${hist(acc.map(r => r.chainDepth ?? 0))} | ${f1(mean(acc.map(r => r.liveSuspects)))} | ${f1(mean(acc.map(r => r.relationalClues)))} | ${f2(mean(acc.map(r => r.coordinateShare)))} | ${f1(mean(acc.map(r => r.solveMs ?? NaN)))}/${f1(Math.max(...acc.map(r => r.solveMs ?? 0)))} |`)
  }
  console.log('\nClue-kind mix of accepted cases (share of all clues):\n')
  const kinds = new Set()
  const mixes = {}
  for (const cfg of CONFIGS) {
    const rows = load(cfg, suffix)
    if (!rows) continue
    const acc = rows.filter(r => r.accepted)
    const tot = {}
    let n = 0
    for (const r of acc) for (const [k, v] of Object.entries(r.kindMix ?? {})) { tot[k] = (tot[k] ?? 0) + v; n += v; kinds.add(k) }
    mixes[cfg] = { tot, n }
  }
  const ks = [...kinds].sort()
  console.log(`| kind | ${Object.keys(mixes).join(' | ')} |`)
  console.log(`|---|${Object.keys(mixes).map(() => '---').join('|')}|`)
  for (const k of ks) console.log(`| ${k} | ${Object.keys(mixes).map(c => pct(mixes[c].tot[k] ?? 0, mixes[c].n)).join(' | ')} |`)
  console.log('\nQuantiles of accepted statements per person (p10 / p50 / p90) and ms per accepted candidate:\n')
  for (const cfg of CONFIGS) {
    const rows = load(cfg, suffix)
    if (!rows) continue
    const acc = rows.filter(r => r.accepted)
    if (!acc.length) continue
    const sm = acc.map(r => r.statementsMean)
    const ms = acc.map(r => r.ms)
    console.log(`- ${cfg}: statements ${f2(quant(sm, 0.1))} / ${f2(quant(sm, 0.5))} / ${f2(quant(sm, 0.9))}; ms ${f1(quant(ms, 0.1))} / ${f1(quant(ms, 0.5))} / ${f1(quant(ms, 0.9))}`)
  }
}
