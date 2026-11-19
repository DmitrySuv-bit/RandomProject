import { describe, expect, it } from 'vitest'
import { parseParticipantsCsv } from './csv'
import { csvFileName, teamsToCsv } from './export'
import type { DistributionResult, Participant, Settings } from './types'
import { DEFAULT_SETTINGS } from '@/stores/app-store'

function setup(): { result: DistributionResult; participants: Participant[]; settings: Settings } {
  const participants: Participant[] = [
    { id: 'p1', fullName: 'Иванов Иван', position: 'senior-plus', nickname: 'Дикая утка' },
    { id: 'p2', fullName: 'Петров Пётр', position: 'junior-minus', nickname: 'Задумчивый медведь' },
    { id: 'p3', fullName: 'Семёнова Анна', position: 'middle-plus', nickname: 'Неопознанный енот' },
  ]
  const result: DistributionResult = {
    teams: [
      { id: 't1', name: 'Команда 1', memberIds: ['p1', 'p2'] },
      { id: 't2', name: 'Команда 2', memberIds: ['p3'] },
    ],
    report: { ruleResults: [], balance: [], spread: 0 },
    createdAt: 0,
  }
  const settings: Settings = { ...structuredClone(DEFAULT_SETTINGS), teamCount: 2 }
  return { result, participants, settings }
}

describe('teamsToCsv', () => {
  it('выдаёт заголовок и строку на каждого участника в порядке команд', () => {
    const { result, participants, settings } = setup()
    const lines = teamsToCsv(result, participants, settings).split('\r\n')

    expect(lines[0]).toBe('Команда;ФИО;Ранг;Прозвище;Вес')
    expect(lines[1]).toBe('Команда 1;Иванов Иван;Senior plus;Дикая утка;6')
    expect(lines[2]).toBe('Команда 1;Петров Пётр;Junior minus;Задумчивый медведь;1')
    expect(lines[3]).toBe('Команда 2;Семёнова Анна;Middle plus;Неопознанный енот;4')
    expect(lines).toHaveLength(4)
  })

  it('использует настраиваемые веса', () => {
    const { result, participants } = setup()
    const settings = setup().settings
    settings.weights['junior-minus'] = 2
    const lines = teamsToCsv(result, participants, settings).split('\r\n')
    expect(lines[2]).toContain(';2')
  })

  it('экранирует точку с запятой и кавычки в ФИО', () => {
    const { result, settings } = setup()
    const participants: Participant[] = [
      { id: 'p1', fullName: 'Иванов; "странный"', position: 'junior-minus', nickname: 'Пёс' },
    ]
    const csv = teamsToCsv(
      { ...result, teams: [{ id: 't1', name: 'Команда 1', memberIds: ['p1'] }] },
      participants,
      settings,
    )
    expect(csv.split('\r\n')[1]).toBe('Команда 1;"Иванов; ""странный""";Junior minus;Пёс;1')
  })

  it('пропускает неизвестных участников без падения', () => {
    const { result, participants, settings } = setup()
    const broken: DistributionResult = {
      ...result,
      teams: [{ id: 't1', name: 'Команда 1', memberIds: ['ghost'] }],
    }
    const lines = teamsToCsv(broken, participants, settings).split('\r\n')
    expect(lines).toHaveLength(1)
  })
})

describe('round-trip: экспорт → импорт', () => {
  it('собственный экспорт читается импортом участников', () => {
    const { result, participants, settings } = setup()
    const csv = teamsToCsv(result, participants, settings)
    const parsed = parseParticipantsCsv(csv, settings.customPositions)
    expect(parsed.rows).toEqual([
      { fullName: 'Иванов Иван', position: 'senior-plus', nickname: 'Дикая утка' },
      { fullName: 'Петров Пётр', position: 'junior-minus', nickname: 'Задумчивый медведь' },
      { fullName: 'Семёнова Анна', position: 'middle-plus', nickname: 'Неопознанный енот' },
    ])
    expect(parsed.unrecognizedRanks).toEqual([])
    expect(parsed.skippedLines).toBe(0)
  })

  it('ФИО с точкой с запятой и кавычками переживает экспорт и импорт', () => {
    const { result, settings } = setup()
    const participants: Participant[] = [
      { id: 'p1', fullName: 'Иванов; "странный"', position: 'junior-minus', nickname: 'Пёс' },
    ]
    const csv = teamsToCsv(
      { ...result, teams: [{ id: 't1', name: 'Команда 1', memberIds: ['p1'] }] },
      participants,
      settings,
    )
    const parsed = parseParticipantsCsv(csv)
    expect(parsed.rows).toEqual([
      { fullName: 'Иванов; "странный"', position: 'junior-minus', nickname: 'Пёс' },
    ])
  })

  it('ранги «свои» тоже проходят круг: экспорт даёт название и вес, импорт узнаёт их', () => {
    const { result, settings } = setup()
    settings.customPositions = [{ id: 'c1', label: 'Тимлид', short: 'ТИМ', weight: 7 }]
    const participants: Participant[] = [
      { id: 'p1', fullName: 'Иванов Иван', position: 'c1', nickname: 'Пёс' },
    ]
    const csv = teamsToCsv(
      { ...result, teams: [{ id: 't1', name: 'Команда 1', memberIds: ['p1'] }] },
      participants,
      settings,
    )
    // в другом браузере списка своих рангов нет — импорт узнает название и вес из файла
    const parsed = parseParticipantsCsv(csv)
    expect(parsed.unrecognizedRanks).toEqual([{ label: 'Тимлид', weight: 7 }])
    expect(parsed.rows).toEqual([
      { fullName: 'Иванов Иван', position: 'junior-minus', nickname: 'Пёс' },
    ])
  })
})

describe('csvFileName', () => {
  it('формирует имя с датой и временем', () => {
    const name = csvFileName(new Date(2026, 10, 18, 9, 5))
    expect(name).toBe('команды-2026-11-18-09-05.csv')
  })
})
