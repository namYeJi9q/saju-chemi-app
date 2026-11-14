import { useState } from 'react'
import MemberForm from './MemberForm'
import type { Member } from '../lib/relations'
import { STEMS } from '../lib/saju'
import type { MemberInput, SharedMember } from '../lib/sharedMembers'
import { ELEMENT_COLOR } from '../lib/theme'

interface Props {
  members: Member[]
  /** 원본(추가한 사람, 생년월일)을 id로 찾기 위한 표 */
  sharedById: Map<string, SharedMember>
  uid: string | null
  isOwner: boolean
  onUpdate: (id: string, input: MemberInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

/**
 * 공유 관계도 멤버 목록.
 * 버튼 규칙(화면): 내가 추가한 멤버 → 수정·삭제 / 방장 → 모든 멤버 삭제 / 그 외 → 버튼 없음.
 * 화면에서 숨기는 것만으로는 막히지 않으므로, 6단계 보안 규칙에서 서버도 같은 규칙으로 잠근다.
 */
export default function SharedMemberList({ members, sharedById, uid, isOwner, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<{ id: string; text: string } | null>(null)

  const remove = async (id: string) => {
    setDeletingId(id)
    setError(null)
    try {
      await onDelete(id)
      setConfirmId(null)
    } catch (err) {
      setError({ id, text: err instanceof Error ? err.message : '지우지 못했어요.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ul className="member-list" aria-live="polite">
      {members.map((m) => {
        const id = m.person.id
        const source = sharedById.get(id)
        const mine = !!uid && source?.createdBy === uid
        const canEdit = mine
        const canDelete = mine || isOwner
        const col = ELEMENT_COLOR[STEMS[m.chart.dayStem].element]

        if (editingId === id && source) {
          return (
            <li key={id} className="is-editing">
              <MemberForm
                mode="edit"
                initial={{ name: source.name, birthDate: source.birthDate, birthTime: source.birthTime }}
                onSubmit={async (input) => {
                  await onUpdate(id, input)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          )
        }

        return (
          <li key={id}>
            <div className="member-row">
              <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
              <span className="member-name">{m.person.name}</span>
              {mine && <span className="mine-tag">내가 추가</span>}
              <span className="member-pillar">{m.chart.day}</span>
            </div>

            {confirmId === id ? (
              <div className="member-actions is-confirm">
                <span>{m.person.name} 님을 관계도에서 지울까요?</span>
                <button type="button" className="text-btn danger" onClick={() => remove(id)} disabled={deletingId === id}>
                  {deletingId === id ? '지우는 중…' : '지우기'}
                </button>
                <button type="button" className="text-btn" onClick={() => setConfirmId(null)} disabled={deletingId === id}>
                  취소
                </button>
              </div>
            ) : (
              (canEdit || canDelete) && (
                <div className="member-actions">
                  {canEdit && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setConfirmId(null)
                        setEditingId(id)
                      }}
                      aria-label={`${m.person.name} 수정`}
                    >
                      수정
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setEditingId(null)
                        setConfirmId(id)
                      }}
                      aria-label={`${m.person.name} 삭제`}
                    >
                      삭제
                    </button>
                  )}
                  {!mine && isOwner && <span className="owner-note">방장 권한</span>}
                </div>
              )
            )}
            {error?.id === id && (
              <p className="error" role="alert">
                {error.text}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
