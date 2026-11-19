import { useState } from 'react'

interface EditableTeamNameProps {
  value: string
  /** Переименование (не передан — название статичное) */
  onRename?: (name: string) => void
  /** Дополнительные классы кнопки (типографика контекста) */
  buttonClassName?: string
  /** Дополнительные классы поля ввода */
  inputClassName?: string
}

const BUTTON_BASE =
  'block w-full min-w-0 rounded-sm text-left hover:underline hover:decoration-dotted hover:decoration-slate-400 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:decoration-slate-500'
const INPUT_BASE =
  'block w-full min-w-0 rounded-md border border-indigo-400 bg-white px-2 py-0.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-500 dark:bg-slate-900 dark:text-white'

/** Название команды с inline-редактированием: клик → ввод → Enter/blur сохраняет, Esc отменяет */
export function EditableTeamName({
  value,
  onRename,
  buttonClassName = '',
  inputClassName = '',
}: EditableTeamNameProps) {
  const [editing, setEditing] = useState(false)

  /** Пустой ввод или без изменений — просто закрыть редактирование */
  const commit = (event: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    setEditing(false)
    const next = event.currentTarget.value.trim()
    if (onRename && next && next !== value) onRename(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onRename ? () => setEditing(true) : undefined}
        title={onRename ? 'Переименовать команду' : undefined}
        className={`${BUTTON_BASE} ${buttonClassName}`}
      >
        {value}
      </button>
    )
  }

  return (
    <input
      autoFocus
      type="text"
      defaultValue={value}
      maxLength={60}
      aria-label="Новое название команды"
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === 'Escape') {
          // Escape: возвращаем старое значение, blur с ним же ничего не изменит
          if (event.key === 'Escape') event.currentTarget.value = value
          event.currentTarget.blur()
        }
      }}
      className={`${INPUT_BASE} ${inputClassName}`}
    />
  )
}
