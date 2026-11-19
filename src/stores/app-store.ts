import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FALLBACK_POSITION, parseParticipantsCsv } from '@/domain/csv'
import { uid } from '@/domain/id'
import { generateNickname } from '@/domain/nicknames'
import {
  DEFAULT_WEIGHTS,
  isLabelTaken,
  shortFromLabel,
  weightOfPosition,
  type BuiltinPosition,
  type CustomPosition,
} from '@/domain/positions'
import { generateTeamName } from '@/domain/team-names'
import { teamDisplayName } from '@/domain/teams'
import type {
  DistributionResult,
  Participant,
  ParticipantInput,
  Rule,
  RuleInput,
  Settings,
  SizingMode,
} from '@/domain/types'

export const DEFAULT_SETTINGS: Settings = {
  teamCount: 2,
  teamNames: [],
  sizingMode: 'even',
  minSize: 3,
  maxSize: 10,
  weights: { ...DEFAULT_WEIGHTS },
  customPositions: [],
  rules: [],
}

/* Границы значений настроек */
const TEAM_COUNT_LIMITS = { min: 1, max: 50 } as const
const SIZE_LIMITS = { min: 1, max: 99 } as const
const WEIGHT_LIMITS = { min: 0, max: 99 } as const

const clamp = (value: number, limits: { min: number; max: number }): number =>
  Math.min(limits.max, Math.max(limits.min, Math.round(value)))

/** Длина массива названий должна совпадать с количеством команд: дополняем и обрезаем */
function normalizeTeamNames(names: readonly string[], teamCount: number): string[] {
  return Array.from({ length: teamCount }, (_, i) => names[i] ?? '')
}

/** Итог импорта CSV для баннера на странице участников */
export interface CsvImportSummary {
  added: number
  /** Названия рангов, созданных из нераспознанных значений в файле */
  createdRanks: string[]
  /** Непустые строки без ФИО */
  skipped: number
}

interface AppState {
  participants: Participant[]
  settings: Settings
  result: DistributionResult | null

  /* Участники */
  /** Добавляет участника, возвращает id (или undefined для пустого имени) */
  addParticipant: (input: ParticipantInput) => string | undefined
  /** Массовое добавление (импорт CSV), возвращает число добавленных */
  addParticipants: (items: readonly ParticipantInput[]) => number
  /**
   * Импорт участников из CSV: нераспознанные ранги становятся пользовательскими
   * с весом Junior minus, участники получают уже созданные ранги
   */
  importParticipantsCsv: (text: string) => CsvImportSummary
  updateParticipant: (
    id: string,
    patch: Partial<Pick<Participant, 'fullName' | 'position' | 'nickname'>>,
  ) => void
  /** Удаляет участника вместе со всеми правилами, где он участвует */
  removeParticipant: (id: string) => void
  /** Новое случайное прозвище для участника (уникальное среди остальных) */
  regenerateNickname: (id: string) => void
  /** Новые прозвища для всех участников сразу */
  regenerateAllNicknames: () => void

  /* Настройки */
  setTeamCount: (count: number) => void
  /** Задаёт название команды по индексу (пустая строка — сгенерированное) */
  setTeamName: (index: number, name: string) => void
  /** Перегенерирует названия всех команд (кастомные тоже заменяются) */
  generateTeamNames: () => void
  setSizingMode: (mode: SizingMode) => void
  setSizeLimits: (min: number, max: number) => void
  setWeight: (position: BuiltinPosition, weight: number) => void
  /** Добавляет пользовательский ранг, возвращает id (undefined — пустое или занятое название) */
  addCustomPosition: (label: string, weight: number) => string | undefined
  /** Меняет вес пользовательского ранга */
  setCustomPositionWeight: (id: string, weight: number) => void
  /** Удаляет пользовательский ранг (false — используется участниками или правилами) */
  removeCustomPosition: (id: string) => boolean

