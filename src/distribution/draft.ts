import type { Unit } from './clusters'
import type { OptimizationTargets, Solution } from './solution'
import { createSolution, countPositionInTeam } from './solution'
import type { Rng } from './rng'

/**
 * Случайный snake-draft: юниты по убыванию веса (с шумом для рандомизации)
 * раскладываются «змейкой» с учётом лимитов размера и рангов.
 */
export function draftSolution(
  units: readonly Unit[],
  teamCount: number,
  targets: OptimizationTargets,
  rng: Rng,
): Solution {
  const sol = createSolution(teamCount)

  const noisy = units.map((unit) => ({ unit, priority: unit.weight + rng() * unit.weight }))
  noisy.sort((x, y) => y.priority - x.priority)

  // snake-порядок команд: 0..k-1, k-1..0, ...
  let round = 0
  let cursor = 0
  let order: number[] = []
  const nextPick = (): number => {
    if (cursor >= order.length) {
      order = round % 2 === 0
        ? Array.from({ length: teamCount }, (_, i) => i)
        : Array.from({ length: teamCount }, (_, i) => teamCount - 1 - i)
      round++
      cursor = 0
    }
    return order[cursor++]!
  }

  for (const { unit } of noisy) {
    const start = nextPick()
    let target = -1

    // Ищем первую подходящую команду по кругу, начиная со «своей» позиции змейки
    for (let step = 0; step < teamCount; step++) {
      const candidate = (start + step) % teamCount
      if (fits(sol, candidate, unit, targets)) {
        target = candidate
        break
      }
    }

    // Никто не принимает — кладём в самую свободную команду (best effort)
    if (target === -1) {
      let minSize = Infinity
      for (let t = 0; t < teamCount; t++) {
        if (sol.teamSizes[t]! < minSize) {
          minSize = sol.teamSizes[t]!
          target = t
        }
      }
    }

    for (const id of unit.memberIds) {
      const from = sol.teamOfMember.get(id)
      if (from !== undefined) continue
      sol.teams[target]!.push(id)
      sol.teamOfMember.set(id, target)
    }
    sol.teamSizes[target]! += unit.size
    sol.teamWeights[target]! += unit.weight
  }

  return sol
}

function fits(sol: Solution, teamIndex: number, unit: Unit, targets: OptimizationTargets): boolean {
  if (sol.teamSizes[teamIndex]! + unit.size > targets.maxSize) return false
  for (const cap of targets.levelCaps) {
    const incoming = unit.positionCounts.get(cap.position) ?? 0
    if (incoming === 0) continue
    const current = countPositionInTeam(sol, teamIndex, cap.position, targets.positionOf)
    if (current + incoming > cap.maxPerTeam) return false
  }
  return true
}
