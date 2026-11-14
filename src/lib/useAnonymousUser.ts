import { useEffect, useState } from 'react'
import { firebaseConfigured } from './firebase'
import { describeFirebaseError, watchAnonymousUser } from './auth'

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

export function useAnonymousUser(): AnonymousUser {
  const [state, setState] = useState<AnonymousUser>(() =>
    firebaseConfigured ? { status: 'loading' } : NOT_CONFIGURED,
  )

  useEffect(() => {
    if (!firebaseConfigured) return
    return watchAnonymousUser(
      (uid) => setState({ status: 'ready', uid }),
      (err) => setState({ status: 'error', message: describeFirebaseError(err) }),
    )
  }, [])

  return state
}
