import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { JsonValue } from '../contracts'
import {
  createTestApplicationProofAuthorityRegistryV1,
  createTestApplicationProofImplementationRegistryV1,
  runTestApplicationProblemProofEngineV1,
} from '../__test-support__/proof-trust'
import { createApplicationProofManifestDigest } from '../proof'
import {
  G6_RATIO_PROOF_AUTHORITIES,
  G6_RATIO_PROOF_DEPENDENCIES,
  G6_RATIO_PROOF_IMPLEMENTATIONS,
  G6_RATIO_PROOFS,
} from './g6-ratio-proof'

function digestSource(sourceModule: string): string {
  const content = readFileSync(resolve(process.cwd(), sourceModule))
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

describe('Grade 6 ratio family-owned proof registrations', () => {
  it('pins literal SHA-256 digests to each exact finite authority domain', () => {
    expect(G6_RATIO_PROOF_AUTHORITIES).toHaveLength(3)
    for (const authority of G6_RATIO_PROOF_AUTHORITIES) {
      expect(authority.mode).toBe('exhaustive')
      if (authority.mode !== 'exhaustive') throw new Error('fixture must be exhaustive')
      expect(authority.manifest.expectedCount).toBe(authority.domain.length)
      expect(authority.manifest.domainDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(authority.manifest.domainDigest).toBe(
        createApplicationProofManifestDigest(authority.domain as unknown as JsonValue),
      )
      expect(authority.manifest.sourceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(authority.manifest.generatorRef?.sourceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(authority.manifest.oracleRef?.sourceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    }
  })

  it('registers distinct answer-logic dependency closures for generator and oracle', () => {
    const registry = createTestApplicationProofImplementationRegistryV1({
      dependencies: G6_RATIO_PROOF_DEPENDENCIES,
      implementations: G6_RATIO_PROOF_IMPLEMENTATIONS,
    })
    expect(registry.implementations).toHaveLength(6)
    expect(registry.dependencies.every((dependency) => dependency.kind === 'answer-logic')).toBe(true)
    for (const proof of G6_RATIO_PROOFS) {
      const generator = registry.implementations.find(
        (entry) => entry.kind === 'generator' && entry.execute === proof.generator.generate,
      )
      const oracle = registry.implementations.find(
        (entry) => entry.kind === 'oracle' && entry.execute === proof.oracle.evaluate,
      )
      expect(generator).toBeDefined()
      expect(oracle).toBeDefined()
      expect(generator?.sourceModule).not.toBe(oracle?.sourceModule)
      expect(generator?.rootDependency.dependencyId).not.toBe(
        oracle?.rootDependency.dependencyId,
      )
    }
  })

  it('pins every dependency, implementation, and authority to its literal source bytes', () => {
    for (const dependency of G6_RATIO_PROOF_DEPENDENCIES) {
      expect(dependency.digest).toBe(digestSource(dependency.sourceModule))
    }
    for (const implementation of G6_RATIO_PROOF_IMPLEMENTATIONS) {
      expect(implementation.sourceDigest).toBe(digestSource(implementation.sourceModule))
    }
    for (const authority of G6_RATIO_PROOF_AUTHORITIES) {
      expect(authority.manifest.sourceDigest).toBe(
        digestSource(authority.manifest.sourceModule),
      )
    }
  })

  it('runs all 299 canonical cases through the trusted proof engine', () => {
    const authorities = createTestApplicationProofAuthorityRegistryV1(
      G6_RATIO_PROOF_AUTHORITIES,
    )
    const implementations = createTestApplicationProofImplementationRegistryV1({
      dependencies: G6_RATIO_PROOF_DEPENDENCIES,
      implementations: G6_RATIO_PROOF_IMPLEMENTATIONS,
    })
    const reports = G6_RATIO_PROOFS.map((proof) =>
      runTestApplicationProblemProofEngineV1(proof, authorities, implementations),
    )
    expect(reports.map((report) => report.checkedCount)).toEqual([144, 110, 45])
    expect(reports.every((report) => report.proven)).toBe(true)
    expect(reports.flatMap((report) => report.issues)).toEqual([])
  })
})
