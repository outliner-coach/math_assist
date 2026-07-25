import type { Grade4AnswerType } from './grade4-answer-normalizers'

export type Grade4Semester = '4-1' | '4-2'
export type Grade4CognitiveDomain = 'knowing' | 'applying' | 'reasoning'
export type Grade4Representation = 'place-value-table' | 'number-cards' | 'number-line' | 'context' | 'division-model'
export type Grade4VisualModel = Grade4Representation
export type Grade4SupportTool = 'none' | 'grid' | 'ruler' | 'protractor'

export interface Grade4Unit {
  id: string
  semester: Grade4Semester
  order: number
  title: string
  subtitle: string
  learnerGoal: string
  curriculumCodes: string[]
  prerequisiteCodes: string[]
  contentReleaseId: string
  releaseStatus: 'released'
}

export interface Grade4MissionTemplate {
  id: string
  unitId: string
  curriculumCode: string
  cognitiveDomain: Grade4CognitiveDomain
  problemFamily: string
  representation: Grade4Representation
  answerType: Grade4AnswerType
  supportTool: Grade4SupportTool
  skillTag: string
  learnerGoal: string
  promptTemplate: string
  hintSteps: string[]
  build: (variant: number, choiceSeed: number) => {
    prompt: string
    correctAnswer: string
    choices?: string[]
    solutionSteps: string[]
    visualModel: Grade4VisualModel
    visualConfig: Record<string, string | number | boolean>
  }
}

export interface Grade4Mission extends Omit<Grade4MissionTemplate, 'build' | 'promptTemplate'> {
  prompt: string
  correctAnswer: string
  choices?: string[]
  solutionSteps: string[]
  visualModel: Grade4VisualModel
  visualConfig: Record<string, string | number | boolean>
  variantKey: string
}

export interface Grade4ValidationResult {
  errors: string[]
  warnings: string[]
  summary: {
    unitCount: number
    templateCount: number
    knowingCount: number
    applyingCount: number
    reasoningCount: number
    reasoningFamilyCount: number
    representationCount: number
  }
}

interface CurriculumAllocationLike {
  standardCode: string
  assignedGrade: number
  unitId: string
  semester: string
  reviewStatus?: string
  coverageStatus?: string
  existingContentRefs?: string[]
}

interface CurriculumLedgerLike {
  allocations?: CurriculumAllocationLike[]
}

export const GRADE4_CONTENT_RELEASE_ID = 'grade4-bridge-big-numbers-v1'
export const GRADE4_ACTIVITY_ITEM_COUNT = 3
export const SAFE_GRADE4_UNIT_ID = 'unit-4-1-large-numbers'
export const GRADE4_DIVISION_UNIT_ID = 'unit-4-1-multiplication-division'

export const grade4Units: Grade4Unit[] = [
  {
    id: SAFE_GRADE4_UNIT_ID,
    semester: '4-1',
    order: 1,
    title: '큰 수',
    subtitle: '십만과 백만 자리의 수를 읽고, 자릿값과 크기를 연결해요.',
    learnerGoal: '큰 수의 자릿값을 설명하고 수의 크기를 근거와 함께 비교해요.',
    curriculumCodes: ['[4수01-01]', '[4수01-02]'],
    prerequisiteCodes: [],
    contentReleaseId: GRADE4_CONTENT_RELEASE_ID,
    releaseStatus: 'released',
  },
  {
    id: GRADE4_DIVISION_UNIT_ID,
    semester: '4-1',
    order: 2,
    title: '두 자리 수로 나누기',
    subtitle: '몫과 나머지의 뜻을 연결하고 실제 상황에 맞게 나눗셈을 사용해요.',
    learnerGoal: '두 자리 수로 나눈 몫과 나머지를 구하고 계산이 맞는지 설명해요.',
    curriculumCodes: ['[4수01-07]'],
    prerequisiteCodes: ['[4수01-06]'],
    contentReleaseId: 'grade4-bridge-two-digit-division-v1',
    releaseStatus: 'released',
  },
]

export function grade4ContentReleaseIdForUnit(unitId: string): string {
  return grade4Units.find((unit) => unit.id === unitId)?.contentReleaseId
    ?? grade4Units[0].contentReleaseId
}

function rotateChoices(values: string[], seed: number): string[] {
  const offset = ((seed % values.length) + values.length) % values.length
  return [...values.slice(offset), ...values.slice(0, offset)]
}

function formatted(value: number): string {
  return value.toLocaleString('ko-KR')
}

function template(value: Grade4MissionTemplate): Grade4MissionTemplate {
  return value
}

const commonPlaceHints = ['가장 왼쪽 자리부터 이름을 붙여요.', '같은 자리끼리 맞춘 뒤 필요한 자리만 확인해요.']

