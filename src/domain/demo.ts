import type { Position } from './positions'
import type { ParticipantInput } from './types'

/** Демо-список для быстрого опробования интерфейса */
const DEMO_PEOPLE: ReadonlyArray<readonly [string, Position]> = [
  ['Иванов Иван Иванович', 'junior-minus'],
  ['Петров Пётр Петрович', 'junior-plus'],
  ['Сидоров Сидор Сидорович', 'junior-plus'],
  ['Кузнецова Анна Сергеевна', 'junior-plus'],
  ['Смирнов Алексей Дмитриевич', 'middle-minus'],
  ['Васильева Мария Андреевна', 'middle-minus'],
  ['Попов Николай Иванович', 'middle-minus'],
  ['Соколова Екатерина Павловна', 'middle-minus'],
  ['Лебедев Дмитрий Романович', 'middle-plus'],
  ['Козлова Ольга Викторовна', 'middle-plus'],
  ['Новиков Артём Олегович', 'middle-plus'],
  ['Морозова Дарья Игоревна', 'middle-plus'],
  ['Волков Сергей Александрович', 'middle-plus'],
  ['Зайцева Полина Максимовна', 'middle-plus'],
  ['Павлов Игорь Валерьевич', 'senior-minus'],
  ['Семёнова Алина Руслановна', 'senior-minus'],
  ['Голубев Максим Кириллович', 'senior-minus'],
  ['Виноградова Ксения Львовна', 'senior-plus'],
  ['Богданов Станислав Янович', 'senior-plus'],
  ['Воробьёва Валерия Артёмовна', 'junior-minus'],
  ['Фёдоров Роман Григорьевич', 'middle-minus'],
  ['Михайлова Юлия Николаевна', 'middle-plus'],
  ['Беляев Антон Егорович', 'junior-plus'],
  ['Тарасова Вера Степановна', 'senior-minus'],
]

export function makeDemoParticipants(): ParticipantInput[] {
  return DEMO_PEOPLE.map(([fullName, position]) => ({ fullName, position }))
}
