const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'mixedcalc.json'
)

const familyBySlot = [
  'mixedcalc-add-multiply-order',
  'mixedcalc-multiply-add-order',
  'mixedcalc-parenthesized-sum-product',
  'mixedcalc-multiply-subtract-order',
  'mixedcalc-context-stock-after-use',
  'mixedcalc-context-combined-groups-after-use',
  'mixedcalc-context-boxed-assortment',
  'mixedcalc-context-team-difference',
  'mixedcalc-missing-parentheses-error',
  'mixedcalc-model-correction-gap',
]

const setConfigs = {
  A: {
    ranges: {
      a: { min: 4, max: 9 },
      b: { min: 3, max: 7 },
      c: { min: 4, max: 9 },
      d: { min: 2, max: 6 },
      largeA: { min: 12, max: 18 },
    },
    directPrompts: [
      '{{a}} + {{b}} × {{c}} = ?',
      '{{a}} × {{b}} + {{c}} = ?',
      '({{a}} + {{b}}) × {{c}} = ?',
      '{{a}} × {{b}} - {{c}} = ?',
    ],
    contexts: {
      stock: '문구점에 연필이 낱개로 {{a}}자루 있고, 한 묶음에 {{c}}자루씩 든 묶음이 {{b}}개 있습니다. 이 중 {{d}}자루를 팔았다면 남은 연필은 몇 자루인가요?',
      combined: '{{a}}명인 모둠과 {{b}}명인 모둠이 함께 체험합니다. 한 사람에게 색종이를 {{c}}장씩 주려고 합니다. 이미 {{d}}장이 있다면 더 준비해야 하는 색종이는 몇 장인가요?',
      boxed: '선물 상자 한 개에 초콜릿 {{b}}개와 사탕 {{c}}개를 담습니다. 같은 상자 {{a}}개에 담는 간식은 모두 몇 개인가요?',
      difference: '각 모둠에 준비한 배지 {{a}}개 중 {{b}}개씩 사용했습니다. 같은 모둠이 {{c}}개라면 남은 배지는 모두 몇 개인가요?',
      model: '구슬 한 상자에는 빨간 구슬 {{b}}개와 파란 구슬 {{c}}개가 들어 있습니다. 같은 상자 {{a}}개의 구슬 수를 {{a}} × {{b}} + {{c}}로 계산했다면, 올바른 값보다 몇 개 적게 계산한 것인가요?',
    },
    errorPrompt: '지우가 계산할 식: ({{a}} + {{b}}) × {{c}}. 지우는 괄호를 빠뜨려 {{a}} + {{b}} × {{c}}로 계산했습니다. 올바른 값은 잘못 계산한 값보다 얼마 더 큰가요?',
  },
  B: {
    ranges: {
      a: { min: 6, max: 12 },
      b: { min: 5, max: 9 },
      c: { min: 6, max: 11 },
      d: { min: 3, max: 8 },
      largeA: { min: 16, max: 24 },
    },
    directPrompts: [
      '먼저 {{b}} × {{c}}를 계산합니다. 그 결과보다 {{a}}만큼 큰 수를 구하세요.',
      '먼저 {{a}} × {{b}}를 계산합니다. 그 결과보다 {{c}}만큼 큰 수를 구하세요.',
      '먼저 {{a}} + {{b}}를 계산합니다. 그 결과의 {{c}}배를 구하세요.',
      '먼저 {{a}} × {{b}}를 계산합니다. 그 결과보다 {{c}}만큼 작은 수를 구하세요.',
    ],
    contexts: {
      stock: '도서관에 새 책이 낱권으로 {{a}}권 있고, 한 상자에 {{c}}권씩 든 상자가 {{b}}개 왔습니다. {{d}}권을 교실에 보냈다면 남은 새 책은 몇 권인가요?',
      combined: '{{a}}명인 합창 모둠과 {{b}}명인 연주 모둠에게 입장권을 한 사람당 {{c}}장씩 주려고 합니다. 이미 {{d}}장이 있다면 새로 준비해야 하는 입장권은 몇 장인가요?',
      boxed: '과학 꾸러미 한 개에는 시험관 {{b}}개와 스포이트 {{c}}개가 들어 있습니다. 꾸러미 {{a}}개에 든 도구는 모두 몇 개인가요?',
      difference: '독서 동아리마다 책 {{a}}권 중 {{b}}권을 빌려주었습니다. 동아리가 {{c}}개라면 아직 남은 책은 모두 몇 권인가요?',
      model: '책장 한 칸에 그림책 {{b}}권과 이야기책 {{c}}권을 꽂습니다. 같은 칸 {{a}}개의 책 수를 {{a}} × {{b}} + {{c}}로 계산했다면, 올바른 값보다 몇 권 적게 계산한 것인가요?',
    },
    errorPrompt: '첫 번째 식은 ({{a}} + {{b}}) × {{c}}, 두 번째 식은 {{a}} + {{b}} × {{c}}입니다. 두 식의 값이 같다는 주장이 틀렸음을 보이는 실제 값의 차이는 얼마인가요?',
  },
  C: {
    ranges: {
      a: { min: 8, max: 15 },
      b: { min: 7, max: 11 },
      c: { min: 8, max: 13 },
      d: { min: 4, max: 9 },
      largeA: { min: 20, max: 30 },
    },
    directPrompts: [
      '첫 계산은 {{b}} × {{c}}입니다. 그 결과에 {{a}}만큼 더하면 얼마인가요?',
      '첫 계산은 {{a}} × {{b}}입니다. 그 결과에 {{c}}만큼 더하면 얼마인가요?',
      '첫 계산은 {{a}} + {{b}}입니다. 그 결과를 {{c}}배 하면 얼마인가요?',
      '첫 계산은 {{a}} × {{b}}입니다. 그 결과에서 {{c}}만큼 빼면 얼마인가요?',
    ],
    contexts: {
      stock: '현장학습용 물병이 낱개로 {{a}}병 있고, 한 상자에 {{c}}병씩 든 상자가 {{b}}개 있습니다. 출발 전에 {{d}}병을 사용했다면 남은 물병은 몇 병인가요?',
      combined: '{{a}}명인 축구부와 {{b}}명인 농구부에게 수건을 한 사람당 {{c}}장씩 주려고 합니다. 이미 {{d}}장이 있다면 더 준비해야 하는 수건은 몇 장인가요?',
      boxed: '체육 꾸러미 한 개에는 공 {{b}}개와 고깔 {{c}}개가 들어 있습니다. 꾸러미 {{a}}개에 든 물품은 모두 몇 개인가요?',
      difference: '행사 부스마다 표 {{a}}장 중 {{b}}장을 사용했습니다. 부스가 {{c}}개라면 아직 남은 표는 모두 몇 장인가요?',
      model: '체육 꾸러미 한 개에는 공 {{b}}개와 고깔 {{c}}개가 들어 있습니다. 꾸러미 {{a}}개의 물품 수를 {{a}} × {{b}} + {{c}}로 계산했다면, 올바른 값보다 몇 개 적게 계산한 것인가요?',
    },
    errorPrompt: '첫 번째 식: ({{a}} + {{b}}) × {{c}}. 두 번째 식: {{a}} + {{b}} × {{c}}. 민호는 괄호를 생략해도 값이 같다고 말했습니다. 두 계산 결과가 얼마나 다른지 구하세요.',
  },
}

