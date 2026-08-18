import { getGrade2MissionSet, type Grade2Mission } from '../grade2-problems'
import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
} from './contracts'
import type { Grade2ApplicationMissionV1 } from './grade2-adapter'
import { verifyIndependentG2SemesterOneProblem } from './families/g2-1-independent-verifier'
import { verifyG2FactsProblem } from './families/g2-2-facts.oracle'
import { verifyG2LengthDraftProblem } from './families/g2-2-length.oracle'
import { verifyG2PatternProblem } from './families/g2-2-pattern.oracle'
import { verifyG2PlaceValueProblem } from './families/g2-2-place-value.oracle'
import { verifyG2TableGraphProblem } from './families/g2-2-table-graph.oracle'
import { verifyG2TimeProblem } from './families/g2-2-time.oracle'
import { resolveApplicationVisual } from './visual-validator'

type ReplacementDomain = 'applying' | 'reasoning'
type ReplacementVerifier = (problem: GeneratedApplicationProblemV1) => readonly unknown[]

interface ReplacementFamilyRule {
  unitId: string
  packId: string
  packVersion: number
  domain: ReplacementDomain
  verify: ReplacementVerifier | null
}

const SEMESTER_ONE_FAMILIES = new Set([
  'g2-1-place-value-build-number',
  'g2-1-place-value-compare-orders',
  'g2-1-place-value-missing-digit',
  'g2-1-place-value-claim-check',
  'g2-1-place-value-between-check',
  'g2-1-shapes-object-match',
  'g2-1-shapes-border-build',
  'g2-1-shapes-hidden-layer',
  'g2-1-shapes-property-claim',
  'g2-1-shapes-condition-check',
  'g2-1-add-sub-story-total',
  'g2-1-add-sub-missing-start',
  'g2-1-add-sub-strategy-compare',
  'g2-1-add-sub-operation-check',
  'g2-1-length-ruler-gap',
  'g2-1-length-broken-ruler',
  'g2-1-length-estimate-check',
  'g2-1-length-claim-check',
  'g2-1-classification-sort-count',
  'g2-1-classification-missing-count',
  'g2-1-classification-rule-check',
  'g2-1-classification-claim-check',
  'g2-1-multiplication-group-total',
  'g2-1-multiplication-missing-groups',
  'g2-1-multiplication-array-claim',
  'g2-1-multiplication-model-check',
])

const APPLYING_FAMILIES = new Set([
  'g2-1-place-value-build-number',
  'g2-1-place-value-compare-orders',
  'g2-1-shapes-object-match',
  'g2-1-shapes-border-build',
  'g2-1-add-sub-story-total',
  'g2-1-length-ruler-gap',
  'g2-1-classification-sort-count',
  'g2-1-multiplication-group-total',
  'g2-2-place-value-shop-order',
  'g2-2-facts-two-trays',
  'g2-2-length-tool-and-unit',
  'g2-2-time-finish-time',
  'g2-2-table-graph-survey-difference',
  'g2-2-pattern-step-application',
  'g2-length-route-total',
])

