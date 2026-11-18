interface PlaceholderCardProps {
  emoji: string
  title: string
  description: string
}

/** Временная заглушка раздела до его реализации */
export function PlaceholderCard({ emoji, title, description }: PlaceholderCardProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="text-5xl" aria-hidden="true">
        {emoji}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{description}</p>
    </section>
  )
}
