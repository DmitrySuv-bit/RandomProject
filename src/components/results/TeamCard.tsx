import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Position } from '@/domain/positions'
import type { Participant, Team, TeamBalance } from '@/domain/types'
import { ParticipantChip } from './ParticipantChip'
import { TeamBadge } from './TeamBadge'

interface TeamCardProps {
  team: Team
  /** Порядковый номер команды — для бейджа */
  index: number
  balance: TeamBalance | undefined
  participantsById: ReadonlyMap<string, Participant>
  weights: Record<Position, number>
  /** Переименование команды (не передан — название статичное) */
  onRename?: (name: string) => void
}

/** Карточка команды: номер, название, баланс и перетаскиваемые участники */
export function TeamCard({ team, index, balance, participantsById, weights, onRename }: TeamCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: team.id })
  const [editing, setEditing] = useState(false)

  const startEditing = () => setEditing(true)

  /** Коммит на blur или Enter; Esc отменяет правку */
  const commit = (event: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    setEditing(false)
    const name = event.currentTarget.value.trim()
    if (onRename && name && name !== team.name) onRename(name)
  }

  const count = balance?.count ?? team.memberIds.length
  const totalWeight = balance?.totalWeight ?? 0
  const avgWeight = balance && balance.count > 0 ? Math.round(balance.avgWeight * 10) / 10 : null

  return (
    <section
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-900 ${
        isOver
          ? 'border-indigo-400 ring-2 ring-indigo-400/60 dark:border-indigo-500'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamBadge index={index} className="h-7 w-7 text-sm shadow-sm" />
          {editing ? (
            <input
              autoFocus
              type="text"
              defaultValue={team.name}
              maxLength={60}
              aria-label="Новое название команды"
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') {
                  // Escape: возвращаем старое значение, blur с ним же ничего не изменит
                  if (event.key === 'Escape') event.currentTarget.value = team.name
                  event.currentTarget.blur()
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-indigo-400 bg-white px-2 py-0.5 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-500 dark:bg-slate-900 dark:text-white"
            />
          ) : (
            <h3 className="min-w-0 text-lg font-bold leading-7 text-slate-900 dark:text-white">
              <button
                type="button"
                onClick={onRename ? startEditing : undefined}
                title={onRename ? 'Переименовать команду' : undefined}
                className="block max-w-full truncate rounded-sm text-left hover:underline hover:decoration-dotted hover:decoration-slate-400 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:decoration-slate-500"
              >
                {team.name}
              </button>
            </h3>
          )}
        </div>
        <span
          title={`${count} участников, суммарный вес ${totalWeight}`}
          className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        >
          {count} чел · Σ {totalWeight}
          {avgWeight !== null ? ` · ⌀ ${avgWeight}` : ''}
        </span>
      </header>

      {team.memberIds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Перетащите участника сюда
        </p>
      ) : (
        <ul className="space-y-1.5">
          {team.memberIds.map((id) => {
            const participant = participantsById.get(id)
            if (!participant) return null
            return <ParticipantChip key={id} participant={participant} weight={weights[participant.position]} />
          })}
        </ul>
      )}
    </section>
  )
}
