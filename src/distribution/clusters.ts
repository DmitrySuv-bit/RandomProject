import { weightOfPosition, type Position } from '@/domain/positions'
import type { LevelCapRule, Participant, Rule, SeparateRule, Settings, TogetherRule } from '@/domain/types'

/** Атомарная единица распределения: одиночный участник или связанная группа */
export interface Unit {
  memberIds: string[]
  weight: number
  size: number
  positionCounts: Map<Position, number>
}

export interface ClusteringOutcome {
  units: Unit[]
  /** ruleId → причина, почему правило заведомо невыполнимо (для отчёта) */
  impossibleRules: Map<string, string>
  /** Выполнимые цели для оптимизации */
  togetherPairs: ReadonlyArray<{ ruleId: string; a: string; b: string }>
  separatePairs: ReadonlyArray<{ ruleId: string; a: string; b: string }>
  levelCaps: ReadonlyArray<{ ruleId: string; position: Position; maxPerTeam: number }>
}

/**
 * Кластеризация правил «вместе» (union-find) с разбором заведомо
 * невыполнимых правил: best effort — остальное дорешает оптимизация.
 */
export function buildClusters(
  participants: readonly Participant[],
  settings: Settings,
  maxUnitSize: number,
): ClusteringOutcome {
  const activeRules = settings.rules.filter((rule) => rule.enabled)
  const togethers = activeRules.filter((rule): rule is TogetherRule => rule.type === 'together')
  const separates = activeRules.filter((rule): rule is SeparateRule => rule.type === 'separate')
  const caps = activeRules.filter((rule): rule is LevelCapRule => rule.type === 'level-cap')

  const positionOf = new Map(participants.map((p) => [p.id, p.position]))
  const weightOf = new Map(participants.map((p) => [p.id, weightOfPosition(p.position, settings)]))

  /* Union-find по правилам «вместе» */
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    let root = parent.get(id) ?? id
    if (root === id) return root
    root = find(root)
    parent.set(id, root)
    return root
  }
  const union = (a: string, b: string): void => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const rule of togethers) union(rule.a, rule.b)

  /* Группы участников */
  const groups = new Map<string, string[]>()
  for (const participant of participants) {
    const root = find(participant.id)
    const group = groups.get(root) ?? []
    group.push(participant.id)
    groups.set(root, group)
  }

  const impossibleRules = new Map<string, string>()
  const brokenGroupRoots = new Set<string>()

  /* Слишком большие группы: правила «вместе» невыполнимы, группу разбиваем */
  for (const [root, ids] of groups) {
    if (ids.length > maxUnitSize) {
      brokenGroupRoots.add(root)
      for (const rule of togethers) {
        if (find(rule.a) === root) {
          impossibleRules.set(
            rule.id,
            `связанная группа из ${ids.length} человек не помещается в команду (максимум ${maxUnitSize})`,
          )
        }
      }
    }
  }

  /* «Раздельно» внутри одной группы — противоречит «вместе» */
  for (const rule of separates) {
    const rootA = find(rule.a)
    if (rootA === find(rule.b) && !brokenGroupRoots.has(rootA)) {
      impossibleRules.set(rule.id, 'участники объединены правилами «вместе»')
    }
  }

  /* Лимит должности уже нарушен внутри группы */
  for (const rule of caps) {
    const messages: string[] = []
    for (const [root, ids] of groups) {
      if (brokenGroupRoots.has(root)) continue
      const count = ids.filter((id) => positionOf.get(id) === rule.position).length
      if (count > rule.maxPerTeam) {
        messages.push(`в связанной группе уже ${count} участников этой должности (лимит ${rule.maxPerTeam})`)
      }
    }
    if (messages.length > 0) impossibleRules.set(rule.id, messages.join('; '))
  }

  /* Юниты: неразбитые группы целиком, разбитые — по одиночке */
  const units: Unit[] = []
  const makeUnit = (memberIds: string[]): Unit => {
    const positionCounts = new Map<Position, number>()
    let weight = 0
    for (const id of memberIds) {
      weight += weightOf.get(id) ?? 0
      const position = positionOf.get(id)
      if (position !== undefined) {
        positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1)
      }
    }
    return { memberIds: [...memberIds], weight, size: memberIds.length, positionCounts }
  }

  for (const [root, ids] of groups) {
    if (brokenGroupRoots.has(root)) {
      for (const id of ids) units.push(makeUnit([id]))
    } else {
      units.push(makeUnit(ids))
    }
  }

  const isPossible = (rule: Rule): boolean => !impossibleRules.has(rule.id)

  return {
    units,
    impossibleRules,
    togetherPairs: togethers.filter(isPossible).map((r) => ({ ruleId: r.id, a: r.a, b: r.b })),
    separatePairs: separates.filter(isPossible).map((r) => ({ ruleId: r.id, a: r.a, b: r.b })),
    levelCaps: caps.filter(isPossible).map((r) => ({
      ruleId: r.id,
      position: r.position,
      maxPerTeam: r.maxPerTeam,
    })),
  }
}
