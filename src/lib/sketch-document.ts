export const SKETCH_DOCUMENT_SCHEMA_VERSION = 1 as const

export type ScratchToolId = 'pen' | 'eraser'

export interface SketchDocumentKey {
  learnerId: string | null
  sessionId: string
  itemId: string
}

export interface NormalizedPoint {
  x: number
  y: number
  pressure: number | null
}

export type SketchCommand =
  | {
      type: 'stroke'
      id: string
      tool: ScratchToolId
      points: NormalizedPoint[]
    }
  | {
      type: 'clear'
      id: string
    }

export interface SketchDocument extends SketchDocumentKey {
  schemaVersion: typeof SKETCH_DOCUMENT_SCHEMA_VERSION
  commands: SketchCommand[]
  historyCursor: number
  updatedAt: number
}

interface CanvasPoint {
  x: number
  y: number
  pressure?: number | null
}

interface CanvasBounds {
  width: number
  height: number
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isNormalizedPoint(value: unknown): value is NormalizedPoint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const point = value as Partial<NormalizedPoint>
  return isFiniteNumber(point.x) && point.x >= 0 && point.x <= 1 &&
    isFiniteNumber(point.y) && point.y >= 0 && point.y <= 1 &&
    (point.pressure === null || (
      isFiniteNumber(point.pressure) && point.pressure >= 0 && point.pressure <= 1
    ))
}

function isSketchCommand(value: unknown): value is SketchCommand {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const command = value as Partial<SketchCommand>
  if (!isNonEmptyString(command.id)) return false
  if (command.type === 'clear') return true
  if (command.type !== 'stroke') return false
  return (command.tool === 'pen' || command.tool === 'eraser') &&
    Array.isArray(command.points) &&
    command.points.length > 0 &&
    command.points.every(isNormalizedPoint)
}

function sameKey(left: SketchDocumentKey, right: SketchDocumentKey): boolean {
  return left.learnerId === right.learnerId &&
    left.sessionId === right.sessionId &&
    left.itemId === right.itemId
}

function parseDocumentValue(value: unknown): SketchDocument | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Partial<SketchDocument>
  if (candidate.schemaVersion !== SKETCH_DOCUMENT_SCHEMA_VERSION) return null
  if (
    candidate.learnerId !== null &&
    (typeof candidate.learnerId !== 'string' || candidate.learnerId.length === 0)
  ) return null
  if (!isNonEmptyString(candidate.sessionId) || !isNonEmptyString(candidate.itemId)) return null
  if (!Array.isArray(candidate.commands) || !candidate.commands.every(isSketchCommand)) return null
  if (
    !Number.isInteger(candidate.historyCursor) ||
    (candidate.historyCursor ?? -1) < 0 ||
    (candidate.historyCursor ?? Number.MAX_SAFE_INTEGER) > candidate.commands.length
  ) return null
  if (!isFiniteNumber(candidate.updatedAt)) return null

  const commandIds = new Set(candidate.commands.map((command) => command.id))
  if (commandIds.size !== candidate.commands.length) return null

  return {
    schemaVersion: SKETCH_DOCUMENT_SCHEMA_VERSION,
    learnerId: candidate.learnerId ?? null,
    sessionId: candidate.sessionId,
    itemId: candidate.itemId,
    commands: candidate.commands.map((command) => command.type === 'clear'
      ? { type: 'clear', id: command.id }
      : {
          type: 'stroke',
          id: command.id,
          tool: command.tool,
          points: command.points.map((point) => ({ ...point })),
        }),
    historyCursor: candidate.historyCursor!,
    updatedAt: candidate.updatedAt,
  }
}

export function normalizeSketchPoint(
  point: CanvasPoint,
  bounds: CanvasBounds,
): NormalizedPoint {
  if (
    !isFiniteNumber(bounds.width) || bounds.width <= 0 ||
    !isFiniteNumber(bounds.height) || bounds.height <= 0
  ) {
    throw new RangeError('Canvas bounds must be positive finite numbers.')
  }
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
    throw new TypeError('Canvas point coordinates must be finite numbers.')
  }

  return {
    x: clampUnit(point.x / bounds.width),
    y: clampUnit(point.y / bounds.height),
    pressure: isFiniteNumber(point.pressure) ? clampUnit(point.pressure) : null,
  }
}

