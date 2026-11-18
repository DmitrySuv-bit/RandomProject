/** Должности участников (порядок — по возрастанию веса) */
export const POSITION_IDS = [
  'junior-minus',
  'junior-plus',
  'middle-minus',
  'middle-plus',
  'senior-minus',
  'senior-plus',
] as const

export type Position = (typeof POSITION_IDS)[number]

export interface PositionInfo {
  id: Position
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

export const POSITION_BY_ID: Readonly<Record<Position, PositionInfo>> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p]),
) as Record<Position, PositionInfo>

export const DEFAULT_WEIGHTS: Record<Position, number> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p.defaultWeight]),
) as Record<Position, number>

export function isPosition(value: unknown): value is Position {
  return typeof value === 'string' && (POSITION_IDS as readonly string[]).includes(value)
}
