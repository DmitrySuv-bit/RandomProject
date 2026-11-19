import { POSITION_BY_ID, type Position } from './positions'
import type { Participant, Rule } from './types'

/**
 * Человекочитаемое описание правила — для списка правил и отчёта.
 * `getParticipant` может вернуть undefined (участник удалён).
 * `positionLabelOf` возвращает название ранга (встроенного или пользовательского).
 */
export function describeRule(
  rule: Rule,
  getParticipant: (id: string) => Participant | undefined,
  positionLabelOf: (position: Position) => string = (position) =>
    POSITION_BY_ID[position as keyof typeof POSITION_BY_ID]?.label ?? String(position),
): string {
  const nameOf = (id: string): string => getParticipant(id)?.fullName ?? 'удалённый участник'

  switch (rule.type) {
    case 'together':
      return `«${nameOf(rule.a)}» и «${nameOf(rule.b)}» — в одной команде`
    case 'separate':
      return `«${nameOf(rule.a)}» и «${nameOf(rule.b)}» — в разных командах`
    case 'level-cap': {
      return `не больше ${rule.maxPerTeam} × ${positionLabelOf(rule.position)} в команде`
    }
  }
}
