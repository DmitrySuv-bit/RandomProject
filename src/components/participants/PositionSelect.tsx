import { POSITIONS, type Position } from '@/domain/positions'

interface PositionSelectProps {
  value: Position
  onChange: (position: Position) => void
  id?: string
}

/** Селект должности с весами */
export function PositionSelect({ value, onChange, id }: PositionSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as Position)}
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {POSITIONS.map((position) => (
        <option key={position.id} value={position.id}>
          {position.label}
        </option>
      ))}
    </select>
  )
}
