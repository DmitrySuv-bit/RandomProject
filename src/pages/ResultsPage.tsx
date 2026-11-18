import { useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { computeReport } from '@/distribution/report'
import { distribute } from '@/distribution/distribute'
import { validateDistributionInput, type DistributionIssue } from '@/distribution/validate'
import { csvFileName, downloadCsv, teamsToCsv } from '@/domain/export'
import { useAppStore } from '@/stores/app-store'
import { useUiStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/Button'
import { ReportPanel } from '@/components/results/ReportPanel'
import { TeamCard } from '@/components/results/TeamCard'

export function ResultsPage() {
  const participants = useAppStore((s) => s.participants)
  const settings = useAppStore((s) => s.settings)
  const result = useAppStore((s) => s.result)
  const setResult = useAppStore((s) => s.setResult)
  const moveParticipant = useAppStore((s) => s.moveParticipant)
  const renameTeam = useAppStore((s) => s.renameTeam)
  const setActiveTab = useUiStore((s) => s.setActiveTab)

  const issues = useMemo(
    () => validateDistributionInput(participants, settings),
    [participants, settings],
  )

  // Отчёт всегда пересчитывается от текущих команд — ручные переносы обновляют его мгновенно
  const report = useMemo(
    () => (result ? computeReport(result.teams, participants, settings) : null),
    [result, participants, settings],
  )

  const byId = useMemo(() => new Map(participants.map((p) => [p.id, p] as const)), [participants])

  const handleDistribute = () => {
    if (issues.length > 0) return
    const next = distribute(participants, settings)
    setResult(next)
  }

  const handleExport = () => {
    if (!result) return
    downloadCsv(teamsToCsv(result, participants, settings), csvFileName())
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const targetTeamId = event.over?.id
    if (targetTeamId === undefined || targetTeamId === null) return
    moveParticipant(String(event.active.id), String(targetTeamId))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Результат</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={handleExport} disabled={!result}>
            💾 Экспорт CSV
          </Button>
          <Button variant="primary" onClick={handleDistribute} disabled={issues.length > 0}>
            🎲 {result ? 'Перераспределить' : 'Распределить'}
          </Button>
        </div>
      </div>

      {issues.length > 0 && <IssuesBlock issues={issues} />}

      {result && report ? (
        <>
          <ReportPanel report={report} teams={result.teams} onRenameTeam={renameTeam} />

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.teams.map((team, index) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  index={index}
                  balance={report.balance.find((b) => b.teamId === team.id)}
                  participantsById={byId}
                  weights={settings.weights}
                  onRename={(name) => renameTeam(team.id, name)}
                />
              ))}
            </div>
          </DndContext>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500">
            Перетащите участника в другую команду — баланс и отчёт пересчитаются мгновенно
          </p>
        </>
      ) : (
        <EmptyState hasParticipants={participants.length > 0} onGoParticipants={() => setActiveTab('participants')} />
      )}
    </div>
  )
}

function IssuesBlock({ issues }: { issues: readonly DistributionIssue[] }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
      <p className="font-medium">Распределение сейчас невозможно:</p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5">
        {issues.map((issue) => (
          <li key={issue.message}>{issue.message}</li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs opacity-70">Исправьте настройки на вкладке «Настройки».</p>
    </div>
  )
}

function EmptyState({
  hasParticipants,
  onGoParticipants,
}: {
  hasParticipants: boolean
  onGoParticipants: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="text-5xl" aria-hidden="true">
        🎲
      </div>
      {hasParticipants ? (
        <>
          <p className="mt-4 text-lg font-medium">Всё готово к жеребьёвке</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Нажмите «Распределить» — команды соберутся случайно и максимально сбалансированно.
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-lg font-medium">Пока некого распределять</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Сначала добавьте участников на вкладке «Участники».
          </p>
          <Button className="mt-4" onClick={onGoParticipants}>
            Перейти к участникам
          </Button>
        </>
      )}
    </div>
  )
}
