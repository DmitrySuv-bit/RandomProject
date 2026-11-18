import { describe, expect, it } from 'vitest'
import { ADJECTIVES, ANIMALS, type Adjective } from './nickname-dictionaries'
import { combineNickname, generateNickname, type NicknameDicts } from './nicknames'

const NICKNAME_RE = /^[А-ЯЁ][а-яё]+ [а-яё]+$/

describe('словари', () => {
  it('формы прилагательных уникальны', () => {
    const forms = ADJECTIVES.flatMap((a) => [a.m, a.f])
    expect(new Set(forms).size).toBe(forms.length)
  })

  it('слова животных уникальны', () => {
    const words = ANIMALS.map((a) => a.word)
    expect(new Set(words).size).toBe(words.length)
  })

  it('в словарях достаточно комбинаций для 100 участников', () => {
    expect(ADJECTIVES.length * ANIMALS.length).toBeGreaterThanOrEqual(5000)
  })
})

describe('combineNickname', () => {
  it('согласует прилагательное с родом животного', () => {
    const wild: Adjective = { m: 'Дикий', f: 'Дикая' }
    expect(combineNickname(wild, { word: 'утка', gender: 'f' })).toBe('Дикая утка')
    expect(combineNickname(wild, { word: 'медведь', gender: 'm' })).toBe('Дикий медведь')
    expect(combineNickname({ m: 'Задумчивый', f: 'Задумчивая' }, { word: 'енот', gender: 'm' })).toBe(
      'Задумчивый енот',
    )
  })
})

describe('generateNickname', () => {
  it('возвращает прозвище в формате «Прилагательное животное»', () => {
    for (let i = 0; i < 300; i++) {
      expect(generateNickname([])).toMatch(NICKNAME_RE)
    }
  })

  it('берёт только реальные слова из словарей', () => {
    const adjectiveForms = new Set(ADJECTIVES.flatMap((a) => [a.m, a.f]))
    const animalWords = new Set(ANIMALS.map((a) => a.word))

    for (let i = 0; i < 300; i++) {
      const nickname = generateNickname([])
      const [adjectiveWord, animalWord] = nickname!.split(' ')
      expect(adjectiveForms.has(adjectiveWord!)).toBe(true)
      expect(animalWords.has(animalWord!)).toBe(true)
    }
  })

  it('согласует прилагательное с родом выпавшего животного', () => {
    for (let i = 0; i < 300; i++) {
      const nickname = generateNickname([])
      const [adjectiveWord, animalWord] = nickname!.split(' ')
      const animal = ANIMALS.find((a) => a.word === animalWord)!
      const adjective = ADJECTIVES.find((a) => a.m === adjectiveWord || a.f === adjectiveWord)!
      expect(adjective[animal.gender]).toBe(adjectiveWord)
    }
  })

  it('не повторяет уже занятые прозвища', () => {
    const used = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const nickname = generateNickname(used)
      expect(nickname).not.toBeNull()
      expect(used.has(nickname!)).toBe(false)
      used.add(nickname!)
    }
    expect(used.size).toBe(500)
  })

  it('возвращает null, когда свободных комбинаций нет', () => {
    const tiny: NicknameDicts = {
      adjectives: [{ m: 'Малый', f: 'Малая' }],
      animals: [
        { word: 'крот', gender: 'm' },
        { word: 'мышь', gender: 'f' },
      ],
    }
    expect(generateNickname(['Малый крот', 'Малая мышь'], tiny)).toBeNull()
  })

  it('находит последнюю свободную комбинацию полным перебором', () => {
    const tiny: NicknameDicts = {
      adjectives: [{ m: 'Малый', f: 'Малая' }],
      animals: [
        { word: 'крот', gender: 'm' },
        { word: 'мышь', gender: 'f' },
      ],
    }
    expect(generateNickname(['Малый крот'], tiny)).toBe('Малая мышь')
  })
})
