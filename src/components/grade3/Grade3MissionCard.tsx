'use client'

import React from 'react'

import type {
  Grade3StructuredCapacityInput,
  Grade3StructuredFractionInput,
  Grade3StructuredLengthInput,
  Grade3StructuredTimeInput,
  Grade3StructuredWeightInput,
} from '@/lib/grade3-answer-normalizers'
import type { Grade3Mission } from '@/lib/grade3-problems'

import Grade3MissionVisual from './Grade3MissionVisual'

interface Grade3MissionCardProps {
  mission: Grade3Mission
  selectedAnswer: string | null
  textAnswer: string
  fractionAnswer: Grade3StructuredFractionInput
  lengthAnswer: Grade3StructuredLengthInput
  timeAnswer: Grade3StructuredTimeInput
  capacityAnswer: Grade3StructuredCapacityInput
  weightAnswer: Grade3StructuredWeightInput
  scaffoldSelection: string | null
  showHint: boolean
  wrongAttemptCount: number
  inputError: string | null
  solved: boolean
  missionCount: number
  onScaffoldSelect: (value: string) => void
  onChoiceAnswer: (answer: string) => void
  onTextAnswerChange: (answer: string) => void
  onFractionAnswerChange: (answer: Grade3StructuredFractionInput) => void
  onLengthAnswerChange: (answer: Grade3StructuredLengthInput) => void
  onTimeAnswerChange: (answer: Grade3StructuredTimeInput) => void
  onCapacityAnswerChange: (answer: Grade3StructuredCapacityInput) => void
  onWeightAnswerChange: (answer: Grade3StructuredWeightInput) => void
  onSubmitText: () => void
  onSubmitFraction: () => void
  onSubmitLength: () => void
  onSubmitTime: () => void
  onSubmitCapacity: () => void
  onSubmitWeight: () => void
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

function SubmitButton({ children, onClick, testId }: { children: React.ReactNode; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="min-h-[56px] w-full rounded-xl bg-[#2563eb] px-5 py-3 text-base font-black text-white shadow-[0_5px_0_#1e40af] transition active:translate-y-[3px] active:shadow-[0_2px_0_#1e40af]"
    >
      {children}
    </button>
  )
}

export default function Grade3MissionCard({
  mission,
  selectedAnswer,
  textAnswer,
  fractionAnswer,
  lengthAnswer,
  timeAnswer,
  capacityAnswer,
  weightAnswer,
  scaffoldSelection,
  showHint,
  wrongAttemptCount,
  inputError,
  solved,
  missionCount,
  onScaffoldSelect,
  onChoiceAnswer,
  onTextAnswerChange,
  onFractionAnswerChange,
  onLengthAnswerChange,
  onTimeAnswerChange,
  onCapacityAnswerChange,
  onWeightAnswerChange,
  onSubmitText,
  onSubmitFraction,
  onSubmitLength,
  onSubmitTime,
  onSubmitCapacity,
  onSubmitWeight,
  onShowHint,
}: Grade3MissionCardProps) {
  const isWrong = selectedAnswer !== null && !solved
  const emphasizeVisual = wrongAttemptCount >= 2 && !solved
  const showSolutionPath = wrongAttemptCount >= 3 && !solved
  const revealVisualAnswer = solved || showSolutionPath

  return (
    <section
      id="grade3-mission"
      className="scroll-mt-6 rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6"
      data-testid="grade3-mission-card"
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
          <span className="h-3 w-3 rounded-full bg-[#14b8a6]" />
          3학년 · {stepLabel[mission.difficultyStep]}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Grade3MissionVisual mission={mission} emphasize={emphasizeVisual} showAnswer={revealVisualAnswer} />

        <div className="space-y-4">
          <div className={`rounded-2xl border-2 p-4 ${isWrong ? 'border-[#ffb020] bg-[#fff7e6]' : 'border-[#d8e3ef] bg-[#f8fbff]'}`}>
            <p className="text-sm font-black text-[#2563eb]">{isWrong ? '다시 보기' : '오늘 목표'}</p>
            <p className="mt-2 text-base font-black leading-relaxed text-[#0f172a]">
              {isWrong ? '발판을 눌러 그림을 다시 보고, 답 칸만 고쳐요.' : mission.learnerGoal}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#ccfbf1] bg-[#f0fdfa] p-4" data-testid="grade3-scaffold">
            <p className="text-sm font-black text-[#0f766e]">{mission.scaffoldConfig.prompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(mission.scaffoldConfig.options ?? []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onScaffoldSelect(option)}
                  data-testid={`grade3-scaffold-option-${option}`}
                  className={`min-h-[44px] rounded-xl border-2 px-3 text-sm font-black ${
                    scaffoldSelection === option
                      ? 'border-[#0f766e] bg-[#0f766e] text-white'
                      : 'border-[#99f6e4] bg-white text-[#0f172a]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {showHint && !solved && (
            <div className="space-y-2 rounded-2xl border-2 border-[#ffb020] bg-[#fff7e6] p-4 text-base font-black leading-snug text-[#0f172a]" data-testid="grade3-mission-hint">
              {mission.hintSteps.map((hint) => <p key={hint}>{hint}</p>)}
            </div>
          )}

          {showSolutionPath && (
            <div className="space-y-2 rounded-2xl border-2 border-[#2563eb] bg-[#eff6ff] p-4 text-sm font-black leading-snug text-[#0f172a]" data-testid="grade3-solution-path">
              {mission.solutionSteps.map((step) => <p key={step}>{step}</p>)}
            </div>
          )}

          {(mission.answerType === 'choice' || mission.answerType === 'label') && (
            <div className="grid gap-3" aria-label="정답 선택">
              {(mission.choices ?? []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  data-testid={`grade3-choice-${choice}`}
                  onClick={() => onChoiceAnswer(choice)}
                  className={`min-h-[60px] rounded-2xl border-2 px-3 text-xl font-black transition ${
                    selectedAnswer === choice
                      ? solved
                        ? 'border-[#16a34a] bg-[#16a34a] text-white shadow-[0_5px_0_#166534]'
                        : 'border-[#ef4444] bg-[#fee2e2] text-[#0f172a] shadow-[0_5px_0_#fecaca]'
                      : 'border-[#d8e3ef] bg-white text-[#0f172a] shadow-[0_5px_0_#cbd5e1] hover:bg-[#eff6ff]'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          {['integer', 'decimal', 'angle'].includes(mission.answerType) && (
            <div className="space-y-3">
              <label className="block text-sm font-black text-[#475569]" htmlFor="grade3-text-answer">
                {mission.answerConfig.inputLabel ?? '답을 써요'}
              </label>
              <input
                id="grade3-text-answer"
                data-testid={mission.answerType === 'angle' ? 'grade3-angle-input' : mission.answerType === 'decimal' ? 'grade3-decimal-input' : 'grade3-integer-input'}
                inputMode="decimal"
                value={textAnswer}
                onChange={(event) => onTextAnswerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSubmitText()
                }}
                className="min-h-[64px] w-full rounded-2xl border-2 border-[#d8e3ef] px-4 text-center text-3xl font-black text-[#0f172a] outline-none focus:border-[#2563eb]"
              />
              <SubmitButton
                onClick={onSubmitText}
                testId={mission.answerType === 'angle' ? 'grade3-angle-submit' : mission.answerType === 'decimal' ? 'grade3-decimal-submit' : 'grade3-integer-submit'}
              >
                답 확인
              </SubmitButton>
            </div>
          )}

          {mission.answerType === 'fraction' && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">분수를 써요</p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <FieldInput id="grade3-fraction-numerator" testId="grade3-fraction-numerator" value={fractionAnswer.numerator} suffix="분자" onChange={(numerator) => onFractionAnswerChange({ ...fractionAnswer, numerator })} />
                <span className="text-4xl font-black text-[#0f172a]">/</span>
                <FieldInput id="grade3-fraction-denominator" testId="grade3-fraction-denominator" value={fractionAnswer.denominator} suffix="분모" onChange={(denominator) => onFractionAnswerChange({ ...fractionAnswer, denominator })} />
              </div>
              <SubmitButton onClick={onSubmitFraction} testId="grade3-fraction-submit">답 확인</SubmitButton>
            </div>
          )}

          {mission.answerType === 'length' && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">{mission.answerConfig.inputLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                {mission.answerConfig.unit === 'km-m' ? (
                  <>
                    <FieldInput id="grade3-length-kilometers" testId="grade3-length-kilometers" value={lengthAnswer.kilometers} suffix="km" onChange={(kilometers) => onLengthAnswerChange({ ...lengthAnswer, kilometers })} />
                    <FieldInput id="grade3-length-meters" testId="grade3-length-meters" value={lengthAnswer.meters} suffix="m" onChange={(meters) => onLengthAnswerChange({ ...lengthAnswer, meters })} />
                  </>
                ) : (
                  <>
                    <FieldInput id="grade3-length-centimeters" testId="grade3-length-centimeters" value={lengthAnswer.centimeters} suffix="cm" onChange={(centimeters) => onLengthAnswerChange({ ...lengthAnswer, centimeters })} />
                    <FieldInput id="grade3-length-millimeters" testId="grade3-length-millimeters" value={lengthAnswer.millimeters} suffix="mm" onChange={(millimeters) => onLengthAnswerChange({ ...lengthAnswer, millimeters })} />
                  </>
                )}
              </div>
              <SubmitButton onClick={onSubmitLength} testId="grade3-length-submit">답 확인</SubmitButton>
            </div>
          )}

