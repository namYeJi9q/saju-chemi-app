import { useEffect, useMemo, useState } from 'react'
import GraphView from '../components/GraphView'
import PeopleEditor, { MAX_PEOPLE } from '../components/PeopleEditor'
import { toMembers } from '../lib/members'
import { buildRelations } from '../lib/relations'
import type { Person } from '../lib/saju'
import { SAMPLE_PEOPLE, loadPeople, newId, savePeople } from '../lib/storage'

const blankPerson = (): Person => ({ id: newId(), name: '', birthDate: '', birthTime: null })

/** 혼자 쓰는 관계도. 입력값은 이 브라우저에만 저장한다. (기존 화면 그대로) */
export default function SoloPage() {
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = loadPeople()
    return saved.length ? saved : [blankPerson(), blankPerson()]
  })

  useEffect(() => savePeople(people), [people])
  useEffect(() => {
    document.title = '우리 사이 관계도'
  }, [])

  const members = useMemo(() => toMembers(people), [people])
  const relations = useMemo(() => buildRelations(members), [members])

  const addPerson = () => setPeople((ps) => (ps.length >= MAX_PEOPLE ? ps : [...ps, blankPerson()]))
  const loadSample = () => setPeople(SAMPLE_PEOPLE.map((p) => ({ ...p, id: newId() })))
  const clearAll = () => setPeople([blankPerson(), blankPerson()])

  const pending = people.length - members.length

  return (
    <>
      <header className="masthead">
        <h1>우리 사이 관계도</h1>
        <p className="lede">생년월일을 넣으면 일주(日柱)를 바탕으로 서로의 기운이 어떻게 흐르는지 별자리처럼 그려 줘요.</p>
      </header>

      <main className={members.length >= 2 ? 'layout has-graph' : 'layout'}>
        <section className="col-members" aria-labelledby="members-heading">
          <div className="section-head">
            <h2 id="members-heading">멤버</h2>
            <div className="section-actions">
              <button type="button" className="text-btn" onClick={loadSample}>
                예시 멤버 불러오기
              </button>
              <button type="button" className="text-btn" onClick={clearAll}>
                모두 지우기
              </button>
            </div>
          </div>
          <PeopleEditor people={people} onChange={setPeople} onAdd={addPerson} />
        </section>

        <GraphView
          members={members}
          relations={relations}
          emptyHint={
            <>
              <p>이름과 생년월일을 두 명 이상 넣으면 관계선이 그려져요.</p>
              {members.length === 0 && (
                <button type="button" className="text-btn" onClick={loadSample}>
                  예시 멤버로 먼저 보기
                </button>
              )}
            </>
          }
          footnote={
            pending > 0 &&
            members.length > 0 && <p className="hint">이름이나 생년월일이 비어 있는 멤버 {pending}명은 아직 관계도에 없어요.</p>
          }
        />
      </main>

      <footer className="colophon">
        <p>재미로 보는 명리 풀이예요. 입력한 정보는 서버로 보내지 않고 이 브라우저에만 저장돼요.</p>
      </footer>
    </>
  )
}
