// Pick example cases from a sweep and write them out as readable JSON.
//
//   node scripts/depth-examples.mjs --in <sweepDir> --out <dir> [--suffix _anchored] [--per 3] [--pool 8] [--engine]
//
// For each config it ranks the accepted cases (heuristic below), takes the best
// `pool`, optionally proves each with the real engine.countSolutions (this can
// take minutes on two-floor cases, which is itself a finding), and saves the
// best `per` as <out>/<config>-<k>.json.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const inDir = resolve(opt('in', '.'))
const outDir = resolve(opt('out', '.'))
const suffix = opt('suffix', '_anchored')
const per = Number(opt('per', '3'))
const poolSize = Number(opt('pool', '8'))
const withEngine = args.includes('--engine')
const only = opt('configs', 'A,B,C,D,E').split(',')
mkdirSync(outDir, { recursive: true })

const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const eng = await vite.ssrLoadModule('/src/core/engine.ts')
const ded = await vite.ssrLoadModule('/src/reference/story/deduce.ts')
const val = await vite.ssrLoadModule('/src/core/puzzleValidate.ts')
const gen = await vite.ssrLoadModule('/src/core/generate.ts')
const depth = await vite.ssrLoadModule('/src/core/depth/index.ts')

// Rooms that belong on a given storey, per generate.ts's own ROOM_SPECS preferences.
const UPSTAIRS = new Set(['Bedroom', 'Bathroom', 'Study'])
const DOWNSTAIRS = new Set(['Kitchen', 'Dining Room', 'Living Room', 'Pantry', 'Office', 'Porch', 'Front Yard', 'Garden'])
function houseRealism(p) {
  if ((p.floors ?? 1) < 2) return 0
  let ok = 0
  for (const r of p.rooms) {
    const f = r.floor ?? 0
    if ((f === 1 && UPSTAIRS.has(r.name)) || (f === 0 && DOWNSTAIRS.has(r.name))) ok++
  }
  return ok / p.rooms.length
}

function score(row) {
  const a = row.analysis
  const p = row.puzzle
  const kinds = Object.keys(a.kindMix).filter(k => k !== 'victim').length
  return (a.anchored ? a.anchoredCross : a.crossDirect) * 2 - a.statementsMean * 3 - Math.max(0, a.statementsMax - 2) * 1.5
    + kinds * 0.6 + (a.coordinateShare === 0 ? 1 : 0) + a.liveSuspects * 0.3 + houseRealism(p) * 3
    + (a.anchored ? 2 : 0)
}

function board(p) {
  const sym = Object.fromEntries(p.people.map(x => [x.id, x.name[0]]))
  const lines = []
  for (let f = 0; f < (p.floors ?? 1); f++) {
    const map = p.roomOfByFloor ? p.roomOfByFloor[f] : p.roomOf
    lines.push(`floor ${f}`)
    for (let r = 0; r < p.size; r++) {
      let line = ''
      for (let c = 0; c < p.size; c++) {
        const who = p.people.find(x => (p.solution[x.id].floor ?? 0) === f && p.solution[x.id].row === r && p.solution[x.id].col === c)
        const room = p.rooms.find(x => x.id === map[r][c])
        line += `${who ? sym[who.id] + (who.isVictim ? '*' : ' ') : '. '}${room.name.slice(0, 3)} `
      }
      lines.push('  ' + line.trimEnd())
    }
  }
  return lines
}

const summary = {}
for (const cfg of only) {
  const file = resolve(inDir, `accepted-${cfg}${suffix}.jsonl`)
  if (!existsSync(file)) continue
  const rows = readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  const ranked = rows.map(r => ({ r, s: score(r) })).sort((x, y) => y.s - x.s).slice(0, poolSize)
  const checked = []
  for (const { r, s } of ranked) {
    const p = r.puzzle
    let engineInfo = null
    if (withEngine) {
      const t0 = performance.now()
      const count = eng.countSolutions(p, 2)
      const solveMs = performance.now() - t0
      const chain = ded.deduceChain(p)
      engineInfo = { solutions: count, solveMs: Math.round(solveMs), chainPure: chain.pure, murdererOk: eng.findMurderer(p) === p.murdererId }
      if (solveMs < 20000) {
        const issues = val.validatePuzzle(p).filter(i => i.severity === 'error')
        engineInfo.validateErrors = issues.map(i => i.code)
      }
      console.log(cfg, 'seed', r.seed, 'score', s.toFixed(1), JSON.stringify(engineInfo))
    }
    checked.push({ r, s, engineInfo })
  }
  checked.slice(0, per).forEach(({ r, s, engineInfo }, k) => {
    const p = r.puzzle
    const readable = p.clues.map(ct => `${p.people.find(x => x.id === ct.clue.person).name}: ${ct.text}`)
    // The sentences must be the ones generate.ts words: regenerate and compare.
    const reworded = p.clues.every(ct => gen.clueToText(p, ct.clue) === ct.text)
    const gate = depth.depthGate(p, { ...depth.DEPTH_SPECS[cfg].tier, requireAnchored: suffix.includes('anchored') }, { engine: 'never' })
    const doc = {
      config: cfg, seed: r.seed, rank: k + 1, score: Math.round(s * 10) / 10,
      houseRealism: Math.round(houseRealism(p) * 100) / 100,
      textMatchesClueToText: reworded, gatePass: gate.pass,
      victim: p.people.find(x => x.id === p.victimId).name,
      murderer: p.people.find(x => x.id === p.murdererId).name,
      readable, board: board(p),
      chainKind: r.analysis.anchoredSteps?.length ? 'forward chain (anchored): every step leans only on someone already placed' : 'pairwise consistency order',
      chain: (r.analysis.anchoredSteps?.length ? r.analysis.anchoredSteps : r.analysis.steps).map(st => `${st.n}. ${p.people.find(x => x.id === st.person).name} [${st.via}]`),
      analysis: r.analysis, engineChecks: engineInfo ?? r.engine,
      puzzle: p,
    }
    writeFileSync(resolve(outDir, `${cfg}-${k + 1}.json`), JSON.stringify(doc, null, 1))
    summary[`${cfg}-${k + 1}`] = { seed: r.seed, score: doc.score, realism: doc.houseRealism, engine: engineInfo }
  })
}
writeFileSync(resolve(outDir, 'index.json'), JSON.stringify(summary, null, 1))
console.log(JSON.stringify(summary))
await vite.close()
