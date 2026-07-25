import type { Grade4AnswerType } from './grade4-answer-normalizers'

export type Grade4Semester = '4-1' | '4-2'
export type Grade4CognitiveDomain = 'knowing' | 'applying' | 'reasoning'
export type Grade4Representation = 'place-value-table' | 'number-cards' | 'number-line' | 'context' | 'division-model' | 'fraction-strip' | 'decimal-operation' | 'pattern-table'
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
export const GRADE4_ESTIMATION_UNIT_ID = 'unit-4-1-arithmetic-estimation'
export const GRADE4_DECIMAL_UNIT_ID = 'unit-4-2-decimals'
export const GRADE4_FRACTION_ADD_SUB_UNIT_ID = 'unit-4-2-fraction-add-sub'
export const GRADE4_DECIMAL_ADD_SUB_UNIT_ID = 'unit-4-2-decimal-add-sub'
export const GRADE4_PATTERNS_UNIT_ID = 'unit-4-2-patterns'

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
  {
    id: GRADE4_ESTIMATION_UNIT_ID,
    semester: '4-1',
    order: 3,
    title: '사칙계산 어림',
    subtitle: '계산하기 전에 알맞은 단위로 수를 바꾸어 결과의 크기를 짐작해요.',
    learnerGoal: '덧셈·뺄셈·곱셈·나눗셈의 결과를 어림하고 어림 방법이 알맞은지 설명해요.',
    curriculumCodes: ['[4수01-08]'],
    prerequisiteCodes: ['[4수01-03]', '[4수01-04]', '[4수01-06]', '[4수01-07]'],
    contentReleaseId: 'grade4-bridge-arithmetic-estimation-v1',
    releaseStatus: 'released',
  },
  {
    id: GRADE4_DECIMAL_UNIT_ID,
    semester: '4-2',
    order: 4,
    title: '소수',
    subtitle: '소수 두 자리와 세 자리의 자릿값을 읽고 크기를 근거 있게 비교해요.',
    learnerGoal: '소수의 각 자리 숫자가 나타내는 값을 설명하고 여러 소수의 크기를 비교해요.',
    curriculumCodes: ['[4수01-13]', '[4수01-14]'],
    prerequisiteCodes: ['[4수01-12]'],
    contentReleaseId: 'grade4-bridge-decimals-v1',
    releaseStatus: 'released',
  },
  {
    id: GRADE4_FRACTION_ADD_SUB_UNIT_ID,
    semester: '4-2',
    order: 5,
    title: '분수의 덧셈과 뺄셈',
    subtitle: '분모가 같은 분수와 대분수를 더하고 빼는 원리를 그림과 식으로 연결해요.',
    learnerGoal: '분모가 같은 분수의 분자끼리 계산하고 받아내림이 필요한 까닭을 설명해요.',
    curriculumCodes: ['[4수01-15]'],
    prerequisiteCodes: ['[4수01-10]', '[4수01-11]'],
    contentReleaseId: 'grade4-bridge-fraction-add-sub-v1',
    releaseStatus: 'released',
  },
  {
    id: GRADE4_DECIMAL_ADD_SUB_UNIT_ID,
    semester: '4-2',
    order: 6,
    title: '소수의 덧셈과 뺄셈',
    subtitle: '소수점을 맞추어 소수 두 자리 수를 더하고 빼며 계산 원리를 설명해요.',
    learnerGoal: '소수의 같은 자리끼리 계산하고 받아올림과 받아내림의 까닭을 설명해요.',
    curriculumCodes: ['[4수01-16]'],
    prerequisiteCodes: ['[4수01-13]', '[4수01-14]'],
    contentReleaseId: 'grade4-bridge-decimal-add-sub-v1',
    releaseStatus: 'released',
  },
  {
    id: GRADE4_PATTERNS_UNIT_ID,
    semester: '4-2',
    order: 7,
    title: '규칙 찾기',
    subtitle: '수와 계산식의 배열에서 변하는 규칙을 찾아 식으로 설명하고 다음 결과를 예상해요.',
    learnerGoal: '변화 규칙을 수·식·표로 나타내고 멀리 있는 값도 근거 있게 구해요.',
    curriculumCodes: ['[4수02-01]', '[4수02-02]'],
    prerequisiteCodes: [],
    contentReleaseId: 'grade4-bridge-patterns-v1',
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

function nearest(value: number, place: number): number {
  return Math.round(value / place) * place
}

function scaledDecimal(value: number, places: number): string {
  const scale = 10 ** places
  const whole = Math.floor(value / scale)
  const fraction = String(value % scale).padStart(places, '0')
  return `${whole}.${fraction}`
}

function fractionText(numerator: number, denominator: number): string {
  const whole = Math.floor(numerator / denominator)
  const remainder = numerator % denominator
  if (whole > 0 && remainder > 0) return `${whole} ${remainder}/${denominator}`
  return `${numerator}/${denominator}`
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
  template({
    id: 'g4-est-01', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'knowing',
    problemFamily: 'nearest-hundred-addition', representation: 'number-cards', answerType: 'integer', supportTool: 'grid', skillTag: '덧셈 어림',
    learnerGoal: '두 수를 각각 가장 가까운 백 단위 수로 바꾸어 합을 어림해요.',
    promptTemplate: '두 수를 백 단위에 가장 가까운 수로 바꾸어 합을 어림하세요.', hintSteps: ['각 수에서 십의 자리 숫자를 살펴 가장 가까운 백 단위 수를 찾아요.', '바꾼 두 수를 더해 어림한 합을 구해요.'],
    build: (v) => {
      const left = 1_230 + v * 31
      const right = 2_620 + v * 27
      const roundedLeft = nearest(left, 100)
      const roundedRight = nearest(right, 100)
      const estimate = roundedLeft + roundedRight
      return {
        prompt: `${formatted(left)} + ${formatted(right)}를 백 단위에 가장 가까운 수로 바꾸어 어림하세요.`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(left)}은 ${formatted(roundedLeft)}쯤, ${formatted(right)}은 ${formatted(roundedRight)}쯤입니다.`, `${formatted(roundedLeft)} + ${formatted(roundedRight)} = ${formatted(estimate)}이므로 합은 ${formatted(estimate)}쯤입니다.`],
        visualModel: 'number-cards', visualConfig: { left, right, roundPlace: 100 },
      }
    },
  }),
  template({
    id: 'g4-est-02', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'knowing',
    problemFamily: 'nearest-hundred-subtraction', representation: 'number-cards', answerType: 'integer', supportTool: 'grid', skillTag: '뺄셈 어림',
    learnerGoal: '두 수를 각각 가장 가까운 백 단위 수로 바꾸어 차를 어림해요.',
    promptTemplate: '두 수를 백 단위에 가장 가까운 수로 바꾸어 차를 어림하세요.', hintSteps: ['두 수를 각각 가장 가까운 백 단위 수로 바꾸어요.', '바꾼 큰 수에서 작은 수를 빼요.'],
    build: (v) => {
      const left = 5_840 + v * 43
      const right = 1_260 + v * 29
      const roundedLeft = nearest(left, 100)
      const roundedRight = nearest(right, 100)
      const estimate = roundedLeft - roundedRight
      return {
        prompt: `${formatted(left)} - ${formatted(right)}를 백 단위에 가장 가까운 수로 바꾸어 어림하세요.`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(left)}은 ${formatted(roundedLeft)}쯤, ${formatted(right)}은 ${formatted(roundedRight)}쯤입니다.`, `${formatted(roundedLeft)} - ${formatted(roundedRight)} = ${formatted(estimate)}이므로 차는 ${formatted(estimate)}쯤입니다.`],
        visualModel: 'number-cards', visualConfig: { left, right, roundPlace: 100 },
      }
    },
  }),
  template({
    id: 'g4-est-03', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'knowing',
    problemFamily: 'nearest-ten-multiplication', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '곱셈 어림',
    learnerGoal: '두 자리 수를 가장 가까운 십 단위 수로 바꾸어 곱을 어림해요.',
    promptTemplate: '두 자리 수를 십 단위에 가장 가까운 수로 바꾸어 곱을 어림하세요.', hintSteps: ['두 자리 수를 가장 가까운 십 단위 수로 바꾸어요.', '바꾼 수에 한 자리 수를 곱해요.'],
    build: (v) => {
      const left = 42 + v * 6
      const right = 3 + (v % 4)
      const roundedLeft = nearest(left, 10)
      const estimate = roundedLeft * right
      return {
        prompt: `${left} × ${right}에서 ${left}를 십 단위에 가장 가까운 수로 바꾸어 어림하세요.`,
        correctAnswer: String(estimate),
        solutionSteps: [`${left}는 ${roundedLeft}에 가장 가깝습니다.`, `${roundedLeft} × ${right} = ${estimate}이므로 곱은 ${estimate}쯤입니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '어림할 수', rightLabel: '곱하는 수', roundPlace: 10 },
      }
    },
  }),
  template({
    id: 'g4-est-04', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'knowing',
    problemFamily: 'compatible-number-division', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '나눗셈 어림',
    learnerGoal: '나누어지는 수를 가까운 백 단위 수로 바꾸어 몫을 어림해요.',
    promptTemplate: '나누어지는 수를 백 단위에 가장 가까운 수로 바꾸어 몫을 어림하세요.', hintSteps: ['나누어지는 수와 가까우면서 나누기 쉬운 백 단위 수를 찾아요.', '바꾼 수를 나누는 수로 나누어요.'],
    build: (v) => {
      const roundedDividend = (8 + v) * 100
      const dividend = roundedDividend + (v % 2 === 0 ? -42 : 37)
      const divisor = 20
      const estimate = roundedDividend / divisor
      return {
        prompt: `${formatted(dividend)} ÷ ${divisor}에서 ${formatted(dividend)}을 백 단위에 가장 가까운 수로 바꾸어 어림하세요.`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(dividend)}은 ${formatted(roundedDividend)}에 가장 가깝습니다.`, `${formatted(roundedDividend)} ÷ ${divisor} = ${estimate}이므로 몫은 ${estimate}쯤입니다.`],
        visualModel: 'context', visualConfig: { left: dividend, right: divisor, leftLabel: '나누어지는 수', rightLabel: '나누는 수', roundPlace: 100 },
      }
    },
  }),
  template({
    id: 'g4-est-05', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'applying',
    problemFamily: 'attendance-total-estimate', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '합계 어림',
    learnerGoal: '두 행사 인원을 백 명쯤으로 바꾸어 전체 인원을 어림해요.',
    promptTemplate: '두 행사 인원을 백 명쯤으로 바꾸어 전체 인원을 어림하세요.', hintSteps: ['각 행사 인원을 가장 가까운 백 명쯤으로 바꾸어요.', '바꾼 두 인원을 더해요.'],
    build: (v) => {
      const left = 782 + v * 41
      const right = 634 + v * 33
      const roundedLeft = nearest(left, 100)
      const roundedRight = nearest(right, 100)
      const estimate = roundedLeft + roundedRight
      return {
        prompt: `오전 행사에 ${formatted(left)}명, 오후 행사에 ${formatted(right)}명이 왔습니다. 각 인원을 백 명쯤으로 바꾸면 모두 몇 명쯤인가요?`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(left)}명은 ${formatted(roundedLeft)}명쯤, ${formatted(right)}명은 ${formatted(roundedRight)}명쯤입니다.`, `${formatted(roundedLeft)} + ${formatted(roundedRight)} = ${formatted(estimate)}이므로 모두 ${formatted(estimate)}명쯤입니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '오전 인원', rightLabel: '오후 인원', roundPlace: 100 },
      }
    },
  }),
  template({
    id: 'g4-est-06', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'applying',
    problemFamily: 'budget-remainder-estimate', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '예산 어림',
    learnerGoal: '예산과 지출을 천 원쯤으로 바꾸어 남을 돈을 어림해요.',
    promptTemplate: '예산과 지출을 천 원쯤으로 바꾸어 남을 돈을 어림하세요.', hintSteps: ['예산과 지출을 각각 가장 가까운 천 원쯤으로 바꾸어요.', '어림한 예산에서 어림한 지출을 빼요.'],
    build: (v) => {
      const left = 14_620 + v * 800
      const right = 6_330 + v * 370
      const roundedLeft = nearest(left, 1_000)
      const roundedRight = nearest(right, 1_000)
      const estimate = roundedLeft - roundedRight
      return {
        prompt: `예산 ${formatted(left)}원에서 준비물 값 ${formatted(right)}원을 씁니다. 두 금액을 천 원쯤으로 바꾸면 얼마쯤 남나요?`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(left)}원은 ${formatted(roundedLeft)}원쯤, ${formatted(right)}원은 ${formatted(roundedRight)}원쯤입니다.`, `${formatted(roundedLeft)} - ${formatted(roundedRight)} = ${formatted(estimate)}이므로 ${formatted(estimate)}원쯤 남습니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '전체 예산', rightLabel: '준비물 값', roundPlace: 1_000 },
      }
    },
  }),
  template({
    id: 'g4-est-07', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'applying',
    problemFamily: 'class-supplies-product-estimate', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '수량 어림',
    learnerGoal: '한 반의 준비물 수를 십 개쯤으로 바꾸어 전체 수를 어림해요.',
    promptTemplate: '한 반의 준비물 수를 십 개쯤으로 바꾸어 전체 수를 어림하세요.', hintSteps: ['한 반에 필요한 수를 가장 가까운 십 개쯤으로 바꾸어요.', '바꾼 수에 반 수를 곱해요.'],
    build: (v) => {
      const left = 122 + v * 8
      const right = 6 + (v % 3)
      const roundedLeft = nearest(left, 10)
      const estimate = roundedLeft * right
      return {
        prompt: `한 반에 색종이 ${left}장이 필요하고 같은 준비를 ${right}개 반에 합니다. ${left}를 십 장쯤으로 바꾸면 모두 몇 장쯤 필요한가요?`,
        correctAnswer: String(estimate),
        solutionSteps: [`${left}장은 ${roundedLeft}장쯤입니다.`, `${roundedLeft} × ${right} = ${formatted(estimate)}이므로 모두 ${formatted(estimate)}장쯤 필요합니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '한 반 준비물', rightLabel: '반 수', roundPlace: 10 },
      }
    },
  }),
  template({
    id: 'g4-est-08', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'applying',
    problemFamily: 'packing-quotient-estimate', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '묶음 수 어림',
    learnerGoal: '전체 물건 수를 가까운 백 개쯤으로 바꾸어 묶음 수를 어림해요.',
    promptTemplate: '전체 수를 백 개쯤으로 바꾸어 묶음 수를 어림하세요.', hintSteps: ['전체 수와 가까우면서 나누기 쉬운 백 단위 수를 찾아요.', '바꾼 전체 수를 한 상자의 수로 나누어요.'],
    build: (v) => {
      const roundedTotal = (10 + v) * 100
      const left = roundedTotal + (v % 2 === 0 ? 38 : -43)
      const right = 20
      const estimate = roundedTotal / right
      return {
        prompt: `구슬 ${formatted(left)}개를 한 상자에 ${right}개씩 담습니다. 전체 수를 백 개쯤으로 바꾸면 상자는 몇 개쯤 필요한가요?`,
        correctAnswer: String(estimate),
        solutionSteps: [`${formatted(left)}개는 ${formatted(roundedTotal)}개쯤입니다.`, `${formatted(roundedTotal)} ÷ ${right} = ${estimate}이므로 상자는 ${estimate}개쯤 필요합니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '전체 구슬', rightLabel: '한 상자', roundPlace: 100 },
      }
    },
  }),
  template({
    id: 'g4-est-09', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'reasoning',
    problemFamily: 'incorrect-addition-estimate', representation: 'number-cards', answerType: 'choice', supportTool: 'none', skillTag: '어림 오류 판단',
    learnerGoal: '표시된 두 수를 직접 어림해 친구의 잘못된 합을 고쳐요.',
    promptTemplate: '친구가 말한 어림한 합을 확인하고 알맞게 고치세요.', hintSteps: ['두 수를 각각 가장 가까운 백 단위 수로 바꾸어요.', '바꾼 두 수의 합과 친구가 말한 수를 비교해요.'],
    build: (v, seed) => {
      const left = 1_230 + v * 31
      const right = 2_620 + v * 27
      const estimate = nearest(left, 100) + nearest(right, 100)
      const answer = `두 수를 각각 가장 가까운 백 단위로 바꾸면 합은 ${formatted(estimate)}쯤이에요.`
      return {
        prompt: `서준이는 ${formatted(left)} + ${formatted(right)}의 합이 ${formatted(estimate - 100)}쯤이라고 했습니다. 알맞은 판단을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([
          answer,
          `${formatted(estimate - 100)}쯤이 맞으므로 고칠 필요가 없어요.`,
          `두 수를 더하지 않고 큰 수만 ${formatted(nearest(right, 100))}로 바꾸면 돼요.`,
          `어림셈은 정확한 계산과 같아야 하므로 ${formatted(left + right)}만 답이에요.`,
        ], seed),
        solutionSteps: [`${formatted(left)}은 ${formatted(nearest(left, 100))}쯤, ${formatted(right)}은 ${formatted(nearest(right, 100))}쯤입니다.`, `두 어림값의 합은 ${formatted(estimate)}이므로 서준이의 어림을 ${formatted(estimate)}쯤으로 고쳐야 합니다.`],
        visualModel: 'number-cards', visualConfig: { left, right, roundPlace: 100, speaker: '서준' },
      }
    },
  }),
  template({
    id: 'g4-est-10', unitId: GRADE4_ESTIMATION_UNIT_ID, curriculumCode: '[4수01-08]', cognitiveDomain: 'reasoning',
    problemFamily: 'compare-estimation-strategies', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '어림 방법 비교',
    learnerGoal: '정확한 값에 더 가까운 곱셈 어림 방법을 오차로 비교해요.',
    promptTemplate: '두 곱셈 어림 방법 중 정확한 값에 더 가까운 방법을 고르세요.', hintSteps: ['두 방법으로 각각 어림한 곱을 구해요.', '정확한 곱과의 차가 더 작은 방법을 찾아요.'],
    build: (v, seed) => {
      const left = 212 + v * 4
      const right = 4 + (v % 4)
      const tensEstimate = nearest(left, 10) * right
      const hundredsEstimate = nearest(left, 100) * right
      const answer = `십 단위 어림: ${formatted(tensEstimate)}`
      return {
        prompt: `${left} × ${right}를 어림하려고 합니다. ${left}를 가까운 십 단위로 바꾸는 방법과 가까운 백 단위로 바꾸는 방법 중 정확한 곱에 더 가까운 것을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([
          answer,
          `백 단위 어림: ${formatted(hundredsEstimate)}`,
          `정확한 계산만 가능: ${formatted(left * right)}`,
          '두 어림 방법의 결과는 항상 같아요.',
        ], seed),
        solutionSteps: [`정확한 곱은 ${left} × ${right} = ${formatted(left * right)}입니다. 십 단위 어림은 ${formatted(tensEstimate)}, 백 단위 어림은 ${formatted(hundredsEstimate)}입니다.`, `정확한 곱과의 차가 더 작은 ${answer} 방법이 더 가깝습니다.`],
        visualModel: 'context', visualConfig: { left, right, leftLabel: '한 묶음 수', rightLabel: '묶음 수', roundPlace: 10 },
      }
    },
  }),
  template({
    id: 'g4-dec-01', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-13]', cognitiveDomain: 'knowing',
    problemFamily: 'compose-two-place-decimal', representation: 'place-value-table', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 쓰기',
    learnerGoal: '일, 십분의 일, 백분의 일의 수를 모아 소수로 써요.',
    promptTemplate: '자리별 수를 모아 소수 두 자리 수로 쓰세요.', hintSteps: ['소수점 왼쪽에는 일의 자리 숫자를 써요.', '소수점 오른쪽에 십분의 일, 백분의 일 숫자를 차례로 써요.'],
    build: (v) => {
      const ones = 1 + (v % 5)
      const tenths = 2 + (v % 7)
      const hundredths = 1 + ((v * 2) % 9)
      const correctAnswer = scaledDecimal(ones * 100 + tenths * 10 + hundredths, 2)
      return {
        prompt: `일이 ${ones}, 십분의 일이 ${tenths}, 백분의 일이 ${hundredths}인 수를 소수로 쓰세요.`,
        correctAnswer,
        solutionSteps: [`일의 자리에 ${ones}, 소수 첫째 자리에 ${tenths}, 소수 둘째 자리에 ${hundredths}를 놓아요.`, `따라서 소수는 ${correctAnswer}입니다.`],
        visualModel: 'place-value-table',
        visualConfig: { ones, tenths, hundredths, thousandths: 0, decimalPlaces: 2, hideCompositeUntilReveal: true },
      }
    },
  }),
  template({
    id: 'g4-dec-02', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-13]', cognitiveDomain: 'knowing',
    problemFamily: 'decimal-place-value', representation: 'place-value-table', answerType: 'decimal', supportTool: 'none', skillTag: '소수 자릿값',
    learnerGoal: '소수 둘째 자리 숫자가 나타내는 값을 소수로 써요.',
    promptTemplate: '소수에서 백분의 일 자리 숫자가 나타내는 값을 쓰세요.', hintSteps: ['소수점 오른쪽 둘째 자리가 백분의 일 자리예요.', '그 숫자는 100분의 몇인지 소수로 나타내요.'],
    build: (v) => {
      const ones = 2 + (v % 5)
      const tenths = 1 + (v % 8)
      const hundredths = 2 + ((v * 3) % 8)
      const numberText = scaledDecimal(ones * 100 + tenths * 10 + hundredths, 2)
      const correctAnswer = scaledDecimal(hundredths, 2)
      return {
        prompt: `${numberText}에서 백분의 일 자리 숫자가 나타내는 값을 소수로 쓰세요.`,
        correctAnswer,
        solutionSteps: [`${numberText}의 백분의 일 자리 숫자는 ${hundredths}입니다.`, `${hundredths}개의 백분의 일은 ${correctAnswer}입니다.`],
        visualModel: 'place-value-table',
        visualConfig: { ones, tenths, hundredths, thousandths: 0, decimalPlaces: 2, highlightPlace: '백분의 일' },
      }
    },
  }),
  template({
    id: 'g4-dec-03', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-13]', cognitiveDomain: 'knowing',
    problemFamily: 'compose-three-place-decimal', representation: 'place-value-table', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 세 자리',
    learnerGoal: '천분의 일 자리까지 있는 수를 소수로 써요.',
    promptTemplate: '자리별 수를 모아 소수 세 자리 수로 쓰세요.', hintSteps: ['소수점 오른쪽 자리는 십분의 일, 백분의 일, 천분의 일 순서예요.', '빈 자리가 있어도 0을 써서 자리를 지켜요.'],
    build: (v) => {
      const ones = 1 + (v % 4)
      const tenths = 1 + (v % 8)
      const hundredths = (v + 3) % 10
      const thousandths = 1 + ((v * 4) % 9)
      const correctAnswer = scaledDecimal(ones * 1_000 + tenths * 100 + hundredths * 10 + thousandths, 3)
      return {
        prompt: `일이 ${ones}, 십분의 일이 ${tenths}, 백분의 일이 ${hundredths}, 천분의 일이 ${thousandths}인 수를 소수로 쓰세요.`,
        correctAnswer,
        solutionSteps: [`소수점 오른쪽에 ${tenths}, ${hundredths}, ${thousandths}를 차례로 놓아요.`, `따라서 소수는 ${correctAnswer}입니다.`],
        visualModel: 'place-value-table',
        visualConfig: { ones, tenths, hundredths, thousandths, decimalPlaces: 3, hideCompositeUntilReveal: true },
      }
    },
  }),
  template({
    id: 'g4-dec-04', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'knowing',
    problemFamily: 'compare-two-decimals', representation: 'number-line', answerType: 'choice', supportTool: 'none', skillTag: '소수 비교',
    learnerGoal: '소수의 높은 자리부터 비교해 알맞은 부등호를 골라요.',
    promptTemplate: '두 소수의 크기를 비교하는 부등호를 고르세요.', hintSteps: ['먼저 일의 자리를 비교해요.', '같으면 소수 첫째, 둘째, 셋째 자리 순서로 비교해요.'],
    build: (v, seed) => {
      const leftScaled = 2_300 + v * 17
      const rightScaled = leftScaled + (v % 2 === 0 ? -1 : 1)
      const leftText = scaledDecimal(leftScaled, 3)
      const rightText = scaledDecimal(rightScaled, 3)
      const answer = leftScaled < rightScaled ? '<' : '>'
      return {
        prompt: `${leftText} □ ${rightText}의 □ 안에 알맞은 기호를 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices(['<', '>', '=', '비교할 수 없음'], seed),
        solutionSteps: ['일의 자리와 소수 첫째·둘째 자리까지 같으므로 소수 셋째 자리를 비교해요.', `${leftText} ${answer} ${rightText}입니다.`],
        visualModel: 'number-line',
        visualConfig: { left: Number(leftText), right: Number(rightText), start: Number(leftScaled < rightScaled ? leftText : rightText), end: Number(leftScaled < rightScaled ? rightText : leftText) },
      }
    },
  }),
  template({
    id: 'g4-dec-05', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-13]', cognitiveDomain: 'applying',
    problemFamily: 'measurement-place-value', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '측정값 자릿값',
    learnerGoal: '측정값의 소수 둘째 자리 숫자가 나타내는 양을 찾아요.',
    promptTemplate: '소수로 나타낸 길이에서 백분의 일 자리의 값을 고르세요.', hintSteps: ['소수점 오른쪽 둘째 자리 숫자를 찾아요.', '그 숫자를 100분의 몇 m인지 소수로 나타내요.'],
    build: (v, seed) => {
      const ones = 1 + (v % 3)
      const tenths = 2 + (v % 6)
      const digit = 2 + ((v * 3) % 8)
      const measurement = scaledDecimal(ones * 100 + tenths * 10 + digit, 2)
      const answer = `${scaledDecimal(digit, 2)} m`
      return {
        prompt: `리본의 길이는 ${measurement} m입니다. 백분의 일 자리 숫자 ${digit}이 나타내는 길이를 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([answer, `${scaledDecimal(digit, 1)} m`, `${scaledDecimal(digit, 3)} m`, `${digit} m`], seed),
        solutionSteps: [`${measurement}의 소수 둘째 자리 숫자는 ${digit}입니다.`, `${digit}개의 백분의 일 m는 ${answer}입니다.`],
        visualModel: 'context', visualConfig: { left: Number(measurement), right: digit, leftLabel: '리본 길이(m)', rightLabel: '백분의 일 자리' },
      }
    },
  }),
  template({
    id: 'g4-dec-06', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'applying',
    problemFamily: 'order-three-decimals', representation: 'number-cards', answerType: 'choice', supportTool: 'none', skillTag: '소수 순서',
    learnerGoal: '세 소수를 작은 수부터 차례로 놓아요.',
    promptTemplate: '세 소수를 작은 수부터 차례로 놓은 보기를 고르세요.', hintSteps: ['세 수의 일의 자리부터 비교해요.', '같은 자리에는 0을 붙여 자릿수를 맞추어 비교할 수 있어요.'],
    build: (v, seed) => {
      const base = (1 + (v % 3)) * 1_000 + v * 10
      const values = [base + 7, base + 70, base + 700].map((value) => scaledDecimal(value, 3))
      const answer = `${values[0]} < ${values[1]} < ${values[2]}`
      return {
        prompt: `${values.join(', ')}를 작은 수부터 차례로 놓은 것을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([
          answer,
          `${values[2]} < ${values[1]} < ${values[0]}`,
          `${values[0]} < ${values[2]} < ${values[1]}`,
          `${values[1]} < ${values[0]} < ${values[2]}`,
        ], seed),
        solutionSteps: ['세 수를 소수 셋째 자리까지 맞추어 비교해요.', `${values[0]}이 가장 작고 ${values[2]}가 가장 크므로 ${answer}입니다.`],
        visualModel: 'number-cards', visualConfig: { card1: Number(values[0]), card2: Number(values[1]), card3: Number(values[2]) },
      }
    },
  }),
  template({
    id: 'g4-dec-07', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'applying',
    problemFamily: 'greatest-decimal-from-digits', representation: 'number-cards', answerType: 'decimal', supportTool: 'grid', skillTag: '가장 큰 소수',
    learnerGoal: '서로 다른 세 숫자를 소수 자리에 배치해 가장 큰 수를 만들어요.',
    promptTemplate: '세 숫자를 한 번씩 사용하여 1보다 작은 가장 큰 소수를 만드세요.', hintSteps: ['가장 큰 숫자를 소수 첫째 자리에 놓아요.', '남은 숫자도 큰 순서대로 소수 둘째, 셋째 자리에 놓아요.'],
    build: (v) => {
      const digits = [1 + (v % 3), 4 + (v % 3), 7 + (v % 3)]
      const descending = [...digits].sort((a, b) => b - a)
      const correctAnswer = `0.${descending.join('')}`
      return {
        prompt: `숫자 ${digits.join(', ')}을 한 번씩 모두 사용하여 1보다 작은 가장 큰 소수를 만드세요.`,
        correctAnswer,
        solutionSteps: [`큰 자리부터 ${descending.join(', ')} 순서로 놓아요.`, `따라서 가장 큰 소수는 ${correctAnswer}입니다.`],
        visualModel: 'number-cards', visualConfig: { card1: digits[0], card2: digits[1], card3: digits[2] },
      }
    },
  }),
  template({
    id: 'g4-dec-08', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'applying',
    problemFamily: 'locate-decimal-between-tenths', representation: 'number-line', answerType: 'choice', supportTool: 'none', skillTag: '소수 위치',
    learnerGoal: '소수 세 자리 수가 어느 두 연속한 소수 한 자리 수 사이인지 찾아요.',
    promptTemplate: '주어진 소수가 어느 두 소수 한 자리 수 사이인지 고르세요.', hintSteps: ['주어진 수의 일의 자리와 소수 첫째 자리를 먼저 읽어요.', '그 값과 다음 소수 한 자리 수 사이에 있는지 확인해요.'],
    build: (v, seed) => {
      const whole = 1 + (v % 3)
      const tenth = 1 + (v % 7)
      const lowerScaled = whole * 10 + tenth
      const lower = scaledDecimal(lowerScaled, 1)
      const upper = scaledDecimal(lowerScaled + 1, 1)
      const target = scaledDecimal(lowerScaled * 100 + 10 + v, 3)
      const previous = scaledDecimal(lowerScaled - 1, 1)
      const next = scaledDecimal(lowerScaled + 2, 1)
      const answer = `${lower}와 ${upper} 사이`
      return {
        prompt: `${target}은 어느 두 소수 한 자리 수 사이에 있나요?`,
        correctAnswer: answer,
        choices: rotateChoices([answer, `${previous}와 ${lower} 사이`, `${upper}와 ${next} 사이`, `${lower}와 같음`], seed),
        solutionSteps: [`${target}의 일의 자리와 소수 첫째 자리까지 읽으면 ${lower}입니다.`, `${lower} < ${target} < ${upper}이므로 ${answer}입니다.`],
        visualModel: 'number-line',
        visualConfig: { start: Number(lower), end: Number(upper), targetValue: Number(target) },
      }
    },
  }),
  template({
    id: 'g4-dec-09', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'reasoning',
    problemFamily: 'whole-digit-count-comparison-error', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '소수 비교 오류',
    learnerGoal: '소수점 아래 숫자 개수만 보고 비교한 오류를 자릿값으로 고쳐요.',
    promptTemplate: '소수점 아래 숫자 개수로 비교한 친구의 말을 고치세요.', hintSteps: ['소수 끝에 0을 붙여도 수의 크기는 같아요.', '두 수의 소수 자릿수를 맞춘 뒤 높은 자리부터 비교해요.'],
    build: (v, seed) => {
      const right = scaledDecimal(750 + v, 3)
      const answer = `0.8 = 0.800이고 0.800 > ${right}이므로 왼쪽 수가 더 커요.`
      return {
        prompt: `지우는 “${right}은 소수점 아래 숫자가 세 개이고 0.8은 한 개이므로 ${right}이 더 커.”라고 말했습니다. 알맞은 판단을 고르세요.`,
        correctAnswer: answer,
        choices: rotateChoices([
          answer,
          `소수점 아래 숫자가 많으므로 ${right}이 더 커요.`,
          `0.8과 ${right}은 소수점 아래 숫자 개수가 달라 비교할 수 없어요.`,
          `두 수의 일의 자리가 0이므로 서로 같아요.`,
        ], seed),
        solutionSteps: [`0.8의 끝에 0을 붙이면 0.800이고 크기는 바뀌지 않습니다.`, `0.800과 ${right}을 높은 자리부터 비교하면 소수 첫째 자리에서 8>7이므로 왼쪽 수가 더 큽니다.`],
        visualModel: 'context', visualConfig: { left: 0.8, right: Number(right), leftLabel: '왼쪽 수', rightLabel: '오른쪽 수', speaker: '지우' },
      }
    },
  }),
  template({
    id: 'g4-dec-10', unitId: GRADE4_DECIMAL_UNIT_ID, curriculumCode: '[4수01-14]', cognitiveDomain: 'reasoning',
    problemFamily: 'missing-tenths-digit-constraint', representation: 'place-value-table', answerType: 'integer', supportTool: 'grid', skillTag: '소수 조건 추론',
    learnerGoal: '두 소수의 크기 조건을 만족하는 가장 큰 소수 첫째 자리 숫자를 찾아요.',
    promptTemplate: '소수의 크기 조건을 만족하는 빈칸의 가장 큰 숫자를 구하세요.', hintSteps: ['일의 자리가 같으므로 소수 첫째 자리를 먼저 비교해요.', '소수 첫째 자리가 같으면 소수 둘째 자리까지 비교해야 해요.'],
    build: (v) => {
      const thresholdDigit = 4 + (v % 3)
      const right = Number(`2.${thresholdDigit}5`)
      const correctAnswer = String(thresholdDigit - 1)
      return {
        prompt: `2.□7 < 2.${thresholdDigit}5를 만족하도록 □ 안에 넣을 수 있는 가장 큰 한 자리 수를 구하세요.`,
        correctAnswer,
        solutionSteps: [`소수 첫째 자리 숫자가 ${thresholdDigit}이면 2.${thresholdDigit}7 > 2.${thresholdDigit}5이므로 조건을 만족하지 않습니다.`, `${thresholdDigit}보다 작은 가장 큰 숫자는 ${correctAnswer}이므로 답은 ${correctAnswer}입니다.`],
        visualModel: 'place-value-table',
        visualConfig: { leftPattern: '2.□7', right, thresholdDigit },
      }
    },
  }),
  template({
    id: 'g4-frac-01', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'knowing',
    problemFamily: 'proper-fraction-addition', representation: 'fraction-strip', answerType: 'fraction', supportTool: 'grid', skillTag: '동분모 분수 덧셈',
    learnerGoal: '분모가 같은 진분수는 분자끼리 더해요.',
    promptTemplate: '분수 띠를 보고 분모가 같은 두 진분수의 합을 구하세요.', hintSteps: ['같은 크기의 조각끼리 더하므로 분모는 그대로예요.', '색칠한 조각 수인 분자끼리 더해요.'],
    build: (v) => {
      const denominator = 6 + (v % 3)
      const firstNumerator = 1 + (v % 2)
      const secondNumerator = 2 + (v % 3)
      const correctAnswer = fractionText(firstNumerator + secondNumerator, denominator)
      return {
        prompt: `${firstNumerator}/${denominator} + ${secondNumerator}/${denominator}을 계산하세요.`,
        correctAnswer,
        solutionSteps: [`분모가 ${denominator}로 같으므로 분모는 그대로 둡니다.`, `분자끼리 더하면 ${firstNumerator}+${secondNumerator}=${firstNumerator + secondNumerator}이므로 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-frac-02', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'knowing',
    problemFamily: 'proper-fraction-subtraction', representation: 'fraction-strip', answerType: 'fraction', supportTool: 'grid', skillTag: '동분모 분수 뺄셈',
    learnerGoal: '분모가 같은 진분수는 분자끼리 빼요.',
    promptTemplate: '분수 띠를 보고 분모가 같은 두 진분수의 차를 구하세요.', hintSteps: ['같은 크기의 조각을 덜어 내므로 분모는 그대로예요.', '처음 색칠한 조각 수에서 덜어 낸 조각 수를 빼요.'],
    build: (v) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = denominator - 1
      const secondNumerator = 1 + (v % 3)
      const correctAnswer = fractionText(firstNumerator - secondNumerator, denominator)
      return {
        prompt: `${firstNumerator}/${denominator} - ${secondNumerator}/${denominator}을 계산하세요.`,
        correctAnswer,
        solutionSteps: [`분모가 ${denominator}로 같아 분모는 그대로 둡니다.`, `${firstNumerator}-${secondNumerator}=${firstNumerator - secondNumerator}이므로 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'subtract' },
      }
    },
  }),
  template({
    id: 'g4-frac-03', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'knowing',
    problemFamily: 'mixed-number-addition', representation: 'fraction-strip', answerType: 'fraction', supportTool: 'grid', skillTag: '대분수 덧셈',
    learnerGoal: '대분수를 분자 수로 보아 같은 분모끼리 더해요.',
    promptTemplate: '분모가 같은 두 대분수의 합을 구하세요.', hintSteps: ['자연수 부분과 분수 부분을 각각 더할 수 있어요.', '분수 부분이 1보다 크면 자연수로 바꾸어 묶어요.'],
    build: (v) => {
      const denominator = 6 + (v % 4)
      const firstNumerator = denominator + 1 + (v % 2)
      const secondNumerator = denominator + 2
      const correctAnswer = fractionText(firstNumerator + secondNumerator, denominator)
      return {
        prompt: `${fractionText(firstNumerator, denominator)} + ${fractionText(secondNumerator, denominator)}을 계산하세요.`,
        correctAnswer,
        solutionSteps: [`두 수를 ${firstNumerator}/${denominator}, ${secondNumerator}/${denominator}로 보면 분자 합은 ${firstNumerator + secondNumerator}입니다.`, `${firstNumerator + secondNumerator}/${denominator}을 대분수로 나타내면 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-frac-04', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'knowing',
    problemFamily: 'mixed-number-subtraction-regrouping', representation: 'fraction-strip', answerType: 'fraction', supportTool: 'grid', skillTag: '대분수 받아내림',
    learnerGoal: '분수 부분이 작을 때 자연수 1을 같은 분모의 분수로 바꾸어 빼요.',
    promptTemplate: '받아내림이 필요한 대분수의 뺄셈을 계산하세요.', hintSteps: ['앞 수의 분수 부분만으로 뺄 수 있는지 먼저 살펴봐요.', '자연수 1을 분모와 같은 분수로 바꾸어 분수 부분에 더해요.'],
    build: (v) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = 3 * denominator + 1 + (v % 2)
      const secondNumerator = denominator + 3
      const correctAnswer = fractionText(firstNumerator - secondNumerator, denominator)
      return {
        prompt: `${fractionText(firstNumerator, denominator)} - ${fractionText(secondNumerator, denominator)}을 계산하세요.`,
        correctAnswer,
        solutionSteps: [`앞 수에서 자연수 1을 ${denominator}/${denominator}로 바꾸어 분수 부분에 받아내림합니다.`, `${firstNumerator}/${denominator}-${secondNumerator}/${denominator}=${firstNumerator - secondNumerator}/${denominator}이므로 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'subtract' },
      }
    },
  }),
  template({
    id: 'g4-frac-05', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'applying',
    problemFamily: 'recipe-fraction-sum', representation: 'context', answerType: 'fraction', supportTool: 'grid', skillTag: '분수 양 합하기',
    learnerGoal: '같은 단위로 나타낸 두 양을 동분모 분수의 덧셈으로 구해요.',
    promptTemplate: '두 재료의 양을 합하여 필요한 전체 양을 구하세요.', hintSteps: ['두 양의 분모와 단위가 같은지 확인해요.', '분자는 더하고 분모와 단위는 그대로 둬요.'],
    build: (v) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = denominator - 3
      const secondNumerator = 5
      const correctAnswer = fractionText(firstNumerator + secondNumerator, denominator)
      return {
        prompt: `과일차 한 병에 물 ${firstNumerator}/${denominator} L와 과일즙 ${secondNumerator}/${denominator} L를 넣었습니다. 두 재료는 모두 몇 L인가요?`,
        correctAnswer,
        solutionSteps: [`단위와 분모가 같으므로 ${firstNumerator}+${secondNumerator}를 계산합니다.`, `두 재료의 양은 ${correctAnswer} L입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'add', firstLabel: '물', secondLabel: '과일즙' },
      }
    },
  }),
  template({
    id: 'g4-frac-06', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'applying',
    problemFamily: 'remaining-distance-fraction', representation: 'context', answerType: 'fraction', supportTool: 'grid', skillTag: '분수 양 빼기',
    learnerGoal: '전체 거리에서 간 거리를 빼 남은 거리를 구해요.',
    promptTemplate: '전체 거리와 이동한 거리를 동분모 대분수로 나타내어 남은 거리를 구하세요.', hintSteps: ['전체 거리에서 이미 간 거리를 빼요.', '분수 부분이 작으면 자연수 1을 분수로 바꾸어 받아내림해요.'],
    build: (v) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = 2 * denominator + 2 + (v % 2)
      const secondNumerator = denominator + 4
      const correctAnswer = fractionText(firstNumerator - secondNumerator, denominator)
      return {
        prompt: `산책길 ${fractionText(firstNumerator, denominator)} km 중 ${fractionText(secondNumerator, denominator)} km를 걸었습니다. 남은 거리는 몇 km인가요?`,
        correctAnswer,
        solutionSteps: [`전체에서 걸은 거리를 빼는 식은 ${fractionText(firstNumerator, denominator)}-${fractionText(secondNumerator, denominator)}입니다.`, `${firstNumerator - secondNumerator}/${denominator}이므로 남은 거리는 ${correctAnswer} km입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'subtract', firstLabel: '전체', secondLabel: '걸은 거리' },
      }
    },
  }),
  template({
    id: 'g4-frac-07', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'applying',
    problemFamily: 'missing-fraction-addend', representation: 'fraction-strip', answerType: 'fraction', supportTool: 'grid', skillTag: '분수 덧셈 역산',
    learnerGoal: '합과 한 덧셈 항을 보고 빠진 분수를 구해요.',
    promptTemplate: '분수 덧셈식에서 빠진 덧셈 항을 구하세요.', hintSteps: ['빠진 덧셈 항은 합에서 알고 있는 덧셈 항을 빼면 돼요.', '세 분수의 분모가 같으므로 분자끼리 계산해요.'],
    build: (v) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = 2 + (v % 3)
      const totalNumerator = denominator + 1
      const correctAnswer = fractionText(totalNumerator - firstNumerator, denominator)
      return {
        prompt: `${firstNumerator}/${denominator} + □ = ${fractionText(totalNumerator, denominator)}입니다. □에 알맞은 분수를 구하세요.`,
        correctAnswer,
        solutionSteps: [`빠진 수는 ${totalNumerator}/${denominator}-${firstNumerator}/${denominator}로 구합니다.`, `분자끼리 빼면 ${totalNumerator}-${firstNumerator}=${totalNumerator - firstNumerator}이므로 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, totalNumerator, operation: 'missing-addend' },
      }
    },
  }),
  template({
    id: 'g4-frac-08', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'applying',
    problemFamily: 'select-fraction-situation-equation', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '분수 식 세우기',
    learnerGoal: '남은 양을 구하는 상황을 알맞은 분수 뺄셈식으로 나타내요.',
    promptTemplate: '사용하고 남은 양을 나타내는 올바른 동분모 분수 식을 고르세요.', hintSteps: ['남은 양은 처음 양에서 사용한 양을 빼요.', '같은 크기의 조각이므로 분모는 바꾸지 않아요.'],
    build: (v, seed) => {
      const denominator = 6 + (v % 3)
      const firstNumerator = denominator + 3
      const secondNumerator = 2 + (v % 2)
      const difference = firstNumerator - secondNumerator
      const correctAnswer = `${fractionText(firstNumerator, denominator)} - ${secondNumerator}/${denominator} = ${fractionText(difference, denominator)}`
      return {
        prompt: `색종이 ${fractionText(firstNumerator, denominator)}장 중 ${secondNumerator}/${denominator}장을 썼습니다. 남은 양을 나타내는 식을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `${fractionText(firstNumerator, denominator)} + ${secondNumerator}/${denominator} = ${fractionText(firstNumerator + secondNumerator, denominator)}`,
          `${firstNumerator}/${denominator} - ${secondNumerator}/${denominator} = ${difference}/${denominator * 2}`,
          `${firstNumerator}/${denominator} - ${secondNumerator}/${denominator} = ${difference}/${denominator - secondNumerator}`,
        ], seed),
        solutionSteps: ['남은 양이므로 처음 양에서 쓴 양을 뺍니다.', `분모는 그대로 두고 분자를 빼면 ${correctAnswer}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'subtract', firstLabel: '처음', secondLabel: '사용' },
      }
    },
  }),
  template({
    id: 'g4-frac-09', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'reasoning',
    problemFamily: 'denominator-addition-error', representation: 'fraction-strip', answerType: 'choice', supportTool: 'none', skillTag: '분수 덧셈 오류',
    learnerGoal: '동분모 분수 덧셈에서 분모를 더하면 안 되는 까닭을 설명해요.',
    promptTemplate: '분자와 분모를 모두 더한 계산의 오류를 분수 단위로 설명하세요.', hintSteps: ['분모는 한 조각의 크기를 나타내요.', '같은 크기의 조각을 합쳐도 한 조각의 크기는 바뀌지 않아요.'],
    build: (v, seed) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = 2 + (v % 2)
      const secondNumerator = 3
      const sum = firstNumerator + secondNumerator
      const correctAnswer = `조각의 크기는 ${denominator}분의 1로 같으므로 분모는 ${denominator}, 분자는 ${sum}이 됩니다.`
      return {
        prompt: `민호는 ${firstNumerator}/${denominator}+${secondNumerator}/${denominator}=${sum}/${denominator * 2}라고 계산했습니다. 알맞은 설명을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `분자와 분모를 모두 더한 ${sum}/${denominator * 2}이 맞습니다.`,
          `분모만 더해 ${firstNumerator + secondNumerator}/${denominator * 2}이 아니라 ${firstNumerator}/${denominator * 2}이 됩니다.`,
          '분수는 덧셈할 수 없으므로 두 수를 그대로 둬야 합니다.',
        ], seed),
        solutionSteps: [`두 분수는 모두 ${denominator}등분한 조각을 나타냅니다.`, `조각 수만 ${firstNumerator}+${secondNumerator}=${sum}으로 늘어나므로 ${sum}/${denominator}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-frac-10', unitId: GRADE4_FRACTION_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-15]', cognitiveDomain: 'reasoning',
    problemFamily: 'mixed-subtraction-regrouping-error', representation: 'context', answerType: 'choice', supportTool: 'grid', skillTag: '대분수 받아내림 오류',
    learnerGoal: '대분수 뺄셈에서 자연수 1을 분수로 바꾸는 받아내림을 설명해요.',
    promptTemplate: '분수 부분이 더 작은 대분수 뺄셈의 잘못된 풀이를 고치세요.', hintSteps: ['앞 수의 분수 부분에서 뒤 수의 분수 부분을 바로 뺄 수 있는지 봐요.', '자연수 1은 분모와 같은 수를 분자로 한 분수와 같아요.'],
    build: (v, seed) => {
      const denominator = 7 + (v % 3)
      const firstNumerator = 2 * denominator + 1
      const secondNumerator = denominator + 3
      const difference = firstNumerator - secondNumerator
      const correctAnswer = `자연수 1을 ${denominator}/${denominator}로 바꾸어 받아내림하면 답은 ${fractionText(difference, denominator)}입니다.`
      return {
        prompt: `서준이는 ${fractionText(firstNumerator, denominator)}-${fractionText(secondNumerator, denominator)}에서 분수 부분 ${1}/${denominator}-${3}/${denominator}을 바로 계산할 수 없다고 멈췄습니다. 알맞은 설명을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `분수 부분을 바꾸지 않고 자연수끼리만 빼면 ${1}/${denominator}입니다.`,
          `분수 부분의 순서를 바꾸어 ${3 - 1}/${denominator}로 계산하면 됩니다.`,
          `분모에서 분자를 빼 ${denominator - 2}/${denominator}를 두 수에서 각각 만들면 됩니다.`,
        ], seed),
        solutionSteps: [`앞 수의 자연수 부분에서 1을 빌려 ${denominator}/${denominator}로 바꿉니다.`, `${firstNumerator}/${denominator}-${secondNumerator}/${denominator}=${difference}/${denominator}이므로 ${fractionText(difference, denominator)}입니다.`],
        visualModel: 'fraction-strip',
        visualConfig: { denominator, firstNumerator, secondNumerator, operation: 'subtract', firstLabel: '앞 수', secondLabel: '빼는 수' },
      }
    },
  }),
  template({
    id: 'g4-dop-01', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'knowing',
    problemFamily: 'hundredths-addition-without-regrouping', representation: 'decimal-operation', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 덧셈',
    learnerGoal: '소수점을 맞추어 받아올림이 없는 소수 두 자리 수의 합을 구해요.',
    promptTemplate: '받아올림이 없는 소수 두 자리 수의 덧셈을 계산하세요.', hintSteps: ['소수점을 기준으로 같은 자리끼리 세로로 맞춰요.', '백분의 일 자리부터 차례로 더하고 소수점을 그대로 내려 찍어요.'],
    build: (v) => {
      const leftScaled = 110 + v
      const rightScaled = 229 - v
      const correctAnswer = scaledDecimal(leftScaled + rightScaled, 2)
      return {
        prompt: `${scaledDecimal(leftScaled, 2)} + ${scaledDecimal(rightScaled, 2)}를 계산하세요.`,
        correctAnswer,
        solutionSteps: ['두 수의 소수점을 맞추면 같은 자리끼리 계산할 수 있습니다.', `${scaledDecimal(leftScaled, 2)}+${scaledDecimal(rightScaled, 2)}=${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-dop-02', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'knowing',
    problemFamily: 'hundredths-addition-with-regrouping', representation: 'decimal-operation', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 받아올림',
    learnerGoal: '백분의 일이나 십분의 일 자리에서 받아올림이 있는 소수 덧셈을 계산해요.',
    promptTemplate: '받아올림이 있는 소수 두 자리 수의 덧셈을 계산하세요.', hintSteps: ['백분의 일 자리의 합이 10 이상이면 십분의 일 자리로 1을 올려요.', '십분의 일 자리의 합도 10 이상인지 확인해요.'],
    build: (v) => {
      const leftScaled = 145 + v
      const rightScaled = 176 + v * 2
      const correctAnswer = scaledDecimal(leftScaled + rightScaled, 2)
      return {
        prompt: `${scaledDecimal(leftScaled, 2)} + ${scaledDecimal(rightScaled, 2)}를 계산하세요.`,
        correctAnswer,
        solutionSteps: ['소수점을 맞춘 뒤 백분의 일 자리부터 더하고 필요한 자리에 받아올림합니다.', `${scaledDecimal(leftScaled, 2)}+${scaledDecimal(rightScaled, 2)}=${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-dop-03', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'knowing',
    problemFamily: 'hundredths-subtraction-without-regrouping', representation: 'decimal-operation', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 뺄셈',
    learnerGoal: '소수점을 맞추어 받아내림이 없는 소수 두 자리 수의 차를 구해요.',
    promptTemplate: '받아내림이 없는 소수 두 자리 수의 뺄셈을 계산하세요.', hintSteps: ['두 수의 소수점을 세로로 맞춰요.', '백분의 일 자리부터 같은 자리끼리 빼요.'],
    build: (v) => {
      const leftScaled = 780 + v
      const rightScaled = 230 + v
      const correctAnswer = scaledDecimal(leftScaled - rightScaled, 2)
      return {
        prompt: `${scaledDecimal(leftScaled, 2)} - ${scaledDecimal(rightScaled, 2)}를 계산하세요.`,
        correctAnswer,
        solutionSteps: ['소수점을 맞추면 일, 십분의 일, 백분의 일 자리가 나란히 놓입니다.', `${scaledDecimal(leftScaled, 2)}-${scaledDecimal(rightScaled, 2)}=${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'subtract' },
      }
    },
  }),
  template({
    id: 'g4-dop-04', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'knowing',
    problemFamily: 'hundredths-subtraction-with-regrouping', representation: 'decimal-operation', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 받아내림',
    learnerGoal: '아랫자리 수가 더 클 때 윗자리에서 1을 받아 내려 소수 뺄셈을 해요.',
    promptTemplate: '받아내림이 있는 소수 두 자리 수의 뺄셈을 계산하세요.', hintSteps: ['백분의 일 자리부터 바로 뺄 수 있는지 살펴봐요.', '필요하면 윗자리의 1을 아랫자리의 10으로 바꾸어 받아 내려요.'],
    build: (v) => {
      const leftScaled = 502 + (v % 3) * 10 + v
      const rightScaled = 178 + v
      const correctAnswer = scaledDecimal(leftScaled - rightScaled, 2)
      return {
        prompt: `${scaledDecimal(leftScaled, 2)} - ${scaledDecimal(rightScaled, 2)}를 계산하세요.`,
        correctAnswer,
        solutionSteps: ['같은 자리끼리 맞추고 바로 뺄 수 없는 자리에서는 윗자리의 1을 받아 내립니다.', `${scaledDecimal(leftScaled, 2)}-${scaledDecimal(rightScaled, 2)}=${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'subtract' },
      }
    },
  }),
  template({
    id: 'g4-dop-05', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'applying',
    problemFamily: 'decimal-measurement-sum', representation: 'context', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 양 합하기',
    learnerGoal: '같은 단위로 나타낸 두 길이를 더해 전체 길이를 구해요.',
    promptTemplate: '두 소수 길이를 더하여 전체 길이를 구하세요.', hintSteps: ['두 길이의 단위가 같은지 확인해요.', '소수점을 맞추어 두 길이를 더해요.'],
    build: (v) => {
      const leftScaled = 235 + v * 3
      const rightScaled = 148 + v * 2
      const correctAnswer = scaledDecimal(leftScaled + rightScaled, 2)
      return {
        prompt: `파란 리본 ${scaledDecimal(leftScaled, 2)} m와 노란 리본 ${scaledDecimal(rightScaled, 2)} m를 이었습니다. 전체 길이는 몇 m인가요?`,
        correctAnswer,
        solutionSteps: ['두 리본의 길이를 모두 구하므로 덧셈식을 세웁니다.', `${scaledDecimal(leftScaled, 2)}+${scaledDecimal(rightScaled, 2)}=${correctAnswer}이므로 전체 길이는 ${correctAnswer} m입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'add', leftLabel: '파란 리본', rightLabel: '노란 리본' },
      }
    },
  }),
  template({
    id: 'g4-dop-06', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'applying',
    problemFamily: 'decimal-remaining-amount', representation: 'context', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 양 빼기',
    learnerGoal: '처음 양에서 사용한 양을 빼 남은 양을 구해요.',
    promptTemplate: '처음 있던 소수 양에서 사용한 양을 빼세요.', hintSteps: ['남은 양은 처음 양에서 사용한 양을 빼서 구해요.', '소수점을 맞춘 뒤 받아내림이 필요한지 살펴봐요.'],
    build: (v) => {
      const leftScaled = 865 + v * 3
      const rightScaled = 247 + v * 2
      const correctAnswer = scaledDecimal(leftScaled - rightScaled, 2)
      return {
        prompt: `물 ${scaledDecimal(leftScaled, 2)} L 중 ${scaledDecimal(rightScaled, 2)} L를 사용했습니다. 남은 물은 몇 L인가요?`,
        correctAnswer,
        solutionSteps: ['남은 양을 구하므로 처음 양에서 사용한 양을 뺍니다.', `${scaledDecimal(leftScaled, 2)}-${scaledDecimal(rightScaled, 2)}=${correctAnswer}이므로 ${correctAnswer} L가 남습니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'subtract', leftLabel: '처음 물', rightLabel: '사용한 물' },
      }
    },
  }),
  template({
    id: 'g4-dop-07', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'applying',
    problemFamily: 'missing-decimal-addend', representation: 'decimal-operation', answerType: 'decimal', supportTool: 'grid', skillTag: '소수 덧셈 역산',
    learnerGoal: '합과 한 덧셈 항을 보고 빠진 소수를 뺄셈으로 구해요.',
    promptTemplate: '소수 덧셈식에서 빠진 덧셈 항을 구하세요.', hintSteps: ['빠진 덧셈 항은 합에서 알고 있는 덧셈 항을 빼면 돼요.', '합과 덧셈 항의 소수점을 맞추어 계산해요.'],
    build: (v) => {
      const leftScaled = 215 + v * 2
      const totalScaled = 650 + v * 4
      const correctAnswer = scaledDecimal(totalScaled - leftScaled, 2)
      return {
        prompt: `${scaledDecimal(leftScaled, 2)} + □ = ${scaledDecimal(totalScaled, 2)}입니다. □에 알맞은 소수를 구하세요.`,
        correctAnswer,
        solutionSteps: [`빠진 수는 ${scaledDecimal(totalScaled, 2)}-${scaledDecimal(leftScaled, 2)}로 구합니다.`, `계산하면 ${correctAnswer}이므로 □=${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, totalScaled, operation: 'missing-addend' },
      }
    },
  }),
  template({
    id: 'g4-dop-08', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'applying',
    problemFamily: 'select-decimal-situation-equation', representation: 'context', answerType: 'choice', supportTool: 'none', skillTag: '소수 식 세우기',
    learnerGoal: '두 소수 양을 합하는 상황을 올바른 식으로 나타내요.',
    promptTemplate: '두 소수 양의 합을 나타내는 식을 고르세요.', hintSteps: ['두 양을 모두 합하므로 덧셈식을 세워요.', '소수점 아래 자리 수가 달라도 같은 자리끼리 맞추어 계산해요.'],
    build: (v, seed) => {
      const leftScaled = 325 + v
      const rightScaled = 148 + v * 2
      const totalScaled = leftScaled + rightScaled
      const correctAnswer = `${scaledDecimal(leftScaled, 2)} + ${scaledDecimal(rightScaled, 2)} = ${scaledDecimal(totalScaled, 2)}`
      return {
        prompt: `화분 두 개에 흙이 각각 ${scaledDecimal(leftScaled, 2)} kg, ${scaledDecimal(rightScaled, 2)} kg 들어 있습니다. 전체 양을 나타내는 식을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `${scaledDecimal(leftScaled, 2)} - ${scaledDecimal(rightScaled, 2)} = ${scaledDecimal(leftScaled - rightScaled, 2)}`,
          `${scaledDecimal(leftScaled, 2)} + ${scaledDecimal(rightScaled, 2)} = ${scaledDecimal(totalScaled + 100, 2)}`,
          `${scaledDecimal(leftScaled, 2)} - ${scaledDecimal(rightScaled, 2)} = ${scaledDecimal(totalScaled, 2)}`,
        ], seed),
        solutionSteps: ['두 화분의 흙을 모두 구하므로 덧셈식을 세웁니다.', `같은 자리끼리 더하면 ${correctAnswer}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'add', leftLabel: '첫째 화분', rightLabel: '둘째 화분' },
      }
    },
  }),
  template({
    id: 'g4-dop-09', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'reasoning',
    problemFamily: 'decimal-point-alignment-error', representation: 'decimal-operation', answerType: 'choice', supportTool: 'grid', skillTag: '소수점 정렬 오류',
    learnerGoal: '소수의 끝자리만 맞춘 덧셈 오류를 자릿값으로 설명해요.',
    promptTemplate: '소수점을 맞추지 않은 소수 덧셈의 오류를 고치세요.', hintSteps: ['소수 계산에서는 숫자의 끝이 아니라 소수점을 맞춰요.', '일은 일끼리, 십분의 일은 십분의 일끼리 더해야 해요.'],
    build: (v, seed) => {
      const leftScaled = 320 + v
      const rightScaled = 45 + v
      const sum = scaledDecimal(leftScaled + rightScaled, 2)
      const correctAnswer = `소수점을 맞추면 ${scaledDecimal(leftScaled, 2)}+${scaledDecimal(rightScaled, 2)}=${sum}입니다.`
      return {
        prompt: `유나는 ${scaledDecimal(leftScaled, 2)}와 ${scaledDecimal(rightScaled, 2)}의 오른쪽 끝 숫자를 맞추어 더했습니다. 알맞은 설명을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          '오른쪽 끝 숫자만 맞추면 같은 자리끼리 계산되므로 옳습니다.',
          '소수점은 계산한 뒤 두 수의 소수점 사이에 찍으면 됩니다.',
          '소수점 아래 숫자는 모두 자연수 부분으로 옮겨 더해야 합니다.',
        ], seed),
        solutionSteps: ['숫자의 오른쪽 끝이 아니라 두 수의 소수점을 같은 세로선에 놓습니다.', `같은 자리끼리 더하면 합은 ${sum}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'add' },
      }
    },
  }),
  template({
    id: 'g4-dop-10', unitId: GRADE4_DECIMAL_ADD_SUB_UNIT_ID, curriculumCode: '[4수01-16]', cognitiveDomain: 'reasoning',
    problemFamily: 'decimal-regrouping-error', representation: 'decimal-operation', answerType: 'choice', supportTool: 'grid', skillTag: '소수 받아내림 오류',
    learnerGoal: '소수 뺄셈에서 윗자리의 1이 아랫자리의 10이 되는 까닭을 설명해요.',
    promptTemplate: '받아내림을 하지 않은 소수 뺄셈의 오류를 고치세요.', hintSteps: ['각 자리에서 위 숫자가 아래 숫자보다 작은지 확인해요.', '십분의 일 1은 백분의 일 10과 같아요.'],
    build: (v, seed) => {
      const leftScaled = 503 + v
      const rightScaled = 178 + v
      const difference = scaledDecimal(leftScaled - rightScaled, 2)
      const correctAnswer = `윗자리의 1을 아랫자리의 10으로 바꾸어 받아내림하면 답은 ${difference}입니다.`
      return {
        prompt: `도윤이는 ${scaledDecimal(leftScaled, 2)}-${scaledDecimal(rightScaled, 2)}에서 작은 숫자에서 큰 숫자를 뺄 수 없다고 멈췄습니다. 알맞은 설명을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          '각 자리의 큰 숫자에서 작은 숫자를 빼면 되므로 수의 순서는 상관없습니다.',
          '소수점 아래 부분만 따로 자연수로 만들어 더해야 합니다.',
          '받아내림 없이 계산할 수 없으므로 두 소수의 차는 구할 수 없습니다.',
        ], seed),
        solutionSteps: ['바로 뺄 수 없는 자리에서는 윗자리의 1을 아랫자리의 10으로 바꾸어 받아 내립니다.', `같은 자리끼리 계산하면 ${scaledDecimal(leftScaled, 2)}-${scaledDecimal(rightScaled, 2)}=${difference}입니다.`],
        visualModel: 'decimal-operation',
        visualConfig: { leftScaled, rightScaled, operation: 'subtract' },
      }
    },
  }),
  template({
    id: 'g4-pat-01', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-01]', cognitiveDomain: 'knowing',
    problemFamily: 'additive-sequence-next-term', representation: 'pattern-table', answerType: 'integer', supportTool: 'grid', skillTag: '수의 변화 규칙',
    learnerGoal: '일정하게 커지는 수 배열에서 다음 수를 구해요.',
    promptTemplate: '일정하게 커지는 수 배열의 다음 수를 구하세요.', hintSteps: ['이웃한 두 수의 차를 차례로 구해요.', '같은 수만큼 커진다면 마지막 수에도 그 수를 더해요.'],
    build: (v) => {
      const value1 = 10 + v
      const step = 2 + (v % 4)
      const value2 = value1 + step
      const value3 = value2 + step
      const value4 = value3 + step
      const correctAnswer = String(value4 + step)
      return {
        prompt: `${value1}, ${value2}, ${value3}, ${value4}, □의 규칙을 찾아 □에 알맞은 수를 쓰세요.`,
        correctAnswer,
        solutionSteps: [`이웃한 수의 차는 모두 ${step}입니다.`, `${value4}+${step}=${correctAnswer}이므로 다음 수는 ${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'sequence', value1, value2, value3, value4, requestedPosition: 5 },
      }
    },
  }),
  template({
    id: 'g4-pat-02', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-01]', cognitiveDomain: 'knowing',
    problemFamily: 'input-output-next-value', representation: 'pattern-table', answerType: 'integer', supportTool: 'grid', skillTag: '대응 규칙',
    learnerGoal: '위 수와 아래 수의 대응 규칙을 찾아 다음 값을 구해요.',
    promptTemplate: '대응표에서 위 수와 아래 수의 규칙을 찾아 빈칸을 구하세요.', hintSteps: ['각 열에서 위 수가 1 커질 때 아래 수가 얼마나 커지는지 봐요.', '찾은 규칙을 다음 위 수에도 적용해요.'],
    build: (v) => {
      const multiplier = 2 + (v % 4)
      const offset = v
      const input1 = 1
      const input2 = 2
      const input3 = 3
      const output1 = input1 * multiplier + offset
      const output2 = input2 * multiplier + offset
      const output3 = input3 * multiplier + offset
      const correctAnswer = String(4 * multiplier + offset)
      return {
        prompt: `위 수가 1, 2, 3일 때 아래 수가 ${output1}, ${output2}, ${output3}입니다. 위 수가 4일 때 아래 수를 구하세요.`,
        correctAnswer,
        solutionSteps: [`위 수가 1 커질 때 아래 수는 ${multiplier}씩 커집니다.`, `${output3}+${multiplier}=${correctAnswer}이므로 알맞은 수는 ${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'correspondence', input1, input2, input3, output1, output2, output3, requestedPosition: 4 },
      }
    },
  }),
  template({
    id: 'g4-pat-03', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-02]', cognitiveDomain: 'knowing',
    problemFamily: 'multiplication-array-next-result', representation: 'pattern-table', answerType: 'integer', supportTool: 'grid', skillTag: '계산식 배열',
    learnerGoal: '곱하는 수가 일정하게 변하는 계산식 배열의 다음 결과를 구해요.',
    promptTemplate: '곱셈식 배열의 규칙을 찾아 다음 계산 결과를 구하세요.', hintSteps: ['곱해지는 수가 같고 곱하는 수가 어떻게 변하는지 봐요.', '결과가 일정하게 커지는 값도 확인해요.'],
    build: (v) => {
      const factor = 10 + v
      const correctAnswer = String(factor * 5)
      return {
        prompt: `${factor}×2=${factor * 2}, ${factor}×3=${factor * 3}, ${factor}×4=${factor * 4}입니다. 규칙을 이용해 ${factor}×5를 구하세요.`,
        correctAnswer,
        solutionSteps: [`곱하는 수가 1씩 커질 때 결과는 ${factor}씩 커집니다.`, `${factor * 4}+${factor}=${correctAnswer}이므로 ${factor}×5=${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'multiplication', factor, input1: 2, input2: 3, input3: 4, output1: factor * 2, output2: factor * 3, output3: factor * 4, requestedPosition: 5 },
      }
    },
  }),
  template({
    id: 'g4-pat-04', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-02]', cognitiveDomain: 'knowing',
    problemFamily: 'addition-array-next-result', representation: 'pattern-table', answerType: 'integer', supportTool: 'grid', skillTag: '계산식 배열',
    learnerGoal: '두 수가 함께 변하는 덧셈식 배열에서 다음 결과를 구해요.',
    promptTemplate: '두 덧셈 항이 함께 변하는 배열의 다음 계산 결과를 구하세요.', hintSteps: ['첫째 수와 둘째 수가 각각 얼마나 커지는지 봐요.', '두 수의 증가량을 합하면 결과의 증가량을 알 수 있어요.'],
    build: (v) => {
      const left1 = 20 + v
      const right1 = 5 + v
      const leftStep = 3
      const rightStep = 2
      const left2 = left1 + leftStep
      const left3 = left2 + leftStep
      const right2 = right1 + rightStep
      const right3 = right2 + rightStep
      const requestedLeft = left3 + leftStep
      const requestedRight = right3 + rightStep
      const correctAnswer = String(requestedLeft + requestedRight)
      return {
        prompt: `${left1}+${right1}=${left1 + right1}, ${left2}+${right2}=${left2 + right2}, ${left3}+${right3}=${left3 + right3}입니다. 다음 식 ${requestedLeft}+${requestedRight}의 결과를 구하세요.`,
        correctAnswer,
        solutionSteps: [`첫째 수는 ${leftStep}씩, 둘째 수는 ${rightStep}씩 커져 결과는 ${leftStep + rightStep}씩 커집니다.`, `${left3 + right3}+${leftStep + rightStep}=${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'addition', left1, left2, left3, right1, right2, right3, output1: left1 + right1, output2: left2 + right2, output3: left3 + right3, requestedLeft, requestedRight },
      }
    },
  }),
  template({
    id: 'g4-pat-05', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-01]', cognitiveDomain: 'applying',
    problemFamily: 'growing-stage-far-term', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '단계 규칙',
    learnerGoal: '처음 몇 단계의 변화량을 이용해 멀리 있는 단계의 개수를 구해요.',
    promptTemplate: '단계마다 일정하게 늘어나는 모형의 먼 단계 개수를 구하세요.', hintSteps: ['1단계에서 시작해 한 단계마다 몇 개씩 늘어나는지 구해요.', '1단계에서 목표 단계까지 증가가 몇 번 일어나는지 세어요.'],
    build: (v) => {
      const value1 = 4 + v
      const step = 3 + (v % 3)
      const value2 = value1 + step
      const value3 = value2 + step
      const requestedPosition = 6 + (v % 3)
      const correctAnswer = String(value1 + (requestedPosition - 1) * step)
      return {
        prompt: `정사각형 타일이 1단계 ${value1}개, 2단계 ${value2}개, 3단계 ${value3}개로 늘어납니다. 같은 규칙일 때 ${requestedPosition}단계에는 몇 개가 필요할까요?`,
        correctAnswer,
        solutionSteps: [`한 단계마다 타일이 ${step}개씩 늘어납니다.`, `1단계 뒤로 ${requestedPosition - 1}번 늘어나므로 ${value1}+${step}×${requestedPosition - 1}=${correctAnswer}개입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'stages', value1, value2, value3, requestedPosition, itemLabel: '타일 수' },
      }
    },
  }),
  template({
    id: 'g4-pat-06', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-01]', cognitiveDomain: 'applying',
    problemFamily: 'price-correspondence-far-value', representation: 'context', answerType: 'integer', supportTool: 'grid', skillTag: '생활 속 대응',
    learnerGoal: '물건 수와 전체 금액의 대응 규칙을 이용해 필요한 금액을 구해요.',
    promptTemplate: '물건 수와 전체 금액의 표에서 목표 개수의 금액을 구하세요.', hintSteps: ['한 개의 값이 일정한지 표의 각 열로 확인해요.', '한 개의 값에 필요한 개수를 곱해요.'],
    build: (v) => {
      const unitPrice = 120 + v * 10
      const requestedPosition = 5 + (v % 4)
      const correctAnswer = String(unitPrice * requestedPosition)
      return {
        prompt: `연필 1자루는 ${unitPrice}원, 2자루는 ${unitPrice * 2}원, 3자루는 ${unitPrice * 3}원입니다. ${requestedPosition}자루의 값은 얼마인가요?`,
        correctAnswer,
        solutionSteps: [`연필 수가 1 늘 때 전체 금액은 ${unitPrice}원씩 늘어납니다.`, `${unitPrice}×${requestedPosition}=${correctAnswer}원이 필요합니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'correspondence', input1: 1, input2: 2, input3: 3, output1: unitPrice, output2: unitPrice * 2, output3: unitPrice * 3, requestedPosition, inputLabel: '연필 수', outputLabel: '금액(원)' },
      }
    },
  }),
  template({
    id: 'g4-pat-07', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-02]', cognitiveDomain: 'applying',
    problemFamily: 'multiplication-array-far-row', representation: 'pattern-table', answerType: 'integer', supportTool: 'grid', skillTag: '계산 결과 예측',
    learnerGoal: '가까운 계산식의 규칙을 이용해 배열의 멀리 있는 결과를 예측해요.',
    promptTemplate: '곱셈식 배열에서 여러 칸 뒤 계산 결과를 규칙으로 구하세요.', hintSteps: ['곱하는 수가 1 늘 때 결과가 얼마나 늘어나는지 봐요.', '목표까지 몇 번 늘어나는지 세거나 곱셈식을 바로 계산해요.'],
    build: (v) => {
      const factor = 100 + v
      const requestedPosition = 7 + v
      const correctAnswer = String(factor * requestedPosition)
      return {
        prompt: `${factor}×2=${factor * 2}, ${factor}×3=${factor * 3}, ${factor}×4=${factor * 4}입니다. 같은 배열에서 ${factor}×${requestedPosition}의 결과를 구하세요.`,
        correctAnswer,
        solutionSteps: [`곱하는 수가 1씩 늘 때 결과는 ${factor}씩 늘어납니다.`, `규칙을 이어 가거나 곱하면 ${factor}×${requestedPosition}=${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'multiplication', factor, input1: 2, input2: 3, input3: 4, output1: factor * 2, output2: factor * 3, output3: factor * 4, requestedPosition },
      }
    },
  }),
  template({
    id: 'g4-pat-08', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-02]', cognitiveDomain: 'applying',
    problemFamily: 'select-next-calculation-row', representation: 'pattern-table', answerType: 'choice', supportTool: 'none', skillTag: '계산식 배열 완성',
    learnerGoal: '두 수와 결과가 함께 변하는 계산식 배열의 다음 줄을 골라요.',
    promptTemplate: '계산식 배열의 규칙을 모두 지키는 다음 식을 고르세요.', hintSteps: ['첫째 수, 둘째 수, 결과가 각각 어떻게 변하는지 따로 봐요.', '식 자체의 계산도 맞는지 확인해요.'],
    build: (v, seed) => {
      const left1 = 30 + v
      const right1 = 4 + v
      const left2 = left1 + 4
      const left3 = left2 + 4
      const right2 = right1 + 2
      const right3 = right2 + 2
      const requestedLeft = left3 + 4
      const requestedRight = right3 + 2
      const requestedResult = requestedLeft - requestedRight
      const correctAnswer = `${requestedLeft}-${requestedRight}=${requestedResult}`
      return {
        prompt: `${left1}-${right1}=${left1 - right1}, ${left2}-${right2}=${left2 - right2}, ${left3}-${right3}=${left3 - right3} 다음에 올 식을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `${requestedLeft}-${right3}=${requestedLeft - right3}`,
          `${left3}-${requestedRight}=${left3 - requestedRight}`,
          `${requestedLeft}-${requestedRight}=${requestedResult + 2}`,
        ], seed),
        solutionSteps: ['첫째 수는 4씩, 둘째 수는 2씩 커지므로 결과는 2씩 커집니다.', `세 변화와 계산이 모두 맞는 다음 식은 ${correctAnswer}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'subtraction', left1, left2, left3, right1, right2, right3, output1: left1 - right1, output2: left2 - right2, output3: left3 - right3, requestedLeft, requestedRight },
      }
    },
  }),
  template({
    id: 'g4-pat-09', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-01]', cognitiveDomain: 'reasoning',
    problemFamily: 'correspondence-rule-claim-evaluation', representation: 'context', answerType: 'choice', supportTool: 'grid', skillTag: '대응 규칙 설명',
    learnerGoal: '표의 일부만 보고 세운 규칙이 모든 대응쌍에 맞는지 판단해요.',
    promptTemplate: '대응표에 대한 친구의 규칙 설명을 모든 열로 확인하세요.', hintSteps: ['한 열에만 맞는 규칙은 전체 규칙이라고 할 수 없어요.', '각 위 수에 같은 계산을 적용해 아래 수가 되는지 확인해요.'],
    build: (v, seed) => {
      const multiplier = 3 + (v % 3)
      const offset = 2 + v
      const output1 = multiplier + offset
      const output2 = multiplier * 2 + offset
      const output3 = multiplier * 3 + offset
      const next = multiplier * 4 + offset
      const correctAnswer = `위 수에 ${multiplier}을 곱하고 ${offset}를 더하는 규칙이며, 위 수 4에 대응하는 수는 ${next}입니다.`
      return {
        prompt: `대응표의 위 수 1, 2, 3에 아래 수 ${output1}, ${output2}, ${output3}이 대응합니다. 지민이는 “항상 ${multiplier}만 더하면 돼.”라고 말했습니다. 알맞은 판단을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `위 수에 ${multiplier}만 더하는 규칙이므로 다음 수는 ${4 + multiplier}입니다.`,
          `아래 수끼리 ${offset}만큼 차이 나므로 다음 수는 ${output3 + offset}입니다.`,
          '대응하는 수가 세 개뿐이므로 어떤 규칙도 설명할 수 없습니다.',
        ], seed),
        solutionSteps: [`각 열에서 위 수에 ${multiplier}을 곱한 뒤 ${offset}를 더하면 아래 수가 됩니다.`, `4×${multiplier}+${offset}=${next}이므로 친구의 설명은 전체 표에 맞지 않습니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'correspondence', input1: 1, input2: 2, input3: 3, output1, output2, output3, requestedPosition: 4, speaker: '지민' },
      }
    },
  }),
  template({
    id: 'g4-pat-10', unitId: GRADE4_PATTERNS_UNIT_ID, curriculumCode: '[4수02-02]', cognitiveDomain: 'reasoning',
    problemFamily: 'two-part-calculation-pattern-error', representation: 'pattern-table', answerType: 'choice', supportTool: 'grid', skillTag: '계산식 규칙 오류',
    learnerGoal: '계산식 배열에서 두 곳이 함께 변하는 규칙을 빠뜨린 오류를 고쳐요.',
    promptTemplate: '곱하는 수와 더하는 수가 함께 변하는 계산식 배열의 잘못된 다음 식을 고치세요.', hintSteps: ['각 식에서 곱하는 수와 더하는 수를 따로 표시해요.', '다음 줄에서는 두 수가 모두 같은 규칙으로 변해야 해요.'],
    build: (v, seed) => {
      const factor = 8 + (v % 2)
      const first = factor * 1 + 1
      const second = factor * 2 + 2
      const third = factor * 3 + 3
      const fourth = factor * 4 + 4
      const correctAnswer = `곱하는 수와 더하는 수를 모두 4로 바꾸어 ${factor}×4+4=${fourth}로 써야 합니다.`
      return {
        prompt: `${factor}×1+1=${first}, ${factor}×2+2=${second}, ${factor}×3+3=${third} 다음에 현우는 ${factor}×4+3=${factor * 4 + 3}이라고 썼습니다. 알맞은 설명을 고르세요.`,
        correctAnswer,
        choices: rotateChoices([
          correctAnswer,
          `곱하는 수만 4로 바뀌므로 ${factor}×4+3=${factor * 4 + 3}이 맞습니다.`,
          `더하는 수만 4로 바꾸어 ${factor}×3+4=${factor * 3 + 4}로 써야 합니다.`,
          `결과에 4만 더해 ${third + 4}로 쓰면 됩니다.`,
        ], seed),
        solutionSteps: ['곱하는 수와 더하는 수가 1, 2, 3으로 함께 1씩 커집니다.', `다음 줄에서는 둘 다 4이므로 ${factor}×4+4=${fourth}입니다.`],
        visualModel: 'pattern-table',
        visualConfig: { mode: 'multiply-add', factor, input1: 1, input2: 2, input3: 3, output1: first, output2: second, output3: third, requestedPosition: 4, speaker: '현우' },
      }
    },
  }),
]

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function isDeclaredAnswerValid(mission: Grade4Mission): boolean {
  if (mission.answerType === 'choice') return Boolean(mission.correctAnswer.trim())
  if (mission.answerType === 'decimal') return /^[+-]?\d+(?:\.\d+)?$/.test(mission.correctAnswer)
  if (mission.answerType === 'fraction') {
    const match = mission.correctAnswer.match(/^[+-]?(?:(\d+)\s+)?(\d+)\/(\d+)$/)
    return Boolean(match && Number(match[3]) > 0)
  }
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
