import { DEFAULT_TEAM_NAME_DICTS, type TeamNameDicts } from './team-name-dictionaries'

function randomOf<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)] as T
}

/**
 * Случайное название команды («Дикие выдры»), не входящее в `used`.
 * rng передаётся для детерминированности в distribute (seed), по умолчанию Math.random.
 * Возвращает null, только если свободных комбинаций не осталось.
 */
export function generateTeamName(
  used: Iterable<string>,
  rng: () => number = Math.random,
  dicts: TeamNameDicts = DEFAULT_TEAM_NAME_DICTS,
): string | null {
  const usedSet = new Set(used)

  // Быстрые случайные попытки: при частично занятом пространстве почти сразу успех
  for (let attempt = 0; attempt < 200; attempt++) {
    const name = `${randomOf(dicts.adjectives, rng)} ${randomOf(dicts.animals, rng)}`
    if (!usedSet.has(name)) return name
  }

  // Свободных мало — полный перебор оставшихся комбинаций
  const free: string[] = []
  for (const adjective of dicts.adjectives) {
    for (const animal of dicts.animals) {
      const name = `${adjective} ${animal}`
      if (!usedSet.has(name)) free.push(name)
    }
  }
  if (free.length === 0) return null
  return randomOf(free, rng)
}
