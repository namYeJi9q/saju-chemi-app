import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseApp } from './firebase'
import { getAnonymousUid } from './auth'
import type { Person } from './saju'

/**
 * 공유 관계도의 멤버: graphs/{공유코드}/members/{자동 ID}
 * 생년월일 원본을 저장하지만, 화면에는 이름과 사주(일주 등)만 보여 준다.
 */
export interface SharedMember extends Person {
  /** 이 멤버를 추가한 사람의 번호표. 5·6단계에서 수정·삭제 권한에 쓴다 */
  createdBy: string
}

export interface MemberInput {
  name: string
  birthDate: string
  birthTime: string | null
}

export const MEMBER_NAME_MAX = 12
export const MAX_SHARED_MEMBERS = 10

let db: Firestore | null = null
function firestore(): Firestore {
  db ??= getFirestore(getFirebaseApp())
  return db
}

const membersOf = (code: string) => collection(firestore(), 'graphs', code, 'members')

/** 입력값을 저장 가능한 모양으로 다듬는다. 문제가 있으면 사람이 읽을 이유를 돌려준다. */
export function validateMember(input: MemberInput): { ok: true; value: MemberInput } | { ok: false; reason: string } {
  const name = input.name.trim().slice(0, MEMBER_NAME_MAX)
  if (!name) return { ok: false, reason: '이름을 넣어 주세요.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) return { ok: false, reason: '생년월일을 골라 주세요.' }
  const year = Number(input.birthDate.slice(0, 4))
  if (year < 1900 || input.birthDate > new Date().toISOString().slice(0, 10))
    return { ok: false, reason: '생년월일을 다시 확인해 주세요.' }
  const birthTime = input.birthTime && /^\d{2}:\d{2}$/.test(input.birthTime) ? input.birthTime : null
  return { ok: true, value: { name, birthDate: input.birthDate, birthTime } }
}

export async function addSharedMember(code: string, input: MemberInput): Promise<void> {
  const createdBy = await getAnonymousUid()
  await addDoc(membersOf(code), { ...input, createdBy, createdAt: serverTimestamp() })
}

/** 멤버 목록을 실시간으로 받는다. 누가 추가하면 열려 있는 모든 화면에 바로 들어온다. */
export function watchSharedMembers(
  code: string,
  onMembers: (members: SharedMember[]) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    query(membersOf(code), orderBy('createdAt', 'asc')),
    (snap) => {
      onMembers(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' })
          return {
            id: d.id,
            name: String(data.name ?? ''),
            birthDate: String(data.birthDate ?? ''),
            birthTime: typeof data.birthTime === 'string' ? data.birthTime : null,
            createdBy: String(data.createdBy ?? ''),
          }
        }),
      )
    },
    onError,
  )
}
