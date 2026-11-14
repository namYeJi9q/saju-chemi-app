import { useRef, useState, type FormEvent } from 'react'
import { STEMS, computeChart, pillarKo } from '../lib/saju'
import { ELEMENT_COLOR } from '../lib/theme'
import { MEMBER_NAME_MAX, validateMember, type MemberInput } from '../lib/sharedMembers'

interface Props {
  onSubmit: (input: MemberInput) => Promise<void>
  /** 'edit'이면 미리 채운 값으로 고치기 화면이 된다 */
  mode?: 'add' | 'edit'
  initial?: MemberInput
  onCancel?: () => void
}

const today = new Date().toISOString().slice(0, 10)
const EMPTY: MemberInput = { name: '', birthDate: '', birthTime: null }

/**
 * 공유 관계도의 멤버 입력 폼. 혼자 쓰기 화면의 입력 칸 모양을 그대로 쓴다.
 * 추가할 때는 본인이 아니어도(엄마, 친구 대신) 넣을 수 있다.
 */
export default function MemberForm({ onSubmit, mode = 'add', initial, onCancel }: Props) {
  const editing = mode === 'edit'
  const [input, setInput] = useState<MemberInput>(initial ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'done'; text: string } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const chart = input.birthDate ? computeChart({ id: 'preview', ...input }) : null
  const stem = chart ? STEMS[chart.dayStem] : null
  const col = stem ? ELEMENT_COLOR[stem.element] : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const checked = validateMember(input)
    if (!checked.ok) {
      setMessage({ kind: 'error', text: checked.reason })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await onSubmit(checked.value)
      if (!editing) {
        setMessage({
          kind: 'done',
          text: `${checked.value.name} 님을 관계도에 띄웠어요. 링크를 단톡방에 올려 친구들도 불러 보세요.`,
        })
        setInput(EMPTY)
        nameRef.current?.focus()
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : '저장하지 못했어요.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      id={editing ? undefined : 'member-form'}
      className={editing ? 'member-form is-edit' : 'member-form'}
      onSubmit={submit}
      noValidate
    >
      {!editing && (
        <>
          <h3>관계도에 추가하기</h3>
          <p className="member-form-hint">나도, 엄마나 친구도 대신 넣을 수 있어요. 생년월일은 다른 사람에게 보이지 않아요.</p>
        </>
      )}

      <div className="person">
        <div className="person-head">
          <input
            ref={nameRef}
            id={editing ? undefined : 'member-form-name'}
            className="name-input"
            type="text"
            value={input.name}
            maxLength={MEMBER_NAME_MAX}
            placeholder="이름"
            aria-label={editing ? '이름 고치기' : '추가할 사람 이름'}
            autoFocus={editing}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
          />
          {chart && col && stem && (
            <span className="person-pillar" title={`${pillarKo(chart.day)} 일주`}>
              <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
              {chart.day}
              <span className="sr-only">
                {pillarKo(chart.day)} 일주, {stem.image}
              </span>
            </span>
          )}
        </div>
        <div className="person-fields">
          <label>
            <span>생년월일 (양력)</span>
            <input
              type="date"
              value={input.birthDate}
              min="1900-01-01"
              max={today}
              onChange={(e) => setInput({ ...input, birthDate: e.target.value })}
            />
          </label>
          <label>
            <span>태어난 시간</span>
            <input
              type="time"
              value={input.birthTime ?? ''}
              disabled={input.birthTime === null}
              onChange={(e) => setInput({ ...input, birthTime: e.target.value || '' })}
            />
          </label>
          <label className="unknown">
            <input
              type="checkbox"
              checked={input.birthTime === null}
              onChange={(e) => setInput({ ...input, birthTime: e.target.checked ? null : '' })}
            />
            <span>시간 모름</span>
          </label>
        </div>
      </div>

      <div className="member-form-actions">
        <button type="submit" className="btn-primary member-form-submit" disabled={busy}>
          {editing ? (busy ? '저장하는 중…' : '저장') : busy ? '띄우는 중…' : '관계도에 띄우기'}
        </button>
        {editing && onCancel && (
          <button type="button" className="text-btn" onClick={onCancel} disabled={busy}>
            취소
          </button>
        )}
      </div>
      {message && (
        <p className={message.kind === 'error' ? 'error' : 'hint'} role={message.kind === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
