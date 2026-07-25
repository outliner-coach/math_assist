const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputDir = path.join(__dirname, '..', 'public', 'data', 'templates')

const families = {
  simplify: [
    'simplify-reduce-scaled-fraction', 'simplify-identify-numerator',
    'simplify-identify-denominator', 'simplify-greatest-common-factor',
    'simplify-equivalent-numerator', 'simplify-context-part',
    'simplify-missing-scale-factor', 'simplify-component-sum',
    'simplify-one-sided-division-error', 'simplify-additive-change-error',
  ],
  commonden: [
    'commonden-consecutive-denominators', 'commonden-first-converted-numerator',
    'commonden-second-converted-numerator', 'commonden-first-scale-factor',
    'commonden-compare-first-numerator', 'commonden-converted-numerator-sum',
    'commonden-inverse-original-numerator', 'commonden-converted-numerator-gap',
    'commonden-denominator-sum-error', 'commonden-scale-factor-error',
  ],
}

const configs = {
  A: { n: { min: 1, max: 3 }, f: { min: 2, max: 4 }, d: { min: 3, max: 5 }, context: '수 모형은 전체 {{n * f + f}}칸 중 {{n * f}}칸이 색칠되어 있습니다.', pair: '두 분수의 값' },
  B: { n: { min: 2, max: 4 }, f: { min: 3, max: 5 }, d: { min: 5, max: 7 }, context: '리본을 같은 길이 {{n * f + f}}칸으로 나누었고 그중 {{n * f}}칸을 사용했습니다.', pair: '두 리본의 사용 비율' },
  C: { n: { min: 3, max: 5 }, f: { min: 4, max: 6 }, d: { min: 7, max: 9 }, context: '작업 구간을 같은 길이 {{n * f + f}}칸으로 나누었고 그중 {{n * f}}칸을 완료했습니다.', pair: '두 작업 구간의 완료 비율' },
}

function simplifyDefinitions(config) {
  const { n, f } = config
  const params = { n, f }
  return [
    { params, prompt: '주어진 분수는 {{n * f}}/{{n * f + f}}입니다. 이를 기약분수로 나타내세요.', solver: 'reduceFrac(n * f, n * f + f)', choices: ['reduceFrac(n*f,n*f+f)', 'reduceFracOff(n*f,n*f+f,1)', 'reduceFracOff(n*f,n*f+f,2)', 'reduceFracOff(n*f,n*f+f,3)'], steps: ['분자와 분모의 공약수는 {{f}}입니다.', '두 수를 같은 공약수로 나누면 {{reduceFrac(n * f, n * f + f)}}입니다.'] },
    { params, prompt: '주어진 분수는 {{n * f}}/{{n * f + f}}입니다. 기약분수로 만들었을 때 분자를 구하세요.', solver: 'n', steps: ['분자와 분모를 같은 수 {{f}}로 나눕니다.', '기약분수는 {{n}}/{{n + 1}}이므로 분자는 {{n}}입니다.'] },
    { params, prompt: '주어진 분수는 {{n * f}}/{{n * f + f}}입니다. 기약분수로 만들었을 때 분모를 구하세요.', solver: 'n + 1', choices: ['n+1', 'n+2', 'n+3', 'n+4'], steps: ['분자와 분모를 같은 수 {{f}}로 나눕니다.', '기약분수는 {{n}}/{{n + 1}}이므로 분모는 {{n + 1}}입니다.'] },
    { params, prompt: '분수 {{n * f}}/{{n * f + f}}의 분자와 분모의 최대공약수를 구하세요.', solver: 'f', steps: ['두 수는 각각 {{n}} × {{f}}, {{n + 1}} × {{f}}입니다.', '연속한 {{n}}과 {{n + 1}}은 서로소이므로 최대공약수는 {{f}}입니다.'] },
    { params, prompt: '{{n}}/{{n + 1}} = □/{{n * f + f}}입니다. □에 알맞은 수를 구하세요.', solver: 'n * f', choices: ['n*f', 'n*f+1', 'n*f+2', 'n*f+3'], steps: ['분모는 {{n + 1}}에서 {{n * f + f}}로 {{f}}배가 되었습니다.', '분자도 {{f}}배 하므로 □는 {{n * f}}입니다.'] },
    { params, prompt: `${config.context} 이 부분을 나타내는 분수는 {{n * f}}/{{n * f + f}}입니다. 이를 기약분수로 나타내세요.`, solver: 'reduceFrac(n * f, n * f + f)', steps: ['부분을 전체로 나눈 분수는 {{n * f}}/{{n * f + f}}입니다.', '분자와 분모를 같은 수 {{f}}로 나누면 {{reduceFrac(n * f, n * f + f)}}입니다.'] },
    { params, prompt: '{{n}}/{{n + 1}}의 분자와 분모에 같은 수를 곱한 결과가 {{n * f}}/{{n * f + f}}입니다. 곱한 수를 구하세요.', solver: 'f', choices: ['f', 'f+1', 'f+2', 'f+3'], steps: ['{{n}} × 어떤 수 = {{n * f}}입니다.', '분모에도 같은 수를 곱했으므로 곱한 수는 {{f}}입니다.'] },
    { params, prompt: '주어진 분수는 {{n * f}}/{{n * f + f}}입니다. 약분한 뒤 분자와 분모의 합을 구하세요.', solver: '2 * n + 1', steps: ['약분한 분수는 {{n}}/{{n + 1}}입니다.', '분자와 분모의 합은 {{n}} + {{n + 1}} = {{2 * n + 1}}입니다.'] },
    { params, prompt: '주어진 분수는 {{n * f}}/{{n * f + f}}입니다. 분자만 나누고 분모를 그대로 둔 잘못된 값은 {{n}}/{{n * f + f}}입니다. 올바른 값은 잘못된 값보다 얼마 큰가요?', solver: 'fracSub(n, n + 1, n, n * f + f)', choices: ['fracSub(n,n+1,n,n*f+f)', 'fracSubOff(n,n+1,n,n*f+f,1)', 'fracSubOff(n,n+1,n,n*f+f,2)', 'fracSubOff(n,n+1,n,n*f+f,3)'], steps: ['올바른 약분 결과는 {{n}}/{{n + 1}}입니다.', '잘못된 값과의 차는 {{fracSub(n, n + 1, n, n * f + f)}}입니다.'] },
    { params, prompt: '{{n}}/{{n + 1}}의 분자와 분모에 1을 더하면 {{n + 1}}/{{n + 2}}입니다. 바뀐 값은 원래 값보다 얼마 큰가요?', solver: 'fracSub(n + 1, n + 2, n, n + 1)', steps: ['분자와 분모에 같은 수를 더하면 동치분수가 되지 않습니다.', '두 값의 차는 {{fracSub(n + 1, n + 2, n, n + 1)}}입니다.'] },
  ]
}

