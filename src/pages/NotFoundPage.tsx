import { useEffect } from 'react'
import AppLink from '../components/AppLink'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = '페이지를 찾을 수 없어요 | 우리 사이 관계도'
  }, [])

  return (
    <main className="not-found">
      <h1>이 주소에는 관계도가 없어요</h1>
      <p className="lede">링크가 잘렸거나 잘못 복사됐을 수 있어요. 받은 링크를 다시 확인하거나, 새 관계도를 만들어 보세요.</p>
      <AppLink to="/" className="text-btn">
        관계도 만들러 가기
      </AppLink>
    </main>
  )
}
