import type { Settings } from './types'

/** Встроенные ранги (порядок — по возрастанию веса) */
export const POSITION_IDS = [
  'junior-minus',
  'junior-plus',
  'middle-minus',
  'middle-plus',
  'senior-minus',
  'senior-plus',
] as const

export type BuiltinPosition = (typeof POSITION_IDS)[number]

/**
 * Ранг: один из встроенных или id пользовательского ранга.
 * Открытый строковый тип — `(string & {})` сохраняет автодополнение литералов.
 */
export type Position = BuiltinPosition | (string & {})

/** Пользовательский ранг, созданный в настройках */
export interface CustomPosition {
  id: string
  /** Отображаемое название */
  label: string
  /** Короткая метка для бейджей */
  short: string
  weight: number
}

export interface PositionInfo {
  id: BuiltinPosition
  /** Отображаемое название */
  label: string
  /** Короткая метка для бейджей */
  short: string
  defaultWeight: number
}

export const POSITIONS: readonly PositionInfo[] = [
  { id: 'junior-minus', label: 'Junior minus', short: 'J−', defaultWeight: 1 },
  { id: 'junior-plus', label: 'Junior plus', short: 'J+', defaultWeight: 2 },
  { id: 'middle-minus', label: 'Middle minus', short: 'M−', defaultWeight: 3 },
  { id: 'middle-plus', label: 'Middle plus', short: 'M+', defaultWeight: 4 },
  { id: 'senior-minus', label: 'Senior minus', short: 'S−', defaultWeight: 5 },
  { id: 'senior-plus', label: 'Senior plus', short: 'S+', defaultWeight: 6 },
]

export const POSITION_BY_ID: Readonly<Record<BuiltinPosition, PositionInfo>> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p]),
) as Record<BuiltinPosition, PositionInfo>

export const DEFAULT_WEIGHTS: Record<BuiltinPosition, number> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p.defaultWeight]),
) as Record<BuiltinPosition, number>

export function isPosition(value: unknown): value is BuiltinPosition {
  return typeof value === 'string' && (POSITION_IDS as readonly string[]).includes(value)
}

/** Ранг с актуальным весом: встроенный или пользовательский */
export interface ResolvedPosition {
  id: Position
  label: string
  short: string
  weight: number
  builtin: boolean
}

/** Все ранги: встроенные (вес из настроек) + пользовательские */
export function resolvePositions(settings: Settings): ResolvedPosition[] {
  const builtins: ResolvedPosition[] = POSITIONS.map((p) => ({
    id: p.id,
    label: p.label,
    short: p.short,
    weight: settings.weights[p.id],
    builtin: true,
  }))
  const customs: ResolvedPosition[] = settings.customPositions.map((p) => ({
    id: p.id,
    label: p.label,
    short: p.short,
    weight: p.weight,
    builtin: false,
  }))
  return [...builtins, ...customs]
}

/** Информация о ранге по id; undefined для неизвестного id (например, удалённого) */
export function resolvePosition(id: Position, settings: Settings): ResolvedPosition | undefined {
  return resolvePositions(settings).find((p) => p.id === id)
}

/** Актуальный вес ранга (0 для неизвестного id — на случай внешних данных) */
export function weightOfPosition(id: Position, settings: Settings): number {
  if (isPosition(id)) return settings.weights[id]
  return settings.customPositions.find((p) => p.id === id)?.weight ?? 0
}

/** Короткая метка из названия: первые буквы слов, до 3 символов */
export function shortFromLabel(label: string): string {
  const letters = label.replaceAll(/\s+/g, '').slice(0, 3).toUpperCase()
  return letters || '?'
}

/** Занято ли такое название ранга (без учёта регистра) */
export function isLabelTaken(label: string, settings: Settings): boolean {
  const normalized = label.trim().toLowerCase()
  if (!normalized) return true
  return resolvePositions(settings).some((p) => p.label.toLowerCase() === normalized)
}
