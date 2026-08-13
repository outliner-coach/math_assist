const fs = require('fs')
const path = require('path')
const { explicitTaskActionsFor } = require('./grade6-quality-metadata')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6fractiondiv.json')
const sets = ['A', 'B', 'C']

const setDefinitions = {
  A: [
    { family: 'a-natural-quotient-proper', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '빵 {{p}}개를 {{p + 2}}명이 똑같이 나누면 한 명이 받는 양은 빵 몇 개인가요?', solver: 'reduceFrac(p, p + 2)', steps: ['한 명의 몫은 {{p}}÷{{p + 2}}입니다.', '몫을 분수로 나타내면 {{reduceFrac(p, p + 2)}}입니다.'] },
    { family: 'a-natural-quotient-improper', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '물 {{p + 3}}L를 {{p + 1}}개의 통에 똑같이 나누면 한 통에 몇 L씩 담나요?', solver: 'reduceFrac(p + 3, p + 1)', steps: ['한 통의 양은 {{p + 3}}÷{{p + 1}}입니다.', '몫은 {{reduceFrac(p + 3, p + 1)}}L입니다.'] },
    { family: 'a-unit-fraction-divided-by-two', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '1/{{p + 1}}을 2로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(1, 2 * p + 2)', steps: ['분수를 자연수로 나눌 때 분모에 자연수를 곱할 수 있습니다.', '1/{{p + 1}}÷2={{reduceFrac(1, 2 * p + 2)}}입니다.'] },
    { family: 'a-proper-fraction-divided-by-two', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 1}}을 2로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(p, 2 * p + 2)', steps: ['{{p}}/{{p + 1}}÷2={{p}}/{{2 * p + 2}}입니다.', '약분하면 {{reduceFrac(p, 2 * p + 2)}}입니다.'] },
    { family: 'a-ribbon-equal-shares', domain: 'applying', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '리본 {{p}}/{{p + 1}}m를 {{p}}명이 똑같이 나눕니다. 한 명이 받는 리본은 몇 m인가요?', solver: 'reduceFrac(p, p * p + p)', steps: ['{{p}}/{{p + 1}}÷{{p}}를 계산합니다.', '한 명의 몫은 {{reduceFrac(p, p * p + p)}}m입니다.'] },
    { family: 'a-juice-two-bottles', domain: 'applying', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '주스 {{2 * p}}/{{2 * p + 1}}L를 두 병에 똑같이 나누어 담습니다. 한 병에 몇 L씩 담나요?', solver: 'reduceFrac(2 * p, 4 * p + 2)', steps: ['전체 양을 2로 나눕니다.', '{{2 * p}}/{{2 * p + 1}}÷2={{reduceFrac(2 * p, 4 * p + 2)}}입니다.'] },
    { family: 'a-count-unit-fraction-scoops', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 1}}L를 한 번에 1/{{p + 1}}L씩 옮기려면 모두 몇 번 옮겨야 하나요?', solver: 'reduceFrac(p * 2, 2)', steps: ['전체 양÷한 번의 양을 계산합니다.', '{{p}}/{{p + 1}}÷1/{{p + 1}}={{p}}입니다.'] },
    { family: 'a-count-double-unit-portions', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 1}}/{{p + 2}}kg의 반죽을 한 개분에 2/{{p + 2}}kg씩 쓰면 빵 몇 개분인가요?', solver: 'reduceFrac(p + 1, 2)', steps: ['반죽의 전체 양을 한 개분에 쓰는 양으로 나눕니다.', '{{p + 1}}/{{p + 2}}÷2/{{p + 2}}={{reduceFrac(p + 1, 2)}}입니다.'] },
    { family: 'a-reciprocal-error-gap', domain: 'reasoning', pattern: 'error_analysis', taskActions: ['analyze_error', 'calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 1}}÷1/2에서 나누는 수를 뒤집지 않고 곱해 {{reduceFrac(p, 2 * p + 2)}}라고 했습니다. 올바른 몫과 잘못된 몫의 차는 얼마인가요?', solver: 'reduceFrac(3 * p, 2 * p + 2)', steps: ['올바른 몫은 {{p}}/{{p + 1}}×2={{reduceFrac(2 * p, p + 1)}}입니다.', '{{reduceFrac(2 * p, p + 1)}}-{{reduceFrac(p, 2 * p + 2)}}={{reduceFrac(3 * p, 2 * p + 2)}}입니다.'] },
    { family: 'a-remaining-unit-portions', domain: 'reasoning', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 2}}/{{p + 3}}m의 끈에서 1/{{p + 3}}m를 썼습니다. 남은 끈을 1/{{p + 3}}m씩 자르면 몇 도막이 되나요?', solver: 'reduceFrac(p * p + 4 * p + 3, p + 3)', steps: ['남은 끈은 {{p + 1}}/{{p + 3}}m입니다.', '{{p + 1}}/{{p + 3}}÷1/{{p + 3}}={{p + 1}}이므로 {{p + 1}}도막입니다.'] },
  ],
  B: [
    { family: 'b-natural-sharing-proper', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '우유 {{p}}L를 {{p + 1}}개의 통에 똑같이 나누면 한 통에 몇 L씩 담나요?', solver: 'reduceFrac(p, p + 1)', steps: ['한 통의 양은 {{p}}÷{{p + 1}}입니다.', '몫은 {{reduceFrac(p, p + 1)}}L입니다.'] },
    { family: 'b-natural-sharing-improper', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '밀가루 {{p + 4}}kg을 {{p + 1}}묶음으로 똑같이 나누면 한 묶음은 몇 kg인가요?', solver: 'reduceFrac(p + 4, p + 1)', steps: ['{{p + 4}}÷{{p + 1}}을 분수로 나타냅니다.', '한 묶음은 {{reduceFrac(p + 4, p + 1)}}kg입니다.'] },
    { family: 'b-two-parts-divided-by-three', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '2/{{p + 1}}를 3으로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(2, 3 * p + 3)', steps: ['분모에 3을 곱해 2/{{3 * p + 3}}로 나타냅니다.', '약분하면 {{reduceFrac(2, 3 * p + 3)}}입니다.'] },
    { family: 'b-cancel-dividend-and-divisor', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 2}}를 {{p}}로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(p, p * p + 2 * p)', steps: ['{{p}}/{{p + 2}}÷{{p}}={{p}}/{{p * p + 2 * p}}입니다.', '약분하면 {{reduceFrac(p, p * p + 2 * p)}}입니다.'] },
    { family: 'b-cloth-three-shares', domain: 'applying', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '천 {{p + 1}}/{{p + 2}}m를 3조각으로 똑같이 자릅니다. 한 조각은 몇 m인가요?', solver: 'reduceFrac(p + 1, 3 * p + 6)', steps: ['전체 길이를 3으로 나눕니다.', '{{p + 1}}/{{p + 2}}÷3={{reduceFrac(p + 1, 3 * p + 6)}}입니다.'] },
    { family: 'b-unit-strip-count', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 2}}/{{p + 3}}m의 색 테이프를 1/{{p + 3}}m씩 자르면 몇 조각이 되나요?', solver: 'reduceFrac(p + 2, 1)', steps: ['전체 길이÷한 조각의 길이를 계산합니다.', '{{p + 2}}/{{p + 3}}÷1/{{p + 3}}={{p + 2}}입니다.'] },
    { family: 'b-double-unit-serving-count', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '{{2 * p}}/{{2 * p + 1}}L의 수프를 한 그릇에 2/{{2 * p + 1}}L씩 담으면 몇 그릇이 되나요?', solver: 'reduceFrac(p * 2, 2)', steps: ['전체 양을 한 그릇의 양으로 나눕니다.', '{{2 * p}}/{{2 * p + 1}}÷2/{{2 * p + 1}}={{p}}입니다.'] },
    { family: 'b-recover-dividend-from-quotient', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '어떤 분수를 2로 나눈 몫이 {{p}}/{{2 * p + 2}}입니다. 어떤 분수를 기약분수로 나타내세요.', solver: 'reduceFrac(p, p + 1)', steps: ['나누기 전 수는 몫에 2를 곱해 구합니다.', '{{p}}/{{2 * p + 2}}×2={{reduceFrac(p, p + 1)}}입니다.'] },
    { family: 'b-divide-by-half-comparison', domain: 'reasoning', pattern: 'compare_methods', taskActions: ['compare', 'calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 1}}을 1/2로 나눈 몫은 2로 나눈 몫보다 얼마만큼 큰가요?', solver: 'reduceFrac(3 * p, 2 * p + 2)', steps: ['1/2로 나눈 몫은 {{reduceFrac(2 * p, p + 1)}}, 2로 나눈 몫은 {{reduceFrac(p, 2 * p + 2)}}입니다.', '두 몫의 차는 {{reduceFrac(3 * p, 2 * p + 2)}}입니다.'] },
    { family: 'b-denominator-cancellation-error', domain: 'reasoning', pattern: 'error_analysis', taskActions: ['analyze_error', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 1}}/{{p + 2}}÷1/{{p + 2}}를 분모끼리 나누어 1이라고 계산했습니다. 올바른 몫과 1의 차는 얼마인가요?', solver: 'reduceFrac(p * p + 2 * p, p + 2)', steps: ['나누는 분수의 역수를 곱하면 올바른 몫은 {{p + 1}}입니다.', '{{p + 1}}-1={{p}}입니다.'] },
  ],
  C: [
    { family: 'c-natural-cake-sharing', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '케이크 {{p + 1}}개를 {{p + 3}}명이 똑같이 나누면 한 명은 케이크 몇 개를 받나요?', solver: 'reduceFrac(p + 1, p + 3)', steps: ['한 명의 몫은 {{p + 1}}÷{{p + 3}}입니다.', '분수로 나타내면 {{reduceFrac(p + 1, p + 3)}}입니다.'] },
    { family: 'c-natural-rope-sharing', domain: 'knowing', pattern: 'representation_shift', taskActions: ['interpret', 'calculate'], standard: '[6수01-10]', prompt: '줄 {{p + 5}}m를 {{p + 2}}도막으로 똑같이 자르면 한 도막은 몇 m인가요?', solver: 'reduceFrac(p + 5, p + 2)', steps: ['한 도막의 길이는 {{p + 5}}÷{{p + 2}}입니다.', '몫은 {{reduceFrac(p + 5, p + 2)}}m입니다.'] },
    { family: 'c-fraction-divided-by-four', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '{{p + 1}}/{{p + 2}}를 4로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(p + 1, 4 * p + 8)', steps: ['분모에 4를 곱합니다.', '{{p + 1}}/{{p + 2}}÷4={{reduceFrac(p + 1, 4 * p + 8)}}입니다.'] },
    { family: 'c-three-parts-divided-by-two', domain: 'knowing', pattern: 'direct', taskActions: ['calculate'], standard: '[6수01-11]', prompt: '3/{{p + 3}}을 2로 나눈 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(3, 2 * p + 6)', steps: ['3/{{p + 3}}÷2=3/{{2 * p + 6}}입니다.', '약분하면 {{reduceFrac(3, 2 * p + 6)}}입니다.'] },
    { family: 'c-lap-time', domain: 'applying', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 1}}/{{p + 2}}시간 동안 운동장을 {{p + 1}}바퀴 돌았습니다. 한 바퀴에 걸린 시간은 몇 시간인가요?', solver: 'reduceFrac(p + 1, p * p + 3 * p + 2)', steps: ['전체 시간을 바퀴 수로 나눕니다.', '{{p + 1}}/{{p + 2}}÷{{p + 1}}={{reduceFrac(p + 1, p * p + 3 * p + 2)}}시간입니다.'] },
    { family: 'c-two-unit-cookie-count', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '반죽 {{p + 3}}/{{p + 4}}kg을 한 판 분량에 2/{{p + 4}}kg씩 쓰면 쿠키 몇 판 분량인가요?', solver: 'reduceFrac(p + 3, 2)', steps: ['전체 반죽을 한 판 분량에 쓰는 양으로 나눕니다.', '{{p + 3}}/{{p + 4}}÷2/{{p + 4}}={{reduceFrac(p + 3, 2)}}입니다.'] },
    { family: 'c-use-then-share', domain: 'applying', pattern: 'multi_step', taskActions: ['model', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 2}}/{{p + 3}}L의 물에서 1/{{p + 3}}L를 썼습니다. 남은 물을 두 통에 똑같이 나누면 한 통에 몇 L씩 담나요?', solver: 'reduceFrac(p + 1, 2 * p + 6)', steps: ['남은 물은 {{p + 1}}/{{p + 3}}L입니다.', '{{p + 1}}/{{p + 3}}÷2={{reduceFrac(p + 1, 2 * p + 6)}}L입니다.'] },
    { family: 'c-find-missing-divisor', domain: 'applying', pattern: 'inverse', taskActions: ['reason', 'calculate'], standard: '[6수01-11]', prompt: '{{p + 1}}/{{p + 2}}를 어떤 분수로 나누면 {{p + 1}}이 됩니다. 어떤 분수를 기약분수로 나타내세요.', solver: 'reduceFrac(1, p + 2)', steps: ['나누는 수는 나누어지는 수÷몫으로 구합니다.', '{{p + 1}}/{{p + 2}}÷{{p + 1}}={{reduceFrac(1, p + 2)}}입니다.'] },
    { family: 'c-method-numerator-check', domain: 'reasoning', pattern: 'compare_methods', taskActions: ['compare', 'calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 2}}÷2/{{p + 2}}를 계산했습니다. 분모가 같을 때 분자끼리 나눌 수 있다는 설명을 역수를 곱하는 방법으로 확인하고, 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(p * p + 2 * p, 2 * p + 4)', steps: ['나누는 분수의 역수를 곱하면 {{p}}/{{p + 2}}×{{p + 2}}/2입니다.', '약분한 몫은 {{reduceFrac(p, 2)}}입니다.'] },
    { family: 'c-method-denominator-check', domain: 'reasoning', pattern: 'model_and_check', taskActions: ['model', 'reason', 'calculate'], standard: '[6수01-11]', prompt: '{{p}}/{{p + 1}}÷2/{{p + 1}}을 분수 막대의 묶음 수와 역수 곱셈으로 각각 확인했습니다. 두 방법의 공통된 몫을 기약분수로 나타내세요.', solver: 'reduceFrac(p * p + p, 2 * p + 2)', steps: ['{{p}}/{{p + 1}}×{{p + 1}}/2로 바꿉니다.', '약분한 몫은 {{reduceFrac(p, 2)}}입니다.'] },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => {
  const difficulty = index < 4 ? 1 : index < 8 ? 2 : 3
  return {
    id: `tmpl-g6fractiondiv-${setId}-${String(index + 1).padStart(2, '0')}`,
    concept_id: 'g6fractiondiv-001',
    type: 'number',
    difficulty,
    set_id: setId,
    taskActions: explicitTaskActionsFor(definition),
    problem_family: definition.family,
    blueprint: {
      problemFamily: definition.family,
      cognitiveDomain: definition.domain,
      reasoningPattern: definition.pattern,
      primaryStandard: definition.standard,
      connectedStandards: definition.standard === '[6수01-11]' ? ['[6수01-10]'] : undefined,
      representations: ['text', 'equation'],
      contextType: index >= 8 ? 'puzzle' : 'real_world',
      estimatedSteps: index >= 8 ? 3 : 2,
      readingLoad: index >= 8 ? 'medium' : 'low',
    },
    param_schema: {
      p: {
        min: setId === 'A' ? 2 : setId === 'B' ? 3 : 4,
        max: setId === 'A' ? 7 : setId === 'B' ? 8 : 9,
      },
    },
    prompt_template: definition.prompt,
    solver_rule: definition.solver,
    solution_steps_template: definition.steps,
    hint_steps_template: [
      definition.standard === '[6수01-10]'
        ? '나누어지는 자연수를 분자, 나누는 자연수를 분모로 놓아 보세요.'
        : '나누는 분수를 뒤집어 곱셈으로 바꾸어 보세요.',
      index >= 8
        ? '서로 다른 계산의 뜻과 결과를 같은 기약분수 기준으로 비교해요.'
        : '계산한 뒤 약분하고, 몫의 크기가 상황에 알맞은지 확인해요.',
    ],
  }
}))

for (const template of templates) {
  if (template.blueprint.connectedStandards === undefined) {
    delete template.blueprint.connectedStandards
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
console.log(`Wrote ${templates.length} Grade 6 fraction-division templates to ${outputPath}`)