          {(mission.answerType === 'time-of-day' || mission.answerType === 'duration') && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">{mission.answerConfig.inputLabel}</p>
              <div className="grid grid-cols-3 gap-2">
                <FieldInput id="grade3-time-hours" testId={mission.answerType === 'duration' ? 'grade3-duration-hours' : 'grade3-time-hours'} value={timeAnswer.hours} suffix={mission.answerType === 'duration' ? '시간' : '시'} onChange={(hours) => onTimeAnswerChange({ ...timeAnswer, hours })} />
                <FieldInput id="grade3-time-minutes" testId={mission.answerType === 'duration' ? 'grade3-duration-minutes' : 'grade3-time-minutes'} value={timeAnswer.minutes} suffix="분" onChange={(minutes) => onTimeAnswerChange({ ...timeAnswer, minutes })} />
                <FieldInput id="grade3-time-seconds" testId={mission.answerType === 'duration' ? 'grade3-duration-seconds' : 'grade3-time-seconds'} value={timeAnswer.seconds} suffix="초" onChange={(seconds) => onTimeAnswerChange({ ...timeAnswer, seconds })} />
              </div>
              <SubmitButton onClick={onSubmitTime} testId={mission.answerType === 'duration' ? 'grade3-duration-submit' : 'grade3-time-submit'}>답 확인</SubmitButton>
            </div>
          )}

          {mission.answerType === 'capacity' && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">들이를 써요</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput id="grade3-capacity-liters" testId="grade3-capacity-liters" value={capacityAnswer.liters} suffix="L" onChange={(liters) => onCapacityAnswerChange({ ...capacityAnswer, liters })} />
                <FieldInput id="grade3-capacity-milliliters" testId="grade3-capacity-milliliters" value={capacityAnswer.milliliters} suffix="mL" onChange={(milliliters) => onCapacityAnswerChange({ ...capacityAnswer, milliliters })} />
              </div>
              <SubmitButton onClick={onSubmitCapacity} testId="grade3-capacity-submit">답 확인</SubmitButton>
            </div>
          )}

          {mission.answerType === 'weight' && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#475569]">무게를 써요</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput id="grade3-weight-kilograms" testId="grade3-weight-kilograms" value={weightAnswer.kilograms} suffix="kg" onChange={(kilograms) => onWeightAnswerChange({ ...weightAnswer, kilograms })} />
                <FieldInput id="grade3-weight-grams" testId="grade3-weight-grams" value={weightAnswer.grams} suffix="g" onChange={(grams) => onWeightAnswerChange({ ...weightAnswer, grams })} />
              </div>
              <SubmitButton onClick={onSubmitWeight} testId="grade3-weight-submit">답 확인</SubmitButton>
            </div>
          )}

          {inputError && (
            <div className="rounded-2xl border-2 border-[#ef4444] bg-[#fee2e2] p-3 text-center text-sm font-black text-[#0f172a]" data-testid="grade3-input-error">
              {inputError}
            </div>
          )}

          {!solved && (
            <button
              type="button"
              className="min-h-[56px] w-full rounded-xl border-2 border-[#d8e3ef] bg-white px-5 py-3 text-base font-black text-[#2563eb] shadow-[0_5px_0_#cbd5e1] transition active:translate-y-[3px] active:shadow-[0_2px_0_#cbd5e1]"
              onClick={onShowHint}
              data-testid="grade3-show-hint"
            >
              힌트 보기
            </button>
          )}

          {solved && (
            <div className="rounded-2xl border-2 border-[#16a34a] bg-[#dcfce7] p-4 text-center text-lg font-black text-[#0f172a]" data-testid="grade3-mission-success">
              맞았어요. 같은 단원의 다음 길이 열렸어요!
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
