const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'numberrange.json'
)

const familyBySlot = [
  'numberrange-lower-inclusive-first',
  'numberrange-lower-exclusive-first',
  'numberrange-upper-inclusive-last',
  'numberrange-upper-exclusive-last',
  'numberrange-inclusive-count',
  'numberrange-exclusive-count',
  'numberrange-mixed-bound-count',
  'numberrange-context-qualified-count',
  'numberrange-endpoint-confusion-gap',
  'numberrange-two-rule-gap',
]

function rangeVisual({
  caption,
  start,
  end,
  lower,
  lowerInclusive,
  upper,
  upperInclusive,
}) {
  return {
    type: 'number_range',
    semantics: 'quantitative',
    props: {
      caption,
      start,
      end,
      ...(lower === undefined ? {} : { lower, lowerInclusive }),
      ...(upper === undefined ? {} : { upper, upperInclusive }),
    },
  }
}

const setProfiles = {
  A: {
    a: { min: 12, max: 30 },
    span: { min: 4, max: 8 },
    groups: { min: 2, max: 4 },
    lowerInclusive: '행사 참가 나이가',
    lowerExclusive: '수영장 깊이 기준이',
    upperInclusive: '도서 대출 권수가',
    upperExclusive: '보관함 번호가',
    bounded: '체험관 입장 번호',
    context: '공연장 좌석 번호',
    group: '학급',
  },
  B: {
    a: { min: 25, max: 50 },
    span: { min: 5, max: 9 },
    groups: { min: 2, max: 5 },
    lowerInclusive: '안전 검사 무게가',
    lowerExclusive: '기온 경보 기준이',
    upperInclusive: '엘리베이터 적재 수가',
    upperExclusive: '주차 시간 기준이',
    bounded: '대여 자전거 번호',
    context: '과학관 관찰 기록 번호',
    group: '모둠',
  },
  C: {
    a: { min: 40, max: 70 },
    span: { min: 4, max: 10 },
    groups: { min: 3, max: 6 },
    lowerInclusive: '걷기 목표 거리가',
    lowerExclusive: '훈련 통과 기록이',
    upperInclusive: '자료 제출 번호가',
    upperExclusive: '창고 사용량 기준이',
    bounded: '숲길 표지 번호',
    context: '환경 조사 지점 번호',
    group: '조사팀',
  },
}

