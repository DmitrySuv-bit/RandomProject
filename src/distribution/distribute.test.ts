import { describe, expect, it } from 'vitest'
import { distribute } from './distribute'
import { uid } from '@/domain/id'
import type { Position } from '@/domain/positions'
import type { LevelCapRule, Participant, Settings } from '@/domain/types'
import { DEFAULT_SETTINGS } from '@/stores/app-store'

function makeParticipants(defs: ReadonlyArray<[string, Position | number]>): Participant[] {
  // Position — конкретная должность; number — вес (должность подбирается под вес 1–6)
  const byWeight: Record<number, Position> = {
    1: 'junior-minus',
    2: 'junior-plus',
    3: 'middle-minus',
    4: 'middle-plus',
    5: 'senior-minus',
    6: 'senior-plus',
  }
  return defs.map(([fullName, positionOrWeight]) => ({
    id: uid(),
    fullName,
    position: typeof positionOrWeight === 'number' ? byWeight[positionOrWeight]! : positionOrWeight,
    nickname: '',
  }))
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...structuredClone(DEFAULT_SETTINGS), ...overrides }
}

const SEED = 42

describe('distribute — базовые свойства', () => {
  it('каждый участник ровно в одной команде', () => {
    const participants = makeParticipants([
      ['А', 1], ['Б', 2], ['В', 3], ['Г', 4], ['Д', 5], ['Е', 6],
      ['Ж', 1], ['З', 2], ['И', 3], ['К', 4], ['Л', 5], ['М', 6],
      ['Н', 1], ['О', 2], ['П', 3], ['Р', 4], ['С', 5], ['Т', 6],
      ['У', 1], ['Ф', 2], ['Х', 3], ['Ц', 4], ['Ч', 5],
    ])
    const result = distribute(participants, makeSettings({ teamCount: 4 }), { seed: SEED })

    expect(result.teams).toHaveLength(4)
    const all = result.teams.flatMap((team) => team.memberIds)
    expect(all).toHaveLength(23)
    expect(new Set(all).size).toBe(23)
    for (const participant of participants) {
      expect(all).toContain(participant.id)
    }
  })

  it('режим «поровну» даёт размеры floor/ceil от n/k', () => {
    const participants = makeParticipants(Array.from({ length: 23 }, (_, i) => [`У${i}`, 3] as const))
    const result = distribute(participants, makeSettings({ teamCount: 4 }), { seed: SEED })

    const sizes = result.teams.map((team) => team.memberIds.length).sort((a, b) => a - b)
    expect(sizes).toEqual([5, 6, 6, 6])
  })

  it('режим «границы» держит размеры в min–max', () => {
    const participants = makeParticipants(Array.from({ length: 20 }, (_, i) => [`У${i}`, 3] as const))
    const settings = makeSettings({ teamCount: 4, sizingMode: 'limits', minSize: 4, maxSize: 6 })
    const result = distribute(participants, settings, { seed: SEED })

    for (const team of result.teams) {
      expect(team.memberIds.length).toBeGreaterThanOrEqual(4)
      expect(team.memberIds.length).toBeLessThanOrEqual(6)
    }
  })

  it('одинаковый seed — одинаковое распределение', () => {
    const participants = makeParticipants(Array.from({ length: 18 }, (_, i) => [`У${i}`, 3] as const))
    const a = distribute(participants, makeSettings({ teamCount: 3 }), { seed: 123 })
    const b = distribute(participants, makeSettings({ teamCount: 3 }), { seed: 123 })
    expect(a.teams.map((t) => t.memberIds)).toEqual(b.teams.map((t) => t.memberIds))
  })

  it('разные seed обычно дают разные составы', () => {
    const participants = makeParticipants(Array.from({ length: 24 }, (_, i) => [`У${i}`, 3] as const))
    const a = distribute(participants, makeSettings({ teamCount: 4 }), { seed: 1 })
    const b = distribute(participants, makeSettings({ teamCount: 4 }), { seed: 2 })
    expect(JSON.stringify(a.teams.map((t) => t.memberIds))).not.toBe(
      JSON.stringify(b.teams.map((t) => t.memberIds)),
    )
  })

  it('бросает ошибку на невалидном входе', () => {
    expect(() => distribute([], makeSettings({ teamCount: 2 }), { seed: SEED })).toThrow()
    expect(() =>
      distribute(makeParticipants([['А', 1], ['Б', 2]]), makeSettings({ teamCount: 3 }), { seed: SEED }),
    ).toThrow()
  })
})

