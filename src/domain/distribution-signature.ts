import type { Participant, Settings } from './types'

/**
 * Подпись входа распределения: всё, что влияет на состав команд.
 * Названия команд (teamNames) сознательно не входят — переименование
 * не меняет состав, поэтому не должно помечать результат устаревшим.
 */
export function distributionSignature(
  participants: readonly Participant[],
  settings: Settings,
): string {
  const people = participants
    .map((p) => `${p.id}:${p.position}`)
    .sort()
    .join(',')
  const { teamCount, sizingMode, minSize, maxSize, weights, customPositions, rules } = settings
  return JSON.stringify([people, teamCount, sizingMode, minSize, maxSize, weights, customPositions, rules])
}
