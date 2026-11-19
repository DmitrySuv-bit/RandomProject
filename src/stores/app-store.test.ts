import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, useAppStore } from './app-store'

function resetState() {
  useAppStore.setState({
    participants: [],
    settings: structuredClone(DEFAULT_SETTINGS),
    result: null,
  })
}

beforeEach(resetState)

describe('участники', () => {
  it('addParticipant добавляет участника и обрезает пробелы', () => {
    const id = useAppStore.getState().addParticipant({
      fullName: '  Иванов Иван  ',
      position: 'middle-plus',
    })
    expect(id).toBeTruthy()
    const participant = useAppStore.getState().participants[0]!
    expect(participant.fullName).toBe('Иванов Иван')
    expect(participant.position).toBe('middle-plus')
    // прозвище сгенерировано автоматически: «Прилагательное животное»
    expect(participant.nickname).toMatch(/^[А-ЯЁ][а-яё]+ [а-яё]+$/)
    expect(participant.id).toBe(id)
  })

  it('addParticipant сохраняет переданное прозвище', () => {
    const id = useAppStore
      .getState()
      .addParticipant({ fullName: 'Иванов Иван', position: 'junior-minus', nickname: ' Дикая утка ' })
    const participant = useAppStore.getState().participants[0]!
    expect(participant.id).toBe(id)
    expect(participant.nickname).toBe('Дикая утка')
  })

  it('addParticipants выдаёт уникальные автопрозвища', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      fullName: `Участник ${i + 1}`,
      position: 'middle-plus' as const,
    }))
    useAppStore.getState().addParticipants(items)
    const nicknames = useAppStore.getState().participants.map((p) => p.nickname)
    expect(new Set(nicknames).size).toBe(20)
  })

  it('addParticipant игнорирует пустое имя', () => {
    expect(
      useAppStore.getState().addParticipant({ fullName: '   ', position: 'junior-minus' }),
    ).toBeUndefined()
    expect(useAppStore.getState().participants).toHaveLength(0)
  })

  it('addParticipants пропускает пустые имена', () => {
    const added = useAppStore.getState().addParticipants([
      { fullName: 'А', position: 'junior-minus' },
      { fullName: '  ', position: 'junior-plus' },
      { fullName: 'Б', position: 'senior-plus' },
    ])
    expect(added).toBe(2)
    expect(useAppStore.getState().participants).toHaveLength(2)
  })

  it('removeParticipant удаляет связанные правила и вычищает участника из результата', () => {
    const { addParticipant, addRule, setResult, removeParticipant } = useAppStore.getState()
    const a = addParticipant({ fullName: 'А', position: 'junior-minus' })!
    const b = addParticipant({ fullName: 'Б', position: 'junior-minus' })!
    addRule({ type: 'together', a, b })
    addRule({ type: 'level-cap', position: 'junior-minus', maxPerTeam: 2 })
    setResult({
      teams: [{ id: 't1', name: 'Команда 1', memberIds: [a, b] }],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    removeParticipant(a)

    const state = useAppStore.getState()
    expect(state.participants.map((p) => p.id)).toEqual([b])
    // парное правило удалено вместе с участником, level-cap остался
    expect(state.settings.rules).toHaveLength(1)
    expect(state.settings.rules[0]!.type).toBe('level-cap')
    expect(state.result?.teams[0]!.memberIds).toEqual([b])
  })

  it('updateParticipant меняет поля', () => {
    const id = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    useAppStore.getState().updateParticipant(id, { nickname: 'Дикая утка', position: 'senior-plus' })
    const participant = useAppStore.getState().participants[0]!
    expect(participant.nickname).toBe('Дикая утка')
    expect(participant.position).toBe('senior-plus')
  })

  it('regenerateNickname даёт новое прозвище без конфликтов с другими', () => {
    const ids = [1, 2, 3].map((i) =>
      useAppStore.getState().addParticipant({ fullName: `Участник ${i}`, position: 'junior-minus' })!,
    )
    const others = useAppStore
      .getState()
      .participants.filter((p) => p.id !== ids[0])
      .map((p) => p.nickname)

    useAppStore.getState().regenerateNickname(ids[0])

    const updated = useAppStore.getState().participants.find((p) => p.id === ids[0])!
    expect(updated.nickname).toMatch(/^[А-ЯЁ][а-яё]+ [а-яё]+$/)
    expect(others).not.toContain(updated.nickname)
  })

  it('regenerateAllNicknames делает все прозвища уникальными', () => {
    useAppStore
      .getState()
      .addParticipants(
        Array.from({ length: 25 }, (_, i) => ({ fullName: `Участник ${i}`, position: 'middle-minus' })),
      )
    useAppStore.getState().regenerateAllNicknames()

    const nicknames = useAppStore.getState().participants.map((p) => p.nickname)
    expect(new Set(nicknames).size).toBe(25)
    for (const nickname of nicknames) {
      expect(nickname).toMatch(/^[А-ЯЁ][а-яё]+ [а-яё]+$/)
    }
  })
})

