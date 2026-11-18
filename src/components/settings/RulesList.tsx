import { useMemo } from 'react'
import { describeRule } from '@/domain/rules'
import type { Rule } from '@/domain/types'
import { useAppStore } from '@/stores/app-store'
import { IconButton } from '@/components/ui/IconButton'

const TYPE_META: Record<Rule['type'], { label: string; className: string }> = {
  together: {
    label: 'вместе',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  separate: {
    label: 'раздельно',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  'level-cap': {
    label: 'лимит',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  },
}

/** Список правил с чекбоксами и удалением */
export function RulesList() {
  const rules = useAppStore((s) => s.settings.rules)
  const participants = useAppStore((s) => s.participants)
  const toggleRule = useAppStore((s) => s.toggleRule)
  const removeRule = useAppStore((s) => s.removeRule)

  const byId = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])

  if (rules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
        Правил пока нет — добавьте первое через конструктор выше.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {rules.map((rule) => {
        const meta = TYPE_META[rule.type]
        return (
          <li
            key={rule.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => toggleRule(rule.id)}
              aria-label={rule.enabled ? 'Отключить правило' : 'Включить правило'}
              className="size-4 accent-indigo-600"
            />
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
              {meta.label}
            </span>
            <span
              className={`min-w-0 flex-1 text-sm ${
                rule.enabled ? '' : 'text-slate-400 line-through dark:text-slate-500'
              }`}
            >
              {describeRule(rule, (id) => byId.get(id))}
            </span>
            <IconButton
              title="Удалить правило"
              aria-label="Удалить правило"
              onClick={() => removeRule(rule.id)}
            >
              ✕
            </IconButton>
          </li>
        )
      })}
    </ul>
  )
}