const SEMESTER_TWO_RULES: Readonly<Record<string, {
  packVersion: number
  verify: ReplacementVerifier
  families: ReadonlySet<string>
}>> = Object.freeze({
  'g2-2-place-value': {
    packVersion: 1,
    verify: verifyG2PlaceValueProblem,
    families: new Set([
      'g2-2-place-value-shop-order',
      'g2-2-place-value-hidden-hundreds',
      'g2-2-place-value-claim-check',
      'g2-2-place-value-card-constraint',
    ]),
  },
  'g2-2-facts': {
    packVersion: 1,
    verify: verifyG2FactsProblem,
    families: new Set([
      'g2-2-facts-two-trays',
      'g2-2-facts-missing-groups',
      'g2-2-facts-product-error',
      'g2-2-facts-array-check',
    ]),
  },
  'g2-2-length': {
    packVersion: 2,
    verify: verifyG2LengthDraftProblem,
    families: new Set([
      'g2-2-length-tool-and-unit',
      'g2-2-length-estimate-check',
      'g2-2-length-information-check',
      'g2-2-length-method-compare',
    ]),
  },
  'g2-2-time': {
    packVersion: 1,
    verify: verifyG2TimeProblem,
    families: new Set([
      'g2-2-time-finish-time',
      'g2-2-time-find-start',
      'g2-2-time-clock-reading-error',
      'g2-2-time-calendar-check',
    ]),
  },
  'g2-2-table-graph': {
    packVersion: 1,
    verify: verifyG2TableGraphProblem,
    families: new Set([
      'g2-2-table-graph-survey-difference',
      'g2-2-table-graph-missing-category',
      'g2-2-table-graph-claim-error',
      'g2-2-table-graph-key-sufficiency',
    ]),
  },
  'g2-2-pattern': {
    packVersion: 1,
    verify: verifyG2PatternProblem,
    families: new Set([
      'g2-2-pattern-step-application',
      'g2-2-pattern-find-start',
      'g2-2-pattern-broken-term',
      'g2-2-pattern-far-step',
    ]),
  },
})

const HISTORICAL_REPLACEMENT_FAMILIES = new Set([
  'g2-length-route-total',
  'g2-length-missing-segment',
  'g2-length-claim-check',
])

function sameJson(left: unknown, right: unknown): boolean {
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, entry]) => [key, canonical(entry)]))
    }
    return value
  }
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

function semesterOneUnitId(familyId: string): string | null {
  return [
    'g2-1-place-value',
    'g2-1-shapes',
    'g2-1-add-sub',
    'g2-1-length',
    'g2-1-classification',
    'g2-1-multiplication',
  ].find((unitId) => familyId.startsWith(`${unitId}-`)) ?? null
}

function familyRule(familyId: string): ReplacementFamilyRule | null {
  if (HISTORICAL_REPLACEMENT_FAMILIES.has(familyId)) {
    return {
      unitId: 'g2-2-length',
      packId: 'pack-g2-2-length',
      packVersion: 1,
      domain: APPLYING_FAMILIES.has(familyId) ? 'applying' : 'reasoning',
      verify: null,
    }
  }
  if (SEMESTER_ONE_FAMILIES.has(familyId)) {
    const unitId = semesterOneUnitId(familyId)
    if (!unitId) return null
    return {
      unitId,
      packId: `pack-${unitId}`,
      packVersion: 1,
      domain: APPLYING_FAMILIES.has(familyId) ? 'applying' : 'reasoning',
      verify: verifyIndependentG2SemesterOneProblem,
    }
  }
  for (const [unitId, rule] of Object.entries(SEMESTER_TWO_RULES)) {
    if (!rule.families.has(familyId)) continue
    return {
      unitId,
      packId: `pack-${unitId}`,
      packVersion: rule.packVersion,
      domain: APPLYING_FAMILIES.has(familyId) ? 'applying' : 'reasoning',
      verify: rule.verify,
    }
  }
  return null
}

function baseShellMatches(mission: Grade2ApplicationMissionV1, base: Grade2Mission): boolean {
  return (
    mission.id === base.id &&
    mission.unitId === base.unitId &&
    mission.semester === base.semester &&
    mission.mode === 'practice' &&
    mission.cognitiveDomain === base.cognitiveDomain &&
    mission.stageOrder === base.stageOrder &&
    mission.unitMissionOrder === base.unitMissionOrder &&
    mission.skill === base.skill &&
    mission.difficultyStep === base.difficultyStep &&
    mission.curriculumText === base.curriculumText &&
    mission.learnerGoal === base.learnerGoal &&
    mission.parentSummaryTag === base.parentSummaryTag &&
    sameJson(mission.taskActions, base.taskActions) &&
    sameJson(mission.params, base.params) &&
    mission.visualModel === base.visualModel &&
    sameJson(mission.visualConfig, base.visualConfig) &&
    mission.rewardId === base.rewardId
  )
}

