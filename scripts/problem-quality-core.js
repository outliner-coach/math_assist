const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')
const TEMPLATES_DIR = path.join(ROOT_DIR, 'public', 'data', 'templates')
const CONCEPTS_PATH = path.join(ROOT_DIR, 'public', 'data', 'concepts.json')

function gcd(a, b) {
  a = Math.abs(Math.floor(a))
  b = Math.abs(Math.floor(b))
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

function lcm(a, b) {
  a = Math.abs(Math.floor(a))
  b = Math.abs(Math.floor(b))
  if (a === 0 || b === 0) return 0
  return (a * b) / gcd(a, b)
}

function divisors(n) {
  n = Math.abs(Math.floor(n))
  if (n === 0) return []
  const result = []
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      result.push(i)
      if (i !== n / i) result.push(n / i)
    }
  }
  return result.sort((a, b) => a - b)
}

function multiples(n, count) {
  n = Math.abs(Math.floor(n))
  if (n === 0) return []
  const result = []
  for (let i = 1; i <= count; i++) result.push(n * i)
  return result
}

function formatNumberList(nums, addEllipsis = true) {
  const str = nums.join(', ')
  return addEllipsis ? str + ', ...' : str
}

function divisorCount(n) {
  return divisors(n).length
}

function reduce(numerator, denominator) {
  if (denominator === 0) throw new Error('분모가 0일 수 없습니다')
  const sign = (numerator < 0) !== (denominator < 0) ? -1 : 1
  numerator = Math.abs(Math.floor(numerator))
  denominator = Math.abs(Math.floor(denominator))
  const g = gcd(numerator, denominator)
  return { num: sign * (numerator / g), den: denominator / g }
}

function reduceFrac(num, den) {
  const r = reduce(num, den)
  if (r.den === 1) return String(r.num)
  return `${r.num}/${r.den}`
}

function reducedNum(num, den) {
  return reduce(num, den).num
}

function reducedDen(num, den) {
  return reduce(num, den).den
}

function reduceFracOff(num, den, offset) {
  const r = reduce(num + offset, den)
  if (r.den === 1) return String(r.num)
  return `${r.num}/${r.den}`
}

function commonDen(d1, d2) {
  return lcm(d1, d2)
}

function convertNum1(n1, d1, d2) {
  const cd = lcm(d1, d2)
  return n1 * (cd / d1)
}

function convertNum2(n2, d1, d2) {
  const cd = lcm(d1, d2)
  return n2 * (cd / d2)
}

function fracAdd(n1, d1, n2, d2) {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) + n2 * (cd / d2)
  return reduceFrac(newN, cd)
}

function fracAddOff(n1, d1, n2, d2, offset) {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) + n2 * (cd / d2) + offset
  return reduceFrac(newN, cd)
}

function fracSub(n1, d1, n2, d2) {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) - n2 * (cd / d2)
  return reduceFrac(newN, cd)
}

function fracSubOff(n1, d1, n2, d2, offset) {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) - n2 * (cd / d2) + offset
  return reduceFrac(newN, cd)
}

function fracMul(n1, d1, n2, d2) {
  return reduceFrac(n1 * n2, d1 * d2)
}

function fracMulOff(n1, d1, n2, d2, offset) {
  return reduceFrac(n1 * n2 + offset, d1 * d2)
}

function roundTo(n, place) {
  return Math.round(n / place) * place
}

function ceilTo(n, place) {
  return Math.ceil(n / place) * place
}

function floorTo(n, place) {
  return Math.floor(n / place) * place
}

function dec1(n) {
  return (n / 10).toString()
}

function decTimesNat(a, b) {
  const result = (a * b) / 10
  return result.toString()
}

function decTimesNatOff(a, b, off) {
  const result = (a * b + off) / 10
  return result.toString()
}

function decTimesDec(a, b) {
  const result = (a * b) / 100
  return result.toString()
}

function decTimesDecOff(a, b, off) {
  const result = (a * b + off) / 100
  return result.toString()
}

function avg3(a, b, c) {
  return Math.round((a + b + c) / 3 * 10) / 10
}

function avg4(a, b, c, d) {
  return (a + b + c + d) / 4
}

