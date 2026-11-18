import type { Participant, Settings } from '@/domain/types'

export interface DistributionIssue {
  message: string
}

/**
 * Проверка возможности распределения. Запускается до алгоритма:
 * непустой список = показываем проблемы, распределение не стартует.
 */
export function validateDistributionInput(
  participants: readonly Participant[],
  settings: Settings,
): DistributionIssue[] {
  const issues: DistributionIssue[] = []
  const n = participants.length
  const { teamCount, sizingMode, minSize, maxSize } = settings

  if (n === 0) {
    issues.push({ message: 'Добавьте хотя бы одного участника' })
    return issues
  }
  if (n < teamCount) {
    issues.push({ message: `Участников (${n}) меньше, чем команд (${teamCount})` })
  }
  if (sizingMode === 'limits') {
    if (n < teamCount * minSize) {
      issues.push({
        message: `Не хватает участников: при ${teamCount} командах и минимуме ${minSize} нужно хотя бы ${teamCount * minSize} (сейчас ${n})`,
      })
    }
    if (n > teamCount * maxSize) {
      issues.push({
        message: `Слишком много участников: при максимуме ${maxSize} помещается ${teamCount * maxSize} (сейчас ${n})`,
      })
    }
  }
  return issues
}

/** Границы размера команды для текущего режима настроек */
export function teamSizeBounds(count: number, settings: Settings): { min: number; max: number } {
  if (settings.sizingMode === 'limits') {
    return { min: settings.minSize, max: settings.maxSize }
  }
  return {
    min: Math.floor(count / settings.teamCount),
    max: Math.ceil(count / settings.teamCount),
  }
}
