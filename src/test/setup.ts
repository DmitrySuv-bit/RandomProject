/**
 * Глобальный setup для unit-тестов.
 * В node-окружении нет localStorage — zustand persist захватывает его
 * при создании стора, поэтому мок должен стоять до импорта модулей.
 */
// zustand v5 читает window.localStorage — обзаводимся window
;(globalThis as { window?: unknown }).window = globalThis

const storage = new Map<string, string>()

globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
  key: () => null,
  get length() {
    return storage.size
  },
} as unknown as Storage
