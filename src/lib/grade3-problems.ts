import type { Grade3AnswerType } from './grade3-answer-normalizers'

export type Grade3Semester = '3-1' | '3-2'
export type Grade3DifficultyStep = 'easy' | 'medium' | 'applied'
export type Grade3Skill =
  | 'addition-subtraction'
  | 'line-angle'
  | 'division-meaning'
  | 'multiplication'
  | 'length-time'
  | 'fraction-decimal'
  | 'division-remainder'
  | 'circle'
  | 'fraction'
  | 'capacity-weight'
  | 'graph'

export type Grade3VisualModel =
  | 'vertical-operation'
  | 'line-angle-cards'
  | 'division-groups'
  | 'array-area'
  | 'ruler-mm'
  | 'clock-seconds'
  | 'fraction-strip'
  | 'decimal-grid'
  | 'circle-parts'
  | 'capacity-beaker'
  | 'weight-scale'
  | 'bar-graph'

export type Grade3ScaffoldKind =
  | 'place-check'
  | 'angle-classifier'
  | 'group-maker'
  | 'array-counter'
  | 'ruler-reader'
  | 'clock-seconds'
  | 'fraction-strip'
  | 'decimal-place'
  | 'circle-finder'
  | 'unit-reader'
  | 'graph-reader'

export type Grade3RewardId =
  | 'calculationTorch'
  | 'shapeLens'
  | 'divisionShell'
  | 'multiplyBridge'
  | 'measureBoots'
  | 'fractionLantern'
  | 'circleCompass'
  | 'unitBottle'
  | 'graphFlag'

export type Grade3VisualConfig = Record<string, string | number | boolean>

export interface Grade3AnswerConfig {
  kind: Grade3AnswerType
  inputLabel?: string
  unit?: 'mm' | 'cm-mm' | 'km-m' | 'time-hms' | 'duration-hms' | 'l-ml' | 'kg-g' | 'degree'
  max?: number
}

export interface Grade3ScaffoldConfig {
  kind: Grade3ScaffoldKind
  prompt: string
  options?: string[]
}

export interface Grade3Unit {
  id: string
  semester: Grade3Semester
  title: string
  subtitle: string
  curriculumCodes: string[]
  rewardId: Grade3RewardId
}

export interface Grade3MissionTemplate {
  id: string
  unitId: string
  semester: Grade3Semester
  stageOrder: number
  skill: Grade3Skill
  difficultyStep: Grade3DifficultyStep
  curriculumCode: string
  learnerGoal: string
  parentSummaryTag: string
  prompt: string
  answerType: Grade3AnswerType
  answerConfig: Grade3AnswerConfig
  correctAnswer: string
  choices?: string[]
  hintSteps: string[]
  solutionSteps: string[]
  visualModel: Grade3VisualModel
  visualConfig: Grade3VisualConfig
  scaffoldConfig: Grade3ScaffoldConfig
  rewardId: Grade3RewardId
}

export interface Grade3Mission extends Grade3MissionTemplate {
  unitMissionOrder: number
}

export interface Grade3ValidationResult {
  errors: string[]
  warnings: string[]
}

export const SAFE_GRADE3_MISSION_ID = 'g3-1-add-sub-01'

export const grade3Units: Grade3Unit[] = [
  {
    id: 'g3-1-add-sub',
    semester: '3-1',
    title: '덧셈과 뺄셈',
    subtitle: '세 자리 수를 자리 맞추어 더하고 빼요.',
    curriculumCodes: ['[4수01-03]'],
    rewardId: 'calculationTorch',
  },
  {
    id: 'g3-1-lines',
    semester: '3-1',
    title: '평면도형',
    subtitle: '선의 종류와 각을 보고 구별해요.',
    curriculumCodes: ['[4수03-01]', '[4수03-02]'],
    rewardId: 'shapeLens',
  },
  {
    id: 'g3-1-division',
    semester: '3-1',
    title: '나눗셈',
    subtitle: '같게 나누고 묶어 보며 몫을 찾아요.',
    curriculumCodes: ['[4수01-05]', '[4수01-06]'],
    rewardId: 'divisionShell',
  },
  {
    id: 'g3-1-multiply',
    semester: '3-1',
    title: '곱셈',
    subtitle: '배열과 세로식으로 곱셈을 확인해요.',
    curriculumCodes: ['[4수01-04]'],
    rewardId: 'multiplyBridge',
  },
  {
    id: 'g3-1-length-time',
    semester: '3-1',
    title: '길이와 시간',
    subtitle: 'mm, km, 초 단위를 읽고 계산해요.',
    curriculumCodes: ['[4수03-13]', '[4수03-14]', '[4수03-15]', '[4수03-16]'],
    rewardId: 'measureBoots',
  },
  {
    id: 'g3-1-fraction-decimal',
    semester: '3-1',
    title: '분수와 소수',
    subtitle: '부분과 전체, 소수 한 자리 수를 눈으로 확인해요.',
    curriculumCodes: ['[4수01-09]', '[4수01-12]'],
    rewardId: 'fractionLantern',
  },
  {
    id: 'g3-2-multiply',
    semester: '3-2',
    title: '곱셈',
    subtitle: '두 자리 수 곱셈을 배열과 자리값으로 풀어요.',
    curriculumCodes: ['[4수01-04]'],
    rewardId: 'multiplyBridge',
  },
  {
    id: 'g3-2-division',
    semester: '3-2',
    title: '나눗셈',
    subtitle: '몫과 나머지를 함께 확인해요.',
    curriculumCodes: ['[4수01-06]'],
    rewardId: 'divisionShell',
  },
  {
    id: 'g3-2-circle',
    semester: '3-2',
    title: '원',
    subtitle: '원의 중심, 반지름, 지름을 찾아요.',
    curriculumCodes: ['[4수03-06]', '[4수03-07]'],
    rewardId: 'circleCompass',
  },
  {
    id: 'g3-2-fraction',
    semester: '3-2',
    title: '분수',
    subtitle: '분수의 크기와 같은 양을 비교해요.',
    curriculumCodes: ['[4수01-10]', '[4수01-11]'],
    rewardId: 'fractionLantern',
  },
  {
    id: 'g3-2-capacity-weight',
    semester: '3-2',
    title: '들이와 무게',
    subtitle: 'L, mL, kg, g를 구조화해서 읽어요.',
    curriculumCodes: ['[4수03-17]', '[4수03-18]', '[4수03-20]', '[4수03-21]'],
    rewardId: 'unitBottle',
  },
  {
    id: 'g3-2-graph',
    semester: '3-2',
    title: '자료의 정리',
    subtitle: '막대그래프를 읽고 필요한 값을 찾아요.',
    curriculumCodes: ['[4수04-01]', '[4수04-03]'],
    rewardId: 'graphFlag',
  },
]

