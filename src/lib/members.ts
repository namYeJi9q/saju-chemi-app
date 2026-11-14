import type { Member } from './relations'
import { computeChart, type Person } from './saju'

/** 이름과 생년월일이 다 들어온 사람만 관계도에 올린다. */
export function toMembers(people: Person[]): Member[] {
  return people.flatMap((person) => {
    if (!person.name.trim() || !person.birthDate) return []
    const chart = computeChart(person)
    return chart ? [{ person: { ...person, name: person.name.trim() }, chart }] : []
  })
}
