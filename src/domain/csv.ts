import { isPosition, type Position } from './positions'
import type { ParticipantInput } from './types'

/** Должность по умолчанию, если в CSV она не указана или не распознана */
export const FALLBACK_POSITION: Position = 'junior-minus'

/**
 * Толерантное распознавание должности:
 * «Junior plus», «junior+», «джун минус», «мидл+», «senior −» и т.п.
 * Возвращает null, если уровень или модификатор определить не удалось.
 */
export function parsePositionValue(raw: string): Position | null {
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
  /** Участники с нераспознанной должностью (заменена на Junior minus) */
  unrecognizedPosition: string[]
  /** Непустые строки без ФИО */
  skippedLines: number
}

/** Автоопределение разделителя по количеству «;» и «,» в строке-образце */
function detectDelimiter(sample: string): string {
  const semicolons = (sample.match(/;/g) ?? []).length
  const commas = (sample.match(/,/g) ?? []).length
  return semicolons >= commas ? ';' : ','
}

/** Похоже ли первая строка на заголовок («ФИО;Должность») */
function looksLikeHeader(cells: string[]): boolean {
  const normalized = cells.map((cell) => cell.trim().toLowerCase())
  return normalized.some((cell) => cell === 'фио' || cell.startsWith('должност'))
}

/**
 * Разбор CSV со списком участников.
 * Формат строки: «ФИО;Должность» (или через запятую). Должность можно опустить.
 * Кавычки по RFC не разбираются — ФИО с разделителем внутри не поддерживается.
 */
export function parseParticipantsCsv(text: string): CsvImportResult {
  const lines = text.split(/\r?\n/)
  const result: CsvImportResult = { rows: [], unrecognizedPosition: [], skippedLines: 0 }

  let index = 0
  while (index < lines.length && lines[index]!.trim() === '') index++
  if (index >= lines.length) return result

  const delimiter = detectDelimiter(lines[index]!)
  if (looksLikeHeader(lines[index]!.split(delimiter))) index++

  for (; index < lines.length; index++) {
    const line = lines[index]!
    if (line.trim() === '') continue
    const cells = line.split(delimiter).map((cell) => cell.trim())

    const fullName = cells[0] ?? ''
    if (!fullName) {
      result.skippedLines++
      continue
    }

    const positionRaw = cells[1] ?? ''
    if (!positionRaw) {
      result.rows.push({ fullName, position: FALLBACK_POSITION })
      continue
    }

    const position = parsePositionValue(positionRaw)
    if (position) {
      result.rows.push({ fullName, position })
    } else {
      result.rows.push({ fullName, position: FALLBACK_POSITION })
      result.unrecognizedPosition.push(fullName)
    }
  }

  return result
}
