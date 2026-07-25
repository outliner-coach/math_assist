const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'decimalmul.json'
)

const familyBySlot = [
  'decimalmul-decimal-by-natural',
  'decimalmul-decimal-by-decimal',
  'decimalmul-place-value-natural-product',
  'decimalmul-place-value-double-decimal',
  'decimalmul-context-repeated-quantity',
  'decimalmul-context-combined-total',
  'decimalmul-context-rectangle-area',
  'decimalmul-context-remaining-quantity',
  'decimalmul-missed-decimal-error',
  'decimalmul-factor-scale-gap',
]

const setConfigs = {
  A: {
    ranges: {
      a: { min: 4, max: 9 },
      b: { min: 3, max: 8 },
      c: { min: 2, max: 5 },
    },
    directPrompts: [
      '{{dec1(a)}} × {{b}} = ?',
      '{{dec1(a)}} × {{dec1(b)}} = ?',
      '{{a}} × {{b}} = {{a * b}}임을 이용하여 {{dec1(a)}} × {{b}}의 값을 구하세요.',
      '{{a}} × {{b}} = {{a * b}}임을 이용하여 {{dec1(a)}} × {{dec1(b)}}의 값을 구하세요.',
    ],
    contexts: {
      repeated: '리본 한 줄의 길이는 {{dec1(a)}}m입니다. 같은 리본 {{b}}줄의 전체 길이는 몇 m인가요?',
      combined: '물통 {{b}}개에 각각 {{dec1(a)}}L씩 물을 담고, 여기에 {{dec1(c)}}L를 더 담았습니다. 물은 모두 몇 L인가요?',
      area: '가로가 {{dec1(a)}}m, 세로가 {{dec1(b)}}m인 직사각형 화단의 넓이는 몇 m²인가요?',
      remaining: '주스가 {{dec1(a)}}L씩 든 병이 {{b}}개 있습니다. 이 중 {{dec1(c)}}L를 마셨다면 남은 주스는 몇 L인가요?',
    },
    error: '서윤이의 계산식은 {{dec1(a)}} × {{b}}입니다. 소수점을 빠뜨려 {{a}} × {{b}}로 계산했다면, 잘못 계산한 값은 올바른 값보다 얼마 더 큰가요?',
    scale: '첫 번째 계산은 {{dec1(a)}} × {{b}}, 두 번째 계산은 {{dec1(a)}} × {{dec1(b)}}입니다. 두 번째 계산에서 한 인수가 첫 번째의 10분의 1로 바뀌었습니다. 두 곱의 차이는 얼마인가요?',
  },
  B: {
    ranges: {
      a: { min: 6, max: 12 },
      b: { min: 5, max: 10 },
      c: { min: 3, max: 7 },
    },
    directPrompts: [
      '주어진 수: {{dec1(a)}}. 이 수를 {{b}}번 더한 값과 같은 곱을 구하세요.',
      '{{dec1(a)}}의 {{dec1(b)}}배를 구하세요.',
      '자연수 계산 {{a}} × {{b}} = {{a * b}}에서 첫 번째 인수만 10분의 1로 바꾸면 곱은 얼마인가요?',
      '자연수 계산 {{a}} × {{b}} = {{a * b}}에서 두 인수를 모두 10분의 1로 바꾸면 곱은 얼마인가요?',
    ],
    contexts: {
      repeated: '끈 한 가닥의 길이는 {{dec1(a)}}m입니다. 같은 끈 {{b}}가닥의 전체 길이는 몇 m인가요?',
      combined: '상자 {{b}}개에 각각 {{dec1(a)}}kg씩 물품을 담고, 낱개 물품 {{dec1(c)}}kg을 더했습니다. 전체 무게는 몇 kg인가요?',
      area: '가로가 {{dec1(a)}}m, 세로가 {{dec1(b)}}m인 직사각형 게시판의 넓이는 몇 m²인가요?',
      remaining: '페인트가 {{dec1(a)}}L씩 든 통이 {{b}}개 있습니다. {{dec1(c)}}L를 사용했다면 남은 페인트는 몇 L인가요?',
    },
    error: '도윤이의 계산식은 {{dec1(a)}} × {{b}}입니다. 소수점을 생각하지 않고 {{a}} × {{b}}의 값을 답으로 썼다면, 두 답의 차이는 얼마인가요?',
    scale: '계산 A: {{dec1(a)}} × {{b}}. 계산 B: {{dec1(a)}} × {{dec1(b)}}. 계산 B의 두 번째 인수는 계산 A의 10분의 1입니다. 두 곱의 차이는 얼마인가요?',
  },
  C: {
    ranges: {
      a: { min: 8, max: 15 },
      b: { min: 7, max: 12 },
      c: { min: 4, max: 9 },
    },
    directPrompts: [
      '먼저 {{a}} × {{b}}를 계산한 뒤 소수점을 왼쪽으로 한 자리 옮기면 얼마인가요?',
      '먼저 {{a}} × {{b}}를 계산한 뒤 소수점을 왼쪽으로 두 자리 옮기면 얼마인가요?',
      '{{a * b}}의 10분의 1은 {{dec1(a)}} × {{b}}의 값과 같습니다. 값을 구하세요.',
      '{{a * b}}의 100분의 1은 {{dec1(a)}} × {{dec1(b)}}의 값과 같습니다. 값을 구하세요.',
    ],
    contexts: {
      repeated: '달리기 한 바퀴의 거리는 {{dec1(a)}}km입니다. {{b}}바퀴를 달린 거리는 모두 몇 km인가요?',
      combined: '급식실에서 우유를 {{dec1(a)}}L씩 {{b}}통 준비하고 {{dec1(c)}}L를 추가했습니다. 준비한 우유는 모두 몇 L인가요?',
      area: '가로가 {{dec1(a)}}m, 세로가 {{dec1(b)}}m인 직사각형 무대의 넓이는 몇 m²인가요?',
      remaining: '세정제가 {{dec1(a)}}L씩 든 통이 {{b}}개 있습니다. 청소에 {{dec1(c)}}L를 사용했다면 남은 세정제는 몇 L인가요?',
    },
    error: '하린이는 {{dec1(a)}} × {{b}}를 자연수 곱 {{a}} × {{b}}와 같다고 보았습니다. 이 잘못된 값과 올바른 값의 차이는 얼마인가요?',
    scale: '계산 A는 {{dec1(a)}} × {{b}}, 계산 B는 {{dec1(a)}} × {{dec1(b)}}입니다. B의 두 번째 인수는 A의 10분의 1입니다. 계산 A의 값은 계산 B의 값보다 얼마 더 큰가요?',
  },
}

