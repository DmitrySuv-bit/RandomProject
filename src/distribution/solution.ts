import type { Position } from '@/domain/positions'

/** Выполнимые цели оптимизации (заведомо невыполнимые правила уже исключены) */
export interface OptimizationTargets {
  togetherPairs: ReadonlyArray<{ ruleId: string; a: string; b: string }>
  separatePairs: ReadonlyArray<{ ruleId: string; a: string; b: string }>
  levelCaps: ReadonlyArray<{ ruleId: string; position: Position; maxPerTeam: number }>
  minSize: number
  maxSize: number
  weightOf: ReadonlyMap<string, number>
  positionOf: ReadonlyMap<string, Position>
}

/* Штрафы заведомо больше любого разбаланса весов, поэтому правила и лимиты — приоритет */
const RULE_PENALTY = 1e9
const SIZE_PENALTY = 1e9

export interface Solution {
  /** Распределение: индекс команды → id участников */
  teams: string[][]
  teamWeights: number[]
  teamSizes: number[]
  /** id участника → индекс команды */
  teamOfMember: Map<string, number>
}

export function createSolution(teamCount: number): Solution {
  return {
    teams: Array.from({ length: teamCount }, () => [] as string[]),
    teamWeights: Array.from({ length: teamCount }, () => 0),
    teamSizes: Array.from({ length: teamCount }, () => 0),
    teamOfMember: new Map(),
  }
}

/** Перенести участника в другую команду (обновляет все агрегаты) */
export function applyMove(sol: Solution, memberId: string, toTeam: number, targets: OptimizationTargets): void {
  const from = sol.teamOfMember.get(memberId)
  if (from === undefined || from === toTeam) return
  const weight = targets.weightOf.get(memberId) ?? 0
  const fromTeam = sol.teams[from]!
  const index = fromTeam.indexOf(memberId)
  fromTeam.splice(index, 1)
  sol.teams[toTeam]!.push(memberId)
  sol.teamWeights[from]! -= weight
  sol.teamWeights[toTeam]! += weight
  sol.teamSizes[from]! -= 1
  sol.teamSizes[toTeam]! += 1
  sol.teamOfMember.set(memberId, toTeam)
}

/** Обменять двух участников командами */
export function applySwap(sol: Solution, a: string, b: string, targets: OptimizationTargets): void {
  const teamA = sol.teamOfMember.get(a)
  const teamB = sol.teamOfMember.get(b)
  if (teamA === undefined || teamB === undefined || teamA === teamB) return
  applyMove(sol, a, teamB, targets)
  applyMove(sol, b, teamA, targets)
}

export function countPositionInTeam(
  sol: Solution,
  teamIndex: number,
  position: Position,
  positionOf: ReadonlyMap<string, Position>,
): number {
  let count = 0
  for (const id of sol.teams[teamIndex]!) {
    if (positionOf.get(id) === position) count++
  }
  return count
}

/**
 * Штраф решения: разброс сумм весов + нарушения правил и размеров.
 * Меньше — лучше.
 */
export function scoreSolution(sol: Solution, targets: OptimizationTargets): number {
  const k = sol.teams.length
  const total = sol.teamWeights.reduce((sum, w) => sum + w, 0)
  const avg = total / k

  let score = 0
  for (const weight of sol.teamWeights) score += (weight - avg) ** 2

  for (let t = 0; t < k; t++) {
    const size = sol.teamSizes[t]!
    if (size > targets.maxSize) score += SIZE_PENALTY * (size - targets.maxSize)
    if (size < targets.minSize) score += SIZE_PENALTY * (targets.minSize - size)
  }

  for (const { a, b } of targets.togetherPairs) {
    if (sol.teamOfMember.get(a) !== sol.teamOfMember.get(b)) score += RULE_PENALTY
  }
  for (const { a, b } of targets.separatePairs) {
    if (sol.teamOfMember.get(a) === sol.teamOfMember.get(b)) score += RULE_PENALTY
  }

  if (targets.levelCaps.length > 0) {
    for (let t = 0; t < k; t++) {
      const members = sol.teams[t]!
      for (const cap of targets.levelCaps) {
        let count = 0
        for (const id of members) {
          if (targets.positionOf.get(id) === cap.position) count++
        }
        if (count > cap.maxPerTeam) score += RULE_PENALTY * (count - cap.maxPerTeam)
      }
    }
  }

  return score
}
