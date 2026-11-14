import type { Person } from './saju'

const KEY = 'saju-graph:people:v1'

export function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is Person =>
        typeof p === 'object' && p !== null && typeof p.id === 'string' && typeof p.name === 'string',
    )
  } catch {
    return []
  }
}

export function savePeople(people: Person[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(people))
  } catch {
    // 저장소를 쓸 수 없는 환경(시크릿 모드 등)에서는 조용히 넘어간다
  }
}

export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export const SAMPLE_PEOPLE: Omit<Person, 'id'>[] = [
  { name: '서연', birthDate: '1998-04-17', birthTime: '08:30' },
  { name: '지훈', birthDate: '1993-11-05', birthTime: null },
  { name: '하린', birthDate: '2000-01-25', birthTime: '21:10' },
  { name: '도윤', birthDate: '1995-08-23', birthTime: null },
  { name: '민지', birthDate: '1996-10-19', birthTime: null },
  { name: '준호', birthDate: '1999-09-09', birthTime: null },
]