const commonHints = {
  place: ['일의 자리부터 차례대로 계산해요.', '받아올림이나 받아내림 표시를 확인해요.'],
  visual: ['그림에서 표시된 부분을 먼저 찾아요.', '답이 되는 곳만 다시 세어 보세요.'],
  unit: ['단위 칸을 나누어 생각해요.', '작은 단위 칸은 정해진 범위를 넘지 않게 써요.'],
}

function mission(template: Grade3MissionTemplate): Grade3MissionTemplate {
  return template
}

const integerAnswerConfig: Grade3AnswerConfig = { kind: 'integer', inputLabel: '답을 숫자로 써요' }
const choiceAnswerConfig: Grade3AnswerConfig = { kind: 'choice' }
const labelAnswerConfig: Grade3AnswerConfig = { kind: 'label' }
const fractionAnswerConfig: Grade3AnswerConfig = { kind: 'fraction', inputLabel: '분수를 써요' }
const decimalAnswerConfig: Grade3AnswerConfig = { kind: 'decimal', inputLabel: '소수를 써요' }
const mmLengthAnswerConfig: Grade3AnswerConfig = { kind: 'length', unit: 'cm-mm', inputLabel: '길이를 써요' }
const kmLengthAnswerConfig: Grade3AnswerConfig = { kind: 'length', unit: 'km-m', inputLabel: '길이를 써요' }
const timeAnswerConfig: Grade3AnswerConfig = { kind: 'time-of-day', unit: 'time-hms', inputLabel: '시각을 써요' }
const durationAnswerConfig: Grade3AnswerConfig = { kind: 'duration', unit: 'duration-hms', inputLabel: '걸린 시간을 써요' }
const capacityAnswerConfig: Grade3AnswerConfig = { kind: 'capacity', unit: 'l-ml', inputLabel: '들이를 써요' }
const weightAnswerConfig: Grade3AnswerConfig = { kind: 'weight', unit: 'kg-g', inputLabel: '무게를 써요' }
const angleAnswerConfig: Grade3AnswerConfig = { kind: 'angle', unit: 'degree', inputLabel: '각도를 써요' }

