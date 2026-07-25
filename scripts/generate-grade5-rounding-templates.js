const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'rounding.json'
)

const familyBySlot = [
  'rounding-direct-tens',
  'rounding-direct-hundreds',
  'rounding-direct-thousands',
  'rounding-boundary-value',
  'rounding-context-total',
  'rounding-context-difference',
  'rounding-inverse-lower-bound',
  'rounding-inverse-upper-bound',
  'rounding-interval-boundary-sum',
  'rounding-method-gap',
]

const setDefinitions = {
  A: [
    {
      params: { n: { min: 120, max: 980 } },
      prompt: '마을 걷기 행사에 {{n}}명이 참가했습니다. 참가자 수를 십의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(n, 10)',
      steps: ['일의 자리 숫자를 확인합니다.', '{{n}}명을 십의 자리까지 반올림하면 {{roundTo(n, 10)}}명입니다.'],
    },
    {
      params: { n: { min: 1200, max: 9800 } },
      prompt: '도서관에 책이 {{n}}권 있습니다. 책 수를 백의 자리까지 반올림하면 몇 권인가요?',
      solver: 'roundTo(n, 100)',
      steps: ['십의 자리 숫자를 확인합니다.', '{{n}}권을 백의 자리까지 반올림하면 {{roundTo(n, 100)}}권입니다.'],
    },
    {
      params: { n: { min: 1201, max: 9801 } },
      prompt: '박물관의 한 해 관람객은 {{n}}명입니다. 천의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(n, 1000)',
      steps: ['백의 자리 숫자를 확인합니다.', '{{n}}명을 천의 자리까지 반올림하면 {{roundTo(n, 1000)}}명입니다.'],
    },
    {
      params: { h: { min: 12, max: 98 } },
      prompt: '{{h * 100 + 49}}를 백의 자리까지 반올림한 수를 구하세요.',
      solver: 'roundTo(h * 100 + 49, 100)',
      steps: ['십의 자리까지의 수 49는 50보다 작습니다.', '{{h * 100 + 49}}는 {{h * 100}}으로 반올림됩니다.'],
    },
    {
      params: { a: { min: 12, max: 30 }, b: { min: 8, max: 20 } },
      prompt: '학교 축제 첫날에는 {{a * 100 + 30}}명, 둘째 날에는 {{b * 100 + 20}}명이 왔습니다. 이틀 방문객의 합을 백의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(a * 100 + 30 + b * 100 + 20, 100)',
      steps: ['두 날의 방문객을 더하면 {{a * 100 + 30 + b * 100 + 20}}명입니다.', '합을 백의 자리까지 반올림하면 {{roundTo(a * 100 + 30 + b * 100 + 20, 100)}}명입니다.'],
    },
    {
      params: { a: { min: 40, max: 70 }, b: { min: 10, max: 25 } },
      prompt: '창고에 상자가 {{a * 100 + 80}}개 있었고 {{b * 100 + 20}}개를 보냈습니다. 남은 상자 수를 백의 자리까지 반올림하면 몇 개인가요?',
      solver: 'roundTo(a * 100 + 80 - b * 100 - 20, 100)',
      steps: ['남은 상자는 {{a * 100 + 80 - b * 100 - 20}}개입니다.', '백의 자리까지 반올림하면 {{roundTo(a * 100 + 80 - b * 100 - 20, 100)}}개입니다.'],
    },
    {
      params: { t: { min: 20, max: 90 } },
      prompt: '백의 자리까지 반올림했을 때 {{t * 100}}이 되는 자연수 중 가장 작은 수는 무엇인가요?',
      solver: 't * 100 - 50',
      steps: ['{{t * 100}}보다 50 작은 수부터 {{t * 100}}으로 반올림됩니다.', '가장 작은 수는 {{t * 100 - 50}}입니다.'],
    },
    {
      params: { t: { min: 20, max: 90 } },
      prompt: '백의 자리까지 반올림했을 때 {{t * 100}}이 되는 자연수 중 가장 큰 수는 무엇인가요?',
      solver: 't * 100 + 49',
      steps: ['{{t * 100}}보다 50 큰 수는 다음 백의 자리 수로 반올림됩니다.', '따라서 가장 큰 수는 {{t * 100 + 49}}입니다.'],
    },
    {
      params: { t: { min: 20, max: 90 } },
      prompt: '백의 자리까지 반올림했을 때 {{t * 100}}이 되는 자연수의 범위를 빠짐없이 따졌습니다. 가장 작은 수와 가장 큰 수의 합은 얼마인가요?',
      solver: 't * 100 - 50 + t * 100 + 49',
      steps: ['가장 작은 수는 {{t * 100 - 50}}, 가장 큰 수는 {{t * 100 + 49}}입니다.', '두 끝 수를 더하면 {{t * 100 - 50 + t * 100 + 49}}입니다.'],
    },
    {
      params: { a: { min: 12, max: 30 }, b: { min: 8, max: 20 } },
      prompt: '두 물품의 무게는 {{a * 100 + 40}}g과 {{b * 100 + 40}}g입니다. 각각 백의 자리까지 반올림해 더한 값과, 정확한 합을 먼저 구해 백의 자리까지 반올림한 값의 차이는 몇 g인가요?',
      solver: 'roundTo(a * 100 + 40 + b * 100 + 40, 100) - a * 100 - b * 100',
      steps: ['각각 반올림해 더하면 {{a * 100 + b * 100}}g입니다.', '정확한 합 {{a * 100 + b * 100 + 80}}g을 반올림하면 {{a * 100 + b * 100 + 100}}g이므로 차이는 100g입니다.'],
    },
  ],
  B: [
    {
      params: { n: { min: 230, max: 990 } },
      prompt: '공연 입장권이 {{n}}장 팔렸습니다. 판매량을 십의 자리까지 반올림하면 몇 장인가요?',
      solver: 'roundTo(n, 10)',
      steps: ['일의 자리 숫자로 올릴지 그대로 둘지 판단합니다.', '{{n}}장을 십의 자리까지 반올림하면 {{roundTo(n, 10)}}장입니다.'],
    },
    {
      params: { n: { min: 2100, max: 9900 } },
      prompt: '재활용품을 {{n}}개 모았습니다. 개수를 백의 자리까지 반올림하면 몇 개인가요?',
      solver: 'roundTo(n, 100)',
      steps: ['십의 자리 숫자를 확인합니다.', '{{n}}개를 백의 자리까지 반올림하면 {{roundTo(n, 100)}}개입니다.'],
    },
    {
      params: { n: { min: 1501, max: 9501 } },
      prompt: '지역 마라톤 누적 참가자는 {{n}}명입니다. 천의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(n, 1000)',
      steps: ['백의 자리 숫자를 확인합니다.', '{{n}}명을 천의 자리까지 반올림하면 {{roundTo(n, 1000)}}명입니다.'],
    },
    {
      params: { h: { min: 12, max: 98 } },
      prompt: '{{h * 100 + 50}}를 백의 자리까지 반올림한 수를 구하세요.',
      solver: 'roundTo(h * 100 + 50, 100)',
      steps: ['십의 자리까지의 수가 50이므로 백의 자리 숫자를 1 올립니다.', '결과는 {{h * 100 + 100}}입니다.'],
    },
    {
      params: { a: { min: 15, max: 32 }, b: { min: 9, max: 21 } },
      prompt: '과학관 오전 관람객은 {{a * 100 + 40}}명, 오후 관람객은 {{b * 100 + 30}}명입니다. 하루 관람객의 합을 백의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(a * 100 + 40 + b * 100 + 30, 100)',
      steps: ['오전과 오후 관람객을 더하면 {{a * 100 + 40 + b * 100 + 30}}명입니다.', '합을 백의 자리까지 반올림하면 {{roundTo(a * 100 + 40 + b * 100 + 30, 100)}}명입니다.'],
    },
    {
      params: { a: { min: 45, max: 75 }, b: { min: 12, max: 28 } },
      prompt: '행사장 수용 가능 인원은 {{a * 100 + 20}}명이고 현재 {{b * 100 + 70}}명이 입장했습니다. 더 입장할 수 있는 인원을 백의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(a * 100 + 20 - b * 100 - 70, 100)',
      steps: ['더 입장할 수 있는 인원은 {{a * 100 + 20 - b * 100 - 70}}명입니다.', '이를 백의 자리까지 반올림하면 {{roundTo(a * 100 + 20 - b * 100 - 70, 100)}}명입니다.'],
    },
    {
      params: { t: { min: 12, max: 90 } },
      prompt: '천의 자리까지 반올림했을 때 {{t * 1000}}이 되는 자연수 중 가장 작은 수는 무엇인가요?',
      solver: 't * 1000 - 500',
      steps: ['{{t * 1000}}보다 500 작은 수부터 목표값으로 반올림됩니다.', '가장 작은 수는 {{t * 1000 - 500}}입니다.'],
    },
    {
      params: { t: { min: 12, max: 90 } },
      prompt: '천의 자리까지 반올림했을 때 {{t * 1000}}이 되는 자연수 중 가장 큰 수는 무엇인가요?',
      solver: 't * 1000 + 499',
      steps: ['{{t * 1000 + 500}}부터는 다음 천의 자리 수가 됩니다.', '따라서 가장 큰 수는 {{t * 1000 + 499}}입니다.'],
    },
    {
      params: { t: { min: 12, max: 90 } },
      prompt: '천의 자리까지 반올림했을 때 {{t * 1000}}이 되는 자연수의 범위를 빠짐없이 따졌습니다. 가장 작은 수와 가장 큰 수의 합은 얼마인가요?',
      solver: 't * 1000 - 500 + t * 1000 + 499',
      steps: ['범위의 두 끝은 {{t * 1000 - 500}}과 {{t * 1000 + 499}}입니다.', '두 끝 수를 더하면 {{t * 1000 - 500 + t * 1000 + 499}}입니다.'],
    },
    {
      params: { a: { min: 14, max: 32 }, b: { min: 10, max: 24 } },
      prompt: '두 상자의 질량은 {{a * 100 + 60}}g과 {{b * 100 + 60}}g입니다. 각각 백의 자리까지 반올림해 더한 값과, 정확한 합을 먼저 구해 반올림한 값의 차이는 몇 g인가요?',
      solver: 'a * 100 + b * 100 + 200 - roundTo(a * 100 + 60 + b * 100 + 60, 100)',
      steps: ['각각 반올림해 더하면 {{a * 100 + b * 100 + 200}}g입니다.', '정확한 합 {{a * 100 + b * 100 + 120}}g을 반올림하면 {{a * 100 + b * 100 + 100}}g이므로 차이는 100g입니다.'],
    },
  ],
  C: [
    {
      params: { n: { min: 140, max: 970 } },
      prompt: '자전거 길의 길이는 {{n}}m입니다. 길이를 십의 자리까지 반올림하면 몇 m인가요?',
      solver: 'roundTo(n, 10)',
      steps: ['일의 자리 숫자를 확인합니다.', '{{n}}m를 십의 자리까지 반올림하면 {{roundTo(n, 10)}}m입니다.'],
    },
    {
      params: { n: { min: 1600, max: 9700 } },
      prompt: '공장에서 하루에 제품을 {{n}}개 만들었습니다. 백의 자리까지 반올림하면 몇 개인가요?',
      solver: 'roundTo(n, 100)',
      steps: ['십의 자리 숫자를 확인합니다.', '{{n}}개를 백의 자리까지 반올림하면 {{roundTo(n, 100)}}개입니다.'],
    },
    {
      params: { n: { min: 1301, max: 9701 } },
      prompt: '환경 캠페인 누적 참여자는 {{n}}명입니다. 천의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(n, 1000)',
      steps: ['백의 자리 숫자를 확인합니다.', '{{n}}명을 천의 자리까지 반올림하면 {{roundTo(n, 1000)}}명입니다.'],
    },
    {
      params: { h: { min: 12, max: 98 } },
      prompt: '이미 백의 자리 수인 {{h * 100}}을 백의 자리까지 반올림하면 얼마인가요?',
      solver: 'roundTo(h * 100, 100)',
      steps: ['버릴 아래 자리가 모두 0입니다.', '{{h * 100}}은 그대로 {{h * 100}}입니다.'],
    },
    {
      params: { a: { min: 16, max: 34 }, b: { min: 10, max: 22 } },
      prompt: '두 학급이 모은 병뚜껑은 {{a * 100 + 20}}개와 {{b * 100 + 20}}개입니다. 전체를 백의 자리까지 반올림하면 몇 개인가요?',
      solver: 'roundTo(a * 100 + 20 + b * 100 + 20, 100)',
      steps: ['두 학급의 수를 더하면 {{a * 100 + 20 + b * 100 + 20}}개입니다.', '합을 백의 자리까지 반올림하면 {{roundTo(a * 100 + 20 + b * 100 + 20, 100)}}개입니다.'],
    },
    {
      params: { a: { min: 50, max: 80 }, b: { min: 15, max: 30 } },
      prompt: '지난달 방문객은 {{a * 100 + 70}}명, 이번 달 방문객은 {{b * 100 + 10}}명입니다. 두 달 방문객 수의 차이를 백의 자리까지 반올림하면 몇 명인가요?',
      solver: 'roundTo(a * 100 + 70 - b * 100 - 10, 100)',
      steps: ['두 달 방문객 수의 차이는 {{a * 100 + 70 - b * 100 - 10}}명입니다.', '차이를 백의 자리까지 반올림하면 {{roundTo(a * 100 + 70 - b * 100 - 10, 100)}}명입니다.'],
    },
    {
      params: { t: { min: 120, max: 980 } },
      prompt: '십의 자리까지 반올림했을 때 {{t * 10}}이 되는 자연수 중 가장 작은 수는 무엇인가요?',
      solver: 't * 10 - 5',
      steps: ['{{t * 10}}보다 5 작은 수부터 목표값으로 반올림됩니다.', '가장 작은 수는 {{t * 10 - 5}}입니다.'],
    },
    {
      params: { t: { min: 120, max: 980 } },
      prompt: '십의 자리까지 반올림했을 때 {{t * 10}}이 되는 자연수 중 가장 큰 수는 무엇인가요?',
      solver: 't * 10 + 4',
      steps: ['{{t * 10 + 5}}부터는 다음 십의 자리 수가 됩니다.', '따라서 가장 큰 수는 {{t * 10 + 4}}입니다.'],
    },
    {
      params: { t: { min: 120, max: 980 } },
      prompt: '십의 자리까지 반올림했을 때 {{t * 10}}이 되는 자연수의 범위를 빠짐없이 따졌습니다. 가장 작은 수와 가장 큰 수의 합은 얼마인가요?',
      solver: 't * 10 - 5 + t * 10 + 4',
      steps: ['범위의 두 끝은 {{t * 10 - 5}}와 {{t * 10 + 4}}입니다.', '두 끝 수를 더하면 {{t * 10 - 5 + t * 10 + 4}}입니다.'],
    },
    {
      params: { a: { min: 16, max: 34 }, b: { min: 12, max: 26 } },
      prompt: '두 꾸러미의 질량은 {{a * 100 + 40}}g과 {{b * 100 + 60}}g입니다. 각각 백의 자리까지 반올림해 더한 값과, 정확한 합을 먼저 구해 반올림한 값의 차이는 몇 g인가요?',
      solver: 'roundTo(a * 100 + 40 + b * 100 + 60, 100) - a * 100 - b * 100 - 100',
      steps: ['각각 반올림해 더하면 {{a * 100 + b * 100 + 100}}g입니다.', '정확한 합도 {{a * 100 + b * 100 + 100}}g이고 이미 백의 자리 수이므로 차이는 0g입니다.'],
    },
  ],
}