  /* Правила */
  /** Добавляет правило, возвращает id (undefined — некорректный ввод или дубль) */
  addRule: (input: RuleInput) => string | undefined
  removeRule: (id: string) => void
  toggleRule: (id: string) => void

  /* Результат распределения */
  setResult: (result: DistributionResult) => void
  clearResult: () => void
  /** Ручной перенос участника в другую команду (баланс пересчитывается на лету) */
  moveParticipant: (participantId: string, toTeamId: string) => void
  /** Переименование команды в готовом результате (запоминается в настройках) */
  renameTeam: (teamId: string, name: string) => void

  /** Полный сброс данных к дефолтам */
  resetAll: () => void
}

/** Ссылается ли правило на участника */
function ruleUsesParticipant(rule: Rule, participantId: string): boolean {
  return (
    (rule.type === 'together' || rule.type === 'separate') &&
    (rule.a === participantId || rule.b === participantId)
  )
}

/** Занятые прозвища участников (можно исключить одного) */
function collectNicknames(state: Pick<AppState, 'participants'>, excludeId?: string): Set<string> {
  return new Set(
    state.participants
      .filter((p) => p.id !== excludeId && p.nickname !== '')
      .map((p) => p.nickname),
  )
}

/** Название команды по умолчанию: кастомное или сгенерированное «Дикие выдры» */
function defaultTeamName(
  state: Pick<AppState, 'result'>,
  index: number,
  custom: string,
): string {
  const trimmed = custom.trim()
  return trimmed || generateTeamName(resultTeamNames(state, index)) || teamDisplayName(trimmed, index)
}

/** Занятые названия команд результата (можно исключить одну по индексу) */
function resultTeamNames(state: Pick<AppState, 'result'>, excludeIndex?: number): Set<string> {
  const names = new Set<string>()
  state.result?.teams.forEach((team, i) => {
    if (i !== excludeIndex && team.name) names.add(team.name)
  })
  return names
}