describe('настройки', () => {
  it('setTeamCount ограничивает значение', () => {
    useAppStore.getState().setTeamCount(999)
    expect(useAppStore.getState().settings.teamCount).toBe(50)
    useAppStore.getState().setTeamCount(0)
    expect(useAppStore.getState().settings.teamCount).toBe(1)
  })

  it('setTeamName задаёт название и дополняет массив до количества команд', () => {
    useAppStore.getState().setTeamCount(3)
    useAppStore.getState().setTeamName(2, 'Красные')
    expect(useAppStore.getState().settings.teamNames).toEqual(['', '', 'Красные'])
    useAppStore.getState().setTeamName(0, 'Синие')
    expect(useAppStore.getState().settings.teamNames).toEqual(['Синие', '', 'Красные'])
  })

  it('setTeamName переименовывает команду в готовом результате на лету', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    useAppStore.getState().setResult({
      teams: [
        { id: 't1', name: 'Команда 1', memberIds: [a] },
        { id: 't2', name: 'Команда 2', memberIds: [] },
      ],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().setTeamName(1, 'Зелёные')

    expect(useAppStore.getState().result?.teams[1]!.name).toBe('Зелёные')
    expect(useAppStore.getState().result?.teams[0]!.name).toBe('Команда 1')
  })

  it('setTeamCount синхронизирует длину массива названий', () => {
    useAppStore.getState().setTeamCount(3)
    useAppStore.getState().setTeamName(1, 'Красные')
    useAppStore.getState().setTeamCount(2)
    expect(useAppStore.getState().settings.teamNames).toEqual(['', 'Красные'])
    useAppStore.getState().setTeamCount(3)
    expect(useAppStore.getState().settings.teamNames).toEqual(['', 'Красные', ''])
  })

  it('setSizeLimits сортирует пару и ограничивает', () => {
    useAppStore.getState().setSizeLimits(10, 2)
    const { minSize, maxSize } = useAppStore.getState().settings
    expect(minSize).toBe(2)
    expect(maxSize).toBe(10)
  })

  it('setWeight обновляет вес должности', () => {
    useAppStore.getState().setWeight('senior-plus', 7)
    expect(useAppStore.getState().settings.weights['senior-plus']).toBe(7)
  })
})

describe('пользовательские должности', () => {
  it('addCustomPosition создаёт должность и режет пробелы', () => {
    const id = useAppStore.getState().addCustomPosition('  Тимлид  ', 7)
    expect(id).toBeTruthy()
    const position = useAppStore.getState().settings.customPositions[0]!
    expect(position.id).toBe(id)
    expect(position.label).toBe('Тимлид')
    expect(position.short).toBe('ТИМ')
    expect(position.weight).toBe(7)
  })

  it('addCustomPosition отклоняет дубль названия (встроенного или своего)', () => {
    expect(useAppStore.getState().addCustomPosition('  junior plus ', 5)).toBeUndefined()
    useAppStore.getState().addCustomPosition('Тимлид', 7)
    expect(useAppStore.getState().addCustomPosition('тимлид', 9)).toBeUndefined()
    expect(useAppStore.getState().settings.customPositions).toHaveLength(1)
  })

  it('addCustomPosition ограничивает вес', () => {
    useAppStore.getState().addCustomPosition('QA', 999)
    expect(useAppStore.getState().settings.customPositions[0]!.weight).toBe(99)
  })

  it('setCustomPositionWeight меняет вес', () => {
    const id = useAppStore.getState().addCustomPosition('QA', 2)!
    useAppStore.getState().setCustomPositionWeight(id, 5)
    expect(useAppStore.getState().settings.customPositions[0]!.weight).toBe(5)
  })

  it('removeCustomPosition не даёт удалить должность, используемую участником или правилом', () => {
    const id = useAppStore.getState().addCustomPosition('Тимлид', 7)!
    useAppStore.getState().addParticipant({ fullName: 'А', position: id })
    expect(useAppStore.getState().removeCustomPosition(id)).toBe(false)
    expect(useAppStore.getState().settings.customPositions).toHaveLength(1)

    // должность свободна после смены — удаление проходит
    const person = useAppStore.getState().participants[0]!
    useAppStore.getState().updateParticipant(person.id, { position: 'senior-plus' })
    expect(useAppStore.getState().removeCustomPosition(id)).toBe(true)
    expect(useAppStore.getState().settings.customPositions).toHaveLength(0)
  })
})

describe('правила', () => {
  it('addRule не даёт правило на самого себя', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    expect(useAppStore.getState().addRule({ type: 'together', a, b: a })).toBeUndefined()
    expect(useAppStore.getState().settings.rules).toHaveLength(0)
  })

  it('addRule не дублирует парные правила (пары симметричны)', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    const b = useAppStore.getState().addParticipant({ fullName: 'Б', position: 'junior-minus' })!
    useAppStore.getState().addRule({ type: 'separate', a, b })
    expect(useAppStore.getState().addRule({ type: 'separate', a: b, b: a })).toBeUndefined()
    expect(useAppStore.getState().settings.rules).toHaveLength(1)
  })

  it('toggleRule переключает enabled', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    const b = useAppStore.getState().addParticipant({ fullName: 'Б', position: 'junior-minus' })!
    const ruleId = useAppStore.getState().addRule({ type: 'together', a, b })!

    useAppStore.getState().toggleRule(ruleId)
    expect(useAppStore.getState().settings.rules[0]!.enabled).toBe(false)

    useAppStore.getState().toggleRule(ruleId)
    expect(useAppStore.getState().settings.rules[0]!.enabled).toBe(true)
  })
})

