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
    ['директор', 'другой ранг'],
  ])('не распознаёт «%s» (%s)', (raw) => {
    expect(parsePositionValue(raw)).toBeNull()
  })

  it('распознаёт пользовательский ранг по названию (без учёта регистра)', () => {
    const custom = [
      { id: 'c1', label: 'Тимлид', short: 'ТИМ', weight: 7 },
      { id: 'c2', label: 'QA', short: 'QA', weight: 2 },
    ]
    expect(parsePositionValue('Тимлид', custom)).toBe('c1')
    expect(parsePositionValue('  тимлид  ', custom)).toBe('c1')
    expect(parsePositionValue('qa', custom)).toBe('c2')
    // встроенные по-прежнему работают
    expect(parsePositionValue('Junior plus', custom)).toBe('junior-plus')
    // неизвестная — null
    expect(parsePositionValue('DevOps', custom)).toBeNull()
  })
})

describe('parseParticipantsCsv', () => {
  it('парсит строки «ФИО;Ранг»', () => {
    const result = parseParticipantsCsv('Иванов Иван;middle plus\nПетров Пётр;senior minus')
    expect(result.rows).toEqual([
      { fullName: 'Иванов Иван', position: 'middle-plus' },
      { fullName: 'Петров Пётр', position: 'senior-minus' },
    ])
    expect(result.unrecognizedRanks).toEqual([])
  })

  it('поддерживает запятую как разделитель', () => {
    const result = parseParticipantsCsv('Иванов Иван,middle plus')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: 'middle-plus' })
  })

  it('пропускает строку заголовка («Ранг» и старый «Должность»)', () => {
    const modern = parseParticipantsCsv('ФИО;Ранг\nИванов Иван;junior minus')
    expect(modern.rows).toHaveLength(1)
    expect(modern.rows[0]!.fullName).toBe('Иванов Иван')

    const legacy = parseParticipantsCsv('ФИО;Должность\nИванов Иван;junior minus')
    expect(legacy.rows).toHaveLength(1)
  })

  it('запятая в ФИО не мешает при разделителе «;»', () => {
    const result = parseParticipantsCsv('Иванов, Иван;middle plus')
    expect(result.rows[0]!.fullName).toBe('Иванов, Иван')
  })

  it('обрабатывает CRLF и пустые строки', () => {
    const result = parseParticipantsCsv('\r\nИванов Иван;junior minus\r\n\r\nПетр;junior plus\r\n')
    expect(result.rows).toHaveLength(2)
  })

  it('ранг можно опустить — ставится дефолт без предупреждения', () => {
    const result = parseParticipantsCsv('Иванов Иван')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: FALLBACK_POSITION })
    expect(result.unrecognizedRanks).toEqual([])
  })

  it('нераспознанный ранг собирается в unrecognizedRanks (вес неизвестен без колонки)', () => {
    const result = parseParticipantsCsv('Иванов Иван;шофёр\nПетров Пётр;senior plus')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов Иван', position: FALLBACK_POSITION })
    expect(result.unrecognizedRanks).toEqual([{ label: 'шофёр', weight: null }])
    expect(result.rows).toHaveLength(2)
  })

  it('нераспознанные ранги не дублируются (без учёта регистра и ё)', () => {
    const result = parseParticipantsCsv('Иванов;Шофёр\nПетров;шофёр\nСидоров;Шофер')
    expect(result.unrecognizedRanks).toEqual([{ label: 'Шофёр', weight: null }])
    expect(result.rows).toHaveLength(3)
  })

  it('читает формат собственного экспорта «Команда;ФИО;Ранг;Прозвище;Вес»', () => {
    const result = parseParticipantsCsv(
      'Команда;ФИО;Ранг;Прозвище;Вес\r\n' +
        'Команда 1;Иванов Иван;Middle plus;Дикая утка;4\r\n' +
        'Команда 2;Петров Пётр;Шофёр;Задумчивый медведь;7',
    )
    expect(result.rows).toEqual([
      { fullName: 'Иванов Иван', position: 'middle-plus', nickname: 'Дикая утка' },
      { fullName: 'Петров Пётр', position: FALLBACK_POSITION, nickname: 'Задумчивый медведь' },
    ])
    expect(result.unrecognizedRanks).toEqual([{ label: 'Шофёр', weight: 7 }])
    expect(result.skippedLines).toBe(0)
  })

  it('вес нового ранга: запятая как десятичный разделитель и мусор игнорируются', () => {
    const result = parseParticipantsCsv(
      'ФИО;Ранг;Вес\nИванов;Шофёр;4,5\nПетров;Директор;abc\nСидоров;Грузчик;',
    )
    expect(result.unrecognizedRanks).toEqual([
      { label: 'Шофёр', weight: 4.5 },
      { label: 'Директор', weight: null },
      { label: 'Грузчик', weight: null },
    ])
  })

  it('срезает BOM в начале файла (экспорт добавляет его для Excel)', () => {
    const result = parseParticipantsCsv('\uFEFFФИО;Ранг\nИванов Иван;junior plus')
    expect(result.rows).toEqual([{ fullName: 'Иванов Иван', position: 'junior-plus' }])
  })

  it('кавычки по RFC: разделитель и кавычки внутри ячейки', () => {
    const result = parseParticipantsCsv('ФИО;Ранг\n"Иванов; ""странный""";middle plus')
    expect(result.rows[0]).toEqual({ fullName: 'Иванов; "странный"', position: 'middle-plus' })
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
