export type Grade1Skill =
  | 'counting'
  | 'comparison'
  | 'addition'
  | 'subtraction'
  | 'shape'
  | 'time'
  | 'pattern'

export type Grade1VisualModel =
  | 'counting-grid'
  | 'object-groups'
  | 'number-cards'
  | 'shape-cards'
  | 'clock-face'
  | 'pattern-strip'

export type Grade1AnswerType = 'choice' | 'number'

export interface Grade1Island {
  id: string
  title: string
  subtitle: string
  rewardId: Grade1RewardId
}

export type Grade1RewardId =
  | 'numberShard'
  | 'shapeBadge'
  | 'clockBadge'
  | 'patternRibbon'

export type Grade1VisualConfig = Record<string, string | number | boolean>

export interface Grade1MissionTemplate {
  id: string
  islandId: string
  stageOrder: number
  skill: Grade1Skill
  difficulty: 1 | 2 | 3
  learnerGoal: string
  parentSummaryTag: string
  promptTemplate: string
  answerType: Grade1AnswerType
  paramSchema: Record<string, { min: number; max: number }>
  solverRule: string
  choicesTemplate?: string[]
  visualModel: Grade1VisualModel
  visualConfig: Grade1VisualConfig
  hintStepsTemplate: string[]
  solutionStepsTemplate: string[]
  rewardId: Grade1RewardId
}

export interface Grade1Mission {
  id: string
  islandId: string
  stageOrder: number
  skill: Grade1Skill
  difficulty: 1 | 2 | 3
  learnerGoal: string
  parentSummaryTag: string
  prompt: string
  answerType: Grade1AnswerType
  params: Record<string, number>
  choices?: string[]
  correctAnswer: string
  correctChoiceIndex?: number
  visualModel: Grade1VisualModel
  visualConfig: Grade1VisualConfig
  hintSteps: string[]
  solutionSteps: string[]
  rewardId: Grade1RewardId
}

export const grade1Islands: Grade1Island[] = [
  {
    id: 'count-cove',
    title: '수 세기 만',
    subtitle: '보고, 짚고, 개수를 말해요',
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge',
    title: '순서 다리',
    subtitle: '앞뒤 수와 큰 수를 찾아요',
    rewardId: 'numberShard',
  },
  {
    id: 'orchard-port',
    title: '더하기 항구',
    subtitle: '두 모음을 합쳐요',
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock',
    title: '빼기 나루',
    subtitle: '남은 개수를 알아봐요',
    rewardId: 'patternRibbon',
  },
  {
    id: 'shape-forest',
    title: '모양 숲',
    subtitle: '같은 모양을 찾아요',
    rewardId: 'shapeBadge',
  },
  {
    id: 'clock-tower',
    title: '시계 탑',
    subtitle: '시각을 읽어요',
    rewardId: 'clockBadge',
  },
  {
    id: 'pattern-cave',
    title: '규칙 동굴',
    subtitle: '다음에 올 것을 찾아요',
    rewardId: 'patternRibbon',
  },
]

