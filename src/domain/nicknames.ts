import {
  ADJECTIVES,
  ANIMALS,
  type Adjective,
  type Animal,
} from './nickname-dictionaries'

export interface NicknameDicts {
  adjectives: readonly Adjective[]
  animals: readonly Animal[]
}

export const DEFAULT_NICKNAME_DICTS: NicknameDicts = {
  adjectives: ADJECTIVES,
  animals: ANIMALS,
}

/** Собирает прозвище с согласованием прилагательного по роду животного */
export function combineNickname(adjective: Adjective, animal: Animal): string {
  return `${animal.gender === 'f' ? adjective.f : adjective.m} ${animal.word}`
}

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

/**
 * Случайное прозвище, не входящее в `used`.
 * Возвращает null, только если свободных комбинаций не осталось.
 */
export function generateNickname(
  used: Iterable<string>,
  dicts: NicknameDicts = DEFAULT_NICKNAME_DICTS,
): string | null {
  const usedSet = new Set(used)

  // Быстрые случайные попытки: при частично занятом пространстве почти сразу успех
  for (let attempt = 0; attempt < 200; attempt++) {
    const nickname = combineNickname(randomOf(dicts.adjectives), randomOf(dicts.animals))
    if (!usedSet.has(nickname)) return nickname
  }

  // Свободных мало — полный перебор оставшихся комбинаций
  const free: string[] = []
  for (const adjective of dicts.adjectives) {
    for (const animal of dicts.animals) {
      const nickname = combineNickname(adjective, animal)
      if (!usedSet.has(nickname)) free.push(nickname)
    }
  }
  if (free.length === 0) return null
  return randomOf(free)
}
