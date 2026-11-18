import { useDroppable } from '@dnd-kit/core'
import type { Position } from '@/domain/positions'
import type { Participant, Team, TeamBalance } from '@/domain/types'
import { ParticipantChip } from './ParticipantChip'

interface TeamCardProps {
  team: Team
  balance: TeamBalance | undefined
  participantsById: ReadonlyMap<string, Participant>
  weights: Record<Position, number>
}

/** Карточка команды: баланс и перетаскиваемые участники */
export function TeamCard({ team, balance, participantsById, weights }: TeamCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: team.id })

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
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">{team.name}</h3>
        <span
          title={`${count} участников, суммарный вес ${totalWeight}`}
          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