/** Проверка на дубль (пары симметричны) */
function isDuplicateRule(rules: readonly Rule[], input: RuleInput): boolean {
  return rules.some((rule) => {
    if (rule.type !== input.type) return false
    if (rule.type === 'level-cap' && input.type === 'level-cap') {
      return rule.position === input.position && rule.maxPerTeam === input.maxPerTeam
    }
    if (
      (rule.type === 'together' || rule.type === 'separate') &&
      (input.type === 'together' || input.type === 'separate')
    ) {
      return (rule.a === input.a && rule.b === input.b) || (rule.a === input.b && rule.b === input.a)
    }
    return false
  })
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      participants: [],
      settings: structuredClone(DEFAULT_SETTINGS),
      result: null,

      addParticipant: ({ fullName, position, nickname }) => {
        const name = fullName.trim()
        if (!name) return undefined
        // Прозвище: переданное вручную или автоматически сгенерированное
        const nicknameValue = nickname?.trim() || generateNickname(collectNicknames(get())) || ''
        const participant: Participant = {
          id: uid(),
          fullName: name,
          position,
          nickname: nicknameValue,
        }
        set((state) => ({ participants: [...state.participants, participant] }))
        return participant.id
      },

      addParticipants: (items) => {
        const added: Participant[] = []
        const used = collectNicknames(get())
        for (const item of items) {
          const name = item.fullName.trim()
          if (!name) continue
          const nickname = item.nickname?.trim() || generateNickname(used) || ''
          if (nickname) used.add(nickname)
          added.push({
            id: uid(),
            fullName: name,
            position: item.position,
            nickname,
          })
        }
        set((state) => ({ participants: [...state.participants, ...added] }))
        return added.length
      },

      importParticipantsCsv: (text) => {
        const state = get()
        let parsed = parseParticipantsCsv(text, state.settings.customPositions)
        const createdRanks: string[] = []
        if (parsed.unrecognizedRanks.length > 0) {
          // Нераспознанные ранги — пользовательские: вес из файла,
          // а без колонки «Вес» — вес дефолтного ранга (Junior minus)
          const fallbackWeight = weightOfPosition(FALLBACK_POSITION, state.settings)
          for (const rank of parsed.unrecognizedRanks) {
            if (get().addCustomPosition(rank.label, rank.weight ?? fallbackWeight)) {
              createdRanks.push(rank.label)
            }
          }
          // Разбираем файл заново — участники получают созданные ранги, а не дефолт
          parsed = parseParticipantsCsv(text, get().settings.customPositions)
        }
        const added = get().addParticipants(parsed.rows)
        return { added, createdRanks, skipped: parsed.skippedLines }
      },

      updateParticipant: (id, patch) => {
        set((state) => ({
          participants: state.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }))
      },

      removeParticipant: (id) => {
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
          settings: {
            ...state.settings,
            rules: state.settings.rules.filter((rule) => !ruleUsesParticipant(rule, id)),
          },
          result: state.result
            ? {
                ...state.result,
                teams: state.result.teams.map((team) => ({
                  ...team,
                  memberIds: team.memberIds.filter((memberId) => memberId !== id),
                })),
              }
            : null,
        }))
      },

      regenerateNickname: (id) => {
        set((state) => {
          if (!state.participants.some((p) => p.id === id)) return state
          const nickname = generateNickname(collectNicknames(state, id))
          if (!nickname) return state
          return {
            participants: state.participants.map((p) => (p.id === id ? { ...p, nickname } : p)),
          }
        })
      },

      regenerateAllNicknames: () => {
        set((state) => {
          if (state.participants.length === 0) return state
          // Все прозвища меняются одновременно, поэтому «занятыми» считаем только новые
          const used = new Set<string>()
          const participants = state.participants.map((p) => {
            const nickname = generateNickname(used) || p.nickname
            if (nickname) used.add(nickname)
            return { ...p, nickname }
          })
          return { participants }
        })
      },

      setTeamCount: (count) => {
        const teamCount = clamp(count, TEAM_COUNT_LIMITS)
        set((state) => ({
          settings: {
            ...state.settings,
            teamCount,
            teamNames: normalizeTeamNames(state.settings.teamNames, teamCount),
          },
        }))
      },

      setTeamName: (index, name) => {
        if (index < 0 || index >= TEAM_COUNT_LIMITS.max) return
        set((state) => {
          // массив дополняем до размера, покрывающего и индекс, и teamCount
          const teamNames = normalizeTeamNames(
            Object.assign([...state.settings.teamNames], { [index]: name }),
            Math.max(state.settings.teamCount, index + 1),
          )
          return {
            settings: { ...state.settings, teamNames },
            // готовой команде название меняем на лету; пустое — сгенерированное
            result:
              state.result && index < state.result.teams.length
                ? {
                    ...state.result,
                    teams: state.result.teams.map((team, i) =>
                      i === index ? { ...team, name: defaultTeamName(state, index, name) } : team,
                    ),
                  }
                : state.result,
          }
        })
      },

      /** Перегенерирует названия всех команд, включая кастомные */
      generateTeamNames: () => {
        set((state) => {
          const used = new Set<string>()
          const after: string[] = []
          for (let i = 0; i < state.settings.teamCount; i++) {
            const generated = generateTeamName(used) ?? ''
            if (generated) used.add(generated)
            after.push(generated)
          }
          return {
            settings: { ...state.settings, teamNames: after },
            result: state.result
              ? {
                  ...state.result,
                  teams: state.result.teams.map((team, i) => {
                    const next = after[i]
                    return next ? { ...team, name: next } : team
                  }),
                }
              : state.result,
          }
        })
      },

      setSizingMode: (mode) => {
        set((state) => ({ settings: { ...state.settings, sizingMode: mode } }))
      },

      setSizeLimits: (min, max) => {
        const lo = clamp(Math.min(min, max), SIZE_LIMITS)
        const hi = clamp(Math.max(min, max), SIZE_LIMITS)
        set((state) => ({ settings: { ...state.settings, minSize: lo, maxSize: hi } }))
      },

      setWeight: (position, weight) => {
        set((state) => ({
          settings: {
            ...state.settings,
            weights: { ...state.settings.weights, [position]: clamp(weight, WEIGHT_LIMITS) },
          },
        }))
      },

      addCustomPosition: (label, weight) => {
        const name = label.trim()
        if (!name || isLabelTaken(name, get().settings)) return undefined
        const position: CustomPosition = {
          id: uid(),
          label: name,
          short: shortFromLabel(name),
          weight: clamp(weight, WEIGHT_LIMITS),
        }
        set((state) => ({
          settings: { ...state.settings, customPositions: [...state.settings.customPositions, position] },
        }))
        return position.id
      },

      setCustomPositionWeight: (id, weight) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customPositions: state.settings.customPositions.map((p) =>
              p.id === id ? { ...p, weight: clamp(weight, WEIGHT_LIMITS) } : p,
            ),
          },
        }))
      },

      removeCustomPosition: (id) => {
        const state = get()
        const usedByParticipants = state.participants.some((p) => p.position === id)
        const usedByRules = state.settings.rules.some(
          (rule) => rule.type === 'level-cap' && rule.position === id,
        )
        if (usedByParticipants || usedByRules) return false
        set((current) => ({
          settings: {
            ...current.settings,
            customPositions: current.settings.customPositions.filter((p) => p.id !== id),
          },
        }))
        return true
      },

      addRule: (input) => {
        const state = get()
        if ((input.type === 'together' || input.type === 'separate') && input.a === input.b) {
          return undefined
        }
        if (input.type === 'level-cap' && input.maxPerTeam < 1) return undefined
        if (isDuplicateRule(state.settings.rules, input)) return undefined
        const rule: Rule = { ...input, id: uid(), enabled: true }
        set({ settings: { ...state.settings, rules: [...state.settings.rules, rule] } })
        return rule.id
      },

      removeRule: (id) => {
        set((state) => ({
          settings: { ...state.settings, rules: state.settings.rules.filter((r) => r.id !== id) },
        }))
      },

      toggleRule: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: state.settings.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
          },
        }))
      },

      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),

      moveParticipant: (participantId, toTeamId) => {
        set((state) => {
          if (!state.result) return state
          const targetExists = state.result.teams.some((team) => team.id === toTeamId)
          const participantAssigned = state.result.teams.some((team) =>
            team.memberIds.includes(participantId),
          )
          if (!targetExists || !participantAssigned) return state
          return {
            ...state,
            result: {
              ...state.result,
              teams: state.result.teams.map((team) => {
                const without = team.memberIds.filter((id) => id !== participantId)
                return team.id === toTeamId
                  ? { ...team, memberIds: [...without, participantId] }
                  : { ...team, memberIds: without }
              }),
            },
          }
        })
      },

      renameTeam: (teamId, name) => {
        set((state) => {
          if (!state.result) return state
          const index = state.result.teams.findIndex((team) => team.id === teamId)
          if (index === -1) return state
          const trimmed = name.trim()
          return {
            settings: {
              ...state.settings,
              teamNames: normalizeTeamNames(
                Object.assign([...state.settings.teamNames], { [index]: trimmed }),
                Math.max(state.settings.teamCount, index + 1),
              ),
            },
            result: {
              ...state.result,
              teams: state.result.teams.map((team) =>
                team.id === teamId ? { ...team, name: defaultTeamName(state, index, trimmed) } : team,
              ),
            },
          }
        })
      },

      resetAll: () =>
        set({
          participants: [],
          settings: structuredClone(DEFAULT_SETTINGS),
          result: null,
        }),
    }),
    {
      name: 'random-team-data',
      version: 1,
      /** Старые сохранённые настройки могут не знать о новых полях (teamNames) —
       *  сливаем их с дефолтами, а не заменяем целиком */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...saved,
          settings: {
            ...current.settings,
            ...saved.settings,
            teamNames: saved.settings?.teamNames ?? current.settings.teamNames,
          },
        }
      },
    },
  ),
)
