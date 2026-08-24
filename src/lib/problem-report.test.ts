import { describe, expect, it } from 'vitest'

import {
  NOT_AVAILABLE_PROBLEM_ID,
  PROBLEM_REPORT_CLASSIFICATIONS,
  SUPPORT_EMAIL,
  buildProblemReport,
  buildProblemReportClipboardText,
  buildProblemReportMailtoUrl,
  containsForbiddenReportContent,
} from './problem-report'

const POLLUTED_INPUT = {
  classification: 'math-content',
  problemId: 'g5-add-001?answer=42&isCorrect=true',
  contentRelease: 'content-rel-9\nUSER_AGENT: Mozilla/5.0 (Macintosh) 192.168.0.12',
  appRelease: 'app-rel-3; nickname=철수; profile-777',
  screenTemplate: 'practice',
  answer: 42,
  correctAnswer: '42',
  isCorrect: true,
  hintUsed: true,
  nickname: '철수',
  profileId: 'profile-777',
  learnerId: 'learner-777',
  scratchpad: '비밀 낙서 내용',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
  queryString: '?token=abc123',
}

const FORBIDDEN_OUTPUT_TOKENS = [
  '정답',
  '오답',
  '답안',
  '힌트',
  'isCorrect',
  'answer=',
  'correctAnswer',
  'hintUsed',
  '닉네임',
  '철수',
  'nickname',
  'profile-777',
  'learner-777',
  'profileId',
  '낙서',
  'scratchpad',
  'Mozilla/5.0',
  'user-agent',
  'userAgent',
  '192.168.0.12',
  'token=abc123',
]

function expectClean(text: string, options: { structuredMailto?: boolean } = {}): void {
  const decoded = decodeURIComponent(
    options.structuredMailto ? text.replace('?', ' ') : text,
  )
  for (const token of FORBIDDEN_OUTPUT_TOKENS) {
    expect(decoded.includes(token), `forbidden token leaked: ${token}`).toBe(false)
  }
  expect(decoded).not.toContain('?')
  expect(decoded).not.toContain('\n ')
}

describe('problem report constants', () => {
  it('uses the operations mailbox and the four spec classifications', () => {
    expect(SUPPORT_EMAIL).toBe('outliner0206@gmail.com')
    expect([...PROBLEM_REPORT_CLASSIFICATIONS]).toEqual([
      'math-content',
      'display-input',
      'accessibility',
      'technical',
    ])
    expect(NOT_AVAILABLE_PROBLEM_ID).toBe('not-available')
  })
})

describe('buildProblemReport with clean input', () => {
  const report = buildProblemReport({
    classification: 'accessibility',
    problemId: 'g4-frac-cmp-012',
    contentRelease: 'content-2026.08.1',
    appRelease: 'app-0.1.0',
    screenTemplate: 'practice',
  })

  it('builds the spec subject with the problem id', () => {
    expect(report.subject).toBe('Math Assist 문제 신고: g4-frac-cmp-012')
  })

  it('contains only the five fixed items in Korean', () => {
    const lines = report.body.split('\n')
    expect(lines).toEqual([
      'Math Assist 문제 신고',
      '',
      '분류: accessibility',
      '문제 ID: g4-frac-cmp-012',
      '콘텐츠 릴리스: content-2026.08.1',
      '앱 릴리스: app-0.1.0',
      '화면 템플릿: practice',
      '',
      '이 보고문에는 학습 기록이 포함되지 않습니다.',
    ])
  })

  it('opens the operations mailbox with encoded subject and body', () => {
    expect(report.mailtoUrl.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true)
    expect(report.mailtoUrl).toContain(
      `subject=${encodeURIComponent('Math Assist 문제 신고: g4-frac-cmp-012')}`,
    )
    expect(report.mailtoUrl).toContain(`body=${encodeURIComponent(report.body)}`)
    expect(report.mailtoUrl).not.toMatch(/\n/)
  })

  it('clipboard fallback carries the same body text', () => {
    expect(buildProblemReportClipboardText(report)).toBe(report.body)
  })
})

describe('buildProblemReport drops polluted inputs', () => {
  const report = buildProblemReport(POLLUTED_INPUT)

  it('falls back to not-available when ids carry answers or queries', () => {
    expect(report.subject).toBe(`Math Assist 문제 신고: ${NOT_AVAILABLE_PROBLEM_ID}`)
    expect(report.body).toContain(`문제 ID: ${NOT_AVAILABLE_PROBLEM_ID}`)
  })

  it('never forwards forbidden payloads into subject or body', () => {
    expectClean(report.subject)
    expectClean(report.body)
    expectClean(report.mailtoUrl, { structuredMailto: true })
  })

  it('keeps safe fields while sanitizing hostile ones', () => {
    expect(report.body).toContain('분류: math-content')
    expect(report.body).toContain('화면 템플릿: practice')
    expect(report.body).not.toContain('content-rel-9')
    expect(report.body).toContain('콘텐츠 릴리스: not-available')
    expect(report.body).not.toContain('app-rel-3')
    expect(report.body).toContain('앱 릴리스: not-available')
  })
})

describe('buildProblemReport normalizes malformed shapes', () => {
  it('treats missing or junk fields as not-available without throwing', () => {
    const report = buildProblemReport({
      classification: 'totally-wrong',
      problemId: 12345,
      contentRelease: null,
      appRelease: undefined,
      screenTemplate: '../etc/passwd',
    })
    expect(report.body).toContain('분류: technical')
    expect(report.body).toContain(`문제 ID: ${NOT_AVAILABLE_PROBLEM_ID}`)
    expect(report.body).toContain('콘텐츠 릴리스: not-available')
    expect(report.body).toContain('앱 릴리스: not-available')
    expect(report.body).toContain('화면 템플릿: unknown')
    expectClean(report.subject)
    expectClean(report.body)
  })

  it('accepts an empty input object', () => {
    const report = buildProblemReport({})
    expect(report.subject).toBe(`Math Assist 문제 신고: ${NOT_AVAILABLE_PROBLEM_ID}`)
    expectClean(report.body)
  })
})

describe('buildProblemReportMailtoUrl', () => {
  it('matches the report mailto url for polluted input', () => {
    expect(buildProblemReportMailtoUrl(POLLUTED_INPUT)).toBe(
      buildProblemReport(POLLUTED_INPUT).mailtoUrl,
    )
  })
})

describe('containsForbiddenReportContent', () => {
  it('flags known leak patterns', () => {
    expect(containsForbiddenReportContent('정답은 42')).toBe(true)
    expect(containsForbiddenReportContent('isCorrect: true')).toBe(true)
    expect(containsForbiddenReportContent('Mozilla/5.0')).toBe(true)
    expect(containsForbiddenReportContent('id?next=/home')).toBe(true)
  })

  it('passes the fixed report body', () => {
    const report = buildProblemReport({
      classification: 'display-input',
      problemId: 'g2-mission-004',
      contentRelease: 'c-1',
      appRelease: 'a-1',
      screenTemplate: 'mission',
    })
    expect(containsForbiddenReportContent(report.body)).toBe(false)
    expect(containsForbiddenReportContent(report.subject)).toBe(false)
  })
})
