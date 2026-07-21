const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6ratio.json')
const sets = ['A', 'B', 'C']

function ratioTable(caption, rows) {
  return {
    type: 'ratio_table',
    semantics: 'quantitative',
    props: {
      caption,
      columns: ['모둠', '해낸 수', '전체 수'],
      rows,
    },
  }
}

const setDefinitions = {
  A: [
    { family: 'a-ratio-baseline', domain: 'knowing', pattern: 'direct', standard: '[6수02-02]', prompt: '빨간 구슬 {{p}}개와 파란 구슬 {{p * 2}}개의 비를 {{p}}:{{p * 2}}로 나타냈습니다. 기준량은 몇 개인가요?', solver: 'p * 2', steps: ['비에서 뒤의 양이 기준량입니다.', '기준량은 {{p * 2}}개입니다.'] },
    { family: 'a-ratio-comparison-quantity', domain: 'knowing', pattern: 'direct', standard: '[6수02-02]', prompt: '연필 {{p}}자루와 색연필 {{p * 3}}자루의 비를 {{p}}:{{p * 3}}으로 나타냈습니다. 비교하는 양은 몇 자루인가요?', solver: 'p', steps: ['비에서 앞의 양이 비교하는 양입니다.', '비교하는 양은 {{p}}자루입니다.'] },
    { family: 'a-rate-quarter-fraction', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 4}}칸 중 {{p}}칸을 색칠했습니다. 비율을 기약분수로 나타낼 때 분모는 얼마인가요?', solver: 'reducedDen(p, p * 4)', steps: ['{{p}} ÷ {{p * 4}} = {{reduceFrac(p, p * 4)}}입니다.', '기약분수의 분모는 4입니다.'] },
    { family: 'a-rate-quarter-percent', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 4}}칸 중 {{p}}칸을 색칠했습니다. 백분율로 나타낸 수는 얼마인가요? (단위 %는 쓰지 않아요.)', solver: '25', steps: ['비율은 {{p}} ÷ {{p * 4}} = 0.25입니다.', '0.25는 25%입니다.'] },
    { family: 'a-reading-decimal-rate', domain: 'applying', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '읽기로 한 {{p * 5}}쪽 중 {{p * 2}}쪽을 읽었습니다. 읽은 비율을 소수로 나타내세요.', solver: '0.4', steps: ['비율은 {{p * 2}} ÷ {{p * 5}}입니다.', '읽은 비율은 0.4입니다.'] },
    { family: 'a-vote-percent-rate', domain: 'applying', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 5}}표 중 {{p * 3}}표를 받았습니다. 득표율을 백분율로 나타낸 수는 얼마인가요? (단위 %는 쓰지 않아요.)', solver: '60', steps: ['{{p * 3}} ÷ {{p * 5}} = 0.6입니다.', '0.6은 60%입니다.'] },
    { family: 'a-participation-decimal', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '학생 {{p * 2}}명 중 {{p}}명이 행사에 참여했습니다. 참여한 비율을 소수로 나타내세요.', solver: '0.5', steps: ['{{p}} ÷ {{p * 2}}를 계산합니다.', '참여한 비율은 0.5입니다.'] },
    { family: 'a-quarter-quantity', domain: 'applying', pattern: 'inverse', standard: '[6수02-03]', prompt: '스티커가 {{p * 4}}개 있습니다. 그중 25%는 몇 개인가요?', solver: 'p', steps: ['25%는 전체의 1/4입니다.', '{{p * 4}} ÷ 4 = {{p}}입니다.'] },
    { family: 'a-quarter-error-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-03]', prompt: '전체 {{p * 4}}개 중 {{p}}개의 비율을 20%라고 말했습니다. 올바른 백분율과 몇 %p 차이 나나요?', solver: 'p * 100 / (p * 4) - 20', steps: ['올바른 비율은 25%입니다.', '25 - 20 = 5%p입니다.'] },
    { family: 'a-table-rate-comparison', domain: 'reasoning', pattern: 'compare_methods', standard: '[6수02-03]', representations: ['table', 'equation'], prompt: '표의 기록을 비율로 비교하면 나 모둠이 가 모둠보다 몇 %p 높은가요?', solver: 'p * 3 * 100 / (p * 5) - p * 100 / (p * 2)', steps: ['가 모둠은 50%, 나 모둠은 60%입니다.', '60 - 50 = 10%p입니다.'], visual: ratioTable('공 던지기 성공 기록', [{ label: '가', values: ['{{p}}', '{{p * 2}}'] }, { label: '나', values: ['{{p * 3}}', '{{p * 5}}'] }]) },
  ],
  B: [
    { family: 'b-write-ratio-first-term', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-02]', prompt: '큰 단추 {{p}}개와 작은 단추 {{p * 3}}개의 비를 큰 단추 수부터 나타내려고 합니다. 비의 앞 항은 얼마인가요?', solver: 'p', steps: ['큰 단추 수를 먼저 씁니다.', '비의 앞 항은 {{p}}입니다.'] },
    { family: 'b-write-ratio-second-term', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-02]', prompt: '축구공 {{p}}개와 농구공 {{p * 2}}개의 비를 축구공 수부터 나타내려고 합니다. 비의 뒤 항은 얼마인가요?', solver: 'p * 2', steps: ['농구공 수를 뒤에 씁니다.', '비의 뒤 항은 {{p * 2}}입니다.'] },
    { family: 'b-three-quarter-numerator', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 4}}명 중 {{p * 3}}명이 찬성했습니다. 비율을 기약분수로 나타낼 때 분자는 얼마인가요?', solver: '3', steps: ['{{p * 3}} ÷ {{p * 4}} = 3/4입니다.', '기약분수의 분자는 3입니다.'] },
    { family: 'b-two-fifths-percent', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 5}}개 중 {{p * 2}}개를 골랐습니다. 백분율로 나타낸 수는 얼마인가요? (단위 %는 쓰지 않아요.)', solver: '40', steps: ['{{p * 2}} ÷ {{p * 5}} = 0.4입니다.', '0.4는 40%입니다.'] },
    { family: 'b-reduce-ratio-denominator', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '전체 {{p * 6}}장 중 {{p * 2}}장의 비율을 기약분수로 나타낼 때 분모는 얼마인가요?', solver: '3', steps: ['{{p * 2}}/{{p * 6}}을 약분하면 1/3입니다.', '분모는 3입니다.'] },
    { family: 'b-remaining-percent', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '물감 {{p * 5}}mL 중 {{p * 2}}mL를 썼습니다. 남은 양은 처음 양의 몇 %인가요? (단위 %는 쓰지 않아요.)', solver: '60', steps: ['남은 양은 {{p * 3}}mL입니다.', '{{p * 3}} ÷ {{p * 5}} = 60%입니다.'] },
    { family: 'b-find-forty-percent-part', domain: 'applying', pattern: 'inverse', standard: '[6수02-03]', prompt: '책이 {{p * 5}}권 있습니다. 그중 40%는 몇 권인가요?', solver: 'p * 2', steps: ['40%는 0.4입니다.', '{{p * 5}} × 0.4 = {{p * 2}}입니다.'] },
    { family: 'b-find-whole-from-half', domain: 'applying', pattern: 'inverse', standard: '[6수02-03]', prompt: '{{p * 3}}명이 전체 학생의 50%입니다. 전체 학생은 몇 명인가요?', solver: 'p * 6', steps: ['50%는 전체의 절반입니다.', '{{p * 3}} × 2 = {{p * 6}}입니다.'] },
    { family: 'b-percent-claim-check', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-03]', prompt: '전체 {{p * 5}}문제 중 {{p * 2}}문제를 맞히고 50%라고 말했습니다. 올바른 백분율과 몇 %p 차이 나나요?', solver: '50 - p * 2 * 100 / (p * 5)', steps: ['올바른 비율은 40%입니다.', '50 - 40 = 10%p입니다.'] },
    { family: 'b-table-efficiency-comparison', domain: 'reasoning', pattern: 'compare_methods', standard: '[6수02-03]', representations: ['table', 'equation'], prompt: '표의 기록을 비율로 비교하면 나 모둠이 가 모둠보다 몇 %p 높은가요?', solver: 'p * 2 * 100 / (p * 4) - p * 2 * 100 / (p * 5)', steps: ['가 모둠은 40%, 나 모둠은 50%입니다.', '50 - 40 = 10%p입니다.'], visual: ratioTable('재활용 분류 기록', [{ label: '가', values: ['{{p * 2}}', '{{p * 5}}'] }, { label: '나', values: ['{{p * 2}}', '{{p * 4}}'] }]) },
  ],
  C: [
    { family: 'c-identify-comparison-quantity', domain: 'knowing', pattern: 'direct', standard: '[6수02-02]', prompt: '노란 깃발 {{p}}개와 흰 깃발 {{p * 4}}개의 비를 {{p}}:{{p * 4}}로 나타냈습니다. 비교하는 양은 몇 개인가요?', solver: 'p', steps: ['비에서 앞의 양이 비교하는 양입니다.', '비교하는 양은 {{p}}개입니다.'] },
    { family: 'c-identify-baseline-quantity', domain: 'knowing', pattern: 'direct', standard: '[6수02-02]', prompt: '완료한 과제 {{p}}개와 전체 과제 {{p * 4}}개의 비를 {{p}}:{{p * 4}}로 나타냈습니다. 기준량은 몇 개인가요?', solver: 'p * 4', steps: ['전체 과제 수가 기준량입니다.', '기준량은 {{p * 4}}개입니다.'] },
    { family: 'c-three-fifths-denominator', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 5}}개 중 {{p * 3}}개의 비율을 기약분수로 나타낼 때 분모는 얼마인가요?', solver: '5', steps: ['{{p * 3}} ÷ {{p * 5}} = 3/5입니다.', '기약분수의 분모는 5입니다.'] },
    { family: 'c-three-quarters-percent', domain: 'knowing', pattern: 'representation_shift', standard: '[6수02-03]', prompt: '전체 {{p * 4}}번 중 {{p * 3}}번 성공했습니다. 백분율로 나타낸 수는 얼마인가요? (단위 %는 쓰지 않아요.)', solver: '75', steps: ['{{p * 3}} ÷ {{p * 4}} = 0.75입니다.', '0.75는 75%입니다.'] },
    { family: 'c-combine-two-groups-rate', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '가 모둠은 {{p * 2}}명 중 {{p}}명, 나 모둠은 {{p * 4}}명 중 {{p * 2}}명이 참여했습니다. 두 모둠을 합친 참여 비율을 소수로 나타내세요.', solver: '0.5', steps: ['참여한 사람은 {{p * 3}}명, 전체는 {{p * 6}}명입니다.', '{{p * 3}} ÷ {{p * 6}} = 0.5입니다.'] },
    { family: 'c-unused-percent', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '찰흙 {{p * 5}}g 중 {{p}}g을 썼습니다. 남은 양은 처음 양의 몇 %인가요? (단위 %는 쓰지 않아요.)', solver: '80', steps: ['남은 양은 {{p * 4}}g입니다.', '{{p * 4}} ÷ {{p * 5}} = 80%입니다.'] },
    { family: 'c-find-whole-from-twenty-percent', domain: 'applying', pattern: 'inverse', standard: '[6수02-03]', prompt: '{{p}}개가 전체의 20%입니다. 전체는 몇 개인가요?', solver: 'p * 5', steps: ['20%는 전체의 1/5입니다.', '{{p}} × 5 = {{p * 5}}입니다.'] },
    { family: 'c-two-stage-half-rate', domain: 'applying', pattern: 'multi_step', standard: '[6수02-03]', prompt: '전체 {{p * 8}}명 중 절반이 행사에 참여했고, 참여한 사람의 절반이 발표했습니다. 발표한 사람은 몇 명인가요?', solver: 'p * 2', steps: ['참여한 사람은 {{p * 4}}명입니다.', '그 절반인 {{p * 2}}명이 발표했습니다.'] },
    { family: 'c-rate-overestimate-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수02-03]', prompt: '전체 {{p * 5}}개 중 {{p * 2}}개의 비율을 50%라고 어림했습니다. 정확한 백분율과 몇 %p 차이 나나요?', solver: '50 - p * 2 * 100 / (p * 5)', steps: ['정확한 비율은 40%입니다.', '50 - 40 = 10%p입니다.'] },
    { family: 'c-table-rate-ordering', domain: 'reasoning', pattern: 'compare_methods', standard: '[6수02-03]', representations: ['table', 'equation'], prompt: '표의 기록을 비율로 비교하면 가 모둠이 나 모둠보다 몇 %p 높은가요?', solver: 'p * 3 * 100 / (p * 5) - p * 2 * 100 / (p * 4)', steps: ['가 모둠은 60%, 나 모둠은 50%입니다.', '60 - 50 = 10%p입니다.'], visual: ratioTable('정답 확인 기록', [{ label: '가', values: ['{{p * 3}}', '{{p * 5}}'] }, { label: '나', values: ['{{p * 2}}', '{{p * 4}}'] }]) },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => {
  const difficulty = index < 4 ? 1 : index < 8 ? 2 : 3
  return {
    id: `tmpl-g6ratio-${setId}-${String(index + 1).padStart(2, '0')}`,
    concept_id: 'g6ratio-001',
    type: 'number',
    difficulty,
    set_id: setId,
    problem_family: definition.family,
    blueprint: {
      problemFamily: definition.family,
      cognitiveDomain: definition.domain,
      reasoningPattern: definition.pattern,
      primaryStandard: definition.standard,
      connectedStandards: definition.standard === '[6수02-03]' ? ['[6수02-02]'] : undefined,
      representations: definition.representations ?? ['text', 'equation'],
      contextType: index >= 8 ? 'puzzle' : 'real_world',
      estimatedSteps: index >= 8 ? 3 : 2,
      readingLoad: index >= 8 ? 'medium' : 'low',
      visualSemantics: definition.visual ? 'quantitative' : undefined,
    },
    param_schema: {
      p: { min: setId === 'A' ? 2 : setId === 'B' ? 3 : 4, max: setId === 'A' ? 7 : setId === 'B' ? 8 : 9 },
    },
    prompt_template: definition.prompt,
    solver_rule: definition.solver,
    solution_steps_template: definition.steps,
    hint_steps_template: [
      index < 4 ? '비에서 비교하는 양과 기준량의 순서를 먼저 확인해요.' : '비교하는 양 ÷ 기준량으로 비율을 구해요.',
      index >= 8 ? '두 계산이나 설명이 같은 기준을 쓰는지 비교해요.' : '분수, 소수, 백분율 중 문제에서 요구한 표현으로 바꿔요.',
    ],
    visual_template: definition.visual,
  }
}))

for (const template of templates) {
  if (template.blueprint.connectedStandards === undefined) {
    delete template.blueprint.connectedStandards
  }
  if (template.blueprint.visualSemantics === undefined) delete template.blueprint.visualSemantics
  if (template.visual_template === undefined) delete template.visual_template
}

fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
console.log(`Wrote ${templates.length} Grade 6 ratio templates to ${outputPath}`)