function sum3(a, b, c) {
  return a + b + c
}

function sum4(a, b, c, d) {
  return a + b + c + d
}

function commonDivisors(a, b) {
  const divisorsA = divisors(a)
  const divisorsB = new Set(divisors(b))
  return divisorsA.filter(d => divisorsB.has(d))
}

function smallestDivisorOverOne(n) {
  const ds = divisors(n)
  for (const d of ds) {
    if (d > 1) return d
  }
  return 1
}

function largestProperDivisor(n) {
  const ds = divisors(n)
  if (ds.length <= 1) return 1
  return ds[ds.length - 2]
}

function secondLargestDivisor(n) {
  const ds = divisors(n)
  if (ds.length <= 1) return 1
  return ds[ds.length - 2]
}

function evaluateFunction(funcName, args) {
  switch (funcName) {
    case 'gcd': return String(gcd(args[0], args[1]))
    case 'lcm': return String(lcm(args[0], args[1]))
    case 'divisors': return divisors(args[0]).join(', ')
    case 'divisorCount': return String(divisorCount(args[0]))
    case 'multiples': return formatNumberList(multiples(args[0], args[1] || 5), true)
    case 'commonDivisors': return commonDivisors(args[0], args[1]).join(', ')
    case 'reduceFrac': return reduceFrac(args[0], args[1])
    case 'reducedNum': return String(reducedNum(args[0], args[1]))
    case 'reducedDen': return String(reducedDen(args[0], args[1]))
    case 'reduceFracOff': return reduceFracOff(args[0], args[1], args[2])
    case 'commonDen': return String(commonDen(args[0], args[1]))
    case 'convertNum1': return String(convertNum1(args[0], args[1], args[2]))
    case 'convertNum2': return String(convertNum2(args[0], args[1], args[2]))
    case 'fracAdd': return fracAdd(args[0], args[1], args[2], args[3])
    case 'fracAddOff': return fracAddOff(args[0], args[1], args[2], args[3], args[4])
    case 'fracSub': return fracSub(args[0], args[1], args[2], args[3])
    case 'fracSubOff': return fracSubOff(args[0], args[1], args[2], args[3], args[4])
    case 'fracMul': return fracMul(args[0], args[1], args[2], args[3])
    case 'fracMulOff': return fracMulOff(args[0], args[1], args[2], args[3], args[4])
    case 'roundTo': return String(roundTo(args[0], args[1]))
    case 'ceilTo': return String(ceilTo(args[0], args[1]))
    case 'floorTo': return String(floorTo(args[0], args[1]))
    case 'dec1': return dec1(args[0])
    case 'decTimesNat': return decTimesNat(args[0], args[1])
    case 'decTimesNatOff': return decTimesNatOff(args[0], args[1], args[2])
    case 'decTimesDec': return decTimesDec(args[0], args[1])
    case 'decTimesDecOff': return decTimesDecOff(args[0], args[1], args[2])
    case 'avg3': return String(avg3(args[0], args[1], args[2]))
    case 'avg4': return String(avg4(args[0], args[1], args[2], args[3]))
    case 'sum3': return String(sum3(args[0], args[1], args[2]))
    case 'sum4': return String(sum4(args[0], args[1], args[2], args[3]))
    case 'smallestDivisorOverOne': return String(smallestDivisorOverOne(args[0]))
    case 'largestProperDivisor': return String(largestProperDivisor(args[0]))
    case 'secondLargestDivisor': return String(secondLargestDivisor(args[0]))
    default: return null
  }
}

function evaluateArg(argStr, params) {
  const trimmed = argStr.trim()
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (params[trimmed] !== undefined) return params[trimmed]
  let evalExpr = trimmed
  for (const [key, value] of Object.entries(params)) {
    evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
  }
  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    try {
      return eval(evalExpr)
    } catch {
      return 0
    }
  }
  return 0
}

function replaceFunctionCalls(expr, params) {
  return expr.replace(/(\w+)\(([^)]+)\)/g, (match, funcName, argsStr) => {
    const args = argsStr.split(',').map(arg => evaluateArg(arg, params))
    const result = evaluateFunction(funcName, args)
    return result !== null ? result : match
  })
}

