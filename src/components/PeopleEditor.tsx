import type { Person } from '../lib/saju'
import { STEMS, computeChart, pillarKo } from '../lib/saju'
import { ELEMENT_COLOR } from '../lib/theme'

export const MAX_PEOPLE = 10

interface Props {
  people: Person[]
  onChange: (people: Person[]) => void
  onAdd: () => void
}

const today = new Date().toISOString().slice(0, 10)

export default function PeopleEditor({ people, onChange, onAdd }: Props) {
  const update = (id: string, patch: Partial<Person>) =>
    onChange(people.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => onChange(people.filter((p) => p.id !== id))

  return (
    <div className="editor">
      <ul className="people">
        {people.map((p, i) => {
          const chart = p.birthDate ? computeChart(p) : null
          const stem = chart ? STEMS[chart.dayStem] : null
          const col = stem ? ELEMENT_COLOR[stem.element] : null
          const label = p.name.trim() || `${i + 1}번째 멤버`
          return (
            <li key={p.id} className="person">
              <div className="person-head">
                <input
                  className="name-input"
                  type="text"
                  value={p.name}
                  maxLength={12}
                  placeholder="이름"
                  aria-label={`${i + 1}번째 멤버 이름`}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                />
                {chart && col && (
                  <span className="person-pillar" title={`${pillarKo(chart.day)} 일주`}>
                    <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
                    {chart.day}
                  </span>
                )}
                <button type="button" className="remove" onClick={() => remove(p.id)} aria-label={`${label} 삭제`}>
                  ×
                </button>
              </div>
              <div className="person-fields">
                <label>
                  <span>생년월일 (양력)</span>
                  <input
                    type="date"
                    value={p.birthDate}
                    min="1900-01-01"
                    max={today}
                    onChange={(e) => update(p.id, { birthDate: e.target.value })}
                  />
                </label>
                <label>
                  <span>태어난 시간</span>
                  <input
                    type="time"
                    value={p.birthTime ?? ''}
                    disabled={p.birthTime === null}
                    onChange={(e) => update(p.id, { birthTime: e.target.value || '' })}
                  />
                </label>
                <label className="unknown">
                  <input
                    type="checkbox"
                    checked={p.birthTime === null}
                    onChange={(e) => update(p.id, { birthTime: e.target.checked ? null : '' })}
                  />
                  <span>시간 모름</span>
                </label>
              </div>
            </li>
          )
        })}
      </ul>
      <button type="button" className="add" onClick={onAdd} disabled={people.length >= MAX_PEOPLE}>
        {people.length >= MAX_PEOPLE ? `최대 ${MAX_PEOPLE}명까지 넣을 수 있어요` : '멤버 추가'}
      </button>
    </div>
  )
}
