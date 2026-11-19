// Depth generator sweep.
//
// Usage (from the repo root):
//   node scripts/depth-sweep.mjs --configs A,B --n 200 --out <dir> [--seed0 1] [--engine onPass|never] [--mode ac|anchored] [--suffix _x] [--attempts 4] [--solver fast|engine] [--minCross k] [--minNeeds k] [--minChain k] [--maxStm x] [--maxCard k] [--minLive k]
//   node scripts/depth-sweep.mjs --catalog --out <dir>     # gate over the shipped 60 cases
//
// Writes <dir>/candidates-<config>.jsonl (one line per candidate, raw metrics, so
// acceptance can be re-thresholded without regenerating) and, for accepted cases,
// <dir>/accepted-<config>.jsonl with the full puzzle. scripts/depth-report.mjs
// turns those into the markdown report.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const flag = name => args.includes(`--${name}`)

const out = resolve(opt('out', resolve(root, 'depth-out')))
mkdirSync(out, { recursive: true })

const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const depth = await vite.ssrLoadModule('/src/core/depth/index.ts')

const round = x => Math.round(x * 100) / 100

if (flag('catalog')) {
  const cases = JSON.parse(readFileSync(resolve(root, 'src/data/catalog.generated.json'), 'utf8'))
  // Two bars. 'strict' scales the sweep tiers to the cast: nobody but the entry pin placed by
  // singles (needsSearch >= people-1) and at least people-2 relational steps. 'loose' only asks
  // for any depth at all (needsSearch >= 1, one cross-person step). Everything else is the gate's default.
  const mk = (name, needs, cross, chain = 0) => ({ name, minNeedsSearch: needs, minCrossSteps: cross, minChainDepth: chain, maxForcedAtStart: 1, maxStatementsMean: 2.5, maxStatementsPerPerson: 3, maxCoordinateShare: 0.25, minLiveSuspects: 3, requireAnchored: false })
  const rows = []
  for (const p of cases) {
    const n = p.people.length
    const strict = depth.depthGate(p, mk('strict', n - 1, n - 2, n - 2), { engine: 'always' })
    const loose = depth.depthGate(p, mk('loose', 1, 1), { engine: 'always' })
    const a = strict.analysis
    rows.push({
      id: p.id, difficulty: p.difficulty, size: p.size, people: n, floors: p.floors ?? 1, clues: a.clues,
      strictPass: strict.pass, strictFailures: strict.failures.map(f => f.code),
      loosePass: loose.pass, looseFailures: loose.failures.map(f => f.code),
      forcedAtStart: a.forcedAtStart, needsSearch: a.needsSearch, crossDirect: a.crossDirect, crossTrans: a.crossTrans,
      laneSetSteps: a.laneSetSteps, pure: a.pure, anchored: a.anchored, statementsMean: round(a.statementsMean), statementsMax: a.statementsMax,
      coordinateShare: round(a.coordinateShare), relationalClues: a.relationalClues, liveSuspects: a.liveSuspects, confined: a.confinedSuspects, confinedKnown: a.confinedKnown, chainDepth: a.chainDepth,
      engineSolutions: strict.engine?.solutions, chainPure: strict.engine?.chainPure,
    })
  }
  writeFileSync(resolve(out, 'catalog-gate.json'), JSON.stringify(rows, null, 1))
  console.log(`catalogue: strict ${rows.filter(r => r.strictPass).length}/${rows.length}, loose ${rows.filter(r => r.loosePass).length}/${rows.length}`)
  await vite.close()
  process.exit(0)
}

const configs = opt('configs', 'A,B,C,D,E').split(',')
const n = Number(opt('n', '200'))
const seed0 = Number(opt('seed0', '1'))
const engine = opt('engine', 'onPass')
const mode = opt('mode', 'ac')
const suffix = opt('suffix', '')
const attempts = Number(opt('attempts', '4'))
const solver = opt('solver', 'fast')
const minCross = opt('minCross', null)
const minNeeds = opt('minNeeds', null)
const minChain = opt('minChain', null)
const maxStm = opt('maxStm', null)
const maxCard = opt('maxCard', null)
const minLive = opt('minLive', null)
const recipe = { ...depth.DEFAULT_RECIPE, mode }

for (const name of configs) {
  const stock = depth.DEPTH_SPECS[name]
  if (!stock) throw new Error(`unknown config ${name}`)
  const spec = { ...stock, tier: { ...stock.tier, requireAnchored: mode === 'anchored', ...(minCross !== null ? { minCrossSteps: Number(minCross) } : {}), ...(minNeeds !== null ? { minNeedsSearch: Number(minNeeds) } : {}), ...(minChain !== null ? { minChainDepth: Number(minChain) } : {}), ...(maxStm !== null ? { maxStatementsMean: Number(maxStm) } : {}), ...(maxCard !== null ? { maxStatementsPerPerson: Number(maxCard) } : {}), ...(minLive !== null ? { minLiveSuspects: Number(minLive) } : {}) } }
  const candPath = resolve(out, `candidates-${name}${suffix}.jsonl`)
  const accPath = resolve(out, `accepted-${name}${suffix}.jsonl`)
  writeFileSync(candPath, '')
  writeFileSync(accPath, '')
  const t0 = Date.now()
  let accepted = 0
  for (let i = 0; i < n; i++) {
    const seed = seed0 + i
    const c = depth.generateDepthCase(spec, seed, { engine, recipe, attempts, solver })
    const a = c.analysis
    const row = {
      config: name, seed, accepted: !!c.puzzle, attempts: c.attempts, firstTry: c.firstTry, rejected: c.rejected, ms: round(c.ms),
      ...(a ? {
        clues: a.clues, pure: a.pure, forcedAtStart: a.forcedAtStart, needsSearch: a.needsSearch, minOwn: a.minOwnCandidates,
        crossDirect: a.crossDirect, crossTrans: a.crossTrans, laneSetSteps: a.laneSetSteps, laneSteps: a.laneSteps, ownSteps: a.ownSteps, rounds: a.rounds, chainDepth: a.chainDepth, confinedKnown: a.confinedKnown, anchored: a.anchored, anchoredCross: a.anchoredCross,
        statementsMean: round(a.statementsMean), statementsMax: a.statementsMax, coordinateShare: round(a.coordinateShare),
        relationalClues: a.relationalClues, liveSuspects: a.liveSuspects, confined: a.confinedSuspects, kindMix: a.kindMix,
      } : {}),
      ...(c.gate?.engine ? { solveMs: round(c.gate.engine.solveMs), chainMs: round(c.gate.engine.chainMs) } : {}),
    }
    appendFileSync(candPath, JSON.stringify(row) + '\n')
    if (c.puzzle) {
      accepted++
      appendFileSync(accPath, JSON.stringify({ seed, puzzle: c.puzzle, analysis: a, engine: c.gate?.engine }) + '\n')
    }
    if ((i + 1) % 20 === 0) console.log(`${name}: ${i + 1}/${n} candidates, ${accepted} accepted, ${Math.round((Date.now() - t0) / 1000)}s`)
  }
  console.log(`${name}: done ${n} candidates, ${accepted} accepted in ${Math.round((Date.now() - t0) / 1000)}s`)
}
await vite.close()
