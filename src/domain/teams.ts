/** Название команды с фолбэком «Команда N» для пустого значения */
export function teamDisplayName(name: string | undefined, index: number): string {
  return name?.trim() || `Команда ${index + 1}`
}