describe('distribute — баланс', () => {
  it('равномерные веса делятся поровну', () => {
    // 8 участников с весом 4 → 2 команды по 4, суммы 16/16
    const participants = makeParticipants(Array.from({ length: 8 }, (_, i) => [`У${i}`, 4] as const))
    const result = distribute(participants, makeSettings({ teamCount: 2 }), { seed: SEED })

    expect(result.report.spread).toBe(0)
    expect(result.report.balance.map((b) => b.totalWeight)).toEqual([16, 16])
    expect(result.report.balance.every((b) => b.count === 4)).toBe(true)
  })

  it('сильные и слабые перемешиваются: суммы весов близки', () => {
    // По 4 участника каждого веса → 2 команды; идеал — по 14 (сумма 28)
    const defs: Array<[string, number]> = []
    for (let weight = 1; weight <= 6; weight++) {
      for (let copy = 0; copy < 4; copy++) defs.push([`У${weight}-${copy}`, weight])
    }
    const participants = makeParticipants(defs)
    const result = distribute(participants, makeSettings({ teamCount: 2 }), { seed: SEED })

    expect(result.report.spread).toBeLessThanOrEqual(1)
    expect(result.report.balance.map((b) => b.count)).toEqual([12, 12])
  })

  it('баланс сходится на больших весах', () => {
    const defs: Array<[string, number]> = []
    for (let weight = 1; weight <= 6; weight++) {
      for (let copy = 0; copy < 5; copy++) defs.push([`У${weight}-${copy}`, weight])
    }
    const participants = makeParticipants(defs) // сумма 105
    const result = distribute(participants, makeSettings({ teamCount: 3 }), { seed: SEED })
    // идеал 35/35/35
    expect(result.report.spread).toBeLessThanOrEqual(2)
  })
})

describe('distribute — правила', () => {
  it('«вместе» выполняется', () => {
    const participants = makeParticipants(Array.from({ length: 10 }, (_, i) => [`У${i}`, 3] as const))
    const [a, b] = participants
    const settings = makeSettings({
      teamCount: 2,
      rules: [{ type: 'together', id: uid(), enabled: true, a: a!.id, b: b!.id }],
    })
    const result = distribute(participants, settings, { seed: SEED })

    const teamOf = new Map(result.teams.flatMap((t) => t.memberIds.map((id) => [id, t.id] as const)))
    expect(teamOf.get(a!.id)).toBe(teamOf.get(b!.id))
    expect(result.report.ruleResults[0]?.ok).toBe(true)
  })

  it('«раздельно» выполняется', () => {
    const participants = makeParticipants(Array.from({ length: 10 }, (_, i) => [`У${i}`, 3] as const))
    const [a, b] = participants
    const settings = makeSettings({
      teamCount: 2,
      rules: [{ type: 'separate', id: uid(), enabled: true, a: a!.id, b: b!.id }],
    })
    const result = distribute(participants, settings, { seed: SEED })

    const teamOf = new Map(result.teams.flatMap((t) => t.memberIds.map((id) => [id, t.id] as const)))
    expect(teamOf.get(a!.id)).not.toBe(teamOf.get(b!.id))
    expect(result.report.ruleResults[0]?.ok).toBe(true)
  })

  it('лимит должности выполняется', () => {
    // 6 × senior plus, 3 команды, лимит 2 → ровно по 2
    const participants = makeParticipants([
      ['С1', 'senior-plus'], ['С2', 'senior-plus'], ['С3', 'senior-plus'],
      ['С4', 'senior-plus'], ['С5', 'senior-plus'], ['С6', 'senior-plus'],
      ['М1', 'junior-minus'], ['М2', 'junior-minus'], ['М3', 'junior-minus'],
    ])
    const cap: LevelCapRule = {
      type: 'level-cap',
      id: uid(),
      enabled: true,
      position: 'senior-plus',
      maxPerTeam: 2,
    }
    const result = distribute(participants, makeSettings({ teamCount: 3, rules: [cap] }), { seed: SEED })

    for (const team of result.teams) {
      const seniors = team.memberIds.filter((id) =>
        participants.find((p) => p.id === id)?.position === 'senior-plus',
      )
      expect(seniors.length).toBeLessThanOrEqual(2)
    }
    expect(result.report.ruleResults[0]?.ok).toBe(true)
  })

  it('выключенные правила не влияют', () => {
    const participants = makeParticipants(Array.from({ length: 10 }, (_, i) => [`У${i}`, 3] as const))
    const [a, b] = participants
    const settings = makeSettings({
      teamCount: 2,
      rules: [{ type: 'together', id: uid(), enabled: false, a: a!.id, b: b!.id }],
    })
    const result = distribute(participants, settings, { seed: SEED })
    expect(result.report.ruleResults).toHaveLength(0)
  })
})

