const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

function asset(path: string): string {
  return `${BASE_PATH}/assets/grade1/${path}`
}

export type Grade1Asset = {
  src: string
  alt: string
  decorative?: boolean
}

export const grade1Mascots = {
  donggeuriDefault: {
    src: asset('mascots/donggeuri-default.png'),
    alt: '동그리 기본 표정 캐릭터',
  },
  donggeuriCheer: {
    src: asset('mascots/donggeuri-cheer.png'),
    alt: '응원하는 동그리 캐릭터',
  },
  donggeuriHint: {
    src: asset('mascots/donggeuri-hint.png'),
    alt: '힌트를 알려주는 동그리 캐릭터',
  },
  donggeuriRetry: {
    src: asset('mascots/donggeuri-retry.png'),
    alt: '다시 도전하는 동그리 캐릭터',
  },
  semoriHint: {
    src: asset('mascots/semori-hint.png'),
    alt: '힌트를 생각하는 세모리 캐릭터',
  },
  semoriCheer: {
    src: asset('mascots/semori-cheer.png'),
    alt: '응원하는 세모리 캐릭터',
  },
  nemoriDefault: {
    src: asset('mascots/nemori-default.png'),
    alt: '네모리 기본 표정 캐릭터',
  },
  nemoriCheer: {
    src: asset('mascots/nemori-cheer.png'),
    alt: '응원하는 네모리 캐릭터',
  },
} satisfies Record<string, Grade1Asset>

export const grade1MapAssets = {
  adventureMap: {
    src: asset('map/adventure-map.png'),
    alt: '1학년 숫자 탐험섬 지도',
  },
  semester1Island: {
    src: asset('map/semester-1-island.png'),
    alt: '1학기 숫자와 모양 섬',
  },
  semester2Island: {
    src: asset('map/semester-2-island.png'),
    alt: '2학기 십 묶음과 시계 섬',
  },
  stageOpen: {
    src: asset('map/stage-node-open.png'),
    alt: '',
    decorative: true,
  },
  stageComplete: {
    src: asset('map/stage-node-complete.png'),
    alt: '',
    decorative: true,
  },
  stageLocked: {
    src: asset('map/stage-node-locked.png'),
    alt: '',
    decorative: true,
  },
} satisfies Record<string, Grade1Asset>

export const grade1Rewards = {
  numberShard: {
    src: asset('rewards/number-shard.png'),
    alt: '숫자 조각 보상',
  },
  shapeBadge: {
    src: asset('rewards/shape-badge.png'),
    alt: '도형 배지 보상',
  },
  clockBadge: {
    src: asset('rewards/clock-badge.png'),
    alt: '시계 배지 보상',
  },
  patternRibbon: {
    src: asset('rewards/pattern-ribbon.png'),
    alt: '규칙 리본 보상',
  },
} satisfies Record<string, Grade1Asset>

export const grade1Objects = {
  apple: {
    src: asset('objects/apple.png'),
    alt: '사과 오브젝트',
  },
  block: {
    src: asset('objects/block.png'),
    alt: '블록 오브젝트',
  },
  star: {
    src: asset('objects/star.png'),
    alt: '별 오브젝트',
  },
  pencil: {
    src: asset('objects/pencil.png'),
    alt: '연필 오브젝트',
  },
  marble: {
    src: asset('objects/marble.png'),
    alt: '구슬 오브젝트',
  },
} satisfies Record<string, Grade1Asset>
