import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  /** Текущая тема */
  theme: Theme
  /** Выбрал ли пользователь тему вручную (ручной выбор приоритетнее системного) */
  userSelected: boolean
  /** Явный выбор темы пользователем */
  setTheme: (theme: Theme) => void
  /** Изменение системной темы — игнорируется, если пользователь выбрал свою */
  setSystemTheme: (theme: Theme) => void
  toggle: () => void
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),
      userSelected: false,
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme, userSelected: true })
      },
      setSystemTheme: (theme) => {
        if (get().userSelected) return
        applyTheme(theme)
        set({ theme })
      },
      toggle: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
      },
    }),
    {
      name: 'random-team-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