function buildSetDefinitions(config) {
  const { a, b, c } = config.ranges

  return [
    {
      params: { a, b },
      prompt: config.directPrompts[0],
      solver: 'decTimesNat(a, b)',
      steps: ['자연수 곱은 {{a}} × {{b}} = {{a * b}}입니다.', '한 인수가 소수 한 자리 수이므로 곱은 {{decTimesNat(a, b)}}입니다.'],
    },
    {
      params: { a, b },
      prompt: config.directPrompts[1],
      solver: 'decTimesDec(a, b)',
      steps: ['자연수 곱은 {{a}} × {{b}} = {{a * b}}입니다.', '두 인수가 모두 소수 한 자리 수이므로 곱은 {{decTimesDec(a, b)}}입니다.'],
    },
    {
      params: { a, b },
      prompt: config.directPrompts[2],
      solver: 'decTimesNat(a, b)',
      steps: ['{{dec1(a)}}은 {{a}}의 10분의 1입니다.', '따라서 자연수 곱 {{a * b}}의 10분의 1인 {{decTimesNat(a, b)}}가 답입니다.'],
    },
    {
      params: { a, b },
      prompt: config.directPrompts[3],
      solver: 'decTimesDec(a, b)',
      steps: ['두 인수가 각각 자연수의 10분의 1입니다.', '따라서 자연수 곱 {{a * b}}의 100분의 1인 {{decTimesDec(a, b)}}가 답입니다.'],
    },
    {
      params: { a, b },
      prompt: config.contexts.repeated,
      solver: 'decTimesNat(a, b)',
      steps: ['한 단위의 양 {{dec1(a)}}에 단위 수 {{b}}를 곱합니다.', '전체 양은 {{dec1(a)}} × {{b}} = {{decTimesNat(a, b)}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.combined,
      solver: 'decTimesNat(a, b) + dec1(c)',
      steps: ['묶음에 든 양은 {{dec1(a)}} × {{b}} = {{decTimesNat(a, b)}}입니다.', '추가한 {{dec1(c)}}만큼을 더하면 전체는 {{decTimesNat(a, b) + dec1(c)}}입니다.'],
    },
    {
      params: { a, b },
      prompt: config.contexts.area,
      solver: 'decTimesDec(a, b)',
      steps: ['직사각형의 넓이는 가로와 세로의 곱입니다.', '{{dec1(a)}} × {{dec1(b)}} = {{decTimesDec(a, b)}}이므로 넓이는 {{decTimesDec(a, b)}}m²입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.remaining,
      solver: 'decTimesNat(a, b) - dec1(c)',
      steps: ['처음 전체 양은 {{dec1(a)}} × {{b}} = {{decTimesNat(a, b)}}입니다.', '사용한 {{dec1(c)}}만큼을 빼면 {{decTimesNat(a, b) - dec1(c)}}가 남습니다.'],
    },
    {
      params: { a, b },
      prompt: config.error,
      solver: 'a * b - decTimesNat(a, b)',
      steps: ['올바른 곱은 {{dec1(a)}} × {{b}} = {{decTimesNat(a, b)}}입니다.', '잘못 계산한 값은 {{a * b}}이므로 차이는 {{a * b - decTimesNat(a, b)}}입니다.'],
    },
    {
      params: { a, b },
      prompt: config.scale,
      solver: 'decTimesNat(a, b) - decTimesDec(a, b)',
      steps: ['첫 번째 곱은 {{decTimesNat(a, b)}}, 두 번째 곱은 {{decTimesDec(a, b)}}입니다.', '두 번째 인수가 10분의 1이 되면서 생긴 곱의 차이는 {{decTimesNat(a, b) - decTimesDec(a, b)}}입니다.'],
    },
  ]
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-decimalmul-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'decimalmul-001',
      type,
      difficulty,
      set_id: setId,
      problem_family: familyBySlot[index],
    }
    const template = {
      ...base,
      blueprint: getReviewedBlueprint(base),
      param_schema: definition.params,
      prompt_template: definition.prompt,
      solver_rule: definition.solver,
      solution_steps_template: definition.steps,
      hint_steps_template: [
        slot <= 4
          ? '먼저 소수점을 제외한 자연수의 곱을 구해요.'
          : slot <= 8
            ? '한 단위의 양과 단위 수를 찾아 곱셈식으로 나타내요.'
            : '두 계산에서 인수의 소수점 위치가 어떻게 다른지 비교해요.',
        slot <= 4
          ? '인수들의 소수 자릿수를 합한 만큼 곱의 소수점을 옮겨요.'
          : slot <= 8
            ? '곱한 뒤 추가한 양은 더하고 사용한 양은 빼요.'
            : '올바른 곱과 잘못된 곱을 각각 구한 뒤 차이를 계산해요.',
      ],
    }

    if (type === 'choice') {
      template.choices_template = [
        `{{${definition.solver}}}`,
        `{{(${definition.solver}) + 1}}`,
        `{{(${definition.solver}) + 2}}`,
        `{{(${definition.solver}) + 3}}`,
      ]
    }

    return template
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 decimal-multiplication templates to ${outputPath}`)
}

if (require.main === module) {
  writeTemplates()
}

module.exports = {
  familyBySlot,
  setConfigs,
  buildSetDefinitions,
  templates,
  writeTemplates,
}
