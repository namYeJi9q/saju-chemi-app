import { Suspense, lazy } from 'react'
import { useRoute } from './lib/router'
import SoloPage from './pages/SoloPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

// 공유 화면만 Firebase를 쓰므로 따로 불러온다. 혼자 쓰기 화면은 Firebase 없이 가볍게 뜬다.
const SharedPage = lazy(() => import('./pages/SharedPage'))

export default function App() {
  const route = useRoute()

  return (
    <div className="app">
      {route.name === 'home' && <SoloPage />}
      {route.name === 'shared' && (
        <Suspense fallback={<p className="loading">관계도를 불러오는 중이에요…</p>}>
          {/* code가 바뀌면 화면 상태를 새로 시작한다 */}
          <SharedPage key={route.code} code={route.code} />
        </Suspense>
      )}
      {route.name === 'notFound' && <NotFoundPage />}
    </div>
  )
}
