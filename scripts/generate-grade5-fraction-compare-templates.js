const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'fraccompare.json'
)

const familyBySlot = [
  'fraccompare-same-numerator-larger',
  'fraccompare-unit-fraction-smaller',
  'fraccompare-near-half-larger',
  'fraccompare-common-denominator-gap',
  'fraccompare-context-larger-share',
  'fraccompare-context-share-gap',
  'fraccompare-context-nearer-whole',
  'fraccompare-half-threshold-gap',
  'fraccompare-denominator-only-error',
  'fraccompare-cross-product-direction-error',
]

const setProfiles = {
  A: {
    d: { min: 5, max: 6 },
    groups: { min: 2, max: 3 },
    shareContext: '두 학생이 읽은 책의 비율',
    sameNumeratorContext: '두 화단에 심은 꽃의 비율',
    nearWholeContext: '두 모둠이 끝낸 준비 작업의 비율',
  },
  B: {
    d: { min: 7, max: 8 },
    groups: { min: 3, max: 4 },
    shareContext: '두 선수가 완주한 코스의 비율',
    sameNumeratorContext: '두 물통에서 사용한 물의 비율',
    nearWholeContext: '두 팀이 검사한 제품의 비율',
  },
  C: {
    d: { min: 9, max: 10 },
    groups: { min: 4, max: 5 },
    shareContext: '두 조사팀이 확인한 구역의 비율',
    sameNumeratorContext: '두 공정에서 처리한 재료의 비율',
    nearWholeContext: '두 연구팀이 분석한 자료의 비율',
  },
}

function comparisonVisual(caption, leftNumerator, leftDenominator, rightNumerator, rightDenominator) {
  return {
    type: 'fraction_comparison',
    semantics: 'quantitative',
    props: {
      caption,
      left: {
        label: '가',
        numerator: leftNumerator,
        denominator: leftDenominator,
      },
      right: {
        label: '나',
        numerator: rightNumerator,
        denominator: rightDenominator,
      },
    },
  }
}

