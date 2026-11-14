import { useEffect, useMemo } from 'react'
import AppLink from '../components/AppLink'
import GraphView from '../components/GraphView'
import { toMembers } from '../lib/members'
import { buildRelations } from '../lib/relations'
import { STEMS } from '../lib/saju'
import { SAMPLE_PEOPLE } from '../lib/storage'
import { ELEMENT_COLOR } from '../lib/theme'
import { useAnonymousUser, type AnonymousUser } from '../lib/useAnonymousUser'

interface Props {
  code: string
}

/** 개발 확인용 연결 상태 안내. 4단계에서 실제 멤버가 붙으면 없앤다. */
function connectionNotice(user: AnonymousUser): string {
  if (user.status === 'loading') return '서버에 연결하는 중이에요…'
  if (user.status === 'error') return user.message
  return `서버에 연결됐어요. 이 브라우저의 번호표는 ${user.uid.slice(0, 6)}…로 시작해요. 멤버는 아직 예시예요.`
}

/**
 * 공유 관계도 화면.
 * 2단계: 들어오면 익명 로그인으로 번호표를 받는다. 멤버는 아직 예시. (4단계에서 실제 멤버로 바뀜)
 */
export default function SharedPage({ code }: Props) {
  const user = useAnonymousUser()
  const members = useMemo(() => toMembers(SAMPLE_PEOPLE.map((p, i) => ({ ...p, id: `sample-${i}` }))), [])
  const relations = useMemo(() => buildRelations(members), [members])

  useEffect(() => {
    document.title = '공유 관계도 | 우리 사이 관계도'
  }, [])

  return (
    <>
      <header className="masthead">
        <AppLink to="/" className="crumb">
          우리 사이 관계도
        </AppLink>
        <h1>공유 관계도</h1>
        <p className="lede">
          링크를 받은 친구들이 직접 들어와 채우는 관계도예요. 공유 코드 <span className="code">{code}</span>
        </p>
      </header>

      <p className={user.status === 'error' ? 'notice is-error' : 'notice'} role="status" data-auth={user.status}>
        {connectionNotice(user)}
      </p>

      <main className="layout has-graph">
        <section className="col-members" aria-labelledby="members-heading">
          <div className="section-head">
            <h2 id="members-heading">멤버</h2>
            <span className="section-count">{members.length}명</span>
          </div>
          <ul className="member-list">
            {members.map((m) => {
              const col = ELEMENT_COLOR[STEMS[m.chart.dayStem].element]
              return (
                <li key={m.person.id}>
                  <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
                  <span className="member-name">{m.person.name}</span>
                  <span className="member-pillar">{m.chart.day}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <GraphView
          members={members}
          relations={relations}
          emptyHint={<p>두 명 이상 모이면 관계선이 그려져요.</p>}
        />
      </main>

      <footer className="colophon">
        <p>재미로 보는 명리 풀이예요.</p>
      </footer>
    </>
  )
}