describe('результат', () => {
  it('moveParticipant переносит участника в другую команду', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    useAppStore.getState().setResult({
      teams: [
        { id: 't1', name: 'Команда 1', memberIds: [a] },
        { id: 't2', name: 'Команда 2', memberIds: [] },
      ],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().moveParticipant(a, 't2')

    expect(useAppStore.getState().result?.teams[0]!.memberIds).toEqual([])
    expect(useAppStore.getState().result?.teams[1]!.memberIds).toEqual([a])
  })

  it('moveParticipant безопасен без результата', () => {
    const a = useAppStore.getState().addParticipant({ fullName: 'А', position: 'junior-minus' })!
    expect(() => useAppStore.getState().moveParticipant(a, 't1')).not.toThrow()
  })

  it('renameTeam переименовывает команду в результате и запоминает название в настройках', () => {
    useAppStore.getState().setResult({
      teams: [
        { id: 't1', name: 'Команда 1', memberIds: [] },
        { id: 't2', name: 'Команда 2', memberIds: [] },
      ],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().renameTeam('t2', '  Синие киты  ')

    expect(useAppStore.getState().result?.teams[1]!.name).toBe('Синие киты')
    expect(useAppStore.getState().settings.teamNames).toEqual(['', 'Синие киты'])
  })

  it('renameTeam с пустым именем даёт сгенерированное название', () => {
    useAppStore.getState().setResult({
      teams: [{ id: 't1', name: 'Старое', memberIds: [] }],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().renameTeam('t1', '   ')

    // «Прилагательное животные», например «Дикие выдры»
    expect(useAppStore.getState().result?.teams[0]!.name).toMatch(/^[А-ЯЁ][а-яё]+ [а-яё]+$/)
    // в настройках слот остаётся «авто» — пустым
    expect(useAppStore.getState().settings.teamNames).toEqual(['', ''])
  })

  it('generateTeamNames перегенерирует все названия, включая кастомные, и синхронизирует результат', () => {
    useAppStore.getState().setTeamCount(3)
    useAppStore.getState().setTeamName(1, 'Орлы')
    useAppStore.getState().setResult({
      teams: [
        { id: 't1', name: 'Старое 1', memberIds: [] },
        { id: 't2', name: 'Орлы', memberIds: [] },
        { id: 't3', name: 'Старое 3', memberIds: [] },
      ],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().generateTeamNames()

    const names = useAppStore.getState().settings.teamNames
    // все три слота перегенерированы, включая бывший кастомный «Орлы»
    for (const name of names) expect(name).toMatch(/^[А-ЯЁ][а-яё]+ [а-яё]+$/)
    expect(new Set(names).size).toBe(3)

    const resultNames = useAppStore.getState().result?.teams.map((t) => t.name)
    expect(resultNames).toEqual(names)
  })

  it('renameTeam игнорирует неизвестную команду', () => {
    useAppStore.getState().setResult({
      teams: [{ id: 't1', name: 'Команда 1', memberIds: [] }],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    expect(() => useAppStore.getState().renameTeam('ghost', 'X')).not.toThrow()
    expect(useAppStore.getState().result?.teams[0]!.name).toBe('Команда 1')
  })
})

describe('автосохранение', () => {
  it('persist пишет участников в localStorage под ключом random-team-data', () => {
    useAppStore.getState().addParticipant({ fullName: 'Иванов Иван', position: 'middle-minus' })
    const raw = localStorage.getItem('random-team-data')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).state.participants).toHaveLength(1)
  })

  it('старые данные без teamNames получают массив названий по умолчанию', async () => {
    // сохранённые настройки времён до появления teamNames (version 1)
    localStorage.setItem(
      'random-team-data',
      JSON.stringify({
        state: {
          participants: [],
          settings: { ...structuredClone(DEFAULT_SETTINGS), teamNames: undefined },
          result: null,
        },
      }),
    )

    vi.resetModules()
    const { useAppStore: freshStore } = await import('./app-store')

    expect(freshStore.getState().settings.teamCount).toBe(DEFAULT_SETTINGS.teamCount)
    expect(Array.isArray(freshStore.getState().settings.teamNames)).toBe(true)
    expect(freshStore.getState().settings.teamNames).toEqual([])
  })
})

describe('resetAll', () => {
  it('сбрасывает всё к дефолтам', () => {
    const state = useAppStore.getState()
    state.addParticipant({ fullName: 'А', position: 'junior-minus' })
    state.setTeamCount(5)
    state.setResult({
      teams: [{ id: 't1', name: 'Команда 1', memberIds: [] }],
      report: { ruleResults: [], balance: [], spread: 0 },
      createdAt: 0,
    })

    useAppStore.getState().resetAll()

    const after = useAppStore.getState()
    expect(after.participants).toHaveLength(0)
    expect(after.settings.teamCount).toBe(DEFAULT_SETTINGS.teamCount)
    expect(after.result).toBeNull()
  })
})
