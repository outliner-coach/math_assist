const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'estimate.json'
)

const familyBySlot = [
  'estimate-ceil-direct-tens',
  'estimate-floor-direct-tens',
  'estimate-ceil-direct-hundreds',
  'estimate-floor-direct-hundreds',
  'estimate-safe-capacity-ceil',
  'estimate-complete-groups-floor',
  'estimate-ceil-extra',
  'estimate-floor-remainder',
  'estimate-wrong-bound-shortage',
  'estimate-bound-sum',
]

const setConfigs = {
  A: {
    direct: ['물병은', '개', '모은 종이는', '장'],
    capacity: ['강당 행사에', '명'],
    complete: ['전단은', '장'],
    purchase: ['인쇄용지가', '장'],
    remainder: ['재활용품은', '개'],
    wrong: ['현장학습에', '명'],
    remainder100: 30,
    remainder1000: 240,
    hMin: 12,
    hMax: 48,
  },
  B: {
    direct: ['학습 카드는', '장', '모은 병뚜껑은', '개'],
    capacity: ['공연에', '명'],
    complete: ['택배로 보낼 제품은', '개'],
    purchase: ['행사 안내문이', '장'],
    remainder: ['창고 부품은', '개'],
    wrong: ['대피 훈련에', '명'],
    remainder100: 60,
    remainder1000: 530,
    hMin: 20,
    hMax: 60,
  },
  C: {
    direct: ['연필은', '자루', '도서관 책은', '권'],
    capacity: ['체육관 행사에', '명'],
    complete: ['보낼 책은', '권'],
    purchase: ['전시용 스티커가', '장'],
    remainder: ['기부 물품은', '개'],
    wrong: ['학교 축제에', '명'],
    remainder100: 80,
    remainder1000: 760,
    hMin: 30,
    hMax: 75,
  },
}

