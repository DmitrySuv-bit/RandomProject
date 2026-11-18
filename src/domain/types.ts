import type { Position } from './positions'

/** Участник */
export interface Participant {
  id: string
  /** ФИО */
  fullName: string
  /** Должность */
  position: Position
  /** Прозвище-животное, например «Задумчивый медведь» */
  nickname: string
}

/** Данные для добавления участника */
export interface ParticipantInput {
  fullName: string
  position: Position
  nickname?: string
}

/** Режим определения размера команд */
export type SizingMode = 'even' | 'limits'

interface RuleBase {
  id: string
  /** Правило можно включать и выключать, не удаляя */
  enabled: boolean
}

/** Правило: двое должны оказаться в одной команде */
export interface TogetherRule extends RuleBase {
  type: 'together'
  a: string
  b: string
}

/** Правило: двое должны оказаться в разных командах */
export interface SeparateRule extends RuleBase {
  type: 'separate'
  a: string
  b: string
}

/** Правило: не больше N участников указанной должности в команде */
export interface LevelCapRule extends RuleBase {
  type: 'level-cap'
  position: Position
  maxPerTeam: number
}

export type Rule = TogetherRule | SeparateRule | LevelCapRule

/** Данные для создания правила (id и enabled проставляет стор) */
export type RuleInput =
  | Omit<TogetherRule, 'id' | 'enabled'>
  | Omit<SeparateRule, 'id' | 'enabled'>
  | Omit<LevelCapRule, 'id' | 'enabled'>

/** Настройки распределения */
export interface Settings {
  /** Количество команд */
  teamCount: number
  /** Пользовательские названия команд по индексу; пустая строка — «Команда N» */
  teamNames: string[]
  /** «Поровну» (разница ≤ 1 человека) или границы min/max */
  sizingMode: SizingMode
  minSize: number
  maxSize: number
  /** Настраиваемые веса должностей */
  weights: Record<Position, number>
  /** Правила совместного/раздельного размещения */
  rules: Rule[]
}

/** Команда в результате распределения */
export interface Team {
  id: string
  name: string
  memberIds: string[]
}

/** Результат проверки одного правила */
export interface RuleResult {
  ruleId: string
  /** Человекочитаемое описание правила (снапшот на момент распределения) */
  label: string
  ok: boolean
  message: string
}

/** Баланс одной команды */
export interface TeamBalance {
  teamId: string
  count: number
  totalWeight: number
  avgWeight: number
}

/** Отчёт по распределению */
export interface Report {
  ruleResults: RuleResult[]
  balance: TeamBalance[]
  /** Разброс сумм весов между командами (max − min) */
  spread: number
}

/** Результат распределения */
export interface DistributionResult {
  teams: Team[]
  report: Report
  createdAt: number
}
