import { useEffect, useState } from 'react'
import { fetchSharedGraph, type SharedGraph } from './graphs'
import { describeFirebaseError } from './auth'

export type SharedGraphState =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'ready'; graph: SharedGraph }
  | { status: 'error'; message: string }

/**
 * 공유 코드로 관계도를 불러온다. 번호표(uid)를 받은 뒤에 읽는다.
 * (6단계 보안 규칙에서 "번호표가 있는 사람만 읽기"로 잠글 예정이라 지금부터 순서를 맞춰 둔다)
 */
export function useSharedGraph(code: string, uid: string | null): SharedGraphState {
  const [state, setState] = useState<SharedGraphState>({ status: 'loading' })

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    fetchSharedGraph(code)
      .then((graph) => {
        if (!cancelled) setState(graph ? { status: 'ready', graph } : { status: 'notFound' })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: describeFirebaseError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [code, uid])

  return state
}
