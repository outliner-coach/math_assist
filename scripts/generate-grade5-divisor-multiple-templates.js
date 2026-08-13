const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputDir = path.join(__dirname, '..', 'public', 'data', 'templates')
const families = {
  divisor: ['divisor-missing-factor', 'divisor-greatest', 'divisor-least', 'divisor-count', 'divisor-context-rectangle', 'divisor-largest-proper', 'divisor-smallest-nonunit', 'divisor-factor-pair-sum', 'divisor-remainder-counterexample', 'divisor-nondivisor-count'],
  multiple: ['multiple-second', 'multiple-nth', 'multiple-order-from-value', 'multiple-next', 'multiple-context-packages', 'multiple-context-repeated-distance', 'multiple-next-after-known', 'multiple-missing-multiplier', 'multiple-addition-error-gap', 'multiple-between-consecutive'],
  gcd: ['gcd-structured-direct', 'gcd-common-divisor', 'gcd-first-quotient', 'gcd-second-quotient', 'gcd-context-equal-groups', 'gcd-context-items-per-group', 'gcd-context-square-tile', 'gcd-quotient-sum', 'gcd-too-large-candidate', 'gcd-product-confusion'],
  lcm: ['lcm-structured-direct', 'lcm-common-multiple', 'lcm-first-multiplier', 'lcm-second-common', 'lcm-context-simultaneous-cycle', 'lcm-context-package-total', 'lcm-context-second-meeting', 'lcm-missing-cycle-count', 'lcm-product-error-gap', 'lcm-sum-error-gap'],
}

const configs = {
  A: { a: { min: 2, max: 4 }, n: { min: 12, max: 18 }, g: { min: 2, max: 3 }, k: { min: 3, max: 5 }, item: '연필', object: '연필을', cycle: '두 알림등은' },
  B: { a: { min: 4, max: 6 }, n: { min: 20, max: 27 }, g: { min: 3, max: 4 }, k: { min: 4, max: 6 }, item: '스티커', object: '스티커를', cycle: '두 순환 버스는' },
  C: { a: { min: 6, max: 8 }, n: { min: 28, max: 36 }, g: { min: 4, max: 5 }, k: { min: 5, max: 7 }, item: '실험 재료', object: '실험 재료를', cycle: '두 점검 장치는' },
}

function choiceExpressions(solver) {
  return [solver, `(${solver}) + 1`, `(${solver}) + 2`, `(${solver}) + 3`]
}

