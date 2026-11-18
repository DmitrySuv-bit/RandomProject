import type { Report, Team } from '@/domain/types'
import { EditableTeamName } from './EditableTeamName'
import { TeamBadge } from './TeamBadge'

interface ReportPanelProps {
  report: Report
  teams: readonly Team[]
  /** Переименование команды по клику на названии в таблице баланса */
  onRenameTeam?: (teamId: string, name: string) => void
}

/** Панель отчёта: баланс команд и статусы правил */
export function ReportPanel({ report, teams, onRenameTeam }: ReportPanelProps) {
  const violated = report.ruleResults.filter((r) => !r.ok)
  const fulfilledCount = report.ruleResults.length - violated.length
  const nameOf = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? '?'
  const indexOf = (teamId: string) => teams.findIndex((t) => t.id === teamId)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold">Баланс</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Разброс сумм весов:{' '}
            <span
              className={`font-semibold tabular-nums ${
                report.spread === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
              }`}
            >
              {report.spread}
            </span>
          </p>
          {/* table-fixed: ширины колонок не зависят от содержимого — редактирование не двигает таблицу */}
          <table className="mt-3 w-full table-fixed text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="w-[45%] pb-1.5 font-medium">Команда</th>
                <th scope="col" className="pb-1.5 font-medium">Люди</th>
                <th scope="col" className="pb-1.5 font-medium">Σ вес</th>
                <th scope="col" className="pb-1.5 font-medium">⌀ вес</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {report.balance.map((balance) => (
                <tr key={balance.teamId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      {indexOf(balance.teamId) >= 0 && (
                        <TeamBadge index={indexOf(balance.teamId)} className="h-4.5 w-4.5 text-[10px]" />
                      )}
                      <EditableTeamName
                        value={nameOf(balance.teamId)}
                        onRename={onRenameTeam ? (name) => onRenameTeam(balance.teamId, name) : undefined}
                        /* инпут выше текста на рамку+паддинги — компенсируем, чтобы строка не прыгала */
                        inputClassName="-my-[3px]"
                      />
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">{balance.count}</td>
                  <td className="py-1.5 pr-2">{balance.totalWeight}</td>
                  <td className="py-1.5">
                    {balance.count > 0 ? Math.round(balance.avgWeight * 10) / 10 : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="flex flex-wrap items-baseline gap-2 text-base font-semibold">
            Правила
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              {violated.length === 0
                ? `все выполнены (${fulfilledCount})`
                : `нарушено ${violated.length} из ${report.ruleResults.length}`}
            </span>
          </h3>

          {report.ruleResults.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              Правил нет — распределение зависит только от весов и рандома.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {report.ruleResults.map((ruleResult) => (
                <li
                  key={ruleResult.ruleId}
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                    ruleResult.ok
                      ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                      : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 font-bold ${
                      ruleResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {ruleResult.ok ? '✓' : '✕'}
                  </span>
                  <span className="min-w-0">
                    <span className="block">{ruleResult.label}</span>
                    {!ruleResult.ok && (
                      <span className="block text-xs text-rose-600/80 dark:text-rose-300/80">
                        {ruleResult.message}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
