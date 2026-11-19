import { resolvePosition, weightOfPosition } from './positions'
import type { DistributionResult, Participant, Settings } from './types'

/** Экранирование ячейки CSV (RFC 4180: кавычки, разделители, переводы строк) */
function escapeCell(value: string): string {
  if (/[";\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

/**
 * CSV со составами команд: «Команда;ФИО;Должность;Прозвище;Вес».
 * Разделитель «;» и CRLF — открывается в Excel без настроек.
 */
export function teamsToCsv(
  result: DistributionResult,
  participants: readonly Participant[],
  settings: Settings,
): string {
  const byId = new Map(participants.map((p) => [p.id, p] as const))
  const rows: string[] = ['Команда;ФИО;Должность;Прозвище;Вес']

  for (const team of result.teams) {
    for (const memberId of team.memberIds) {
      const participant = byId.get(memberId)
      if (!participant) continue
      rows.push(
        [
          team.name,
          participant.fullName,
          resolvePosition(participant.position, settings)?.label ?? String(participant.position),
          participant.nickname,
          String(weightOfPosition(participant.position, settings)),
        ]
          .map(escapeCell)
          .join(';'),
      )
    }
  }

  return rows.join('\r\n')
}

/** Имя файла вида «команды-2026-11-18-23-30.csv» */
export function csvFileName(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`
  return `команды-${stamp}.csv`
}

/** Скачивание CSV (BOM + UTF-8, чтобы Excel корректно показал кириллицу) */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
