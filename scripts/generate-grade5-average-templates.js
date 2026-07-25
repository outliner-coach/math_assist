const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'average.json'
)

const familyBySlot = [
  'average-balanced-three',
  'average-balanced-four',
  'average-from-total-three',
  'average-from-total-four',
  'average-context-three',
  'average-context-four',
  'average-missing-value',
  'average-target-next-value',
  'average-wrong-divisor-error',
  'average-record-correction-error',
]

const setConfigs = {
  A: {
    ranges: {
      a: { min: 12, max: 20 },
      b: { min: 2, max: 5 },
      c: { min: 1, max: 3 },
      k: { min: 4, max: 7 },
    },
    directPrompts: [
      '세 수 {{a - b}}, {{a}}, {{a + b}}의 평균은 얼마인가요?',
      '네 수 {{a - b}}, {{a - c}}, {{a + c}}, {{a + b}}의 평균은 얼마인가요?',
      '세 수의 합이 {{a * 3}}일 때 평균은 얼마인가요?',
      '네 수의 합이 {{a * 4}}일 때 평균은 얼마인가요?',
    ],
    contexts: {
      three: '유나가 사흘 동안 읽은 쪽수는 {{a - b}}쪽, {{a}}쪽, {{a + b}}쪽입니다. 하루 평균은 몇 쪽인가요?',
      four: '서준이가 네 번 줄넘기한 횟수는 {{a - b}}회, {{a - c}}회, {{a + c}}회, {{a + b}}회입니다. 한 번 평균은 몇 회인가요?',
      missing: '네 모둠이 모은 병뚜껑 수의 평균은 {{a}}개입니다. 세 모둠이 각각 {{a - b}}개, {{a}}개, {{a + c}}개를 모았다면 마지막 모둠은 몇 개를 모았나요?',
      target: '민서가 세 번 읽은 쪽수는 {{a - b}}쪽, {{a}}쪽, {{a + b}}쪽입니다. 네 번의 평균을 {{a + c}}쪽으로 만들려면 네 번째에는 몇 쪽을 읽어야 하나요?',
    },
    wrongDivisor: '네 날의 기록은 {{k * 3 - b}}, {{k * 3 - c}}, {{k * 3 + c}}, {{k * 3 + b}}입니다. 도윤이는 합을 기록 수 4가 아니라 3으로 나누었습니다. 도윤이의 값은 올바른 평균보다 얼마 큰가요?',
    correction: '네 경기의 평균 득점은 {{a}}점이었습니다. 첫 경기 기록이 실제보다 {{c * 4}}점 작게 적힌 것을 고쳤습니다. 하린이는 평균도 {{c * 4}}점 오른다고 말했습니다. 하린이가 말한 증가량은 실제 증가량보다 몇 점 큰가요?',
  },
  B: {
    ranges: {
      a: { min: 20, max: 30 },
      b: { min: 3, max: 7 },
      c: { min: 2, max: 4 },
      k: { min: 6, max: 10 },
    },
    directPrompts: [
      '기준 수 {{a}}에서 {{b}}만큼 작은 수와 큰 수를 함께 놓았습니다. {{a - b}}, {{a}}, {{a + b}}의 평균을 구하세요.',
      '{{a}}를 중심으로 같은 만큼 떨어진 네 수 {{a - b}}, {{a - c}}, {{a + c}}, {{a + b}}의 평균을 구하세요.',
      '자료 3개의 합계가 {{a * 3}}입니다. 자료 한 개당 평균은 얼마인가요?',
      '자료 4개의 합계가 {{a * 4}}입니다. 자료 한 개당 평균은 얼마인가요?',
    ],
    contexts: {
      three: '세 학급이 모은 우유갑은 {{a - b}}개, {{a}}개, {{a + b}}개입니다. 학급당 평균은 몇 개인가요?',
      four: '네 구간을 걸은 시간은 {{a - b}}분, {{a - c}}분, {{a + c}}분, {{a + b}}분입니다. 한 구간 평균은 몇 분인가요?',
      missing: '네 상자의 귤 수는 평균 {{a}}개입니다. 세 상자에 {{a - b}}개, {{a}}개, {{a + c}}개가 들어 있다면 나머지 한 상자에는 몇 개가 들어 있나요?',
      target: '세 차례 모은 재활용품 수는 {{a - b}}개, {{a}}개, {{a + b}}개입니다. 네 차례 평균을 {{a + c}}개로 만들려면 마지막에 몇 개를 모아야 하나요?',
    },
    wrongDivisor: '네 모둠의 점수는 {{k * 3 - b}}점, {{k * 3 - c}}점, {{k * 3 + c}}점, {{k * 3 + b}}점입니다. 지호는 네 점수의 합을 3으로 나누어 평균을 구했습니다. 잘못 구한 값은 올바른 평균보다 몇 점 큰가요?',
    correction: '네 상자의 평균 무게는 {{a}}kg이었습니다. 한 상자의 기록을 실제보다 {{c * 4}}kg 작게 적은 것을 바로잡았습니다. 평균이 {{c * 4}}kg 오른다는 주장은 실제 증가량보다 몇 kg 큰가요?',
  },
  C: {
    ranges: {
      a: { min: 32, max: 45 },
      b: { min: 5, max: 9 },
      c: { min: 2, max: 5 },
      k: { min: 9, max: 14 },
    },
    directPrompts: [
      '{{a}}를 기준으로 {{b}}만큼 고르게 옮긴 세 값 {{a - b}}, {{a}}, {{a + b}}의 평균을 구하세요.',
      '작은 값과 큰 값을 짝지은 {{a - b}}, {{a - c}}, {{a + c}}, {{a + b}}의 평균을 구하세요.',
      '평균을 구할 자료가 3개이고 전체 합이 {{a * 3}}입니다. 평균은 얼마인가요?',
      '평균을 구할 자료가 4개이고 전체 합이 {{a * 4}}입니다. 평균은 얼마인가요?',
    ],
    contexts: {
      three: '세 선수가 연습에서 던진 공의 수는 {{a - b}}개, {{a}}개, {{a + b}}개입니다. 선수 한 명당 평균은 몇 개인가요?',
      four: '네 화분에서 핀 꽃은 {{a - b}}송이, {{a - c}}송이, {{a + c}}송이, {{a + b}}송이입니다. 화분 한 개당 평균은 몇 송이인가요?',
      missing: '네 날 동안 만든 부품 수는 하루 평균 {{a}}개입니다. 첫 세 날에 {{a - b}}개, {{a}}개, {{a + c}}개를 만들었다면 마지막 날에는 몇 개를 만들어야 하나요?',
      target: '세 경기 득점은 {{a - b}}점, {{a}}점, {{a + b}}점입니다. 네 경기 평균을 {{a + c}}점으로 만들려면 네 번째 경기에서 몇 점을 얻어야 하나요?',
    },
    wrongDivisor: '네 실험의 측정값은 {{k * 3 - b}}, {{k * 3 - c}}, {{k * 3 + c}}, {{k * 3 + b}}입니다. 예린이는 합을 자료 수 4 대신 3으로 나누었습니다. 예린이의 결과는 올바른 평균보다 얼마 큰가요?',
    correction: '네 차례 평균 생산량은 {{a}}개였습니다. 한 차례 생산량이 실제보다 {{c * 4}}개 작게 기록되어 이를 고쳤습니다. 평균도 {{c * 4}}개 오른다는 설명은 실제 증가량보다 몇 개 큰가요?',
  },
}