function buildDefinitions(profile) {
  const params = { d: profile.d }
  const reasoningParams = { d: profile.d, groups: profile.groups }
  return [
    {
      params,
      prompt: '가 분수는 {{d - 2}}/{{d}}, 나 분수는 {{d - 2}}/{{d + 1}}입니다. 두 분수를 비교했을 때 더 큰 분수의 분모를 구하세요.',
      solver: 'd',
      choices: ['d', 'd + 1', 'd + 2', 'd + 3'],
      steps: ['두 분수의 분자 {{d - 2}}는 같습니다.', '분자가 같을 때 분모가 작은 가 분수가 더 크므로 답은 {{d}}입니다.'],
      visual: comparisonVisual('분자가 같은 두 분수', '{{d - 2}}', '{{d}}', '{{d - 2}}', '{{d + 1}}'),
    },
    {
      params,
      prompt: '가 분수는 1/{{d}}, 나 분수는 1/{{d + 2}}입니다. 더 작은 분수의 분모를 구하세요.',
      solver: 'd + 2',
      steps: ['단위분수는 분모가 클수록 한 조각이 작습니다.', '나 분수 1/{{d + 2}}가 더 작으므로 분모는 {{d + 2}}입니다.'],
      visual: comparisonVisual('단위분수 두 개', 1, '{{d}}', 1, '{{d + 2}}'),
    },
    {
      params,
      prompt: '가 분수는 {{d}}/{{2 * d + 1}}, 나 분수는 {{d + 1}}/{{2 * d + 3}}입니다. 통분하여 비교했을 때 더 큰 분수의 분자를 구하세요.',
      solver: 'd + 1',
      choices: ['d + 1', 'd', 'd + 2', 'd + 3'],
      steps: ['교차곱은 가가 {{d * (2 * d + 3)}}, 나가 {{(d + 1) * (2 * d + 1)}}입니다.', '나의 교차곱이 1 크므로 나 분수가 더 크고 그 분자는 {{d + 1}}입니다.'],
      visual: comparisonVisual('1/2에 가까운 두 분수', '{{d}}', '{{2 * d + 1}}', '{{d + 1}}', '{{2 * d + 3}}'),
    },
    {
      params,
      prompt: '가 분수는 {{d - 1}}/{{d}}, 나 분수는 {{d}}/{{d + 1}}입니다. 공통 분모 {{d * (d + 1)}}로 통분한 두 새 분자의 차를 구하세요.',
      solver: '1',
      steps: ['새 분자는 가가 {{(d - 1) * (d + 1)}}, 나가 {{d * d}}입니다.', '나의 새 분자가 1 크므로 두 새 분자의 차는 1입니다.'],
      visual: comparisonVisual('1에 가까운 두 분수', '{{d - 1}}', '{{d}}', '{{d}}', '{{d + 1}}'),
    },
    {
      params,
      prompt: `${profile.shareContext}이 각각 가 {{d}}/{{d + 2}}, 나 {{d + 1}}/{{d + 3}}입니다. 더 큰 비율을 기약분수로 쓰세요.`,
      solver: 'reduceFrac(d + 1, d + 3)',
      choices: [
        'reduceFrac(d + 1, d + 3)',
        'reduceFracOff(d + 1, d + 3, 1)',
        'reduceFracOff(d + 1, d + 3, 2)',
        'reduceFracOff(d + 1, d + 3, 3)',
      ],
      steps: ['교차곱은 가가 {{d * (d + 3)}}, 나가 {{(d + 1) * (d + 2)}}입니다.', '나의 교차곱이 2 크므로 더 큰 비율은 {{reduceFrac(d + 1, d + 3)}}입니다.'],
      visual: comparisonVisual(profile.shareContext, '{{d}}', '{{d + 2}}', '{{d + 1}}', '{{d + 3}}'),
    },
    {
      params,
      prompt: `${profile.sameNumeratorContext}이 가 {{d - 2}}/{{d}}, 나 {{d - 2}}/{{d + 1}}입니다. 더 큰 비율은 더 작은 비율보다 얼마 큰가요?`,
      solver: 'fracSub(d - 2, d, d - 2, d + 1)',
      steps: ['분자가 같으므로 분모가 작은 가의 비율이 더 큽니다.', '{{d - 2}}/{{d}} - {{d - 2}}/{{d + 1}} = {{fracSub(d - 2, d, d - 2, d + 1)}}입니다.'],
      visual: comparisonVisual(profile.sameNumeratorContext, '{{d - 2}}', '{{d}}', '{{d - 2}}', '{{d + 1}}'),
    },
    {
      params,
      prompt: `${profile.nearWholeContext}이 가 {{d - 1}}/{{d}}, 나 {{d + 1}}/{{d + 2}}입니다. 더 큰 비율을 기약분수로 쓰세요.`,
      solver: 'reduceFrac(d + 1, d + 2)',
      choices: [
        'reduceFrac(d + 1, d + 2)',
        'reduceFrac(d - 1, d)',
        'reduceFracOff(d + 1, d + 2, 1)',
        'reduceFracOff(d + 1, d + 2, 2)',
      ],
      steps: ['전체 1까지 남은 비율은 가가 1/{{d}}, 나가 1/{{d + 2}}입니다.', '나가 전체 1에 더 가까우므로 더 큰 비율은 {{reduceFrac(d + 1, d + 2)}}입니다.'],
      visual: comparisonVisual(profile.nearWholeContext, '{{d - 1}}', '{{d}}', '{{d + 1}}', '{{d + 2}}'),
    },
    {
      params,
      prompt: '가 분수는 {{d + 1}}/{{2 * d + 1}}, 나 분수는 1/2입니다. 1/2보다 큰 가 분수는 나 분수보다 얼마 큰가요?',
      solver: 'fracSub(d + 1, 2 * d + 1, 1, 2)',
      steps: ['교차곱을 비교하면 {{2 * (d + 1)}}가 {{2 * d + 1}}보다 1 커서 가 분수가 더 큽니다.', '두 분수의 차는 {{fracSub(d + 1, 2 * d + 1, 1, 2)}}입니다.'],
      visual: comparisonVisual('1/2을 기준으로 비교', '{{d + 1}}', '{{2 * d + 1}}', 1, 2),
    },
    {
      params: reasoningParams,
      prompt: '가 분수는 2/{{d}}, 나 분수는 3/{{d + 2}}입니다. 민준이는 분모만 보고 더 큰 가를 골랐습니다. 같은 일을 {{groups}}번 반복할 때, 통분하여 구한 올바른 나의 합은 민준이가 고른 가의 합보다 얼마 큰가요?',
      solver: 'reduceFrac(d * groups - 4 * groups, d * d + 2 * d)',
      choices: [
        'reduceFrac(d * groups - 4 * groups, d * d + 2 * d)',
        'reduceFracOff(d * groups - 4 * groups, d * d + 2 * d, 1)',
        'reduceFracOff(d * groups - 4 * groups, d * d + 2 * d, 2)',
        'reduceFracOff(d * groups - 4 * groups, d * d + 2 * d, 3)',
      ],
      steps: ['교차곱은 가가 {{2 * (d + 2)}}, 나가 {{3 * d}}이므로 나가 더 큽니다.', '한 번의 차는 {{fracSub(3, d + 2, 2, d)}}입니다.', '{{groups}}번의 누적 차는 {{reduceFrac(d * groups - 4 * groups, d * d + 2 * d)}}입니다.'],
      visual: comparisonVisual('분모만 보고 판단한 경우', 2, '{{d}}', 3, '{{d + 2}}'),
    },
    {
      params: reasoningParams,
      prompt: '가 분수는 {{d - 2}}/{{d}}, 나 분수는 {{d - 1}}/{{d + 2}}입니다. 서윤이는 분자만 보고 더 큰 나를 골랐습니다. 같은 양을 {{groups}}번 담을 때, 통분하여 구한 올바른 가의 합은 나의 합보다 얼마 큰가요?',
      solver: 'reduceFrac(d * groups - 4 * groups, d * d + 2 * d)',
      steps: ['교차곱은 가가 {{(d - 2) * (d + 2)}}, 나가 {{(d - 1) * d}}이므로 가가 더 큽니다.', '한 번의 차이는 {{fracSub(d - 2, d, d - 1, d + 2)}}입니다.', '{{groups}}번의 누적 차이는 {{reduceFrac(d * groups - 4 * groups, d * d + 2 * d)}}입니다.'],
      visual: comparisonVisual('분자만 보고 판단한 경우', '{{d - 2}}', '{{d}}', '{{d - 1}}', '{{d + 2}}'),
    },
  ]
}

function buildTemplates() {
  return Object.entries(setProfiles).flatMap(([setId, profile]) => (
    buildDefinitions(profile).map((definition, index) => {
      const slot = index + 1
      const type = slot % 2 === 1 ? 'choice' : 'number'
      const base = {
        id: `tmpl-fraccompare-${setId}-${String(slot).padStart(2, '0')}`,
        concept_id: 'fraccompare-001',
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
            ? '분자가 같으면 조각 크기를, 다르면 통분이나 교차곱을 이용해요.'
            : slot <= 8
              ? '두 비율을 같은 분모로 바꾸고 실제 상황에 맞게 큰 쪽을 골라요.'
              : '분자나 분모 하나만 보는 판단을 교차곱으로 검증해요.',
          '그림의 두 막대는 전체 길이가 같으므로 색칠된 길이도 함께 비교해요.',
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
  console.log(`Wrote ${templates.length} Grade 5 fraction comparison templates to ${outputPath}`)
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
