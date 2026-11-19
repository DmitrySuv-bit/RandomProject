import { resolvePosition, weightOfPosition } from '@/domain/positions'
import { useAppStore } from '@/stores/app-store'
import { IconButton } from '@/components/ui/IconButton'
import { PositionSelect } from './PositionSelect'

/** Таблица участников: ФИО, ранг, прозвище и действия */
export function ParticipantsTable() {
  const participants = useAppStore((s) => s.participants)
  const settings = useAppStore((s) => s.settings)
  const updateParticipant = useAppStore((s) => s.updateParticipant)
  const removeParticipant = useAppStore((s) => s.removeParticipant)
  const regenerateNickname = useAppStore((s) => s.regenerateNickname)

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <div className="text-5xl" aria-hidden="true">
          🐾
        </div>
        <p className="mt-4 text-lg font-medium">Список пуст</p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Добавьте первого участника через форму выше, импортируйте CSV-файл или заполните примером.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <th scope="col" className="w-12 px-4 py-3 font-medium">
              №
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              ФИО
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Ранг
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Прозвище
            </th>
            <th scope="col" className="w-20 px-4 py-3 font-medium">
              <span className="sr-only">Действия</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => {
            const info = resolvePosition(participant.position, settings)
            return (
              <tr
                key={participant.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-2.5 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2.5 font-medium">{participant.fullName}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <PositionSelect
                      value={participant.position}
                      onChange={(position) => updateParticipant(participant.id, { position })}
                    />
                    <span
                      title={`${info?.label ?? participant.position}: вес ${weightOfPosition(participant.position, settings)}`}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {info?.short ?? '?'} · {weightOfPosition(participant.position, settings)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 italic text-slate-500 dark:text-slate-400">
                  {participant.nickname || '—'}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton
                      title="Другое прозвище"
                      aria-label={`Другое прозвище для ${participant.fullName}`}
                      onClick={() => regenerateNickname(participant.id)}
                    >
                      🎲
                    </IconButton>
                    <IconButton
                      title="Удалить участника"
                      aria-label={`Удалить ${participant.fullName}`}
                      onClick={() => removeParticipant(participant.id)}
                    >
                      🗑️
                    </IconButton>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
