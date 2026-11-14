import { FirebaseError } from 'firebase/app'
import { onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth'
import { getFirebaseAuth } from './firebase'

// 같은 화면에서 로그인 요청이 겹쳐 번호표가 두 개 생기지 않게 한 번만 보낸다
let pending: Promise<unknown> | null = null
export function ensureSignedIn(auth: Auth) {
  pending ??= signInAnonymously(auth).finally(() => {
    pending = null
  })
  return pending
}

/** 이 브라우저의 익명 번호표(uid)를 돌려준다. 아직 없으면 새로 받는다. */
export async function getAnonymousUid(): Promise<string> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  if (auth.currentUser) return auth.currentUser.uid
  await ensureSignedIn(auth)
  // 위의 if로 TypeScript가 currentUser를 null로 좁혀 두었으므로, 로그인 후 값을 다시 읽는다
  const signedIn = getFirebaseAuth().currentUser
  if (!signedIn) throw new Error('번호표를 받지 못했어요')
  return signedIn.uid
}

export function watchAnonymousUser(onUid: (uid: string) => void, onError: (err: unknown) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onUid(user.uid)
      return
    }
    ensureSignedIn(auth).catch(onError)
  })
}

export function describeFirebaseError(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : ''
  if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed')
    return '익명 로그인이 꺼져 있어요. Firebase 콘솔의 Authentication에서 익명 로그인을 켜 주세요.'
  if (code === 'auth/network-request-failed' || code === 'unavailable') return '인터넷 연결을 확인해 주세요.'
  if (code.startsWith('auth/api-key') || code === 'auth/invalid-api-key')
    return 'Firebase 설정값이 맞지 않아요. .env.local을 확인해 주세요.'
  if (code === 'permission-denied') return '이 작업을 할 권한이 없어요.'
  return `서버에 연결하지 못했어요${code ? ` (${code})` : ''}.`
}
