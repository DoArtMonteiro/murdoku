import type { Difficulty, Puzzle } from './types'
import {
  validatePuzzleForProduction,
  type DifficultyMetrics,
  type PuzzleIssue,
  type PuzzleIssueCode,
} from './puzzleValidate'

const DIFFICULTIES: Difficulty[] = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']

export interface MetricRange {
  min: number
  max: number
  mean: number
}

export interface PuzzleCatalogCaseReport {
  id: string
  caseNumber: string
  title: string
  difficulty: Difficulty
  floors: number
  issues: PuzzleIssue[]
  metrics: DifficultyMetrics | null
}

export interface PuzzleCatalogReport {
  schemaVersion: 1
  catalogSize: number
  summary: {
    hardErrors: number
    warnings: number
    casesWithWarnings: number
  }
  byDifficulty: Record<Difficulty, {
    cases: number
    hardErrors: number
    warnings: number
    metrics: Record<keyof DifficultyMetrics, MetricRange>
  }>
  cases: PuzzleCatalogCaseReport[]
  unclassifiedFailures: Array<{
    caseId: string
    issueCodes: PuzzleIssueCode[]
    classification: 'UNCLASSIFIED'
  }>
}

const metricKeys: Array<keyof DifficultyMetrics> = [
  'people', 'clues', 'forcedAtStart', 'forcedBySingles', 'needsSearch',
  'meanCandidates', 'startingCandidateEntropy', 'propagationRounds',
  'relationalClues', 'crossFloorClues', 'redundantClues', 'meanDirectness',
]

function range(values: number[]): MetricRange {
  if (!values.length) return { min: 0, max: 0, mean: 0 }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
  }
}

function ranges(cases: PuzzleCatalogCaseReport[]): Record<keyof DifficultyMetrics, MetricRange> {
  return Object.fromEntries(metricKeys.map(key => [
    key,
    range(cases.flatMap(item => item.metrics ? [item.metrics[key]] : [])),
  ])) as Record<keyof DifficultyMetrics, MetricRange>
}

export function buildPuzzleCatalogReport(puzzles: readonly Puzzle[]): PuzzleCatalogReport {
  const cases = puzzles.map((puzzle): PuzzleCatalogCaseReport => {
    const result = validatePuzzleForProduction(puzzle)
    return {
      id: puzzle.id,
      caseNumber: puzzle.caseNumber,
      title: puzzle.title,
      difficulty: puzzle.difficulty,
      floors: puzzle.floors ?? 1,
      issues: result.issues,
      metrics: result.metrics ?? null,
    }
  })
  const errors = cases.flatMap(item => item.issues.filter(issue => issue.severity === 'error'))
  const warnings = cases.flatMap(item => item.issues.filter(issue => issue.severity === 'warning'))
  const byDifficulty = Object.fromEntries(DIFFICULTIES.map(difficulty => {
    const tier = cases.filter(item => item.difficulty === difficulty)
    return [difficulty, {
      cases: tier.length,
      hardErrors: tier.flatMap(item => item.issues.filter(issue => issue.severity === 'error')).length,
      warnings: tier.flatMap(item => item.issues.filter(issue => issue.severity === 'warning')).length,
      metrics: ranges(tier),
    }]
  })) as PuzzleCatalogReport['byDifficulty']
  const unclassifiedFailures = cases.flatMap(item => {
    const issueCodes = item.issues.filter(issue => issue.severity === 'error').map(issue => issue.code)
    return issueCodes.length ? [{ caseId: item.id, issueCodes, classification: 'UNCLASSIFIED' as const }] : []
  })

  return {
    schemaVersion: 1,
    catalogSize: cases.length,
    summary: {
      hardErrors: errors.length,
      warnings: warnings.length,
      casesWithWarnings: cases.filter(item => item.issues.some(issue => issue.severity === 'warning')).length,
    },
    byDifficulty,
    cases,
    unclassifiedFailures,
  }
}

/** Stable, review-friendly JSON: derived decimals are rounded, counts stay exact. */
export function serializePuzzleCatalogReport(report: PuzzleCatalogReport): string {
  return `${JSON.stringify(report, (_key, value: unknown) => (
    typeof value === 'number' && !Number.isInteger(value) ? Number(value.toFixed(4)) : value
  ), 2)}\n`
}
