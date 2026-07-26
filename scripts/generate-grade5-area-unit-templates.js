const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'areaunit.json'
)

const familyBySlot = [
  'areaunit-one-square-meter',
  'areaunit-one-square-kilometer',
  'areaunit-square-meters-forward',
  'areaunit-square-kilometers-forward',
  'areaunit-square-centimeters-reverse',
  'areaunit-square-meters-reverse',
  'areaunit-rectangle-to-square-centimeters',
  'areaunit-mixed-land-total',
  'areaunit-one-direction-error',
  'areaunit-rectangle-one-side-error',
]

const setProfiles = {
  A: {
    p: { min: 2, max: 4 },
    w: { min: 3, max: 6 },
    h: { min: 2, max: 5 },
    q: { min: 200, max: 800 },
    room: '교실 바닥',
    land: '생태 공원',
  },
  B: {
    p: { min: 5, max: 7 },
    w: { min: 6, max: 9 },
    h: { min: 4, max: 7 },
    q: { min: 900, max: 1800 },
    room: '전시관 바닥',
    land: '산림 보호 구역',
  },
  C: {
    p: { min: 8, max: 10 },
    w: { min: 8, max: 12 },
    h: { min: 6, max: 9 },
    q: { min: 1900, max: 3500 },
    room: '체육관 안전 구역',
    land: '해양 조사 구역',
  },
}

function unitSquare(caption, largerLengthUnit, smallerLengthUnit) {
  return {
    type: 'area_unit_square',
    semantics: 'quantitative',
    props: {
      caption,
      largerLengthUnit,
      smallerLengthUnit,
    },
  }
}