function buildSetDefinitions(config) {
  const [smallSubject, smallUnit, largeSubject, largeUnit] = config.direct
  const [capacityContext, capacityUnit] = config.capacity
  const [completeSubject, completeUnit] = config.complete
  const [purchaseSubject, purchaseUnit] = config.purchase
  const [remainderSubject, remainderUnit] = config.remainder
  const [wrongContext, wrongUnit] = config.wrong
  const hRange = { min: config.hMin, max: config.hMax }
  const value100 = `h * 100 + ${config.remainder100}`
  const value1000 = `h * 1000 + ${config.remainder1000}`

  return [
    {
      params: { n: { min: 120, max: 980 } },
      prompt: `${smallSubject} {{n}}${smallUnit} 있습니다. 수를 십의 자리까지 올림하면 몇 ${smallUnit}인가요?`,
      solver: 'ceilTo(n, 10)',
      steps: ['십의 자리 아래에 남는 수가 있으면 십의 자리 숫자를 1 올립니다.', '{{n}}을 십의 자리까지 올림하면 {{ceilTo(n, 10)}}입니다.'],
    },
    {
      params: { n: { min: 120, max: 980 } },
      prompt: `${smallSubject} {{n}}${smallUnit} 있습니다. 수를 십의 자리까지 버림하면 몇 ${smallUnit}인가요?`,
      solver: 'floorTo(n, 10)',
      steps: ['십의 자리 아래 숫자를 모두 0으로 만듭니다.', '{{n}}을 십의 자리까지 버림하면 {{floorTo(n, 10)}}입니다.'],
    },
    {
      params: { n: { min: 1200, max: 9800 } },
      prompt: `${largeSubject} {{n}}${largeUnit} 있습니다. 수를 백의 자리까지 올림하면 몇 ${largeUnit}인가요?`,
      solver: 'ceilTo(n, 100)',
      steps: ['백의 자리 아래에 남는 수가 있으면 백의 자리 숫자를 1 올립니다.', '{{n}}을 백의 자리까지 올림하면 {{ceilTo(n, 100)}}입니다.'],
    },
    {
      params: { n: { min: 1200, max: 9800 } },
      prompt: `${largeSubject} {{n}}${largeUnit} 있습니다. 수를 백의 자리까지 버림하면 몇 ${largeUnit}인가요?`,
      solver: 'floorTo(n, 100)',
      steps: ['백의 자리 아래 숫자를 모두 0으로 만듭니다.', '{{n}}을 백의 자리까지 버림하면 {{floorTo(n, 100)}}입니다.'],
    },
    {
      params: { h: hRange },
      prompt: `${capacityContext} ${`{{${value100}}}`}${capacityUnit}이 참여합니다. 부족하지 않도록 백의 자리 수로 좌석을 계획하면 최소 몇 개를 준비해야 하나요?`,
      solver: `ceilTo(${value100}, 100)`,
      steps: [`참여자 수 ${`{{${value100}}}`}${capacityUnit}보다 좌석이 적으면 부족합니다.`, `백의 자리까지 올림하여 좌석 ${`{{ceilTo(${value100}, 100)}}`}개를 준비합니다.`],
    },
    {
      params: { h: hRange },
      prompt: `${completeSubject} ${`{{${value100}}}`}${completeUnit} 있습니다. 100${completeUnit}씩 한 묶음으로 완성된 것만 보낼 때 최대 몇 ${completeUnit}을 보낼 수 있나요?`,
      solver: `floorTo(${value100}, 100)`,
      steps: ['100씩 완성되지 않은 나머지는 이번에 보낼 수 없습니다.', `백의 자리까지 버린 ${`{{floorTo(${value100}, 100)}}`}${completeUnit}을 보낼 수 있습니다.`],
    },
    {
      params: { h: hRange },
      prompt: `${purchaseSubject} ${`{{${value1000}}}`}${purchaseUnit} 필요하고 1000${purchaseUnit} 묶음으로만 살 수 있습니다. 필요한 만큼 산 뒤 남는 것은 몇 ${purchaseUnit}인가요?`,
      solver: `ceilTo(${value1000}, 1000) - (${value1000})`,
      steps: [`부족하지 않게 사려면 ${`{{ceilTo(${value1000}, 1000)}}`}${purchaseUnit}을 사야 합니다.`, `남는 양은 ${`{{ceilTo(${value1000}, 1000) - (${value1000})}}`}${purchaseUnit}입니다.`],
    },
    {
      params: { h: hRange },
      prompt: `${remainderSubject} ${`{{${value1000}}}`}${remainderUnit} 있습니다. 1000${remainderUnit}씩 한 묶음으로 만든 뒤 남는 것은 몇 ${remainderUnit}인가요?`,
      solver: `(${value1000}) - floorTo(${value1000}, 1000)`,
      steps: [`완성된 묶음에 쓰는 양은 ${`{{floorTo(${value1000}, 1000)}}`}${remainderUnit}입니다.`, `남는 양은 ${`{{(${value1000}) - floorTo(${value1000}, 1000)}}`}${remainderUnit}입니다.`],
    },
    {
      params: { h: hRange },
      prompt: `${wrongContext} ${`{{${value1000}}}`}${wrongUnit}이 참여합니다. 한 학생이 천의 자리까지 버림한 수만큼 좌석을 준비해도 된다고 했습니다. 그 계획은 좌석이 몇 개 부족한가요?`,
      solver: `(${value1000}) - floorTo(${value1000}, 1000)`,
      steps: [`버림한 계획은 좌석 ${`{{floorTo(${value1000}, 1000)}}`}개입니다.`, `실제 필요량보다 좌석이 ${`{{(${value1000}) - floorTo(${value1000}, 1000)}}`}개 부족합니다.`],
    },
    {
      params: { h: hRange },
      prompt: `${`{{${value1000}}}`}을 천의 자리까지 버린 값과 올림한 값은 실제 수의 아래·위 경계입니다. 두 경계값의 합은 얼마인가요?`,
      solver: `floorTo(${value1000}, 1000) + ceilTo(${value1000}, 1000)`,
      steps: [`아래 경계는 ${`{{floorTo(${value1000}, 1000)}}`}, 위 경계는 ${`{{ceilTo(${value1000}, 1000)}}`}입니다.`, `두 값을 더하면 ${`{{floorTo(${value1000}, 1000) + ceilTo(${value1000}, 1000)}}`}입니다.`],
    },
  ]
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const base = {
      id: `tmpl-estimate-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'estimate-001',
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
          ? '올림인지 버림인지 먼저 확인하고, 남기는 자리 아래를 살펴봐요.'
          : slot <= 6
            ? '부족하면 안 되는지, 완성된 묶음만 셀지 상황을 먼저 판단해요.'
            : slot <= 8
              ? '올림하거나 버린 값과 실제 값의 차이를 구해요.'
              : '선택한 어림 방법이 실제 조건에 어떤 부족이나 범위를 만드는지 확인해요.',
        slot <= 4
          ? '올림은 남는 수가 있으면 1 올리고, 버림은 아래 자리를 모두 버려요.'
          : '계산한 값이 안전한 위 경계인지 가능한 아래 경계인지 다시 확인해요.',
      ],
    }
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 estimate templates to ${outputPath}`)
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
