'use client'

import React from 'react'

import type {
  Grade2StructuredLengthInput,
  Grade2StructuredTimeInput,
} from '@/lib/grade2-answer-normalizers'
import type { Grade2Mission } from '@/lib/grade2-problems'

import Grade2MissionVisual from './Grade2MissionVisual'

interface Grade2MissionCardProps {
  mission: Grade2Mission
  selectedAnswer: string | null
  textAnswer: string
  lengthAnswer: Grade2StructuredLengthInput
  timeAnswer: Grade2StructuredTimeInput
  showHint: boolean
  wrongAttemptCount: number
  inputError: string | null
  solved: boolean
  missionCount: number
  onChoiceAnswer: (answer: string) => void
  onTextAnswerChange: (answer: string) => void
  onLengthAnswerChange: (answer: Grade2StructuredLengthInput) => void
  onTimeAnswerChange: (answer: Grade2StructuredTimeInput) => void
  onSubmitText: () => void
  onSubmitLength: () => void
  onSubmitTime: () => void
  onShowHint: () => void
}

const stepLabel = {
  easy: '쉬움',
  medium: '보통',
  applied: '적용',
}

function FieldInput({
  id,
  testId,
  value,
  suffix,
  onChange,
}: {
  id: string
  testId: string
  value: string | number | null | undefined
  suffix: string
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border-2 border-[#d8e3ef] bg-white px-3 py-2">
      <input
        id={id}
        data-testid={testId}
        inputMode="numeric"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[54px] min-w-0 text-center text-3xl font-black text-[#0f172a] outline-none"
      />
      <span className="text-lg font-black text-[#475569]">{suffix}</span>
    </label>
  )
}

function SubmitButton({
  children,
  onClick,
  disabled,
  testId,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  testId: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="min-h-[56px] w-full rounded-xl bg-[#2563eb] px-5 py-3 text-base font-black text-white shadow-[0_5px_0_#1e40af] transition active:translate-y-[3px] active:shadow-[0_2px_0_#1e40af] disabled:bg-[#94a3b8] disabled:shadow-[0_5px_0_#64748b]"
    >
      {children}
    </button>
  )
}

export default function Grade2MissionCard({
  mission,
  selectedAnswer,
  textAnswer,
  lengthAnswer,
  timeAnswer,
  showHint,
  wrongAttemptCount,
  inputError,
  solved,
  missionCount,
  onChoiceAnswer,
  onTextAnswerChange,
  onLengthAnswerChange,
  onTimeAnswerChange,
  onSubmitText,
  onSubmitLength,
  onSubmitTime,
  onShowHint,
}: Grade2MissionCardProps) {
  const isWrong = selectedAnswer !== null && !solved
  const emphasizeVisual = wrongAttemptCount >= 2 && !solved
  const showSolutionPath = wrongAttemptCount >= 3 && !solved
  const revealVisualAnswer = solved || showSolutionPath
  const lengthInputUnit = mission.answerConfig.unit ?? 'm-cm'
  const lengthInputLabel = mission.answerConfig.inputLabel ?? '길이를 써요'

  return (
    <section
      id="grade2-mission"
      className="scroll-mt-6 rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6"
      data-testid="grade2-mission-card"
      data-mission-id={mission.id}
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">
            <span className="text-[#64748b]">{mission.curriculumCode}</span>
            <span aria-hidden="true"> · </span>
            {mission.unitMissionOrder}/{missionCount}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#0f172a] md:text-3xl">
            {mission.prompt}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border-2 border-[#d8e3ef] px-4 py-2 text-sm font-black text-[#475569]">
          <span className="h-3 w-3 rounded-full bg-[#f97316]" />
          2학년 · {stepLabel[mission.difficultyStep]}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Grade2MissionVisual mission={mission} emphasize={emphasizeVisual} showAnswer={revealVisualAnswer} />

        <div className="space-y-4">
          <div className={`rounded-2xl border-2 p-4 ${isWrong ? 'border-[#ffb020] bg-[#fff7e6]' : 'border-[#d8e3ef] bg-[#f8fbff]'}`}>
            <p className="text-sm font-black text-[#2563eb]">{isWrong ? '다시 보기' : '오늘 목표'}</p>
            <p className="mt-2 text-base font-black leading-relaxed text-[#0f172a]">
              {isWrong
                ? wrongAttemptCount >= 2
                  ? '그림에서 노란 표시를 먼저 보고 다시 생각해요.'
                  : '힌트를 보고 같은 문제를 다시 풀어요.'
                : mission.learnerGoal}
            </p>
          </div>

          {showHint && !solved && (
            <div className="space-y-2 rounded-2xl border-2 border-[#ffb020] bg-[#fff7e6] p-4 text-base font-black leading-snug text-[#0f172a]" data-testid="grade2-mission-hint">
              {mission.hintSteps.map((hint) => (
                <p key={hint}>{hint}</p>
              ))}
            </div>
          )}

          {showSolutionPath && (
            <div className="space-y-2 rounded-2xl border-2 border-[#2563eb] bg-[#eff6ff] p-4 text-sm font-black leading-snug text-[#0f172a]" data-testid="grade2-solution-path">
              {mission.solutionSteps.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          )}

          {(mission.answerType === 'choice' || mission.answerType === 'label') && (
            <div className="grid gap-3" aria-label="정답 선택">
              {(mission.choices ?? []).map((choice) => {
                const active = selectedAnswer === choice
                return (
                  <button
                    key={choice}
                    type="button"
                    data-testid={`grade2-choice-${choice}`}
                    onClick={() => onChoiceAnswer(choice)}
                    className={`min-h-[60px] rounded-2xl border-2 px-3 text-xl font-black transition ${
                      active
                        ? solved
                          ? 'border-[#16a34a] bg-[#16a34a] text-white shadow-[0_5px_0_#166534]'
                          : 'border-[#ef4444] bg-[#fee2e2] text-[#0f172a] shadow-[0_5px_0_#fecaca]'
                        : 'border-[#d8e3ef] bg-white text-[#0f172a] shadow-[0_5px_0_#cbd5e1] hover:bg-[#eff6ff]'
                    }`}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          )}

          {mission.answerType === 'integer' && (
            <div className="space-y-3">
              <label className="block text-sm font-black text-[#475569]" htmlFor="grade2-integer-answer">
                답을 숫자로 써요
              </label>
              <input
                id="grade2-integer-answer"
                data-testid="grade2-integer-input"
                inputMode="numeric"
                value={textAnswer}
                onChange={(event) => onTextAnswerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSubmitText()
                }}
                className="min-h-[64px] w-full rounded-2xl border-2 border-[#d8e3ef] px-4 text-center text-3xl font-black text-[#0f172a] outline-none focus:border-[#2563eb]"
              />
              <SubmitButton
                onClick={onSubmitText}
                disabled={textAnswer.trim().length === 0}
                testId="grade2-integer-submit"
              >
                답 확인
              </SubmitButton>
            </div>
          )}

          {mission.answerType === 'length' && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">{lengthInputLabel}</p>
              <div className={lengthInputUnit === 'cm' ? 'grid gap-3' : 'grid grid-cols-2 gap-3'}>
                {lengthInputUnit !== 'cm' && (
                  <FieldInput
                    id="grade2-length-meters"
                    testId="grade2-length-meters"
                    value={lengthAnswer.meters}
                    suffix="m"
                    onChange={(meters) => onLengthAnswerChange({ ...lengthAnswer, meters })}
                  />
                )}
                <FieldInput
                  id="grade2-length-centimeters"
                  testId="grade2-length-centimeters"
                  value={lengthAnswer.centimeters}
                  suffix="cm"
                  onChange={(centimeters) =>
                    onLengthAnswerChange({
                      meters: lengthInputUnit === 'cm' ? '' : lengthAnswer.meters,
                      centimeters,
                    })
                  }
                />
              </div>
              <SubmitButton onClick={onSubmitLength} testId="grade2-length-submit">
                답 확인
              </SubmitButton>
            </div>
          )}

          {(mission.answerType === 'time-of-day' || mission.answerType === 'duration') && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">
                {mission.answerType === 'time-of-day' ? '시각을 써요' : '걸린 시간을 써요'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  id="grade2-time-hours"
                  testId={mission.answerType === 'time-of-day' ? 'grade2-time-hours' : 'grade2-duration-hours'}
                  value={timeAnswer.hours}
                  suffix={mission.answerType === 'time-of-day' ? '시' : '시간'}
                  onChange={(hours) => onTimeAnswerChange({ ...timeAnswer, hours })}
                />
                <FieldInput
                  id="grade2-time-minutes"
                  testId={mission.answerType === 'time-of-day' ? 'grade2-time-minutes' : 'grade2-duration-minutes'}
                  value={timeAnswer.minutes}
                  suffix="분"
                  onChange={(minutes) => onTimeAnswerChange({ ...timeAnswer, minutes })}
                />
              </div>
              <SubmitButton onClick={onSubmitTime} testId={mission.answerType === 'time-of-day' ? 'grade2-time-submit' : 'grade2-duration-submit'}>
                답 확인
              </SubmitButton>
            </div>
          )}

          {inputError && (
            <div className="rounded-2xl border-2 border-[#ef4444] bg-[#fee2e2] p-3 text-center text-sm font-black text-[#0f172a]" data-testid="grade2-input-error">
              {inputError}
            </div>
          )}

          {!solved && (
            <button
              type="button"
              className="min-h-[56px] w-full rounded-xl border-2 border-[#d8e3ef] bg-white px-5 py-3 text-base font-black text-[#2563eb] shadow-[0_5px_0_#cbd5e1] transition active:translate-y-[3px] active:shadow-[0_2px_0_#cbd5e1]"
              onClick={onShowHint}
              data-testid="grade2-show-hint"
            >
              힌트 보기
            </button>
          )}

          {solved && (
            <div className="rounded-2xl border-2 border-[#16a34a] bg-[#dcfce7] p-4 text-center text-lg font-black text-[#0f172a]" data-testid="grade2-mission-success">
              맞았어요. 같은 단원의 다음 길이 열렸어요!
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
