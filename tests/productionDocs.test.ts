import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('permanent production instructions', () => {
  it('requires every puzzle and scene author to read the canonical manual', () => {
    const agents = read('AGENTS.md')

    expect(agents).toContain('docs/OPUS_PRODUCTION_MANUAL.md')
    expect(agents).toContain('main')
    expect(agents).toContain('checkpoint/fable-5.1-interrupted-2026-09-02')
  })

  it('defines validation, release, branch and escalation boundaries', () => {
    const manual = read('docs/OPUS_PRODUCTION_MANUAL.md')

    expect(manual).toContain('npm run validate:production')
    expect(manual).toContain('npm run report:puzzles')
    expect(manual).toContain('opus/scene-batch-01')
    expect(manual).toContain('SYSTEM ESCALATION')
    expect(manual).toContain('offsetCol: -0.15')
    expect(manual).toContain('lift: 20')
  })

  it('keeps the complete Kenney survey and evidence-based roadmap', () => {
    const survey = read('docs/KENNEY_PACK_SURVEY.md')
    const roadmap = read('docs/KENNEY_ENVIRONMENT_EXPANSION.md')

    expect(survey).toContain('50 pacotes')
    expect(survey).toContain('DIRECT')
    expect(survey).toContain('ADAPTER')
    expect(survey).toContain('SPECIAL PURPOSE')
    expect(survey).toContain('NOT RELEVANT')
    expect(roadmap).toContain('Nível 1')
    expect(roadmap).toContain('Nível 2')
    expect(roadmap).toContain('Nível 3')
  })

  it('keeps the release QA report and its deliberate reference render set', () => {
    const report = read('docs/QA_RELEASE_REPORT.md')
    const referenceIndex = read('docs/reference/README.md')
    const requiredRenders = [
      'midnight-delivery-environment.png',
      'midnight-delivery-interaction.png',
      'midnight-delivery-case-closed.png',
      'midnight-delivery-mobile.png',
      'empty-chair-environment.png',
      'empty-chair-transition.png',
      'empty-chair-landscaping.png',
      'last-nightcap-environment.png',
      'last-nightcap-window-wall.png',
      'last-nightcap-service.png',
      'two-storey-ground-ghost.png',
      'two-storey-upper-ghost.png',
      'two-storey-exploded.png',
      'two-storey-stairs.png',
      'two-storey-stairwell.png',
      'two-storey-mobile.png',
    ]

    expect(report).toContain('351 testes passaram')
    expect(report).toContain('60 casos')
    expect(referenceIndex).toContain('07/09/2026')
    for (const render of requiredRenders) {
      expect(referenceIndex).toContain(render)
      expect(existsSync(join(process.cwd(), 'docs/reference', render))).toBe(true)
    }
  })
})
