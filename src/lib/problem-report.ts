import { ROUTE_TEMPLATES, type RouteTemplate } from './error-reporting'

export const SUPPORT_EMAIL = 'outliner0206@gmail.com'

export const PROBLEM_REPORT_CLASSIFICATIONS = [
  'math-content',
  'display-input',
  'accessibility',
  'technical',
] as const

export type ProblemReportClassification = (typeof PROBLEM_REPORT_CLASSIFICATIONS)[number]

export const NOT_AVAILABLE_PROBLEM_ID = 'not-available'

const NOT_AVAILABLE_FIELD = 'not-available'

export interface RawProblemReportInput {
  classification?: unknown
  problemId?: unknown
  contentRelease?: unknown
  appRelease?: unknown
  screenTemplate?: unknown
}

export interface ProblemReport {
  classification: ProblemReportClassification
  problemId: string
  contentRelease: string
  appRelease: string
  screenTemplate: RouteTemplate
  subject: string
  body: string
  mailtoUrl: string
}

const PROBLEM_ID_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/
const RELEASE_PATTERN = /^[A-Za-z0-9._@:+-]{1,60}$/

const FORBIDDEN_REPORT_PATTERNS: RegExp[] = [
  /(정답|오답|답안|힌트|닉네임|낙서|풀이장)/,
  /\bisCorrect\b|\bcorrectAnswer\b|\bhintUsed\b|\banswer\s*=/i,
  /\bnickname\b|\bprofileId\b|\blearnerId\b|\bdeviceId\b/i,
  /profile-\d|learner-\d|device-\d/i,
  /\bscratchpad\b|\blocalStorage\b|\buserAgent\b|\buser-agent\b/i,
  /Mozilla\//i,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /[?&#]/,
]

function normalizeClassification(raw: unknown): ProblemReportClassification {
  return (PROBLEM_REPORT_CLASSIFICATIONS as readonly string[]).includes(raw as string)
    ? (raw as ProblemReportClassification)
    : 'technical'
}

function normalizeProblemId(raw: unknown): string {
  if (typeof raw !== 'string') return NOT_AVAILABLE_PROBLEM_ID
  return PROBLEM_ID_PATTERN.test(raw) ? raw : NOT_AVAILABLE_PROBLEM_ID
}

function normalizeReleaseField(raw: unknown): string {
  if (typeof raw !== 'string') return NOT_AVAILABLE_FIELD
  return RELEASE_PATTERN.test(raw) ? raw : NOT_AVAILABLE_FIELD
}

function normalizeScreenTemplate(raw: unknown): RouteTemplate {
  if (typeof raw !== 'string') return 'unknown'
  const cleaned = raw.trim().toLowerCase()
  return (ROUTE_TEMPLATES as readonly string[]).includes(cleaned)
    ? (cleaned as RouteTemplate)
    : 'unknown'
}

export function containsForbiddenReportContent(text: string): boolean {
  return FORBIDDEN_REPORT_PATTERNS.some((pattern) => pattern.test(text))
}

function buildReportBody(fields: {
  classification: ProblemReportClassification
  problemId: string
  contentRelease: string
  appRelease: string
  screenTemplate: RouteTemplate
}): string {
  return [
    'Math Assist 문제 신고',
    '',
    `분류: ${fields.classification}`,
    `문제 ID: ${fields.problemId}`,
    `콘텐츠 릴리스: ${fields.contentRelease}`,
    `앱 릴리스: ${fields.appRelease}`,
    `화면 템플릿: ${fields.screenTemplate}`,
    '',
    '이 보고문에는 학습 기록이 포함되지 않습니다.',
  ].join('\n')
}

export function buildProblemReport(input: RawProblemReportInput): ProblemReport {
  let fields = {
    classification: normalizeClassification(input.classification),
    problemId: normalizeProblemId(input.problemId),
    contentRelease: normalizeReleaseField(input.contentRelease),
    appRelease: normalizeReleaseField(input.appRelease),
    screenTemplate: normalizeScreenTemplate(input.screenTemplate),
  }
  let subject = `Math Assist 문제 신고: ${fields.problemId}`
  let body = buildReportBody(fields)
  if (containsForbiddenReportContent(subject) || containsForbiddenReportContent(body)) {
    fields = {
      ...fields,
      problemId: NOT_AVAILABLE_PROBLEM_ID,
      contentRelease: NOT_AVAILABLE_FIELD,
      appRelease: NOT_AVAILABLE_FIELD,
      screenTemplate: 'unknown',
    }
    subject = `Math Assist 문제 신고: ${NOT_AVAILABLE_PROBLEM_ID}`
    body = buildReportBody(fields)
  }
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return { ...fields, subject, body, mailtoUrl }
}

export function buildProblemReportClipboardText(report: ProblemReport): string {
  return report.body
}

export function buildProblemReportMailtoUrl(input: RawProblemReportInput): string {
  return buildProblemReport(input).mailtoUrl
}
