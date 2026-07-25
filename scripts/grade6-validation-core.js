const {
  inspectProblemBlueprintMeta,
  loadProblemGenerator,
} = require('./problem-quality-core')

function validateGrade6Release({ units, concepts, ledger, templatesByConcept }) {
  const errors = []
  const fail = (message) => errors.push(message)
  const grade6Units = units.filter((unit) => unit.grade === 6)
  const grade6UnitIds = new Set(grade6Units.map((unit) => unit.id))
  const grade6Concepts = concepts.filter((concept) => grade6UnitIds.has(concept.unit_id))
  const grade6ConceptIds = new Set(grade6Concepts.map((concept) => concept.id))
  const releasedRows = ledger.allocations.filter((row) => (
    row.assignedGrade === 6 &&
    row.reviewStatus === 'released' &&
    row.coverageStatus === 'existing-reference'
  ))
  const releasedRowsByStandard = new Map(releasedRows.map((row) => [row.standardCode, row]))
  const allTemplates = []
  const templateIds = new Set()
  const { generateProblems } = loadProblemGenerator()

  for (const unit of grade6Units) {
    if (!/^unit-6-[12]-[a-z0-9-]+$/.test(unit.id)) fail(`invalid Grade 6 unit id: ${unit.id}`)
    if (unit.semester !== '6-1' && unit.semester !== '6-2') fail(`invalid Grade 6 semester: ${unit.id}`)
  }

  for (const concept of grade6Concepts) {
    if (!/^g6[a-z0-9]+-\d{3}$/.test(concept.id)) fail(`invalid Grade 6 concept id: ${concept.id}`)
    const conceptTemplates = templatesByConcept[concept.id]
    if (!Array.isArray(conceptTemplates)) {
      fail(`${concept.id}: missing template bank`)
      continue
    }
    allTemplates.push(...conceptTemplates)
    if (conceptTemplates.length !== 30) {
      fail(`${concept.id}: expected 30 templates, got ${conceptTemplates.length}`)
    }

    for (const template of conceptTemplates) {
      if (templateIds.has(template.id)) fail(`${template.id}: duplicate template id`)
      templateIds.add(template.id)
      if (template.concept_id !== concept.id) {
        fail(`${template.id}: expected concept ${concept.id}, got ${template.concept_id}`)
      }
      const inspection = inspectProblemBlueprintMeta(template)
      for (const issue of inspection.issues) fail(`${template.id}: ${issue.code} ${issue.message}`)
      if (template.blueprint?.representations?.includes('table')) {
        if (
          template.visual_template?.type !== 'ratio_table' ||
          template.visual_template?.semantics !== 'quantitative'
        ) {
          fail(`${template.id}: table representation requires a quantitative ratio_table visual`)
        }
      }
      if (
        concept.id === 'g6ratio-001' &&
        /equivalent-ratio|missing-ratio-term/.test(template.problem_family ?? '')
      ) {
        fail(`${template.id}: proportion problem family belongs to a later release`)
      }

      const primaryStandard = template.blueprint?.primaryStandard
      const primaryRow = releasedRowsByStandard.get(primaryStandard)
      if (!primaryRow) {
        fail(`${template.id}: primary standard ${primaryStandard || 'missing'} is not released`)
      } else {
        if (primaryRow.unitId !== concept.unit_id) {
          fail(`${template.id}: primary standard ${primaryStandard} belongs to ${primaryRow.unitId}`)
        }
        if (!primaryRow.existingContentRefs?.includes(`grade6:${concept.id}`)) {
          fail(`${template.id}: ${primaryStandard} does not reference grade6:${concept.id}`)
        }
      }

      for (const standard of template.blueprint?.connectedStandards ?? []) {
        if (!releasedRowsByStandard.has(standard)) {
          fail(`${template.id}: connected standard ${standard} is not released`)
        }
      }
    }

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = conceptTemplates.filter((template) => template.set_id === setId)
      const difficulties = [1, 2, 3].map((difficulty) => (
        setTemplates.filter((template) => template.difficulty === difficulty).length
      ))
      const domains = ['knowing', 'applying', 'reasoning'].map((domain) => (
        setTemplates.filter((template) => template.blueprint?.cognitiveDomain === domain).length
      ))
      if (setTemplates.length !== 10 || difficulties.join('/') !== '4/4/2') {
        fail(`${concept.id} set ${setId}: expected difficulty 4/4/2, got ${difficulties.join('/')}`)
      }
      if (domains.join('/') !== '4/4/2') {
        fail(`${concept.id} set ${setId}: expected K/A/R 4/4/2, got ${domains.join('/')}`)
      }

      const otherSetFamilies = new Set(conceptTemplates
        .filter((template) => template.set_id !== setId)
        .map((template) => template.problem_family))
      const overlaps = setTemplates
        .map((template) => template.problem_family)
        .filter((family) => otherSetFamilies.has(family))
      if (overlaps.length > 0) {
        fail(`${concept.id} set ${setId}: families overlap another set: ${overlaps.join(', ')}`)
      }

      for (const count of [5, 10]) {
        for (const seed of [6101, 6102, 6103]) {
          try {
            const generated = generateProblems(conceptTemplates, {
              count,
              setId,
              seed,
              difficultyMix: count === 5
                ? { 1: 2, 2: 2, 3: 1 }
                : { 1: 4, 2: 4, 3: 2 },
            })
            if (generated.length !== count) {
              fail(`${concept.id} set ${setId}: generated ${generated.length}/${count}`)
            }
            if (new Set(generated.map((problem) => problem.prompt)).size !== generated.length) {
              fail(`${concept.id} set ${setId} seed ${seed}: duplicate rendered prompts`)
            }
          } catch (error) {
            fail(`${concept.id} set ${setId} seed ${seed}: ${error.message}`)
          }
        }
      }
    }

    const families = new Set(conceptTemplates.map((template) => template.problem_family))
    const reasoningFamilies = new Set(conceptTemplates
      .filter((template) => template.blueprint?.cognitiveDomain === 'reasoning')
      .map((template) => template.problem_family))
    const representations = new Set(conceptTemplates.flatMap(
      (template) => template.blueprint?.representations ?? [],
    ))
    if (families.size < 8) fail(`${concept.id}: expected at least 8 problem families, got ${families.size}`)
    if (reasoningFamilies.size < 2) {
      fail(`${concept.id}: expected at least 2 reasoning families, got ${reasoningFamilies.size}`)
    }
    if (representations.size < 2) {
      fail(`${concept.id}: expected at least 2 representations, got ${representations.size}`)
    }
  }

  for (const conceptId of Object.keys(templatesByConcept)) {
    if (!grade6ConceptIds.has(conceptId)) fail(`${conceptId}: template bank has no released Grade 6 concept`)
  }

  for (const row of releasedRows) {
    const referencedConceptIds = (row.existingContentRefs ?? [])
      .filter((reference) => reference.startsWith('grade6:'))
      .map((reference) => reference.slice('grade6:'.length))
    if (referencedConceptIds.length === 0) {
      fail(`released standard ${row.standardCode} has no Grade 6 content reference`)
    }
    for (const conceptId of referencedConceptIds) {
      if (!grade6ConceptIds.has(conceptId)) {
        fail(`released standard ${row.standardCode} references unknown concept ${conceptId}`)
      } else if (!templatesByConcept[conceptId]?.some(
        (template) => template.blueprint?.primaryStandard === row.standardCode,
      )) {
        fail(`released standard ${row.standardCode} has no primary template in ${conceptId}`)
      }
    }
  }

  if (ledger.releaseState?.grade6 !== 'released') fail('Grade 6 ledger state must be released')

  return {
    errors,
    summary: {
      unitCount: grade6Units.length,
      conceptCount: grade6Concepts.length,
      templateCount: allTemplates.length,
    },
  }
}

module.exports = { validateGrade6Release }