function divisorDefinitions(c) {
  const { a, n } = c
  const p = { a }
  const pn = { n }
  return [
    { p, q: '{{a * (a + 1)}} = {{a}} × □입니다. □에 알맞은 약수를 구하세요.', s: 'a + 1', x: ['a+1', 'a+2', 'a+3', 'a+4'], st: ['곱이 {{a * (a + 1)}}이고 한 인수가 {{a}}입니다.', '짝이 되는 약수는 {{a + 1}}입니다.'] },
    { p, q: '{{a * (a + 1)}}의 가장 큰 약수를 구하세요.', s: 'a * (a + 1)', st: ['어떤 자연수의 가장 큰 약수는 자기 자신입니다.', '따라서 {{a * (a + 1)}}입니다.'] },
    { p, q: '{{a * (a + 1)}}의 가장 작은 약수를 구하세요.', s: '1', x: ['1', '2', '3', '4'], st: ['1은 모든 자연수의 약수입니다.', '가장 작은 자연수 약수는 1입니다.'] },
    { p: pn, q: '{{n}}의 약수는 모두 몇 개인가요?', s: 'divisorCount(n)', st: ['1부터 차례로 나누어떨어지는 수를 짝으로 찾습니다.', '약수의 개수는 {{divisorCount(n)}}개입니다.'] },
    { p, q: `${c.object} {{a * (a + 1)}}개 준비해 {{a}}줄에 똑같이 놓습니다. 한 줄에는 몇 개씩 놓이나요?`, s: 'a + 1', x: ['a+1', 'a+2', 'a+3', 'a+4'], st: ['전체 수를 줄 수로 나눕니다.', '{{a * (a + 1)}} ÷ {{a}} = {{a + 1}}입니다.'] },
    { p: pn, q: '{{n}}의 자기 자신을 제외한 가장 큰 약수를 구하세요.', s: 'largestProperDivisor(n)', st: ['가장 작은 1이 아닌 약수로 나눈 몫을 확인합니다.', '가장 큰 진약수는 {{largestProperDivisor(n)}}입니다.'] },
    { p: pn, q: '{{n}}의 1을 제외한 가장 작은 약수를 구하세요.', s: 'smallestDivisorOverOne(n)', x: choiceExpressions('smallestDivisorOverOne(n)'), st: ['2부터 차례로 나누어떨어지는지 확인합니다.', '가장 작은 1 초과 약수는 {{smallestDivisorOverOne(n)}}입니다.'] },
    { p, q: '{{a * (a + 1)}}의 약수 한 쌍 {{a}}, {{a + 1}}의 합을 구하세요.', s: '2 * a + 1', st: ['두 수를 곱하면 {{a * (a + 1)}}이므로 약수 한 쌍입니다.', '합은 {{a}} + {{a + 1}} = {{2 * a + 1}}입니다.'] },
    { p, q: '{{a * (a + 1) + 1}}도 {{a + 1}}의 배수라는 주장이 있습니다. 실제로 나눈 나머지를 구하세요.', s: 'a * (a + 1) + 1 - a * (a + 1)', x: ['1', '2', '3', '4'], st: ['{{a * (a + 1)}}은 {{a + 1}}로 나누어떨어집니다.', '그보다 1 큰 수의 나머지는 1이므로 주장은 틀렸습니다.'] },
    { p: pn, q: '1부터 {{n}}까지 중 {{n}}의 약수가 아닌 수는 몇 개인가요?', s: 'n - divisorCount(n)', st: ['전체 자연수는 {{n}}개이고 약수는 {{divisorCount(n)}}개입니다.', '약수가 아닌 수는 {{n - divisorCount(n)}}개입니다.'] },
  ]
}

function multipleDefinitions(c) {
  const { a, k } = c
  const p = { a, k }
  return [
    { p, q: '{{a}}의 두 번째 배수를 구하세요.', s: '2 * a', x: choiceExpressions('2*a'), st: ['두 번째 배수는 기준 수 {{a}}의 2배입니다.', '{{a}} × 2 = {{2 * a}}입니다.'] },
    { p, q: '{{a}}의 {{k}}번째 배수를 구하세요.', s: 'a * k', st: ['기준 수는 {{a}}이고 순서는 {{k}}번째입니다.', '{{a}} × {{k}} = {{a * k}}입니다.'] },
    { p, q: '{{a * k}}는 {{a}}의 몇 번째 배수인가요?', s: 'k', x: ['k', 'k+1', 'k+2', 'k+3'], st: ['{{a * k}} ÷ {{a}} = {{k}}입니다.', '따라서 {{k}}번째 배수입니다.'] },
    { p, q: '{{a * k}} 바로 다음에 오는 {{a}}의 배수를 구하세요.', s: 'a * (k + 1)', st: ['{{a * k}}는 {{k}}번째 배수입니다.', '현재 배수에 기준 수를 한 번 더하면 {{a * (k + 1)}}입니다.'] },
    { p, q: `${c.object} 한 봉지에 {{a}}개씩 {{k}}봉지 담았습니다. 전체 개수를 구하세요.`, s: 'a * k', x: choiceExpressions('a*k'), st: ['한 봉지의 수와 봉지 수를 곱합니다.', '{{a}} × {{k}} = {{a * k}}입니다.'] },
    { p, q: '한 번에 {{a}}m씩 {{k}}번 이동했습니다. 이동한 거리는 모두 몇 m인가요?', s: 'a * k', st: ['같은 거리 {{a}}m를 {{k}}번 더합니다.', '전체 거리는 {{a * k}}m입니다.'] },
    { p, q: '{{a * k}}보다 큰 수 중 가장 작은 {{a}}의 배수를 구하세요.', s: 'a * (k + 1)', x: choiceExpressions('a*(k+1)'), st: ['{{a * k}}는 {{k}}번째 배수입니다.', '바로 다음 배수는 {{a * (k + 1)}}입니다.'] },
    { p, q: '{{a}} × □ = {{a * k}}입니다. □에 알맞은 배수의 순서를 구하세요.', s: 'k', st: ['곱을 {{a}}로 나눕니다.', '{{a * k}} ÷ {{a}} = {{k}}입니다.'] },
    { p, q: '{{a}}의 {{k}}번째 배수를 구하면서 잘못 계산한 값은 {{a + k}}입니다. 올바른 값은 잘못된 값보다 얼마 큰가요?', s: 'a * k - (a + k)', x: choiceExpressions('a*k-(a+k)'), st: ['올바른 값은 곱 {{a * k}}, 잘못된 값은 합 {{a + k}}입니다.', '차는 {{a * k - (a + k)}}입니다.'] },
    { p, q: '연속한 두 배수 {{a * k}}와 {{a * (k + 1)}} 사이에 있는 자연수는 몇 개인가요?', s: 'a - 1', st: ['연속한 두 배수의 차는 {{a}}입니다.', '양 끝을 제외한 자연수는 {{a - 1}}개입니다.'] },
  ]
}