function commonDenDefinitions(config) {
  const { d } = config
  const params = { d }
  const f1 = '$\\frac{ {{d - 1}} }{ {{d}} }$'
  const f2 = '$\\frac{ 1 }{ {{d + 1}} }$'
  const pair = `${config.pair}은 각각 ${f1}, ${f2}입니다.`
  return [
    { params, prompt: `${pair} 통분할 때 최소 공통 분모를 구하세요.`, solver: 'commonDen(d, d + 1)', choices: ['commonDen(d,d+1)', 'commonDen(d,d+1)+1', 'commonDen(d,d+1)+2', 'commonDen(d,d+1)+3'], steps: ['연속한 두 분모 {{d}}, {{d + 1}}은 서로소입니다.', '최소 공통 분모는 {{d * (d + 1)}}입니다.'] },
    { params, prompt: `${pair} 통분하면 첫째 분자의 새 값은 얼마인가요?`, solver: '(d - 1) * (d + 1)', steps: ['첫째 분모에 {{d + 1}}을 곱합니다.', '첫째 분자도 같은 수를 곱하므로 {{(d - 1) * (d + 1)}}입니다.'] },
    { params, prompt: `${pair} 통분하면 둘째 분자의 새 값은 얼마인가요?`, solver: 'd', choices: ['d', 'd+1', 'd+2', 'd+3'], steps: ['둘째 분모에 {{d}}를 곱합니다.', '둘째 분자 1에도 같은 수를 곱하므로 {{d}}입니다.'] },
    { params, prompt: `${pair} 통분할 때 첫째 분수의 분자와 분모에 곱하는 수를 구하세요.`, solver: 'd + 1', steps: ['공통 분모는 {{d * (d + 1)}}입니다.', '공통 분모를 첫째 분모로 나누면 {{d + 1}}입니다.'] },
    { params, prompt: `${pair} 통분하여 비교하려고 합니다. 첫째 분자의 새 값을 구하세요.`, solver: '(d - 1) * (d + 1)', choices: ['(d-1)*(d+1)', '(d-1)*(d+1)+1', '(d-1)*(d+1)+2', '(d-1)*(d+1)+3'], steps: ['공통 분모는 {{d * (d + 1)}}입니다.', '첫째 분자는 {{d + 1}}배 한 {{(d - 1) * (d + 1)}}입니다.'] },
    { params, prompt: `${pair} 통분한 뒤 새 분자 두 개의 합을 구하세요.`, solver: '(d - 1) * (d + 1) + d', steps: ['새 분자는 {{(d - 1) * (d + 1)}}과 {{d}}입니다.', '두 수의 합은 {{(d - 1) * (d + 1) + d}}입니다.'] },
    { params, prompt: `둘째 분수는 ${f2}입니다. 두 분수를 통분했더니 첫째 분수가 {{(d - 1) * (d + 1)}}/{{d * (d + 1)}}이 되었습니다. 첫째 분수의 원래 분자를 구하세요.`, solver: 'd - 1', choices: ['d-1', 'd', 'd+1', 'd+2'], steps: ['첫째 분모는 {{d}}에서 {{d * (d + 1)}}로 {{d + 1}}배가 되었습니다.', '새 분자를 {{d + 1}}로 나누면 원래 분자 {{d - 1}}입니다.'] },
    { params, prompt: `${pair} 통분했습니다. 새 첫째 분자에서 새 둘째 분자를 뺀 값을 구하세요.`, solver: '(d - 1) * (d + 1) - d', steps: ['새 분자는 각각 {{(d - 1) * (d + 1)}}, {{d}}입니다.', '두 새 분자의 차는 {{(d - 1) * (d + 1) - d}}입니다.'] },
    { params, prompt: `${pair} 공통 분모를 두 분모의 합 {{2 * d + 1}}이라고 잘못 정했습니다. 최소 공통 분모는 이 값보다 얼마 큰가요?`, solver: 'd * (d + 1) - (2 * d + 1)', choices: ['d*(d+1)-(2*d+1)', 'd*(d+1)-(2*d+1)+1', 'd*(d+1)-(2*d+1)+2', 'd*(d+1)-(2*d+1)+3'], steps: ['최소 공통 분모는 연속한 두 분모의 곱 {{d * (d + 1)}}입니다.', '잘못 정한 {{2 * d + 1}}과의 차는 {{d * (d + 1) - (2 * d + 1)}}입니다.'] },
    { params, prompt: `첫째 분수는 ${f1}이고 목표 공통 분모는 {{d * (d + 1)}}입니다. 잘못 계산한 새 분자는 {{(d - 1) * d}}입니다. 올바른 새 분자는 이 값보다 얼마 큰가요?`, solver: '(d - 1) * (d + 1) - (d - 1) * d', steps: ['올바른 새 분자는 {{(d - 1) * (d + 1)}}, 잘못된 새 분자는 {{(d - 1) * d}}입니다.', '두 값의 차는 {{(d - 1) * (d + 1) - (d - 1) * d}}입니다.'] },
  ]
}

