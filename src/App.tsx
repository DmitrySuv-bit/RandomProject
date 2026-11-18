import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { ParticipantsPage } from '@/pages/ParticipantsPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useThemeStore } from '@/stores/theme-store'
import { useUiStore } from '@/stores/ui-store'

export default function App() {
  const activeTab = useUiStore((s) => s.activeTab)

  // Пока пользователь не выбрал тему вручную — следим за системной
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const setSystemTheme = useThemeStore.getState().setSystemTheme
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === 'participants' && <ParticipantsPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'results' && <ResultsPage />}
      </main>
    </div>
  )
}
