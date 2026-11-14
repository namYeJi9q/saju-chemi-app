import { useState, type FormEvent } from 'react'
import { navigate } from '../lib/router'

/**
 * 혼자 쓰기 화면의 "공유 관계도 만들기".
 * Firebase는 버튼을 누를 때 처음 불러온다. 그래서 그냥 구경만 하는 사람에겐 번호표가 생기지 않는다.
 */
export default function CreateSharedGraph() {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const [{ createSharedGraph }, { describeFirebaseError }] = await Promise.all([
        import('../lib/graphs'),
        import('../lib/auth'),
      ])
      try {
        const code = await createSharedGraph(name)
        navigate(`/g/${code}`)
      } catch (err) {
        setError(err instanceof Error && err.message.includes('설정값') ? err.message : describeFirebaseError(err))
        setBusy(false)
      }
    } catch {
      setError('필요한 파일을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.')
      setBusy(false)
    }
  }

  return (
    <section className="share-start" aria-labelledby="share-start-heading">
      <div className="share-start-text">
        <h2 id="share-start-heading">친구들과 같이 채우기</h2>
        <p>공유 관계도를 만들어 단톡방에 링크를 올리면, 친구들이 직접 들어와 자기 별을 띄워요.</p>
      </div>
      <form className="share-start-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="graph-name">
          관계도 이름
        </label>
        <input
          id="graph-name"
          type="text"
          value={name}
          maxLength={30}
          placeholder="관계도 이름 (예: 우리 단톡방)"
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? '만드는 중…' : '공유 관계도 만들기'}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
