const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'possibility.json'
)

const familyBySlot = [
  'possibility-verbal-impossible-certain',
  'possibility-verbal-comparison',
  'possibility-numeric-half',
  'possibility-numeric-impossible',
  'possibility-predict-from-half',
  'possibility-compare-relative-frequency',
  'possibility-predicted-count-gap',
  'possibility-sample-size-reliability',
  'possibility-raw-count-error',
  'possibility-pooled-data-prediction',
]

const setProfiles = {
  A: {
    p: { min: 4, max: 6 },
    groups: { min: 2, max: 3 },
    event: '씨앗이 싹튼',
    trial: '화분',
    decision: '재배 방법',
  },
  B: {
    p: { min: 7, max: 9 },
    groups: { min: 3, max: 4 },
    event: '표적에 맞은',
    trial: '연습',
    decision: '훈련 방법',
  },
  C: {
    p: { min: 10, max: 12 },
    groups: { min: 4, max: 5 },
    event: '검사를 통과한',
    trial: '제품',
    decision: '검사 절차',
  },
}

function trialsVisual(caption, rows) {
  return {
    type: 'possibility_trials',
    semantics: 'quantitative',
    props: {
      caption,
      rows,
    },
  }
}

function buildDefinitions(profile) {
  const p = { p: profile.p }
  const repeated = { p: profile.p, groups: profile.groups }
  return [
    {
      params: p,
      prompt: '가 사건은 {{p + 2}}번 중 0번, 나 사건은 {{p + 2}}번 중 {{p + 2}}번 일어났습니다. ① 가는 불가능하다, 나는 확실하다 ② 둘 다 반반이다 ③ 가는 확실하다, 나는 불가능하다 ④ 둘 다 일어날 것 같다 중 알맞은 설명의 번호를 고르세요.',
      solver: '1',
      choices: ['1', '2', '3', '4'],
      steps: ['가 사건은 한 번도 일어나지 않아 불가능하다고 표현합니다.', '나 사건은 매번 일어나 확실하다고 표현하므로 ①이 알맞습니다.'],
      visual: trialsVisual('불가능한 사건과 확실한 사건', [
        { label: '가', favorable: 0, total: '{{p + 2}}' },
        { label: '나', favorable: '{{p + 2}}', total: '{{p + 2}}' },
      ]),
    },
    {
      params: p,
      prompt: `${profile.decision} 가와 나를 같은 {{p + 2}}번씩 시험했습니다. 가는 {{p}}번, 나는 {{p + 1}}번 성공했습니다. 성공할 가능성을 말로 비교하여 다음에 먼저 적용할 ${profile.decision}의 번호를 1(가), 2(나) 중에서 쓰세요.`,
      solver: '2',
      steps: ['두 방법은 전체 횟수가 {{p + 2}}번으로 같습니다.', '나는 {{p + 1}}번 성공하여 가의 {{p}}번보다 성공할 가능성이 더 크므로 나를 먼저 적용합니다.'],
      visual: trialsVisual('가능성을 비교하여 적용할 방법 고르기', [
        { label: '가', favorable: '{{p}}', total: '{{p + 2}}' },
        { label: '나', favorable: '{{p + 1}}', total: '{{p + 2}}' },
      ]),
    },
    {
      params: p,
      prompt: '전체 {{2 * p}}번 중 사건이 {{p}}번 일어났습니다. 관찰한 가능성 {{p}}/{{2 * p}}를 기약분수로 나타내세요.',
      solver: 'reduceFrac(p, 2 * p)',
      choices: ['reduceFrac(p, 2 * p)', '0', '1', 'reduceFrac(p, 2 * p + 1)'],
      steps: ['가능성은 사건 횟수 ÷ 전체 횟수이므로 {{p}}/{{2 * p}}입니다.', '분자와 분모를 {{p}}로 나누면 1/2입니다.'],
      visual: trialsVisual('반반인 관찰 결과', [
        { label: '사건', favorable: '{{p}}', total: '{{2 * p}}' },
      ]),
    },
    {
      params: p,
      prompt: '전체 {{p + 3}}번 중 사건이 한 번도 일어나지 않았습니다. 이 관찰에서 사건의 가능성을 0, 1/2, 1 중 하나의 수로 나타내세요.',
      solver: '0',
      steps: ['사건 횟수는 0이고 전체 횟수는 {{p + 3}}입니다.', '0/{{p + 3}}=0이므로 가능성은 0입니다.'],
      visual: trialsVisual('한 번도 일어나지 않은 관찰', [
        { label: '사건', favorable: 0, total: '{{p + 3}}' },
      ]),
    },
    {
      params: p,
      prompt: `같은 조건의 시행 {{2 * p}}번 중 사건이 {{p}}번 일어났습니다. 시행 횟수를 {{4 * p}}번으로 늘리면 사건이 약 몇 번 일어날 것으로 예상하나요?`,
      solver: '2 * p',
      choices: ['2 * p', 'p', '3 * p', '4 * p'],
      steps: ['{{2 * p}}번 중 {{p}}번이므로 관찰한 가능성은 1/2입니다.', '{{4 * p}}번의 1/2은 {{2 * p}}번이므로 약 {{2 * p}}번을 예상합니다.'],
      visual: trialsVisual('절반인 관찰 자료로 결과 예상하기', [
        { label: '사건', favorable: '{{p}}', total: '{{2 * p}}' },
      ]),
    },
    {
      params: p,
      prompt: `${profile.decision} 가는 {{p + 2}}번 중 {{p}}번, 나는 {{p + 4}}번 중 {{p + 1}}번 성공했습니다. 성공 횟수가 아니라 전체에 대한 비율로 비교할 때 더 나은 방법의 번호를 1(가), 2(나) 중에서 쓰세요.`,
      solver: '1',
      steps: ['교차곱은 가가 {{p * (p + 4)}}, 나가 {{(p + 1) * (p + 2)}}입니다.', '{{p * (p + 4)}}가 {{(p + 1) * (p + 2)}}보다 크므로 가의 성공 가능성이 더 큽니다.'],
      visual: trialsVisual('전체 횟수가 다른 두 자료', [
        { label: '가', favorable: '{{p}}', total: '{{p + 2}}' },
        { label: '나', favorable: '{{p + 1}}', total: '{{p + 4}}' },
      ]),
    },
    {
      params: repeated,
      prompt: `가 방법은 {{2 * p}}번 중 {{p}}번, 나 방법은 {{2 * p}}번 중 {{p - 1}}번 성공했습니다. 같은 조건으로 각각 {{2 * p * groups}}번 시행하면 가의 예상 성공 횟수는 나보다 약 몇 번 많나요?`,
      solver: 'groups',
      choices: ['groups', 'groups + 1', 'groups + 2', 'groups + 3'],
      steps: ['한 묶음 {{2 * p}}번에서 성공 횟수 차이는 1번입니다.', '{{2 * p * groups}}번은 같은 묶음이 {{groups}}개이므로 예상 차이는 {{groups}}번입니다.'],
      visual: trialsVisual('두 방법의 예상 성공 횟수 차이', [
        { label: '가', favorable: '{{p}}', total: '{{2 * p}}' },
        { label: '나', favorable: '{{p - 1}}', total: '{{2 * p}}' },
      ]),
    },
    {
      params: p,
      prompt: '가 기록은 {{2 * p}}번 중 {{p}}번, 나 기록은 {{4 * p}}번 중 {{2 * p}}번 사건이 일어나 두 비율이 같습니다. 앞으로의 판단 근거로 더 많은 자료를 사용한 기록의 번호를 1(가), 2(나) 중에서 쓰세요.',
      solver: '2',
      steps: ['두 기록의 가능성은 모두 1/2로 같습니다.', '나 기록은 전체 {{4 * p}}번으로 가의 {{2 * p}}번보다 자료가 많아 판단 근거로 더 적절합니다.'],
      visual: trialsVisual('같은 비율과 다른 자료 크기', [
        { label: '가', favorable: '{{p}}', total: '{{2 * p}}' },
        { label: '나', favorable: '{{2 * p}}', total: '{{4 * p}}' },
      ]),
    },
    {
      params: repeated,
      prompt: `가 자료는 {{p + 2}}번 중 {{p}}번, 나 자료는 {{2 * p + 4}}번 중 {{p + 2}}번 사건이 일어났습니다. 사건 횟수만 본 학생은 나의 가능성이 더 크다고 했습니다. 같은 조건에서 각각 {{2 * (p + 2) * groups}}번 시행할 때 실제로 가능성이 더 큰 가의 예상 횟수는 나보다 약 몇 번 많나요?`,
      solver: '(p - 2) * groups',
      choices: ['(p - 2) * groups', '(p - 1) * groups', 'p * groups', '(p + 1) * groups'],
      steps: ['가의 비율은 {{p}}/{{p + 2}}, 나는 {{p + 2}}/{{2 * p + 4}}=1/2이므로 가가 더 큽니다.', '가의 예상 횟수는 {{2 * p * groups}}번, 나는 {{(p + 2) * groups}}번입니다.', '차이는 {{(p - 2) * groups}}번입니다.'],
      visual: trialsVisual('사건 횟수만 비교한 오류', [
        { label: '가', favorable: '{{p}}', total: '{{p + 2}}' },
        { label: '나', favorable: '{{p + 2}}', total: '{{2 * p + 4}}' },
      ]),
    },
    {
      params: repeated,
      prompt: `첫날에는 {{p + 2}}개 ${profile.trial} 중 {{p}}개에서, 둘째 날에는 같은 {{p + 2}}개 중 2개에서 사건이 일어났습니다. 한 날만 고르지 않고 두 날 자료를 합쳐, 다음 {{2 * (p + 2) * groups}}개에서 사건이 일어날 개수를 약 몇 개로 예상하나요?`,
      solver: '(p + 2) * groups',
      steps: ['두 날을 합치면 전체는 {{2 * p + 4}}개, 사건은 {{p + 2}}개입니다.', '합친 가능성은 {{p + 2}}/{{2 * p + 4}}=1/2입니다.', '{{2 * (p + 2) * groups}}개의 1/2은 {{(p + 2) * groups}}개입니다.'],
      visual: trialsVisual('두 날 자료를 합친 예측', [
        { label: '첫날', favorable: '{{p}}', total: '{{p + 2}}' },
        { label: '둘째 날', favorable: 2, total: '{{p + 2}}' },
      ]),
    },
  ]
}

function buildTemplates() {
  return Object.entries(setProfiles).flatMap(([setId, profile]) => (
    buildDefinitions(profile).map((definition, index) => {
      const slot = index + 1
      const type = slot % 2 === 1 ? 'choice' : 'number'
      const base = {
        id: `tmpl-possibility-${setId}-${String(slot).padStart(2, '0')}`,
        concept_id: 'possibility-001',
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
          slot <= 2
            ? '사건이 일어난 횟수를 전체 횟수와 함께 보고 말로 표현해요.'
            : slot <= 4
              ? '가능성은 사건 횟수를 전체 횟수로 나눈 수예요.'
              : slot <= 8
                ? '관찰 비율을 같은 조건의 다음 시행 횟수에 적용해요.'
                : '사건 횟수만 비교하지 말고 전체에 대한 비율과 합친 자료를 검산해요.',
          '그림의 초록 칸 수와 전체 칸 수는 관찰한 자료이며 예측 결과는 직접 계산해요.',
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
  console.log(`Wrote ${templates.length} Grade 5 possibility templates to ${outputPath}`)
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
