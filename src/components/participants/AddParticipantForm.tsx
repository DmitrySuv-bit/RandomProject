import { useState, type FormEvent } from 'react'
import { POSITIONS, type Position } from '@/domain/positions'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'
import { PositionSelect } from './PositionSelect'

/** Форма добавления участника: ФИО + должность */
export function AddParticipantForm() {
  const addParticipant = useAppStore((s) => s.addParticipant)
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState<Position>(POSITIONS[2]!.id) // Middle minus по умолчанию

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = fullName.trim()
    if (!name) return
    addParticipant({ fullName: name, position })
    setFullName('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <input
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="ФИО, например Иванов Иван"
        aria-label="ФИО участника"
        className="min-w-0 flex-1 basis-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <PositionSelect value={position} onChange={setPosition} />
      <Button variant="primary" type="submit" disabled={!fullName.trim()}>
        Добавить
      </Button>
    </form>
  )
}