function evaluateTemplate(template, params) {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const trimmedExpr = expr.trim()
    if (params[trimmedExpr] !== undefined) return String(params[trimmedExpr])

    const funcMatch = trimmedExpr.match(/^(\w+)\(([^)]+)\)$/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      const args = funcMatch[2].split(',').map(arg => evaluateArg(arg, params))
      const result = evaluateFunction(funcName, args)
      if (result !== null) return result
    }

    try {
      let evalExpr = replaceFunctionCalls(trimmedExpr, params)
      for (const [key, value] of Object.entries(params)) {
        evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
      }
      if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
        return String(eval(evalExpr))
      }
    } catch {
      // ignore
    }

    return `[${trimmedExpr}?]`
  })
}

function hasUnevaluated(text) {
  return /\[[^\]]+\?\]/.test(text)
}

function seededRandom(seed) {
  let current = seed
  return function next() {
    current = (current * 1103515245 + 12345) & 0x7fffffff
    return current / 0x7fffffff
  }
}

function randomInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min
}

function stableParamsKey(params) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
}

function generateParams(schema, random = Math.random) {
  const params = {}
  for (const [key, range] of Object.entries(schema)) {
    params[key] = randomInt(range.min, range.max, random)
  }
  return params
}

function buildParamSamples(schema, sampleCount, seed) {
  const entries = Object.entries(schema).sort(([left], [right]) => left.localeCompare(right))
  if (entries.length === 0) return [{}]

  const seen = new Map()

  function addSample(params) {
    seen.set(stableParamsKey(params), params)
  }

  const mids = {}
  const mins = {}
  const maxes = {}

  for (const [key, range] of entries) {
    mins[key] = range.min
    maxes[key] = range.max
    mids[key] = Math.floor((range.min + range.max) / 2)
  }

  addSample(mins)
  addSample(maxes)
  addSample(mids)

  addSample(Object.fromEntries(entries.map(([key, range], index) => [
    key,
    index % 2 === 0 ? range.min : range.max
  ])))

  addSample(Object.fromEntries(entries.map(([key, range], index) => [
    key,
    index % 2 === 0 ? range.max : range.min
  ])))

  for (const [focusKey, focusRange] of entries) {
    addSample({
      ...mids,
      [focusKey]: focusRange.min
    })
    addSample({
      ...mids,
      [focusKey]: focusRange.max
    })
  }

  const random = seededRandom(seed)
  let attempts = 0
  while (seen.size < sampleCount && attempts < sampleCount * 20) {
    attempts += 1
    addSample(generateParams(schema, random))
  }

  return Array.from(seen.values()).slice(0, sampleCount)
}

function loadTemplateCatalog() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(file => file.endsWith('.json')).sort()
  return files.map(file => ({
    file,
    templates: JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8'))
  }))
}

function loadConceptMap() {
  const concepts = JSON.parse(fs.readFileSync(CONCEPTS_PATH, 'utf8'))
  return Object.fromEntries(concepts.map(concept => [concept.id, concept]))
}

function countMatches(pattern, text) {
  return (text.match(pattern) || []).length
}

function round(value) {
  return Math.round(value * 100) / 100
}

function extractNumericMagnitude(answer) {
  const trimmed = answer.trim()

  if (/^-?\d+$/.test(trimmed)) return Math.abs(parseInt(trimmed, 10))
  if (/^-?(?:\d+|\d*\.\d+)$/.test(trimmed)) return Math.abs(parseFloat(trimmed))

  const mixed = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const whole = parseInt(mixed[1], 10)
    const num = parseInt(mixed[2], 10)
    const den = parseInt(mixed[3], 10)
    if (den === 0) return null
    return Math.abs(whole) + num / den
  }

  const fraction = trimmed.match(/^(-?\d+)\/(\d+)$/)
  if (fraction) {
    const num = parseInt(fraction[1], 10)
    const den = parseInt(fraction[2], 10)
    if (den === 0) return null
    return Math.abs(num / den)
  }

  return null
}