function gcdDefinitions(c) {
  const { a, g } = c
  const p = { a, g }
  const left = 'g * a'
  const right = 'g * (a + 1)'
  return [
    { p, q: '두 수는 {{g * a}}, {{g * (a + 1)}}입니다. 최대공약수를 구하세요.', s: 'g', x: ['g', 'g+1', 'g+2', 'g+3'], st: ['두 수의 공통 인수는 {{g}}이고 남은 {{a}}, {{a + 1}}은 서로소입니다.', '최대공약수는 {{g}}입니다.'] },
    { p, q: '두 수는 {{g * a}}, {{g * (a + 1)}}입니다. 두 수를 모두 나누어떨어지게 하는 가장 큰 수를 구하세요.', s: 'g', st: ['두 수는 각각 {{g}} × {{a}}, {{g}} × {{a + 1}}입니다.', '가장 큰 공약수는 {{g}}입니다.'] },
    { p, q: '첫째 수는 {{g * a}}이고 최대공약수는 {{g}}입니다. 첫째 수를 최대공약수로 나눈 몫을 구하세요.', s: 'a', x: ['a', 'a+1', 'a+2', 'a+3'], st: ['나눗셈식은 {{g * a}} ÷ {{g}}입니다.', '몫은 {{a}}입니다.'] },
    { p, q: '둘째 수는 {{g * (a + 1)}}이고 최대공약수는 {{g}}입니다. 둘째 수를 최대공약수로 나눈 몫을 구하세요.', s: 'a + 1', st: ['나눗셈식은 {{g * (a + 1)}} ÷ {{g}}입니다.', '몫은 {{a + 1}}입니다.'] },
    { p, q: `${c.item} {{g * a}}개와 공책 {{g * (a + 1)}}권을 남김없이 같은 꾸러미로 나눕니다. 만들 수 있는 꾸러미의 최대 개수는?`, s: 'g', x: ['g', 'g+1', 'g+2', 'g+3'], st: ['꾸러미 수는 두 수의 공약수여야 합니다.', '최대 개수는 최대공약수 {{g}}입니다.'] },
    { p, q: '두 종류의 물건은 각각 {{g * a}}개와 {{g * (a + 1)}}개입니다. 최대 {{g}}모둠에 똑같이 나눌 때 한 모둠이 받는 개수의 합은?', s: '2 * a + 1', st: ['한 모둠은 각각 {{a}}개와 {{a + 1}}개를 받습니다.', '합은 {{2 * a + 1}}개입니다.'] },
    { p, q: '가로 {{g * a}}cm, 세로 {{g * (a + 1)}}cm인 직사각형을 가장 큰 정사각형 타일로 채웁니다. 타일 한 변은 몇 cm인가요?', s: 'g', x: ['g', 'g+1', 'g+2', 'g+3'], st: ['타일 한 변은 두 길이의 공약수여야 합니다.', '가장 큰 길이는 최대공약수 {{g}}cm입니다.'] },
    { p, q: '두 수는 {{g * a}}, {{g * (a + 1)}}입니다. 각 수를 최대공약수로 나눈 두 몫의 합을 구하세요.', s: '2 * a + 1', st: ['두 몫은 각각 {{a}}, {{a + 1}}입니다.', '합은 {{2 * a + 1}}입니다.'] },
    { p, q: '최대공약수라고 주장한 값은 {{2 * g}}입니다. 올바른 최대공약수보다 얼마 큰가요?', s: 'g', x: ['g', 'g+1', 'g+2', 'g+3'], st: ['연속한 두 몫은 공약수가 없으므로 최대공약수는 {{g}}입니다.', '잘못된 값 {{2 * g}}과의 차는 {{g}}입니다.'] },
    { p, q: '두 수는 {{g * a}}, {{g * (a + 1)}}입니다. 최대공약수라고 잘못 계산한 값은 {{g * a * (a + 1)}}입니다. 잘못된 값은 올바른 값보다 얼마 큰가요?', s: 'g * a * (a + 1) - g', st: ['올바른 최대공약수는 {{g}}입니다.', '두 값의 차는 {{g * a * (a + 1) - g}}입니다.'] },
  ]
}

