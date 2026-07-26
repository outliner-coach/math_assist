const fs = require('fs')
const path = require('path')
const { explicitTaskActionsFor } = require('./grade6-quality-metadata')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6fractiondecimal.json')
const sets = ['A', 'B', 'C']

const setDefinitions = {
  A: [
    { family: 'a-tenths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/10을 소수로 나타내세요.', solver: 'dec1(p)', steps: ['분모가 10인 분수는 소수 첫째 자리까지 나타낼 수 있습니다.', '{{p}}/10={{dec1(p)}}입니다.'] },
    { family: 'a-fifths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/5를 소수로 나타내세요.', solver: 'dec1(2 * p)', steps: ['분모와 분자에 2를 곱해 분모를 10으로 만듭니다.', '{{p}}/5={{2 * p}}/10={{dec1(2 * p)}}입니다.'] },
    { family: 'a-tenths-decimal-to-fraction', domain: 'knowing', pattern: 'representation_shift', prompt: '{{dec1(p)}}를 기약분수로 나타내세요.', solver: 'reduceFrac(p, 10)', steps: ['소수 첫째 자리 수이므로 분모를 10으로 놓습니다.', '{{dec1(p)}}={{p}}/10={{reduceFrac(p, 10)}}입니다.'] },
    { family: 'a-quarters-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/4를 소수로 나타내세요.', solver: 'p / 4', steps: ['분자를 분모로 나누어 소수로 나타냅니다.', '{{p}}÷4={{p / 4}}입니다.'] },
    { family: 'a-milk-sum-fraction-decimal', domain: 'applying', pattern: 'multi_step', prompt: '우유 {{p}}/10L와 0.3L를 한 병에 담았습니다. 모두 몇 L인지 소수로 나타내세요.', solver: 'dec1(p + 3)', steps: ['0.3=3/10이므로 같은 단위의 수로 바꿉니다.', '{{p}}/10+3/10={{p + 3}}/10={{dec1(p + 3)}}L입니다.'] },
    { family: 'a-compare-fifths-and-tenths', domain: 'applying', pattern: 'compare_methods', prompt: '{{p}}/5는 {{p}}/10보다 얼마만큼 큰지 소수로 나타내세요.', solver: 'dec1(p)', steps: ['{{p}}/5={{2 * p}}/10으로 바꿉니다.', '{{2 * p}}/10-{{p}}/10={{p}}/10={{dec1(p)}}입니다.'] },
    { family: 'a-twentieths-as-hundredths', domain: 'applying', pattern: 'representation_shift', prompt: '산책로 전체의 {{p}}/20을 걸었습니다. 걸은 부분을 분모가 100인 분수로 나타낼 때 분자는 얼마인가요?', solver: 'p * 5', steps: ['20×5=100이므로 분자와 분모에 5를 곱합니다.', '{{p}}/20={{p * 5}}/100이므로 분자는 {{p * 5}}입니다.'] },
    { family: 'a-remaining-from-one', domain: 'applying', pattern: 'inverse', prompt: '색종이 한 장의 {{p}}/10을 썼습니다. 남은 부분을 기약분수로 나타내세요.', solver: 'reduceFrac(10 - p, 10)', steps: ['한 장 전체는 10/10입니다.', '10/10-{{p}}/10={{reduceFrac(10 - p, 10)}}입니다.'] },
    { family: 'a-fifths-tenths-equivalence-error', domain: 'reasoning', pattern: 'error_analysis', prompt: '{{p}}/5와 {{p}}/10이 분자가 같아서 같은 수라고 했습니다. 두 수의 실제 차를 기약분수로 나타내세요.', solver: 'reduceFrac(p, 10)', steps: ['{{p}}/5={{2 * p}}/10이므로 두 수는 같지 않습니다.', '{{2 * p}}/10-{{p}}/10={{reduceFrac(p, 10)}}입니다.'] },
    { family: 'a-midpoint-between-tenths', domain: 'reasoning', pattern: 'model_and_check', prompt: '수직선에서 {{p}}/10과 {{p + 2}}/10의 한가운데에 있는 수를 소수로 나타내세요.', solver: 'dec1(p + 1)', steps: ['두 수의 분자 {{p}}와 {{p + 2}}의 중간은 {{p + 1}}입니다.', '{{p + 1}}/10={{dec1(p + 1)}}입니다.'] },
  ],
  B: [
    { family: 'b-twentieths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/20을 소수로 나타내세요.', solver: 'p / 20', steps: ['분자를 분모로 나누어 소수로 나타냅니다.', '{{p}}÷20={{p / 20}}입니다.'] },
    { family: 'b-twenty-fifths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/25를 소수로 나타내세요.', solver: 'p / 25', steps: ['분모와 분자에 4를 곱해 분모를 100으로 만듭니다.', '{{p}}/25={{4 * p}}/100={{p / 25}}입니다.'] },
    { family: 'b-decimal-to-reduced-tenths', domain: 'knowing', pattern: 'representation_shift', prompt: '{{dec1(p)}}를 기약분수로 나타내세요.', solver: 'reduceFrac(p, 10)', steps: ['{{dec1(p)}}={{p}}/10으로 나타냅니다.', '약분하면 {{reduceFrac(p, 10)}}입니다.'] },
    { family: 'b-equivalent-numerator-over-twenty', domain: 'knowing', pattern: 'representation_shift', prompt: '{{dec1(p)}}와 같은 분모가 20인 분수의 분자는 얼마인가요?', solver: '2 * p', steps: ['{{dec1(p)}}={{p}}/10입니다.', '분모와 분자에 2를 곱하면 {{2 * p}}/20이므로 분자는 {{2 * p}}입니다.'] },
    { family: 'b-ribbon-sum-fifth-and-decimal', domain: 'applying', pattern: 'multi_step', prompt: '리본 {{p}}/5m와 0.2m를 이었습니다. 전체 길이를 소수로 나타내세요.', solver: 'dec1(2 * p + 2)', steps: ['{{p}}/5={{2 * p}}/10이고 0.2=2/10입니다.', '전체는 {{2 * p + 2}}/10={{dec1(2 * p + 2)}}m입니다.'] },
    { family: 'b-trip-remaining-from-three', domain: 'applying', pattern: 'inverse', prompt: '3km 중 {{p}}/4km를 걸었습니다. 남은 거리를 기약분수로 나타내세요.', solver: 'reduceFrac(12 - p, 4)', steps: ['3=12/4로 바꿉니다.', '12/4-{{p}}/4={{reduceFrac(12 - p, 4)}}km입니다.'] },
    { family: 'b-difference-counted-in-tenths', domain: 'applying', pattern: 'compare_methods', prompt: '{{p}}/5와 {{p}}/10의 차는 1/10이 몇 개인 크기인가요?', solver: 'p', steps: ['{{p}}/5={{2 * p}}/10으로 바꿉니다.', '차는 {{p}}/10이므로 1/10이 {{p}}개입니다.'] },
    { family: 'b-missing-numerator-over-twenty', domain: 'applying', pattern: 'inverse', prompt: '{{p}}/10과 크기가 같은 □/20에서 □에 알맞은 수를 구하세요.', solver: '2 * p', steps: ['분모 10에 2를 곱하면 20입니다.', '분자에도 2를 곱하므로 □={{2 * p}}입니다.'] },
    { family: 'b-denominator-size-comparison-error', domain: 'reasoning', pattern: 'error_analysis', prompt: '{{p}}/4가 {{p}}/10보다 분모가 커서 더 작다고 했습니다. 두 수의 실제 차를 기약분수로 나타내세요.', solver: 'reduceFrac(3 * p, 20)', steps: ['공통 분모 20으로 바꾸면 {{p}}/4={{5 * p}}/20, {{p}}/10={{2 * p}}/20입니다.', '차는 {{3 * p}}/20={{reduceFrac(3 * p, 20)}}입니다.'] },
    { family: 'b-hundredths-gap-between-representations', domain: 'reasoning', pattern: 'model_and_check', prompt: '{{p}}/20에 1/100을 몇 개 더하면 {{p}}/10이 되나요?', solver: '5 * p', steps: ['{{p}}/20={{5 * p}}/100이고 {{p}}/10={{10 * p}}/100입니다.', '차는 {{5 * p}}/100이므로 1/100이 {{5 * p}}개입니다.'] },
  ],
  C: [
    { family: 'c-fiftieths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/50을 소수로 나타내세요.', solver: 'p / 50', steps: ['분모와 분자에 2를 곱해 분모를 100으로 만듭니다.', '{{p}}/50={{2 * p}}/100={{p / 50}}입니다.'] },
    { family: 'c-hundredths-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/100을 소수로 나타내세요.', solver: 'p / 100', steps: ['분모가 100인 분수는 소수 둘째 자리까지 나타냅니다.', '{{p}}/100={{p / 100}}입니다.'] },
    { family: 'c-decimal-to-reduced-fraction', domain: 'knowing', pattern: 'representation_shift', prompt: '{{dec1(p)}}를 기약분수로 나타내세요.', solver: 'reduceFrac(p, 10)', steps: ['소수 첫째 자리 수를 분모가 10인 분수로 나타냅니다.', '{{dec1(p)}}={{p}}/10={{reduceFrac(p, 10)}}입니다.'] },
    { family: 'c-halves-fraction-to-decimal', domain: 'knowing', pattern: 'representation_shift', prompt: '{{p}}/2를 소수로 나타내세요.', solver: 'p / 2', steps: ['분자를 2로 나누어 소수로 나타냅니다.', '{{p}}÷2={{p / 2}}입니다.'] },
    { family: 'c-recipe-quarter-plus-half', domain: 'applying', pattern: 'multi_step', prompt: '반죽에 밀가루 {{p}}/4컵과 0.5컵을 넣었습니다. 전체 양을 소수로 나타내세요.', solver: 'p / 4 + 0.5', steps: ['0.5=2/4이므로 전체는 {{p + 2}}/4컵입니다.', '{{p + 2}}÷4={{p / 4 + 0.5}}컵입니다.'] },
    { family: 'c-nearby-fifth-and-tenth', domain: 'applying', pattern: 'compare_methods', prompt: '{{p}}/5와 {{2 * p + 1}}/10 중 큰 수는 작은 수보다 얼마만큼 큰가요? 소수로 나타내세요.', solver: '0.1', steps: ['{{p}}/5={{2 * p}}/10으로 바꿉니다.', '{{2 * p + 1}}/10-{{2 * p}}/10=1/10=0.1입니다.'] },
    { family: 'c-target-half-after-tenths', domain: 'applying', pattern: 'inverse', prompt: '목표량 {{p}}/2L 중 {{p}}/10L를 채웠습니다. 더 채워야 할 양을 기약분수로 나타내세요.', solver: 'reduceFrac(2 * p, 5)', steps: ['{{p}}/2={{5 * p}}/10으로 바꿉니다.', '{{5 * p}}/10-{{p}}/10={{4 * p}}/10={{reduceFrac(2 * p, 5)}}L입니다.'] },
    { family: 'c-equivalent-numerator-over-hundred', domain: 'applying', pattern: 'representation_shift', prompt: '{{dec1(p)}}와 같은 분모가 100인 분수의 분자는 얼마인가요?', solver: '10 * p', steps: ['{{dec1(p)}}={{p}}/10입니다.', '분모와 분자에 10을 곱하면 {{10 * p}}/100이므로 분자는 {{10 * p}}입니다.'] },
    { family: 'c-same-numerator-denominator-fallacy', domain: 'reasoning', pattern: 'error_analysis', prompt: '{{p}}/10과 {{p}}/5는 분자가 같아서 같은 수라고 했습니다. 두 수의 차를 기약분수로 나타내세요.', solver: 'reduceFrac(p, 10)', steps: ['{{p}}/5={{2 * p}}/10으로 나타냅니다.', '{{2 * p}}/10-{{p}}/10={{reduceFrac(p, 10)}}입니다.'] },
    { family: 'c-quarter-fifth-comparison-gap', domain: 'reasoning', pattern: 'model_and_check', min: 5, prompt: '{{p}}/4와 {{p + 1}}/5 중 큰 수는 작은 수보다 얼마만큼 큰가요? 기약분수로 나타내세요.', solver: 'reduceFrac(p - 4, 20)', steps: ['공통 분모 20으로 바꾸면 {{p}}/4={{5 * p}}/20, {{p + 1}}/5={{4 * p + 4}}/20입니다.', '차는 {{p - 4}}/20={{reduceFrac(p - 4, 20)}}입니다.'] },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => ({
  id: `tmpl-g6fractiondecimal-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6fractiondecimal-001',
  type: 'number',
  difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
  set_id: setId,
  taskActions: explicitTaskActionsFor(definition),
  problem_family: definition.family,
  blueprint: {
    problemFamily: definition.family,
    cognitiveDomain: definition.domain,
    reasoningPattern: definition.pattern,
    primaryStandard: '[6수01-12]',
    representations: ['text', 'equation'],
    contextType: index >= 8 ? 'puzzle' : 'real_world',
    estimatedSteps: index >= 8 ? 3 : 2,
    readingLoad: index >= 8 ? 'medium' : 'low',
  },
  param_schema: {
    p: {
      min: definition.min ?? (setId === 'A' ? 2 : setId === 'B' ? 3 : 4),
      max: definition.max ?? (setId === 'A' ? 7 : setId === 'B' ? 8 : 9),
    },
  },
  prompt_template: definition.prompt,
  solver_rule: definition.solver,
  solution_steps_template: definition.steps,
  hint_steps_template: [
    '분수와 소수 중 계산하기 쉬운 한 가지 표현으로 통일해 보세요.',
    index >= 8
      ? '두 표현을 같은 분모 또는 같은 소수 자리로 바꾼 뒤 설명과 계산을 함께 확인해요.'
      : '분모가 10이나 100이 되도록 바꾸거나 분자를 분모로 정확히 나누어 보세요.',
  ],
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 fraction-decimal templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
