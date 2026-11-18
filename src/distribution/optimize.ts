import type { OptimizationTargets, Solution } from './solution'
import { applyMove, applySwap, scoreSolution } from './solution'
import type { Rng } from './rng'
import { shuffle } from './rng'

const MAX_PASSES = 50

/**
 * Hill climbing: односоставные переносы и обмены, пока штраф уменьшается.
 * Возвращает итоговый штраф.
 */
export function optimizeSolution(sol: Solution, targets: OptimizationTargets, rng: Rng): number {
  let best = scoreSolution(sol, targets)
  const members = sol.teams.flat()
  const teamCount = sol.teams.length

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let improved = false

    /* Переносы одного участника */
    shuffle(members, rng)
    for (const memberId of members) {
      for (let t = 0; t < teamCount; t++) {
        const from = sol.teamOfMember.get(memberId)!
        if (t === from) continue
        applyMove(sol, memberId, t, targets)
        const score = scoreSolution(sol, targets)
        if (score < best - 1e-9) {
          best = score
          improved = true
        } else {
          applyMove(sol, memberId, from, targets)
        }
      }
    }

    /* Обмены участников разных команд */
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!
        const b = members[j]!
        if (sol.teamOfMember.get(a) === sol.teamOfMember.get(b)) continue
        applySwap(sol, a, b, targets)
        const score = scoreSolution(sol, targets)
        if (score < best - 1e-9) {
          best = score
          improved = true
        } else {
          applySwap(sol, a, b, targets)
        }
      }
    }

    if (!improved) break
  }

  return best
}
