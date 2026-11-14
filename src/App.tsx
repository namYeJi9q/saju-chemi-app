import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RelationGraph from './components/RelationGraph'
import DetailPanel from './components/DetailPanel'
import PeopleEditor, { MAX_PEOPLE } from './components/PeopleEditor'
import { buildRelations, type Member } from './lib/relations'
import { computeChart, type Person } from './lib/saju'
import type { Selection } from './lib/selection'
import { SAMPLE_PEOPLE, loadPeople, newId, savePeople } from './lib/storage'
import { downloadSvgAsPng } from './lib/exportImage'
import './App.css'

const blankPerson = (): Person => ({ id: newId(), name: '', birthDate: '', birthTime: null })

export default function App() {
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = loadPeople()
    return saved.length ? saved : [blankPerson(), blankPerson()]
  })
  const [selection, setSelection] = useState<Selection>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => savePeople(people), [people])

  const members = useMemo<Member[]>(
    () =>
      people.flatMap((person) => {
        if (!person.name.trim() || !person.birthDate) return []
        const chart = computeChart(person)
        return chart ? [{ person: { ...person, name: person.name.trim() }, chart }] : []
      }),
    [people],
  )
  const relations = useMemo(() => buildRelations(members), [members])

  // 지워졌거나 아직 완성되지 않은 사람을 가리키는 선택은 풀어 준다
  const validSelection: Selection = useMemo(() => {
    if (!selection) return null
    if (selection.type === 'node') return members.some((m) => m.person.id === selection.id) ? selection : null
    return relations.some((r) => r.key === selection.key) ? selection : null
  }, [selection, members, relations])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelection(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 모바일에서는 바텀시트가 그래프를 가리지 않도록 그래프를 화면 위쪽으로 올려 준다
  const select = useCallback((s: Selection) => {
    setSelection(s)
    if (!s || !frameRef.current) return
    if (!window.matchMedia('(max-width: 767px)').matches) return
    const top = frameRef.current.getBoundingClientRect().top
    if (Math.abs(top - 12) > 24) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: top - 12, behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [])

  const addPerson = () => setPeople((ps) => (ps.length >= MAX_PEOPLE ? ps : [...ps, blankPerson()]))
  const loadSample = () => {
    setSelection(null)
    setPeople(SAMPLE_PEOPLE.map((p) => ({ ...p, id: newId() })))
  }
  const clearAll = () => {
    setSelection(null)
    setPeople([blankPerson(), blankPerson()])
  }

  const exportPng = useCallback(async () => {
    if (!svgRef.current) return
    setExportError(null)
    try {
      await downloadSvgAsPng(svgRef.current, '우리-사이-관계도.png')
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '이미지를 만들지 못했어요')
    }
  }, [])

  const pending = people.length - members.length

  return (
    <div className="app">
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

        <section className="col-graph" aria-label="관계도">
          <div className="graph-frame" ref={frameRef}>
            {members.length > 0 && (
              <RelationGraph
                members={members}
                relations={relations}
                selection={validSelection}
                onSelect={select}
                svgRef={svgRef}
              />
            )}
            {members.length < 2 && (
              <div className={members.length === 1 ? 'graph-empty is-low' : 'graph-empty'}>
                <p>이름과 생년월일을 두 명 이상 넣으면 관계선이 그려져요.</p>
                {members.length === 0 && (
                  <button type="button" className="text-btn" onClick={loadSample}>
                    예시 멤버로 먼저 보기
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="graph-foot">
            <ul className="legend" aria-label="선 모양 안내">
              <li>
                <svg width="36" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="34,5 27,1.5 27,8.5" fill="currentColor" />
                </svg>
                챙겨줌 (상생)
              </li>
              <li>
                <svg width="36" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
                  <polygon points="34,5 27,1.5 27,8.5" fill="currentColor" />
                </svg>
                다듬어줌 (상극)
              </li>
              <li>
                <svg width="36" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2="34" y2="5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="1.5 4" strokeLinecap="round" />
                </svg>
                같은 결
              </li>
              <li>
                <svg width="12" height="10" aria-hidden="true">
                  <circle cx="6" cy="5" r="3.5" fill="var(--gold)" />
                </svg>
                특별한 인연
              </li>
            </ul>
            {members.length >= 2 && (
              <button type="button" className="text-btn" onClick={exportPng}>
                이미지로 저장
              </button>
            )}
          </div>
          {exportError && <p className="error">{exportError}</p>}
          {pending > 0 && members.length > 0 && (
            <p className="hint">이름이나 생년월일이 비어 있는 멤버 {pending}명은 아직 관계도에 없어요.</p>
          )}
        </section>

        <aside className={validSelection ? 'col-detail is-open' : 'col-detail'} aria-live="polite">
          {validSelection && (
            <button type="button" className="sheet-close" onClick={() => setSelection(null)}>
              닫기
            </button>
          )}
          <DetailPanel members={members} relations={relations} selection={validSelection} onSelect={select} />
        </aside>
      </main>

      <footer className="colophon">
        <p>재미로 보는 명리 풀이예요. 입력한 정보는 서버로 보내지 않고 이 브라우저에만 저장돼요.</p>
      </footer>
    </div>
  )
}
