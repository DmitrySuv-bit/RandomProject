import { isPosition, type CustomPosition, type Position } from './positions'
import type { ParticipantInput } from './types'

/** Ранг по умолчанию, если в CSV он не указан или не распознан */
export const FALLBACK_POSITION: Position = 'junior-minus'

/** Нормализация для сравнения названий: без регистра, ё→е, без краёв */
function normalizeLabel(raw: string): string {
  return raw.toLowerCase().replace(/ё/g, 'е').trim()
}

/** Точное совпадение с названием пользовательского ранга (без учёта регистра) */
function matchCustomPosition(raw: string, customPositions: readonly CustomPosition[]): Position | null {
  const normalized = normalizeLabel(raw)
  if (!normalized) return null
  const match = customPositions.find(
    (p) => p.label.toLowerCase().replace(/ё/g, 'е').trim() === normalized,
  )
  return match ? match.id : null
}

/**
 * Толерантное распознавание ранга:
 * «Junior plus», «junior+», «джун минус», «мидл+», «senior −» и т.п.
 * Сначала точное совпадение с пользовательским рангом, затем встроенные.
 * Возвращает null, если определить не удалось.
 */
export function parsePositionValue(
  raw: string,
  customPositions: readonly CustomPosition[] = [],
): Position | null {
  const custom = matchCustomPosition(raw, customPositions)
  if (custom) return custom

  const s = raw.toLowerCase().replace(/ё/g, 'е').trim()
  if (!s) return null

  let level: 'junior' | 'middle' | 'senior'
  if (/(junior|jun|джун)/.test(s)) level = 'junior'
  else if (/(middle|mid|миддл|мидл|мид)/.test(s)) level = 'middle'
  else if (/(senior|sen|сеньор|сенор)/.test(s)) level = 'senior'
  else return null

  const hasPlus = /(plus|плюс|\+)/.test(s)
  const hasMinus = /(minus|минус|[-−–])/.test(s)
  if (hasPlus === hasMinus) return null // модификатор не определён или противоречив

  const candidate = `${level}-${hasPlus ? 'plus' : 'minus'}` as const
  return isPosition(candidate) ? candidate : null
}

export interface CsvImportResult {
  rows: ParticipantInput[]
  /** Нераспознанные ранги (уникальные, в порядке появления); строкам поставлен Junior minus */
  unrecognizedLabels: string[]
  /** Непустые строки без ФИО */
  skippedLines: number
}

/** Автоопределение разделителя по количеству «;» и «,» в строке-образце */
function detectDelimiter(sample: string): string {
  const semicolons = (sample.match(/;/g) ?? []).length
  const commas = (sample.match(/,/g) ?? []).length
  return semicolons >= commas ? ';' : ','
}

/** Разбивает строку CSV с учётом кавычек (RFC 4180): `a;"b;c";"d""e"` → ['a', 'b;c', 'd"e'] */
function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells.map((cell) => cell.trim())
}

/** Номера значимых колонок в строке данных */
interface ColumnIndexes {
  name: number
  position: number
  nickname: number | null
}

/** Колонки по умолчанию (файл без заголовка): «ФИО;Ранг» */
const DEFAULT_COLUMNS: ColumnIndexes = { name: 0, position: 1, nickname: null }

/**
 * Разбирает строку заголовка на номера колонок по названиям: «ФИО»,
 * «Ранг» (или старый «Должность»), «Прозвище». Так понимается и формат
 * собственного экспорта «Команда;ФИО;Ранг;Прозвище;Вес» — колонки
 * «Команда» и «Вес» просто игнорируются.
 * null — строка не похожа на заголовок.
 */
function columnsFromHeader(cells: string[]): ColumnIndexes | null {
  const normalized = cells.map((cell) => cell.trim().toLowerCase())
  const name = normalized.findIndex((cell) => cell === 'фио')
  const position = normalized.findIndex(
    (cell) => cell.startsWith('ранг') || cell.startsWith('должност'),
  )
  if (name === -1 && position === -1) return null
  const nickname = normalized.findIndex((cell) => cell.startsWith('прозвищ'))
  return {
    name: name === -1 ? DEFAULT_COLUMNS.name : name,
    position: position === -1 ? DEFAULT_COLUMNS.position : position,
    nickname: nickname === -1 ? null : nickname,
  }
}

/**
 * Разбор CSV со списком участников.
 * Без заголовка формат строки: «ФИО;Ранг» (или через запятую), ранг можно опустить.
 * С заголовком колонки определяются по названиям — так читается и собственный
 * экспорт «Команда;ФИО;Ранг;Прозвище;Вес» (прозвища восстанавливаются,
 * команда и вес игнорируются). Кавычки разбираются по RFC 4180, BOM срезается.
 * Ранг ищется среди встроенных (толерантно) и пользовательских (по названию).
 * Нераспознанные названия собираются в unrecognizedLabels — вызывающая сторона
 * может создать из них пользовательские ранги и разобрать файл заново.
 */
export function parseParticipantsCsv(
  text: string,
  customPositions: readonly CustomPosition[] = [],
): CsvImportResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const result: CsvImportResult = { rows: [], unrecognizedLabels: [], skippedLines: 0 }

  let index = 0
  while (index < lines.length && lines[index]!.trim() === '') index++
  if (index >= lines.length) return result

  const delimiter = detectDelimiter(lines[index]!)
  const columns = columnsFromHeader(splitCsvLine(lines[index]!, delimiter))
  if (columns) index++
  const cols = columns ?? DEFAULT_COLUMNS

  for (; index < lines.length; index++) {
    const line = lines[index]!
    if (line.trim() === '') continue
    const cells = splitCsvLine(line, delimiter)

    const fullName = cells[cols.name] ?? ''
    if (!fullName) {
      result.skippedLines++
      continue
    }

    const positionRaw = cells[cols.position] ?? ''
    const recognized = positionRaw ? parsePositionValue(positionRaw, customPositions) : null
    if (positionRaw && !recognized) {
      const isNew = !result.unrecognizedLabels.some(
        (label) => normalizeLabel(label) === normalizeLabel(positionRaw),
      )
      if (isNew) result.unrecognizedLabels.push(positionRaw)
    }
    const position = recognized ?? FALLBACK_POSITION

    const nickname = (cols.nickname !== null ? cells[cols.nickname] ?? '' : '').trim()
    result.rows.push(nickname ? { fullName, position, nickname } : { fullName, position })
  }

  return result
}
