const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6proportion.json')
const sets = ['A', 'B', 'C']

const setDefinitions = {
  A: [
    { family: 'a-double-second-ratio-term', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '{{p}}:2=□:6입니다. □에 알맞은 수를 구하세요.', solver: '3 * p', steps: ['뒤의 항 2가 6으로 3배 되었습니다.', '앞의 항도 3배 하므로 □={{3 * p}}입니다.'] },
    { family: 'a-scale-denominator-term', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '3:{{p}}=12:□입니다. □에 알맞은 수를 구하세요.', solver: '4 * p', steps: ['앞의 항 3이 12로 4배 되었습니다.', '뒤의 항도 4배 하므로 □={{4 * p}}입니다.'] },
    { family: 'a-cross-product-missing-term', domain: 'knowing', pattern: 'inverse', standard: '[6수02-04]', prompt: '{{p}}:4=□:8입니다. 비례식의 성질을 이용해 □를 구하세요.', solver: '2 * p', steps: ['외항의 곱과 내항의 곱이 같으므로 {{p}}×8=4×□입니다.', '□={{2 * p}}입니다.'] },
    { family: 'a-two-to-three-smaller-share', domain: 'knowing', pattern: 'direct', standard: '[6수02-05]', prompt: '전체 {{5 * p}}개를 2:3으로 비례배분할 때 작은 몫은 몇 개인가요?', solver: '2 * p', steps: ['비의 합은 2+3=5입니다.', '작은 몫은 {{5 * p}}×2/5={{2 * p}}개입니다.'] },
    { family: 'a-notebook-price-scaling', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '같은 공책 3권이 {{3 * p}}백 원입니다. 공책 5권은 몇 백 원인가요?', solver: '5 * p', steps: ['권 수와 값의 비례식은 3:{{3 * p}}=5:□입니다.', '한 권은 {{p}}백 원이므로 5권은 {{5 * p}}백 원입니다.'] },
    { family: 'a-map-distance-scaling', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '지도에서 2cm인 거리가 실제 {{p}}km입니다. 같은 축척에서 6cm는 실제 몇 km인가요?', solver: '3 * p', steps: ['2cm가 6cm로 3배 되었습니다.', '실제 거리도 3배이므로 {{3 * p}}km입니다.'] },
    { family: 'a-three-to-four-mixture', domain: 'applying', pattern: 'multi_step', standard: '[6수02-05]', prompt: '주스 원액과 물을 3:4로 섞어 모두 {{7 * p}}mL를 만들었습니다. 물은 몇 mL인가요?', solver: '4 * p', steps: ['비의 합은 7이고 물은 4부분입니다.', '{{7 * p}}×4/7={{4 * p}}mL입니다.'] },
    { family: 'a-one-to-three-larger-share', domain: 'applying', pattern: 'inverse', standard: '[6수02-05]', prompt: '상금 {{4 * p}}만 원을 기여도 1:3으로 나눕니다. 큰 몫은 몇 만 원인가요?', solver: '3 * p', steps: ['비의 합은 4이고 큰 몫은 3부분입니다.', '{{4 * p}}×3/4={{3 * p}}만 원입니다.'] },
    { family: 'a-additive-proportion-error-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-04]', min: 4, prompt: '{{p}}:3=□:6에서 비의 뒷항에 3을 더했으므로 □={{p + 3}}이라고 했습니다. 배수 규칙으로 검산하고 올바른 값과 잘못된 값의 차를 구하세요.', solver: 'p - 3', steps: ['3이 6으로 2배 되었으므로 □={{2 * p}}입니다.', '{{2 * p}}-{{p + 3}}={{p - 3}}입니다.'] },
    { family: 'a-missing-ratio-part-shortage', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-05]', prompt: '{{5 * p}}개를 2:3으로 나누면서 두 몫을 모두 {{2 * p}}개로 정했습니다. 비례배분 규칙으로 계산해 전체에서 부족한 수를 구하세요.', solver: 'p', steps: ['올바른 두 몫은 {{2 * p}}개와 {{3 * p}}개입니다.', '잘못 나눈 합 {{4 * p}}개는 전체보다 {{p}}개 부족합니다.'] },
  ],
  B: [
    { family: 'b-double-ratio-term', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '{{p}}:5=□:10입니다. □를 구하세요.', solver: '2 * p', steps: ['5가 10으로 2배 되었습니다.', '앞의 항도 2배 하므로 □={{2 * p}}입니다.'] },
    { family: 'b-triple-denominator-term', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '4:{{p}}=12:□입니다. □를 구하세요.', solver: '3 * p', steps: ['4가 12로 3배 되었습니다.', '뒤의 항도 3배 하므로 □={{3 * p}}입니다.'] },
    { family: 'b-cross-product-triple-term', domain: 'knowing', pattern: 'inverse', standard: '[6수02-04]', prompt: '{{p}}:3=□:9입니다. 비례식의 성질로 □를 구하세요.', solver: '3 * p', steps: ['{{p}}×9=3×□입니다.', '□={{3 * p}}입니다.'] },
    { family: 'b-three-to-four-smaller-share', domain: 'knowing', pattern: 'direct', standard: '[6수02-05]', prompt: '전체 {{7 * p}}개를 3:4로 비례배분할 때 작은 몫은 몇 개인가요?', solver: '3 * p', steps: ['비의 합은 7입니다.', '작은 몫은 {{7 * p}}×3/7={{3 * p}}개입니다.'] },
    { family: 'b-recipe-serving-scaling', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '2인분에 쌀 {{p}}컵이 필요합니다. 같은 비율로 6인분에는 몇 컵이 필요한가요?', solver: '3 * p', steps: ['2인분이 6인분으로 3배 되었습니다.', '쌀도 3배이므로 {{3 * p}}컵입니다.'] },
    { family: 'b-constant-speed-scaling', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '같은 속력으로 3시간에 {{3 * p}}km를 갑니다. 5시간에는 몇 km를 가나요?', solver: '5 * p', steps: ['한 시간에 {{p}}km를 갑니다.', '5시간에는 {{5 * p}}km를 갑니다.'] },
    { family: 'b-four-to-five-ribbon-share', domain: 'applying', pattern: 'multi_step', standard: '[6수02-05]', prompt: '리본 {{9 * p}}cm를 빨강과 파랑에 4:5로 나눕니다. 빨강 리본은 몇 cm인가요?', solver: '4 * p', steps: ['비의 합은 9이고 빨강은 4부분입니다.', '{{9 * p}}×4/9={{4 * p}}cm입니다.'] },
    { family: 'b-one-to-two-larger-vote-share', domain: 'applying', pattern: 'inverse', standard: '[6수02-05]', prompt: '표 {{6 * p}}표를 두 안에 1:2로 비례배분합니다. 큰 몫은 몇 표인가요?', solver: '4 * p', steps: ['비의 합은 3이고 큰 몫은 2부분입니다.', '{{6 * p}}×2/3={{4 * p}}표입니다.'] },
    { family: 'b-add-eight-error-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-04]', min: 5, prompt: '{{p}}:4=□:12에서 4에 8을 더했으므로 □={{p + 8}}이라고 했습니다. 배수 규칙으로 검산하고 올바른 값과 잘못된 값의 차를 구하세요.', solver: '2 * p - 8', steps: ['4가 12로 3배 되었으므로 □={{3 * p}}입니다.', '{{3 * p}}-{{p + 8}}={{2 * p - 8}}입니다.'] },
    { family: 'b-equal-share-instead-of-three-four', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-05]', prompt: '{{7 * p}}개를 3:4로 나누면서 두 몫을 모두 {{3 * p}}개로 정했습니다. 비례배분 규칙으로 계산해 부족한 수를 구하세요.', solver: 'p', steps: ['올바른 두 몫은 {{3 * p}}개와 {{4 * p}}개입니다.', '잘못 나눈 합 {{6 * p}}개는 전체보다 {{p}}개 부족합니다.'] },
  ],
  C: [
    { family: 'c-triple-ratio-term', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '{{p}}:4=□:12입니다. □를 구하세요.', solver: '3 * p', steps: ['4가 12로 3배 되었습니다.', '앞의 항도 3배 하므로 □={{3 * p}}입니다.'] },
    { family: 'c-triple-denominator-from-five', domain: 'knowing', pattern: 'direct', standard: '[6수02-04]', prompt: '5:{{p}}=15:□입니다. □를 구하세요.', solver: '3 * p', steps: ['5가 15로 3배 되었습니다.', '뒤의 항도 3배 하므로 □={{3 * p}}입니다.'] },
    { family: 'c-cross-product-eighteen-term', domain: 'knowing', pattern: 'inverse', standard: '[6수02-04]', prompt: '{{p}}:6=□:18입니다. 비례식의 성질로 □를 구하세요.', solver: '3 * p', steps: ['{{p}}×18=6×□입니다.', '□={{3 * p}}입니다.'] },
    { family: 'c-four-to-five-larger-share', domain: 'knowing', pattern: 'direct', standard: '[6수02-05]', prompt: '전체 {{9 * p}}개를 4:5로 비례배분할 때 큰 몫은 몇 개인가요?', solver: '5 * p', steps: ['비의 합은 9입니다.', '큰 몫은 {{9 * p}}×5/9={{5 * p}}개입니다.'] },
    { family: 'c-scale-twelve-centimeters', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '도면에서 3cm가 실제 {{p}}m입니다. 같은 축척에서 12cm는 실제 몇 m인가요?', solver: '4 * p', steps: ['3cm가 12cm로 4배 되었습니다.', '실제 길이도 4배이므로 {{4 * p}}m입니다.'] },
    { family: 'c-ten-serving-recipe', domain: 'applying', pattern: 'multi_step', standard: '[6수02-04]', prompt: '4인분에 재료 {{2 * p}}g이 필요합니다. 같은 비율로 10인분에는 몇 g이 필요한가요?', solver: '5 * p', steps: ['4:{{2 * p}}=10:□로 비례식을 세웁니다.', '□={{5 * p}}g입니다.'] },
    { family: 'c-five-to-six-smaller-share', domain: 'applying', pattern: 'multi_step', standard: '[6수02-05]', prompt: '구슬 {{11 * p}}개를 두 모둠에 5:6으로 나눕니다. 작은 몫은 몇 개인가요?', solver: '5 * p', steps: ['비의 합은 11이고 작은 몫은 5부분입니다.', '{{11 * p}}×5/11={{5 * p}}개입니다.'] },
    { family: 'c-three-to-five-larger-share', domain: 'applying', pattern: 'inverse', standard: '[6수02-05]', prompt: '예산 {{8 * p}}만 원을 두 활동에 3:5로 나눕니다. 큰 몫은 몇 만 원인가요?', solver: '5 * p', steps: ['비의 합은 8이고 큰 몫은 5부분입니다.', '{{8 * p}}×5/8={{5 * p}}만 원입니다.'] },
    { family: 'c-add-ten-error-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-04]', min: 6, prompt: '{{p}}:5=□:15에서 5에 10을 더했으므로 □={{p + 10}}이라고 했습니다. 배수 규칙으로 검산하고 올바른 값과 잘못된 값의 차를 구하세요.', solver: '2 * p - 10', steps: ['5가 15로 3배 되었으므로 □={{3 * p}}입니다.', '{{3 * p}}-{{p + 10}}={{2 * p - 10}}입니다.'] },
    { family: 'c-equal-share-instead-of-four-five', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-05]', prompt: '{{9 * p}}개를 4:5로 나누면서 두 몫을 모두 {{4 * p}}개로 정했습니다. 비례배분 규칙으로 계산해 부족한 수를 구하세요.', solver: 'p', steps: ['올바른 두 몫은 {{4 * p}}개와 {{5 * p}}개입니다.', '잘못 나눈 합 {{8 * p}}개는 전체보다 {{p}}개 부족합니다.'] },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => ({
  id: `tmpl-g6proportion-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6proportion-001',
  type: 'number',
  difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
  set_id: setId,
  problem_family: definition.family,
  blueprint: {
    problemFamily: definition.family,
    cognitiveDomain: definition.domain,
    reasoningPattern: definition.pattern,
    primaryStandard: definition.standard,
    connectedStandards: definition.standard === '[6수02-05]' ? ['[6수02-04]'] : ['[6수02-03]'],
    representations: ['text', 'equation'],
    contextType: index < 4 ? 'pure_math' : index < 8 ? 'real_world' : 'puzzle',
    estimatedSteps: index >= 8 ? 3 : 2,
    readingLoad: index >= 8 ? 'medium' : 'low',
  },
  param_schema: {
    p: {
      min: definition.min ?? (setId === 'A' ? 2 : setId === 'B' ? 3 : 4),
      max: setId === 'A' ? 7 : setId === 'B' ? 8 : 9,
    },
  },
  prompt_template: definition.prompt,
  solver_rule: definition.solver,
  solution_steps_template: definition.steps,
  hint_steps_template: [
    definition.standard === '[6수02-04]'
      ? '두 비에서 같은 위치의 항이 몇 배가 되었는지 또는 외항과 내항의 곱을 확인해 보세요.'
      : '전체를 비의 합으로 나눈 한 부분의 크기부터 구해 보세요.',
    index >= 8
      ? '올바른 값과 제시된 값을 각각 구한 뒤 차나 부족한 양을 계산해요.'
      : '구한 값으로 두 비의 곱 관계나 나눈 몫의 합을 다시 확인해요.',
  ],
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 proportion templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
