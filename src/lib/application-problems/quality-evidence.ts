import type { ApplicationProblemFamilyV1, GeneratedApplicationProblemV1 } from './contracts'
import type { ApplicationProofOracleInputV1 } from './proof'
import { G2_LENGTH_PROOF_AUTHORITY_ENTRIES, G2_LENGTH_EXHAUSTIVE_PROOFS } from './families/g2-length-proof-registration'
import {
  G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1,
  G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1,
} from './families/grade5-geometry-proof-registration'
import { G6_RATIO_PROOF_AUTHORITIES, G6_RATIO_PROOFS } from './families/g6-ratio-proof'
import { generateApplicationProblem } from './generator'
import { APPLICATION_PROBLEM_REGISTRY_V1 } from './registered-families'
import { resolveApplicationVisual } from './visual-validator'

interface FamilyIdentity {
  familyId: string
  version: number
  proofMode: ApplicationProblemFamilyV1['proofMode']
}

interface ProofAuthorityEvidence {
  familyId: string
  familyVersion: number
  mode: ApplicationProblemFamilyV1['proofMode']
  expectedCount: number
  authorityId: string
}

interface ProofReportEvidence {
  family: FamilyIdentity
  mode: ApplicationProblemFamilyV1['proofMode']
  proven: boolean
  checkedCount: number
  issues: string[]
}

export interface ApplicationFamilyQualityEvidenceRow {
  key: string
  familyId: string
  version: number
  status: 'passed' | 'failed'
  deterministicSample: boolean
  proof: {
    mode: ApplicationProblemFamilyV1['proofMode']
    authorityId: string | null
    expectedCount: number
    proven: boolean
    checkedCount: number
    issues: string[]
  }
  audit: {
    status: 'passed' | 'failed'
    issues: string[]
  }
}

export interface ApplicationFamilyQualityEvidenceInput {
  families: readonly FamilyIdentity[]
  generatedSnapshots: readonly {
    family: FamilyIdentity
    seed: number
    first: unknown
    second: unknown
  }[]
  proofAuthorities?: readonly ProofAuthorityEvidence[]
  proofReports: readonly ProofReportEvidence[]
  oracleResults: readonly { family: FamilyIdentity; valid: boolean }[]
  visualResults: readonly { family: FamilyIdentity; valid: boolean; reason?: string }[]
  answerExposureResults: readonly { family: FamilyIdentity; exposed: boolean }[]
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function familyKey(family: Pick<FamilyIdentity, 'familyId' | 'version'>): string {
  return `${family.familyId}@${family.version}`
}

function normalizeOracleAnswer(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as { normalized?: unknown }).normalized === 'string') {
    return (value as { normalized: string }).normalized
  }
  return undefined
}

function proofCases(proof: {
  domain: { cases: readonly { caseId: string; seed: number }[]; variantIndexes: readonly number[] }
}) {
  return proof.domain.cases.flatMap((entry) => proof.domain.variantIndexes.map((variantIndex) => ({
    caseId: entry.caseId,
    seed: entry.seed,
    variantIndex,
  })))
}