function buildDefinitions(profile) {
  const baseParams = { a: profile.a }
  const intervalParams = { a: profile.a, span: profile.span }
  const reasoningParams = { a: profile.a, span: profile.span, groups: profile.groups }

  return [
    {
      params: baseParams,
      prompt: `${profile.lowerInclusive} {{a}} 이상입니다. 조건을 만족하는 자연수 중 가장 작은 수는 무엇인가요?`,
      solver: 'a',
      steps: ['이상은 경계값 {{a}}를 포함합니다.', '가장 작은 자연수는 {{a}}입니다.'],
      visual: rangeVisual({
        caption: '{{a}} 이상',
        start: '{{a - 2}}',
        end: '{{a + 6}}',
        lower: '{{a}}',
        lowerInclusive: true,
      }),
    },
    {
      params: baseParams,
      prompt: `${profile.lowerExclusive} {{a}} 초과입니다. 조건을 만족하는 자연수 중 가장 작은 수는 무엇인가요?`,
      solver: 'a + 1',
      steps: ['초과는 경계값 {{a}}를 포함하지 않습니다.', '{{a}} 다음 자연수인 {{a + 1}}부터 조건을 만족합니다.'],
      visual: rangeVisual({
        caption: '{{a}} 초과',
        start: '{{a - 2}}',
        end: '{{a + 6}}',
        lower: '{{a}}',
        lowerInclusive: false,
      }),
    },
    {
      params: baseParams,
      prompt: `${profile.upperInclusive} {{a}} 이하입니다. 조건을 만족하는 자연수 중 가장 큰 수는 무엇인가요?`,
      solver: 'a',
      steps: ['이하는 경계값 {{a}}를 포함합니다.', '가장 큰 자연수는 {{a}}입니다.'],
      visual: rangeVisual({
        caption: '{{a}} 이하',
        start: '{{a - 6}}',
        end: '{{a + 2}}',
        upper: '{{a}}',
        upperInclusive: true,
      }),
    },
    {
      params: baseParams,
      prompt: `${profile.upperExclusive} {{a}} 미만입니다. 조건을 만족하는 자연수 중 가장 큰 수는 무엇인가요?`,
      solver: 'a - 1',
      steps: ['미만은 경계값 {{a}}를 포함하지 않습니다.', '{{a}} 바로 전 자연수인 {{a - 1}}이 가장 큽니다.'],
      visual: rangeVisual({
        caption: '{{a}} 미만',
        start: '{{a - 6}}',
        end: '{{a + 2}}',
        upper: '{{a}}',
        upperInclusive: false,
      }),
    },
    {
      params: intervalParams,
      prompt: `자연수 {{a}} 이상 {{a + span}} 이하인 ${profile.bounded}는 모두 몇 개인가요?`,
      solver: 'span + 1',
      steps: ['이상과 이하는 두 경계값을 모두 포함합니다.', '{{a}}부터 {{a + span}}까지 세면 {{span + 1}}개입니다.'],
      visual: rangeVisual({
        caption: '{{a}} 이상 {{a + span}} 이하',
        start: '{{a - 2}}',
        end: '{{a + span + 2}}',
        lower: '{{a}}',
        lowerInclusive: true,
        upper: '{{a + span}}',
        upperInclusive: true,
      }),
    },
    {
      params: intervalParams,
      prompt: `자연수 {{a}} 초과 {{a + span}} 미만인 ${profile.bounded}는 모두 몇 개인가요?`,
      solver: 'span - 1',
      steps: ['초과와 미만은 두 경계값을 모두 제외합니다.', '{{a + 1}}부터 {{a + span - 1}}까지 세면 {{span - 1}}개입니다.'],
      visual: rangeVisual({
        caption: '{{a}} 초과 {{a + span}} 미만',
        start: '{{a - 2}}',
        end: '{{a + span + 2}}',
        lower: '{{a}}',
        lowerInclusive: false,
        upper: '{{a + span}}',
        upperInclusive: false,
      }),
    },
    {
      params: intervalParams,
      prompt: `자연수 {{a}} 이상 {{a + span}} 미만인 ${profile.bounded}는 모두 몇 개인가요?`,
      solver: 'span',
      steps: ['{{a}}는 포함하고 {{a + span}}은 포함하지 않습니다.', '{{a}}부터 {{a + span - 1}}까지 세면 {{span}}개입니다.'],
      visual: rangeVisual({
        caption: '{{a}} 이상 {{a + span}} 미만',
        start: '{{a - 2}}',
        end: '{{a + span + 2}}',
        lower: '{{a}}',
        lowerInclusive: true,
        upper: '{{a + span}}',
        upperInclusive: false,
      }),
    },
    {
      params: intervalParams,
      prompt: `${profile.context} {{a}}번부터 {{a + span + 2}}번까지 중 {{a + 1}} 초과 {{a + span}} 이하만 사용할 수 있습니다. 사용할 수 있는 번호는 몇 개인가요?`,
      solver: 'span - 1',
      steps: ['{{a + 1}}은 제외하고 {{a + span}}은 포함합니다.', '{{a + 2}}부터 {{a + span}}까지 모두 {{span - 1}}개입니다.'],
      visual: rangeVisual({
        caption: '{{a + 1}} 초과 {{a + span}} 이하',
        start: '{{a}}',
        end: '{{a + span + 2}}',
        lower: '{{a + 1}}',
        lowerInclusive: false,
        upper: '{{a + span}}',
        upperInclusive: true,
      }),
    },
    {
      params: reasoningParams,
      prompt: `${profile.group} {{groups}}곳이 각각 {{a}} 초과 {{a + span}} 이하인 번호를 셉니다. 민수는 {{a}}도 포함해 셌습니다. ${profile.group} 전체에서 민수가 실제보다 더 센 번호는 모두 몇 개인가요?`,
      solver: 'groups',
      steps: ['초과이므로 각 범위에서 경계값 {{a}}는 제외해야 합니다.', `각 ${profile.group}에서 1개씩 더 셌으므로 {{groups}}곳에서는 {{groups}}개를 더 셌습니다.`],
      visual: rangeVisual({
        caption: '{{a}} 초과 {{a + span}} 이하',
        start: '{{a - 2}}',
        end: '{{a + span + 2}}',
        lower: '{{a}}',
        lowerInclusive: false,
        upper: '{{a + span}}',
        upperInclusive: true,
      }),
    },
    {
      params: reasoningParams,
      prompt: `${profile.group} {{groups}}곳에서 첫 규칙은 {{a}} 이상 {{a + span}} 이하, 둘째 규칙은 {{a}} 초과 {{a + span}} 미만입니다. 첫 규칙으로 센 수가 둘째보다 전체에서 몇 개 더 많나요?`,
      solver: '2 * groups',
      steps: ['한 곳에서 첫 규칙은 두 경계를 포함하고 둘째 규칙은 두 경계를 제외하므로 2개 차이입니다.', '{{groups}}곳의 차이는 2×{{groups}}={{2 * groups}}개입니다.'],
      visual: rangeVisual({
        caption: '첫 규칙: {{a}} 이상 {{a + span}} 이하',
        start: '{{a - 2}}',
        end: '{{a + span + 2}}',
        lower: '{{a}}',
        lowerInclusive: true,
        upper: '{{a + span}}',
        upperInclusive: true,
      }),
    },
  ]
}

const templates = Object.entries(setProfiles).flatMap(([setId, profile]) =>
  buildDefinitions(profile).map((definition, index) => {
    const slot = index + 1
    const base = {
      id: `tmpl-numberrange-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'numberrange-001',
      type: 'number',
      difficulty: slot <= 4 ? 1 : slot <= 8 ? 2 : 3,
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
          ? '경계값을 포함하는 말인지 먼저 확인해요.'
          : slot <= 8
            ? '양쪽 경계값의 포함 여부를 각각 표시해요.'
            : '잘못 포함하거나 빠뜨린 경계값이 몇 개인지 한 범위부터 비교해요.',
        slot <= 4
          ? '이상·이하는 ●, 초과·미만은 ○로 나타내요.'
          : slot <= 8
            ? '포함되는 첫 자연수와 마지막 자연수를 쓴 뒤 빠짐없이 세어요.'
            : '한 범위의 차이를 구한 뒤 모둠이나 학급 수만큼 누적해요.',
      ],
      visual_template: definition.visual,
    }
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 number-range templates to ${outputPath}`)
}

if (require.main === module) {
  writeTemplates()
}

module.exports = {
  familyBySlot,
  setProfiles,
  templates,
  writeTemplates,
}
