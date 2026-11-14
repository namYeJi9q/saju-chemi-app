import { useCallback, useEffect, useMemo } from 'react'
import AppLink from '../components/AppLink'
import CopyLinkButton from '../components/CopyLinkButton'
import GraphView from '../components/GraphView'
import MemberForm from '../components/MemberForm'
import { toMembers } from '../lib/members'
import { buildRelations } from '../lib/relations'
import { STEMS } from '../lib/saju'
import { describeFirebaseError } from '../lib/auth'
import { MAX_SHARED_MEMBERS, addSharedMember, type MemberInput } from '../lib/sharedMembers'
import { ELEMENT_COLOR } from '../lib/theme'
import { useAnonymousUser } from '../lib/useAnonymousUser'
import { useSharedGraph } from '../lib/useSharedGraph'
import { useSharedMembers } from '../lib/useSharedMembers'

interface Props {
  code: string
}

/**
 * 공유 관계도 화면.
 * 4단계: 링크로 들어온 누구나 멤버를 추가하고, 열려 있는 모든 화면에 실시간으로 반영된다.
 */
export default function SharedPage({ code }: Props) {
  const user = useAnonymousUser()
  const uid = user.status === 'ready' ? user.uid : null
  const graphState = useSharedGraph(code, uid)
  const membersState = useSharedMembers(code, graphState.status === 'ready')

  const shared = useMemo(() => (membersState.status === 'ready' ? membersState.members : []), [membersState])
  const members = useMemo(() => toMembers(shared), [shared])
  const relations = useMemo(() => buildRelations(members), [members])
  const addedBy = useMemo(() => new Map(shared.map((m) => [m.id, m.createdBy])), [shared])

  const graphName = graphState.status === 'ready' ? graphState.graph.name : null
  useEffect(() => {
    document.title = graphName ? `${graphName} | 우리 사이 관계도` : '공유 관계도 | 우리 사이 관계도'
  }, [graphName])

  const add = useCallback(
    async (input: MemberInput) => {
      try {
        await addSharedMember(code, input)
      } catch (err) {
        throw new Error(describeFirebaseError(err), { cause: err })
      }
    },
    [code],
  )

  const problem =
    user.status === 'error'
      ? user.message
      : graphState.status === 'error'
        ? graphState.message
        : membersState.status === 'error'
          ? membersState.message
          : null
  if (problem) return <Problem title="관계도를 불러오지 못했어요" message={problem} />

  if (graphState.status === 'notFound') {
    return (
      <Problem
        title="이 링크의 관계도를 찾을 수 없어요"
        message="링크가 잘렸거나, 관계도가 지워졌을 수 있어요. 받은 링크를 다시 확인해 주세요."
      />
    )
  }

  if (graphState.status !== 'ready' || membersState.status === 'loading') {
    return <p className="loading">관계도를 불러오는 중이에요…</p>
  }

  const { graph } = graphState
  const isOwner = graph.ownerUid === uid
  const full = shared.length >= MAX_SHARED_MEMBERS

  return (
    <>
      <header className="masthead">
        <AppLink to="/" className="crumb">
          우리 사이 관계도
        </AppLink>
        <h1>{graph.name}</h1>
        <p className="lede">링크를 받은 친구들이 직접 들어와 채우는 관계도예요. 누가 추가하면 모두의 화면에 바로 떠요.</p>
        <div className="share-actions">
          <CopyLinkButton code={graph.code} />
          {isOwner && <span className="owner-badge">내가 만든 관계도</span>}
        </div>
      </header>

      <main className={members.length >= 2 ? 'layout has-graph' : 'layout'}>
        <section className="col-members" aria-labelledby="members-heading">
          <div className="section-head">
            <h2 id="members-heading">멤버</h2>
            <span className="section-count">
              {shared.length} / {MAX_SHARED_MEMBERS}명
            </span>
          </div>

          {members.length > 0 ? (
            <ul className="member-list" aria-live="polite">
              {members.map((m) => {
                const col = ELEMENT_COLOR[STEMS[m.chart.dayStem].element]
                const mine = addedBy.get(m.person.id) === uid
                return (
                  <li key={m.person.id}>
                    <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
                    <span className="member-name">{m.person.name}</span>
                    {mine && <span className="mine-tag">내가 추가</span>}
                    <span className="member-pillar">{m.chart.day}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="member-empty">아직 아무도 없어요. 첫 번째 별을 띄워 주세요.</p>
          )}

          {full ? (
            <p className="member-full">{MAX_SHARED_MEMBERS}명이 모두 모였어요. 관계도가 꽉 찼어요.</p>
          ) : (
            <MemberForm onSubmit={add} />
          )}
        </section>

        <GraphView
          members={members}
          relations={relations}
          emptyHint={<p>두 명 이상 모이면 관계선이 그려져요.</p>}
          exportFileName={`${graph.name}.png`}
        />
      </main>

      <footer className="colophon">
        <p>재미로 보는 명리 풀이예요. 생년월일은 화면에 보여 주지 않고, 이름과 사주만 보여 줘요.</p>
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
