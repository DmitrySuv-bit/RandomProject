/** Акцентные цвета команд — циклично повторяются для 1..N */
const TEAM_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
] as const

interface TeamBadgeProps {
  index: number
  className?: string
}

/** Цветной бейдж с номером команды (карточки команд и таблица баланса) */
export function TeamBadge({ index, className = '' }: TeamBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white tabular-nums ${
        TEAM_COLORS[index % TEAM_COLORS.length]!
      } ${className}`}
    >
      {index + 1}
    </span>
  )
}