function buildBank(name) {
  return Object.entries(configs).flatMap(([setId, config]) => {
    const defs = name === 'simplify' ? simplifyDefinitions(config) : commonDenDefinitions(config)
    return defs.map((def, index) => {
      const slot = index + 1
      const type = slot % 2 ? 'choice' : 'number'
      const base = { id: `tmpl-${name}-${setId}-${String(slot).padStart(2, '0')}`, concept_id: `${name}-001`, type, difficulty: slot <= 4 ? 1 : slot <= 8 ? 2 : 3, set_id: setId, problem_family: families[name][index] }
      const template = { ...base, blueprint: getReviewedBlueprint(base), param_schema: def.params, prompt_template: def.prompt, solver_rule: def.solver, solution_steps_template: def.steps, hint_steps_template: [slot <= 4 ? '분자와 분모에 같은 수를 곱하거나 나누는 관계를 확인해요.' : slot <= 8 ? '바뀐 분모의 배수를 먼저 찾고 분자에도 같은 배수를 적용해요.' : '올바른 방법과 잘못된 방법을 각각 계산해 차이를 비교해요.', name === 'simplify' ? '분수의 값이 같게 유지되는지 확인해요.' : '공통 분모는 두 분모의 공배수여야 해요.'] }
      if (type === 'choice') template.choices_template = def.choices.map(choice => `{{${choice}}}`)
      return template
    })
  })
}

const banks = { simplify: buildBank('simplify'), commonden: buildBank('commonden') }

function writeTemplates() {
  for (const [name, templates] of Object.entries(banks)) {
    const file = path.join(outputDir, `${name}.json`)
    fs.writeFileSync(file, `${JSON.stringify(templates, null, 2)}\n`)
    console.log(`Wrote ${templates.length} Grade 5 ${name} templates to ${file}`)
  }
}

if (require.main === module) writeTemplates()
module.exports = { families, configs, simplifyDefinitions, commonDenDefinitions, banks, writeTemplates }
