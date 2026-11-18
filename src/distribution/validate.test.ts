import { describe, expect, it } from 'vitest'
import { validateDistributionInput } from './validate'
import type { Participant, Settings } from '@/domain/types'
import { DEFAULT_SETTINGS } from '@/stores/app-store'

function makeParticipants(count: number, position: Participant['position'] = 'middle-plus'): Participant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    fullName: `Участник ${i + 1}`,
    position,
    nickname: '',
  }))
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...structuredClone(DEFAULT_SETTINGS), ...overrides }
}

describe('validateDistributionInput', () => {
  it('пустой список — проблема', () => {
    expect(validateDistributionInput([], makeSettings({ teamCount: 2 }))[0]?.message).toContain(
      'Добавьте',
    )
  })

  it('участников меньше, чем команд — проблема', () => {
    const issues = validateDistributionInput(makeParticipants(3), makeSettings({ teamCount: 4 }))
    expect(issues.some((issue) => issue.message.includes('меньше'))).toBe(true)
  })

  it('limits: не хватает участников на минимум — проблема', () => {
    const settings = makeSettings({ teamCount: 2, sizingMode: 'limits', minSize: 6, maxSize: 10 })
    const issues = validateDistributionInput(makeParticipants(10), settings)
    expect(issues.some((issue) => issue.message.includes('Не хватает'))).toBe(true)
  })

  it('limits: слишком много участников — проблема', () => {
    const settings = makeSettings({ teamCount: 2, sizingMode: 'limits', minSize: 1, maxSize: 5 })
    const issues = validateDistributionInput(makeParticipants(15), settings)
    expect(issues.some((issue) => issue.message.includes('Слишком много'))).toBe(true)
  })

  it('корректный вход — без проблем', () => {
    expect(
      validateDistributionInput(makeParticipants(24), makeSettings({ teamCount: 4 })),
    ).toEqual([])
  })
})
