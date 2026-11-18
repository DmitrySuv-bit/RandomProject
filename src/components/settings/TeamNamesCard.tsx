import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'

/** Карточка «Названия команд»: своё имя для каждой команды или сгенерированное */
export function TeamNamesCard() {
  const { teamCount, teamNames } = useAppStore((s) => s.settings)
  const setTeamName = useAppStore((s) => s.setTeamName)
  const generateTeamNames = useAppStore((s) => s.generateTeamNames)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Названия команд</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Пустые поля получают случайное название при распределении — или сгенерируйте сразу.
          </p>
        </div>
        <Button onClick={generateTeamNames} disabled={teamCount === 0}>
          🎲 Сгенерировать
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: teamCount }, (_, index) => (
          <label key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
              {index + 1}.
            </span>
            <input
              type="text"
              value={teamNames[index] ?? ''}
              placeholder="случайное название"
              maxLength={60}
              aria-label={`Название команды ${index + 1}`}
              onChange={(event) => setTeamName(index, event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </label>
        ))}
      </div>
    </section>
  )
}
