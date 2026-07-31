import type { Grade3AnswerType } from './grade3-answer-normalizers'

export type Grade3Semester = '3-1' | '3-2'
export type Grade3DifficultyStep = 'easy' | 'medium' | 'applied'
export type Grade3CognitiveDomain = 'knowing' | 'applying' | 'reasoning'
export type Grade3Mode = 'basic' | 'practice'
export type Grade3TaskAction =
  | 'recognize'
  | 'classify'
  | 'compare'
  | 'calculate'
  | 'measure'
  | 'construct'
  | 'model'
  | 'interpret'
  | 'explain'
  | 'analyze_error'
  | 'reason'
export type Grade3VisualSemantics = 'decorative' | 'schematic' | 'quantitative'

interface Grade3QualityMetadata {
  taskActions: Grade3TaskAction[]
  visualSemantics: Grade3VisualSemantics
  cognitiveDomain: Grade3CognitiveDomain
  directCurriculumCodes: string[]
  authoredSourceKey: string
}

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
  | 'distance-road'
  | 'clock-seconds'
  | 'fraction-strip'
  | 'decimal-grid'
  | 'circle-parts'
  | 'capacity-beaker'
  | 'weight-scale'
  | 'tonne-scale'
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

export interface Grade3MissionTemplate extends Grade3QualityMetadata {
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
    subtitle: 'L, mL, kg, g, t의 관계를 읽고 실생활 계산에 적용해요.',
    curriculumCodes: [
      '[4수03-17]',
      '[4수03-18]',
      '[4수03-19]',
      '[4수03-20]',
      '[4수03-21]',
      '[4수03-22]',
      '[4수03-23]',
    ],
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

type Grade3MissionTemplateSource = Omit<Grade3MissionTemplate, keyof Grade3QualityMetadata>

function quality(
  taskAction: Grade3TaskAction,
  visualSemantics: Grade3VisualSemantics
): Grade3QualityMetadata {
  return {
    taskActions: [taskAction],
    visualSemantics,
    cognitiveDomain: 'knowing',
    directCurriculumCodes: [],
    authoredSourceKey: '',
  }
}

const grade3QualityMetadataBySourceId: Record<string, Grade3QualityMetadata> = {
  'g3-1-add-sub-01': quality('calculate', 'schematic'),
  'g3-1-add-sub-02': quality('calculate', 'schematic'),
  'g3-1-add-sub-03': quality('model', 'schematic'),
  'g3-1-lines-01': quality('recognize', 'schematic'),
  'g3-1-lines-02': quality('classify', 'quantitative'),
  'g3-1-lines-03': quality('classify', 'quantitative'),
  'g3-1-division-01': quality('model', 'quantitative'),
  'g3-1-division-02': quality('calculate', 'quantitative'),
  'g3-1-division-03': quality('model', 'quantitative'),
  'g3-1-multiply-01': quality('calculate', 'quantitative'),
  'g3-1-multiply-02': quality('calculate', 'quantitative'),
  'g3-1-multiply-03': quality('model', 'quantitative'),
  'g3-1-length-time-01': quality('measure', 'quantitative'),
  'g3-1-length-time-02': quality('interpret', 'quantitative'),
  'g3-1-length-time-03': quality('calculate', 'quantitative'),
  'g3-1-fraction-decimal-01': quality('interpret', 'quantitative'),
  'g3-1-fraction-decimal-02': quality('interpret', 'quantitative'),
  'g3-1-fraction-decimal-03': quality('model', 'quantitative'),
  'g3-2-multiply-01': quality('calculate', 'quantitative'),
  'g3-2-multiply-02': quality('calculate', 'quantitative'),
  'g3-2-multiply-03': quality('model', 'quantitative'),
  'g3-2-division-01': quality('calculate', 'quantitative'),
  'g3-2-division-02': quality('calculate', 'quantitative'),
  'g3-2-division-03': quality('model', 'quantitative'),
  'g3-2-circle-01': quality('recognize', 'schematic'),
  'g3-2-circle-02': quality('calculate', 'quantitative'),
  'g3-2-circle-03': quality('construct', 'quantitative'),
  'g3-2-fraction-01': quality('compare', 'quantitative'),
  'g3-2-fraction-02': quality('classify', 'quantitative'),
  'g3-2-fraction-03': quality('compare', 'quantitative'),
  'g3-2-capacity-weight-01': quality('measure', 'quantitative'),
  'g3-2-capacity-weight-02': quality('measure', 'quantitative'),
  'g3-2-capacity-weight-03': quality('calculate', 'quantitative'),
  'g3-2-capacity-weight-04': quality('model', 'quantitative'),
  'g3-2-capacity-weight-05': quality('model', 'quantitative'),
  'g3-2-capacity-weight-06': quality('calculate', 'quantitative'),
  'g3-2-capacity-weight-07': quality('calculate', 'quantitative'),
  'g3-2-graph-01': quality('interpret', 'quantitative'),
  'g3-2-graph-02': quality('compare', 'quantitative'),
  'g3-2-graph-03': quality('calculate', 'quantitative'),
}

function mission(source: Grade3MissionTemplateSource): Grade3MissionTemplate {
  const metadata = grade3QualityMetadataBySourceId[source.id]
  if (!metadata) throw new Error(`${source.id}: missing explicit Grade 3 quality metadata`)
  const cognitiveDomainByDifficulty: Record<Grade3DifficultyStep, Grade3CognitiveDomain> = {
    easy: 'knowing',
    medium: 'applying',
    applied: 'reasoning',
  }
  return {
    ...source,
    ...metadata,
    cognitiveDomain: cognitiveDomainByDifficulty[source.difficultyStep],
    directCurriculumCodes: [source.curriculumCode],
    authoredSourceKey: source.id,
  }
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

const legacyGrade3MissionTemplates: Grade3MissionTemplate[] = [
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
    learnerGoal: '직각과 비교해 예각을 찾아요.',
    parentSummaryTag: '각의 종류',
    prompt: '직각보다 작은 각은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '예각',
    choices: ['예각', '직각', '둔각'],
    hintSteps: ['표시한 각을 직각과 나란히 놓아 보세요.', '직각보다 작은 각은 예각이에요.'],
    solutionSteps: ['직각보다 작은 각을 예각이라고 해요.'],
    visualModel: 'line-angle-cards',
    visualConfig: { rayEndX: 138, rayEndY: 42, showRightAngleGuide: true },
    scaffoldConfig: { kind: 'angle-classifier', prompt: '직각과 비교해요.', options: ['직각보다 작다', '직각과 같다', '직각보다 크다'] },
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
    learnerGoal: '직각과 비교해 표시한 각을 분류해요.',
    parentSummaryTag: '각의 종류',
    prompt: '그림에 표시한 각은 직각과 비교할 때 어떤 각일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    correctAnswer: '둔각',
    choices: ['예각', '직각', '둔각'],
    hintSteps: ['두 반직선 사이가 직각보다 더 벌어졌는지 살펴봐요.', '직각보다 큰 각은 둔각이에요.'],
    solutionSteps: ['표시한 두 반직선 사이의 각은 직각보다 커요.', '따라서 둔각이에요.'],
    visualModel: 'line-angle-cards',
    visualConfig: { rayEndX: 34, rayEndY: 34, showRightAngleGuide: true },
    scaffoldConfig: { kind: 'angle-classifier', prompt: '표시한 각을 직각과 비교해요.', options: ['직각보다 작다', '직각과 같다', '직각보다 크다'] },
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
    visualConfig: { centimeters: 4, millimeters: 7, maxMm: 60 },
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
    visualConfig: { target: '원의 중심' },
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
    learnerGoal: '중심과 반지름을 정해 컴퍼스로 원을 구성해요.',
    parentSummaryTag: '원 그리기',
    prompt: '지름 12cm인 원을 구성하세요. ① 가상 컴퍼스 폭을 정하세요. ② 그 폭으로 원을 그린 뒤 폭을 답에 쓰세요.',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '6',
    hintSteps: ['지름은 중심을 지나 원 둘레의 두 점을 잇는 길이예요.', '컴퍼스 폭은 지름의 절반이에요. 폭을 정한 뒤 그 폭으로 원을 그려요.'],
    solutionSteps: ['지름 12cm의 절반은 6cm예요.', '가상 컴퍼스 폭을 6으로 정하고 원 그리기를 완료해요.', '그린 폭과 답 6을 같게 쓰면 구성이 완성돼요.'],
    visualModel: 'circle-parts',
    visualConfig: { mode: 'construction', centerLabel: 'O', diameter: 12, hideRadiusUntilReveal: true },
    scaffoldConfig: { kind: 'circle-finder', prompt: '원의 중심에 고정할 컴퍼스 부분을 확인해요.', options: ['바늘 다리', '연필 다리'] },
    rewardId: 'circleCompass',
  }),
  mission({
    id: 'g3-2-fraction-01',
    unitId: 'g3-2-fraction',
    semester: '3-2',
    stageOrder: 28,
    skill: 'fraction',
    difficultyStep: 'easy',
    curriculumCode: '[4수01-11]',
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
    curriculumCode: '[4수01-10]',
    learnerGoal: '진분수의 뜻을 알고 분류해요.',
    parentSummaryTag: '분수 종류',
    prompt: '3/4은 진분수, 가분수, 대분수 중 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    correctAnswer: '진분수',
    choices: ['진분수', '가분수', '대분수'],
    hintSteps: ['분자와 분모의 크기를 비교해요.', '3은 4보다 작아요.'],
    solutionSteps: ['분자가 분모보다 작은 분수는 진분수예요.', '3은 4보다 작으므로 3/4은 진분수예요.'],
    visualModel: 'fraction-strip',
    visualConfig: { totalParts: 4, shadedParts: 3 },
    scaffoldConfig: { kind: 'fraction-strip', prompt: '분자가 분모보다 작은지 확인해요.', options: ['작다', '같다', '크다'] },
    rewardId: 'fractionLantern',
  }),
  mission({
    id: 'g3-2-fraction-03',
    unitId: 'g3-2-fraction',
    semester: '3-2',
    stageOrder: 30,
    skill: 'fraction',
    difficultyStep: 'applied',
    curriculumCode: '[4수01-11]',
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
    learnerGoal: '용기 눈금으로 들이를 측정해 읽어요.',
    parentSummaryTag: '들이 측정',
    prompt: '눈금 있는 용기의 물 높이를 읽어 들이를 몇 L 몇 mL로 써 보세요.',
    answerType: 'capacity',
    answerConfig: capacityAnswerConfig,
    correctAnswer: '1L250mL',
    hintSteps: ['굵은 눈금은 500mL 간격이고 작은 눈금 한 칸은 250mL예요.', '물 높이는 1L 눈금에서 작은 눈금 한 칸 위에 있어요.'],
    solutionSteps: ['1L 눈금 위의 작은 눈금 한 칸은 250mL를 더한 위치예요.', '들이는 1L 250mL예요.'],
    visualModel: 'capacity-beaker',
    visualConfig: { mode: 'scale-read', totalMl: 1250, maxTotal: 2000, tickStep: 250, labelStep: 500 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '물 높이 바로 아래의 굵은 눈금과 작은 눈금을 함께 읽어요.', options: ['굵은 눈금', '작은 눈금'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-02',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 32,
    skill: 'capacity-weight',
    difficultyStep: 'easy',
    curriculumCode: '[4수03-20]',
    learnerGoal: '저울 눈금으로 무게를 측정해 읽어요.',
    parentSummaryTag: '무게 측정',
    prompt: '저울 바늘이 가리키는 무게를 몇 kg 몇 g으로 써 보세요.',
    answerType: 'weight',
    answerConfig: weightAnswerConfig,
    correctAnswer: '2kg300g',
    hintSteps: ['숫자가 적힌 큰 눈금은 500g 간격이고 작은 눈금 한 칸은 100g이에요.', '바늘은 2kg 눈금에서 작은 눈금 세 칸 지난 곳을 가리켜요.'],
    solutionSteps: ['2kg에서 작은 눈금 세 칸은 300g을 더한 위치예요.', '무게는 2kg 300g이에요.'],
    visualModel: 'weight-scale',
    visualConfig: { mode: 'scale-read', totalG: 2300, maxTotal: 3000, tickStep: 100, labelStep: 500 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '바늘 바로 전의 큰 눈금과 지난 작은 눈금을 함께 읽어요.', options: ['큰 눈금', '작은 눈금'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-03',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 33,
    skill: 'capacity-weight',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-19]',
    learnerGoal: '받아올림이 있는 들이의 덧셈을 해요.',
    parentSummaryTag: '들이 계산',
    prompt: '물통에 2L 750mL가 있고 650mL를 더 부었어요. 모두 얼마일까요?',
    answerType: 'capacity',
    answerConfig: capacityAnswerConfig,
    correctAnswer: '3L400mL',
    hintSteps: ['mL끼리 먼저 더해요.', '1400mL는 1L 400mL로 바꿔요.'],
    solutionSteps: ['750mL + 650mL = 1400mL예요.', '2L + 1L 400mL = 3L 400mL예요.'],
    visualModel: 'capacity-beaker',
    visualConfig: { mode: 'operation', leftMl: 2750, rightMl: 650, operator: '+', totalMl: 3400 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '먼저 더할 작은 단위를 골라요.', options: ['L', 'mL'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-04',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 34,
    skill: 'capacity-weight',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-18]',
    learnerGoal: '몇 L 몇 mL를 몇 mL로 바꾸어요.',
    parentSummaryTag: '들이 단위 관계',
    prompt: '3L 250mL는 모두 몇 mL일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '3250',
    hintSteps: ['1L는 1000mL예요.', '3L는 3000mL이고 250mL를 더해요.'],
    solutionSteps: ['3L = 3000mL예요.', '3000mL + 250mL = 3250mL예요.'],
    visualModel: 'capacity-beaker',
    visualConfig: { mode: 'conversion', liters: 3, milliliters: 250, totalMl: 3250 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '먼저 L를 mL로 바꾸어요.', options: ['1000배', '100배'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-05',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 35,
    skill: 'capacity-weight',
    difficultyStep: 'medium',
    curriculumCode: '[4수03-21]',
    learnerGoal: '몇 kg 몇 g을 몇 g으로 바꾸어요.',
    parentSummaryTag: '무게 단위 관계',
    prompt: '2kg 300g은 모두 몇 g일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '2300',
    hintSteps: ['1kg은 1000g이에요.', '2kg은 2000g이고 300g을 더해요.'],
    solutionSteps: ['2kg = 2000g이에요.', '2000g + 300g = 2300g이에요.'],
    visualModel: 'weight-scale',
    visualConfig: { mode: 'conversion', kilograms: 2, grams: 300, totalG: 2300 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '먼저 kg을 g으로 바꾸어요.', options: ['1000배', '100배'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-06',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 36,
    skill: 'capacity-weight',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-22]',
    learnerGoal: 't와 kg의 관계를 실생활 무게에 적용해요.',
    parentSummaryTag: '톤 단위 관계',
    prompt: '한 대에 1t인 화물차 4대의 무게는 모두 몇 kg일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    correctAnswer: '4000',
    hintSteps: ['1t는 1000kg이에요.', '1000kg이 4번 있어요.'],
    solutionSteps: ['1t = 1000kg이에요.', '1000 × 4 = 4000이므로 4000kg이에요.'],
    visualModel: 'tonne-scale',
    visualConfig: { tonnes: 4, kilogramsPerTonne: 1000 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '1t이 몇 번 있는지 세어 보세요.', options: ['3번', '4번', '5번'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-capacity-weight-07',
    unitId: 'g3-2-capacity-weight',
    semester: '3-2',
    stageOrder: 37,
    skill: 'capacity-weight',
    difficultyStep: 'applied',
    curriculumCode: '[4수03-23]',
    learnerGoal: '받아내림이 있는 무게의 뺄셈을 해요.',
    parentSummaryTag: '무게 계산',
    prompt: '4kg 200g 밀가루에서 1kg 750g을 썼어요. 남은 무게는 얼마일까요?',
    answerType: 'weight',
    answerConfig: weightAnswerConfig,
    correctAnswer: '2kg450g',
    hintSteps: ['200g에서 750g을 바로 뺄 수 없어요.', '1kg을 1000g으로 바꾸어 받아내림해요.'],
    solutionSteps: ['4kg 200g은 3kg 1200g으로 바꿀 수 있어요.', '3kg 1200g - 1kg 750g = 2kg 450g이에요.'],
    visualModel: 'weight-scale',
    visualConfig: { mode: 'operation', leftG: 4200, rightG: 1750, operator: '-', totalG: 2450 },
    scaffoldConfig: { kind: 'unit-reader', prompt: '받아내릴 단위를 골라요.', options: ['kg', 'g'] },
    rewardId: 'unitBottle',
  }),
  mission({
    id: 'g3-2-graph-01',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 38,
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
    visualConfig: { categories: '사과,배,귤', counts: '6,4,5', target: '사과', unitScale: 1, unitLabel: '개' },
    scaffoldConfig: { kind: 'graph-reader', prompt: '먼저 사과 막대를 찾아요.', options: ['사과', '배', '귤'] },
    rewardId: 'graphFlag',
  }),
  mission({
    id: 'g3-2-graph-02',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 39,
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
    visualConfig: { categories: '축구,야구,피구', counts: '8,5,6', target: '축구', unitScale: 1, unitLabel: '명' },
    scaffoldConfig: { kind: 'graph-reader', prompt: '가장 높은 막대를 골라요.', options: ['축구', '야구', '피구'] },
    rewardId: 'graphFlag',
  }),
  mission({
    id: 'g3-2-graph-03',
    unitId: 'g3-2-graph',
    semester: '3-2',
    stageOrder: 40,
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
    visualConfig: { categories: '축구,야구,피구', counts: '8,5,6', target: '축구-야구', unitScale: 1, unitLabel: '명' },
    scaffoldConfig: { kind: 'graph-reader', prompt: '비교할 두 막대를 골라요.', options: ['축구', '야구'] },
    rewardId: 'graphFlag',
  }),
]

type Grade3ExpansionSlot = {
  sourceId: string
  curriculumCode: string
  directCurriculumCodes?: string[]
}

const expansionSlotsByUnit: Record<string, Grade3ExpansionSlot[]> = {
  'g3-1-add-sub': [
    ['01', '[4수01-03]'], ['02', '[4수01-03]'], ['03', '[4수01-03]'],
    ['01', '[4수01-03]'], ['02', '[4수01-03]'], ['03', '[4수01-03]'], ['03', '[4수01-03]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-1-add-sub-${suffix}`, curriculumCode })),
  'g3-1-lines': [
    ['02', '[4수03-02]'], ['01', '[4수03-01]'], ['01', '[4수03-01]'],
    ['01', '[4수03-01]'], ['02', '[4수03-02]'], ['03', '[4수03-02]'], ['03', '[4수03-02]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-1-lines-${suffix}`, curriculumCode })),
  'g3-1-division': [
    ['02', '[4수01-06]'], ['01', '[4수01-05]'], ['01', '[4수01-05]'],
    ['01', '[4수01-05]'], ['02', '[4수01-06]'], ['03', '[4수01-06]'], ['03', '[4수01-06]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-1-division-${suffix}`, curriculumCode })),
  'g3-1-multiply': [
    ['01', '[4수01-04]'], ['02', '[4수01-04]'], ['03', '[4수01-04]'],
    ['01', '[4수01-04]'], ['02', '[4수01-04]'], ['03', '[4수01-04]'], ['03', '[4수01-04]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-1-multiply-${suffix}`, curriculumCode })),
  'g3-1-length-time': [
    { sourceId: 'g3-1-length-time-02', curriculumCode: '[4수03-13]' },
    { sourceId: 'g3-1-length-time-03', curriculumCode: '[4수03-14]' },
    { sourceId: 'g3-1-length-time-01', curriculumCode: '[4수03-16]' },
    { sourceId: 'g3-1-length-time-03', curriculumCode: '[4수03-14]' },
    { sourceId: 'g3-1-length-time-01', curriculumCode: '[4수03-15]' },
    { sourceId: 'g3-1-length-time-01', curriculumCode: '[4수03-16]' },
    { sourceId: 'g3-1-length-time-01', curriculumCode: '[4수03-16]' },
  ],
  'g3-1-fraction-decimal': [
    ['02', '[4수01-12]'], ['01', '[4수01-09]'], ['01', '[4수01-09]'],
    ['01', '[4수01-09]'], ['02', '[4수01-12]'], ['03', '[4수01-09]'], ['03', '[4수01-09]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-1-fraction-decimal-${suffix}`, curriculumCode })),
  'g3-2-multiply': [
    ['01', '[4수01-04]'], ['02', '[4수01-04]'], ['03', '[4수01-04]'],
    ['01', '[4수01-04]'], ['02', '[4수01-04]'], ['03', '[4수01-04]'], ['03', '[4수01-04]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-2-multiply-${suffix}`, curriculumCode })),
  'g3-2-division': [
    ['01', '[4수01-06]'], ['02', '[4수01-06]'], ['03', '[4수01-06]'],
    ['01', '[4수01-06]'], ['02', '[4수01-06]'], ['03', '[4수01-06]'], ['03', '[4수01-06]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-2-division-${suffix}`, curriculumCode })),
  'g3-2-circle': [
    ['03', '[4수03-07]'], ['01', '[4수03-06]'], ['02', '[4수03-06]'],
    ['03', '[4수03-07]'], ['02', '[4수03-06]'], ['01', '[4수03-06]'], ['03', '[4수03-07]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-2-circle-${suffix}`, curriculumCode })),
  'g3-2-fraction': [
    ['02', '[4수01-10]'], ['01', '[4수01-11]'], ['01', '[4수01-11]'],
    ['01', '[4수01-11]'], ['02', '[4수01-10]'], ['03', '[4수01-11]'], ['03', '[4수01-11]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-2-fraction-${suffix}`, curriculumCode })),
  'g3-2-capacity-weight': [
    {
      sourceId: 'g3-2-capacity-weight-04',
      curriculumCode: '[4수03-19]',
      directCurriculumCodes: ['[4수03-19]'],
    },
    {
      sourceId: 'g3-2-capacity-weight-06',
      curriculumCode: '[4수03-22]',
      directCurriculumCodes: ['[4수03-22]', '[4수03-23]'],
    },
    {
      sourceId: 'g3-2-capacity-weight-06',
      curriculumCode: '[4수03-22]',
      directCurriculumCodes: ['[4수03-22]', '[4수03-23]'],
    },
  ],
  'g3-2-graph': [
    ['03', '[4수04-03]'], ['01', '[4수04-01]'], ['02', '[4수04-01]'],
    ['03', '[4수04-03]'], ['01', '[4수04-01]'], ['02', '[4수04-01]'], ['03', '[4수04-03]'],
  ].map(([suffix, curriculumCode]) => ({ sourceId: `g3-2-graph-${suffix}`, curriculumCode })),
}

const expansionDomains: Grade3CognitiveDomain[] = [
  'knowing', 'knowing', 'knowing', 'applying', 'applying', 'applying', 'reasoning',
]
const expansionDifficulty: Record<Grade3CognitiveDomain, Grade3DifficultyStep> = {
  knowing: 'easy',
  applying: 'medium',
  reasoning: 'applied',
}
const expansionActions: Grade3TaskAction[] = [
  'recognize', 'interpret', 'calculate', 'model', 'interpret', 'calculate', 'analyze_error',
]
const expansionPromptPrefixes = [
  '기초 카드: ',
  '그림 읽기: ',
  '직접 확인: ',
  '교실 준비: ',
  '학교 행사: ',
  '생활 적용: ',
  '오류 검산: ',
]

const authoredExpansionPrompts: Record<string, string[]> = {
  'g3-1-add-sub': [
    '식 카드 248 + 137을 일의 자리부터 계산하면 얼마일까요?',
    '604 - 278 세로식에서 받아내림 자리를 찾고 차를 구해요.',
    '425권 중 168권을 빌린 기록을 식으로 나타내 남은 책 수를 구해요.',
    '과학책 248권과 동화책 137권을 모두 꽂으면 몇 권일까요?',
    '종이 604장 중 278장을 썼어요. 남은 종이는 몇 장일까요?',
    '425 - 168에 맞는 도서관 상황을 그림으로 나타내고 답을 구해요.',
    '친구가 425 - 168 = 267이라고 했어요. 그림과 계산으로 고쳐요.',
  ],
  'g3-1-lines': [
    '직각 그림과 비교해 더 작은 각의 이름을 골라요.',
    '두 끝점이 표시된 길 조각은 어떤 선인지 골라요.',
    '직선·반직선·선분 그림 중 끝점이 두 개인 선을 찾아요.',
    '줄자에서 시작점과 끝점 사이를 나타내는 선은 무엇일까요?',
    '접은 종이의 직각보다 작은 모서리 각은 무엇일까요?',
    '활짝 열린 문 그림의 각을 직각과 비교해 이름을 골라요.',
    '친구는 그림의 각이 직각이라고 했어요. 직각보다 큰지 검산해요.',
  ],
  'g3-1-division': [
    '4씩 묶은 그림으로 28 ÷ 4의 몫을 직접 확인해요.',
    '12개를 3개의 같은 묶음으로 나눌 때 한 묶음은 몇 개일까요?',
    '사탕 그림을 같은 세 묶음으로 나누고 한 묶음 수를 써요.',
    '색연필 12자루를 3명에게 같게 나누면 한 명은 몇 자루일까요?',
    '스티커 28장을 4명에게 모두 나누면 한 명은 몇 장일까요?',
    '연필 32자루를 8자루씩 묶음으로 포장하면 몇 묶음일까요?',
    '친구가 32 ÷ 8 = 3이라고 했어요. 묶음 그림으로 고쳐요.',
  ],
  'g3-1-multiply': [
    '30이 네 줄인 배열 그림을 보고 곱을 구해요.',
    '23을 20과 3으로 나눈 그림에서 23 × 3을 계산해요.',
    '21개씩 네 묶음인 그림을 곱셈식으로 나타내요.',
    '연필 30자루 묶음이 4개예요. 모두 몇 자루일까요?',
    '교실 세 곳에 의자가 23개씩 있어요. 모두 몇 개일까요?',
    '공 21개씩 든 상자 4개를 생활 상황의 곱셈으로 해결해요.',
    '친구가 그림의 21 × 4를 74라고 했어요. 묶음을 세어 고쳐요.',
  ],
  'g3-1-length-time': [
    '시계 그림의 시·분·초 바늘을 차례로 읽어 시각을 써요.',
    '2분 15초와 35초를 초 단위로 직접 더해요.',
    '등산로의 km와 m 거리 표지를 같은 단위로 바꾸어 읽어요.',
    '달리기 2분 15초 뒤 35초를 더 달린 상황의 시간을 구해요.',
    '공책 길이 그림을 cm와 mm로 나누어 읽어요.',
    '산책한 km와 m를 합해 전체 거리를 구해요.',
    '친구의 km와 m 받아올림을 그림으로 검산해 고쳐요.',
  ],
  'g3-1-fraction-decimal': [
    '10칸 그림에서 색칠한 7칸을 소수로 직접 읽어요.',
    '전체 5칸과 색칠한 2칸을 찾아 분수로 써요.',
    '분수 띠 그림에서 분모와 분자의 역할을 말하고 답을 써요.',
    '리본 5칸 중 2칸을 쓴 상황을 분수로 나타내요.',
    '물감판 10칸 중 7칸을 칠한 양을 소수로 나타내요.',
    '피자 그림의 8조각 중 먹은 3조각을 분수로 나타내요.',
    '친구가 먹은 양을 8/3이라고 했어요. 그림으로 고쳐요.',
  ],
  'g3-2-multiply': [
    '42를 40과 2로 나눈 배열 그림에서 42 × 2를 구해요.',
    '12 × 13 넓이 그림을 10칸과 3칸으로 나누어 계산해요.',
    '14명이 여섯 줄인 그림을 곱셈식으로 나타내요.',
    '상자마다 42개씩 두 상자를 모두 모으면 몇 개일까요?',
    '공연장 12줄에 13명씩 앉은 상황의 전체 인원을 구해요.',
    '운동장에 14명씩 6줄로 선 상황을 곱셈으로 해결해요.',
    '친구가 그림의 14 × 6을 74라고 했어요. 나누어 계산해 고쳐요.',
  ],
  'g3-2-division': [
    '17개를 5개씩 묶은 그림에서 나머지를 찾아요.',
    '29개를 4개씩 묶어 몫을 직접 확인해요.',
    '26개를 6개씩 묶음으로 나누고 나머지를 써요.',
    '구슬 17개를 5개씩 봉지에 넣으면 나머지는 몇 개일까요?',
    '학생 29명을 4명씩 모둠으로 나눈 상황의 몫을 구해요.',
    '쿠키 26개를 6개씩 묶음으로 포장하고 나머지를 구해요.',
    '친구가 그림의 나머지를 3이라고 했어요. 묶음 수로 검산해요.',
  ],
  'g3-2-circle': [
    '지름 12cm인 원을 구성해요. ① 컴퍼스 폭을 정해요. ② 그 폭으로 원을 그린 뒤 답을 써요.',
    '원 그림에서 모든 반지름이 시작되는 가운데 점을 찾아요.',
    '반지름 두 개를 이은 그림에서 지름을 직접 계산해요.',
    '원형 배지를 만들어요. ① 컴퍼스 폭을 정해요. ② 그 폭으로 원을 그린 뒤 답을 써요.',
    '반지름 6cm인 원형 표지의 지름은 몇 cm일까요?',
    '운동장 원 그림에서 가운데 기준점을 무엇이라고 할까요?',
    '친구의 원 그림을 검산해요. ① 컴퍼스 폭을 정해요. ② 그 폭으로 원을 그린 뒤 답을 써요.',
  ],
  'g3-2-fraction': [
    '3/4 그림에서 분자와 분모를 비교해 분수 종류를 골라요.',
    '같은 6칸인 두 분수 그림에서 더 큰 쪽을 찾아요.',
    '2/6와 5/6 띠를 같은 길이로 놓고 크기를 직접 비교해요.',
    '같은 케이크의 2/6와 5/6 중 더 많이 남은 쪽을 골라요.',
    '과자 4칸 중 3칸을 나타낸 상황의 분수 종류를 골라요.',
    '민아와 준호가 먹은 양의 그림을 비교해 더 큰 쪽을 골라요.',
    '친구는 민아의 3/8이 준호의 5/8보다 크다고 했어요. 누가 더 많이 먹었는지 골라 고쳐요.',
  ],
  'g3-2-capacity-weight': [
    '1L 200mL와 300mL를 더하면 모두 몇 L 몇 mL일까요?',
    '2t에서 500kg을 내린 무게를 kg으로 직접 계산해요.',
    '화물 상황에 t와 kg 관계를 적용해 남은 무게를 구해요.',
  ],
  'g3-2-graph': [
    '축구와 야구 막대의 높이를 읽고 차를 직접 구해요.',
    '사과 막대 그림이 가리키는 값을 눈금으로 읽어요.',
    '세 운동 막대 그림에서 가장 높은 항목을 찾아요.',
    '학급 운동 조사에서 축구와 야구의 인원 차는 몇 명일까요?',
    '과일 판매 그림에서 사과 막대의 값을 읽어 적용해요.',
    '운동 선택 상황에서 가장 많은 항목을 막대 높이로 골라요.',
    '친구가 축구와 야구의 차를 2명이라 했어요. 그림으로 검산해요.',
  ],
}

function distanceMission(
  id: string,
  stageOrder: number,
  cognitiveDomain: Grade3CognitiveDomain,
): Grade3MissionTemplate {
  const common = {
    id,
    unitId: 'g3-1-length-time',
    semester: '3-1' as const,
    stageOrder,
    skill: 'length-time' as const,
    difficultyStep: expansionDifficulty[cognitiveDomain],
    cognitiveDomain,
    curriculumCode: '[4수03-16]',
    directCurriculumCodes: ['[4수03-16]'],
    visualModel: 'distance-road' as const,
    visualSemantics: 'quantitative' as const,
    scaffoldConfig: {
      kind: 'unit-reader' as const,
      prompt: 'km와 m를 같은 단위로 바꾸어 확인해요.',
      options: ['1km = 1000m', '1km = 100m'],
    },
    rewardId: 'measureBoots' as const,
    authoredSourceKey: id,
  }
  if (cognitiveDomain === 'knowing') {
    return {
      ...common,
      taskActions: ['calculate'],
      learnerGoal: 'km와 m의 관계를 직접 바꾸어 확인해요.',
      parentSummaryTag: 'km와 m 관계',
      prompt: '등산로 표지의 3km 250m는 모두 몇 m일까요?',
      answerType: 'integer',
      answerConfig: integerAnswerConfig,
      correctAnswer: '3250',
      hintSteps: ['1km는 1000m예요.', '3000m와 250m를 더해요.'],
      solutionSteps: ['3km는 3000m예요.', '3000m + 250m = 3250m예요.'],
      visualConfig: { mode: 'convert', kilometers: 3, meters: 250, hideResultUntilReveal: true },
    }
  }
  if (cognitiveDomain === 'applying') {
    return {
      ...common,
      taskActions: ['model'],
      learnerGoal: '이동 거리를 km와 m로 합해요.',
      parentSummaryTag: 'km와 m 적용',
      prompt: '2km 600m를 걷고 400m를 더 걸었어요. 모두 몇 km 몇 m일까요?',
      answerType: 'length',
      answerConfig: kmLengthAnswerConfig,
      correctAnswer: '3km0m',
      hintSteps: ['600m와 400m를 먼저 더해요.', '1000m는 1km예요.'],
      solutionSteps: ['600m + 400m = 1000m예요.', '2km + 1km = 3km이므로 3km 0m예요.'],
      visualConfig: { mode: 'add', kilometers: 2, meters: 600, addMeters: 400, hideResultUntilReveal: true },
    }
  }
  return {
    ...common,
    taskActions: ['analyze_error'],
    learnerGoal: 'km와 m의 받아올림 오류를 찾아 고쳐요.',
    parentSummaryTag: 'km와 m 오류 검산',
    prompt: '1km 800m에 300m를 더해 1km 100m라고 했어요. 바르게 고치면?',
    answerType: 'length',
    answerConfig: kmLengthAnswerConfig,
    correctAnswer: '2km100m',
    hintSteps: ['800m + 300m는 1100m예요.', '1100m는 1km 100m예요.'],
    solutionSteps: ['1km 800m + 300m = 1km 1100m예요.', '1km를 받아올리면 2km 100m예요.'],
    visualConfig: { mode: 'error-check', kilometers: 1, meters: 800, addMeters: 300, hideResultUntilReveal: true },
  }
}

function materiallyDistinctExpansion(
  id: string,
  stageOrder: number,
  cognitiveDomain: Grade3CognitiveDomain,
): Grade3MissionTemplate | null {
  if (id === 'g3-1-multiply-09') {
    return {
      ...legacyGrade3MissionTemplates.find((mission) => mission.id === 'g3-1-multiply-03')!,
      id,
      stageOrder,
      difficultyStep: 'medium',
      cognitiveDomain,
      directCurriculumCodes: ['[4수01-04]'],
      authoredSourceKey: id,
      taskActions: ['model'],
      learnerGoal: '좌석의 줄 수와 한 줄의 좌석 수를 곱셈으로 나타내요.',
      parentSummaryTag: '곱셈 좌석 배열',
      prompt: '강당에 한 줄마다 좌석이 18개씩 있고, 이런 줄이 5줄 있어요. 좌석은 모두 몇 개일까요?',
      correctAnswer: '90',
      hintSteps: ['18개씩 있는 줄이 5개예요.', '18 × 5를 10 × 5와 8 × 5로 나누어 계산해요.'],
      solutionSteps: ['18 × 5 = 50 + 40 = 90이에요.', '좌석은 모두 90개예요.'],
      visualConfig: { rows: 5, cols: 18, tens: 10, ones: 8, product: 90 },
      scaffoldConfig: {
        kind: 'array-counter',
        prompt: '한 줄의 좌석 수와 줄 수를 차례로 골라요.',
        options: ['18개와 5줄', '5개와 18줄', '18개와 18줄'],
      },
    }
  }
  if (id === 'g3-1-fraction-decimal-05') {
    return {
      ...legacyGrade3MissionTemplates.find((mission) => mission.id === 'g3-1-fraction-decimal-01')!,
      id,
      stageOrder,
      difficultyStep: 'easy',
      cognitiveDomain,
      directCurriculumCodes: ['[4수01-09]'],
      authoredSourceKey: id,
      taskActions: ['interpret'],
      learnerGoal: '전체에서 색칠하지 않은 부분을 분수로 읽어요.',
      parentSummaryTag: '분수 남은 부분 읽기',
      prompt: '전체 6칸 중 4칸이 색칠되어 있어요. 색칠하지 않은 부분은 전체의 얼마일까요?',
      correctAnswer: '2/6',
      hintSteps: ['전체 칸 수 6은 분모예요.', '색칠하지 않은 칸은 6 - 4 = 2칸이에요.'],
      solutionSteps: ['전체 6칸 중 색칠하지 않은 칸은 2칸이에요.', '색칠하지 않은 부분은 2/6예요.'],
      visualConfig: { totalParts: 6, shadedParts: 4, focus: 'unshaded' },
      scaffoldConfig: {
        kind: 'fraction-strip',
        prompt: '전체 칸과 색칠하지 않은 칸을 구분해요.',
        options: ['전체 6', '색칠하지 않은 2'],
      },
    }
  }
  return null
}

function capacityWeightExpansion(
  id: string,
  stageOrder: number,
  cognitiveDomain: Grade3CognitiveDomain,
): Grade3MissionTemplate | null {
  if (id === 'g3-2-capacity-weight-08') {
    return {
      ...legacyGrade3MissionTemplates.find((mission) => mission.id === 'g3-2-capacity-weight-03')!,
      id,
      stageOrder,
      difficultyStep: 'easy',
      cognitiveDomain: 'knowing',
      curriculumCode: '[4수03-19]',
      directCurriculumCodes: ['[4수03-19]'],
      authoredSourceKey: id,
      taskActions: ['calculate'],
      learnerGoal: 'L와 mL를 맞추어 들이의 합을 직접 구해요.',
      parentSummaryTag: '들이 직접 계산',
      prompt: authoredExpansionPrompts['g3-2-capacity-weight'][0],
      correctAnswer: '1L500mL',
      hintSteps: ['mL끼리 먼저 더해요.', '200mL + 300mL = 500mL예요.'],
      solutionSteps: ['1L는 그대로 두고 mL를 더해요.', '1L 200mL + 300mL = 1L 500mL예요.'],
      visualConfig: { mode: 'operation', leftMl: 1200, rightMl: 300, operator: '+', totalMl: 1500 },
    }
  }
  if (id === 'g3-2-capacity-weight-09') {
    return {
      ...legacyGrade3MissionTemplates.find((mission) => mission.id === 'g3-2-capacity-weight-06')!,
      id,
      stageOrder,
      difficultyStep: 'easy',
      cognitiveDomain: 'knowing',
      curriculumCode: '[4수03-22]',
      directCurriculumCodes: ['[4수03-22]', '[4수03-23]'],
      authoredSourceKey: id,
      taskActions: ['calculate'],
      learnerGoal: 't를 kg으로 바꾸고 남은 무게를 계산해요.',
      parentSummaryTag: 't와 kg 직접 계산',
      prompt: '2t 화물에서 500kg을 내렸어요. 남은 무게는 몇 kg일까요?',
      correctAnswer: '1500',
      hintSteps: ['2t는 2000kg이에요.', '2000kg에서 500kg을 빼요.'],
      solutionSteps: ['2t = 2000kg이에요.', '2000 - 500 = 1500이므로 1500kg이에요.'],
      visualConfig: { tonnes: 2, kilogramsPerTonne: 1000, removedKilograms: 500 },
      scaffoldConfig: {
        kind: 'unit-reader',
        prompt: '2t에는 1t이 몇 번 있는지 확인해요.',
        options: ['1번', '2번', '3번'],
      },
    }
  }
  if (id === 'g3-2-capacity-weight-10') {
    return {
      ...legacyGrade3MissionTemplates.find((mission) => mission.id === 'g3-2-capacity-weight-06')!,
      id,
      stageOrder,
      difficultyStep: 'medium',
      cognitiveDomain: 'applying',
      curriculumCode: '[4수03-22]',
      directCurriculumCodes: ['[4수03-22]', '[4수03-23]'],
      authoredSourceKey: id,
      taskActions: ['model'],
      learnerGoal: '화물 상황에 t와 kg의 관계와 뺄셈을 적용해요.',
      parentSummaryTag: 't와 kg 상황 계산',
      prompt: '3t 화물에서 750kg을 내렸어요. 남은 무게는 몇 kg일까요?',
      correctAnswer: '2250',
      hintSteps: ['3t는 3000kg이에요.', '3000kg에서 750kg을 빼요.'],
      solutionSteps: ['3t = 3000kg이에요.', '3000 - 750 = 2250이므로 2250kg이에요.'],
      visualConfig: { tonnes: 3, kilogramsPerTonne: 1000, removedKilograms: 750 },
    }
  }
  void cognitiveDomain
  return null
}

function buildGrade3ExpansionTemplates(): Grade3MissionTemplate[] {
  const templates: Grade3MissionTemplate[] = []
  let stageOrder = 41

  for (const unit of grade3Units) {
    const slots = expansionSlotsByUnit[unit.id]
    const firstNewNumber = unit.id === 'g3-2-capacity-weight' ? 8 : 4
    slots.forEach((slot, index) => {
      const missionNumber = firstNewNumber + index
      const id = `${unit.id}-${String(missionNumber).padStart(2, '0')}`
      const cognitiveDomain = expansionDomains[index]
      if (unit.id === 'g3-1-length-time' && [6, 9, 10].includes(missionNumber)) {
        templates.push(distanceMission(id, stageOrder, cognitiveDomain))
        stageOrder += 1
        return
      }
      const distinctMission = materiallyDistinctExpansion(id, stageOrder, cognitiveDomain)
      if (distinctMission) {
        templates.push(distinctMission)
        stageOrder += 1
        return
      }
      const capacityMission = capacityWeightExpansion(id, stageOrder, cognitiveDomain)
      if (capacityMission) {
        templates.push(capacityMission)
        stageOrder += 1
        return
      }
      const source = legacyGrade3MissionTemplates.find((mission) => mission.id === slot.sourceId)
      if (!source) throw new Error(`${id}: missing Grade 3 authored source ${slot.sourceId}`)
      templates.push({
        ...source,
        id,
        stageOrder,
        difficultyStep: expansionDifficulty[cognitiveDomain],
        cognitiveDomain,
        curriculumCode: slot.curriculumCode,
        directCurriculumCodes: slot.directCurriculumCodes ?? [slot.curriculumCode],
        authoredSourceKey: id,
        taskActions: source.visualConfig.mode === 'construction'
          ? ['construct']
          : [expansionActions[index]],
        prompt: authoredExpansionPrompts[unit.id]?.[index]
          ?? `${expansionPromptPrefixes[index]}${source.prompt}`,
        learnerGoal: `${expansionPromptPrefixes[index].replace(': ', '')} ${source.learnerGoal}`,
      })
      stageOrder += 1
    })
  }
  return templates
}

const legacyDirectCoverageOverrides: Record<string, string[]> = {
  'g3-2-capacity-weight-01': ['[4수03-17]', '[4수03-18]'],
  'g3-2-capacity-weight-02': ['[4수03-20]', '[4수03-21]'],
  'g3-2-capacity-weight-03': ['[4수03-17]', '[4수03-18]', '[4수03-19]'],
  'g3-2-capacity-weight-04': ['[4수03-17]', '[4수03-18]'],
  'g3-2-capacity-weight-05': ['[4수03-20]', '[4수03-21]'],
}

export const grade3MissionTemplates: Grade3MissionTemplate[] = [
  ...legacyGrade3MissionTemplates.map((template) => ({
    ...template,
    directCurriculumCodes: legacyDirectCoverageOverrides[template.id] ?? template.directCurriculumCodes,
  })),
  ...buildGrade3ExpansionTemplates(),
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

export function normalizeGrade3Mode(value: string | null | undefined): Grade3Mode {
  return value === 'practice' ? 'practice' : 'basic'
}

export function getGrade3MissionSession(
  unitId: string,
  mode: Grade3Mode | string | null | undefined = 'basic',
  seed = 20260516,
  preferredMissionId?: string | null,
): Grade3Mission[] {
  const safeUnitId = grade3Units.some((unit) => unit.id === unitId) ? unitId : grade3Units[0].id
  const normalizedMode = normalizeGrade3Mode(mode)
  const seedOffset = Math.abs(Math.trunc(seed) - 20260516)
  const unitMissions = getGrade3MissionsByUnit(safeUnitId, seed)
  const session = (['knowing', 'applying', 'reasoning'] as const).map((domain, index) => {
    const candidates = unitMissions
      .filter((mission) => mission.cognitiveDomain === domain)
    const modeOffset = normalizedMode === 'practice' ? 1 : 0
    const selected = candidates[(seedOffset + modeOffset) % candidates.length]
    return { ...selected, unitMissionOrder: index + 1 }
  })
  const preferredMission = preferredMissionId
    ? unitMissions.find((mission) => mission.id === preferredMissionId)
    : undefined
  if (!preferredMission || session.some((mission) => mission.id === preferredMission.id)) return session

  return session.map((mission, index) =>
    mission.cognitiveDomain === preferredMission.cognitiveDomain
      ? { ...preferredMission, unitMissionOrder: index + 1 }
      : mission
  )
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

function formatCapacityAnswer(totalMl: number): string {
  const liters = Math.floor(totalMl / 1000)
  const milliliters = totalMl % 1000
  return liters > 0 ? `${liters}L${milliliters}mL` : `${milliliters}mL`
}

function formatWeightAnswer(totalG: number): string {
  const kilograms = Math.floor(totalG / 1000)
  const grams = totalG % 1000
  return kilograms > 0 ? `${kilograms}kg${grams}g` : `${grams}g`
}

function validateRequiredActivityContract(template: Grade3MissionTemplate, errors: string[]) {
  if (template.visualModel === 'circle-parts' && template.visualConfig.mode === 'construction') {
    const diameter = Number(template.visualConfig.diameter)
    const answerExposurePattern = new RegExp(
      `${template.correctAnswer}\\s*(?:cm|센티미터)`,
      'i'
    )
    if (
      template.curriculumCode !== '[4수03-07]'
      || template.taskActions.length !== 1
      || template.taskActions[0] !== 'construct'
      || template.visualSemantics !== 'quantitative'
      || template.visualConfig.mode !== 'construction'
      || template.visualConfig.hideRadiusUntilReveal !== true
      || template.visualConfig.radius !== undefined
      || !Number.isFinite(diameter)
      || !/①.*컴퍼스.*②.*원.*그(?:리|린|려)/.test(template.prompt)
    ) {
      errors.push(`${template.id}: [4수03-07] requires a two-stage compass construction activity`)
    }
    if (String(diameter / 2) !== template.correctAnswer) {
      errors.push(`${template.id}: given diameter must derive the rule-based compass width`)
    }
    if ([template.prompt, ...template.hintSteps].some((text) => answerExposurePattern.test(text))) {
      errors.push(`${template.id}: prompt and hints must not expose the compass-width answer`)
    }
  }

  if (template.id === 'g3-2-capacity-weight-01') {
    const totalMl = Number(template.visualConfig.totalMl)
    if (
      template.taskActions.length !== 1
      || template.taskActions[0] !== 'measure'
      || template.visualSemantics !== 'quantitative'
      || template.visualConfig.mode !== 'scale-read'
      || !Number.isFinite(totalMl)
      || !Number.isFinite(Number(template.visualConfig.tickStep))
    ) {
      errors.push(`${template.id}: capacity reading requires a quantitative measure activity`)
    }
    if (formatCapacityAnswer(totalMl) !== template.correctAnswer) {
      errors.push(`${template.id}: capacity scale model must match the rule-based answer`)
    }
    if (template.prompt.replace(/\s/g, '').includes(template.correctAnswer.replace(/\s/g, ''))) {
      errors.push(`${template.id}: prompt must not copy the capacity answer`)
    }
  }

  if (template.id === 'g3-2-capacity-weight-02') {
    const totalG = Number(template.visualConfig.totalG)
    if (
      template.taskActions.length !== 1
      || template.taskActions[0] !== 'measure'
      || template.visualSemantics !== 'quantitative'
      || template.visualConfig.mode !== 'scale-read'
      || !Number.isFinite(totalG)
      || !Number.isFinite(Number(template.visualConfig.tickStep))
    ) {
      errors.push(`${template.id}: weight reading requires a quantitative measure activity`)
    }
    if (formatWeightAnswer(totalG) !== template.correctAnswer) {
      errors.push(`${template.id}: weight scale model must match the rule-based answer`)
    }
    if (template.prompt.replace(/\s/g, '').includes(template.correctAnswer.replace(/\s/g, ''))) {
      errors.push(`${template.id}: prompt must not copy the weight answer`)
    }
  }
}

export interface Grade3VariantAuditResult {
  sourceCount: number
  variantCount: number
  errors: string[]
}

function grade3VisualAnswer(mission: Grade3Mission): string | undefined {
  const config = mission.visualConfig
  if (mission.visualModel === 'vertical-operation') {
    const top = Number(config.top)
    const bottom = Number(config.bottom)
    return String(config.operator === '+' ? top + bottom : top - bottom)
  }
  if (mission.visualModel === 'division-groups') {
    if (mission.prompt.includes('나머지') || mission.prompt.includes('남는')) {
      return String(config.remainder)
    }
    return String(config.quotient)
  }
  if (mission.visualModel === 'array-area') return String(config.product)
  if (mission.visualModel === 'ruler-mm') {
    return `${config.centimeters}cm${config.millimeters}mm`
  }
  if (mission.visualModel === 'distance-road') {
    const totalMeters =
      Number(config.kilometers) * 1000
      + Number(config.meters)
      + Number(config.addMeters ?? 0)
    if (mission.answerType === 'length') {
      return `${Math.floor(totalMeters / 1000)}km${totalMeters % 1000}m`
    }
    return String(totalMeters)
  }
  if (mission.visualModel === 'clock-seconds') {
    if (config.second !== undefined) {
      return `${config.hour}시${config.minute}분${config.second}초`
    }
    const durationSeconds = Number(config.durationResult)
    return `${Math.floor(durationSeconds / 60)}분${durationSeconds % 60}초`
  }
  if (mission.visualModel === 'fraction-strip') {
    if (mission.answerType === 'fraction') {
      if (config.focus === 'unshaded') {
        return `${Number(config.totalParts) - Number(config.shadedParts)}/${config.totalParts}`
      }
      return `${config.shadedParts}/${config.totalParts}`
    }
    if (config.target !== undefined) return String(config.target)
  }
  if (mission.visualModel === 'decimal-grid') {
    return String(Number(config.shadedParts) / Number(config.totalParts))
  }
  if (mission.visualModel === 'circle-parts' && mission.answerType === 'integer') {
    if (config.mode === 'construction') {
      return String(Number(config.diameter) / 2)
    }
    return String(config.hideRadiusUntilReveal ? config.radius : config.diameter)
  }
  if (mission.visualModel === 'tonne-scale') {
    return String(
      Number(config.tonnes) * Number(config.kilogramsPerTonne)
      - Number(config.removedKilograms ?? 0)
    )
  }
  if (mission.visualModel === 'bar-graph') {
    const categories = splitList(config.categories)
    const counts = splitList(config.counts).map(Number)
    const target = String(config.target)
    if (target.includes('-')) {
      const [left, right] = target.split('-')
      return String(counts[categories.indexOf(left)] - counts[categories.indexOf(right)])
    }
    return /^\d+$/.test(mission.correctAnswer)
      ? String(counts[categories.indexOf(target)])
      : target
  }
  return undefined
}

export function auditGrade3MissionVariants(
  templates: Grade3MissionTemplate[] = grade3MissionTemplates
): Grade3VariantAuditResult {
  const errors: string[] = []

  for (const template of templates) {
    const label = `${template.id} variant 1`
    if (!normalizeCorrectAnswer(template.answerType, template.correctAnswer)) {
      errors.push(`${label}: correct answer cannot be normalized`)
    }
    if (template.choices) {
      if (new Set(template.choices).size !== template.choices.length) {
        errors.push(`${label}: duplicate choices`)
      }
      const correctCount = template.choices.filter((choice) => choice === template.correctAnswer).length
      if (correctCount !== 1) errors.push(`${label}: expected one correct choice, got ${correctCount}`)
    }
    const renderedText = [
      template.prompt,
      template.correctAnswer,
      ...template.hintSteps,
      ...template.solutionSteps,
      ...Object.values(template.visualConfig).map(String),
    ]
    if (renderedText.some((value) => /{{|}}/.test(value))) {
      errors.push(`${label}: unresolved template placeholder`)
    }
    const solution = template.solutionSteps.join(' ').replace(/\s/g, '')
    const answer = template.correctAnswer.replace(/\s/g, '')
    if (!solution.includes(answer)) {
      errors.push(`${label}: solution does not trace to the correct answer`)
    }
    const visualAnswer = grade3VisualAnswer({ ...template, unitMissionOrder: 1 })
    if (visualAnswer !== undefined && visualAnswer !== template.correctAnswer) {
      errors.push(`${label}: visual answer ${visualAnswer} does not match ${template.correctAnswer}`)
    }
  }

  return { sourceCount: templates.length, variantCount: templates.length, errors }
}

export function validateGrade3MissionBank(
  templates: Grade3MissionTemplate[] = grade3MissionTemplates
): Grade3ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const stageOrders = new Set<number>()
  const byUnit = new Map<string, {
    total: number
    steps: Record<Grade3DifficultyStep, number>
    domains: Record<Grade3CognitiveDomain, number>
    sourceSignatures: Set<string>
    authoredSourceKeys: Set<string>
  }>()
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
    if (template.taskActions.length === 0) errors.push(`${template.id}: missing taskActions`)
    if (template.visualSemantics !== 'schematic' && template.visualSemantics !== 'quantitative') {
      errors.push(`${template.id}: visualSemantics must match the required visual`)
    }
    if (template.curriculumCode && !allowedCodes.has(template.curriculumCode)) {
      errors.push(`${template.id}: curriculumCode is outside the unit scope`)
    }
    if (template.directCurriculumCodes.length === 0) {
      errors.push(`${template.id}: needs at least one direct curriculum code`)
    }
    if (unit && template.directCurriculumCodes.some((code) => !unit.curriculumCodes.includes(code))) {
      errors.push(`${template.id}: direct curriculum code is outside the unit scope`)
    }
    if (!template.authoredSourceKey.trim()) errors.push(`${template.id}: missing authoredSourceKey`)
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
    validateRequiredActivityContract(template, errors)

    const expectedDomainByDifficulty: Record<Grade3DifficultyStep, Grade3CognitiveDomain> = {
      easy: 'knowing',
      medium: 'applying',
      applied: 'reasoning',
    }
    if (template.cognitiveDomain !== expectedDomainByDifficulty[template.difficultyStep]) {
      errors.push(`${template.id}: difficultyStep must map to its cognitiveDomain`)
    }

    const bucket = byUnit.get(template.unitId) ?? {
      total: 0,
      steps: { easy: 0, medium: 0, applied: 0 },
      domains: { knowing: 0, applying: 0, reasoning: 0 },
      sourceSignatures: new Set<string>(),
      authoredSourceKeys: new Set<string>(),
    }
    bucket.total += 1
    bucket.steps[template.difficultyStep] += 1
    bucket.domains[template.cognitiveDomain] += 1
    bucket.sourceSignatures.add([
      template.prompt.replace(/\d+/g, '#'),
      template.visualModel,
      template.taskActions.join(','),
    ].join('|'))
    bucket.authoredSourceKeys.add(template.authoredSourceKey)
    byUnit.set(template.unitId, bucket)
  }

  for (const unit of grade3Units) {
    const bucket = byUnit.get(unit.id)
    const expectedTotal = 10
    const expectedSteps: Record<Grade3DifficultyStep, number> = { easy: 4, medium: 4, applied: 2 }
    if (!bucket) {
      errors.push(`${unit.id}: expects ${expectedTotal} missions, got 0`)
      continue
    }
    if (bucket.total !== expectedTotal) errors.push(`${unit.id}: expects ${expectedTotal} missions, got ${bucket.total}`)
    for (const step of ['easy', 'medium', 'applied'] as const) {
      if (bucket.steps[step] !== expectedSteps[step]) {
        errors.push(`${unit.id}: expects ${expectedSteps[step]} ${step} mission(s), got ${bucket.steps[step]}`)
      }
    }
    const expectedDomains: Record<Grade3CognitiveDomain, number> = {
      knowing: 4,
      applying: 4,
      reasoning: 2,
    }
    for (const domain of ['knowing', 'applying', 'reasoning'] as const) {
      if (bucket.domains[domain] !== expectedDomains[domain]) {
        errors.push(`${unit.id}: expects ${expectedDomains[domain]} ${domain} mission(s), got ${bucket.domains[domain]}`)
      }
    }
    if (bucket.sourceSignatures.size !== expectedTotal) {
      errors.push(`${unit.id}: authored missions must differ in context, representation, or learner action`)
    }
    if (bucket.authoredSourceKeys.size !== expectedTotal) {
      errors.push(`${unit.id}: authoredSourceKey values must be unique`)
    }
    const unitTemplates = templates.filter((template) => template.unitId === unit.id)
    for (const code of unit.curriculumCodes) {
      for (const domain of ['knowing', 'applying'] as const) {
        if (!unitTemplates.some((template) =>
          template.cognitiveDomain === domain && template.directCurriculumCodes.includes(code)
        )) {
          errors.push(`${unit.id}: ${code} needs a direct ${domain} mission`)
        }
      }
    }
  }

  if (templates.length !== 120) errors.push(`Grade 3 expects 120 missions, got ${templates.length}`)
  if (!ids.has(SAFE_GRADE3_MISSION_ID)) errors.push(`Safe mission id is missing: ${SAFE_GRADE3_MISSION_ID}`)
  errors.push(...auditGrade3MissionVariants(templates).errors)

  return { errors, warnings }
}
