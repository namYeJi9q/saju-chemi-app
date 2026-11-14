import { useEffect, useMemo } from 'react'
import AppLink from '../components/AppLink'
import CopyLinkButton from '../components/CopyLinkButton'
import GraphView from '../components/GraphView'
import { toMembers } from '../lib/members'
import { buildRelations } from '../lib/relations'
import { STEMS } from '../lib/saju'
import { SAMPLE_PEOPLE } from '../lib/storage'
import { ELEMENT_COLOR } from '../lib/theme'
import { useAnonymousUser } from '../lib/useAnonymousUser'
import { useSharedGraph } from '../lib/useSharedGraph'

interface Props {
  code: string
}

/**
 * 공유 관계도 화면.
 * 3단계: 공유 코드로 실제 관계도(이름, 방장)를 불러온다. 멤버는 아직 예시. (4단계에서 실제 멤버로 바뀜)
 */
export default function SharedPage({ code }: Props) {
  const user = useAnonymousUser()
  const uid = user.status === 'ready' ? user.uid : null
  const graphState = useSharedGraph(code, uid)

  const members = useMemo(() => toMembers(SAMPLE_PEOPLE.map((p, i) => ({ ...p, id: `sample-${i}` }))), [])
  const relations = useMemo(() => buildRelations(members), [members])

  const graphName = graphState.status === 'ready' ? graphState.graph.name : null
  useEffect(() => {
    document.title = graphName ? `${graphName} | 우리 사이 관계도` : '공유 관계도 | 우리 사이 관계도'
  }, [graphName])

  if (user.status === 'error' || graphState.status === 'error') {
    const message = user.status === 'error' ? user.message : graphState.status === 'error' ? graphState.message : ''
    return <Problem title="관계도를 불러오지 못했어요" message={message} />
  }

  if (graphState.status === 'notFound') {
    return (
      <Problem
        title="이 링크의 관계도를 찾을 수 없어요"
        message="링크가 잘렸거나, 관계도가 지워졌을 수 있어요. 받은 링크를 다시 확인해 주세요."
      />
    )
  }

  if (graphState.status === 'loading') {
    return <p className="loading">관계도를 불러오는 중이에요…</p>
  }

  const { graph } = graphState
  const isOwner = graph.ownerUid === uid

  return (
    <>
      <header className="masthead">
        <AppLink to="/" className="crumb">
          우리 사이 관계도
        </AppLink>
        <h1>{graph.name}</h1>
        <p className="lede">링크를 받은 친구들이 직접 들어와 채우는 관계도예요.</p>
        <div className="share-actions">
          <CopyLinkButton code={graph.code} />
          {isOwner && <span className="owner-badge">내가 만든 관계도</span>}
        </div>
      </header>

      {/* 개발 확인용. 4단계에서 실제 멤버가 붙으면 없앤다 */}
      <p className="notice" role="status" data-auth={user.status} data-owner={isOwner ? 'me' : 'other'}>
        번호표 {uid?.slice(0, 6)}… 로 접속했어요. {isOwner ? '이 관계도의 방장이에요.' : '방장은 다른 사람이에요.'}{' '}
        멤버는 아직 예시예요.
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

        <GraphView members={members} relations={relations} emptyHint={<p>두 명 이상 모이면 관계선이 그려져요.</p>} />
      </main>

      <footer className="colophon">
        <p>재미로 보는 명리 풀이예요.</p>
      </footer>
    </>
  )
}

function Problem({ title, message }: { title: string; message: string }) {
  return (
    <main className="not-found">
      <h1>{title}</h1>
      <p className="lede">{message}</p>
      <AppLink to="/" className="text-btn">
        새 관계도 만들러 가기
      </AppLink>
    </main>
  )
}
