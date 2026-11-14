import { useMemo, useSyncExternalStore } from 'react'

/**
 * 라우터 라이브러리 없이 쓰는 작은 주소 처리.
 * 화면이 셋뿐이라(혼자 쓰기, 공유 관계도, 없는 주소) 브라우저 History API로 충분하다.
 */
export type Route = { name: 'home' } | { name: 'shared'; code: string } | { name: 'notFound' }

/** 공유 코드에 허용하는 글자. 실제 코드는 3단계에서 랜덤으로 만든다. */
const SHARE_CODE = /^[A-Za-z0-9_-]{4,40}$/

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }
  const m = /^\/g\/([^/]+)$/.exec(path)
  if (m && SHARE_CODE.test(m[1])) return { name: 'shared', code: m[1] }
  return { name: 'notFound' }
}

const NAV_EVENT = 'app:navigate'

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAV_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAV_EVENT, onChange)
  }
}

const getPath = () => window.location.pathname

export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, getPath, () => '/')
  return useMemo(() => parseRoute(path), [path])
}

export function navigate(to: string): void {
  if (to !== window.location.pathname) {
    window.history.pushState(null, '', to)
    window.dispatchEvent(new Event(NAV_EVENT))
  }
  window.scrollTo(0, 0)
}
