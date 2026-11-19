import { describeRule } from '@/domain/rules'
import { resolvePosition, weightOfPosition } from '@/domain/positions'
import type { Participant, Report, RuleResult, Settings, TeamBalance } from '@/domain/types'

interface TeamLike {
  id: string
  name: string
  memberIds: readonly string[]
}

/**
 * Отчёт по текущему составу команд: баланс, разброс и статус каждого правила.
 * Используется и сразу после распределения, и для live-пересчёта при ручных переносах.
 */
export function computeReport(
  teams: readonly TeamLike[],
  participants: readonly Participant[],
  settings: Settings,
  impossibleRules: ReadonlyMap<string, string> = new Map(),
): Report {
  const byId = new Map(participants.map((p) => [p.id, p] as const))
  const teamNameOf = new Map(teams.map((team) => [team.id, team.name] as const))
  const teamOfMember = new Map<string, string>()
  for (const team of teams) {
    for (const id of team.memberIds) teamOfMember.set(id, team.id)
  }

  const balance: TeamBalance[] = teams.map((team) => {
    const members = team.memberIds.map((id) => byId.get(id)).filter((p) => p !== undefined)
    const totalWeight = members.reduce(
      (sum, p) => sum + weightOfPosition(p!.position, settings),
      0,
    )
    return {
      teamId: team.id,
      count: members.length,
      totalWeight,
      avgWeight: members.length > 0 ? totalWeight / members.length : 0,
    }
  })

  const totals = balance.map((b) => b.totalWeight)
  const spread = totals.length > 0 ? Math.max(...totals) - Math.min(...totals) : 0

  const ruleResults: RuleResult[] = []
  for (const rule of settings.rules) {
    if (!rule.enabled) continue

    const label = describeRule(
      rule,
      (id) => byId.get(id),
      (position) => resolvePosition(position, settings)?.label ?? String(position),
    )
    const base = { ruleId: rule.id, label }

    const impossibleReason = impossibleRules.get(rule.id)
    if (impossibleReason !== undefined) {
      ruleResults.push({ ...base, ok: false, message: impossibleReason })
      continue
    }

    switch (rule.type) {
      case 'together': {
        const teamA = teamOfMember.get(rule.a)
        const teamB = teamOfMember.get(rule.b)
        if (teamA === undefined || teamB === undefined || teamA !== teamB) {
          ruleResults.push({
            ...base,
            ok: false,
            message: `в разных командах: ${teamNameOf.get(teamA ?? '') ?? '?'} и ${teamNameOf.get(teamB ?? '') ?? '?'}`,
          })
        } else {
          ruleResults.push({ ...base, ok: true, message: 'выполнено' })
        }
        break
      }
      case 'separate': {
        const teamA = teamOfMember.get(rule.a)
        const teamB = teamOfMember.get(rule.b)
        if (teamA !== undefined && teamA === teamB) {
          ruleResults.push({
            ...base,
            ok: false,
            message: `оказались вместе в ${teamNameOf.get(teamA) ?? '?'}`,
          })
        } else {
          ruleResults.push({ ...base, ok: true, message: 'выполнено' })
        }
        break
      }
      case 'level-cap': {
        const violators: string[] = []
        for (const team of teams) {
          let count = 0
          for (const id of team.memberIds) {
            if (byId.get(id)?.position === rule.position) count++
          }
          if (count > rule.maxPerTeam) {
            violators.push(`${team.name}: ${count} (лимит ${rule.maxPerTeam})`)
          }
        }
        if (violators.length > 0) {
          ruleResults.push({
            ...base,
            ok: false,
            message: `превышение — ${violators.join('; ')}`,
          })
        } else {
          ruleResults.push({ ...base, ok: true, message: 'выполнено' })
        }
        break
      }
    }
  }

  return { ruleResults, balance, spread }
}