function lcmDefinitions(c) {
  const { a, g } = c
  const p = { a, g }
  const l = 'g * a * (a + 1)'
  return [
    { p, q: '두 수는 {{g * a}}, {{g * (a + 1)}}입니다. 최소공배수를 구하세요.', s: l, x: choiceExpressions(l), st: ['공통 인수는 {{g}}이고 서로소인 두 몫은 {{a}}, {{a + 1}}입니다.', '세 수를 곱하면 최소공배수 {{g * a * (a + 1)}}입니다.'] },
    { p, q: '두 수 {{g * a}}, {{g * (a + 1)}}의 가장 작은 양의 공배수를 구하세요.', s: l, st: ['두 수의 최소공배수를 찾습니다.', '연속한 두 몫이 서로소이므로 {{g * a * (a + 1)}}입니다.'] },
    { p, q: '첫째 수는 {{g * a}}이고 목표 최소공배수는 {{g * a * (a + 1)}}입니다. 첫째 수에 곱할 수를 구하세요.', s: 'a + 1', x: ['a+1', 'a+2', 'a+3', 'a+4'], st: ['최소공배수를 첫째 수로 나눕니다.', '곱할 수는 {{a + 1}}입니다.'] },
    { p, q: '최소공배수 {{g * a * (a + 1)}}의 2배인 두 번째 양의 공배수를 구하세요.', s: '2 * g * a * (a + 1)', st: ['양의 공배수는 최소공배수의 배수입니다.', '두 번째 공배수는 {{2 * g * a * (a + 1)}}입니다.'] },
    { p, q: `${c.cycle} 각각 {{g * a}}초와 {{g * (a + 1)}}초마다 움직입니다. 동시에 움직인 뒤 다시 동시에 움직이는 최소 시간은?`, s: l, x: choiceExpressions(l), st: ['다시 동시에 움직이는 시간은 두 주기의 공배수입니다.', '가장 짧은 시간은 최소공배수 {{g * a * (a + 1)}}초입니다.'] },
    { p, q: `${c.object} {{g * a}}개씩 또는 {{g * (a + 1)}}개씩 묶어도 남지 않게 하려 합니다. 필요한 최소 개수는?`, s: l, st: ['전체 수는 두 묶음 크기의 공배수여야 합니다.', '최소 개수는 {{g * a * (a + 1)}}입니다.'] },
    { p, q: '두 주기가 처음 함께 시작했습니다. 두 번째로 함께 시작하는 시각은 몇 초 뒤인가요?', s: '2 * g * a * (a + 1) - g * a * (a + 1)', x: choiceExpressions(l), st: ['시작 시각 0초 다음의 첫 재회가 두 번째 동시 시작입니다.', '최소공배수인 {{g * a * (a + 1)}}초 뒤입니다.'] },
    { p, q: '{{g * a}} × □ = 최소공배수 {{g * a * (a + 1)}}입니다. □를 구하세요.', s: 'g * a * (a + 1) / (g * a)', st: ['최소공배수를 {{g * a}}로 나눕니다.', '□는 {{a + 1}}입니다.'] },
    { p, q: '두 수를 곱해 얻은 잘못된 최소공배수는 {{g * g * a * (a + 1)}}입니다. 잘못된 값은 올바른 값보다 얼마 큰가요?', s: 'g * g * a * (a + 1) - g * a * (a + 1)', x: choiceExpressions('g*g*a*(a+1)-g*a*(a+1)'), st: ['두 수의 곱에서는 공통 인수 {{g}}가 두 번 포함됩니다.', '올바른 값과의 차는 {{g * g * a * (a + 1) - g * a * (a + 1)}}입니다.'] },
    { p, q: '두 수의 합은 {{2 * g * a + g}}입니다. 이 합을 최소공배수라고 잘못 답했을 때 올바른 값은 이 합보다 얼마 큰가요?', s: 'g * a * (a + 1) - (2 * g * a + g)', st: ['올바른 최소공배수는 {{g * a * (a + 1)}}이고 두 수의 합은 {{2 * g * a + g}}입니다.', '차는 {{g * a * (a + 1) - (2 * g * a + g)}}입니다.'] },
  ]
}

