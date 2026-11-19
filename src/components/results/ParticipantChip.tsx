import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { resolvePosition } from '@/domain/positions'
import type { Participant } from '@/domain/types'
import { useAppStore } from '@/stores/app-store'

interface ParticipantChipProps {
  participant: Participant
  weight: number
  /** Подсветка от поиска на вкладке «Результат» */
  highlighted?: boolean
}

/** Перетаскиваемая карточка участника внутри команды */
export function ParticipantChip({ participant, weight, highlighted = false }: ParticipantChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.id,
  })

  const settings = useAppStore((s) => s.settings)
  const info = resolvePosition(participant.position, settings)

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      title="Перетащите в другую команду"
      className={`flex cursor-grab touch-none select-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 ${
        highlighted
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400 dark:border-amber-500/60 dark:bg-amber-500/10 dark:ring-amber-500/60'
          : ''
      } ${isDragging ? 'z-10 opacity-50 ring-2 ring-indigo-400' : ''}`}
    >
      <span
        title={info?.label ?? String(participant.position)}
        className="w-8 shrink-0 rounded-full bg-slate-100 py-0.5 text-center text-[11px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300"
      >
        {info?.short ?? '?'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" title={participant.fullName}>
          {participant.fullName}
        </span>
        <span
          className="block truncate text-xs italic text-slate-400 dark:text-slate-500"
          title={participant.nickname}
        >
          {participant.nickname || '—'}
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">{weight}</span>
    </li>
  )
}