function buildSetDefinitions(config) {
  const { a, b, c, k } = config.ranges

  return [
    {
      params: { a, b },
      prompt: config.directPrompts[0],
      solver: 'a',
      steps: ['세 수의 합은 {{a * 3}}입니다.', '{{a * 3}} ÷ 3 = {{a}}이므로 평균은 {{a}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.directPrompts[1],
      solver: 'a',
      steps: ['{{a - b}}와 {{a + b}}, {{a - c}}와 {{a + c}}의 합은 각각 {{a * 2}}입니다.', '네 수의 합 {{a * 4}}를 4로 나누면 평균은 {{a}}입니다.'],
    },
    {
      params: { a },
      prompt: config.directPrompts[2],
      solver: 'a',
      steps: ['평균은 자료의 합을 자료 수로 나눈 값입니다.', '{{a * 3}} ÷ 3 = {{a}}입니다.'],
    },
    {
      params: { a },
      prompt: config.directPrompts[3],
      solver: 'a',
      steps: ['자료는 모두 4개입니다.', '{{a * 4}} ÷ 4 = {{a}}이므로 평균은 {{a}}입니다.'],
    },
    {
      params: { a, b },
      prompt: config.contexts.three,
      solver: 'a',
      steps: ['세 기록의 합은 {{a - b}} + {{a}} + {{a + b}} = {{a * 3}}입니다.', '{{a * 3}} ÷ 3 = {{a}}이므로 평균은 {{a}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.four,
      solver: 'a',
      steps: ['네 기록의 합은 {{a * 4}}입니다.', '{{a * 4}} ÷ 4 = {{a}}이므로 평균은 {{a}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.missing,
      solver: 'a + b - c',
      steps: ['네 자료의 전체 합은 평균 × 자료 수인 {{a}} × 4 = {{a * 4}}입니다.', '알고 있는 세 값의 합 {{a * 3 - b + c}}을 빼면 {{a + b - c}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.target,
      solver: 'a + c * 4',
      steps: ['목표 전체 합은 {{a + c}} × 4 = {{(a + c) * 4}}입니다.', '앞의 세 값의 합 {{a * 3}}을 빼면 마지막 값은 {{a + c * 4}}입니다.'],
    },
    {
      params: { k, b, c },
      prompt: config.wrongDivisor,
      solver: 'k * 12 / 3 - k * 3',
      steps: ['네 값의 합은 {{k * 12}}이고 올바른 평균은 {{k * 12}} ÷ 4 = {{k * 3}}입니다.', '잘못 구한 값은 {{k * 12}} ÷ 3 = {{k * 4}}이므로 {{k}}만큼 큽니다.'],
    },
    {
      params: { a, c },
      prompt: config.correction,
      solver: 'c * 4 - c * 4 / 4',
      steps: ['전체 합이 {{c * 4}}만큼 늘면 네 자료의 평균은 {{c * 4}} ÷ 4 = {{c}}만큼 오릅니다.', '말한 증가량 {{c * 4}}는 실제 증가량 {{c}}보다 {{c * 3}}만큼 큽니다.'],
    },
  ]
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-average-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'average-001',
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
          ? '평균은 자료의 합을 자료 수로 나눈 값이에요.'
          : slot <= 6
            ? '상황에서 모든 기록과 기록의 개수를 먼저 찾아요.'
            : slot <= 8
              ? '평균과 자료 수를 곱해 필요한 전체 합을 구해요.'
              : '자료 수를 잘못 적용한 계산과 올바른 계산을 비교해요.',
        slot <= 4
          ? '기준값에서 같은 만큼 작고 큰 수는 서로 균형을 이뤄요.'
          : slot <= 6
            ? '기록의 합을 정확한 기록 수로 나누어요.'
            : slot <= 8
              ? '필요한 전체 합에서 이미 알고 있는 값의 합을 빼요.'
              : '전체 합의 변화가 평균에는 자료 수로 나뉘어 반영됨을 확인해요.',
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
  console.log(`Wrote ${templates.length} Grade 5 average templates to ${outputPath}`)
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
