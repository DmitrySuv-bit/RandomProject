import { useState } from 'react'
import { parseParticipantsCsv } from '@/domain/csv'
import { makeDemoParticipants } from '@/domain/demo'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/Button'
import { AddParticipantForm } from '@/components/participants/AddParticipantForm'
import { ImportCsvButton } from '@/components/participants/ImportCsvButton'
import { ParticipantsTable } from '@/components/participants/ParticipantsTable'

interface ImportSummary {
  added: number
  unrecognized: string[]
  skipped: number
}

export function ParticipantsPage() {
  const participants = useAppStore((s) => s.participants)
  const settings = useAppStore((s) => s.settings)
  const addParticipants = useAppStore((s) => s.addParticipants)
  const regenerateAllNicknames = useAppStore((s) => s.regenerateAllNicknames)

  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const handleCsvFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseParticipantsCsv(text, settings.customPositions)
    const added = addParticipants(parsed.rows)
    setImportSummary({
      added,
      unrecognized: parsed.unrecognizedPosition,
      skipped: parsed.skippedLines,
    })
  }

  const handleDemo = () => {
    const added = addParticipants(makeDemoParticipants())
    setImportSummary({ added, unrecognized: [], skipped: 0 })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          Участники
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            {participants.length}
          </span>
        </h2>

        <div className="ml-auto flex flex-wrap gap-2">
          <ImportCsvButton onFile={handleCsvFile} />
          <Button onClick={handleDemo}>✨ Заполнить примером</Button>
          <Button onClick={regenerateAllNicknames} disabled={participants.length === 0}>
            🎲 Обновить все прозвища
          </Button>
        </div>
      </div>

      {importSummary && <ImportBanner summary={importSummary} onClose={() => setImportSummary(null)} />}

      <AddParticipantForm />

      <ParticipantsTable />
    </div>
  )
}

function ImportBanner({ summary, onClose }: { summary: ImportSummary; onClose: () => void }) {
  const { added, unrecognized, skipped } = summary
  const nothing = added === 0

  return (
    <div
      role="status"
      className={`rounded-2xl border p-4 text-sm ${
        nothing
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {nothing ? (
            <p className="font-medium">В файле не найдено ни одного участника</p>
          ) : (
            <p className="font-medium">Добавлено участников: {added}</p>
          )}
          {unrecognized.length > 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              Должность не распознана (поставлен Junior minus): {unrecognized.join(', ')}
            </p>
          )}
          {skipped > 0 && <p className="opacity-70">Пропущено строк без ФИО: {skipped}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