function calculateDifficultySignal(template, answerSamples) {
  const prompt = template.prompt_template
  const solver = template.solver_rule
  const ranges = Object.values(template.param_schema)
  const avgRangeSpan = ranges.length
    ? ranges.reduce((sum, range) => sum + (range.max - range.min), 0) / ranges.length
    : 0
  const functionCount = countMatches(/\b[a-zA-Z_]\w*\s*\(/g, solver)
  const operatorCount = countMatches(/[+\-*/]/g, solver)
  const magnitudeValues = answerSamples
    .map(sample => sample.answerMagnitude)
    .filter(value => typeof value === 'number')
  const avgMagnitude = magnitudeValues.length
    ? magnitudeValues.reduce((sum, value) => sum + value, 0) / magnitudeValues.length
    : 0
  const hasStoryContext = /몇 명|나누어 주려면|묶음|버스|초마다|깜빡|케이크|남은 양|색칠한 부분/.test(prompt)

  return round(
    functionCount * 1.2 +
    operatorCount * 0.6 +
    Object.keys(template.param_schema).length * 0.35 +
    Math.log10(avgRangeSpan + 1) * 1.15 +
    Math.log10(avgMagnitude + 1) * 1.1 +
    (template.type === 'number' ? 0.5 : 0) +
    (template.solution_steps_template?.length || 0) * 0.4 +
    (template.hint_steps_template?.length || 0) * 0.15 +
    (/통분|공통 분모/.test(prompt) ? 1.3 : 0) +
    (/평균|규칙|대응/.test(prompt) ? 0.8 : 0) +
    (/합|차|더|빼|곱|계산/.test(prompt) ? 0.6 : 0) +
    (/최대공약수|최소공배수|공약수|공배수/.test(prompt) ? 0.7 : 0) +
    (hasStoryContext ? 0.65 : 0)
  )
}

function analyzeRenderedPromptQuality(template, prompt) {
  const warnings = []
  const fractionVisible = /\\frac|\d+\s*\/\s*\d+/.test(prompt)
  const isFractionConcept = /^(simplify|commonden|fracadd|fracsub|fracmul)-/.test(template.concept_id)
  const usesFractionMath = /(reduceFrac|convertNum|commonDen|fracAdd|fracSub|fracMul)/.test(template.solver_rule)
  const referencesOrderedOperands = /(첫 번째|두 번째)/.test(prompt) && /(분자|분수|항)/.test(prompt)

  if ((isFractionConcept || usesFractionMath) && !fractionVisible) {
    warnings.push({
      code: 'fraction_operands_hidden',
      message: '분수 관련 문제인데 prompt에 실제 분수가 드러나지 않습니다.'
    })
  }

  if (referencesOrderedOperands && !fractionVisible) {
    warnings.push({
      code: 'ambiguous_operand_reference',
      message: '첫 번째/두 번째 같은 위치 표현이 있지만 기준이 되는 수식이 prompt에 없습니다.'
    })
  }

  if (/통분한 뒤/.test(prompt) && !fractionVisible) {
    warnings.push({
      code: 'missing_precondition_operands',
      message: '통분 이후 연산을 묻지만 통분할 원래 분수가 prompt에 없습니다.'
    })
  }

  return warnings
}

function createIssue(severity, code, context) {
  return {
    severity,
    code,
    ...context
  }
}

function validateTemplates(options = {}) {
  const catalog = loadTemplateCatalog()
  const sampleCount = options.sampleCount ?? 20
  const errors = []
  const conceptMap = loadConceptMap()

  for (const { file, templates } of catalog) {
    const bySet = {}
    for (const template of templates) {
      const setId = template.set_id
      bySet[setId] = bySet[setId] || { 1: 0, 2: 0, 3: 0, total: 0 }
      bySet[setId][template.difficulty] += 1
      bySet[setId].total += 1
    }

    for (const [setId, counts] of Object.entries(bySet)) {
      if (counts.total !== 10 || counts[1] !== 4 || counts[2] !== 4 || counts[3] !== 2) {
        errors.push(createIssue('error', 'set_distribution', {
          file,
          templateId: setId,
          conceptId: null,
          message: `${file} set ${setId}: expected 10(4/4/2), got ${counts.total} (${counts[1]}/${counts[2]}/${counts[3]})`
        }))
      }
    }

    for (const template of templates) {
      if (!conceptMap[template.concept_id]) {
        errors.push(createIssue('error', 'unknown_concept', {
          file,
          templateId: template.id,
          conceptId: template.concept_id,
          message: `${file} ${template.id}: concept ${template.concept_id} does not exist`
        }))
      }

      const samples = buildParamSamples(template.param_schema, sampleCount, template.id.length * 97)
      for (const params of samples) {
        const prompt = evaluateTemplate(template.prompt_template, params)
        const correct = evaluateTemplate(`{{${template.solver_rule}}}`, params)
        const solutionSteps = (template.solution_steps_template || []).map(step => evaluateTemplate(step, params))
        const hintSteps = (template.hint_steps_template || []).map(step => evaluateTemplate(step, params))

        if (hasUnevaluated(prompt)) {
          errors.push(createIssue('error', 'unevaluated_prompt', {
            file,
            templateId: template.id,
            conceptId: template.concept_id,
            params,
            message: `${file} ${template.id}: unevaluated prompt for params ${JSON.stringify(params)}`
          }))
          break
        }

        if (solutionSteps.some(hasUnevaluated)) {
          errors.push(createIssue('error', 'unevaluated_solution', {
            file,
            templateId: template.id,
            conceptId: template.concept_id,
            params,
            message: `${file} ${template.id}: unevaluated solution step for params ${JSON.stringify(params)}`
          }))
          break
        }

        if (hintSteps.some(hasUnevaluated)) {
          errors.push(createIssue('error', 'unevaluated_hint', {
            file,
            templateId: template.id,
            conceptId: template.concept_id,
            params,
            message: `${file} ${template.id}: unevaluated hint step for params ${JSON.stringify(params)}`
          }))
          break
        }

        if (!correct || /undefined|NaN/.test(correct)) {
          errors.push(createIssue('error', 'invalid_correct_answer', {
            file,
            templateId: template.id,
            conceptId: template.concept_id,
            params,
            message: `${file} ${template.id}: invalid correct answer for params ${JSON.stringify(params)}`
          }))
          break
        }

        if (template.type === 'choice') {
          const choices = (template.choices_template || []).map(choice => evaluateTemplate(choice, params))
          const unique = new Set(choices)
          if (unique.size !== choices.length) {
            errors.push(createIssue('error', 'duplicate_choices', {
              file,
              templateId: template.id,
              conceptId: template.concept_id,
              params,
              message: `${file} ${template.id}: duplicate choices for params ${JSON.stringify(params)}`
            }))
            break
          }

          if (choices[0] !== correct) {
            errors.push(createIssue('error', 'incorrect_first_choice', {
              file,
              templateId: template.id,
              conceptId: template.concept_id,
              params,
              message: `${file} ${template.id}: first choice is not correct answer for params ${JSON.stringify(params)}`
            }))
            break
          }
        }
      }
    }
  }

  return {
    sampleCount,
    templateFiles: catalog.length,
    templateCount: catalog.reduce((sum, entry) => sum + entry.templates.length, 0),
    errors
  }
}

function loadProblemGenerator() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'math-assist-quality-'))
  const mathPath = path.join(ROOT_DIR, 'src', 'lib', 'math.ts')
  const generatorPath = path.join(ROOT_DIR, 'src', 'lib', 'problem-generator.ts')

  const mathCode = ts.transpileModule(
    fs.readFileSync(mathPath, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
  ).outputText
  const generatorCode = ts.transpileModule(
    fs.readFileSync(generatorPath, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
  ).outputText

  fs.writeFileSync(path.join(tempDir, 'math.js'), mathCode)
  fs.writeFileSync(path.join(tempDir, 'types.js'), 'module.exports = {}')
  fs.writeFileSync(path.join(tempDir, 'problem-generator.js'), generatorCode)

  return require(path.join(tempDir, 'problem-generator.js'))
}

function buildDifficultyWarnings(templateRecords, conceptMap) {
  const warnings = []
  const byConcept = {}

  for (const record of templateRecords) {
    byConcept[record.conceptId] = byConcept[record.conceptId] || { 1: [], 2: [], 3: [] }
    byConcept[record.conceptId][record.difficulty].push(record.difficultySignal)
  }

  for (const [conceptId, buckets] of Object.entries(byConcept)) {
    const averages = {
      1: buckets[1].reduce((sum, value) => sum + value, 0) / buckets[1].length,
      2: buckets[2].reduce((sum, value) => sum + value, 0) / buckets[2].length,
      3: buckets[3].reduce((sum, value) => sum + value, 0) / buckets[3].length
    }

    if (averages[1] >= averages[2]) {
      warnings.push(createIssue('warning', 'difficulty_order_1_2', {
        conceptId,
        templateId: null,
        file: null,
        message: `${conceptMap[conceptId]?.concept_title || conceptId}: difficulty 1 average signal (${round(averages[1])}) should be below difficulty 2 (${round(averages[2])})`
      }))
    }

    if (averages[2] >= averages[3]) {
      warnings.push(createIssue('warning', 'difficulty_order_2_3', {
        conceptId,
        templateId: null,
        file: null,
        message: `${conceptMap[conceptId]?.concept_title || conceptId}: difficulty 2 average signal (${round(averages[2])}) should be below difficulty 3 (${round(averages[3])})`
      }))
    }
  }

  return warnings
}

function generateProblemQualityReport(options = {}) {
  const sampleCount = options.sampleCount ?? 16
  const sessionSeeds = options.sessionSeeds ?? [11, 29, 47]
  const validation = validateTemplates({ sampleCount })
  const errors = [...validation.errors]
  const warnings = []
  const conceptMap = loadConceptMap()
  const catalog = loadTemplateCatalog()
  const allTemplates = catalog.flatMap(entry =>
    entry.templates.map(template => ({ ...template, __file: entry.file }))
  )
  const templatesByConcept = allTemplates.reduce((acc, template) => {
    acc[template.concept_id] = acc[template.concept_id] || []
    acc[template.concept_id].push(template)
    return acc
  }, {})

  const templateRecords = []

  for (const template of allTemplates) {
    const samples = buildParamSamples(template.param_schema, sampleCount, template.id.length * 211)
    const answerSamples = []

    for (const params of samples) {
      const prompt = evaluateTemplate(template.prompt_template, params)
      const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)
      const promptWarnings = analyzeRenderedPromptQuality(template, prompt)
      for (const warning of promptWarnings) {
        warnings.push(createIssue('warning', warning.code, {
          file: template.__file,
          templateId: template.id,
          conceptId: template.concept_id,
          params,
          message: `${template.__file} ${template.id}: ${warning.message}`
        }))
      }

      answerSamples.push({
        answer,
        answerMagnitude: extractNumericMagnitude(answer)
      })
    }

    templateRecords.push({
      conceptId: template.concept_id,
      conceptTitle: conceptMap[template.concept_id]?.concept_title || template.concept_id,
      file: template.__file,
      templateId: template.id,
      difficulty: template.difficulty,
      setId: template.set_id,
      type: template.type,
      difficultySignal: calculateDifficultySignal(template, answerSamples),
      avgAnswerMagnitude: round(
        answerSamples
          .map(sample => sample.answerMagnitude)
          .filter(value => typeof value === 'number')
          .reduce((sum, value, _, list) => sum + value / list.length, 0)
      )
    })
  }

  warnings.push(...buildDifficultyWarnings(templateRecords, conceptMap))

  const { generateProblems } = loadProblemGenerator()
  for (const [conceptId, templates] of Object.entries(templatesByConcept)) {
    for (const setId of ['A', 'B', 'C']) {
      for (const seed of sessionSeeds) {
        try {
          const problems = generateProblems(templates, { count: 10, setId, seed })
          const prompts = new Set()
          const keys = new Set()
          const difficultyCounts = { 1: 0, 2: 0, 3: 0 }
          const templateIndex = Object.fromEntries(templates.map(template => [template.id, template]))

          for (const problem of problems) {
            prompts.add(problem.prompt)
            keys.add(`${problem.templateId}:${stableParamsKey(problem.params)}`)
            const difficulty = templateIndex[problem.templateId]?.difficulty
            if (difficulty) difficultyCounts[difficulty] += 1

            if (hasUnevaluated(problem.prompt) || hasUnevaluated(problem.correctAnswer)) {
              errors.push(createIssue('error', 'session_unevaluated_output', {
                file: null,
                templateId: problem.templateId,
                conceptId,
                params: problem.params,
                message: `${conceptId} set ${setId} seed ${seed}: generated session has unevaluated output`
              }))
            }
          }

          if (prompts.size !== problems.length) {
            warnings.push(createIssue('warning', 'duplicate_prompt_in_session', {
              file: null,
              templateId: null,
              conceptId,
              message: `${conceptId} set ${setId} seed ${seed}: generated session has duplicate prompt text`
            }))
          }

          if (keys.size !== problems.length) {
            errors.push(createIssue('error', 'duplicate_problem_in_session', {
              file: null,
              templateId: null,
              conceptId,
              message: `${conceptId} set ${setId} seed ${seed}: generated session repeated the same template+params`
            }))
          }

          if (
            difficultyCounts[1] !== 4 ||
            difficultyCounts[2] !== 4 ||
            difficultyCounts[3] !== 2
          ) {
            errors.push(createIssue('error', 'session_difficulty_mix', {
              file: null,
              templateId: null,
              conceptId,
              message: `${conceptId} set ${setId} seed ${seed}: expected session mix 4/4/2, got ${difficultyCounts[1]}/${difficultyCounts[2]}/${difficultyCounts[3]}`
            }))
          }
        } catch (error) {
          errors.push(createIssue('error', 'session_generation_failed', {
            file: null,
            templateId: null,
            conceptId,
            message: `${conceptId} set ${setId} seed ${seed}: ${error.message}`
          }))
        }
      }
    }
  }

  const conceptSummaries = Object.values(
    templateRecords.reduce((acc, record) => {
      const entry = acc[record.conceptId] || {
        conceptId: record.conceptId,
        title: record.conceptTitle,
        templateCount: 0,
        byDifficulty: {
          1: { count: 0, signalSum: 0, magnitudeValues: [] },
          2: { count: 0, signalSum: 0, magnitudeValues: [] },
          3: { count: 0, signalSum: 0, magnitudeValues: [] }
        }
      }

      entry.templateCount += 1
      entry.byDifficulty[record.difficulty].count += 1
      entry.byDifficulty[record.difficulty].signalSum += record.difficultySignal
      if (record.avgAnswerMagnitude > 0) {
        entry.byDifficulty[record.difficulty].magnitudeValues.push(record.avgAnswerMagnitude)
      }
      acc[record.conceptId] = entry
      return acc
    }, {})
  ).map(entry => ({
    conceptId: entry.conceptId,
    title: entry.title,
    templateCount: entry.templateCount,
    avgSignals: {
      1: round(entry.byDifficulty[1].signalSum / entry.byDifficulty[1].count),
      2: round(entry.byDifficulty[2].signalSum / entry.byDifficulty[2].count),
      3: round(entry.byDifficulty[3].signalSum / entry.byDifficulty[3].count)
    },
    avgMagnitudes: {
      1: round(entry.byDifficulty[1].magnitudeValues.reduce((sum, value) => sum + value, 0) / Math.max(entry.byDifficulty[1].magnitudeValues.length, 1)),
      2: round(entry.byDifficulty[2].magnitudeValues.reduce((sum, value) => sum + value, 0) / Math.max(entry.byDifficulty[2].magnitudeValues.length, 1)),
      3: round(entry.byDifficulty[3].magnitudeValues.reduce((sum, value) => sum + value, 0) / Math.max(entry.byDifficulty[3].magnitudeValues.length, 1))
    }
  }))

  return {
    summary: {
      templateFiles: catalog.length,
      templateCount: allTemplates.length,
      conceptCount: Object.keys(templatesByConcept).length,
      sampleCountPerTemplate: sampleCount,
      sessionSeeds,
      errorCount: errors.length,
      warningCount: warnings.length
    },
    errors,
    warnings,
    conceptSummaries
  }
}

module.exports = {
  analyzeRenderedPromptQuality,
  buildParamSamples,
  calculateDifficultySignal,
  evaluateTemplate,
  extractNumericMagnitude,
  generateProblemQualityReport,
  loadConceptMap,
  loadProblemGenerator,
  loadTemplateCatalog,
  stableParamsKey,
  validateTemplates
}
