import { DEFAULT_WEIGHTS, POSITIONS } from '@/domain/positions'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'
import { NumberField } from './NumberField'

/** Карточка «Веса должностей» */
export function WeightsCard() {
  const weights = useAppStore((s) => s.settings.weights)
  const setWeight = useAppStore((s) => s.setWeight)

  const resetToDefaults = () => {
    for (const position of POSITIONS) {
      setWeight(position.id, DEFAULT_WEIGHTS[position.id])
    }
  }

  const isDefault = POSITIONS.every((p) => weights[p.id] === p.defaultWeight)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-semibold">Веса должностей</h3>
        <Button variant="ghost" onClick={resetToDefaults} disabled={isDefault} className="ml-auto">
          По умолчанию (1–6)
        </Button>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        По весам считается баланс команд: чем ближе суммы весов, тем ровнее команды.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {POSITIONS.map((position) => (
          <div
            key={position.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
          >
            <span
              title={position.label}
              className="w-9 rounded-full bg-slate-100 py-0.5 text-center text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {position.short}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{position.label}</span>
            <NumberField
              value={weights[position.id]}
              onCommit={(weight) => setWeight(position.id, weight)}
              min={0}
              max={99}
              ariaLabel={`Вес должности ${position.label}`}
              className="w-20"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
