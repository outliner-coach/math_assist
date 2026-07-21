const MAX_EXPRESSION_LENGTH = 512
const MAX_NESTING_DEPTH = 64

export type ArithmeticExpressionErrorCode =
  | 'invalid-expression'
  | 'division-by-zero'
  | 'non-finite-result'
  | 'limit-exceeded'

export class ArithmeticExpressionError extends Error {
  constructor(readonly code: ArithmeticExpressionErrorCode) {
    super('Invalid arithmetic expression')
    this.name = 'ArithmeticExpressionError'
  }
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new ArithmeticExpressionError('non-finite-result')
  return value
}

class ArithmeticParser {
  private index = 0

  constructor(private readonly expression: string) {}

  evaluate(): number {
    this.skipWhitespace()
    if (this.atEnd()) throw new ArithmeticExpressionError('invalid-expression')
    const value = this.parseExpression(0)
    this.skipWhitespace()
    if (!this.atEnd()) throw new ArithmeticExpressionError('invalid-expression')
    return finite(value)
  }

  private parseExpression(depth: number): number {
    let value = this.parseTerm(depth)
    while (true) {
      this.skipWhitespace()
      const operator = this.peek()
      if (operator !== '+' && operator !== '-') return value
      this.index += 1
      const right = this.parseTerm(depth)
      value = finite(operator === '+' ? value + right : value - right)
    }
  }

  private parseTerm(depth: number): number {
    let value = this.parseUnary(depth)
    while (true) {
      this.skipWhitespace()
      const operator = this.peek()
      if (operator !== '*' && operator !== '/') return value
      this.index += 1
      const right = this.parseUnary(depth)
      if (operator === '/' && right === 0) {
        throw new ArithmeticExpressionError('division-by-zero')
      }
      value = finite(operator === '*' ? value * right : value / right)
    }
  }

  private parseUnary(depth: number): number {
    this.assertDepth(depth)
    this.skipWhitespace()
    const operator = this.peek()
    if (operator === '+' || operator === '-') {
      this.index += 1
      const value = this.parseUnary(depth + 1)
      return finite(operator === '-' ? -value : value)
    }
    return this.parsePrimary(depth)
  }

  private parsePrimary(depth: number): number {
    this.skipWhitespace()
    if (this.peek() === '(') {
      this.assertDepth(depth + 1)
      this.index += 1
      const value = this.parseExpression(depth + 1)
      this.skipWhitespace()
      if (this.peek() !== ')') throw new ArithmeticExpressionError('invalid-expression')
      this.index += 1
      return value
    }
    return this.parseNumber()
  }

  private parseNumber(): number {
    this.skipWhitespace()
    const start = this.index
    while (this.isDigit(this.peek())) this.index += 1
    const integerDigits = this.index - start
    let fractionDigits = 0
    if (this.peek() === '.') {
      this.index += 1
      const fractionStart = this.index
      while (this.isDigit(this.peek())) this.index += 1
      fractionDigits = this.index - fractionStart
    }
    if (integerDigits === 0 && fractionDigits === 0) {
      throw new ArithmeticExpressionError('invalid-expression')
    }
    return finite(Number(this.expression.slice(start, this.index)))
  }

  private assertDepth(depth: number): void {
    if (depth > MAX_NESTING_DEPTH) throw new ArithmeticExpressionError('limit-exceeded')
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) this.index += 1
  }

  private peek(): string {
    return this.expression[this.index] ?? ''
  }

  private atEnd(): boolean {
    return this.index >= this.expression.length
  }

  private isDigit(value: string): boolean {
    return value >= '0' && value <= '9'
  }
}

/**
 * Evaluates the numeric subset used by problem templates without compiling or
 * executing source text. Identifiers and registered functions must be resolved
 * by the caller before this boundary.
 */
export function evaluateArithmeticExpression(expression: string): number {
  if (
    typeof expression !== 'string' ||
    expression.length === 0 ||
    expression.length > MAX_EXPRESSION_LENGTH
  ) {
    throw new ArithmeticExpressionError('limit-exceeded')
  }
  return new ArithmeticParser(expression).evaluate()
}
