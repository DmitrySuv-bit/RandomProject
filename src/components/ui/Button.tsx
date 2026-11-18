import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost:
    'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50',
}

export function Button({ variant = 'secondary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    />
  )
}
