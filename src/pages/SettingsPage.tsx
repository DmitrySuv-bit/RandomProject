import { useAppStore } from '@/stores/app-store'
import { useUiStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/Button'
import { RuleBuilder } from '@/components/settings/RuleBuilder'
import { RulesList } from '@/components/settings/RulesList'
import { TeamNamesCard } from '@/components/settings/TeamNamesCard'
import { TeamSettingsCard } from '@/components/settings/TeamSettingsCard'
import { WeightsCard } from '@/components/settings/WeightsCard'

export function SettingsPage() {
  const resetAll = useAppStore((s) => s.resetAll)
  const setActiveTab = useUiStore((s) => s.setActiveTab)

  const handleReset = () => {
    if (window.confirm('Удалить всех участников, правила и результат распределения?')) {
      resetAll()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Настройки</h2>
        <Button variant="primary" className="ml-auto" onClick={() => setActiveTab('results')}>
          К распределению →
        </Button>
      </div>

      <TeamSettingsCard />
      <TeamNamesCard />
      <WeightsCard />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-semibold">Правила размещения</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          «Вместе» — двое в одной команде; «раздельно» — в разных; лимит — не больше N участников
          ранга в команде. Правила можно временно выключать.
        </p>
        <div className="mt-4">
          <RuleBuilder />
        </div>
        <div className="mt-5">
          <RulesList />
        </div>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-500/5">
        <h3 className="text-base font-semibold text-rose-700 dark:text-rose-300">Опасная зона</h3>
        <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-400/80">
          Полный сброс: участники, настройки, правила и результат будут удалены без возможности
          восстановления.
        </p>
        <Button variant="danger" className="mt-3" onClick={handleReset}>
          Сбросить все данные
        </Button>
      </section>
    </div>
  )
}