function answerContractMatches(mission: Grade2ApplicationMissionV1): boolean {
  if (mission.answerType === 'choice') {
    return sameJson(mission.answerConfig, { kind: 'choice' }) &&
      Array.isArray(mission.choices) &&
      Number.isSafeInteger(mission.correctChoiceIndex) &&
      mission.choices[mission.correctChoiceIndex!] === mission.correctAnswer
  }
  if (mission.answerType === 'time-of-day') {
    return sameJson(mission.answerConfig, {
      kind: 'time-of-day',
      timeMode: 'time-of-day',
      inputLabel: '시각을 써요',
    }) && mission.choices === undefined && mission.correctChoiceIndex === undefined
  }
  return mission.answerType === 'integer' &&
    sameJson(mission.answerConfig, { kind: 'integer', inputLabel: '답을 숫자로 써요' }) &&
    mission.choices === undefined && mission.correctChoiceIndex === undefined
}

function generatedProblemOf(mission: Grade2ApplicationMissionV1): GeneratedApplicationProblemV1 {
  const format = mission.answerType === 'choice'
    ? 'choice' as const
    : mission.answerType === 'time-of-day'
      ? 'text' as const
      : 'number' as const
  return parseGeneratedApplicationProblemV1({
    ...mission.applicationSource,
    params: mission.applicationParams,
    prompt: mission.prompt,
    answer: { format, normalized: mission.correctAnswer },
    ...(mission.choices === undefined ? {} : { choices: mission.choices }),
    ...(mission.correctChoiceIndex === undefined
      ? {}
      : { correctChoiceIndex: mission.correctChoiceIndex }),
    solutionSteps: mission.solutionSteps,
    hintSteps: mission.hintSteps,
    misconceptionRefs: mission.applicationMisconceptionRefs,
    visual: mission.applicationVisual,
  })
}

export function isGrade2ReplacementApplicationMissionSemanticallyValid(
  mission: Grade2ApplicationMissionV1,
  options: { historicalContentValid?: boolean } = {},
): boolean {
  try {
    const placement = mission.applicationPlacement
    const source = mission.applicationSource
    if (
      !placement ||
      placement.schemaVersion !== 'grade2-application-placement-v1' ||
      placement.baseMissionId !== mission.id ||
      !Number.isSafeInteger(placement.baseSeed) ||
      !Number.isSafeInteger(source.seed) ||
      !Number.isSafeInteger(source.variantIndex) ||
      source.variantIndex < 0 ||
      source.generatorVersion !== 1 ||
      source.instanceId !== `${source.familyId}@${source.generatorVersion}:${source.seed}:${source.variantIndex}`
    ) return false

    const rule = familyRule(source.familyId)
    if (
      !rule ||
      mission.unitId !== rule.unitId ||
      mission.cognitiveDomain !== rule.domain ||
      source.packId !== rule.packId ||
      source.packVersion !== rule.packVersion ||
      !sameJson(source.curriculumCodes, mission.directCurriculumCodes) ||
      mission.curriculumCode !== source.curriculumCodes[0]
    ) return false

    const base = getGrade2MissionSet(rule.unitId, 'practice', placement.baseSeed)
      .find(({ id }) => id === placement.baseMissionId)
    if (!base || !baseShellMatches(mission, base) || !answerContractMatches(mission)) return false
    if (mission.visualSemantics !== (mission.applicationVisual.semantics ?? base.visualSemantics)) {
      return false
    }

    const problem = generatedProblemOf(mission)
    if (resolveApplicationVisual(problem.visual).status !== 'ready') return false
    if (rule.verify) return rule.verify(problem).length === 0
    return options.historicalContentValid === true
  } catch {
    return false
  }
}
