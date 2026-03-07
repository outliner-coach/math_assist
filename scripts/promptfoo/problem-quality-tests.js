const { loadConceptMap, loadTemplateCatalog } = require('../problem-quality-core')

function failingReason(label) {
  return [
    `const details = output.issueCount === 0 ? output.errors : output.issues;`,
    `if ((output.issueCount ?? output.errors?.length ?? 0) === 0) return true;`,
    `const payload = JSON.stringify(output, null, 2);`,
    `return {`,
    `  pass: false,`,
    `  score: 0,`,
    `  reason: ${JSON.stringify(label)} + "\\n\\n" + payload`,
    `};`
  ].join('\n')
}

function generateTests(config = {}) {
  const sampleCount = Number(config.sampleCount) || 16
  const sessionSeeds = Array.isArray(config.sessionSeeds) && config.sessionSeeds.length > 0
    ? config.sessionSeeds
    : [11, 29, 47]
  const catalog = loadTemplateCatalog()
  const conceptIds = Object.keys(loadConceptMap()).sort()
  const tests = []

  tests.push({
    description: 'template validation gate',
    metadata: { suite: 'template_validation' },
    vars: {
      auditType: 'template_validation',
      sampleCount
    },
    assert: [
      {
        type: 'javascript',
        value: failingReason('Template validation failed')
      }
    ]
  })

  for (const { file, templates } of catalog) {
    for (const template of templates) {
      tests.push({
        description: `[prompt] ${file} ${template.id}`,
        metadata: {
          suite: 'template_clarity',
          file,
          templateId: template.id,
          conceptId: template.concept_id
        },
        vars: {
          auditType: 'template_clarity',
          file,
          templateId: template.id,
          sampleCount
        },
        assert: [
          {
            type: 'javascript',
            value: failingReason('Rendered prompt quality failed')
          }
        ]
      })
    }
  }

  for (const conceptId of conceptIds) {
    tests.push({
      description: `[difficulty] ${conceptId}`,
      metadata: {
        suite: 'difficulty_progression',
        conceptId
      },
      vars: {
        auditType: 'difficulty_progression',
        conceptId,
        sampleCount
      },
      assert: [
        {
          type: 'javascript',
          value: failingReason('Difficulty progression failed')
        }
      ]
    })

    for (const setId of ['A', 'B', 'C']) {
      for (const seed of sessionSeeds) {
        tests.push({
          description: `[session] ${conceptId} ${setId} seed ${seed}`,
          metadata: {
            suite: 'session_quality',
            conceptId,
            setId,
            seed
          },
          vars: {
            auditType: 'session_quality',
            conceptId,
            setId,
            seed
          },
          assert: [
            {
              type: 'javascript',
              value: failingReason('Session quality failed')
            }
          ]
        })
      }
    }
  }

  return tests
}

module.exports = {
  generateTests
}