function buildDefinitions(profile) {
  const p = { p: profile.p }
  return [
    {
      params: {},
      prompt: '한 변이 1m인 정사각형의 넓이는 몇 cm²인가요?',
      solver: '10000',
      choices: ['10000', '100', '1000', '100000'],
      steps: ['1m=100cm이므로 가로와 세로가 각각 100cm입니다.', '100×100=10000이므로 1m²=10000cm²입니다.'],
      visual: unitSquare('1m²의 두 방향 변환', 'm', 'cm'),
    },
    {
      params: {},
      prompt: '한 변이 1km인 정사각형의 넓이는 몇 m²인가요?',
      solver: '1000000',
      steps: ['1km=1000m이므로 가로와 세로가 각각 1000m입니다.', '1000×1000=1000000이므로 1km²=1000000m²입니다.'],
      visual: unitSquare('1km²의 두 방향 변환', 'km', 'm'),
    },
    {
      params: p,
      prompt: '{{p}}m²는 몇 cm²인가요?',
      solver: 'p * 10000',
      choices: ['p * 10000', 'p * 100', 'p * 1000', 'p * 100000'],
      steps: ['1m²=10000cm²입니다.', '{{p}}×10000={{p * 10000}}이므로 {{p}}m²={{p * 10000}}cm²입니다.'],
      visual: unitSquare('m²를 cm²로 바꾸기', 'm', 'cm'),
    },
    {
      params: p,
      prompt: '{{p}}km²는 몇 m²인가요?',
      solver: 'p * 1000000',
      steps: ['1km²=1000000m²입니다.', '{{p}}×1000000={{p * 1000000}}이므로 {{p}}km²={{p * 1000000}}m²입니다.'],
      visual: unitSquare('km²를 m²로 바꾸기', 'km', 'm'),
    },
    {
      params: p,
      prompt: `${profile.room}의 넓이가 {{p * 10000}}cm²입니다. 이를 m²로 나타내세요.`,
      solver: 'p',
      choices: ['p', 'p + 1', 'p + 2', 'p + 3'],
      steps: ['10000cm²가 1m²입니다.', '{{p * 10000}}÷10000={{p}}이므로 넓이는 {{p}}m²입니다.'],
      visual: unitSquare('cm²에서 m²로 묶기', 'm', 'cm'),
    },
    {
      params: p,
      prompt: `${profile.land}의 넓이가 {{p * 1000000}}m²입니다. 이를 km²로 나타내세요.`,
      solver: 'p',
      steps: ['1000000m²가 1km²입니다.', '{{p * 1000000}}÷1000000={{p}}이므로 넓이는 {{p}}km²입니다.'],
      visual: unitSquare('m²에서 km²로 묶기', 'km', 'm'),
    },
    {
      params: { w: profile.w, h: profile.h },
      prompt: `가로 {{w}}m, 세로 {{h}}m인 ${profile.room}의 넓이는 몇 cm²인가요?`,
      solver: 'w * h * 10000',
      choices: [
        'w * h * 10000',
        'w * h * 100',
        'w * h * 1000',
        'w * h * 100000',
      ],
      steps: ['먼저 넓이는 {{w}}×{{h}}={{w * h}}m²입니다.', '1m²=10000cm²이므로 {{w * h}}×10000={{w * h * 10000}}cm²입니다.'],
      visual: unitSquare('직사각형 넓이의 단위 변환', 'm', 'cm'),
    },
    {
      params: { p: profile.p, q: profile.q },
      prompt: `${profile.land}은 {{p}}km²인 구역과 {{q}}m²인 구역으로 이루어져 있습니다. 전체 넓이는 몇 m²인가요?`,
      solver: 'p * 1000000 + q',
      steps: ['{{p}}km²={{p * 1000000}}m²입니다.', '{{p * 1000000}}+{{q}}={{p * 1000000 + q}}이므로 전체는 {{p * 1000000 + q}}m²입니다.'],
      visual: unitSquare('서로 다른 넓이 단위 합치기', 'km', 'm'),
    },
    {
      params: p,
      prompt: '민지는 {{p}}m²를 cm²로 바꾸며 한 방향만 100배 하여 {{p * 100}}cm²라고 했습니다. 가로와 세로를 모두 바꾼 올바른 값은 잘못된 값보다 몇 cm² 큰가요?',
      solver: 'p * 9900',
      choices: ['p * 9900', 'p * 99', 'p * 900', 'p * 9990'],
      steps: ['올바른 값은 {{p}}×100×100={{p * 10000}}cm²입니다.', '잘못된 값 {{p * 100}}cm²와의 차는 {{p * 10000}}-{{p * 100}}={{p * 9900}}cm²입니다.'],
      visual: unitSquare('한 방향만 바꾼 오류', 'm', 'cm'),
    },
    {
      params: p,
      prompt: '가로 {{p}}km, 세로 {{p + 1}}km인 조사 구역을 m²로 바꾸며 세로만 m로 바꾸지 않았습니다. 가로와 세로를 모두 m로 바꾼 올바른 넓이는 잘못된 넓이보다 몇 m² 큰가요?',
      solver: 'p * (p + 1) * 999000',
      steps: ['올바른 넓이는 {{p * 1000}}×{{(p + 1) * 1000}}={{p * (p + 1) * 1000000}}m²입니다.', '잘못된 넓이는 {{p * 1000}}×{{p + 1}}={{p * (p + 1) * 1000}}m²입니다.', '두 값의 차는 {{p * (p + 1) * 999000}}m²입니다.'],
      visual: unitSquare('한 변의 단위를 빠뜨린 오류', 'km', 'm'),
    },
  ]
}

function buildTemplates() {
  return Object.entries(setProfiles).flatMap(([setId, profile]) => (
    buildDefinitions(profile).map((definition, index) => {
      const slot = index + 1
      const type = slot % 2 === 1 ? 'choice' : 'number'
      const base = {
        id: `tmpl-areaunit-${setId}-${String(slot).padStart(2, '0')}`,
        concept_id: 'areaunit-001',
        type,
        difficulty: slot <= 4 ? 1 : slot <= 8 ? 2 : 3,
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
            ? '넓이는 가로와 세로 두 방향의 단위를 함께 바꿔요.'
            : slot <= 8
              ? '먼저 같은 넓이 단위로 맞춘 뒤 상황에 필요한 계산을 해요.'
              : '한 방향만 바꾼 계산과 두 방향을 모두 바꾼 계산을 비교해요.',
          '그림에서 정사각형의 가로와 세로에 같은 길이 변환이 적용되는지 확인해요.',
        ],
        visual_template: definition.visual,
      }
      if (type === 'choice') {
        template.choices_template = definition.choices.map(choice => `{{${choice}}}`)
      }
      return template
    })
  ))
}

const templates = buildTemplates()

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 area-unit templates to ${outputPath}`)
}

if (require.main === module) writeTemplates()

module.exports = {
  familyBySlot,
  setProfiles,
  buildDefinitions,
  buildTemplates,
  templates,
  writeTemplates,
}
