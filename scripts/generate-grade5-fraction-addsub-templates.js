const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputDir = path.join(__dirname, '..', 'public', 'data', 'templates')

const familyByConcept = {
  fracadd: [
    'fracadd-unlike-direct',
    'fracadd-multiple-denominator',
    'fracadd-complement-to-whole',
    'fracadd-common-denominator-numerator-sum',
    'fracadd-context-total',
    'fracadd-context-three-part-total',
    'fracadd-missing-addend',
    'fracadd-context-perimeter',
    'fracadd-denominator-sum-error',
    'fracadd-balanced-missing-numerator',
  ],
  fracsub: [
    'fracsub-unlike-direct',
    'fracsub-same-numerator',
    'fracsub-from-whole',
    'fracsub-common-denominator-numerator-difference',
    'fracsub-context-remaining',
    'fracsub-context-distance-gap',
    'fracsub-missing-subtrahend',
    'fracsub-missing-minuend',
    'fracsub-unconverted-numerator-error',
    'fracsub-addition-instead-error',
  ],
}

const setConfigs = {
  A: {
    ranges: {
      n: { min: 1, max: 3 },
      b: { min: 2, max: 4 },
      m: { min: 2, max: 4 },
      c: { min: 2, max: 4 },
    },
    add: {
      total: '주스는 {{n}}/{{n + b}} L이고 물은 {{m}}/{{n + b + m + c}} L입니다. 두 양을 섞으면 모두 몇 L인가요?',
      three: '빨간 색 테이프는 {{n}}/{{n + b}} m, 파란색은 {{m}}/{{n + b}} m, 노란색은 {{c}}/{{n + b}} m입니다. 세 길이의 합은 몇 m인가요?',
      perimeter: '직사각형 액자의 가로는 {{n}}/{{n + b}} m, 세로는 {{m}}/{{n + b + m + c}} m입니다. 둘레는 몇 m인가요?',
      error: '첫째 분수는 {{n}}/{{n + b}}, 둘째 분수는 {{m}}/{{n + b + m + c}}입니다. 분자끼리와 분모끼리를 각각 더해 {{n + m}}/{{2 * n + 2 * b + m + c}}라고 잘못 계산했습니다. 올바른 값은 잘못된 값보다 얼마 큰가요?',
      missingAddend: '{{n}}/{{n + b}} + 어떤 분수 = {{fracAdd(n, n + b, m, n + b + m + c)}}입니다. 어떤 분수를 구하세요.',
      missingNumerator: '{{n}}/{{n + b}} + □/{{n + b + m + c}} = {{fracAdd(n, n + b, m, n + b + m + c)}}입니다. □에 알맞은 수를 구하세요.',
    },
    sub: {
      remaining: '물통에 있던 물은 {{n + m}}/{{n + m + b}} L이고 사용한 물은 {{n}}/{{n + m + b + c}} L입니다. 물은 몇 L 남나요?',
      gap: '첫 번째 길이는 {{n}}/{{n + b}} m이고 두 번째 길이는 {{n}}/{{n + b + c}} m입니다. 두 길이의 차이는 몇 m인가요?',
      numeratorError: '{{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}에서 통분하지 않고 분자만 빼어 {{m}}/{{n + m + b}}라고 했습니다. 올바른 값은 이 잘못된 값보다 얼마 큰가요?',
      operationError: '계산식은 {{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}입니다. 이를 덧셈으로 잘못 계산했을 때 잘못된 값은 올바른 값보다 얼마 큰가요?',
    },
  },
  B: {
    ranges: {
      n: { min: 2, max: 4 },
      b: { min: 3, max: 5 },
      m: { min: 3, max: 5 },
      c: { min: 2, max: 4 },
    },
    add: {
      total: '오전에 걸은 거리는 {{n}}/{{n + b}} km이고 오후에 걸은 거리는 {{m}}/{{n + b + m + c}} km입니다. 모두 몇 km를 걸었나요?',
      three: '화단 세 구역의 길이는 각각 {{n}}/{{n + b}} m, {{m}}/{{n + b}} m, {{c}}/{{n + b}} m입니다. 세 길이의 합을 구하세요.',
      perimeter: '직사각형 화단의 가로는 {{n}}/{{n + b}} m, 세로는 {{m}}/{{n + b + m + c}} m입니다. 둘레를 구하세요.',
      error: '서아는 {{n}}/{{n + b}} + {{m}}/{{n + b + m + c}}에서 분자끼리와 분모끼리를 더해 {{n + m}}/{{2 * n + 2 * b + m + c}}라고 했습니다. 서아의 값과 올바른 값의 차이를 구하세요.',
      missingAddend: '{{n}}/{{n + b}}에 어떤 분수를 더했더니 {{fracAdd(n, n + b, m, n + b + m + c)}}이 되었습니다. 더한 분수를 구하세요.',
      missingNumerator: '{{n}}/{{n + b}} + □/{{n + b + m + c}} = {{fracAdd(n, n + b, m, n + b + m + c)}}일 때 □의 값을 구하세요.',
    },
    sub: {
      remaining: '리본의 처음 길이는 {{n + m}}/{{n + m + b}} m이고 잘라 낸 길이는 {{n}}/{{n + m + b + c}} m입니다. 남은 길이는 몇 m인가요?',
      gap: '첫 번째 로봇의 이동 거리는 {{n}}/{{n + b}} m, 두 번째 로봇은 {{n}}/{{n + b + c}} m입니다. 더 이동한 거리는 몇 m인가요?',
      numeratorError: '민호는 {{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}에서 분자만 빼고 첫 분모를 그대로 써서 {{m}}/{{n + m + b}}라고 했습니다. 올바른 값과의 차이는 얼마인가요?',
      operationError: '계산식은 {{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}입니다. 이를 덧셈으로 잘못 계산한 답은 올바른 답보다 얼마 큰가요?',
    },
  },
  C: {
    ranges: {
      n: { min: 3, max: 5 },
      b: { min: 4, max: 6 },
      m: { min: 4, max: 6 },
      c: { min: 3, max: 5 },
    },
    add: {
      total: '프로젝트에 쓴 종이는 첫날 {{n}}/{{n + b}} 묶음, 둘째 날 {{m}}/{{n + b + m + c}} 묶음입니다. 사용한 양은 모두 몇 묶음인가요?',
      three: '모형의 세 부분 길이는 각각 {{n}}/{{n + b}} m, {{m}}/{{n + b}} m, {{c}}/{{n + b}} m입니다. 세 길이의 합을 구하세요.',
      perimeter: '직사각형 모형의 가로는 {{n}}/{{n + b}} m, 세로는 {{m}}/{{n + b + m + c}} m입니다. 둘레는 몇 m인가요?',
      error: '계산식은 {{n}}/{{n + b}} + {{m}}/{{n + b + m + c}}입니다. 이를 {{n + m}}/{{2 * n + 2 * b + m + c}}라고 잘못 계산했습니다. 올바른 합이 그 값보다 얼마나 큰지 구하세요.',
      missingAddend: '첫째 분수는 {{n}}/{{n + b}}이고 두 분수의 합은 {{fracAdd(n, n + b, m, n + b + m + c)}}입니다. 둘째 분수를 구하세요.',
      missingNumerator: '{{n}}/{{n + b}} + □/{{n + b + m + c}}의 값이 {{fracAdd(n, n + b, m, n + b + m + c)}}일 때 빈 분자 □를 구하세요.',
    },
    sub: {
      remaining: '전체 작업량은 {{n + m}}/{{n + m + b}}이고 마친 작업량은 {{n}}/{{n + m + b + c}}입니다. 남은 작업량을 구하세요.',
      gap: '첫째 측정 시간은 {{n}}/{{n + b}}분, 둘째 측정 시간은 {{n}}/{{n + b + c}}분입니다. 두 시간의 차이를 구하세요.',
      numeratorError: '계산식은 {{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}입니다. 통분 없이 {{m}}/{{n + m + b}}라고 계산한 값과 올바른 값의 차이는 얼마인가요?',
      operationError: '{{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}에서 연산 기호를 잘못 보고 더했습니다. 잘못된 결과와 올바른 결과의 차이는 얼마인가요?',
    },
  },
}

