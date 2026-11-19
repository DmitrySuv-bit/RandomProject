import { useState } from 'react'
import {
  DEFAULT_WEIGHTS,
  POSITIONS,
  isLabelTaken,
  type CustomPosition,
} from '@/domain/positions'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { NumberField } from './NumberField'

const DEFAULT_CUSTOM_WEIGHT = 3

/** Карточка «Веса должностей»: встроенные + пользовательские должности */
export function WeightsCard() {
  const settings = useAppStore((s) => s.settings)
  const { weights, customPositions, rules } = settings
  const participants = useAppStore((s) => s.participants)
  const setWeight = useAppStore((s) => s.setWeight)
  const addCustomPosition = useAppStore((s) => s.addCustomPosition)
  const setCustomPositionWeight = useAppStore((s) => s.setCustomPositionWeight)
  const removeCustomPosition = useAppStore((s) => s.removeCustomPosition)

  const [label, setLabel] = useState('')
  const [weight, setWeightDraft] = useState(DEFAULT_CUSTOM_WEIGHT)

  const trimmed = label.trim()
  const duplicate = trimmed !== '' && isLabelTaken(trimmed, settings)
  const canAdd = trimmed !== '' && !duplicate

  const handleAdd = () => {
    if (!canAdd) return
    addCustomPosition(trimmed, weight)
    setLabel('')
  }

  const resetToDefaults = () => {
    for (const position of POSITIONS) {
      setWeight(position.id, DEFAULT_WEIGHTS[position.id])
    }
  }

  const isDefault = POSITIONS.every((p) => weights[p.id] === p.defaultWeight)

  /** Кто использует должность — для блокировки удаления */
  const usageOf = (id: string): { count: number; used: boolean } => {
    const people = participants.filter((p) => p.position === id).length
    const caps = rules.filter((r) => r.type === 'level-cap' && r.position === id).length
    return { count: people + caps, used: people + caps > 0 }
  }

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
              onCommit={(next) => setWeight(position.id, next)}
              min={0}
              max={99}
              ariaLabel={`Вес должности ${position.label}`}
              className="w-20"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Свои должности
        </h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Например, «Тимлид» или «QA» — своя должность со своим весом, доступна участникам,
          правилам и импорту CSV.
        </p>

        {customPositions.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {customPositions.map((position) => {
              const usage = usageOf(position.id)
              return (
                <CustomPositionRow
                  key={position.id}
                  position={position}
                  usage={usage}
                  onWeight={(next) => setCustomPositionWeight(position.id, next)}
                  onRemove={() => removeCustomPosition(position.id)}
                />
              )
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={label}
            placeholder="Название должности"
            aria-label="Название новой должности"
            maxLength={30}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd()
            }}
            className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <NumberField
            value={weight}
            onCommit={setWeightDraft}
            min={0}
            max={99}
            ariaLabel="Вес новой должности"
            className="w-20"
          />
          <Button onClick={handleAdd} disabled={!canAdd} title={duplicate ? 'Такая должность уже есть' : undefined}>
            ➕ Добавить
          </Button>
        </div>
      </div>
    </section>
  )
}

interface CustomPositionRowProps {
  position: CustomPosition
  usage: { count: number; used: boolean }
  onWeight: (weight: number) => void
  onRemove: () => void
}

function CustomPositionRow({ position, usage, onWeight, onRemove }: CustomPositionRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-2 dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <span
        title={position.label}
        className="w-9 shrink-0 rounded-full bg-indigo-100 py-0.5 text-center text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
      >
        {position.short}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{position.label}</span>
      <NumberField
        value={position.weight}
        onCommit={onWeight}
        min={0}
        max={99}
        ariaLabel={`Вес должности ${position.label}`}
        className="w-20"
      />
      <IconButton
        onClick={onRemove}
        disabled={!usage.used ? undefined : true}
        title={
          usage.used
            ? `Нельзя удалить: используется (${usage.count}) — сначала снимите должность с участников и правил`
            : 'Удалить должность'
        }
        aria-label={`Удалить должность ${position.label}`}
        className={usage.used ? 'opacity-40' : ''}
      >
        🗑️
      </IconButton>
    </div>
  )
}
