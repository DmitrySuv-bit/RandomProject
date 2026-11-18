import { describe, expect, it } from 'vitest'
import { generateTeamName } from './team-names'
import { DEFAULT_TEAM_NAME_DICTS, type TeamNameDicts } from './team-name-dictionaries'

const NAME_RE = /^[А-ЯЁ][а-яё]+ [а-яё]+$/

describe('generateTeamName', () => {
  it('даёт названия вида «Прилагательное животные»', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTeamName(new Set())).toMatch(NAME_RE)
    }
  })

  it('названия уникальны для 50 команд подряд', () => {
    const used = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const name = generateTeamName(used)
      expect(name).toBeTruthy()
      used.add(name!)
    }
    expect(used.size).toBe(50)
  })

  it('не повторяет переданные в used названия', () => {
    const dicts: TeamNameDicts = { adjectives: ['Дикие'], animals: ['выдры', 'совы'] }
    expect(generateTeamName(new Set(['Дикие выдры']), Math.random, dicts)).toBe('Дикие совы')
    expect(generateTeamName(new Set(['Дикие выдры', 'Дикие совы']), Math.random, dicts)).toBeNull()
  })

  it('детерминирован при фиксированном rng', () => {
    let seed = 7
    const rng = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const first = generateTeamName(new Set(), rng)
    seed = 7
    expect(generateTeamName(new Set(), rng)).toBe(first)
  })

  it('словари достаточно большие для 50 команд без вырождения', () => {
    const combos =
      DEFAULT_TEAM_NAME_DICTS.adjectives.length * DEFAULT_TEAM_NAME_DICTS.animals.length
    expect(combos).toBeGreaterThanOrEqual(2500)
  })
})
