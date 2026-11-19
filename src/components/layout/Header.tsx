import { useUiStore, type TabId } from '@/stores/ui-store'
import { ThemeToggle } from './ThemeToggle'

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'participants', label: 'Участники' },
  { id: 'settings', label: 'Настройки' },
  { id: 'results', label: 'Результат' },
]

export function Header() {
  const activeTab = useUiStore((s) => s.activeTab)
  const setActiveTab = useUiStore((s) => s.setActiveTab)

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span aria-hidden="true">🎲</span>
          Рандомайзер команд
        </h1>

        <nav
          className="ml-auto flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/60"
          aria-label="Разделы"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={
                activeTab === id
                  ? 'rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            >
              {label}
            </button>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
