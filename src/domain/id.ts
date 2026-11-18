/** Генератор уникальных идентификаторов */
export function uid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  // Fallback для окружений без crypto.randomUUID (например, http в локальной сети)
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