const builders = { divisor: divisorDefinitions, multiple: multipleDefinitions, gcd: gcdDefinitions, lcm: lcmDefinitions }
function buildBank(name) {
  return Object.entries(configs).flatMap(([setId, config]) => builders[name](config).map((d, index) => {
    const slot = index + 1
    const type = slot % 2 ? 'choice' : 'number'
    const base = { id: `tmpl-${name}-${setId}-${String(slot).padStart(2, '0')}`, concept_id: `${name}-001`, type, difficulty: slot <= 4 ? 1 : slot <= 8 ? 2 : 3, set_id: setId, problem_family: families[name][index] }
    const template = { ...base, blueprint: getReviewedBlueprint(base), param_schema: d.p, prompt_template: d.q, solver_rule: d.s, solution_steps_template: d.st, hint_steps_template: [slot <= 4 ? '약수와 배수의 정의를 곱셈식으로 나타내요.' : slot <= 8 ? '상황에서 남김없이 나누거나 반복되는 양을 식으로 나타내요.' : '주장에 사용한 계산과 올바른 계산을 비교해요.', name === 'gcd' ? '두 수를 모두 나누는 가장 큰 수를 확인해요.' : name === 'lcm' ? '두 수로 모두 나누어떨어지는 가장 작은 수를 확인해요.' : '곱셈과 나눗셈의 관계를 확인해요.'] }
    if (type === 'choice') template.choices_template = d.x.map(x => `{{${x}}}`)
    return template
  }))
}

const banks = Object.fromEntries(Object.keys(builders).map(name => [name, buildBank(name)]))
function writeTemplates() {
  for (const [name, templates] of Object.entries(banks)) {
    const file = path.join(outputDir, `${name}.json`)
    fs.writeFileSync(file, `${JSON.stringify(templates, null, 2)}\n`)
    console.log(`Wrote ${templates.length} Grade 5 ${name} templates to ${file}`)
  }
}
if (require.main === module) writeTemplates()
module.exports = { families, configs, builders, banks, writeTemplates }
