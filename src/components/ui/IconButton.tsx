import type { ButtonHTMLAttributes } from 'react'

/** Компактная кнопка-иконка для таблиц и карточек */
export function IconButton({ className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg p-1.5 text-base leading-none text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700/60 dark:hover:text-slate-200 ${className}`}
      {...rest}
    />
  )
}