export const grade3MissionTemplates: Grade3MissionTemplate[] = [
  mission({
    id: 'g3-1-add-sub-01',
    unitId: 'g3-1-add-sub',
    semester: '3-1',
    stageOrder: 1,
    skill: 'addition-subtraction',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-03]',
    learnerGoal: '세 자리 수 덧셈에서 받아올림을 확인해요.',
    parentSummaryTag: '세 자리 덧셈',
    prompt: '248 + 137은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '385',
    hintSteps: commonHints.place,
    solutionSteps: ['8+7=15라서 5를 쓰고 1을 올려요.', '4+3+1=8, 2+1=3이므로 385예요.'],
    visualModel: 'vertical-operation',
    visualConfig: { top: 248, bottom: 137, operator: '+', result: 385 },
    scaffoldConfig: { kind: 'place-check', prompt: '일의 자리부터 보면 좋아요.', options: ['일', '십', '백'] },
    rewardId: 'calculationTorch',
  }),
  mission({
    id: 'g3-1-add-sub-02',
    unitId: 'g3-1-add-sub',
    semester: '3-1',
    stageOrder: 2,
    skill: 'addition-subtraction',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-03]',
    learnerGoal: '세 자리 수 뺄셈에서 받아내림을 확인해요.',
    parentSummaryTag: '세 자리 뺄셈',
    prompt: '604 - 278은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '326',
    hintSteps: commonHints.place,
    solutionSteps: ['일의 자리에서 4에서 8을 뺄 수 없어 받아내림해요.', '차례대로 계산하면 326이에요.'],
    visualModel: 'vertical-operation',
    visualConfig: { top: 604, bottom: 278, operator: '-', result: 326 },
    scaffoldConfig: { kind: 'place-check', prompt: '받아내림이 필요한 자리를 골라요.', options: ['일의 자리', '십의 자리', '백의 자리'] },
    rewardId: 'calculationTorch',
  }),
  mission({
    id: 'g3-1-add-sub-03',
    unitId: 'g3-1-add-sub',
    semester: '3-1',
    stageOrder: 3,
    skill: 'addition-subtraction',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-03]',
    learnerGoal: '상황 속에서 필요한 덧셈과 뺄셈을 골라요.',
    parentSummaryTag: '세 자리 상황 계산',
    prompt: '책 425권 중 168권을 빌려 갔어요. 남은 책은 몇 권일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '257',
    hintSteps: ['남은 수를 구하므로 빼기를 써요.', '425 - 168을 자리 맞추어 계산해요.'],
    solutionSteps: ['425에서 168을 빼면 257이에요.', '남은 책은 257권이에요.'],
    visualModel: 'vertical-operation',
    visualConfig: { top: 425, bottom: 168, operator: '-', result: 257 },
    scaffoldConfig: { kind: 'place-check', prompt: '상황에 맞는 계산을 골라요.', options: ['더하기', '빼기'] },
    rewardId: 'calculationTorch',
  }),
  mission({
    id: 'g3-1-lines-01',
    unitId: 'g3-1-lines',
    semester: '3-1',
    stageOrder: 4,
    skill: 'line-angle',
    difficultyStep: 'easy',
    curriculumCode: '[4수03-01]',
    learnerGoal: '선분을 직선, 반직선과 구별해요.',
    parentSummaryTag: '선의 종류',
    prompt: '두 끝점이 모두 있는 선은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '선분',
    choices: ['직선', '선분', '반직선'],
    hintSteps: ['끝점이 몇 개인지 보세요.', '두 끝점이 있으면 선분이에요.'],
    solutionSteps: ['선분은 시작과 끝이 모두 정해진 선이에요.'],
    visualModel: 'line-angle-cards',
    visualConfig: { cards: '직선,선분,반직선', target: '선분' },
    scaffoldConfig: { kind: 'angle-classifier', prompt: '끝점 개수를 눌러 확인해요.', options: ['0개', '1개', '2개'] },
    rewardId: 'shapeLens',
  }),
  mission({
    id: 'g3-1-lines-02',
    unitId: 'g3-1-lines',
    semester: '3-1',
    stageOrder: 5,
    skill: 'line-angle',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-02]',
    learnerGoal: '각의 크기를 보고 예각을 찾아요.',
    parentSummaryTag: '각의 종류',
    prompt: '직각보다 작은 각은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '예각',
    choices: ['예각', '직각', '둔각'],
    hintSteps: ['직각은 90도예요.', '90도보다 작으면 예각이에요.'],
    solutionSteps: ['직각보다 작은 각을 예각이라고 해요.'],
    visualModel: 'line-angle-cards',
    visualConfig: { angle: 45, target: '예각' },
    scaffoldConfig: { kind: 'angle-classifier', prompt: '90도와 비교해요.', options: ['작다', '같다', '크다'] },
    rewardId: 'shapeLens',
  }),
  mission({
    id: 'g3-1-lines-03',
    unitId: 'g3-1-lines',
    semester: '3-1',
    stageOrder: 6,
    skill: 'line-angle',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-02]',
    learnerGoal: '각도기 그림에서 각의 크기를 읽어요.',
    parentSummaryTag: '각도 읽기',
    prompt: '도형 그림에서 표시한 각은 몇 도일까요?',
    answerType: 'angle',
    answerConfig: angleAnswerConfig,
    correctAnswer: '120도',
    hintSteps: ['0도 선에서 시작해 눈금을 읽어요.', '90도보다 크니 둔각이에요.'],
    solutionSteps: ['눈금이 120을 가리키므로 120도예요.'],
    visualModel: 'line-angle-cards',
    visualConfig: { angle: 120, target: '120', hideAngleUntilReveal: true },
    scaffoldConfig: { kind: 'angle-classifier', prompt: '각의 종류를 먼저 골라요.', options: ['예각', '직각', '둔각'] },
    rewardId: 'shapeLens',
  }),
  mission({
    id: 'g3-1-division-01',
    unitId: 'g3-1-division',
    semester: '3-1',
    stageOrder: 7,
    skill: 'division-meaning',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-05]',
    learnerGoal: '같게 나누는 나눗셈의 뜻을 알아요.',
    parentSummaryTag: '나눗셈 뜻',
    prompt: '사탕 12개를 3명에게 같게 나누면 한 명은 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '4',
    hintSteps: ['12개를 3묶음으로 나누어요.', '각 묶음의 개수를 세어요.'],
    solutionSteps: ['12를 3으로 나누면 4예요.', '한 명은 4개씩 받아요.'],
    visualModel: 'division-groups',
    visualConfig: { total: 12, groups: 3, quotient: 4 },
    scaffoldConfig: { kind: 'group-maker', prompt: '같은 묶음 수를 확인해요.', options: ['2명', '3명', '4명'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-1-division-02',
    unitId: 'g3-1-division',
    semester: '3-1',
    stageOrder: 8,
    skill: 'division-meaning',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-06]',
    learnerGoal: '나눗셈과 곱셈의 관계를 이용해요.',
    parentSummaryTag: '나눗셈 몫',
    prompt: '28 ÷ 4의 몫은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '7',
    hintSteps: ['4씩 몇 묶음인지 생각해요.', '4 x 7 = 28이에요.'],
    solutionSteps: ['28 안에 4가 7번 들어가요.', '몫은 7이에요.'],
    visualModel: 'division-groups',
    visualConfig: { total: 28, groups: 4, quotient: 7 },
    scaffoldConfig: { kind: 'group-maker', prompt: '곱셈식으로 확인해요.', options: ['4 x 6', '4 x 7', '4 x 8'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-1-division-03',
    unitId: 'g3-1-division',
    semester: '3-1',
    stageOrder: 9,
    skill: 'division-meaning',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-06]',
    learnerGoal: '상황에서 나눗셈식을 세워요.',
    parentSummaryTag: '나눗셈 상황',
    prompt: '연필 32자루를 8자루씩 묶으면 몇 묶음이 될까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '4',
    hintSteps: ['8자루씩 한 묶음이에요.', '32 안에 8이 몇 번 있는지 찾아요.'],
    solutionSteps: ['32 ÷ 8 = 4예요.', '4묶음이 됩니다.'],
    visualModel: 'division-groups',
    visualConfig: { total: 32, groups: 4, each: 8, quotient: 4 },
    scaffoldConfig: { kind: 'group-maker', prompt: '한 묶음의 크기를 골라요.', options: ['4자루', '8자루', '32자루'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-1-multiply-01',
    unitId: 'g3-1-multiply',
    semester: '3-1',
    stageOrder: 10,
    skill: 'multiplication',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-04]',
    learnerGoal: '몇십 곱하기 한 자리 수를 계산해요.',
    parentSummaryTag: '곱셈 확장',
    prompt: '30 x 4는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '120',
    hintSteps: ['3 x 4를 먼저 생각해요.', '십이 12개이면 120이에요.'],
    solutionSteps: ['30은 십이 3개예요.', '3 x 4 = 12라서 120이에요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 4, cols: 30, product: 120, compact: true },
    scaffoldConfig: { kind: 'array-counter', prompt: '30이 몇 번 있는지 봐요.', options: ['3번', '4번', '30번'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-1-multiply-02',
    unitId: 'g3-1-multiply',
    semester: '3-1',
    stageOrder: 11,
    skill: 'multiplication',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-04]',
    learnerGoal: '두 자리 수와 한 자리 수의 곱을 구해요.',
    parentSummaryTag: '두 자리 곱셈',
    prompt: '23 x 3은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '69',
    hintSteps: ['20 x 3과 3 x 3으로 나누어 봐요.', '60과 9를 더해요.'],
    solutionSteps: ['23 x 3 = 20 x 3 + 3 x 3이에요.', '60 + 9 = 69예요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 3, cols: 23, tens: 20, ones: 3, product: 69 },
    scaffoldConfig: { kind: 'array-counter', prompt: '23을 나누면?', options: ['20과 3', '10과 13', '2와 3'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-1-multiply-03',
    unitId: 'g3-1-multiply',
    semester: '3-1',
    stageOrder: 12,
    skill: 'multiplication',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-04]',
    learnerGoal: '상황 속 곱셈을 세워 계산해요.',
    parentSummaryTag: '곱셈 상황',
    prompt: '상자 4개에 공이 21개씩 있어요. 공은 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '84',
    hintSteps: ['같은 수가 4번 있으니 곱셈이에요.', '21 x 4를 계산해요.'],
    solutionSteps: ['21 x 4 = 84예요.', '공은 모두 84개예요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 4, cols: 21, product: 84 },
    scaffoldConfig: { kind: 'array-counter', prompt: '상자는 몇 개일까요?', options: ['4개', '21개', '84개'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-1-length-time-01',
    unitId: 'g3-1-length-time',
    semester: '3-1',
    stageOrder: 13,
    skill: 'length-time',
    difficultyStep: 'easy',
    curriculumCode: '[4수03-15]',
    learnerGoal: 'cm와 mm를 함께 읽어요.',
    parentSummaryTag: 'mm 읽기',
    prompt: '그림의 길이는 몇 cm 몇 mm일까요?',
    answerType: 'length',
    answerConfig: mmLengthAnswerConfig,
    correctAnswer: '4cm7mm',
    hintSteps: ['큰 눈금은 cm예요.', '작은 눈금은 mm예요.'],
    solutionSteps: ['4cm를 지나 작은 눈금 7칸이에요.', '길이는 4cm 7mm예요.'],
    visualModel: 'ruler-mm',
    visualConfig: { centimeters: 4, millimeters: 7, resultMm: 47 },
    scaffoldConfig: { kind: 'ruler-reader', prompt: '큰 눈금과 작은 눈금을 나누어 봐요.', options: ['cm', 'mm'] },
    rewardId: 'measureBoots',
  }),
  mission({
    id: 'g3-1-length-time-02',
    unitId: 'g3-1-length-time',
    semester: '3-1',
    stageOrder: 14,
    skill: 'length-time',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-13]',
    learnerGoal: '초 단위까지 시각을 읽어요.',
    parentSummaryTag: '초 단위 시각',
    prompt: '시계가 가리키는 시각은 몇 시 몇 분 몇 초일까요?',
    answerType: 'time-of-day',
    answerConfig: timeAnswerConfig,
    correctAnswer: '3시25분40초',
    hintSteps: ['짧은 바늘은 시, 긴 바늘은 분을 봐요.', '초 바늘이 40초를 가리켜요.'],
    solutionSteps: ['시계는 3시 25분 40초를 가리켜요.'],
    visualModel: 'clock-seconds',
    visualConfig: { hour: 3, minute: 25, second: 40 },
    scaffoldConfig: { kind: 'clock-seconds', prompt: '초 바늘의 숫자를 먼저 확인해요.', options: ['20초', '40초', '50초'] },
    rewardId: 'measureBoots',
  }),
  mission({
    id: 'g3-1-length-time-03',
    unitId: 'g3-1-length-time',
    semester: '3-1',
    stageOrder: 15,
    skill: 'length-time',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-14]',
    learnerGoal: '초 단위 시간의 차를 구해요.',
    parentSummaryTag: '초 단위 시간',
    prompt: '2분 15초 동안 달리고 35초 더 달렸어요. 모두 몇 분 몇 초일까요?',
    answerType: 'duration',
    answerConfig: durationAnswerConfig,
    correctAnswer: '2분50초',
    hintSteps: ['초끼리 먼저 더해요.', '15초 + 35초 = 50초예요.'],
    solutionSteps: ['2분은 그대로 두고 초를 더해요.', '모두 2분 50초예요.'],
    visualModel: 'clock-seconds',
    visualConfig: { durationStart: 135, addSeconds: 35, durationResult: 170 },
    scaffoldConfig: { kind: 'clock-seconds', prompt: '초끼리 먼저 계산해요.', options: ['15+35', '2+35', '2+15'] },
    rewardId: 'measureBoots',
  }),
  mission({
    id: 'g3-1-fraction-decimal-01',
    unitId: 'g3-1-fraction-decimal',
    semester: '3-1',
    stageOrder: 16,
    skill: 'fraction-decimal',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-09]',
    learnerGoal: '전체와 부분을 보고 분수를 써요.',
    parentSummaryTag: '분수 읽기',
    prompt: '전체를 5칸으로 나누고 2칸을 색칠했어요. 분수로 쓰면?',
    answerType: 'fraction',
    answerConfig: fractionAnswerConfig,
    correctAnswer: '2/5',
    hintSteps: ['분모는 전체 칸 수예요.', '분자는 색칠한 칸 수예요.'],
    solutionSteps: ['전체 5칸 중 2칸이므로 2/5예요.'],
    visualModel: 'fraction-strip',
    visualConfig: { totalParts: 5, shadedParts: 2 },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '분모와 분자를 차례로 눌러 봐요.', options: ['전체 5', '색칠 2'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-1-fraction-decimal-02',
    unitId: 'g3-1-fraction-decimal',
    semester: '3-1',
    stageOrder: 17,
    skill: 'fraction-decimal',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-12]',
    learnerGoal: '소수 한 자리 수를 격자로 읽어요.',
    parentSummaryTag: '소수 읽기',
    prompt: '10칸 중 7칸이 색칠되어 있어요. 소수로 쓰면?',
    answerType: 'decimal',
    answerConfig: decimalAnswerConfig,
    correctAnswer: '0.7',
    hintSteps: ['10칸 중 1칸은 0.1이에요.', '7칸은 0.7이에요.'],
    solutionSteps: ['0.1이 7개이므로 0.7이에요.'],
    visualModel: 'decimal-grid',
    visualConfig: { totalParts: 10, shadedParts: 7 },
    scaffoldConfig: { kind: 'decimal-place', prompt: '0.1이 몇 개일까요?', options: ['5개', '7개', '10개'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-1-fraction-decimal-03',
    unitId: 'g3-1-fraction-decimal',
    semester: '3-1',
    stageOrder: 18,
    skill: 'fraction-decimal',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-09]',
    learnerGoal: '상황 속 부분을 분수로 나타내요.',
    parentSummaryTag: '분수 상황',
    prompt: '피자 8조각 중 3조각을 먹었어요. 먹은 양은 전체의 얼마일까요?',
    answerType: 'fraction',
    answerConfig: fractionAnswerConfig,
    correctAnswer: '3/8',
    hintSteps: ['전체 조각 수가 분모예요.', '먹은 조각 수가 분자예요.'],
    solutionSteps: ['전체 8조각 중 3조각을 먹었으므로 3/8이에요.'],
    visualModel: 'fraction-strip',
    visualConfig: { totalParts: 8, shadedParts: 3 },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '전체와 먹은 조각을 구분해요.', options: ['전체 8', '먹은 3'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-2-multiply-01',
    unitId: 'g3-2-multiply',
    semester: '3-2',
    stageOrder: 19,
    skill: 'multiplication',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-04]',
    learnerGoal: '몇십몇 곱하기 한 자리 수를 풀어요.',
    parentSummaryTag: '곱셈 확장',
    prompt: '42 x 2는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '84',
    hintSteps: ['40 x 2와 2 x 2로 나누어 봐요.', '80과 4를 더해요.'],
    solutionSteps: ['40 x 2 = 80, 2 x 2 = 4예요.', '80 + 4 = 84예요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 2, cols: 42, tens: 40, ones: 2, product: 84 },
    scaffoldConfig: { kind: 'array-counter', prompt: '42를 어떻게 나눌까요?', options: ['40과 2', '20과 22', '4와 2'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-2-multiply-02',
    unitId: 'g3-2-multiply',
    semester: '3-2',
    stageOrder: 20,
    skill: 'multiplication',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-04]',
    learnerGoal: '두 자리 수끼리의 곱셈을 나누어 계산해요.',
    parentSummaryTag: '두 자리 곱셈',
    prompt: '12 x 13은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '156',
    hintSteps: ['13을 10과 3으로 나누어요.', '12 x 10과 12 x 3을 더해요.'],
    solutionSteps: ['120 + 36 = 156이에요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 12, cols: 13, split: 10, product: 156 },
    scaffoldConfig: { kind: 'array-counter', prompt: '13을 나누는 방법을 골라요.', options: ['10과 3', '6과 7', '1과 13'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-2-multiply-03',
    unitId: 'g3-2-multiply',
    semester: '3-2',
    stageOrder: 21,
    skill: 'multiplication',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-04]',
    learnerGoal: '두 단계 상황에서 곱셈을 사용해요.',
    parentSummaryTag: '곱셈 상황',
    prompt: '한 줄에 14명씩 6줄로 섰어요. 모두 몇 명일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '84',
    hintSteps: ['같은 수가 6줄 있어요.', '14 x 6을 계산해요.'],
    solutionSteps: ['14 x 6 = 84예요.', '모두 84명이에요.'],
    visualModel: 'array-area',
    visualConfig: { rows: 6, cols: 14, product: 84 },
    scaffoldConfig: { kind: 'array-counter', prompt: '줄 수를 먼저 골라요.', options: ['6줄', '14줄', '84줄'] },
    rewardId: 'multiplyBridge',
  }),
  mission({
    id: 'g3-2-division-01',
    unitId: 'g3-2-division',
    semester: '3-2',
    stageOrder: 22,
    skill: 'division-remainder',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-06]',
    learnerGoal: '나머지가 있는 나눗셈을 알아요.',
    parentSummaryTag: '나머지',
    prompt: '17 ÷ 5의 나머지는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '2',
    hintSteps: ['5씩 3묶음이면 15예요.', '17에서 15를 빼요.'],
    solutionSteps: ['17 = 5 x 3 + 2예요.', '나머지는 2예요.'],
    visualModel: 'division-groups',
    visualConfig: { total: 17, groups: 3, each: 5, remainder: 2 },
    scaffoldConfig: { kind: 'group-maker', prompt: '5씩 몇 묶음이 될까요?', options: ['2묶음', '3묶음', '4묶음'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-2-division-02',
    unitId: 'g3-2-division',
    semester: '3-2',
    stageOrder: 23,
    skill: 'division-remainder',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-06]',
    learnerGoal: '몫과 나머지를 함께 구해요.',
    parentSummaryTag: '몫과 나머지',
    prompt: '29 ÷ 4의 몫은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '7',
    hintSteps: ['4 x 7 = 28이에요.', '29에서 28을 빼면 1이 남아요.'],
    solutionSteps: ['29 = 4 x 7 + 1이에요.', '묻는 것은 몫이므로 7이에요.'],
    visualModel: 'division-groups',
    visualConfig: { total: 29, groups: 7, each: 4, quotient: 7, remainder: 1 },
    scaffoldConfig: { kind: 'group-maker', prompt: '가장 가까운 곱셈식을 골라요.', options: ['4 x 6', '4 x 7', '4 x 8'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-2-division-03',
    unitId: 'g3-2-division',
    semester: '3-2',
    stageOrder: 24,
    skill: 'division-remainder',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-06]',
    learnerGoal: '상황에서 나머지의 뜻을 말해요.',
    parentSummaryTag: '나머지 상황',
    prompt: '쿠키 26개를 6개씩 봉지에 넣으면 남는 쿠키는 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '2',
    hintSteps: ['6개씩 4봉지를 만들면 24개예요.', '26에서 24를 빼요.'],
    solutionSteps: ['26 = 6 x 4 + 2예요.', '남는 쿠키는 2개예요.'],
    visualModel: 'division-groups',
    visualConfig: { total: 26, groups: 4, each: 6, remainder: 2 },
    scaffoldConfig: { kind: 'group-maker', prompt: '완성된 봉지는 몇 개일까요?', options: ['4봉지', '5봉지', '6봉지'] },
    rewardId: 'divisionShell',
  }),
  mission({
    id: 'g3-2-circle-01',
    unitId: 'g3-2-circle',
    semester: '3-2',
    stageOrder: 25,
    skill: 'circle',
    difficultyStep: 'easy',
    curriculumCode: '[4수03-06]',
    learnerGoal: '원의 중심을 찾아요.',
    parentSummaryTag: '원 구성 요소',
    prompt: '원에서 가운데 점을 무엇이라고 할까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '원의 중심',
    choices: ['반지름', '원의 중심', '지름'],
    hintSteps: ['원 한가운데에 있는 점이에요.', '모든 반지름이 시작되는 곳이에요.'],
    solutionSteps: ['원의 가운데 점은 원의 중심이에요.'],
    visualModel: 'circle-parts',
    visualConfig: { target: '원의 중심', radius: 5, diameter: 10 },
    scaffoldConfig: { kind: 'circle-finder', prompt: '가운데 점을 눌러 생각해요.', options: ['가운데 점', '끝 점', '선 전체'] },
    rewardId: 'circleCompass',
  }),
  mission({
    id: 'g3-2-circle-02',
    unitId: 'g3-2-circle',
    semester: '3-2',
    stageOrder: 26,
    skill: 'circle',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-06]',
    learnerGoal: '반지름과 지름의 관계를 알아요.',
    parentSummaryTag: '반지름과 지름',
    prompt: '반지름이 6cm인 원의 지름은 몇 cm일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '12',
    hintSteps: ['지름은 반지름 2개와 같아요.', '6을 두 번 더해요.'],
    solutionSteps: ['6 x 2 = 12예요.', '지름은 12cm예요.'],
    visualModel: 'circle-parts',
    visualConfig: { radius: 6, diameter: 12, hideDiameterUntilReveal: true },
    scaffoldConfig: { kind: 'circle-finder', prompt: '지름은 반지름 몇 개일까요?', options: ['1개', '2개', '3개'] },
    rewardId: 'circleCompass',
  }),
  mission({
    id: 'g3-2-circle-03',
    unitId: 'g3-2-circle',
    semester: '3-2',
    stageOrder: 27,
    skill: 'circle',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-07]',
    learnerGoal: '컴퍼스로 그릴 원의 반지름을 정해요.',
    parentSummaryTag: '원 그리기',
    prompt: '컴퍼스로 지름 14cm 원을 그리려면 몇 cm 벌릴까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '7',
    hintSteps: ['컴퍼스는 반지름만큼 벌려요.', '지름의 반이 반지름이에요.'],
    solutionSteps: ['14의 반은 7이에요.', '컴퍼스는 7cm 벌려요.'],
    visualModel: 'circle-parts',
    visualConfig: { radius: 7, diameter: 14, hideRadiusUntilReveal: true },
    scaffoldConfig: { kind: 'circle-finder', prompt: '컴퍼스가 나타내는 것은?', options: ['반지름', '지름'] },
    rewardId: 'circleCompass',
  }),
  mission({
    id: 'g3-2-fraction-01',
    unitId: 'g3-2-fraction',
    semester: '3-2',
    stageOrder: 28,
    skill: 'fraction',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-10]',
    learnerGoal: '분모가 같은 분수의 크기를 비교해요.',
    parentSummaryTag: '분수 비교',
    prompt: '2/6와 5/6 중 더 큰 분수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    correctAnswer: '5/6',
    choices: ['2/6', '5/6'],
    hintSteps: ['분모가 같으면 분자를 비교해요.', '5가 2보다 커요.'],
    solutionSteps: ['같은 6칸 중 5칸이 더 크므로 5/6가 더 커요.'],
    visualModel: 'fraction-strip',
    visualConfig: { compareA: '2/6', compareB: '5/6', target: '5/6' },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '색칠된 칸이 더 많은 쪽을 골라요.', options: ['왼쪽', '오른쪽'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-2-fraction-02',
    unitId: 'g3-2-fraction',
    semester: '3-2',
    stageOrder: 29,
    skill: 'fraction',
    difficultyStep: 'medium',
    curriculumCode: '[4수01-11]',
    learnerGoal: '같은 크기의 분수를 찾아요.',
    parentSummaryTag: '같은 크기 분수',
    prompt: '1/2과 같은 크기의 분수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    correctAnswer: '2/4',
    choices: ['1/4', '2/4', '3/4'],
    hintSteps: ['전체를 4칸으로 나누면 반은 2칸이에요.', '2/4는 전체의 반이에요.'],
    solutionSteps: ['1/2과 2/4는 같은 크기예요.'],
    visualModel: 'fraction-strip',
    visualConfig: { compareA: '1/2', compareB: '2/4', target: '2/4' },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '전체의 반을 나타내는 것을 찾아요.', options: ['1칸', '2칸', '3칸'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-2-fraction-03',
    unitId: 'g3-2-fraction',
    semester: '3-2',
    stageOrder: 30,
    skill: 'fraction',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-10]',
    learnerGoal: '상황 속에서 더 큰 분수를 골라요.',
    parentSummaryTag: '분수 상황 비교',
    prompt: '같은 케이크에서 민아는 3/8, 준호는 5/8을 먹었어요. 누가 더 많이 먹었나요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '준호',
    choices: ['민아', '준호'],
    hintSteps: ['분모가 같으니 분자를 비교해요.', '5가 3보다 커요.'],
    solutionSteps: ['5/8이 3/8보다 크므로 준호가 더 많이 먹었어요.'],
    visualModel: 'fraction-strip',
    visualConfig: { compareA: '3/8', compareB: '5/8', target: '준호' },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '색칠된 칸이 더 많은 이름을 골라요.', options: ['민아', '준호'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-2-capacity-weight-01',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 31,
    skill: 'capacity-weight',
    difficultyStep: 'easy',
    curriculumCode: '[4수03-17]',
    learnerGoal: 'L와 mL를 함께 읽어요.',
    parentSummaryTag: '들이 읽기',
    prompt: '물병에 1L 250mL가 들어 있어요. 들이를 써 보세요.',
    answerType: 'capacity',
    answerConfig: capacityAnswerConfig,
    correctAnswer: '1L250mL',
    hintSteps: commonHints.unit,
    solutionSteps: ['L 칸에 1, mL 칸에 250을 써요.'],
    visualModel: 'capacity-beaker',
    visualConfig: { liters: 1, milliliters: 250, totalMl: 1250 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '큰 단위와 작은 단위를 나누어 봐요.', options: ['L', 'mL'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-02',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 32,
    skill: 'capacity-weight',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-20]',
    learnerGoal: 'kg와 g를 함께 읽어요.',
    parentSummaryTag: '무게 읽기',
    prompt: '가방의 무게는 2kg 300g입니다. 무게를 써 보세요.',
    answerType: 'weight',
    answerConfig: weightAnswerConfig,
    correctAnswer: '2kg300g',
    hintSteps: commonHints.unit,
    solutionSteps: ['kg 칸에 2, g 칸에 300을 써요.'],
    visualModel: 'weight-scale',
    visualConfig: { kilograms: 2, grams: 300, totalG: 2300 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '저울의 큰 단위와 작은 단위를 봐요.', options: ['kg', 'g'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-03',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 33,
    skill: 'capacity-weight',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-18]',
    learnerGoal: '들이를 더해 L와 mL로 나타내요.',
    parentSummaryTag: '들이 계산',
    prompt: '주스 1L 400mL와 500mL를 합하면 얼마일까요?',
    answerType: 'capacity',
    answerConfig: capacityAnswerConfig,
    correctAnswer: '1L900mL',
    hintSteps: ['mL끼리 먼저 더해요.', '400mL + 500mL = 900mL예요.'],
    solutionSteps: ['1L는 그대로 두고 900mL를 더해요.', '합은 1L 900mL예요.'],
    visualModel: 'capacity-beaker',
    visualConfig: { leftMl: 1400, rightMl: 500, totalMl: 1900 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '먼저 더할 작은 단위를 골라요.', options: ['L', 'mL'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-graph-01',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 34,
    skill: 'graph',
    difficultyStep: 'easy',
    curriculumCode: '[4수04-01]',
    learnerGoal: '막대그래프에서 한 항목의 값을 읽어요.',
    parentSummaryTag: '그래프 읽기',
    prompt: '막대그래프에서 사과는 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '6',
    hintSteps: ['사과 막대를 찾아요.', '눈금 한 칸은 1개예요.'],
    solutionSteps: ['사과 막대는 6까지 올라가 있어요.', '사과는 6개예요.'],
    visualModel: 'bar-graph',
    visualConfig: { categories: '사과,배,귤', counts: '6,4,5', target: '사과', unitScale: 1 },
    scaffoldConfig: { kind: 'graph-reader', prompt: '먼저 사과 막대를 찾아요.', options: ['사과', '배', '귤'] },
    rewardId: 'graphFlag',
  }),
  mission({
    id: 'g3-2-graph-02',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 35,
    skill: 'graph',
    difficultyStep: 'medium',
    curriculumCode: '[4수04-01]',
    learnerGoal: '막대그래프에서 더 큰 항목을 찾아요.',
    parentSummaryTag: '그래프 비교',
    prompt: '막대그래프에서 가장 많은 운동은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '축구',
    choices: ['축구', '야구', '피구'],
    hintSteps: ['가장 높은 막대를 찾아요.', '축구 막대가 제일 높아요.'],
    solutionSteps: ['축구가 8명으로 가장 많아요.'],
    visualModel: 'bar-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '8,5,6', target: '축구', unitScale: 1 },
    scaffoldConfig: { kind: 'graph-reader', prompt: '가장 높은 막대를 골라요.', options: ['축구', '야구', '피구'] },
    rewardId: 'graphFlag',
  }),
  mission({
    id: 'g3-2-graph-03',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 36,
    skill: 'graph',
    difficultyStep: 'applied',
    curriculumCode: '[4수04-03]',
    learnerGoal: '두 그래프 값을 비교해 차를 구해요.',
    parentSummaryTag: '그래프 해석',
    prompt: '축구 8명, 야구 5명입니다. 축구는 야구보다 몇 명 더 많을까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '3',
    hintSteps: ['두 값을 뺄셈으로 비교해요.', '8 - 5를 계산해요.'],
    solutionSteps: ['8 - 5 = 3이에요.', '축구가 3명 더 많아요.'],
    visualModel: 'bar-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '8,5,6', target: '축구-야구', unitScale: 1 },
    scaffoldConfig: { kind: 'graph-reader', prompt: '비교할 두 막대를 골라요.', options: ['축구', '야구'] },
    rewardId: 'graphFlag',
  }),
]

export function getGrade3Missions(seed = 20260516): Grade3Mission[] {
  void seed
  const orderByUnit = new Map<string, number>()
  return grade3MissionTemplates
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((template) => {
      const nextOrder = (orderByUnit.get(template.unitId) ?? 0) + 1
      orderByUnit.set(template.unitId, nextOrder)
      return { ...template, unitMissionOrder: nextOrder }
    })
}

export function getGrade3MissionsByUnit(unitId: string, seed = 20260516): Grade3Mission[] {
  return getGrade3Missions(seed).filter((mission) => mission.unitId === unitId)
}

export function getGrade3UnitById(id: string): Grade3Unit | undefined {
  return grade3Units.find((unit) => unit.id === id)
}

export function getSafeGrade3Mission(seed = 20260516): Grade3Mission {
  return getGrade3MissionById(SAFE_GRADE3_MISSION_ID, seed)
}

export function getGrade3MissionById(id: string, seed = 20260516): Grade3Mission {
  return getGrade3Missions(seed).find((mission) => mission.id === id) ?? getGrade3Missions(seed)[0]
}

function splitList(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function normalizeCorrectAnswer(answerType: Grade3AnswerType, correctAnswer: string): boolean {
  const text = correctAnswer.trim()
  if (!text) return false
  switch (answerType) {
    case 'integer':
      return /^\d+$/.test(text)
    case 'angle':
      return /^\d+도?$/.test(text) && Number(text.replace(/도$/, '')) <= 360
    case 'fraction': {
      const match = text.match(/^(\d+)\/(\d+)$/)
      return Boolean(match && Number(match[2]) > 0)
    }
    case 'decimal':
      return /^\d+(?:\.\d{1,3})?$/.test(text)
    case 'length':
      return /^(\d+km(\d+m)?|\d+m|\d+cm(\d+mm)?|\d+mm)$/i.test(text)
    case 'time-of-day':
      return /^(\d{1,2})시(\d{1,2})분(\d{1,2})초$/.test(text)
    case 'duration':
      return /^(?:(\d+)시간)?(?:(\d+)분)?(?:(\d+)초)?$/.test(text) && text.length > 0
    case 'capacity':
      return /^(\d+L(\d+mL)?|\d+mL)$/i.test(text)
    case 'weight':
      return /^(\d+kg(\d+g)?|\d+g)$/i.test(text)
    case 'choice':
    case 'label':
      return text.length > 0
    default:
      return false
  }
}

function validateFractionVisual(template: Grade3MissionTemplate, errors: string[]) {
  const total = Number(template.visualConfig.totalParts)
  const shaded = Number(template.visualConfig.shadedParts)
  if (template.visualModel === 'fraction-strip' && Number.isFinite(total) && Number.isFinite(shaded)) {
    if (total <= 0) errors.push(`${template.id}: fraction denominator must be positive`)
    if (shaded < 0 || shaded > total) errors.push(`${template.id}: shaded parts must stay inside total parts`)
  }
}

function validateGraphVisual(template: Grade3MissionTemplate, errors: string[]) {
  if (template.visualModel !== 'bar-graph') return
  const categories = splitList(template.visualConfig.categories)
  const counts = splitList(template.visualConfig.counts).map(Number)
  if (categories.length !== counts.length || categories.length === 0) {
    errors.push(`${template.id}: graph categories and counts must match`)
  }
  if (!Number.isFinite(Number(template.visualConfig.unitScale)) || Number(template.visualConfig.unitScale) <= 0) {
    errors.push(`${template.id}: graph needs a positive unitScale`)
  }
  const target = String(template.visualConfig.target ?? '')
  if (!target.includes('-') && categories.filter((category) => category === target).length !== 1) {
    errors.push(`${template.id}: graph target must appear exactly once`)
  }
}

function validateVisualSafety(template: Grade3MissionTemplate, errors: string[]) {
  if (template.visualModel === 'vertical-operation' && template.visualConfig.result === undefined) {
    errors.push(`${template.id}: vertical-operation needs a masked result`)
  }
  if (template.visualModel === 'line-angle-cards' && template.answerType === 'angle' && !template.visualConfig.hideAngleUntilReveal) {
    errors.push(`${template.id}: angle answer must be hidden before reveal`)
  }
  if (template.visualModel === 'circle-parts' && template.prompt.includes('몇 cm') && !template.visualConfig.hideDiameterUntilReveal && !template.visualConfig.hideRadiusUntilReveal) {
    errors.push(`${template.id}: circle numeric answer must be hidden before reveal`)
  }
}

export function validateGrade3MissionBank(
  templates: Grade3MissionTemplate[] = grade3MissionTemplates
): Grade3ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const stageOrders = new Set<number>()
  const byUnit = new Map<string, { total: number; steps: Record<Grade3DifficultyStep, number> }>()
  const unitIds = new Set(grade3Units.map((unit) => unit.id))
  const rewardIds = new Set<Grade3RewardId>(grade3Units.map((unit) => unit.rewardId))
  const allowedCodes = new Set(grade3Units.flatMap((unit) => unit.curriculumCodes))

  for (const template of templates) {
    if (ids.has(template.id)) errors.push(`Duplicate mission id: ${template.id}`)
    ids.add(template.id)
    if (stageOrders.has(template.stageOrder)) errors.push(`Duplicate stage order: ${template.stageOrder}`)
    stageOrders.add(template.stageOrder)

    const unit = getGrade3UnitById(template.unitId)
    if (!unitIds.has(template.unitId) || !unit) errors.push(`${template.id}: unknown unit ${template.unitId}`)
    if (unit && unit.semester !== template.semester) errors.push(`${template.id}: semester does not match unit`)
    if (!template.curriculumCode.trim()) errors.push(`${template.id}: missing curriculumCode`)
    if (template.curriculumCode && !allowedCodes.has(template.curriculumCode)) {
      errors.push(`${template.id}: curriculumCode is outside the unit scope`)
    }
    if (!template.learnerGoal.trim()) errors.push(`${template.id}: missing learnerGoal`)
    if (!template.parentSummaryTag.trim()) errors.push(`${template.id}: missing parentSummaryTag`)
    if (template.hintSteps.length < 2) errors.push(`${template.id}: needs at least two hints`)
    if (template.solutionSteps.length === 0) errors.push(`${template.id}: missing solution steps`)
    if (template.answerConfig.kind !== template.answerType) errors.push(`${template.id}: answerConfig.kind must match answerType`)
    if (!rewardIds.has(template.rewardId)) errors.push(`${template.id}: unknown reward ${template.rewardId}`)
    if (!normalizeCorrectAnswer(template.answerType, template.correctAnswer)) {
      errors.push(`${template.id}: correctAnswer cannot be normalized`)
    }
    if ((template.answerType === 'choice' || template.answerType === 'label') && (!template.choices || template.choices.length < 2)) {
      errors.push(`${template.id}: ${template.answerType} mission needs at least two choices`)
    }
    if (template.choices) {
      const uniqueChoices = new Set(template.choices)
      if (uniqueChoices.size !== template.choices.length) errors.push(`${template.id}: duplicate choices`)
      const correctCount = template.choices.filter((choice) => choice === template.correctAnswer).length
      if (correctCount !== 1) errors.push(`${template.id}: expected one correct choice, got ${correctCount}`)
    }
    if (template.prompt.length > 72) warnings.push(`${template.id}: prompt is too long for Grade 3`)
    if (template.difficultyStep === 'applied' && !/상황|그림|컴퍼스|묶음|모두|남은|더|보다|합하면|먹었|봉지|몇 명|몇 권|몇 개/.test(template.prompt)) {
      warnings.push(`${template.id}: applied mission should include context or interpretation`)
    }

    validateFractionVisual(template, errors)
    validateGraphVisual(template, errors)
    validateVisualSafety(template, errors)

    const bucket = byUnit.get(template.unitId) ?? { total: 0, steps: { easy: 0, medium: 0, applied: 0 } }
    bucket.total += 1
    bucket.steps[template.difficultyStep] += 1
    byUnit.set(template.unitId, bucket)
  }

  for (const unit of grade3Units) {
    const bucket = byUnit.get(unit.id)
    if (!bucket) {
      errors.push(`${unit.id}: Alpha expects 3 missions, got 0`)
      continue
    }
    if (bucket.total !== 3) errors.push(`${unit.id}: Alpha expects 3 missions, got ${bucket.total}`)
    for (const step of ['easy', 'medium', 'applied'] as const) {
      if (bucket.steps[step] !== 1) errors.push(`${unit.id}: Alpha expects one ${step} mission, got ${bucket.steps[step]}`)
    }
  }

  if (templates.length !== 36) errors.push(`Alpha expects 36 missions, got ${templates.length}`)
  if (!ids.has(SAFE_GRADE3_MISSION_ID)) errors.push(`Safe mission id is missing: ${SAFE_GRADE3_MISSION_ID}`)

  return { errors, warnings }
}
