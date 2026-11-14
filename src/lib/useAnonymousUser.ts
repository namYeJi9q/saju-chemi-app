import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { firebaseConfigured, getFirebaseAuth } from './firebase'

/**
 * 회원가입 없이 이 브라우저에 보이지 않는 "번호표"(익명 계정)를 준다.
 * 한 번 받은 번호표는 브라우저에 남아서, 다시 들어와도 같은 사람으로 인식된다.
 */
export type AnonymousUser =
  | { status: 'loading' }
  | { status: 'ready'; uid: string }
  | { status: 'error'; message: string }

const NOT_CONFIGURED: AnonymousUser = {
  status: 'error',
  message: 'Firebase 설정값이 없어요. .env.local을 확인해 주세요.',
}

// 같은 화면에서 로그인 요청이 겹쳐 번호표가 두 개 생기지 않게 한 번만 보낸다
let pending: Promise<unknown> | null = null
function ensureSignedIn(auth: Auth) {
  pending ??= signInAnonymously(auth).finally(() => {
    pending = null
  })
  return pending
}

function describe(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : ''
  if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed')
    return '익명 로그인이 꺼져 있어요. Firebase 콘솔의 Authentication에서 익명 로그인을 켜 주세요.'
  if (code === 'auth/network-request-failed') return '인터넷 연결을 확인해 주세요.'
  if (code.startsWith('auth/api-key') || code === 'auth/invalid-api-key')
    return 'Firebase 설정값이 맞지 않아요. .env.local을 확인해 주세요.'
  return `서버에 연결하지 못했어요${code ? ` (${code})` : ''}.`
}

export function useAnonymousUser(): AnonymousUser {
  const [state, setState] = useState<AnonymousUser>(() =>
    firebaseConfigured ? { status: 'loading' } : NOT_CONFIGURED,
  )

  useEffect(() => {
    if (!firebaseConfigured) return
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ status: 'ready', uid: user.uid })
        return
      }
      ensureSignedIn(auth).catch((err: unknown) => setState({ status: 'error', message: describe(err) }))
    })
  }, [])

  return state
}
