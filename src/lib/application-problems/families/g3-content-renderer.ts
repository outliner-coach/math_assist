import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'

interface Surface {
  prompt: string
  answer: string
  work: string
  choices?: string[]
}

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

function s(params: Readonly<Record<string, JsonValue>>, key: string): string {
  const value = params[key]
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${key} must be text`)
  return value
}

function b(params: Readonly<Record<string, JsonValue>>, key: string): boolean {
  const value = params[key]
  if (typeof value !== 'boolean') throw new TypeError(`${key} must be boolean`)
  return value
}

function angleKind(angle: number): '예각' | '직각' | '둔각' {
  return angle < 90 ? '예각' : angle === 90 ? '직각' : '둔각'
}

function lineDescription(kind: string): string {
  if (kind === '직선') return '양쪽으로 끝없이 이어지는 선'
  if (kind === '반직선') return '한 점에서 시작해 한쪽으로 끝없이 이어지는 선'
  if (kind === '선분') return '두 점을 곧게 이은 선'
  throw new TypeError(`unsupported line kind ${kind}`)
}

function graphCount(params: Readonly<Record<string, JsonValue>>, category: string): number {
  if (category === '가') return n(params, 'a')
  if (category === '나') return n(params, 'b')
  if (category === '다') return n(params, 'c')
  throw new TypeError(`unsupported category ${category}`)
}

function surface(familyId: string, p: Readonly<Record<string, JsonValue>>): Surface {
  switch (familyId) {
    case 'g3-1-add-sub-story-change': {
      const start = n(p, 'start'); const added = n(p, 'added'); const removed = n(p, 'removed')
      const answer = start + added - removed
      return { prompt: `책이 ${start}권 있었는데 ${added}권을 들이고 ${removed}권을 빌려주었습니다. 남은 책은 몇 권일까요?`, answer: String(answer), work: `${start}+${added}-${removed}=${answer}` }
    }
    case 'g3-1-add-sub-missing-start': {
      const added = n(p, 'added'); const end = n(p, 'end'); const answer = end - added
      return { prompt: `구슬을 ${added}개 더했더니 ${end}개가 되었습니다. 처음 구슬은 몇 개였을까요?`, answer: String(answer), work: `${end}-${added}=${answer}` }
    }
    case 'g3-1-add-sub-strategy-check': {
      const a = n(p, 'a'); const second = n(p, 'b'); const claimed = n(p, 'claimed'); const total = a + second
      const answer = claimed === total ? '맞아요' : '다시 계산해야 해요'
      return { prompt: `${a}+${second}를 ${claimed}라고 계산한 방법이 맞는지 판단하세요.`, answer, choices: ['맞아요', '다시 계산해야 해요'], work: `${a}+${second}=${total}` }
    }
    case 'g3-1-add-sub-operation-error': {
      const start = n(p, 'start'); const change = n(p, 'change'); const relation = s(p, 'relation')
      const answer = relation === 'add' ? start + change : start - change
      const situation = relation === 'add' ? '더 들어왔습니다' : '밖으로 나갔습니다'
      const symbol = relation === 'add' ? '+' : '-'
      return { prompt: `버스에 ${start}명이 있었고 ${change}명이 ${situation}. 올바른 결과를 쓰세요.`, answer: String(answer), work: `${start}${symbol}${change}=${answer}` }
    }
    case 'g3-1-lines-map-classification': {
      const lineKind = s(p, 'lineKind'); const angle = n(p, 'angle'); const answer = `${lineKind}, ${angleKind(angle)}`
      return { prompt: `${lineDescription(lineKind)}과 ${angle}°인 각을 차례로 분류하세요.`, answer, work: `${lineDescription(lineKind)}은 ${lineKind}, ${angle}°는 ${angleKind(angle)}` }
    }
    case 'g3-1-lines-angle-constraint': {
      const low = n(p, 'low'); const high = n(p, 'high'); const candidate = n(p, 'candidate')
      return { prompt: `${low}°보다 크고 ${high}°보다 작은 각을 고르세요.`, answer: `${candidate}°`, choices: [`${candidate}°`, `${low - 5}°`, `${high + 5}°`], work: `${low}<${candidate}<${high}` }
    }
    case 'g3-1-lines-property-check': {
      const actual = s(p, 'lineKind'); const claimed = s(p, 'claimedKind'); const answer = actual === claimed ? '맞아요' : '아니에요'
      return { prompt: `${lineDescription(actual)}을 ${claimed}이라고 한 주장이 맞는지 판단하세요.`, answer, choices: ['맞아요', '아니에요'], work: `${lineDescription(actual)}은 ${actual}` }
    }
    case 'g3-1-lines-classification-error': {
      const angle = n(p, 'angle'); const claimed = s(p, 'claimedKind'); const answer = angleKind(angle)
      return { prompt: `${angle}°인 각을 ${claimed}이라고 분류했습니다. 올바른 분류를 고르세요.`, answer, choices: ['예각', '직각', '둔각'], work: `${angle}°는 ${answer}` }
    }
    case 'g3-1-division-sharing-plan': {
      const total = n(p, 'total'); const groups = n(p, 'groups'); const answer = total / groups
      return { prompt: `귤 ${total}개를 ${groups}명에게 똑같이 나누면 한 명은 몇 개씩 받을까요?`, answer: String(answer), work: `${total}÷${groups}=${answer}` }
    }
    case 'g3-1-division-missing-total': {
      const groups = n(p, 'groups'); const each = n(p, 'each'); const answer = groups * each
      return { prompt: `${groups}묶음에 ${each}개씩 들어 있습니다. 전체는 몇 개인지 나눗셈의 역관계로 구하세요.`, answer: String(answer), work: `${groups}×${each}=${answer}` }
    }
    case 'g3-1-division-model-check': {
      const total = n(p, 'total'); const groups = n(p, 'groups'); const claimedEach = n(p, 'claimedEach'); const actual = total / groups
      const answer = actual === claimedEach ? '맞아요' : '아니에요'
      return { prompt: `${total}개를 ${groups}묶음으로 나누면 한 묶음이 ${claimedEach}개라는 말이 맞는지 판단하세요.`, answer, choices: ['맞아요', '아니에요'], work: `${total}÷${groups}=${actual}` }
    }
    case 'g3-1-division-fact-error': {
      const total = n(p, 'total'); const divisor = n(p, 'divisor'); const claimed = n(p, 'claimed'); const answer = total / divisor
      return { prompt: `${total}÷${divisor}=${claimed}라고 계산했습니다. 오류를 고쳐 올바른 몫을 쓰세요.`, answer: String(answer), work: `${total}÷${divisor}=${answer}` }
    }
    case 'g3-1-multiply-two-step-total': {
      const boxes = n(p, 'boxes'); const each = n(p, 'each'); const removed = n(p, 'removed'); const answer = boxes * each - removed
      return { prompt: `상자 ${boxes}개에 ${each}개씩 담고 그중 ${removed}개를 사용했습니다. 남은 것은 몇 개일까요?`, answer: String(answer), work: `${boxes}×${each}-${removed}=${answer}` }
    }
    case 'g3-1-multiply-missing-groups': {
      const total = n(p, 'total'); const each = n(p, 'each'); const answer = total / each
      return { prompt: `${each}개씩 묶어 전체 ${total}개가 되었습니다. 묶음은 몇 개인지 역으로 구하세요.`, answer: String(answer), work: `${total}÷${each}=${answer}` }
    }
    case 'g3-1-multiply-strategy-compare': {
      const a = n(p, 'a'); const second = n(p, 'b'); const split = n(p, 'split'); const claimed = n(p, 'claimed'); const actual = a * second
      const answer = claimed === actual ? '맞아요' : '아니에요'
      return { prompt: `${a}×${second}를 ${a}×${split}+${a}×${second - split}=${claimed}로 계산한 방법이 맞는지 판단하세요.`, answer, choices: ['맞아요', '아니에요'], work: `${a}×${second}=${actual}` }
    }
    case 'g3-1-multiply-product-error': {
      const a = n(p, 'a'); const second = n(p, 'b'); const claimed = n(p, 'claimed'); const answer = a * second
      return { prompt: `${a}×${second}=${claimed}라고 계산했습니다. 오류를 고쳐 올바른 곱을 쓰세요.`, answer: String(answer), work: `${a}×${second}=${answer}` }
    }
    case 'g3-1-length-time-trip-conversion': {
      const km = n(p, 'km'); const m = n(p, 'm'); const hour = n(p, 'hour'); const minute = n(p, 'minute')
      const metres = km * 1000 + m; const minutes = hour * 60 + minute
      return { prompt: `${km}km ${m}m 길이의 길을 ${hour}시간 ${minute}분 동안 걸었습니다. 길이는 몇 m이고 시간은 몇 분인지 함께 쓰세요.`, answer: `${metres}m, ${minutes}분`, work: `${km}×1000+${m}=${metres}, ${hour}×60+${minute}=${minutes}` }
    }
    case 'g3-1-length-time-missing-distance': {
      const totalM = n(p, 'totalM'); const firstM = n(p, 'firstM'); const answer = totalM - firstM
      return { prompt: `전체 ${totalM}m 중 ${firstM}m를 걸었습니다. 남은 거리는 몇 m일까요?`, answer: String(answer), work: `${totalM}-${firstM}=${answer}` }
    }
    case 'g3-1-length-time-elapsed-time': {
      const startMinute = n(p, 'startMinute'); const startSecond = n(p, 'startSecond'); const endMinute = n(p, 'endMinute'); const endSecond = n(p, 'endSecond')
      const answer = endMinute * 60 + endSecond - startMinute * 60 - startSecond
      return { prompt: `${startMinute}분 ${startSecond}초에 시작해 ${endMinute}분 ${endSecond}초에 끝났습니다. 걸린 시간은 몇 초일까요?`, answer: String(answer), work: `(${endMinute}×60+${endSecond})-(${startMinute}×60+${startSecond})=${answer}` }
    }
    case 'g3-1-length-time-unit-claim-error': {
      const cm = n(p, 'cm'); const mm = n(p, 'mm'); const claimedMm = n(p, 'claimedMm'); const answer = cm * 10 + mm
      return { prompt: `${cm}cm ${mm}mm를 ${claimedMm}mm라고 나타냈습니다. 올바른 mm 값을 쓰세요.`, answer: String(answer), work: `${cm}×10+${mm}=${answer}` }
    }
    case 'g3-1-fraction-decimal-tenths-conversion': {
      const shaded = n(p, 'shaded'); const answer = `${shaded}/10 = 0.${shaded}`
      return { prompt: `전체를 10등분한 것 중 ${shaded}부분을 분수와 소수로 함께 나타내세요.`, answer, work: `${shaded}부분은 ${shaded}/10이고 소수로 0.${shaded}` }
    }
    case 'g3-1-fraction-decimal-missing-parts': {
      const total = n(p, 'total'); const shaded = n(p, 'shaded'); const answer = total - shaded
      return { prompt: `${total}등분한 띠에서 ${shaded}부분이 색칠되었습니다. 색칠하지 않은 부분은 몇 부분일까요?`, answer: String(answer), work: `${total}-${shaded}=${answer}` }
    }
    case 'g3-1-fraction-decimal-representation-check': {
      const numerator = n(p, 'numerator'); const decimalNumerator = n(p, 'decimalNumerator'); const answer = numerator === decimalNumerator ? '같아요' : '달라요'
      return { prompt: `${numerator}/10과 0.${decimalNumerator}이 같은 양인지 판단하세요.`, answer, choices: ['같아요', '달라요'], work: `${numerator}/10=0.${numerator}` }
    }
    case 'g3-1-fraction-decimal-decimal-claim-error': {
      const numerator = n(p, 'numerator'); const claimedDecimalNumerator = n(p, 'claimedDecimalNumerator'); const answer = `0.${numerator}`
      return { prompt: `${numerator}/10을 0.${claimedDecimalNumerator}이라고 썼습니다. 올바른 소수를 쓰세요.`, answer, work: `${numerator}/10=${answer}` }
    }
    case 'g3-2-multiply-box-total': {
      const packs = n(p, 'packs'); const each = n(p, 'each'); const extra = n(p, 'extra'); const answer = packs * each + extra
      return { prompt: `${each}개씩 든 묶음 ${packs}개와 낱개 ${extra}개가 있습니다. 모두 몇 개일까요?`, answer: String(answer), work: `${packs}×${each}+${extra}=${answer}` }
    }
    case 'g3-2-multiply-missing-factor': {
      const total = n(p, 'total'); const factor = n(p, 'factor'); const answer = total / factor
      return { prompt: `${factor}×□=${total}이 되도록 빠진 수를 구하세요.`, answer: String(answer), work: `${total}÷${factor}=${answer}` }
    }
    case 'g3-2-multiply-distributive-check': {
      const a = n(p, 'a'); const second = n(p, 'b'); const split = n(p, 'split'); const claimed = n(p, 'claimed'); const actual = a * second
      const answer = actual === claimed ? '맞아요' : '아니에요'
      return { prompt: `${a}×${second}를 ${a}×${split}+${a}×${second - split}=${claimed}로 나눈 방법이 맞는지 판단하세요.`, answer, choices: ['맞아요', '아니에요'], work: `${a}×${second}=${actual}` }
    }
    case 'g3-2-multiply-product-error': {
      const a = n(p, 'a'); const second = n(p, 'b'); const claimed = n(p, 'claimed'); const answer = a * second
      return { prompt: `${a}×${second}=${claimed}라고 계산했습니다. 올바른 곱을 쓰세요.`, answer: String(answer), work: `${a}×${second}=${answer}` }
    }
    case 'g3-2-division-share-remainder': {
      const total = n(p, 'total'); const divisor = n(p, 'divisor'); const quotient = Math.floor(total / divisor); const remainder = total % divisor
      const answer = `${quotient}개씩, ${remainder}개 남아요`
      return { prompt: `사탕 ${total}개를 ${divisor}명에게 똑같이 나누면 몇 개씩 받고 몇 개가 남을까요?`, answer, work: `${total}=${divisor}×${quotient}+${remainder}` }
    }
    case 'g3-2-division-missing-dividend': {
      const divisor = n(p, 'divisor'); const quotient = n(p, 'quotient'); const remainder = n(p, 'remainder'); const answer = divisor * quotient + remainder
      return { prompt: `어떤 수를 ${divisor}로 나누면 몫이 ${quotient}, 나머지가 ${remainder}입니다. 어떤 수인지 구하세요.`, answer: String(answer), work: `${divisor}×${quotient}+${remainder}=${answer}` }
    }
    case 'g3-2-division-remainder-constraint': {
      const divisor = n(p, 'divisor'); const candidate = n(p, 'candidate')
      return { prompt: `${divisor}로 나눈 나머지가 될 수 있는 수를 고르세요.`, answer: String(candidate), choices: [String(candidate), String(divisor), String(divisor + 1)], work: `0≤나머지<${divisor}` }
    }
    case 'g3-2-division-quotient-error': {
      const total = n(p, 'total'); const divisor = n(p, 'divisor'); const claimedQuotient = n(p, 'claimedQuotient'); const quotient = Math.floor(total / divisor); const remainder = total % divisor
      const answer = `${quotient}, 나머지 ${remainder}`
      return { prompt: `${total}÷${divisor}의 몫을 ${claimedQuotient}라고 했습니다. 올바른 몫과 나머지를 쓰세요.`, answer, work: `${total}=${divisor}×${quotient}+${remainder}` }
    }
    case 'g3-2-circle-compass-diameter': {
      const radius = n(p, 'radius'); const answer = radius * 2
      return { prompt: `컴퍼스를 ${radius}cm만큼 벌려 그린 원의 지름은 몇 cm일까요?`, answer: String(answer), work: `${radius}×2=${answer}` }
    }
    case 'g3-2-circle-missing-radius': {
      const diameter = n(p, 'diameter'); const answer = diameter / 2
      return { prompt: `지름이 ${diameter}cm인 원의 반지름은 몇 cm일까요?`, answer: String(answer), work: `${diameter}÷2=${answer}` }
    }
    case 'g3-2-circle-construction-constraint': {
      const targetDiameter = n(p, 'targetDiameter'); const opening = n(p, 'opening'); const answer = opening * 2 === targetDiameter ? '그릴 수 있어요' : '그릴 수 없어요'
      return { prompt: `컴퍼스를 ${opening}cm만큼 벌려 지름 ${targetDiameter}cm인 원을 그릴 수 있는지 판단하세요.`, answer, choices: ['그릴 수 있어요', '그릴 수 없어요'], work: `${opening}×2=${opening * 2}` }
    }
    case 'g3-2-circle-property-error': {
      const radius = n(p, 'radius'); const claimedDiameter = n(p, 'claimedDiameter'); const answer = radius * 2
      return { prompt: `반지름 ${radius}cm인 원의 지름을 ${claimedDiameter}cm라고 했습니다. 올바른 지름을 쓰세요.`, answer: String(answer), work: `${radius}×2=${answer}` }
    }
    case 'g3-2-fraction-form-and-compare': {
      const whole = n(p, 'whole'); const numerator = n(p, 'numerator'); const denominator = n(p, 'denominator'); const otherNumerator = n(p, 'otherNumerator')
      const improper = whole * denominator + numerator
      const answer = improper > otherNumerator ? '대분수가 더 커요' : improper < otherNumerator ? '가분수가 더 커요' : '같아요'
      return { prompt: `대분수 ${whole}와 ${numerator}/${denominator}, 가분수 ${otherNumerator}/${denominator}의 크기를 비교하세요.`, answer, choices: ['대분수가 더 커요', '가분수가 더 커요', '같아요'], work: `${whole}와 ${numerator}/${denominator}=${improper}/${denominator}` }
    }
    case 'g3-2-fraction-missing-numerator': {
      const denominator = n(p, 'denominator'); const lowNumerator = n(p, 'lowNumerator'); const highNumerator = n(p, 'highNumerator'); const candidate = n(p, 'candidate')
      return { prompt: `${lowNumerator}/${denominator}보다 크고 ${highNumerator}/${denominator}보다 작은 분수의 분자를 고르세요.`, answer: String(candidate), choices: [String(candidate), String(lowNumerator), String(highNumerator)], work: `${lowNumerator}<${candidate}<${highNumerator}` }
    }
    case 'g3-2-fraction-representation-shift': {
      const whole = n(p, 'whole'); const numerator = n(p, 'numerator'); const denominator = n(p, 'denominator'); const improper = whole * denominator + numerator
      const answer = `${improper}/${denominator}`
      return { prompt: `대분수 ${whole}와 ${numerator}/${denominator}을 가분수로 나타내세요.`, answer, work: `${whole}×${denominator}+${numerator}=${improper}` }
    }
    case 'g3-2-fraction-comparison-error': {
      const leftNumerator = n(p, 'leftNumerator'); const rightNumerator = n(p, 'rightNumerator'); const denominator = n(p, 'denominator'); const claimed = s(p, 'claimed')
      const answer = leftNumerator > rightNumerator ? '왼쪽이 더 커요' : leftNumerator < rightNumerator ? '오른쪽이 더 커요' : '같아요'
      return { prompt: `${leftNumerator}/${denominator}과 ${rightNumerator}/${denominator}을 비교해 “${claimed}”라고 했습니다. 올바른 비교를 고르세요.`, answer, choices: ['왼쪽이 더 커요', '오른쪽이 더 커요', '같아요'], work: `분모가 같으므로 ${leftNumerator}와 ${rightNumerator}을 비교` }
    }
    case 'g3-2-capacity-weight-measure-pair': {
      const liters = n(p, 'liters'); const milliliters = n(p, 'milliliters'); const kg = n(p, 'kg'); const g = n(p, 'g')
      const mlTotal = liters * 1000 + milliliters; const gTotal = kg * 1000 + g
      return { prompt: `물 ${liters}L ${milliliters}mL와 상자 ${kg}kg ${g}g을 각각 작은 단위로 나타내세요.`, answer: `${mlTotal}mL, ${gTotal}g`, work: `${liters}×1000+${milliliters}=${mlTotal}, ${kg}×1000+${g}=${gTotal}` }
    }
    case 'g3-2-capacity-weight-missing-capacity': {
      const totalMl = n(p, 'totalMl'); const usedMl = n(p, 'usedMl'); const answer = totalMl - usedMl
      return { prompt: `주스 ${totalMl}mL 중 ${usedMl}mL를 마셨습니다. 남은 양은 몇 mL일까요?`, answer: String(answer), work: `${totalMl}-${usedMl}=${answer}` }
    }
    case 'g3-2-capacity-weight-conversion-compare': {
      const liters = n(p, 'liters'); const milliliters = n(p, 'milliliters'); const claimedMl = n(p, 'claimedMl'); const actual = liters * 1000 + milliliters
      const answer = actual === claimedMl ? '맞아요' : '아니에요'
      return { prompt: `${liters}L ${milliliters}mL가 ${claimedMl}mL라는 말이 맞는지 판단하세요.`, answer, choices: ['맞아요', '아니에요'], work: `${liters}×1000+${milliliters}=${actual}` }
    }
    case 'g3-2-capacity-weight-weight-error': {
      const kg = n(p, 'kg'); const g = n(p, 'g'); const claimedG = n(p, 'claimedG'); const answer = kg * 1000 + g
      return { prompt: `${kg}kg ${g}g을 ${claimedG}g이라고 나타냈습니다. 올바른 g 값을 쓰세요.`, answer: String(answer), work: `${kg}×1000+${g}=${answer}` }
    }
    case 'g3-2-graph-table-to-bar': {
      const target = s(p, 'target'); const answer = graphCount(p, target)
      return { prompt: `표의 값이 가 ${n(p, 'a')}, 나 ${n(p, 'b')}, 다 ${n(p, 'c')}입니다. ${target} 항목의 막대 높이는 얼마여야 할까요?`, answer: String(answer), work: `${target}의 표 값 ${answer}을 막대 높이로 옮김` }
    }
    case 'g3-2-graph-missing-category': {
      const total = n(p, 'total'); const a = n(p, 'a'); const second = n(p, 'b'); const answer = total - a - second
      return { prompt: `세 항목의 합이 ${total}이고 가 ${a}, 나 ${second}일 때 다의 값은 얼마일까요?`, answer: String(answer), work: `${total}-${a}-${second}=${answer}` }
    }
    case 'g3-2-graph-claim-error': {
      const claimedCategory = s(p, 'claimedCategory'); const counts = [['가', n(p, 'a')], ['나', n(p, 'b')], ['다', n(p, 'c')]] as const
      const answer = [...counts].sort((left, right) => right[1] - left[1])[0][0]
      return { prompt: `가 ${n(p, 'a')}, 나 ${n(p, 'b')}, 다 ${n(p, 'c')}인 그래프에서 ${claimedCategory}가 가장 크다고 했습니다. 실제 가장 큰 항목을 고르세요.`, answer, choices: ['가', '나', '다'], work: `세 막대의 높이를 비교하면 ${answer}가 가장 큼` }
    }
    case 'g3-2-graph-data-sufficiency': {
      const a = n(p, 'a'); const second = n(p, 'b'); const hasCategoryLabels = b(p, 'hasCategoryLabels'); const answer = hasCategoryLabels ? '충분해요' : '부족해요'
      const labelState = hasCategoryLabels ? '가와 나 이름이 표시되어 있고' : '항목 이름이 가려져 있고'
      return { prompt: `두 막대의 높이는 ${a}와 ${second}이고 ${labelState} 차이를 묻습니다. 어느 항목이 더 큰지 판단할 정보가 충분한가요?`, answer, choices: ['충분해요', '부족해요'], work: hasCategoryLabels ? `이름과 높이를 연결해 ${a}와 ${second}을 비교` : '높이는 알아도 어느 막대가 어느 항목인지 알 수 없음' }
    }
    default:
      throw new TypeError(`unknown Grade 3 application family ${familyId}`)
  }
}

export function renderGrade3ApplicationContent(
  familyId: string,
  params: Readonly<Record<string, JsonValue>>,
): ApplicationProblemRenderedContentV1 {
  const expected = surface(familyId, params)
  const choices = expected.choices
  return {
    prompt: expected.prompt,
    answer: {
      format: choices ? 'choice' : /^\d+$/.test(expected.answer) ? 'number' : 'text',
      normalized: expected.answer,
    },
    ...(choices ? { choices, correctChoiceIndex: choices.indexOf(expected.answer) } : {}),
    solutionSteps: [
      `주어진 관계를 식이나 그림으로 나타내면 ${expected.work}입니다.`,
      `조건을 다시 확인하면 답은 ${expected.answer}입니다.`,
    ],
    hintSteps: [
      '주어진 값과 구하려는 값을 먼저 구분하세요.',
      '관계를 식이나 그림으로 나타낸 뒤 원래 조건에 맞는지 확인하세요.',
    ],
  }
}
