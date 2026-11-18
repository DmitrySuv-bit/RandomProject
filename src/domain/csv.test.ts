import { describe, expect, it } from 'vitest'
import { FALLBACK_POSITION, parseParticipantsCsv, parsePositionValue } from './csv'

describe('parsePositionValue', () => {
  it.each([
    ['Junior minus', 'junior-minus'],
    ['Junior plus', 'junior-plus'],
    ['middle minus', 'middle-minus'],
    ['Middle Plus', 'middle-plus'],
    ['senior minus', 'senior-minus'],
    ['Senior plus', 'senior-plus'],
    ['junior+', 'junior-plus'],
    ['senior−', 'senior-minus'],
    ['джун минус', 'junior-minus'],
    ['Мидл плюс', 'middle-plus'],
    ['сеньор+', 'senior-plus'],
    ['  Junior   PLUS  ', 'junior-plus'],
  ])('распознаёт «%s» как %s', (raw, expected) => {
    expect(parsePositionValue(raw)).toBe(expected)
  })

  it.each([
    ['', 'пустая строка'],
    ['шофёр', 'не уровень'],
    ['junior', 'нет модификатора'],
    ['junior плюс-минус', 'противоречивые модификаторы'],
    ['директор', 'другая должность'],
  ])('не распознаёт «%s» (%s)', (raw) => {
    expect(parsePositionValue(raw)).toBeNull()
  })
})

describe('parseParticipantsCsv', () => {
  it('парсит строки «ФИО;Должность»', () => {
    const result = parseParticipantsCsv('Иванов Иван;middle plus\nПетров Пётр;senior minus')
    expect(result.rows).toEqual([
      { fullName: 'Иванов Иван', position: 'middle-plus' },
      { fullName: 'Петров Пётр', position: 'senior-minus' },
    ])
    expect(result.unrecognizedPosition).toEqual([])
  })

  it('поддерживает запятую как разделитель', () => {
    const result = parseParticipantsCsv('Иванов Иван,middle plus')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: 'middle-plus' })
  })

  it('пропускает строку заголовка', () => {
    const result = parseParticipantsCsv('ФИО;Должность\nИванов Иван;junior minus')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.fullName).toBe('Иванов Иван')
  })

  it('запятая в ФИО не мешает при разделителе «;»', () => {
    const result = parseParticipantsCsv('Иванов, Иван;middle plus')
    expect(result.rows[0]!.fullName).toBe('Иванов, Иван')
  })

  it('обрабатывает CRLF и пустые строки', () => {
    const result = parseParticipantsCsv('\r\nИванов Иван;junior minus\r\n\r\nПетр;junior plus\r\n')
    expect(result.rows).toHaveLength(2)
  })

  it('должность можно опустить — ставится дефолт без предупреждения', () => {
    const result = parseParticipantsCsv('Иванов Иван')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: FALLBACK_POSITION })
    expect(result.unrecognizedPosition).toEqual([])
  })

  it('нераспознанная должность помечается', () => {
    const result = parseParticipantsCsv('Иванов Иван;шофёр\nПетров Пётр;senior plus')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: FALLBACK_POSITION })
    expect(result.unrecognizedPosition).toEqual(['Иванов Иван'])
    expect(result.rows).toHaveLength(2)
  })

  it('строка без ФИО считается пропущенной', () => {
    const result = parseParticipantsCsv(';junior plus')
    expect(result.rows).toHaveLength(0)
    expect(result.skippedLines).toBe(1)
  })

  it('пустой файл даёт пустой результат', () => {
    const result = parseParticipantsCsv('   \n\n')
    expect(result.rows).toHaveLength(0)
    expect(result.skippedLines).toBe(0)
  })
})