export function projectSketchPoint(
  point: NormalizedPoint,
  bounds: CanvasBounds,
): { x: number; y: number; pressure: number | null } {
  if (
    !isNormalizedPoint(point) ||
    !isFiniteNumber(bounds.width) || bounds.width <= 0 ||
    !isFiniteNumber(bounds.height) || bounds.height <= 0
  ) {
    throw new RangeError('Normalized point and canvas bounds must be valid.')
  }
  return {
    x: point.x * bounds.width,
    y: point.y * bounds.height,
    pressure: point.pressure,
  }
}

export function createSketchDocument(
  key: SketchDocumentKey,
  updatedAt = Date.now(),
): SketchDocument {
  if (
    (key.learnerId !== null && !isNonEmptyString(key.learnerId)) ||
    !isNonEmptyString(key.sessionId) ||
    !isNonEmptyString(key.itemId) ||
    !isFiniteNumber(updatedAt)
  ) {
    throw new TypeError('Sketch documents require stable learner, session, and item identity.')
  }
  return {
    schemaVersion: SKETCH_DOCUMENT_SCHEMA_VERSION,
    ...key,
    commands: [],
    historyCursor: 0,
    updatedAt,
  }
}

function appendSketchCommand(
  document: SketchDocument,
  command: SketchCommand,
  updatedAt: number,
): SketchDocument {
  if (!isSketchCommand(command) || !isFiniteNumber(updatedAt)) {
    throw new TypeError('Sketch command is invalid.')
  }
  const activeCommands = document.commands.slice(0, document.historyCursor)
  if (activeCommands.some((entry) => entry.id === command.id)) {
    throw new TypeError('Sketch command IDs must be unique in the active history.')
  }
  const nextCommand: SketchCommand = command.type === 'clear'
    ? { type: 'clear', id: command.id }
    : {
        type: 'stroke',
        id: command.id,
        tool: command.tool,
        points: command.points.map((point) => ({ ...point })),
      }
  const commands = [...activeCommands, nextCommand]
  return {
    ...document,
    commands,
    historyCursor: commands.length,
    updatedAt,
  }
}

export function appendSketchStroke(
  document: SketchDocument,
  stroke: Omit<Extract<SketchCommand, { type: 'stroke' }>, 'type'>,
  updatedAt = Date.now(),
): SketchDocument {
  return appendSketchCommand(document, { type: 'stroke', ...stroke }, updatedAt)
}

export function appendSketchClear(
  document: SketchDocument,
  commandId: string,
  updatedAt = Date.now(),
): SketchDocument {
  return appendSketchCommand(document, { type: 'clear', id: commandId }, updatedAt)
}

export function undoSketchDocument(
  document: SketchDocument,
  updatedAt = Date.now(),
): SketchDocument {
  if (document.historyCursor === 0) return document
  return {
    ...document,
    historyCursor: document.historyCursor - 1,
    updatedAt,
  }
}

export function redoSketchDocument(
  document: SketchDocument,
  updatedAt = Date.now(),
): SketchDocument {
  if (document.historyCursor >= document.commands.length) return document
  return {
    ...document,
    historyCursor: document.historyCursor + 1,
    updatedAt,
  }
}

export function replaySketchDocument(document: SketchDocument): readonly SketchCommand[] {
  return document.commands.slice(0, document.historyCursor)
}

export function serializeSketchDocument(document: SketchDocument): string {
  const parsed = parseDocumentValue(document)
  if (!parsed) throw new TypeError('Cannot serialize an invalid sketch document.')
  return JSON.stringify(parsed)
}

export function parseSketchDocument(
  raw: string,
  expectedKey?: SketchDocumentKey,
): SketchDocument | null {
  try {
    const parsed = parseDocumentValue(JSON.parse(raw))
    if (!parsed || (expectedKey && !sameKey(parsed, expectedKey))) return null
    return parsed
  } catch {
    return null
  }
}
