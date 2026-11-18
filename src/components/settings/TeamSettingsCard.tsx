import { useAppStore } from '@/stores/app-store'
import { NumberField } from './NumberField'

/** Карточка «Команды»: количество, режим размера и сводка */
export function TeamSettingsCard() {
  const participantsCount = useAppStore((s) => s.participants.length)
  const settings = useAppStore((s) => s.settings)
  const setTeamCount = useAppStore((s) => s.setTeamCount)
  const setSizingMode = useAppStore((s) => s.setSizingMode)
  const setSizeLimits = useAppStore((s) => s.setSizeLimits)

  const { teamCount, sizingMode, minSize, maxSize } = settings

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold">Команды</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="text-sm">
          <span className="mb-1.5 block font-medium text-slate-500 dark:text-slate-400">
            Количество команд
          </span>
          <NumberField
            value={teamCount}
            onCommit={setTeamCount}
            min={1}
            max={50}
            ariaLabel="Количество команд"
          />
        </div>

        <div className="text-sm">
          <span className="mb-1.5 block font-medium text-slate-500 dark:text-slate-400">
            Размер команд
          </span>
          <div
            role="radiogroup"
            aria-label="Режим размера команд"
            className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/60"
          >
            <button
              type="button"
              role="radio"
              aria-checked={sizingMode === 'even'}
              onClick={() => setSizingMode('even')}
              className={
                sizingMode === 'even'
                  ? 'rounded-lg bg-white px-3 py-1.5 font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'rounded-lg px-3 py-1.5 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            >
              Поровну
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={sizingMode === 'limits'}
              onClick={() => setSizingMode('limits')}
              className={
                sizingMode === 'limits'
                  ? 'rounded-lg bg-white px-3 py-1.5 font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'rounded-lg px-3 py-1.5 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            >
              Границы
            </button>
          </div>
        </div>
      </div>

      {sizingMode === 'limits' && (
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">Минимум в команде</span>
            <NumberField
              value={minSize}
              onCommit={(min) => setSizeLimits(min, maxSize)}
              min={1}
              max={99}
              ariaLabel="Минимум участников в команде"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">Максимум в команде</span>
            <NumberField
              value={maxSize}
              onCommit={(max) => setSizeLimits(minSize, max)}
              min={1}
              max={99}
              ariaLabel="Максимум участников в команде"
            />
          </label>
        </div>
      )}

      <SizingSummary
        count={participantsCount}
        teamCount={teamCount}
        sizingMode={sizingMode}
        minSize={minSize}
        maxSize={maxSize}
      />
    </section>
  )
}

interface SizingSummaryProps {
  count: number
  teamCount: number
  sizingMode: 'even' | 'limits'
  minSize: number
  maxSize: number
}

function SizingSummary({ count, teamCount, sizingMode, minSize, maxSize }: SizingSummaryProps) {
  if (count === 0) {
    return (
      <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
        Добавьте участников — здесь появится расчёт по командам.
      </p>
    )
  }

  if (sizingMode === 'even') {
    if (teamCount > count) {
      return <Warn>Команд больше, чем участников: участников сейчас {count}.</Warn>
    }
    const base = Math.floor(count / teamCount)
    const big = count % teamCount
    return (
      <Ok>
        {big > 0
          ? `${teamCount} команд: ${big} по ${base + 1} и ${teamCount - big} по ${base} человек`
          : `${teamCount} команд по ${base} человек`}
      </Ok>
    )
  }

  const minTotal = teamCount * minSize
  const maxTotal = teamCount * maxSize
  if (count < minTotal) {
    return (
      <Warn>
        Не хватает участников: при {teamCount} командах и минимуме {minSize} нужно хотя бы {minTotal}{' '}
        (сейчас {count}).
      </Warn>
    )
  }
  if (count > maxTotal) {
    return (
      <Warn>
        Слишком много участников: при максимуме {maxSize} помещается {maxTotal} (сейчас {count}).
      </Warn>
    )
  }
  return (
    <Ok>
      {teamCount} команд по {minSize}–{maxSize} человек — участники помещаются (мест: {minTotal}–
      {maxTotal}).
    </Ok>
  )
}

function Ok({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
      <span aria-hidden="true">✓ </span>
      {children}
    </p>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
      <span aria-hidden="true">⚠ </span>
      {children}
    </p>
  )
}