function buildSetDefinitions(config) {
  const { a, b, c, d, largeA } = config.ranges

  return [
    {
      params: { a, b, c },
      prompt: config.directPrompts[0],
      solver: 'a + b * c',
      steps: ['먼저 곱셈을 계산하면 {{b}} × {{c}} = {{b * c}}입니다.', '그 결과보다 {{a}}만큼 큰 수는 {{a + b * c}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.directPrompts[1],
      solver: 'a * b + c',
      steps: ['먼저 곱셈을 계산하면 {{a}} × {{b}} = {{a * b}}입니다.', '그 결과보다 {{c}}만큼 큰 수는 {{a * b + c}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.directPrompts[2],
      solver: '(a + b) * c',
      steps: ['먼저 괄호 안을 계산하면 {{a}} + {{b}} = {{a + b}}입니다.', '그 결과의 {{c}}배는 {{(a + b) * c}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.directPrompts[3],
      solver: 'a * b - c',
      steps: ['먼저 곱셈을 계산하면 {{a}} × {{b}} = {{a * b}}입니다.', '그 결과보다 {{c}}만큼 작은 수는 {{a * b - c}}입니다.'],
    },
    {
      params: { a, b, c, d },
      prompt: config.contexts.stock,
      solver: 'a + b * c - d',
      steps: ['묶음에 든 수는 {{b}} × {{c}} = {{b * c}}입니다.', '낱개를 더하고 사용한 수를 빼면 {{a}} + {{b * c}} - {{d}} = {{a + b * c - d}}입니다.'],
    },
    {
      params: { a, b, c, d },
      prompt: config.contexts.combined,
      solver: '(a + b) * c - d',
      steps: ['두 모둠의 사람 수는 {{a}} + {{b}} = {{a + b}}명입니다.', '필요한 전체 수에서 이미 있는 {{d}}장을 빼면 {{(a + b) * c - d}}장입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.boxed,
      solver: 'a * (b + c)',
      steps: ['한 상자나 꾸러미에 든 수는 {{b}} + {{c}} = {{b + c}}개입니다.', '{{a}}개에 든 전체 수는 {{a}} × {{b + c}} = {{a * (b + c)}}개입니다.'],
    },
    {
      params: { a: largeA, b, c },
      prompt: config.contexts.difference,
      solver: '(a - b) * c',
      steps: ['한 모둠이나 부스에 남은 수는 {{a}} - {{b}} = {{a - b}}입니다.', '{{c}}곳에 남은 전체 수는 {{a - b}} × {{c}} = {{(a - b) * c}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.errorPrompt,
      solver: '(a + b) * c - (a + b * c)',
      steps: ['올바른 값은 ({{a}} + {{b}}) × {{c}} = {{(a + b) * c}}입니다.', '잘못 계산한 값은 {{a + b * c}}이므로 두 값의 차이는 {{(a + b) * c - (a + b * c)}}입니다.'],
    },
    {
      params: { a, b, c },
      prompt: config.contexts.model,
      solver: 'a * (b + c) - (a * b + c)',
      steps: ['올바른 전체 수는 {{a}} × ({{b}} + {{c}}) = {{a * (b + c)}}입니다.', '잘못 계산한 값은 {{a * b + c}}이므로 {{a * (b + c) - (a * b + c)}}만큼 적게 계산했습니다.'],
    },
  ]
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-mixedcalc-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'mixedcalc-001',
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
          ? '괄호가 있으면 괄호 안을, 없으면 곱셈을 먼저 계산해요.'
          : slot <= 8
            ? '문장에서 한 묶음의 수와 묶음 수, 이미 있거나 사용한 수를 구분해요.'
            : '올바른 식과 잘못 세운 식을 각각 계산해 차이를 비교해요.',
        slot <= 4
          ? '먼저 계산한 결과로 덧셈이나 뺄셈을 이어서 해요.'
          : slot <= 8
            ? '상황을 하나의 혼합 계산식으로 나타낸 뒤 계산 순서를 지켜요.'
            : '괄호가 전체 계산 결과에 어떤 차이를 만드는지 확인해요.',
      ],
    }

    if (type === 'choice') {
      template.choices_template = [
        `{{${definition.solver}}}`,
        `{{(${definition.solver}) + 3}}`,
        `{{(${definition.solver}) + 7}}`,
        `{{(${definition.solver}) + 12}}`,
      ]
    }

    return template
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 mixed-calculation templates to ${outputPath}`)
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
