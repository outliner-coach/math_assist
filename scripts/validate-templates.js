const fs = require('fs')
const path = require('path')

// --- math helpers (mirrors src/lib/math.ts) ---
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
  return Number.isInteger(result) ? result.toString() : result.toString()
}

function decTimesNatOff(a, b, off) {
  const result = (a * b + off) / 10
  return Number.isInteger(result) ? result.toString() : result.toString()
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
    try { return eval(evalExpr) } catch { return 0 }
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateParams(schema) {
  const params = {}
  for (const [key, range] of Object.entries(schema)) {
    params[key] = randomInt(range.min, range.max)
  }
  return params
}

function hasUnevaluated(text) {
  return /\[[^\]]+\?\]/.test(text)
}

function validateTemplates() {
  const templatesDir = path.join(__dirname, '..', 'public', 'data', 'templates')
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'))
  const errors = []

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf-8'))

    const bySet = {}
    for (const t of data) {
      const setId = t.set_id
      bySet[setId] = bySet[setId] || { 1: 0, 2: 0, 3: 0, total: 0 }
      bySet[setId][t.difficulty] += 1
      bySet[setId].total += 1
    }

    for (const [setId, counts] of Object.entries(bySet)) {
      if (counts.total !== 10 || counts[1] !== 4 || counts[2] !== 4 || counts[3] !== 2) {
        errors.push(`${file} set ${setId}: expected 10(4/4/2), got ${counts.total} (${counts[1]}/${counts[2]}/${counts[3]})`)
      }
    }

    for (const t of data) {
      for (let i = 0; i < 20; i++) {
        const params = generateParams(t.param_schema)
        const prompt = evaluateTemplate(t.prompt_template, params)
        if (hasUnevaluated(prompt)) {
          errors.push(`${file} ${t.id}: unevaluated prompt`)
          break
        }

        const solutionSteps = (t.solution_steps_template || []).map(step => evaluateTemplate(step, params))
        if (solutionSteps.some(hasUnevaluated)) {
          errors.push(`${file} ${t.id}: unevaluated solution step`)
          break
        }

        const hintSteps = (t.hint_steps_template || []).map(step => evaluateTemplate(step, params))
        if (hintSteps.some(hasUnevaluated)) {
          errors.push(`${file} ${t.id}: unevaluated hint step`)
          break
        }

        if (t.type === 'choice') {
          const choices = t.choices_template.map(ch => evaluateTemplate(ch, params))
          const unique = new Set(choices)
          if (unique.size !== choices.length) {
            errors.push(`${file} ${t.id}: duplicate choices for params ${JSON.stringify(params)}`)
            break
          }
          const correct = evaluateTemplate(`{{${t.solver_rule}}}`, params)
          if (choices[0] !== correct) {
            errors.push(`${file} ${t.id}: first choice is not correct answer for params ${JSON.stringify(params)}`)
            break
          }
        }
      }
    }
  }

  if (errors.length) {
    console.error('Template validation failed:')
    for (const err of errors) console.error(' -', err)
    process.exit(1)
  }

  console.log('Template validation passed.')
}

validateTemplates()