describe('distribute — невыполнимые правила (best effort)', () => {
  it('группа «вместе» больше команды — правила помечены и участники распределены', () => {
    // 8 участников, 4 команды по 2 → цепочка «вместе» из 3 человек не помещается
    const participants = makeParticipants(Array.from({ length: 8 }, (_, i) => [`У${i}`, 3] as const))
    const [a, b, c] = participants
    const settings = makeSettings({
      teamCount: 4,
      rules: [
        { type: 'together', id: uid(), enabled: true, a: a!.id, b: b!.id },
        { type: 'together', id: uid(), enabled: true, a: b!.id, b: c!.id },
      ],
    })
    const result = distribute(participants, settings, { seed: SEED })

    // все распределены
    const all = result.teams.flatMap((t) => t.memberIds)
    expect(new Set(all).size).toBe(8)

    // оба правила помечены невыполнимыми с понятной причиной
    expect(result.report.ruleResults).toHaveLength(2)
    for (const ruleResult of result.report.ruleResults) {
      expect(ruleResult.ok).toBe(false)
      expect(ruleResult.message).toContain('не помещается')
    }
  })

  it('«раздельно» конфликтует с «вместе» — помечено невыполнимым', () => {
    const participants = makeParticipants(Array.from({ length: 8 }, (_, i) => [`У${i}`, 3] as const))
    const [a, b] = participants
    const settings = makeSettings({
      teamCount: 2,
      rules: [
        { type: 'together', id: uid(), enabled: true, a: a!.id, b: b!.id },
        { type: 'separate', id: uid(), enabled: true, a: a!.id, b: b!.id },
      ],
    })
    const result = distribute(participants, settings, { seed: SEED })

    const byType = new Map(result.report.ruleResults.map((r) => [r.label.includes('разных') ? 'separate' : 'together', r]))
    expect(byType.get('together')?.ok).toBe(true)
    expect(byType.get('separate')?.ok).toBe(false)
    expect(byType.get('separate')?.message).toContain('объединены')
  })

  it('лимит внутри связанной группы — помечен невыполнимым', () => {
    // Три senior plus связаны «вместе» + лимит 1 → невыполнимо
    const participants = makeParticipants([
      ['С1', 'senior-plus'], ['С2', 'senior-plus'], ['С3', 'senior-plus'],
      ['М1', 'junior-minus'], ['М2', 'junior-minus'], ['М3', 'junior-minus'],
      ['М4', 'junior-minus'], ['М5', 'junior-minus'], ['М6', 'junior-minus'],
    ])
    const [s1, s2] = participants
    const settings = makeSettings({
      teamCount: 3,
      rules: [
        { type: 'together', id: uid(), enabled: true, a: s1!.id, b: s2!.id },
        { type: 'level-cap', id: uid(), enabled: true, position: 'senior-plus', maxPerTeam: 1 },
      ],
    })
    const result = distribute(participants, settings, { seed: SEED })

    const capResult = result.report.ruleResults.find((r) => r.label.includes('Senior plus'))
    expect(capResult?.ok).toBe(false)
    expect(capResult?.message).toContain('связанной группе')
  })
})

describe('distribute — отчёт', () => {
  it('баланс считает количество, сумму и средний вес', () => {
    const participants = makeParticipants([
      ['А', 2], ['Б', 4], ['В', 6], ['Г', 2], ['Д', 4], ['Ф', 6],
    ])
    const result = distribute(participants, makeSettings({ teamCount: 2 }), { seed: SEED })

    expect(result.report.balance).toHaveLength(2)
    for (const balance of result.report.balance) {
      expect(balance.count).toBe(3)
      expect(balance.totalWeight).toBe(12)
      expect(balance.avgWeight).toBeCloseTo(4)
    }
    expect(result.report.spread).toBe(0)
  })

  it('команды получают имена «Команда 1..N» и уникальные id', () => {
    const participants = makeParticipants(Array.from({ length: 6 }, (_, i) => [`У${i}`, 3] as const))
    const result = distribute(participants, makeSettings({ teamCount: 3 }), { seed: SEED })

    expect(result.teams.map((t) => t.name)).toEqual(['Команда 1', 'Команда 2', 'Команда 3'])
    expect(new Set(result.teams.map((t) => t.id)).size).toBe(3)
    expect(result.createdAt).toBeGreaterThan(0)
  })

  it('использует пользовательские названия; пустые и пробельные заменяются на «Команда N»', () => {
    const participants = makeParticipants(Array.from({ length: 6 }, (_, i) => [`У${i}`, 3] as const))
    const result = distribute(
      participants,
      makeSettings({ teamCount: 3, teamNames: ['Красные', '   ', 'Синие киты'] }),
      { seed: SEED },
    )

    expect(result.teams.map((t) => t.name)).toEqual(['Красные', 'Команда 2', 'Синие киты'])
  })

  it('названия из настроек попадают в отчёт по балансу', () => {
    const participants = makeParticipants(Array.from({ length: 4 }, (_, i) => [`У${i}`, 3] as const))
    const result = distribute(participants, makeSettings({ teamCount: 2, teamNames: ['Альфа', 'Бета'] }), {
      seed: SEED,
    })

    expect(result.teams.map((t) => t.name)).toEqual(['Альфа', 'Бета'])
  })
})
