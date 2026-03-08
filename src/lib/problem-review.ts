import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { generateProblems } from './problem-generator'
import type { Concept, Problem, ProblemTemplate, Unit } from './types'

const REVIEW_SEEDS: Record<'A' | 'B' | 'C', number> = {
  A: 11,
  B: 29,
  C: 47,
}

const CHOICE_LABELS = ['①', '②', '③', '④']

export interface ProblemReviewRow {
  conceptId: string
  conceptTitle: string
  unitId: string
  unitTitle: string
  setId: 'A' | 'B' | 'C'
  difficulty: 1 | 2 | 3
  type: 'choice' | 'number'
  templateId: string
  prompt: string
  correctAnswer: string
  correctChoiceLabel: string | null
  choices: string[]
  params: Record<string, number>
}

export interface ProblemReviewSummary {
  totalConcepts: number
  totalProblems: number
  totalChoiceProblems: number
  totalNumberProblems: number
}

export interface ProblemReviewData {
  summary: ProblemReviewSummary
  concepts: Array<{
    id: string
    title: string
    unitTitle: string
    rowCount: number
  }>
  rows: ProblemReviewRow[]
}

async function readJsonFile<T>(...segments: string[]): Promise<T> {
  const filePath = path.join(process.cwd(), ...segments)
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

function getTemplateFileName(conceptId: string) {
  return `${conceptId.split('-')[0]}.json`
}

function sortConcepts(concepts: Concept[], units: Unit[]) {
  const unitOrderById = Object.fromEntries(units.map(unit => [unit.id, unit.order]))

  return [...concepts].sort((left, right) => {
    const unitOrderDiff = (unitOrderById[left.unit_id] ?? 0) - (unitOrderById[right.unit_id] ?? 0)
    if (unitOrderDiff !== 0) return unitOrderDiff

    const conceptOrderDiff = left.order - right.order
    if (conceptOrderDiff !== 0) return conceptOrderDiff

    return left.id.localeCompare(right.id)
  })
}

function sortProblems(
  problems: Problem[],
  templatesById: Record<string, ProblemTemplate>
) {
  return [...problems].sort((left, right) => {
    const difficultyDiff =
      (templatesById[left.templateId]?.difficulty ?? 0) -
      (templatesById[right.templateId]?.difficulty ?? 0)
    if (difficultyDiff !== 0) return difficultyDiff

    return left.templateId.localeCompare(right.templateId)
  })
}

function toReviewRow(
  problem: Problem,
  concept: Concept,
  unitTitle: string,
  templatesById: Record<string, ProblemTemplate>
): ProblemReviewRow {
  const template = templatesById[problem.templateId]

  return {
    conceptId: concept.id,
    conceptTitle: concept.concept_title,
    unitId: concept.unit_id,
    unitTitle,
    setId: problem.setId,
    difficulty: template.difficulty,
    type: problem.type,
    templateId: problem.templateId,
    prompt: problem.prompt,
    correctAnswer: problem.correctAnswer,
    correctChoiceLabel:
      problem.type === 'choice' && typeof problem.correctChoiceIndex === 'number'
        ? CHOICE_LABELS[problem.correctChoiceIndex] ?? null
        : null,
    choices: problem.choices ?? [],
    params: problem.params,
  }
}

export async function getProblemReviewData(): Promise<ProblemReviewData> {
  const [units, concepts] = await Promise.all([
    readJsonFile<Unit[]>('public', 'data', 'units.json'),
    readJsonFile<Concept[]>('public', 'data', 'concepts.json'),
  ])

  const unitTitleById = Object.fromEntries(units.map(unit => [unit.id, unit.title]))
  const sortedConcepts = sortConcepts(concepts, units)
  const rows: ProblemReviewRow[] = []

  for (const concept of sortedConcepts) {
    const templates = await readJsonFile<ProblemTemplate[]>(
      'public',
      'data',
      'templates',
      getTemplateFileName(concept.id)
    )
    const conceptTemplates = templates.filter(template => template.concept_id === concept.id)
    const templatesById = Object.fromEntries(
      conceptTemplates.map(template => [template.id, template])
    )

    for (const setId of ['A', 'B', 'C'] as const) {
      const generatedProblems = generateProblems(conceptTemplates, {
        count: 10,
        setId,
        seed: REVIEW_SEEDS[setId],
      })

      rows.push(
        ...sortProblems(generatedProblems, templatesById).map(problem =>
          toReviewRow(problem, concept, unitTitleById[concept.unit_id] ?? concept.unit_id, templatesById)
        )
      )
    }
  }

  const conceptsSummary = sortedConcepts.map(concept => ({
    id: concept.id,
    title: concept.concept_title,
    unitTitle: unitTitleById[concept.unit_id] ?? concept.unit_id,
    rowCount: rows.filter(row => row.conceptId === concept.id).length,
  }))

  return {
    summary: {
      totalConcepts: conceptsSummary.length,
      totalProblems: rows.length,
      totalChoiceProblems: rows.filter(row => row.type === 'choice').length,
      totalNumberProblems: rows.filter(row => row.type === 'number').length,
    },
    concepts: conceptsSummary,
    rows,
  }
}
