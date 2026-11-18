import { useState } from 'react'

interface NumberFieldProps {
  value: number
  /** Вызывается по blur/Enter со значением, приведённым к границам */
  onCommit: (value: number) => void
  min: number
  max: number
  ariaLabel: string
  id?: string
  className?: string
}

/** Числовое поле: правки копятся локально, коммит на blur или Enter */
export function NumberField({ value, onCommit, min, max, ariaLabel, id, className = '' }: NumberFieldProps) {
  const [text, setText] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)

  // Синхронизация при внешнем изменении (сброс, кламп в сторе) — без эффекта
  if (value !== prevValue) {
    setPrevValue(value)
    setText(String(value))
  }

  const commit = () => {
    const parsed = Number.parseInt(text, 10)
    const clamped = Number.isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed))
    setText(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      aria-label={ariaLabel}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      className={`w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${className}`}
    />
  )
}
