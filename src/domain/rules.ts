import { POSITION_BY_ID } from './positions'
import type { Participant, Rule } from './types'

/**
 * Человекочитаемое описание правила — для списка правил и отчёта.
 * `getParticipant` может вернуть undefined (участник удалён).
 */
export function describeRule(
  rule: Rule,
  getParticipant: (id: string) => Participant | undefined,
): string {
  const nameOf = (id: string): string => getParticipant(id)?.fullName ?? 'удалённый участник'

  switch (rule.type) {
    case 'together':
      return `«${nameOf(rule.a)}» и «${nameOf(rule.b)}» — в одной команде`
    case 'separate':
      return `«${nameOf(rule.a)}» и «${nameOf(rule.b)}» — в разных командах`
    case 'level-cap': {
      const info = POSITION_BY_ID[rule.position]
      return `не больше ${rule.maxPerTeam} × ${info.label} в команде`
    }
  }
}