export const grade1MissionTemplates: Grade1MissionTemplate[] = [
  {
    id: 'count-cove-01',
    islandId: 'count-cove',
    stageOrder: 1,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '사과 7개를 세어요',
    parentSummaryTag: 'counting-to-10',
    promptTemplate: '사과는 모두 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 7, max: 7 }, slots: { min: 10, max: 10 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 1}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'apple', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['위 줄에는 5개, 아래 줄에는 2개가 있어요.', '5 다음에 6, 7로 이어서 세어요.'],
    solutionStepsTemplate: ['사과가 있는 칸만 세어요.', '5개와 2개를 이어 세면 7개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-02',
    islandId: 'count-cove',
    stageOrder: 2,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '10보다 큰 수를 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '블록은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 12, max: 12 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'block', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['10개를 먼저 묶어 보아요.', '10 다음에 11, 12로 세어요.'],
    solutionStepsTemplate: ['첫 10칸을 채우면 10개예요.', '남은 2개를 더 세면 12개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-03',
    islandId: 'count-cove',
    stageOrder: 3,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '구슬 개수를 정확히 세어요',
    parentSummaryTag: 'counting-to-10',
    promptTemplate: '구슬은 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 6, max: 9 }, slots: { min: 10, max: 10 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 2}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'marble', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['빈칸은 빼고 구슬만 세어요.', '한 줄씩 천천히 세면 좋아요.'],
    solutionStepsTemplate: ['구슬이 있는 칸을 하나씩 세어요.', '모두 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-04',
    islandId: 'count-cove',
    stageOrder: 4,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '10묶음과 낱개를 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '별은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 13, max: 16 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['10개를 먼저 찾고 남은 별을 세어요.', '10에 남은 개수를 더해요.'],
    solutionStepsTemplate: ['가득 찬 첫 줄은 10개예요.', '나머지 별까지 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-01',
    islandId: 'order-bridge',
    stageOrder: 5,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '더 큰 수를 골라요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '{{left}}와 {{left + gap}} 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 4, max: 7 }, gap: { min: 2, max: 5 } },
    solverRule: 'left + gap',
    choicesTemplate: ['{{left + gap}}', '{{left}}', '{{left + gap - 1}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{left}},{{left + gap}}', target: '{{left + gap}}' },
    hintStepsTemplate: ['수직선에서 오른쪽에 있는 수가 더 커요.', '{{left + gap}}은 {{left}}보다 뒤에 있어요.'],
    solutionStepsTemplate: ['두 수를 비교해요.', '{{left + gap}}이 {{left}}보다 크므로 정답은 {{left + gap}}예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-02',
    islandId: 'order-bridge',
    stageOrder: 6,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '더 작은 수를 골라요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '{{small}}와 {{small + gap}} 중 더 작은 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { small: { min: 3, max: 9 }, gap: { min: 2, max: 6 } },
    solverRule: 'small',
    choicesTemplate: ['{{small}}', '{{small + gap}}', '{{small + gap + 1}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{small}},{{small + gap}}', target: '{{small}}' },
    hintStepsTemplate: ['먼저 나오는 수가 더 작아요.', '{{small}}은 {{small + gap}}보다 앞에 있어요.'],
    solutionStepsTemplate: ['두 수를 왼쪽부터 생각해요.', '더 작은 수는 {{small}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-03',
    islandId: 'order-bridge',
    stageOrder: 7,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '바로 앞의 수를 알아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{n}} 바로 앞의 수는 무엇일까요?',
    answerType: 'number',
    paramSchema: { n: { min: 6, max: 15 } },
    solverRule: 'n - 1',
    visualModel: 'number-cards',
    visualConfig: { cards: '{{n - 2}},{{n - 1}},{{n}},?', target: '{{n - 1}}' },
    hintStepsTemplate: ['바로 앞은 하나 작은 수예요.', '{{n}}에서 하나 뒤로 가요.'],
    solutionStepsTemplate: ['하나 작은 수를 찾습니다.', '{{n}} 바로 앞은 {{n - 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-04',
    islandId: 'order-bridge',
    stageOrder: 8,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '바로 뒤의 수를 알아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{n}} 바로 뒤의 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { n: { min: 5, max: 14 } },
    solverRule: 'n + 1',
    choicesTemplate: ['{{n + 1}}', '{{n - 1}}', '{{n + 2}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{n - 1}},{{n}},?,{{n + 2}}', target: '{{n + 1}}' },
    hintStepsTemplate: ['바로 뒤는 하나 큰 수예요.', '{{n}} 다음 수를 말해요.'],
    solutionStepsTemplate: ['하나 큰 수를 찾습니다.', '{{n}} 바로 뒤는 {{n + 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'orchard-port-01',
    islandId: 'orchard-port',
    stageOrder: 9,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '두 모음을 합쳐요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '사과 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 4, max: 4 }, right: { min: 3, max: 3 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 1}}', '{{left + right + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['먼저 {{left}}개를 세고, 이어서 {{right}}개를 세어요.', '{{left}} 다음부터 이어 세면 돼요.'],
    solutionStepsTemplate: ['두 모음을 합칩니다.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-02',
    islandId: 'orchard-port',
    stageOrder: 10,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '블록을 합쳐 10 안의 덧셈을 해요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '블록 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 5, max: 5 }, right: { min: 2, max: 2 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['{{left}}개에서 {{right}}개를 이어 세어요.', '손가락으로 하나씩 더해도 좋아요.'],
    solutionStepsTemplate: ['블록을 모두 모아요.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-03',
    islandId: 'orchard-port',
    stageOrder: 11,
    skill: 'addition',
    difficulty: 2,
    learnerGoal: '10을 넘는 덧셈을 이어 세어요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '별 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 7, max: 9 }, right: { min: 3, max: 6 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 2}}', '{{left + right + 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['큰 모음 {{left}}개를 먼저 세어요.', '그 다음 {{right}}개를 이어 세어요.'],
    solutionStepsTemplate: ['두 모음을 합칩니다.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-04',
    islandId: 'orchard-port',
    stageOrder: 12,
    skill: 'addition',
    difficulty: 3,
    learnerGoal: '이야기 덧셈을 풀어요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '연필이 {{left}}자루 있었고 {{right}}자루를 더 받았어요. 모두 몇 자루일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 8, max: 10 }, right: { min: 2, max: 5 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'pencil', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['더 받았으니 덧셈이에요.', '{{left}}에서 {{right}}를 이어 세어요.'],
    solutionStepsTemplate: ['처음 {{left}}자루에 {{right}}자루를 더합니다.', '{{left}} + {{right}} = {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-01',
    islandId: 'river-dock',
    stageOrder: 13,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '빠진 만큼 남은 수를 세어요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '구슬 {{total}}개 중 {{take}}개가 떠났어요. 몇 개가 남았을까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 8, max: 8 }, take: { min: 3, max: 3 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take - 1}}', '{{total - take + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'marble', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['떠난 구슬은 빼고 남은 구슬만 세어요.', '{{total}}에서 {{take}}를 빼요.'],
    solutionStepsTemplate: ['{{total}}개 중 {{take}}개를 덜어냅니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-02',
    islandId: 'river-dock',
    stageOrder: 14,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '10 안의 뺄셈을 해요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '별 {{total}}개 중 {{take}}개를 사용했어요. 몇 개가 남았을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 10, max: 10 }, take: { min: 4, max: 4 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['사용한 별은 지우고 남은 별을 세어요.', '10에서 4를 빼요.'],
    solutionStepsTemplate: ['{{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-03',
    islandId: 'river-dock',
    stageOrder: 15,
    skill: 'subtraction',
    difficulty: 2,
    learnerGoal: '20 안의 뺄셈을 해요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '블록 {{total}}개 중 {{take}}개를 치웠어요. 몇 개가 남았을까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 13, max: 16 }, take: { min: 4, max: 7 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 2}}', '{{total - take - 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['치운 블록은 빼요.', '남은 블록만 다시 세어도 돼요.'],
    solutionStepsTemplate: ['{{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-04',
    islandId: 'river-dock',
    stageOrder: 16,
    skill: 'subtraction',
    difficulty: 3,
    learnerGoal: '이야기 뺄셈을 풀어요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '사과가 {{total}}개 있었는데 {{take}}개를 먹었어요. 몇 개가 남았을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 14, max: 18 }, take: { min: 5, max: 8 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['먹은 사과는 없어졌으니 빼기예요.', '{{total}}에서 {{take}}를 빼요.'],
    solutionStepsTemplate: ['처음 {{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'shape-forest-01',
    islandId: 'shape-forest',
    stageOrder: 17,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '동그라미를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '동그라미 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '동그라미',
    choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,네모', target: '동그라미' },
    hintStepsTemplate: ['모서리가 없이 둥근 모양을 찾아요.'],
    solutionStepsTemplate: ['동그라미는 둥글고 뾰족한 곳이 없어요.', '정답은 동그라미예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-02',
    islandId: 'shape-forest',
    stageOrder: 18,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '세모를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '세모 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '세모',
    choicesTemplate: ['세모', '동그라미', '네모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,네모', target: '세모' },
    hintStepsTemplate: ['뾰족한 꼭짓점이 3개인 모양을 찾아요.'],
    solutionStepsTemplate: ['세모는 꼭짓점이 3개예요.', '정답은 세모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-03',
    islandId: 'shape-forest',
    stageOrder: 19,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '네모를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '네모 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '동그라미', '세모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '네모,동그라미,세모', target: '네모' },
    hintStepsTemplate: ['반듯한 변이 4개인 모양을 찾아요.'],
    solutionStepsTemplate: ['네모는 변이 4개예요.', '정답은 네모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-04',
    islandId: 'shape-forest',
    stageOrder: 20,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '같은 모양을 비교해요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '보기 중 사각형과 같은 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '동그라미', '세모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,네모,세모', target: '네모' },
    hintStepsTemplate: ['사각형은 네모처럼 반듯한 변이 4개예요.'],
    solutionStepsTemplate: ['사각형과 같은 모양은 네모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'clock-tower-01',
    islandId: 'clock-tower',
    stageOrder: 21,
    skill: 'time',
    difficulty: 2,
    learnerGoal: '정각을 읽어요',
    parentSummaryTag: 'time-hour',
    promptTemplate: '시계는 몇 시를 가리킬까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 3, max: 3 }, minute: { min: 0, max: 0 } },
    solverRule: '{{hour}}시',
    choicesTemplate: ['{{hour}}시', '{{hour - 1}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 12를 가리키면 정각이에요.', '짧은 바늘이 {{hour}}를 가리켜요.'],
    solutionStepsTemplate: ['긴 바늘은 12에 있어요.', '짧은 바늘이 {{hour}}에 있으므로 {{hour}}시예요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-02',
    islandId: 'clock-tower',
    stageOrder: 22,
    skill: 'time',
    difficulty: 3,
    learnerGoal: '30분을 읽어요',
    parentSummaryTag: 'time-half-hour',
    promptTemplate: '시계는 몇 시 30분을 가리킬까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 7, max: 7 }, minute: { min: 30, max: 30 } },
    solverRule: '{{hour}}시 30분',
    choicesTemplate: ['{{hour}}시 30분', '{{hour}}시', '{{hour + 1}}시 30분'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 6을 가리키면 30분이에요.', '짧은 바늘은 {{hour}}와 {{hour + 1}} 사이에 있어요.'],
    solutionStepsTemplate: ['긴 바늘이 6에 있으므로 30분이에요.', '짧은 바늘이 {{hour}}를 지나서 {{hour}}시 30분이에요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'pattern-cave-01',
    islandId: 'pattern-cave',
    stageOrder: 23,
    skill: 'pattern',
    difficulty: 2,
    learnerGoal: '반복 규칙을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '동그라미, 세모, 동그라미, 세모 다음에는 무엇이 올까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '동그라미',
    choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '동그라미,세모,동그라미,세모,?' },
    hintStepsTemplate: ['동그라미와 세모가 번갈아 나와요.'],
    solutionStepsTemplate: ['동그라미 다음 세모가 반복돼요.', '세모 다음은 동그라미예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'pattern-cave-02',
    islandId: 'pattern-cave',
    stageOrder: 24,
    skill: 'pattern',
    difficulty: 3,
    learnerGoal: '세 가지 반복 규칙을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '별, 블록, 연필, 별, 블록 다음에는 무엇이 올까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '연필',
    choicesTemplate: ['연필', '별', '블록'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '별,블록,연필,별,블록,?' },
    hintStepsTemplate: ['별, 블록, 연필 순서가 반복돼요.'],
    solutionStepsTemplate: ['별, 블록, 연필이 한 묶음이에요.', '별, 블록 다음은 연필이에요.'],
    rewardId: 'patternRibbon',
  },
]

export const SAFE_GRADE1_MISSION_ID = 'count-cove-01'

function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateParams(
  schema: Grade1MissionTemplate['paramSchema'],
  random: () => number
): Record<string, number> {
  const params: Record<string, number> = {}
  for (const [key, range] of Object.entries(schema)) {
    params[key] = randomInt(range.min, range.max, random)
  }
  return params
}

function evaluateExpression(expr: string, params: Record<string, number>): string {
  let evalExpr = expr.trim()

  if (params[evalExpr] !== undefined) {
    return String(params[evalExpr])
  }

  for (const [key, value] of Object.entries(params)) {
    evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
  }

  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    try {
      // Internal mission templates only allow arithmetic after variable substitution.
      return String(Function(`"use strict"; return (${evalExpr})`)())
    } catch {
      return expr
    }
  }

  return expr
}

function renderTemplate(template: string, params: Record<string, number>): string {
  if (!template.includes('{{')) {
    return evaluateExpression(template, params)
  }

  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) =>
    evaluateExpression(expr, params)
  )
}

function coerceRenderedValue(value: string | number | boolean): string | number | boolean {
  if (typeof value !== 'string') return value
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

function renderVisualConfig(
  config: Grade1VisualConfig,
  params: Record<string, number>
): Grade1VisualConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value]
      return [key, coerceRenderedValue(renderTemplate(value, params))]
    })
  )
}

export function renderGrade1Mission(
  template: Grade1MissionTemplate,
  seed = template.stageOrder
): Grade1Mission {
  const random = seededRandom(seed + template.stageOrder * 997)
  const params = generateParams(template.paramSchema, random)
  const correctAnswer = renderTemplate(template.solverRule, params)
  const choices = template.choicesTemplate
    ? template.choicesTemplate.map((choice) => renderTemplate(choice, params))
    : undefined
  const shuffledChoices = choices ? shuffleArray(choices, random) : undefined

  return {
    id: template.id,
    islandId: template.islandId,
    stageOrder: template.stageOrder,
    skill: template.skill,
    difficulty: template.difficulty,
    learnerGoal: template.learnerGoal,
    parentSummaryTag: template.parentSummaryTag,
    prompt: renderTemplate(template.promptTemplate, params),
    answerType: template.answerType,
    params,
    choices: shuffledChoices,
    correctAnswer,
    correctChoiceIndex: shuffledChoices?.indexOf(correctAnswer),
    visualModel: template.visualModel,
    visualConfig: renderVisualConfig(template.visualConfig, params),
    hintSteps: template.hintStepsTemplate.map((hint) => renderTemplate(hint, params)),
    solutionSteps: template.solutionStepsTemplate.map((step) => renderTemplate(step, params)),
    rewardId: template.rewardId,
  }
}

export function getGrade1Missions(seed = 20260509): Grade1Mission[] {
  return grade1MissionTemplates
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((template) => renderGrade1Mission(template, seed))
}

export function getSafeGrade1Mission(seed = 20260509): Grade1Mission {
  const safeTemplate = grade1MissionTemplates.find((template) => template.id === SAFE_GRADE1_MISSION_ID)
  if (!safeTemplate) {
    throw new Error('Safe Grade 1 mission is missing')
  }
  return renderGrade1Mission(safeTemplate, seed)
}

export function getGrade1MissionById(id: string, seed = 20260509): Grade1Mission {
  const template = grade1MissionTemplates.find((item) => item.id === id)
  return template ? renderGrade1Mission(template, seed) : getSafeGrade1Mission(seed)
}

export function getGrade1IslandById(id: string): Grade1Island | undefined {
  return grade1Islands.find((island) => island.id === id)
}

export interface Grade1ValidationResult {
  errors: string[]
  warnings: string[]
}

export function validateGrade1MissionBank(
  templates: Grade1MissionTemplate[] = grade1MissionTemplates
): Grade1ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const stageOrders = new Set<number>()
  const supportedVisualModels: Grade1VisualModel[] = [
    'counting-grid',
    'object-groups',
    'number-cards',
    'shape-cards',
    'clock-face',
    'pattern-strip',
  ]
  const rewardIds: Grade1RewardId[] = [
    'numberShard',
    'shapeBadge',
    'clockBadge',
    'patternRibbon',
  ]

  for (const template of templates) {
    if (ids.has(template.id)) errors.push(`Duplicate mission id: ${template.id}`)
    ids.add(template.id)

    if (stageOrders.has(template.stageOrder)) {
      errors.push(`Duplicate stage order: ${template.stageOrder}`)
    }
    stageOrders.add(template.stageOrder)

    if (!grade1Islands.some((island) => island.id === template.islandId)) {
      errors.push(`${template.id}: unknown island ${template.islandId}`)
    }
    if (!supportedVisualModels.includes(template.visualModel)) {
      errors.push(`${template.id}: unsupported visual model ${template.visualModel}`)
    }
    if (!rewardIds.includes(template.rewardId)) {
      errors.push(`${template.id}: unknown reward ${template.rewardId}`)
    }
    if (!template.learnerGoal.trim()) errors.push(`${template.id}: missing learnerGoal`)
    if (!template.parentSummaryTag.trim()) errors.push(`${template.id}: missing parentSummaryTag`)
    if (template.hintStepsTemplate.length === 0) errors.push(`${template.id}: missing hints`)
    if (template.solutionStepsTemplate.length === 0) errors.push(`${template.id}: missing solution steps`)
    if (template.answerType === 'choice' && (!template.choicesTemplate || template.choicesTemplate.length < 2)) {
      errors.push(`${template.id}: choice mission needs at least two choices`)
    }
    if (template.answerType === 'number' && template.choicesTemplate) {
      warnings.push(`${template.id}: number mission ignores choicesTemplate`)
    }

    for (const seed of [1, 7, 23]) {
      const mission = renderGrade1Mission(template, seed)
      if (!mission.correctAnswer.trim()) errors.push(`${template.id}: empty answer at seed ${seed}`)
      if (mission.answerType === 'choice') {
        const uniqueChoices = new Set(mission.choices ?? [])
        if (!mission.choices || mission.choices.length < 2) {
          errors.push(`${template.id}: no rendered choices at seed ${seed}`)
        } else if (uniqueChoices.size !== mission.choices.length) {
          errors.push(`${template.id}: duplicate choices at seed ${seed}`)
        }

        const correctCount = (mission.choices ?? []).filter((choice) => choice === mission.correctAnswer).length
        if (correctCount !== 1) {
          errors.push(`${template.id}: expected one correct choice at seed ${seed}, got ${correctCount}`)
        }
        if (mission.correctChoiceIndex === undefined || mission.correctChoiceIndex < 0) {
          errors.push(`${template.id}: missing correctChoiceIndex at seed ${seed}`)
        }
      }
    }
  }

  if (!ids.has(SAFE_GRADE1_MISSION_ID)) {
    errors.push(`Safe mission id is missing: ${SAFE_GRADE1_MISSION_ID}`)
  }

  return { errors, warnings }
}
