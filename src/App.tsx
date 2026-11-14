import { useRoute } from './lib/router'
import SoloPage from './pages/SoloPage'
import SharedPage from './pages/SharedPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

export default function App() {
  const route = useRoute()

  return (
    <div className="app">
      {route.name === 'home' && <SoloPage />}
      {/* code가 바뀌면 화면 상태를 새로 시작한다 */}
      {route.name === 'shared' && <SharedPage key={route.code} code={route.code} />}
      {route.name === 'notFound' && <NotFoundPage />}
    </div>
  )
}
