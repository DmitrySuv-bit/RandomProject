import { useState, type FormEvent } from 'react'
import { POSITIONS, type Position } from '@/domain/positions'
import type { Participant } from '@/domain/types'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'

type RuleMode = 'together' | 'separate' | 'level-cap'

const MODES: ReadonlyArray<{ id: RuleMode; label: string }> = [
  { id: 'together', label: '🤝 Вместе' },
  { id: 'separate', label: '⚡ Раздельно' },
  { id: 'level-cap', label: '📊 Лимит должности' },
]

/** Конструктор правил: пары «вместе»/«раздельно» и лимиты должностей */
export function RuleBuilder() {
  const participants = useAppStore((s) => s.participants)
  const addRule = useAppStore((s) => s.addRule)

  const [mode, setMode] = useState<RuleMode>('together')
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [capPosition, setCapPosition] = useState<Position>('senior-plus')
  const [maxPerTeam, setMaxPerTeam] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const enoughParticipants = participants.length >= 2

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'level-cap') {
      const id = addRule({ type: 'level-cap', position: capPosition, maxPerTeam })
      if (!id) {
        setError('Такое правило уже есть')
        return
      }
    } else {
      if (!firstId || !secondId) {
        setError('Выберите двух участников')
        return
      }
      if (firstId === secondId) {
        setError('Участники должны различаться')
        return
      }
      const id = addRule({ type: mode, a: firstId, b: secondId })
      if (!id) {
        setError('Такое правило уже есть')
        return
      }
      setSecondId('')
    }
    setError(null)
  }

  const switchMode = (next: RuleMode) => {
    setMode(next)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Тип правила"
        className="inline-flex flex-wrap rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/60"
      >
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            onClick={() => switchMode(item.id)}
            className={
              mode === item.id
                ? 'rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'level-cap' ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Не больше</span>
          <input
            type="number"
            min={1}
            max={99}
            value={maxPerTeam}
            aria-label="Максимум в команде"
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              setMaxPerTeam(Number.isNaN(parsed) ? 1 : Math.min(99, Math.max(1, parsed)))
            }}
            className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <select
            value={capPosition}
            onChange={(event) => setCapPosition(event.target.value as Position)}
            aria-label="Должность лимита"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {POSITIONS.map((position) => (
              <option key={position.id} value={position.id}>
                {position.label}
              </option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-slate-400">в одной команде</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <ParticipantPicker
            label={mode === 'together' ? 'Первый участник' : 'Первый участник'}
            value={firstId}
            onChange={(id) => {
              setFirstId(id)
              setError(null)
            }}
            participants={participants}
            disabled={!enoughParticipants}
          />
          <span className="text-slate-400">{mode === 'together' ? 'и' : 'не с'}</span>
          <ParticipantPicker
            label="Второй участник"
            value={secondId}
            onChange={(id) => {
              setSecondId(id)
              setError(null)
            }}
            participants={participants}
            excludeId={firstId}
            disabled={!enoughParticipants}
          />
        </div>
      )}

      <div className="flex min-h-8 flex-wrap items-center gap-3">
        <Button variant="primary" type="submit" disabled={mode !== 'level-cap' && !enoughParticipants}>
          Добавить правило
        </Button>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        {!enoughParticipants && mode !== 'level-cap' && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Нужно минимум 2 участника — добавьте их на вкладке «Участники».
          </p>
        )}
      </div>
    </form>
  )
}

interface ParticipantPickerProps {
  label: string
  value: string
  onChange: (id: string) => void
  participants: readonly Participant[]
  excludeId?: string
  disabled?: boolean
}

function ParticipantPicker({ label, value, onChange, participants, excludeId, disabled }: ParticipantPickerProps) {
  const options = participants.filter((p) => p.id !== excludeId)
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      disabled={disabled}
      className="min-w-48 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      <option value="" disabled>
        {options.length === 0 && participants.length > 0 ? 'Все уже выбраны' : 'Выберите участника'}
      </option>
      {options.map((participant) => (
        <option key={participant.id} value={participant.id}>
          {participant.fullName}
        </option>
      ))}
    </select>
  )
}
