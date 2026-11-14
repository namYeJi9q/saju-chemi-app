import { useEffect, useState } from 'react'
import { watchSharedMembers, type SharedMember } from './sharedMembers'
import { describeFirebaseError } from './auth'

export type SharedMembersState =
  | { status: 'loading' }
  | { status: 'ready'; members: SharedMember[] }
  | { status: 'error'; message: string }

/** 관계도가 확인된 뒤(enabled) 멤버를 실시간으로 구독한다. 화면을 떠나면 구독을 끊는다. */
export function useSharedMembers(code: string, enabled: boolean): SharedMembersState {
  const [state, setState] = useState<SharedMembersState>({ status: 'loading' })

  useEffect(() => {
    if (!enabled) return
    return watchSharedMembers(
      code,
      (members) => setState({ status: 'ready', members }),
      (err) => setState({ status: 'error', message: describeFirebaseError(err) }),
    )
  }, [code, enabled])

  return state
}