const templates = Object.entries(setDefinitions).flatMap(([setId, definitions]) =>
  definitions.map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const base = {
      id: `tmpl-rounding-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'rounding-001',
      type: 'number',
      difficulty,
      set_id: setId,
      problem_family: familyBySlot[index],
    }

    return {
      ...base,
      blueprint: getReviewedBlueprint(base),
      param_schema: definition.params,
      prompt_template: definition.prompt,
      solver_rule: definition.solver,
      solution_steps_template: definition.steps,
      hint_steps_template: [
        slot <= 4
          ? '반올림할 자리의 바로 아래 자리 숫자를 확인해요.'
          : slot <= 6
            ? '먼저 상황에 필요한 합이나 차를 정확하게 구해요.'
            : slot <= 8
              ? '반올림 결과를 만드는 수의 범위를 거꾸로 생각해요.'
              : '가장 작은 수와 가장 큰 수, 또는 두 방법의 계산 순서를 비교해요.',
        slot <= 4
          ? '0~4이면 그대로 두고 5~9이면 한 자리 올려요.'
          : '계산 결과와 반올림한 자릿값이 문제의 조건에 맞는지 확인해요.',
      ],
    }
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 rounding templates to ${outputPath}`)
}

if (require.main === module) {
  writeTemplates()
}

module.exports = {
  familyBySlot,
  setDefinitions,
  templates,
  writeTemplates,
}
