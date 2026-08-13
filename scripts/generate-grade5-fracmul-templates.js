const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'fracmul.json'
)

const familyBySlot = [
  'fracmul-fraction-natural',
  'fracmul-natural-fraction',
  'fracmul-fraction-fraction',
  'fracmul-cancel-before-product',
  'fracmul-context-part-of-quantity',
  'fracmul-context-part-of-part',
  'fracmul-missing-factor',
  'fracmul-context-fractional-area',
  'fracmul-denominator-omission-error',
  'fracmul-product-size-gap',
]

const setConfigs = {
  A: {
    ranges: {
      n: { min: 1, max: 3 },
      b: { min: 2, max: 4 },
      m: { min: 2, max: 4 },
      c: { min: 2, max: 4 },
    },
    directPrompts: [
      '계산식: {{n}}/{{n + b}} × {{m}}. 값을 구하세요.',
      '계산식: {{m}} × {{n}}/{{n + b}}. 값을 구하세요.',
      '계산식: {{n}}/{{n + b}} × {{m}}/{{m + c}}. 값을 구하세요.',
      '계산식: {{n}}/{{n + b}} × {{n + b}}/{{m + c}}. 곱하기 전에 약분하여 계산하세요.',
    ],
    contexts: {
      quantity: '리본의 전체 길이는 {{m + c}}m이고 사용한 비율은 {{n}}/{{n + b}}입니다. 사용한 리본은 몇 m인가요?',
      part: '리본에서 장식에 쓴 비율은 {{n}}/{{n + b}}입니다. 그중 {{m}}/{{m + c}}에 별을 붙였습니다. 별을 붙인 부분은 전체의 얼마인가요?',
      missing: '{{n}}/{{n + b}} × 어떤 분수 = {{fracMul(n, n + b, m, m + c)}}입니다. 어떤 분수를 구하세요.',
      area: '가로가 {{n}}/{{n + b}}m, 세로가 {{m}}/{{m + c}}m인 직사각형 색종이의 넓이는 몇 m²인가요?',
    },
    denominatorError: '계산식은 {{n}}/{{n + b}} × 1/{{c}}입니다. 두 번째 분모를 빠뜨린 답은 {{n}}/{{n + b}}입니다. 잘못된 답은 올바른 답보다 얼마 큰가요?',
    sizeGap: '처음 분수는 {{n}}/{{n + b}}이고 곱하는 수는 1보다 작은 {{m}}/{{m + c}}입니다. 처음 분수는 곱보다 얼마 큰가요?',
  },
  B: {
    ranges: {
      n: { min: 2, max: 5 },
      b: { min: 3, max: 6 },
      m: { min: 3, max: 6 },
      c: { min: 2, max: 5 },
    },
    directPrompts: [
      '주어진 분수는 {{n}}/{{n + b}}입니다. 이 분수를 {{m}}번 더한 값과 같은 곱을 구하세요.',
      '자연수 {{m}}의 {{n}}/{{n + b}}배를 구하세요.',
      '두 분수는 {{n}}/{{n + b}}, {{m}}/{{m + c}}입니다. 두 수의 곱을 기약분수로 나타내세요.',
      '계산식: {{n}}/{{n + b}} × {{n + b}}/{{m + c}}. 같은 인수를 먼저 약분한 뒤 값을 구하세요.',
    ],
    contexts: {
      quantity: '전체 물은 {{m + c}}L이고 화분에 준 비율은 {{n}}/{{n + b}}입니다. 화분에 준 물은 몇 L인가요?',
      part: '화단의 {{n}}/{{n + b}}에 꽃을 심고, 그중 {{m}}/{{m + c}}에 이름표를 세웠습니다. 이름표를 세운 부분은 화단 전체의 얼마인가요?',
      missing: '{{n}}/{{n + b}}에 어떤 분수를 곱했더니 {{fracMul(n, n + b, m, m + c)}}이 되었습니다. 곱한 분수를 구하세요.',
      area: '가로 {{n}}/{{n + b}}m, 세로 {{m}}/{{m + c}}m인 직사각형 화단의 넓이를 구하세요.',
    },
    denominatorError: '서아가 계산한 식은 {{n}}/{{n + b}} × 1/{{c}}입니다. 두 번째 분모를 빠뜨린 답은 {{n}}/{{n + b}}입니다. 서아의 답은 올바른 값보다 얼마 큰가요?',
    sizeGap: '첫 번째 수는 {{n}}/{{n + b}}입니다. 두 번째 수를 만들 때 곱하는 수는 {{m}}/{{m + c}}입니다. 첫 번째 수와 두 번째 수의 차이는 얼마인가요?',
  },
  C: {
    ranges: {
      n: { min: 4, max: 7 },
      b: { min: 4, max: 8 },
      m: { min: 5, max: 8 },
      c: { min: 3, max: 6 },
    },
    directPrompts: [
      '{{n}}/{{n + b}}의 {{m}}배를 분수로 나타내세요.',
      '{{m}}개 묶음에 각각 {{n}}/{{n + b}}만큼 있을 때 전체 양을 구하세요.',
      '첫째 분수: {{n}}/{{n + b}}. 둘째 분수: {{m}}/{{m + c}}. 분자끼리, 분모끼리 곱하세요.',
      '교차 약분할 공통 인수는 {{n + b}}입니다. {{n}}/{{n + b}} × {{n + b}}/{{m + c}}의 값을 구하세요.',
    ],
    contexts: {
      quantity: '길의 전체 거리는 {{m + c}}km이고 걸은 비율은 {{n}}/{{n + b}}입니다. 걸은 거리는 몇 km인가요?',
      part: '벽에서 칠한 비율은 {{n}}/{{n + b}}입니다. 그중 {{m}}/{{m + c}}에 무늬를 넣었습니다. 무늬를 넣은 부분은 벽 전체의 얼마인가요?',
      missing: '어떤 분수와 {{n}}/{{n + b}}의 곱이 {{fracMul(n, n + b, m, m + c)}}입니다. 어떤 분수를 구하세요.',
      area: '가로가 {{n}}/{{n + b}}m이고 세로가 {{m}}/{{m + c}}m인 직사각형 모형의 넓이는 몇 m²인가요?',
    },
    denominatorError: '민호가 계산한 식은 {{n}}/{{n + b}} × 1/{{c}}입니다. 두 번째 분모를 빠뜨린 답은 {{n}}/{{n + b}}입니다. 잘못된 값과 올바른 값의 차이는 얼마인가요?',
    sizeGap: '처음 분수는 {{n}}/{{n + b}}이고 곱하는 수는 {{m}}/{{m + c}}입니다. 곱하면 값이 더 커진다는 주장이 있지만, 실제로 처음 분수는 곱보다 얼마 큰가요?',
  },
}