export const grade4MissionTemplates: Grade4MissionTemplate[] = [
  template({
    id: 'g4-big-01', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-01]', cognitiveDomain: 'knowing',
    problemFamily: 'place-value-value', representation: 'place-value-table', answerType: 'choice', supportTool: 'none', skillTag: '자릿값',
    learnerGoal: '십만 단위 수에서 만의 자리 숫자가 나타내는 값을 찾아요.',
    promptTemplate: '수의 만의 자리 숫자가 나타내는 값은 얼마일까요?', hintSteps: commonPlaceHints,
    build: (v, seed) => {
      const number = 300_000 + v * 10_000 + 8_421
      const answer = String(v * 10_000)
      return {
        prompt: `${formatted(number)}에서 만의 자리 숫자가 나타내는 값은 얼마일까요?`,
        correctAnswer: answer,
        choices: rotateChoices([answer, String(v * 1_000), String(v * 100_000), String(v)], seed),
        solutionSteps: [`${formatted(number)}의 만의 자리 숫자는 ${v}예요.`, `${v}만은 ${formatted(v * 10_000)}이므로 답은 ${formatted(v * 10_000)}이에요.`],
        visualModel: 'place-value-table', visualConfig: { number, highlightPlace: '만' },
      }
    },
  }),
  template({
    id: 'g4-big-02', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-01]', cognitiveDomain: 'knowing',
    problemFamily: 'place-value-compose', representation: 'place-value-table', answerType: 'integer', supportTool: 'none', skillTag: '수 읽고 쓰기',
    learnerGoal: '자리별 수를 하나의 큰 수로 써요.',
    promptTemplate: '십만, 만, 천, 십, 일의 수를 모아 하나의 수로 쓰세요.', hintSteps: commonPlaceHints,
    build: (v) => {
      const number = 200_000 + v * 10_000 + 3_056
      return {
        prompt: `십만이 2, 만이 ${v}, 천이 3, 십이 5, 일이 6인 수를 숫자로 쓰세요.`,
        correctAnswer: String(number),
        solutionSteps: ['자리 이름에 맞춰 2, 만의 자리 숫자, 3, 0, 5, 6을 차례로 놓아요.', `만의 자리 숫자 ${v}를 넣으면 ${formatted(number)}이에요.`],
        visualModel: 'place-value-table', visualConfig: { hundredThousands: 2, tenThousands: v, thousands: 3, hundreds: 0, tens: 5, ones: 6, hideCompositeUntilReveal: true },
      }
    },
  }),
  template({
    id: 'g4-big-03', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-01]', cognitiveDomain: 'knowing',
    problemFamily: 'place-value-name', representation: 'place-value-table', answerType: 'choice', supportTool: 'none', skillTag: '자릿값',
    learnerGoal: '천의 자리 숫자가 나타내는 값을 찾아요.',
    promptTemplate: '수에서 천의 자리 숫자가 나타내는 값을 고르세요.', hintSteps: commonPlaceHints,
    build: (v, seed) => {
      const number = 400_000 + v * 10_000 + 7_000 + v * 100 + 23
      return {
        prompt: `${formatted(number)}에서 천의 자리 숫자가 나타내는 값은 얼마일까요?`,
        correctAnswer: '7000', choices: rotateChoices(['7', '70', '700', '7000'], seed),
        solutionSteps: ['오른쪽부터 일, 십, 백, 천의 자리를 찾아요.', '천의 자리 숫자는 7이고 나타내는 값은 7,000이에요.'],
        visualModel: 'place-value-table', visualConfig: { number, highlightPlace: '천' },
      }
    },
  }),
  template({
    id: 'g4-big-04', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'knowing',
    problemFamily: 'direct-comparison', representation: 'number-cards', answerType: 'choice', supportTool: 'none', skillTag: '큰 수 비교',
    learnerGoal: '가장 높은 자리부터 비교해 더 큰 수를 찾아요.',
    promptTemplate: '두 큰 수를 비교한 설명 중 옳은 것을 고르세요.', hintSteps: ['십만의 자리부터 차례로 비교해요.', '처음으로 다른 자리의 숫자가 큰 쪽이 더 큰 수예요.'],
    build: (v, seed) => {
      const left = 410_000 + v * 1_000
      const right = left + 10_000
      const answer = '오른쪽 수가 왼쪽 수보다 더 커요.'
      return {
        prompt: `${formatted(left)}와 ${formatted(right)}를 비교한 설명을 고르세요.`, correctAnswer: answer,
        choices: rotateChoices([answer, '왼쪽 수가 오른쪽 수보다 더 커요.', '두 수는 같아요.', '자리 수가 달라 비교할 수 없어요.'], seed),
        solutionSteps: ['십만의 자리는 두 수 모두 4로 같아요.', '만의 자리는 오른쪽 수가 1만큼 더 크므로 오른쪽 수가 더 커요.'],
        visualModel: 'number-cards', visualConfig: { left, right },
      }
    },
  }),
  template({
    id: 'g4-big-05', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'applying',
    problemFamily: 'select-maximum', representation: 'number-cards', answerType: 'choice', supportTool: 'none', skillTag: '큰 수 비교',
    learnerGoal: '여러 큰 수를 비교해 가장 큰 수를 골라요.',
    promptTemplate: '네 수 중 가장 큰 수를 고르세요.', hintSteps: ['십만의 자리를 먼저 비교해요.', '같다면 만, 천, 백의 자리 순서로 비교해요.'],
    build: (v, seed) => {
      const base = 500_000 + v * 1_000
      const values = [base + 90, base + 900, base + 9, base + 990]
      const answer = String(Math.max(...values))
      return {
        prompt: '수 카드 네 장 중 가장 큰 수를 고르세요.', correctAnswer: answer,
        choices: rotateChoices(values.map(String), seed),
        solutionSteps: ['십만, 만, 천의 자리가 같은지 확인해요.', `백과 십의 자리를 이어서 비교하면 ${formatted(Number(answer))}이 가장 커요.`],
        visualModel: 'number-cards', visualConfig: { card1: values[0], card2: values[1], card3: values[2], card4: values[3] },
      }
    },
  }),
  template({
    id: 'g4-big-06', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-01]', cognitiveDomain: 'applying',
    problemFamily: 'ten-thousand-step', representation: 'number-line', answerType: 'integer', supportTool: 'grid', skillTag: '수의 계열',
    learnerGoal: '큰 수에서 10,000만큼 커진 수를 구해요.',
    promptTemplate: '주어진 수보다 10,000만큼 큰 수를 쓰세요.', hintSteps: ['만의 자리에서 한 칸 앞으로 이동해요.', '다른 자리 숫자는 그대로 두어요.'],
    build: (v) => {
      const start = 300_000 + v * 10_000 + 4_321
      const answer = start + 10_000
      return {
        prompt: `${formatted(start)}보다 10,000만큼 큰 수를 쓰세요.`, correctAnswer: String(answer),
        solutionSteps: [`${formatted(start)}에 10,000을 더해요.`, `만의 자리가 한 칸 커져 ${formatted(answer)}이에요.`],
        visualModel: 'number-line', visualConfig: { start, step: 10_000, unknownEnd: true },
      }
    },
  }),
  template({
    id: 'g4-big-07', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'applying',
    problemFamily: 'context-difference', representation: 'context', answerType: 'integer', supportTool: 'none', skillTag: '큰 수 비교',
    learnerGoal: '두 지역의 사람 수 차이를 구해 비교해요.',
    promptTemplate: '두 지역의 사람 수 차이는 몇 명인지 구하세요.', hintSteps: ['더 큰 사람 수에서 더 작은 사람 수를 빼요.', '천의 자리까지 맞추어 계산해요.'],
    build: (v) => {
      const left = 230_000 + v * 1_000
      const right = left + 20_000 + v * 100
      const answer = right - left
      return {
        prompt: `해오름 마을은 ${formatted(left)}명, 푸른 마을은 ${formatted(right)}명입니다. 두 마을의 사람 수 차이는 몇 명일까요?`,
        correctAnswer: String(answer), solutionSteps: ['푸른 마을의 사람이 더 많으므로 큰 수에서 작은 수를 빼요.', `${formatted(right)} - ${formatted(left)} = ${formatted(answer)}이에요.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '해오름', rightLabel: '푸른' },
      }
    },
  }),
  template({
    id: 'g4-big-08', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'applying',
    problemFamily: 'between-bounds', representation: 'number-line', answerType: 'choice', supportTool: 'grid', skillTag: '수의 계열',
    learnerGoal: '두 큰 수 사이에 있는 수를 찾아요.',
    promptTemplate: '두 수보다 크고 작은 조건을 모두 만족하는 수를 고르세요.', hintSteps: ['먼저 아래 경계보다 큰지 확인해요.', '그다음 위 경계보다 작은지 확인해요.'],
    build: (v, seed) => {
      const lower = 420_000 + v * 1_000
      const upper = lower + 10_000
      const answer = lower + 5_000
      return {
        prompt: `${formatted(lower)}보다 크고 ${formatted(upper)}보다 작은 수를 고르세요.`, correctAnswer: String(answer),
        choices: rotateChoices([answer, lower - 1_000, upper, upper + 1_000].map(String), seed),
        solutionSteps: [`${formatted(lower)}와 ${formatted(upper)}를 수직선의 양 끝으로 생각해요.`, `${formatted(answer)}은 두 수 사이에 있어요.`],
        visualModel: 'number-line', visualConfig: { start: lower, end: upper, unknownMiddle: true },
      }
    },
  }),
  template({
    id: 'g4-big-09', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'reasoning',
    problemFamily: 'constraint-digit', representation: 'place-value-table', answerType: 'choice', supportTool: 'grid', skillTag: '조건 추론',
    learnerGoal: '수의 크기 조건을 만족하는 가장 큰 자리 숫자를 추론해요.',
    promptTemplate: '큰 수의 비교 조건을 만족하는 빈칸 숫자 중 가장 큰 것을 고르세요.', hintSteps: ['십만의 자리는 같으니 만의 자리를 비교해요.', '조건을 만족하는 숫자를 작은 것부터 넣어 확인해요.'],
    build: (v, seed) => {
      const boundary = 460_000 + v * 1_000
      const answer = v <= 5 ? 5 : 6
      return {
        prompt: `4□5,000 < ${formatted(boundary)}일 때 □에 들어갈 수 있는 가장 큰 숫자를 고르세요.`,
        correctAnswer: String(answer), choices: rotateChoices([answer, answer - 1, Math.max(0, answer - 2), 0].map(String), seed),
        solutionSteps: ['십만의 자리 4는 같으므로 만의 자리 □와 6을 먼저 비교해요.', `천의 자리 5까지 확인하면 조건을 만족하는 가장 큰 숫자는 ${answer}예요.`],
        visualModel: 'place-value-table', visualConfig: { leftPattern: '4□5000', right: boundary, highlightPlace: '만' },
      }
    },
  }),
  template({
    id: 'g4-big-10', unitId: SAFE_GRADE4_UNIT_ID, curriculumCode: '[4수01-02]', cognitiveDomain: 'reasoning',
    problemFamily: 'claim-evaluation', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '비교 설명',
    learnerGoal: '친구의 비교 설명을 자릿값 근거로 판단해요.',
    promptTemplate: '두 큰 수를 비교한 친구의 말에 알맞은 판단 근거를 고르세요.', hintSteps: ['큰 수 비교는 가장 높은 자리부터 해요.', '뒤 자리 숫자가 커도 앞 자리 숫자가 작으면 전체 수가 작아요.'],
    build: (v, seed) => {
      const left = 390_000 + v * 1_000
      const right = 400_000
      const answer = '십만의 자리에서 3<4이므로 왼쪽 수가 더 작아요.'
      return {
        prompt: `민서는 “${formatted(left)}은 만의 자리 9가 0보다 크니까 ${formatted(right)}보다 커.”라고 말했습니다. 알맞은 판단을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([answer, '만의 자리만 비교했으므로 민서의 말이 맞아요.', '두 수는 자리 수가 같아서 항상 같아요.', '일의 자리부터 비교해야 하므로 판단할 수 없어요.'], seed),
        solutionSteps: ['두 수 모두 여섯 자리이므로 가장 높은 십만의 자리부터 비교해요.', '3은 4보다 작으므로 뒤의 자리와 관계없이 왼쪽 수가 더 작아요.'],
        visualModel: 'context', visualConfig: { left, right, speaker: '민서' },
      }
    },
  }),
  template({
    id: 'g4-div-01', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'knowing',
    problemFamily: 'exact-two-digit-division', representation: 'division-model', answerType: 'integer', supportTool: 'grid', skillTag: '나눗셈 계산',
    learnerGoal: '나누어떨어지는 두 자리 수 나눗셈의 몫을 구해요.',
    promptTemplate: '세 자리 수를 두 자리 수로 나눈 몫을 구하세요.', hintSteps: ['나누는 수의 배수를 차례로 생각해요.', '나누는 수와 몫을 곱해 나누어지는 수가 되는지 확인해요.'],
    build: (v) => {
      const divisor = 12 + v
      const quotient = 20 + v
      const dividend = divisor * quotient
      return {
        prompt: `${formatted(dividend)} ÷ ${divisor}의 몫을 구하세요.`,
        correctAnswer: String(quotient),
        solutionSteps: [`${divisor} × ${quotient} = ${formatted(dividend)}입니다.`, `따라서 ${formatted(dividend)} ÷ ${divisor} = ${quotient}입니다.`],
        visualModel: 'division-model', visualConfig: { dividend, divisor },
      }
    },
  }),
  template({
    id: 'g4-div-02', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'knowing',
    problemFamily: 'quotient-with-remainder', representation: 'division-model', answerType: 'integer', supportTool: 'grid', skillTag: '몫',
    learnerGoal: '나머지가 있는 나눗셈에서 몫을 구해요.',
    promptTemplate: '세 자리 수를 두 자리 수로 나눈 몫을 구하세요.', hintSteps: ['나누어지는 수보다 크지 않은 배수를 찾아요.', '그 배수에 사용한 횟수가 몫이에요.'],
    build: (v) => {
      const divisor = 20 + v
      const quotient = 10 + v
      const remainder = v
      const dividend = divisor * quotient + remainder
      return {
        prompt: `${formatted(dividend)} ÷ ${divisor}의 몫을 구하세요.`,
        correctAnswer: String(quotient),
        solutionSteps: [`${divisor} × ${quotient} = ${formatted(divisor * quotient)}입니다. 다음 배수는 ${divisor} × ${quotient + 1} = ${formatted(divisor * (quotient + 1))}입니다. 이 값은 ${formatted(dividend)}보다 큽니다.`, `따라서 몫은 ${quotient}이고 나머지는 ${remainder}입니다.`],
        visualModel: 'division-model', visualConfig: { dividend, divisor },
      }
    },
  }),
  template({
    id: 'g4-div-03', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'knowing',
    problemFamily: 'remainder-from-division', representation: 'division-model', answerType: 'integer', supportTool: 'grid', skillTag: '나머지',
    learnerGoal: '두 자리 수로 나눈 뒤 남는 수를 구해요.',
    promptTemplate: '세 자리 수를 두 자리 수로 나눈 나머지를 구하세요.', hintSteps: ['나누는 수의 가장 가까운 작은 배수를 찾아요.', '나누어지는 수에서 그 배수를 빼요.'],
    build: (v) => {
      const divisor = 15 + v
      const quotient = 8 + v
      const remainder = v + 2
      const dividend = divisor * quotient + remainder
      return {
        prompt: `${formatted(dividend)} ÷ ${divisor}의 나머지를 구하세요.`,
        correctAnswer: String(remainder),
        solutionSteps: [`${divisor} × ${quotient} = ${formatted(divisor * quotient)}입니다.`, `${formatted(dividend)} - ${formatted(divisor * quotient)} = ${remainder}이므로 나머지는 ${remainder}입니다.`],
        visualModel: 'division-model', visualConfig: { dividend, divisor },
      }
    },
  }),
  template({
    id: 'g4-div-04', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'knowing',
    problemFamily: 'division-check-equation', representation: 'number-cards', answerType: 'choice', supportTool: 'none', skillTag: '나눗셈 검산',
    learnerGoal: '나눗셈의 몫과 나머지를 곱셈식으로 확인해요.',
    promptTemplate: '나눗셈을 확인하는 식으로 알맞은 것을 고르세요.', hintSteps: ['나누는 수와 몫을 먼저 곱해요.', '그 곱에 나머지를 더하면 나누어지는 수가 되어야 해요.'],
    build: (v, seed) => {
      const divisor = 13 + v
      const quotient = 6 + v
      const remainder = v
      const dividend = divisor * quotient + remainder
      const answer = `${dividend} = ${divisor} × ${quotient} + ${remainder}`
      return {
        prompt: `${dividend} ÷ ${divisor} = ${quotient} … ${remainder}. 이 나눗셈을 확인하는 식을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([
          answer,
          `${dividend} = ${divisor} × ${quotient}`,
          `${dividend} = ${divisor} × ${quotient + 1} + ${remainder}`,
          `${dividend} = ${divisor} × ${quotient} - ${remainder}`,
        ], seed),
        solutionSteps: ['나누는 수 × 몫 + 나머지를 계산해요.', `계산 결과는 ${divisor} × ${quotient} + ${remainder} = ${dividend}이므로 이 식이 알맞습니다.`],
        visualModel: 'number-cards', visualConfig: { card1: dividend, card2: divisor, card3: quotient, card4: remainder },
      }
    },
  }),
  template({
    id: 'g4-div-05', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'applying',
    problemFamily: 'equal-pack-count', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '묶음 나누기',
    learnerGoal: '전체 물건 수와 한 상자 수로 상자 수를 구해요.',
    promptTemplate: '준비물을 같은 수씩 상자에 담을 때 필요한 상자 수를 구하세요.', hintSteps: ['전체 수를 한 상자에 담는 수로 나누어요.', '곱셈으로 전체 수가 맞는지 확인해요.'],
    build: (v) => {
      const divisor = 24 + v
      const quotient = 5 + v
      const dividend = divisor * quotient
      return {
        prompt: `색연필 ${formatted(dividend)}자루를 한 상자에 ${divisor}자루씩 담습니다. 상자는 몇 개 필요한가요?`,
        correctAnswer: String(quotient),
        solutionSteps: [`전체 수를 한 상자 수로 나누어요: ${formatted(dividend)} ÷ ${divisor}.`, `${divisor} × ${quotient} = ${formatted(dividend)}입니다. 두 값이 같으므로 상자는 ${quotient}개 필요합니다.`],
        visualModel: 'context', visualConfig: { left: dividend, right: divisor, leftLabel: '전체 색연필', rightLabel: '한 상자' },
      }
    },
  }),
  template({
    id: 'g4-div-06', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'applying',
    problemFamily: 'round-up-capacity', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '올림 나눗셈',
    learnerGoal: '남는 사람이 있으면 탈것을 한 대 더 준비해요.',
    promptTemplate: '한 대에 탈 수 있는 수가 정해진 상황에서 필요한 탈것 수를 구하세요.', hintSteps: ['전체 사람 수를 한 대의 정원으로 나누어요.', '나머지가 있으면 모두 타기 위해 한 대가 더 필요해요.'],
    build: (v) => {
      const divisor = 20 + v
      const fullVehicles = 3 + v
      const remainder = v + 1
      const dividend = divisor * fullVehicles + remainder
      return {
        prompt: `학생 ${formatted(dividend)}명이 한 대에 ${divisor}명씩 탈 수 있는 버스를 탑니다. 모두 타려면 버스는 몇 대 필요한가요?`,
        correctAnswer: String(fullVehicles + 1),
        solutionSteps: [`${formatted(dividend)} ÷ ${divisor} = ${fullVehicles} … ${remainder}입니다.`, `${remainder}명도 타야 하므로 버스가 한 대 더 필요해 모두 ${fullVehicles + 1}대입니다.`],
        visualModel: 'context', visualConfig: { left: dividend, right: divisor, leftLabel: '전체 학생', rightLabel: '한 대 정원' },
      }
    },
  }),
  template({
    id: 'g4-div-07', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'applying',
    problemFamily: 'leftover-after-packing', representation: 'division-model', answerType: 'integer', supportTool: 'grid', skillTag: '나머지 활용',
    learnerGoal: '같은 수씩 묶고 남는 물건 수를 구해요.',
    promptTemplate: '물건을 같은 수씩 포장한 뒤 남는 수를 구하세요.', hintSteps: ['만들 수 있는 완전한 묶음 수를 찾아요.', '전체 수에서 묶음에 사용한 수를 빼요.'],
    build: (v) => {
      const divisor = 16 + v
      const quotient = 7 + v
      const remainder = v + 1
      const dividend = divisor * quotient + remainder
      return {
        prompt: `구슬 ${formatted(dividend)}개를 한 봉지에 ${divisor}개씩 담으면 몇 개가 남나요?`,
        correctAnswer: String(remainder),
        solutionSteps: [`${divisor}개씩 ${quotient}봉지에 담으면 ${formatted(divisor * quotient)}개를 사용합니다.`, `${formatted(dividend)} - ${formatted(divisor * quotient)} = ${remainder}이므로 ${remainder}개가 남습니다.`],
        visualModel: 'division-model', visualConfig: { dividend, divisor },
      }
    },
  }),
  template({
    id: 'g4-div-08', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'applying',
    problemFamily: 'reconstruct-dividend', representation: 'number-cards', answerType: 'integer', supportTool: 'grid', skillTag: '나눗셈 역산',
    learnerGoal: '나누는 수, 몫, 나머지로 처음 수를 구해요.',
    promptTemplate: '나누는 수와 몫과 나머지를 이용하여 나누어지는 수를 구하세요.', hintSteps: ['나누는 수와 몫을 곱해요.', '그 곱에 나머지를 더해요.'],
    build: (v) => {
      const divisor = 18 + v
      const quotient = 8 + v
      const remainder = v + 2
      const dividend = divisor * quotient + remainder
      return {
        prompt: `나누는 수 ${divisor}, 몫 ${quotient}, 나머지 ${remainder}입니다. 나누어지는 수를 구하세요.`,
        correctAnswer: String(dividend),
        solutionSteps: [`나누는 수 × 몫 + 나머지를 계산해요.`, `${divisor} × ${quotient} + ${remainder} = ${formatted(dividend)}이므로 어떤 수는 ${formatted(dividend)}입니다.`],
        visualModel: 'division-model',
        visualConfig: { dividend, divisor, givenQuotient: quotient, givenRemainder: remainder, hideDividendUntilReveal: true },
      }
    },
  }),
  template({
    id: 'g4-div-09', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'reasoning',
    problemFamily: 'ignored-remainder-capacity-error', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '나머지 판단',
    learnerGoal: '나머지를 버려도 되는지 상황에 맞게 판단해요.',
    promptTemplate: '나머지를 무시한 계획이 맞는지 판단하세요.', hintSteps: ['몫만큼 준비했을 때 남는 사람이 있는지 확인해요.', '남은 사람도 모두 탈 수 있어야 해요.'],
    build: (v, seed) => {
      const divisor = 25 + v
      const fullVehicles = 4 + v
      const remainder = v + 1
      const dividend = divisor * fullVehicles + remainder
      const answer = '1대 더 필요해요.'
      return {
        prompt: `학생 ${formatted(dividend)}명이 정원 ${divisor}명인 버스를 탑니다. 준호는 ${fullVehicles}대면 충분하다고 했습니다. 준호의 계획을 고치려면 어떻게 해야 하나요?`,
        correctAnswer: answer,
        choices: rotateChoices([answer, '그대로 충분해요.', '2대 더 필요해요.', '나머지 학생은 탈 수 없어요.'], seed),
        solutionSteps: [`${formatted(dividend)} ÷ ${divisor} = ${fullVehicles} … ${remainder}입니다.`, `${remainder}명이 남으므로 버스 1대를 더 준비해야 합니다.`],
        visualModel: 'context', visualConfig: { left: dividend, right: divisor, leftLabel: '전체 학생', rightLabel: '한 대 정원' },
      }
    },
  }),
  template({
    id: 'g4-div-10', unitId: GRADE4_DIVISION_UNIT_ID, curriculumCode: '[4수01-07]', cognitiveDomain: 'reasoning',
    problemFamily: 'trial-quotient-error', representation: 'division-model', answerType: 'integer', supportTool: 'grid', skillTag: '몫 추론',
    learnerGoal: '시험한 몫이 너무 클 때 곱과 나누어지는 수의 차이를 설명해요.',
    promptTemplate: '몫을 하나 크게 잡았을 때 곱이 나누어지는 수보다 얼마나 큰지 구하세요.', hintSteps: ['나누는 수와 시험한 몫을 곱해요.', '그 곱에서 나누어지는 수를 빼요.'],
    build: (v) => {
      const divisor = 21 + v
      const quotient = 6 + v
      const remainder = Math.floor(v / 2) + 1
      const dividend = divisor * quotient + remainder
      const trialQuotient = quotient + 1
      const difference = divisor * trialQuotient - dividend
      return {
        prompt: `${formatted(dividend)} ÷ ${divisor}의 시험 몫: ${trialQuotient}. 다음 두 값의 차를 구하세요: ${divisor} × ${trialQuotient}, ${formatted(dividend)}.`,
        correctAnswer: String(difference),
        solutionSteps: [`${divisor} × ${trialQuotient} = ${formatted(divisor * trialQuotient)}입니다.`, `${formatted(divisor * trialQuotient)} - ${formatted(dividend)} = ${difference}이므로 시험한 몫은 너무 큽니다.`],
        visualModel: 'division-model', visualConfig: { dividend, divisor, trialQuotient },
      }
    },
  }),
]

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function isDeclaredAnswerValid(mission: Grade4Mission): boolean {
  if (mission.answerType === 'choice') return Boolean(mission.correctAnswer.trim())
  return /^[+-]?\d+$/.test(mission.correctAnswer)
}

export function getGrade4MissionBank(seed: number): Grade4Mission[] {
  if (!Number.isSafeInteger(seed)) throw new Error('Grade 4 seed must be a safe integer')
  return grade4MissionTemplates.map((item, index) => {
    const variant = positiveModulo(seed * 31 + index * 17, 9) + 1
    const built = item.build(variant, seed + index)
    return {
      id: item.id,
      unitId: item.unitId,
      curriculumCode: item.curriculumCode,
      cognitiveDomain: item.cognitiveDomain,
      problemFamily: item.problemFamily,
      representation: item.representation,
      answerType: item.answerType,
      supportTool: item.supportTool,
      skillTag: item.skillTag,
      learnerGoal: item.learnerGoal,
      hintSteps: item.hintSteps,
      ...built,
      variantKey: `${item.id}:seed-${seed}:variant-${variant}`,
    }
  })
}

export function getGrade4Activity(unitId: string, seed: number, activityRun: number): Grade4Mission[] {
  const safeUnitId = grade4Units.some((unit) => unit.id === unitId) ? unitId : SAFE_GRADE4_UNIT_ID
  const bank = getGrade4MissionBank(seed + activityRun * 101).filter((mission) => mission.unitId === safeUnitId)
  const domains: Grade4CognitiveDomain[] = ['knowing', 'applying', 'reasoning']
  return domains.map((domain, index) => {
    const candidates = bank.filter((mission) => mission.cognitiveDomain === domain)
    return candidates[positiveModulo(seed + activityRun * 7 + index, candidates.length)]
  })
}

export function validateGrade4MissionBank(ledger?: CurriculumLedgerLike): Grade4ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const domains = { knowing: 0, applying: 0, reasoning: 0 }
  const reasoningFamilies = new Set<string>()
  const representations = new Set<Grade4Representation>()
  const allowedCodes = new Set(grade4Units.flatMap((unit) => unit.curriculumCodes))
  const unitIds = new Set(grade4Units.map((unit) => unit.id))
  const ledgerAllocations = new Map((ledger?.allocations ?? []).map((item) => [item.standardCode, item]))

  if (new Set(grade4Units.map((unit) => unit.id)).size !== grade4Units.length) {
    errors.push('Grade 4 unit IDs must be unique')
  }
  if (new Set(grade4MissionTemplates.map((item) => item.id)).size !== grade4MissionTemplates.length) {
    errors.push('Grade 4 mission IDs must be unique')
  }
  for (const unit of grade4Units) {
    if (!unit.contentReleaseId.trim()) errors.push(`${unit.id}: missing content release ID`)
    for (const code of unit.curriculumCodes) {
      const allocation = ledgerAllocations.get(code)
      if (ledger && (!allocation || allocation.assignedGrade !== 4 || allocation.unitId !== unit.id || allocation.semester !== unit.semester)) {
        errors.push(`${unit.id}: ledger allocation mismatch for ${code}`)
      }
      if (ledger && allocation && (
        allocation.reviewStatus !== 'released'
        || allocation.coverageStatus !== 'existing-reference'
        || !allocation.existingContentRefs?.length
      )) {
        errors.push(`${unit.id}: ledger release mismatch for ${code}`)
      }
    }
  }

  for (const item of grade4MissionTemplates) {
    domains[item.cognitiveDomain] += 1
    representations.add(item.representation)
    if (item.cognitiveDomain === 'reasoning') reasoningFamilies.add(item.problemFamily)
    if (!unitIds.has(item.unitId)) errors.push(`${item.id}: unknown Grade 4 unit ${item.unitId}`)
    if (!allowedCodes.has(item.curriculumCode)) errors.push(`${item.id}: curriculum code is outside the release unit`)
    if (item.hintSteps.length < 2) errors.push(`${item.id}: needs at least two hints`)
    if (!item.learnerGoal.trim() || !item.promptTemplate.trim()) errors.push(`${item.id}: missing learner copy`)
    if (!['none', 'grid', 'ruler', 'protractor'].includes(item.supportTool)) errors.push(`${item.id}: invalid support tool`)
  }

  for (const unit of grade4Units) {
    const templates = grade4MissionTemplates.filter((item) => item.unitId === unit.id)
    const unitDomains = {
      knowing: templates.filter((item) => item.cognitiveDomain === 'knowing').length,
      applying: templates.filter((item) => item.cognitiveDomain === 'applying').length,
      reasoning: templates.filter((item) => item.cognitiveDomain === 'reasoning').length,
    }
    const unitReasoningFamilies = new Set(
      templates.filter((item) => item.cognitiveDomain === 'reasoning').map((item) => item.problemFamily),
    )
    const unitRepresentations = new Set(templates.map((item) => item.representation))
    const unitFamilies = new Set(templates.map((item) => item.problemFamily))

    if (templates.length !== 10) errors.push(`${unit.id}: expects 10 templates, got ${templates.length}`)
    if (unitDomains.knowing !== 4 || unitDomains.applying !== 4 || unitDomains.reasoning !== 2) {
      errors.push(`${unit.id}: K/A/R must be 4/4/2, got ${unitDomains.knowing}/${unitDomains.applying}/${unitDomains.reasoning}`)
    }
    if (unitReasoningFamilies.size < 2) errors.push(`${unit.id}: reasoning needs at least two problem families`)
    if (unitRepresentations.size < 2) errors.push(`${unit.id}: needs at least two representations`)
    if (unitFamilies.size !== 10) errors.push(`${unit.id}: needs ten distinct problem families`)
  }

  for (const seed of [1, 42, 20260721, 20260729]) {
    const bank = getGrade4MissionBank(seed)
    if (JSON.stringify(bank) !== JSON.stringify(getGrade4MissionBank(seed))) errors.push(`seed ${seed}: generation is not deterministic`)
    for (const mission of bank) {
      if (mission.answerType === 'choice') {
        if (mission.choices?.length !== 4 || new Set(mission.choices).size !== 4) errors.push(`${mission.id}: choice set must contain four unique values`)
        if (mission.choices?.filter((choice) => choice === mission.correctAnswer).length !== 1) errors.push(`${mission.id}: choice answer must appear exactly once`)
      }
      if (!isDeclaredAnswerValid(mission)) errors.push(`${mission.id}: declared answer is invalid`)
      for (const answerOnlyKey of ['answer', 'correctAnswer', 'result', 'target', 'product']) {
        if (Object.hasOwn(mission.visualConfig, answerOnlyKey)) errors.push(`${mission.id}: visualConfig leaks ${answerOnlyKey}`)
      }
    }
    for (const unit of grade4Units) {
      const activity = getGrade4Activity(unit.id, seed, 0)
      if (activity.length !== GRADE4_ACTIVITY_ITEM_COUNT || new Set(activity.map((mission) => mission.cognitiveDomain)).size !== 3) {
        errors.push(`${unit.id} seed ${seed}: activity must contain one K/A/R item`)
      }
    }
  }

  const first = getGrade4MissionBank(20260721)
  const later = getGrade4MissionBank(20260729)
  for (const unit of grade4Units) {
    const firstUnit = first.filter((mission) => mission.unitId === unit.id)
    const laterUnit = later.filter((mission) => mission.unitId === unit.id)
    const changed = firstUnit.filter((mission, index) => (
      mission.prompt !== laterUnit[index]?.prompt
      || mission.correctAnswer !== laterUnit[index]?.correctAnswer
    ))
    if (changed.length < 7) warnings.push(`${unit.id}: long-seed diversity is low: ${changed.length}/10 changed`)
  }

  return {
    errors,
    warnings,
    summary: {
      unitCount: grade4Units.length,
      templateCount: grade4MissionTemplates.length,
      knowingCount: domains.knowing,
      applyingCount: domains.applying,
      reasoningCount: domains.reasoning,
      reasoningFamilyCount: reasoningFamilies.size,
      representationCount: representations.size,
    },
  }
}