function executeDeclaredProof(input: {
  family: FamilyIdentity
  mode: ApplicationProblemFamilyV1['proofMode']
  expectedCount: number | undefined
  cases: readonly { caseId: string; seed: number; variantIndex: number }[]
  generate: (input: { seed: number; variantIndex: number }) => GeneratedApplicationProblemV1
  evaluate: (input: ApplicationProofOracleInputV1) => unknown
}): ProofReportEvidence {
  const issues: string[] = []
  let checkedCount = 0
  if (input.mode !== input.family.proofMode) issues.push('declared proof mode does not match the family')
  if (input.cases.length !== input.expectedCount) {
    issues.push(`declared proof domain has ${input.cases.length}, expected ${input.expectedCount}`)
  }
  input.cases.forEach((testCase) => {
    try {
      const problem = input.generate(testCase)
      const answer = normalizeOracleAnswer(input.evaluate({
        ...testCase,
        params: problem.params,
        mathModel: problem.visual.mathModel,
      }))
      if (problem.answer.normalized !== answer) {
        issues.push(`${testCase.caseId}:${testCase.variantIndex} generated answer disagrees with declared oracle`)
      } else {
        checkedCount += 1
      }
    } catch (error) {
      issues.push(`${testCase.caseId}:${testCase.variantIndex} ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  return {
    family: input.family,
    mode: input.mode,
    proven: issues.length === 0,
    checkedCount,
    issues,
  }
}

function collectPublicBeforeText(value: unknown, collected: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectPublicBeforeText(entry, collected))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => {
      if (key === 'after') return
      if (key === 'before' && entry && typeof entry === 'object' && typeof (entry as { text?: unknown }).text === 'string') {
        collected.push((entry as { text: string }).text)
      }
      collectPublicBeforeText(entry, collected)
    })
  }
  return collected
}

function answerIsPublicBeforeSubmission(problem: GeneratedApplicationProblemV1): boolean {
  const answer = problem.answer.normalized
  return answer.trim() !== '' && collectPublicBeforeText(problem.visual).some((text) => text.trim() === answer)
}

export function buildApplicationFamilyEvidence(
  input: ApplicationFamilyQualityEvidenceInput,
): { rows: ApplicationFamilyQualityEvidenceRow[] } {
  const snapshotByFamily = new Map(input.generatedSnapshots.map((snapshot) => [familyKey(snapshot.family), snapshot]))
  const authorityByFamily = new Map((input.proofAuthorities ?? []).map((authority) => [
    `${authority.familyId}@${authority.familyVersion}`,
    authority,
  ]))
  const proofByFamily = new Map(input.proofReports.map((proof) => [familyKey(proof.family), proof]))
  const oracleByFamily = new Map(input.oracleResults.map((result) => [familyKey(result.family), result]))
  const visualByFamily = new Map(input.visualResults.map((result) => [familyKey(result.family), result]))
  const exposureByFamily = new Map(input.answerExposureResults.map((result) => [familyKey(result.family), result]))

  return {
    rows: input.families.map((family) => {
      const key = familyKey(family)
      const snapshot = snapshotByFamily.get(key)
      const authority = authorityByFamily.get(key)
      const proof = proofByFamily.get(key)
      const oracle = oracleByFamily.get(key)
      const visual = visualByFamily.get(key)
      const exposure = exposureByFamily.get(key)
      const deterministicSample = snapshot
        ? stableJson(snapshot.first) === stableJson(snapshot.second)
        : false
      const proofIssues = proof ? Array.from(proof.issues) : ['missing production proof report']
      const auditIssues = [
        ...(deterministicSample ? [] : ['non-deterministic or missing representative generation evidence']),
        ...(!authority ? ['missing independent proof authority'] : []),
        ...(authority && authority.mode !== family.proofMode ? ['proof authority mode does not match the family'] : []),
        ...(proof && proof.mode !== family.proofMode ? ['proof report mode does not match the family'] : []),
        ...(!proof || !proof.proven || proof.checkedCount < 1 || proofIssues.length > 0 ? proofIssues : []),
        ...(!oracle?.valid ? ['independent oracle evidence failed or is missing'] : []),
        ...(!visual?.valid ? [visual?.reason ?? 'visual evidence failed or is missing'] : []),
        ...(exposure?.exposed || !exposure ? ['answer-exposure evidence failed or is missing'] : []),
      ]
      const status = auditIssues.length === 0 ? 'passed' as const : 'failed' as const
      return {
        key,
        familyId: family.familyId,
        version: family.version,
        status,
        deterministicSample,
        proof: {
          mode: proof?.mode ?? family.proofMode,
          authorityId: authority?.authorityId ?? null,
          expectedCount: authority?.expectedCount ?? 0,
          proven: proof?.proven ?? false,
          checkedCount: proof?.checkedCount ?? 0,
          issues: proofIssues,
        },
        audit: { status, issues: auditIssues },
      }
    }),
  }
}

export function getProductionApplicationFamilyEvidence() {
  const proofAuthorities: ProofAuthorityEvidence[] = [
    ...G2_LENGTH_PROOF_AUTHORITY_ENTRIES.map((authority) => ({
      familyId: authority.manifest.familyId,
      familyVersion: authority.manifest.familyVersion,
      mode: authority.manifest.mode,
      expectedCount: authority.manifest.expectedCount,
      authorityId: authority.manifest.authorityId,
    })),
    ...G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1.map((authority) => ({
      familyId: authority.familyId,
      familyVersion: authority.familyVersion,
      mode: authority.mode,
      expectedCount: authority.expectedCount,
      authorityId: authority.authorityId,
    })),
    ...G6_RATIO_PROOF_AUTHORITIES.map((authority) => ({
      familyId: authority.manifest.familyId,
      familyVersion: authority.manifest.familyVersion,
      mode: authority.manifest.mode,
      expectedCount: authority.manifest.expectedCount,
      authorityId: authority.manifest.authorityId,
    })),
  ]
  const authorityByFamily = new Map(proofAuthorities.map((authority) => [
    `${authority.familyId}@${authority.familyVersion}`,
    authority,
  ]))
  const oracleByFamily = new Map<string, (input: ApplicationProofOracleInputV1) => unknown>()
  const proofReports: ProofReportEvidence[] = [
    ...G2_LENGTH_EXHAUSTIVE_PROOFS.map((proof) => {
      oracleByFamily.set(familyKey(proof.family), proof.oracle.evaluate)
      return executeDeclaredProof({
        family: proof.family,
        mode: proof.mode,
        expectedCount: authorityByFamily.get(familyKey(proof.family))?.expectedCount,
        cases: proofCases(proof),
        generate: (input) => proof.generator.generate(input),
        evaluate: (input) => proof.oracle.evaluate(input),
      })
    }),
    ...G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1.map((authority) => {
      const generator = G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1.find((entry): entry is Extract<typeof G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1[number], { kind: 'generator' }> => (
        entry.kind === 'generator' && entry.implementationId === authority.generatorRef.implementationId
      ))
      const oracle = G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1.find((entry): entry is Extract<typeof G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1[number], { kind: 'oracle' }> => (
        entry.kind === 'oracle' && entry.implementationId === authority.oracleRef.implementationId
      ))
      if (!generator || !oracle) throw new Error(`Missing Grade 5 proof implementation for ${authority.familyId}`)
      oracleByFamily.set(`${authority.familyId}@${authority.familyVersion}`, oracle.execute)
      return executeDeclaredProof({
        family: { familyId: authority.familyId, version: authority.familyVersion, proofMode: authority.mode },
        mode: authority.mode,
        expectedCount: authority.expectedCount,
        cases: authority.domain,
        generate: (input) => generator.execute(input) as GeneratedApplicationProblemV1,
        evaluate: (input) => oracle.execute(input),
      })
    }),
    ...G6_RATIO_PROOFS.map((proof) => {
      oracleByFamily.set(familyKey(proof.family), proof.oracle.evaluate)
      return executeDeclaredProof({
        family: proof.family,
        mode: proof.mode,
        expectedCount: authorityByFamily.get(familyKey(proof.family))?.expectedCount,
        cases: proofCases(proof),
        generate: (input) => proof.generator.generate(input),
        evaluate: (input) => proof.oracle.evaluate(input),
      })
    }),
  ]
  const generatedSnapshots = APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry, index) => {
    if (entry.runtime.kind !== 'deterministic-generator') {
      throw new Error(`Unsupported production evidence runtime: ${entry.family.familyId}`)
    }
    const input = {
      family: entry.family,
      generator: entry.runtime.generator,
      packVersion: entry.runtime.generator.packVersion,
      seed: 1700 + index,
      variantIndex: 0,
      maxAttempts: entry.runtime.generator.maxAttempts,
    }
    return { family: entry.family, seed: input.seed, first: generateApplicationProblem(input), second: generateApplicationProblem(input) }
  })
  const oracleResults = generatedSnapshots.map((snapshot) => {
    const oracle = oracleByFamily.get(familyKey(snapshot.family))
    const answer = oracle ? normalizeOracleAnswer(oracle({
      caseId: 'production-runtime-sample',
      seed: snapshot.seed,
      variantIndex: 0,
      params: snapshot.first.params,
      mathModel: snapshot.first.visual.mathModel,
    })) : undefined
    const solutionValid = snapshot.first.solutionSteps.some((step) => step.includes(answer ?? ''))
    return {
      family: snapshot.family,
      problem: snapshot.first,
      answer,
      solutionValid,
      unitValid: true,
      valid: snapshot.first.answer.normalized === answer && solutionValid,
    }
  })
  const visualResults = generatedSnapshots.map((snapshot) => {
    const result = resolveApplicationVisual(snapshot.first.visual)
    return {
      family: snapshot.family,
      problem: snapshot.first,
      valid: result.status === 'ready' || result.status === 'none',
      ...(result.status === 'blocked' ? { reason: 'application visual resolver blocked the generated scene' } : {}),
    }
  })
  const answerExposureResults = generatedSnapshots.map((snapshot) => ({
    family: snapshot.family,
    problem: snapshot.first,
    exposed: answerIsPublicBeforeSubmission(snapshot.first),
  }))
  const input = {
    families: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    generatedSnapshots,
    proofAuthorities,
    proofReports,
    oracleResults,
    visualResults,
    answerExposureResults,
  } satisfies ApplicationFamilyQualityEvidenceInput
  return { ...input, ...buildApplicationFamilyEvidence(input) }
}
