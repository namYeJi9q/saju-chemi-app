import { doc, getDoc, getFirestore, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import { getFirebaseApp } from './firebase'
import { getAnonymousUid } from './auth'
import { generateShareCode } from './shareCode'

/**
 * 공유 관계도 저장소.
 *   graphs/{공유코드}            관계도 (이름, 방장 번호표, 만든 시각)
 *   graphs/{공유코드}/members/*  멤버 (4단계)
 */
export interface SharedGraph {
  code: string
  name: string
  ownerUid: string
}

export const GRAPH_NAME_MAX = 30
export const DEFAULT_GRAPH_NAME = '우리 사이 관계도'

let db: Firestore | null = null
function firestore(): Firestore {
  db ??= getFirestore(getFirebaseApp())
  return db
}

export function cleanGraphName(name: string): string {
  return name.trim().slice(0, GRAPH_NAME_MAX) || DEFAULT_GRAPH_NAME
}

/** 새 공유 관계도를 만들고 공유 코드를 돌려준다. 만든 사람이 방장이 된다. */
export async function createSharedGraph(name: string): Promise<string> {
  const ownerUid = await getAnonymousUid()
  const code = generateShareCode()
  await setDoc(doc(firestore(), 'graphs', code), {
    name: cleanGraphName(name),
    ownerUid,
    createdAt: serverTimestamp(),
  })
  return code
}

/** 공유 코드로 관계도를 찾는다. 없으면 null. */
export async function fetchSharedGraph(code: string): Promise<SharedGraph | null> {
  const snap = await getDoc(doc(firestore(), 'graphs', code))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    code,
    name: typeof data.name === 'string' ? data.name : DEFAULT_GRAPH_NAME,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
  }
}