function buildSetDefinitions(config) {
  const { n, b, m, c } = config.ranges

  return [
    {
      params: { n, b, m },
      prompt: config.directPrompts[0],
      solver: 'fracMul(n, n + b, m, 1)',
      choices: [
        'fracMul(n, n + b, m, 1)',
        'reduceFrac(n * m + 1, n + b)',
        'reduceFrac(n * m + 2, n + b)',
        'reduceFrac(n * m + 3, n + b)',
      ],
      steps: ['자연수는 {{m}}이고 곱할 분자는 {{n}}입니다. 두 수를 곱합니다.', '곱한 뒤의 분수는 {{n * m}}/{{n + b}}입니다. 약분하면 {{fracMul(n, n + b, m, 1)}}입니다.'],
    },
    {
      params: { n, b, m },
      prompt: config.directPrompts[1],
      solver: 'fracMul(m, 1, n, n + b)',
      steps: ['자연수 값은 {{m}}입니다. 분수로 나타내면 {{m}}/1입니다.', '{{m}}/1 × {{n}}/{{n + b}} = {{fracMul(m, 1, n, n + b)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.directPrompts[2],
      solver: 'fracMul(n, n + b, m, m + c)',
      choices: [
        'fracMul(n, n + b, m, m + c)',
        'reduceFrac(n * m + 1, n * m + n * c + b * m + b * c)',
        'reduceFrac(n * m + 2, n * m + n * c + b * m + b * c)',
        'reduceFrac(n * m + 3, n * m + n * c + b * m + b * c)',
      ],
      steps: ['분자끼리 곱하면 {{n * m}}, 분모끼리 곱하면 {{(n + b) * (m + c)}}입니다.', '약분한 값은 {{fracMul(n, n + b, m, m + c)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.directPrompts[3],
      solver: 'fracMul(n, n + b, n + b, m + c)',
      steps: ['첫째 분모와 둘째 분자의 공통 인수는 {{n + b}}입니다. 먼저 약분합니다.', '약분 후 남은 분수는 {{n}}/{{m + c}}입니다. 기약분수는 {{fracMul(n, n + b, n + b, m + c)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.contexts.quantity,
      solver: 'reduceFrac(m * n + c * n, n + b)',
      choices: [
        'fracMul(m + c, 1, n, n + b)',
        'reduceFrac(m * n + c * n + 1, n + b)',
        'reduceFrac(m * n + c * n + 2, n + b)',
        'reduceFrac(m * n + c * n + 3, n + b)',
      ],
      steps: ['전체 양은 {{m + c}}이고 사용한 비율은 {{n}}/{{n + b}}입니다. 두 값을 곱합니다.', '{{m + c}} × {{n}}/{{n + b}} = {{fracMul(m + c, 1, n, n + b)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.contexts.part,
      solver: 'reduceFrac(n * m, n * m + n * c + b * m + b * c)',
      steps: ['첫 비율은 {{n}}/{{n + b}}이고 그중의 비율은 {{m}}/{{m + c}}입니다. 두 분수를 곱합니다.', '{{n}}/{{n + b}} × {{m}}/{{m + c}} = {{fracMul(n, n + b, m, m + c)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.contexts.missing,
      solver: 'reduceFrac(m, m + c)',
      choices: [
        'reduceFrac(m, m + c)',
        'reduceFrac(m + 1, m + c)',
        'reduceFrac(m + 2, m + c)',
        'reduceFrac(m + 3, m + c)',
      ],
      steps: ['곱의 두 번째 인수는 처음 식에서 사용한 {{m}}/{{m + c}}입니다.', '기약분수로 나타내면 {{reduceFrac(m, m + c)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.contexts.area,
      solver: 'reduceFrac(n * m, n * m + n * c + b * m + b * c)',
      steps: ['직사각형의 넓이는 가로와 세로의 곱입니다.', '{{n}}/{{n + b}} × {{m}}/{{m + c}} = {{fracMul(n, n + b, m, m + c)}}이므로 넓이는 {{fracMul(n, n + b, m, m + c)}}m²입니다.'],
    },
    {
      params: { n, b, c },
      prompt: config.denominatorError,
      solver: 'fracSub(n, n + b, n, n * c + b * c)',
      choices: [
        'fracSub(n, n + b, n, n * c + b * c)',
        'reduceFrac(n * c - n + 1, n * c + b * c)',
        'reduceFrac(n * c - n + 2, n * c + b * c)',
        'reduceFrac(n * c - n + 3, n * c + b * c)',
      ],
      steps: ['올바른 값은 {{n}}/{{n + b}} × 1/{{c}} = {{fracMul(n, n + b, 1, c)}}입니다.', '잘못된 값 {{reduceFrac(n, n + b)}}에서 올바른 값을 빼면 {{fracSub(n, n + b, n, n * c + b * c)}}입니다.'],
    },
    {
      params: { n, b, m, c },
      prompt: config.sizeGap,
      solver: 'fracSub(n, n + b, n * m, n * m + n * c + b * m + b * c)',
      steps: ['곱하는 수는 {{m}}/{{m + c}}이고 1보다 작습니다. 따라서 곱은 처음 분수보다 작습니다.', '{{reduceFrac(n, n + b)}} - {{fracMul(n, n + b, m, m + c)}} = {{fracSub(n, n + b, n * m, n * m + n * c + b * m + b * c)}}입니다.'],
    },
  ]
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-fracmul-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'fracmul-001',
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
          ? '자연수는 분모가 1인 분수로 나타내고 분자끼리, 분모끼리 곱해요.'
          : slot <= 6
            ? '어떤 양의 일부분을 구할 때는 전체 양과 분수를 곱해요.'
            : slot <= 8
              ? '곱과 알고 있는 한 인수의 관계를 식이나 넓이로 나타내요.'
              : '올바른 곱과 잘못된 계산 또는 처음 분수의 크기를 비교해요.',
        slot <= 4
          ? '곱하기 전이나 곱한 뒤에 약분하여 기약분수로 만들어요.'
          : slot <= 6
            ? '일부의 일부는 두 분수의 곱으로 나타내요.'
            : slot <= 8
              ? '빠진 인수를 확인하거나 가로와 세로를 곱해요.'
              : '1보다 작은 양수를 곱하면 처음 수보다 작아지는 까닭을 확인해요.',
      ],
    }

    if (type === 'choice') {
      template.choices_template = definition.choices.map(choice => `{{${choice}}}`)
    }

    return template
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 fraction-multiplication templates to ${outputPath}`)
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
