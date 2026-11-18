import { uid } from '@/domain/id'
import { distributionSignature } from '@/domain/distribution-signature'
import { generateTeamName } from '@/domain/team-names'
import type { DistributionResult, Participant, Settings } from '@/domain/types'
import { buildClusters } from './clusters'
import { draftSolution } from './draft'
import { optimizeSolution } from './optimize'
import { computeReport } from './report'
import { mulberry32 } from './rng'
import type { OptimizationTargets } from './solution'
import { scoreSolution } from './solution'
import { teamSizeBounds, validateDistributionInput } from './validate'

export interface DistributeOptions {
  /** Фиксированный seed для детерминированного распределения (тесты) */
  seed?: number
}

/** Количество случайных рестартов драфта с оптимизацией — побеждает лучший штраф */
const RESTARTS = 4

/**
 * Формирует сбалансированные команды: кластеризация «вместе» → случайный
 * snake-draft → hill-climbing оптимизация → отчёт по правилам и балансу.
 * Бросает Error, если вход невалиден (сначала вызовите validateDistributionInput).
 */
export function distribute(
  participants: readonly Participant[],
  settings: Settings,
  options: DistributeOptions = {},
): DistributionResult {
  const issues = validateDistributionInput(participants, settings)
  if (issues.length > 0) {
    throw new Error(`Распределение невозможно: ${issues.map((issue) => issue.message).join('; ')}`)
  }

  const seed = options.seed ?? ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
  const rng = mulberry32(seed)

  const { min, max } = teamSizeBounds(participants.length, settings)
  const clustering = buildClusters(participants, settings, max)

  const targets: OptimizationTargets = {
    togetherPairs: clustering.togetherPairs,
    separatePairs: clustering.separatePairs,
    levelCaps: clustering.levelCaps,
    minSize: min,
    maxSize: max,
    weightOf: new Map(participants.map((p) => [p.id, settings.weights[p.position]] as const)),
    positionOf: new Map(participants.map((p) => [p.id, p.position] as const)),
  }

  let bestTeams: string[][] | null = null
  let bestScore = Infinity

  for (let restart = 0; restart < RESTARTS; restart++) {
    const solution = draftSolution(clustering.units, settings.teamCount, targets, rng)
    optimizeSolution(solution, targets, rng)
    const score = scoreSolution(solution, targets)
    if (score < bestScore) {
      bestScore = score
      bestTeams = solution.teams.map((members) => [...members])
    }
  }

  // Кастомное название из настроек или случайное «Огненные капибары»; последнее средство — «Команда N»
  const usedNames = new Set<string>()
  const teams = bestTeams!.map((memberIds, index) => {
    const custom = settings.teamNames[index]?.trim()
    const name = custom || generateTeamName(usedNames, rng) || `Команда ${index + 1}`
    usedNames.add(name)
    return { id: uid(), name, memberIds }
  })

  const report = computeReport(teams, participants, settings, clustering.impossibleRules)
  return { teams, report, createdAt: Date.now(), sourceSignature: distributionSignature(participants, settings) }
}
