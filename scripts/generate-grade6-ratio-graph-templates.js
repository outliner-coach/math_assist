const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6ratiograph.json')
const sets = ['A', 'B', 'C']

const ratioGraph = (kind, caption, segments, maskedValueIndex) => ({
  type: 'ratio_graph',
  semantics: 'quantitative',
  props: {
    caption,
    kind,
    segments,
    ...(maskedValueIndex === undefined ? {} : { maskedValueIndex }),
  },
})

const segment = (label, percent) => ({ label, percent })

const setDefinitions = {
  A: [
    {
      family: 'a-band-missing-experience-percent',
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 현장 체험의 비율만 가려져 있습니다. 현장 체험을 고른 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['전체 100%에서 독서 30%와 기타 {{70 - p * 10}}%를 뺍니다.', '100-30-{{70 - p * 10}}={{p * 10}}%입니다.'],
      visual: ratioGraph('band', '희망 학급 활동', [
        segment('현장 체험', '{{p * 10}}'),
        segment('독서', 30),
        segment('기타', '{{70 - p * 10}}'),
      ], 0),
    },
    {
      family: 'a-circle-missing-art-percent',
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수04-02]',
      prompt: '원그래프에서 미술의 비율만 가려져 있습니다. 미술을 고른 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['과학 30%와 체육 {{70 - p * 10}}%의 합을 100%에서 뺍니다.', '미술은 {{p * 10}}%입니다.'],
      visual: ratioGraph('circle', '좋아하는 방과후 활동', [
        segment('과학', 30),
        segment('미술', '{{p * 10}}'),
        segment('체육', '{{70 - p * 10}}'),
      ], 1),
    },
    {
      family: 'a-band-missing-transport-percent',
      domain: 'knowing',
      pattern: 'inverse',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 대중교통의 비율만 가려져 있습니다. 대중교통을 이용한 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: '80 - p * 10',
      steps: ['도보 {{p * 10}}%와 자전거 20%를 더합니다.', '100-{{p * 10 + 20}}={{80 - p * 10}}%입니다.'],
      visual: ratioGraph('band', '학교에 오는 방법', [
        segment('도보', '{{p * 10}}'),
        segment('자전거', 20),
        segment('대중교통', '{{80 - p * 10}}'),
      ], 2),
    },
    {
      family: 'a-circle-combined-leisure-percent',
      domain: 'knowing',
      pattern: 'systematic_counting',
      standard: '[6수04-02]',
      prompt: '원그래프에서 책 읽기와 운동을 고른 비율의 합은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10 + 30',
      steps: ['책 읽기 {{p * 10}}%와 운동 30%를 찾습니다.', '두 비율의 합은 {{p * 10 + 30}}%입니다.'],
      visual: ratioGraph('circle', '주말 여가 활동', [
        segment('책 읽기', '{{p * 10}}'),
        segment('운동', 30),
        segment('영상', '{{70 - p * 10}}'),
      ]),
    },
    {
      family: 'a-band-library-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 독서 분야를 조사해 띠그래프로 나타냈습니다. 문학을 고른 학생은 몇 명인가요?',
      solver: '4 * p',
      steps: ['문학은 전체의 40%입니다.', '{{p * 10}}×0.4={{4 * p}}명이므로 문학을 고른 학생은 {{4 * p}}명입니다.'],
      visual: ratioGraph('band', '희망 독서 분야', [
        segment('문학', 40),
        segment('과학', 30),
        segment('역사', 30),
      ]),
    },
    {
      family: 'a-circle-pet-count-gap',
      domain: 'applying',
      pattern: 'compare_methods',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 희망 반려동물을 조사했습니다. 강아지를 고른 학생은 새를 고른 학생보다 몇 명 더 많은가요?',
      solver: '3 * p',
      steps: ['강아지와 새의 비율 차는 50-20=30%p입니다.', '{{p * 10}}×0.3={{3 * p}}명입니다.'],
      visual: ratioGraph('circle', '희망 반려동물', [
        segment('강아지', 50),
        segment('고양이', 30),
        segment('새', 20),
      ]),
    },
    {
      family: 'a-band-two-program-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 20}}명의 체험 프로그램 희망을 조사했습니다. 로봇과 요리를 고른 학생은 모두 몇 명인가요?',
      solver: '12 * p',
      steps: ['로봇과 요리의 비율은 25+35=60%입니다.', '{{p * 20}}×0.6={{12 * p}}명입니다.'],
      visual: ratioGraph('band', '희망 체험 프로그램', [
        segment('로봇', 25),
        segment('요리', 35),
        segment('생태', 40),
      ]),
    },
    {
      family: 'a-circle-survey-remaining-count',
      domain: 'applying',
      pattern: 'inverse',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 5}}명의 급식 선호를 조사해 원그래프로 나타냈습니다. 한식과 양식을 제외한 학생은 몇 명인가요?',
      solver: '2 * p',
      steps: ['한식과 양식을 제외한 분식의 비율은 40%입니다.', '{{p * 5}}×0.4={{2 * p}}명입니다.'],
      visual: ratioGraph('circle', '급식 선호', [
        segment('한식', 20),
        segment('양식', 40),
        segment('분식', 40),
      ]),
    },
    {
      family: 'a-band-repeated-label-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 10}}명인 {{p}}개 학급의 같은 띠그래프에서 현장 학습 30%를 40%로 잘못 읽었습니다. 모든 학급을 합치면 학생 수를 몇 명 더 많게 계산하나요?',
      solver: 'p * p',
      steps: ['한 학급의 오차는 10%p이므로 {{p * 10}}×0.1={{p}}명입니다.', '{{p}}개 학급에서는 {{p}}×{{p}}={{p * p}}명 차이입니다.'],
      visual: ratioGraph('band', '학급별 희망 행사', [
        segment('현장 학습', 30),
        segment('운동회', 40),
        segment('전시회', 30),
      ]),
    },
    {
      family: 'a-circle-repeated-sector-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 20}}명인 {{p}}개 동아리의 원그래프에서 공연 30%를 봉사 50%와 같다고 잘못 계산했습니다. 모든 동아리를 합친 학생 수의 오차는 몇 명인가요?',
      solver: '4 * p * p',
      steps: ['두 부문의 차는 50-30=20%p입니다.', '한 동아리 오차 {{4 * p}}명에 {{p}}개 동아리를 곱하면 {{4 * p * p}}명입니다.'],
      visual: ratioGraph('circle', '동아리 희망 활동', [
        segment('공연', 30),
        segment('탐구', 20),
        segment('봉사', 50),
      ]),
    },
  ],
  B: [
    {
      family: 'b-circle-missing-fiction-percent',
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수04-02]',
      prompt: '원그래프에서 소설의 비율만 가려져 있습니다. 소설의 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['나머지 두 부문은 40%와 {{60 - p * 10}}%입니다.', '100-40-{{60 - p * 10}}={{p * 10}}%입니다.'],
      visual: ratioGraph('circle', '도서관 대출 분야', [
        segment('소설', '{{p * 10}}'),
        segment('과학', 40),
        segment('역사', '{{60 - p * 10}}'),
      ], 0),
    },
    {
      family: 'b-band-missing-bus-percent',
      domain: 'knowing',
      pattern: 'inverse',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 버스의 비율만 가려져 있습니다. 버스로 등교한 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['도보 20%와 기타 {{80 - p * 10}}%를 더합니다.', '100에서 빼면 버스는 {{p * 10}}%입니다.'],
      visual: ratioGraph('band', '등교 방법', [
        segment('도보', 20),
        segment('버스', '{{p * 10}}'),
        segment('기타', '{{80 - p * 10}}'),
      ], 1),
    },
    {
      family: 'b-circle-missing-outdoor-percent',
      domain: 'knowing',
      pattern: 'inverse',
      standard: '[6수04-02]',
      prompt: '원그래프에서 야외 활동의 비율만 가려져 있습니다. 야외 활동의 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: '70 - p * 10',
      steps: ['실내 활동 30%와 온라인 활동 {{p * 10}}%를 더합니다.', '100-{{p * 10 + 30}}={{70 - p * 10}}%입니다.'],
      visual: ratioGraph('circle', '방학 활동 장소', [
        segment('실내', 30),
        segment('온라인', '{{p * 10}}'),
        segment('야외', '{{70 - p * 10}}'),
      ], 2),
    },
    {
      family: 'b-band-two-commute-percent',
      domain: 'knowing',
      pattern: 'systematic_counting',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 걷기와 자전거를 합한 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10 + 20',
      steps: ['걷기 20%와 자전거 {{p * 10}}%를 찾습니다.', '합은 {{p * 10 + 20}}%입니다.'],
      visual: ratioGraph('band', '주말 이동 방법', [
        segment('걷기', 20),
        segment('자전거', '{{p * 10}}'),
        segment('자동차', '{{80 - p * 10}}'),
      ]),
    },
    {
      family: 'b-circle-science-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 선호 과목을 조사했습니다. 과학을 고른 학생은 몇 명인가요?',
      solver: '3 * p',
      steps: ['과학은 전체의 30%입니다.', '{{p * 10}}×0.3={{3 * p}}명입니다.'],
      visual: ratioGraph('circle', '선호 과목', [
        segment('과학', 30),
        segment('체육', 50),
        segment('음악', 20),
      ]),
    },
    {
      family: 'b-band-game-reading-gap',
      domain: 'applying',
      pattern: 'compare_methods',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 쉬는 시간 활동을 조사했습니다. 놀이를 고른 학생은 독서를 고른 학생보다 몇 명 더 많은가요?',
      solver: '3 * p',
      steps: ['놀이와 독서의 비율 차는 50-20=30%p입니다.', '{{p * 10}}×0.3={{3 * p}}명입니다.'],
      visual: ratioGraph('band', '쉬는 시간 활동', [
        segment('독서', 20),
        segment('놀이', 50),
        segment('대화', 30),
      ]),
    },
    {
      family: 'b-circle-find-survey-total',
      domain: 'applying',
      pattern: 'inverse',
      standard: '[6수04-03]',
      prompt: '원그래프에서 만들기 25%에 해당하는 학생이 {{p * 5}}명입니다. 조사한 학생은 모두 몇 명인가요?',
      solver: '20 * p',
      steps: ['25%는 전체의 1/4입니다.', '{{p * 5}}×4={{p * 20}}명이 전체입니다.'],
      visual: ratioGraph('circle', '희망 창의 활동', [
        segment('만들기', 25),
        segment('그리기', 35),
        segment('코딩', 40),
      ]),
    },
    {
      family: 'b-band-multiple-groups-combined-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 5}}명인 {{p}}개 모둠에서 실험과 토론의 비율이 모두 같은 띠그래프와 같습니다. 모든 모둠의 실험·토론 희망자는 몇 명인가요?',
      solver: '3 * p * p',
      steps: ['실험과 토론은 40+20=60%입니다.', '한 모둠 {{p * 5}}명의 60%는 {{3 * p}}명이고 {{p}}개 모둠은 {{3 * p * p}}명입니다.'],
      visual: ratioGraph('band', '탐구 방법 선호', [
        segment('실험', 40),
        segment('토론', 20),
        segment('관찰', 40),
      ]),
    },
    {
      family: 'b-circle-repeated-underread-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 10}}명인 {{p}}개 반의 원그래프에서 축구 40%를 30%로 잘못 읽었습니다. 전체 학생 수 계산의 오차는 몇 명인가요?',
      solver: 'p * p',
      steps: ['한 반에서 10%p 차이는 {{p * 10}}×0.1={{p}}명입니다.', '{{p}}개 반에서는 {{p * p}}명 차이입니다.'],
      visual: ratioGraph('circle', '희망 구기 종목', [
        segment('축구', 40),
        segment('농구', 30),
        segment('배구', 30),
      ]),
    },
    {
      family: 'b-band-merged-category-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 20}}명인 {{p}}개 학급에서 독서 20%와 운동 30%를 합해 40%라고 잘못 정리했습니다. 모든 학급을 합친 학생 수의 오차는 몇 명인가요?',
      solver: '2 * p * p',
      steps: ['실제 합은 20+30=50%이므로 10%p 부족합니다.', '한 학급 오차 {{2 * p}}명에 {{p}}개 학급을 곱하면 {{2 * p * p}}명입니다.'],
      visual: ratioGraph('band', '방과 후 활동', [
        segment('독서', 20),
        segment('운동', 30),
        segment('학원', 50),
      ]),
    },
  ],
  C: [
    {
      family: 'c-band-missing-fruit-percent',
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 과일의 비율만 가려져 있습니다. 과일을 고른 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['빵 20%와 음료 {{80 - p * 10}}%의 합을 100%에서 뺍니다.', '과일은 {{p * 10}}%입니다.'],
      visual: ratioGraph('band', '간식 선호', [
        segment('과일', '{{p * 10}}'),
        segment('빵', 20),
        segment('음료', '{{80 - p * 10}}'),
      ], 0),
    },
    {
      family: 'c-circle-missing-walk-percent',
      domain: 'knowing',
      pattern: 'inverse',
      standard: '[6수04-02]',
      prompt: '원그래프에서 걷기의 비율만 가려져 있습니다. 걷기의 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: 'p * 10',
      steps: ['자전거 40%와 버스 {{60 - p * 10}}%를 더합니다.', '100에서 빼면 걷기는 {{p * 10}}%입니다.'],
      visual: ratioGraph('circle', '공원 이동 방법', [
        segment('자전거', 40),
        segment('걷기', '{{p * 10}}'),
        segment('버스', '{{60 - p * 10}}'),
      ], 1),
    },
    {
      family: 'c-band-missing-paper-percent',
      domain: 'knowing',
      pattern: 'inverse',
      standard: '[6수04-02]',
      prompt: '띠그래프에서 종이의 비율만 가려져 있습니다. 종이의 비율은 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: '50 - p * 10',
      steps: ['플라스틱 30%와 캔 {{p * 10 + 20}}%를 더합니다.', '100-{{p * 10 + 50}}={{50 - p * 10}}%입니다.'],
      visual: ratioGraph('band', '재활용품 분류', [
        segment('플라스틱', 30),
        segment('캔', '{{p * 10 + 20}}'),
        segment('종이', '{{50 - p * 10}}'),
      ], 2),
    },
    {
      family: 'c-circle-nonfirst-combined-percent',
      domain: 'knowing',
      pattern: 'systematic_counting',
      standard: '[6수04-02]',
      prompt: '원그래프에서 두 번째와 세 번째 부문의 비율을 합하면 몇 %인가요? (단위 %는 쓰지 않아요.)',
      solver: '100 - p * 10',
      steps: ['전체는 100%이고 첫 번째 부문은 {{p * 10}}%입니다.', '나머지 두 부문의 합은 {{100 - p * 10}}%입니다.'],
      visual: ratioGraph('circle', '학교 축제 역할', [
        segment('진행', '{{p * 10}}'),
        segment('공연', 30),
        segment('전시', '{{70 - p * 10}}'),
      ]),
    },
    {
      family: 'c-band-remaining-data-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 주말 운동 자료를 띠그래프로 나타냈습니다. 달리기와 수영을 제외한 학생은 몇 명인가요?',
      solver: '3 * p',
      steps: ['달리기와 수영을 제외한 구기 운동은 30%입니다.', '{{p * 10}}×0.3={{3 * p}}명입니다.'],
      visual: ratioGraph('band', '주말 운동', [
        segment('달리기', 50),
        segment('수영', 20),
        segment('구기', 30),
      ]),
    },
    {
      family: 'c-circle-largest-smallest-gap',
      domain: 'applying',
      pattern: 'compare_methods',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 20}}명의 진로 체험 자료입니다. 가장 큰 부문과 가장 작은 부문의 학생 수 차는 몇 명인가요?',
      solver: '5 * p',
      steps: ['가장 큰 부문 50%와 가장 작은 부문 25%의 차는 25%p입니다.', '{{p * 20}}×0.25={{5 * p}}명입니다.'],
      visual: ratioGraph('circle', '진로 체험 분야', [
        segment('과학', 25),
        segment('예술', 25),
        segment('스포츠', 50),
      ]),
    },
    {
      family: 'c-band-first-third-combined-count',
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수04-03]',
      prompt: '학생 {{p * 10}}명의 환경 실천 자료입니다. 절전과 재사용을 실천한 학생은 모두 몇 명인가요?',
      solver: '7 * p',
      steps: ['절전과 재사용의 비율은 20+50=70%입니다.', '{{p * 10}}×0.7={{7 * p}}명입니다.'],
      visual: ratioGraph('band', '환경 실천 방법', [
        segment('절전', 20),
        segment('분리배출', 30),
        segment('재사용', 50),
      ]),
    },
    {
      family: 'c-circle-find-total-from-category',
      domain: 'applying',
      pattern: 'inverse',
      standard: '[6수04-03]',
      prompt: '원그래프에서 텃밭 40%에 해당하는 학생이 {{p * 4}}명입니다. 조사한 학생은 모두 몇 명인가요?',
      solver: '10 * p',
      steps: ['40%는 0.4입니다.', '전체 학생 수는 {{p * 4}}÷0.4={{p * 10}}명입니다.'],
      visual: ratioGraph('circle', '희망 생태 활동', [
        segment('텃밭', 40),
        segment('관찰', 40),
        segment('정화', 20),
      ]),
    },
    {
      family: 'c-band-overlap-double-count-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 10}}명인 {{p}}개 학급의 설문에서 두 답을 고른 학생 10%를 두 부문에 모두 넣어 합계가 110%가 되었습니다. 중복으로 센 학생은 모두 몇 명인가요?',
      solver: 'p * p',
      steps: ['한 학급에서 중복된 10%는 {{p * 10}}×0.1={{p}}명입니다.', '{{p}}개 학급의 중복 인원은 {{p * p}}명입니다.'],
      visual: ratioGraph('band', '정리한 독서 장소', [
        segment('교실', 30),
        segment('도서관', 30),
        segment('집', 40),
      ]),
    },
    {
      family: 'c-circle-swapped-sector-error',
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수04-03]',
      prompt: '각각 {{p * 20}}명인 {{p}}개 학교의 원그래프에서 아침 운동 20%와 독서 50%의 이름표를 서로 바꿨습니다. 아침 운동 인원 보고의 전체 오차는 몇 명인가요?',
      solver: '6 * p * p',
      steps: ['두 부문의 차는 50-20=30%p입니다.', '한 학교 오차 {{6 * p}}명에 {{p}}개 학교를 곱하면 {{6 * p * p}}명입니다.'],
      visual: ratioGraph('circle', '아침 활동', [
        segment('아침 운동', 20),
        segment('준비', 30),
        segment('독서', 50),
      ]),
    },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => ({
  id: `tmpl-g6ratiograph-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6ratiograph-001',
  type: 'number',
  difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
  set_id: setId,
  problem_family: definition.family,
  blueprint: {
    problemFamily: definition.family,
    cognitiveDomain: definition.domain,
    reasoningPattern: definition.pattern,
    primaryStandard: definition.standard,
    ...(definition.standard === '[6수04-03]'
      ? { connectedStandards: ['[6수04-02]'] }
      : {}),
    representations: index < 4
      ? ['text', 'graph']
      : ['text', 'equation', 'graph'],
    contextType: index < 4 ? 'pure_math' : index < 8 ? 'real_world' : 'puzzle',
    estimatedSteps: index >= 4 ? 3 : 2,
    readingLoad: index >= 8 ? 'medium' : 'low',
    visualSemantics: 'quantitative',
  },
  param_schema: {
    p: { min: 2, max: 4 },
  },
  prompt_template: definition.prompt,
  solver_rule: definition.solver,
  solution_steps_template: definition.domain === 'applying'
    ? [
        ...definition.steps,
        '구한 인원이나 전체 수를 다시 비율로 바꾸어 그래프의 부문 비율과 같은지 검산합니다.',
      ]
    : definition.steps,
  hint_steps_template: [
    definition.standard === '[6수04-02]'
      ? '띠 전체나 원 전체를 100%로 보고 보이는 부문의 비율을 먼저 더해요.'
      : '그래프의 비율을 소수로 바꾼 뒤 전체 자료 수에 곱해요.',
    index >= 8
      ? '한 집단의 오차를 먼저 구한 뒤 같은 조건의 집단 수만큼 누적해요.'
      : '부문을 합치거나 비교할 때 같은 전체를 기준으로 계산했는지 확인해요.',
  ],
  visual_template: definition.visual,
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 ratio-graph templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