function buildAdditionDefinitions(config) {
  const { n, b, m, c } = config.ranges
  const commonParams = { n, b, m, c }
  const correctNumerator = 'n * n + n * b + n * m + n * c + m * n + m * b'
  const correctDenominator = 'n * n + 2 * n * b + n * m + n * c + b * b + b * m + b * c'

  return [
    {
      params: commonParams,
      prompt: '계산식: {{n}}/{{n + b}} + {{m}}/{{n + b + m + c}}. 값을 기약분수로 나타내세요.',
      solver: 'fracAdd(n, n + b, m, n + b + m + c)',
      choices: [
        'fracAdd(n, n + b, m, n + b + m + c)',
        'fracAddOff(n, n + b, m, n + b + m + c, 1)',
        'fracAddOff(n, n + b, m, n + b + m + c, 2)',
        'fracAddOff(n, n + b, m, n + b + m + c, 3)',
      ],
      steps: ['공통 분모는 {{commonDen(n + b, n + b + m + c)}}입니다.', '두 분수를 통분해 더하고 약분하면 {{fracAdd(n, n + b, m, n + b + m + c)}}입니다.'],
    },
    {
      params: { n, b, m },
      prompt: '계산식: {{n}}/{{n + b}} + {{m}}/{{2 * n + 2 * b}}. 둘째 분모는 첫째 분모의 2배입니다.',
      solver: 'fracAdd(n, n + b, m, 2 * n + 2 * b)',
      steps: ['둘째 분모 {{2 * n + 2 * b}}에 맞추면 첫째 분자는 {{2 * n}}이 됩니다.', '계산 결과는 {{2 * n + m}}/{{2 * n + 2 * b}}입니다. 약분하면 {{fracAdd(n, n + b, m, 2 * n + 2 * b)}}입니다.'],
    },
    {
      params: { n, b },
      prompt: '{{n}}/{{n + b}}에 얼마를 더하면 1이 되나요?',
      solver: 'reduceFrac(b, n + b)',
      choices: [
        'reduceFrac(b, n + b)',
        'reduceFrac(b + 1, n + b)',
        'reduceFrac(b + 2, n + b)',
        'reduceFrac(b + 3, n + b)',
      ],
      steps: ['1은 {{n + b}}/{{n + b}}입니다.', '비어 있는 분자는 {{b}}이므로 더할 분수는 {{reduceFrac(b, n + b)}}입니다.'],
    },
    {
      params: { n, b, m },
      prompt: '첫째 분수는 {{n}}/{{n + b}}, 둘째 분수는 {{m}}/{{2 * n + 2 * b}}입니다. 공통 분모가 {{2 * n + 2 * b}}일 때 바뀐 두 분자의 합을 구하세요.',
      solver: '2 * n + m',
      steps: ['첫째 분수의 분모를 2배로 만들면 분자는 {{2 * n}}이 되고, 둘째 분자는 {{m}}입니다.', '바뀐 두 분자의 합은 {{2 * n}} + {{m}} = {{2 * n + m}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.total,
      solver: 'fracAdd(n, n + b, m, n + b + m + c)',
      choices: [
        'fracAdd(n, n + b, m, n + b + m + c)',
        'fracAddOff(n, n + b, m, n + b + m + c, 1)',
        'fracAddOff(n, n + b, m, n + b + m + c, 2)',
        'fracAddOff(n, n + b, m, n + b + m + c, 3)',
      ],
      steps: ['두 양의 단위가 같으므로 분수의 덧셈으로 나타냅니다.', '{{n}}/{{n + b}} + {{m}}/{{n + b + m + c}} = {{fracAdd(n, n + b, m, n + b + m + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.three,
      solver: 'reduceFrac(n + m + c, n + b)',
      steps: ['세 분수의 공통 분모는 {{n + b}}입니다.', '분자를 모두 더하면 {{n + m + c}}입니다. 합을 약분하면 {{reduceFrac(n + m + c, n + b)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.missingAddend,
      solver: 'reduceFrac(m, n + b + m + c)',
      choices: [
        'reduceFrac(m, n + b + m + c)',
        'reduceFrac(m + 1, n + b + m + c)',
        'reduceFrac(m + 2, n + b + m + c)',
        'reduceFrac(m + 3, n + b + m + c)',
      ],
      steps: ['합에서 첫째 분수를 빼면 빠진 덧셈 항을 찾을 수 있습니다.', '빠진 분수는 {{m}}/{{n + b + m + c}}이고 기약분수는 {{reduceFrac(m, n + b + m + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.perimeter,
      solver: 'reduceFrac(2 * n * n + 2 * n * b + 2 * n * m + 2 * n * c + 2 * m * n + 2 * m * b, n * n + 2 * n * b + n * m + n * c + b * b + b * m + b * c)',
      steps: ['직사각형의 둘레는 가로와 세로를 더한 값의 2배입니다.', '2 × ({{n}}/{{n + b}} + {{m}}/{{n + b + m + c}}) = {{reduceFrac(2 * n * n + 2 * n * b + 2 * n * m + 2 * n * c + 2 * m * n + 2 * m * b, n * n + 2 * n * b + n * m + n * c + b * b + b * m + b * c)}}이므로 둘레를 구할 수 있습니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.error,
      solver: `fracSub(${correctNumerator}, ${correctDenominator}, n + m, 2 * n + 2 * b + m + c)`,
      choices: [
        `fracSub(${correctNumerator}, ${correctDenominator}, n + m, 2 * n + 2 * b + m + c)`,
        `fracSubOff(${correctNumerator}, ${correctDenominator}, n + m, 2 * n + 2 * b + m + c, 1)`,
        `fracSubOff(${correctNumerator}, ${correctDenominator}, n + m, 2 * n + 2 * b + m + c, 2)`,
        `fracSubOff(${correctNumerator}, ${correctDenominator}, n + m, 2 * n + 2 * b + m + c, 3)`,
      ],
      steps: ['올바른 합은 {{fracAdd(n, n + b, m, n + b + m + c)}}이고 분모와 분자를 각각 더한 값은 {{reduceFrac(n + m, 2 * n + 2 * b + m + c)}}입니다.', '두 값을 빼면 {{fracSub(n * n + n * b + n * m + n * c + m * n + m * b, n * n + 2 * n * b + n * m + n * c + b * b + b * m + b * c, n + m, 2 * n + 2 * b + m + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.add.missingNumerator,
      solver: 'm',
      steps: ['합에서 첫 분수를 빼면 빈 분수는 {{reduceFrac(m, n + b + m + c)}}입니다.', '문제에서 빈 분수의 분모를 {{n + b + m + c}}로 정했으므로 분자는 {{m}}입니다.'],
    },
  ]
}

function buildSubtractionDefinitions(config) {
  const { n, b, m, c } = config.ranges
  const commonParams = { n, b, m, c }
  const firstDenominator = 'n + m + b'
  const secondDenominator = 'n + m + b + c'

  return [
    {
      params: commonParams,
      prompt: '계산식: {{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}}. 값을 기약분수로 나타내세요.',
      solver: `fracSub(n + m, ${firstDenominator}, n, ${secondDenominator})`,
      choices: [
        `fracSub(n + m, ${firstDenominator}, n, ${secondDenominator})`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 1)`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 2)`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 3)`,
      ],
      steps: ['공통 분모는 {{commonDen(n + m + b, n + m + b + c)}}입니다.', '통분하여 빼고 약분하면 {{fracSub(n + m, n + m + b, n, n + m + b + c)}}입니다.'],
    },
    {
      params: { n, b, c },
      prompt: '첫째 분수는 {{n}}/{{n + b}}, 둘째 분수는 {{n}}/{{n + b + c}}입니다. 큰 수에서 작은 수를 빼세요.',
      solver: 'fracSub(n, n + b, n, n + b + c)',
      steps: ['분자가 같을 때 더 큰 분수는 분모가 작은 {{n}}/{{n + b}}입니다.', '{{n}}/{{n + b}} - {{n}}/{{n + b + c}} = {{fracSub(n, n + b, n, n + b + c)}}입니다.'],
    },
    {
      params: { n, b },
      prompt: '계산식: 1 - {{n}}/{{n + b}}. 값을 구하세요.',
      solver: 'fracSub(1, 1, n, n + b)',
      choices: [
        'fracSub(1, 1, n, n + b)',
        'fracSubOff(1, 1, n, n + b, 1)',
        'fracSubOff(1, 1, n, n + b, 2)',
        'fracSubOff(1, 1, n, n + b, 3)',
      ],
      steps: ['1을 {{n + b}}/{{n + b}}로 바꿉니다.', '{{n + b}}/{{n + b}} - {{n}}/{{n + b}} = {{b}}/{{n + b}}이고 약분하면 {{fracSub(1, 1, n, n + b)}}입니다.'],
    },
    {
      params: { n, b, m },
      prompt: '첫째 분수는 {{n + m}}/{{n + m + b}}, 둘째 분수는 {{n}}/{{2 * n + 2 * m + 2 * b}}입니다. 공통 분모가 {{2 * n + 2 * m + 2 * b}}일 때 바뀐 첫째 분자에서 둘째 분자를 뺀 값을 구하세요.',
      solver: 'n + 2 * m',
      steps: ['첫째 분수의 분모를 2배로 만들면 분자는 {{2 * n + 2 * m}}이 되고, 둘째 분자는 {{n}}입니다.', '바뀐 분자의 차는 {{2 * n + 2 * m}} - {{n}} = {{n + 2 * m}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.sub.remaining,
      solver: `fracSub(n + m, ${firstDenominator}, n, ${secondDenominator})`,
      choices: [
        `fracSub(n + m, ${firstDenominator}, n, ${secondDenominator})`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 1)`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 2)`,
        `fracSubOff(n + m, ${firstDenominator}, n, ${secondDenominator}, 3)`,
      ],
      steps: ['처음 양에서 사용한 양을 빼는 식을 세웁니다.', '{{n + m}}/{{n + m + b}} - {{n}}/{{n + m + b + c}} = {{fracSub(n + m, n + m + b, n, n + m + b + c)}}입니다.'],
    },
    {
      params: { n, b, c },
      prompt: config.sub.gap,
      solver: 'fracSub(n, n + b, n, n + b + c)',
      steps: ['분자가 같을 때 더 큰 분수는 분모가 작은 {{n}}/{{n + b}}입니다.', '큰 값에서 작은 값을 빼면 {{fracSub(n, n + b, n, n + b + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: '{{n + m}}/{{n + m + b}} - 어떤 분수 = {{fracSub(n + m, n + m + b, n, n + m + b + c)}}입니다. 어떤 분수를 구하세요.',
      solver: `reduceFrac(n, ${secondDenominator})`,
      choices: [
        `reduceFrac(n, ${secondDenominator})`,
        `reduceFrac(n + 1, ${secondDenominator})`,
        `reduceFrac(n + 2, ${secondDenominator})`,
        `reduceFrac(n + 3, ${secondDenominator})`,
      ],
      steps: ['처음 분수에서 차를 빼면 빠진 분수를 찾을 수 있습니다.', '빠진 분수는 {{n}}/{{n + m + b + c}}이고 기약분수는 {{reduceFrac(n, n + m + b + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: '빼는 수는 {{n}}/{{n + m + b + c}}이고 차는 {{fracSub(n + m, n + m + b, n, n + m + b + c)}}입니다. 처음 분수를 구하세요.',
      solver: `reduceFrac(n + m, ${firstDenominator})`,
      steps: ['차와 뺀 분수를 더하면 처음 분수를 찾을 수 있습니다.', '처음 분수는 {{n + m}}/{{n + m + b}}이고 기약분수는 {{reduceFrac(n + m, n + m + b)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.sub.numeratorError,
      solver: `fracSub(n, ${firstDenominator}, n, ${secondDenominator})`,
      choices: [
        `fracSub(n, ${firstDenominator}, n, ${secondDenominator})`,
        `fracSubOff(n, ${firstDenominator}, n, ${secondDenominator}, 1)`,
        `fracSubOff(n, ${firstDenominator}, n, ${secondDenominator}, 2)`,
        `fracSubOff(n, ${firstDenominator}, n, ${secondDenominator}, 3)`,
      ],
      steps: ['올바른 차에서 잘못된 값을 빼면, 첫째 분수의 {{n}}/{{n + m + b}} 부분과 둘째 분수의 차만 남습니다.', '{{n}}/{{n + m + b}} - {{n}}/{{n + m + b + c}} = {{fracSub(n, n + m + b, n, n + m + b + c)}}입니다.'],
    },
    {
      params: commonParams,
      prompt: config.sub.operationError,
      solver: `reduceFrac(2 * n, ${secondDenominator})`,
      steps: ['잘못된 덧셈과 올바른 뺄셈은 둘째 분수의 부호만 다릅니다.', '두 결과의 차는 둘째 분수 {{n}}/{{n + m + b + c}}의 2배이므로 {{reduceFrac(2 * n, n + m + b + c)}}입니다.'],
    },
  ]
}

function buildTemplates(concept, config) {
  const definitions = concept === 'fracadd'
    ? buildAdditionDefinitions(config)
    : buildSubtractionDefinitions(config)

  return definitions.map((definition, index) => {
    const slot = index + 1
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-${concept}-${config.setId}-${String(slot).padStart(2, '0')}`,
      concept_id: `${concept}-001`,
      type,
      difficulty: slot <= 4 ? 1 : slot <= 8 ? 2 : 3,
      set_id: config.setId,
      problem_family: familyByConcept[concept][index],
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
          ? '분모가 다르면 최소공배수를 공통 분모로 정해 통분해요.'
          : slot <= 6
            ? '같은 단위의 양인지 확인하고 상황을 덧셈이나 뺄셈 식으로 나타내요.'
            : slot <= 8
              ? '결과와 알고 있는 수의 관계를 반대 연산이나 둘레 식으로 나타내요.'
              : '올바른 통분 계산과 잘못된 계산을 각각 식으로 나타내 비교해요.',
        concept === 'fracadd'
          ? '분모를 같게 만든 뒤 분자끼리 더하고 마지막에 약분해요.'
          : '두 분수의 크기를 먼저 확인한 뒤 통분하여 큰 분자에서 작은 분자를 빼요.',
      ],
    }

    if (type === 'choice') {
      template.choices_template = definition.choices.map(choice => `{{${choice}}}`)
    }

    return template
  })
}

const banks = Object.fromEntries(['fracadd', 'fracsub'].map(concept => [
  concept,
  Object.entries(setConfigs).flatMap(([setId, config]) => (
    buildTemplates(concept, { ...config, setId })
  )),
]))

function writeTemplates() {
  for (const [name, templates] of Object.entries(banks)) {
    const outputPath = path.join(outputDir, `${name}.json`)
    fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
    console.log(`Wrote ${templates.length} Grade 5 ${name} templates to ${outputPath}`)
  }
}

if (require.main === module) {
  writeTemplates()
}

module.exports = {
  familyByConcept,
  setConfigs,
  buildAdditionDefinitions,
  buildSubtractionDefinitions,
  buildTemplates,
  banks,
  writeTemplates,
}
