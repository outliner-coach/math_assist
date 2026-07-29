const {
  loadProblemGenerator,
  loadTemplateCatalog,
} = require('./problem-quality-core')

const INVALID_RENDERED_VALUE = /\[[^\]]+\?\]|\b(?:NaN|Infinity|undefined)\b/
const INVALID_FIXED_WORDING = /몇\s+개을|(?:기준|기록)가\s+\d/
const ERROR_ANALYSIS_PROMPT_REQUIREMENTS = Object.freeze({
  'fraccompare-denominator-only-error': '더 큰 가',
  'fraccompare-cross-product-direction-error': '더 큰 나',
})
const PARTICLE_BY_FINAL_DIGIT = Object.freeze({
  0: { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
  1: { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
  2: { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
  3: { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
  4: { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
  5: { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
  6: { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
  7: { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
  8: { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
  9: { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
})
const FRACTION_PARTICLE_PATTERN = (
  /(?<![/\dA-Za-z])((?:\d[\d,]*\s+)?(\d[\d,]*)\/(\d[\d,]*))(으로|로|은|는|이|가|을|를|과|와)(?=$|[\s.,!?…;:)\]}'"”’])/g
)
const NUMBER_PARTICLE_PATTERN = (
  /(?<![/\dA-Za-z])(\d[\d,]*(?:\.\d+)?)(으로|로|은|는|이|가|을|를|과|와)(?=$|[\s.,!?…;:)\]}'"”’])/g
)
let renderProblemTemplate

function loadRenderer() {
  if (!renderProblemTemplate) {
    ;({ renderProblemTemplate } = loadProblemGenerator())
  }
  return renderProblemTemplate
}

function* enumerateParams(schema) {
  const entries = Object.entries(schema)

  function* visit(index, current) {
    if (index === entries.length) {
      yield { ...current }
      return
    }
    const [name, range] = entries[index]
    for (let value = range.min; value <= range.max; value += 1) {
      current[name] = value
      yield* visit(index + 1, current)
    }
    delete current[name]
  }

  yield* visit(0, {})
}

function collectStrings(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

function particleKind(particle) {
  if (particle === '은' || particle === '는') return 'topic'
  if (particle === '이' || particle === '가') return 'subject'
  if (particle === '을' || particle === '를') return 'object'
  if (particle === '과' || particle === '와') return 'join'
  return 'direction'
}

function isDivisionSlashSurface(text, start, end) {
  return /\/\s*$/.test(text.slice(0, start))
    || /^\s*(?:나눗셈|나누|나눕|나눠|나눈|나눌)/.test(text.slice(end))
}

function numericParticleIssues(text) {
  const issues = []
  const fractionRanges = []
  for (const match of text.matchAll(FRACTION_PARTICLE_PATTERN)) {
    if (isDivisionSlashSurface(text, match.index, match.index + match[0].length)) continue
    const finalDigit = match[2].replaceAll(',', '').at(-1)
    const expected = PARTICLE_BY_FINAL_DIGIT[finalDigit][particleKind(match[4])]
    if (match[4] !== expected) issues.push(`${match[0]}→${match[1]}${expected}`)
    fractionRanges.push([match.index, match.index + match[0].length])
  }
  for (const match of text.matchAll(NUMBER_PARTICLE_PATTERN)) {
    if (fractionRanges.some(([start, end]) => match.index >= start && match.index < end)) continue
    if (isDivisionSlashSurface(text, match.index, match.index + match[0].length)) continue
    const finalDigit = match[1].replaceAll(',', '').at(-1)
    const expected = PARTICLE_BY_FINAL_DIGIT[finalDigit][particleKind(match[2])]
    if (match[2] !== expected) issues.push(`${match[0]}→${match[1]}${expected}`)
  }
  return issues
}

function solutionStatesAnswer(solution, answer) {
  if (solution.some(step => step.includes(answer))) return true
  const circled = { 1: '①', 2: '②', 3: '③', 4: '④' }[answer]
  if (circled && solution.some(step => step.includes(circled))) return true
  const label = { 1: '가', 2: '나', 3: '다', 4: '라' }[answer]
  return Boolean(label && solution.some(step => (
    step.includes(`${label}가`) || step.includes(`${label}의`) || step.includes(`${label}를`)
  )))
}

function auditTemplateVariants(template, file) {
  const issues = []
  let variantCount = 0
  const renderTemplate = loadRenderer()

  if (!template.prompt_template.trim()) issues.push(`${template.id}: empty prompt`)
  if ((template.hint_steps_template ?? []).length < 2) {
    issues.push(`${template.id}: expected at least two hint steps`)
  }
  if ((template.solution_steps_template ?? []).length < 2) {
    issues.push(`${template.id}: expected at least two solution steps`)
  }
  const requiredErrorClaim = ERROR_ANALYSIS_PROMPT_REQUIREMENTS[
    template.problem_family
  ]
  if (requiredErrorClaim && !template.prompt_template.includes(requiredErrorClaim)) {
    issues.push(`${template.id}: error-analysis prompt must claim ${requiredErrorClaim}`)
  }

  for (const params of enumerateParams(template.param_schema)) {
    variantCount += 1
    const variantKey = `${template.id} ${JSON.stringify(params)}`
    try {
      const problem = renderTemplate(template, params, {
        choiceSeed: variantCount,
      })
      const answer = problem.correctAnswer
      const prompt = problem.prompt
      const choices = problem.choices ?? []
      const hints = problem.hintSteps ?? []
      const solution = problem.solutionSteps
      const visual = problem.visual ?? null
      const rendered = JSON.stringify({
        answer,
        prompt,
        choices,
        hints,
        solution,
        visual,
      })

      if (!answer.trim()) issues.push(`${variantKey}: empty answer`)
      if (INVALID_RENDERED_VALUE.test(rendered)) {
        issues.push(`${variantKey}: unresolved or invalid rendered value`)
      }
      if (INVALID_FIXED_WORDING.test(rendered)) {
        issues.push(`${variantKey}: invalid fixed Korean wording`)
      }
      if (template.type === 'choice') {
        if (choices.length !== 4) {
          issues.push(`${variantKey}: expected four choices`)
        }
        if (new Set(choices).size !== choices.length) {
          issues.push(`${variantKey}: duplicate choices`)
        }
        if (choices.filter(choice => choice === answer).length !== 1) {
          issues.push(`${variantKey}: answer must occur in choices exactly once`)
        }
      }
      const proseSurfaces = [
        prompt,
        ...choices,
        ...hints,
        ...solution,
        ...collectStrings(visual),
      ]
      for (const surface of proseSurfaces) {
        for (const particleIssue of numericParticleIssues(surface)) {
          issues.push(`${variantKey}: incorrect numeric particle ${particleIssue}`)
        }
      }
      if (!solutionStatesAnswer(solution, answer)) {
        issues.push(`${variantKey}: revealed solution does not state the answer`)
      }
    } catch (error) {
      issues.push(
        `${variantKey}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return {
    templateId: template.id,
    conceptId: template.concept_id,
    file,
    variantCount,
    issues,
  }
}

function auditAllGrade5Variants() {
  const items = loadTemplateCatalog()
    .filter(entry => !entry.file.startsWith('g6'))
    .flatMap(({ file, templates }) => (
      templates.map(template => auditTemplateVariants(template, file))
    ))
  return {
    items,
    totalVariants: items.reduce((total, item) => total + item.variantCount, 0),
  }
}

module.exports = {
  auditAllGrade5Variants,
  auditTemplateVariants,
  collectStrings,
  enumerateParams,
  numericParticleIssues,
}
