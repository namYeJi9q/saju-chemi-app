import { useEffect, useRef, useState } from 'react'
import { shareUrl } from '../lib/shareCode'

const SHARE_TEXT = '생일만 넣으면 우리 사이가 별자리로 그려져요. 링크 열고 나도 추가해 줘!'

/**
 * 공유 링크 복사. 복사가 막힌 브라우저(일부 앱 안 브라우저)에서는
 * 링크를 직접 길게 눌러 복사할 수 있게 주소 칸을 보여 준다.
 * 휴대폰처럼 공유 창을 지원하면 '다른 앱으로 보내기'도 함께 보여 준다(카톡으로 바로 보내기).
 */
export default function CopyLinkButton({ code }: { code: string }) {
  const url = shareUrl(code)
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (state !== 'copied') return
    const t = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(t)
  }, [state])

  useEffect(() => {
    if (state === 'manual') inputRef.current?.select()
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('manual')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: '우리 사이 관계도', text: SHARE_TEXT, url })
    } catch (err) {
      // 사용자가 공유 창을 닫은 경우(AbortError)는 그냥 넘어간다
      if (!(err instanceof DOMException && err.name === 'AbortError')) setState('manual')
    }
  }

  return (
    <div className="copy-link">
      <div className="copy-link-buttons">
        <button type="button" className="btn-secondary" onClick={copy}>
          {state === 'copied' ? '링크를 복사했어요' : '링크 복사'}
        </button>
        {canShare && (
          <button type="button" className="text-btn" onClick={share}>
            다른 앱으로 보내기
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {state === 'copied' ? '링크를 복사했어요' : ''}
      </span>
      {state === 'manual' && (
        <label className="copy-link-manual">
          <span>자동 복사가 안 되는 브라우저예요. 아래 주소를 길게 눌러 복사해 주세요.</span>
          <input ref={inputRef} type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
    </div>
  )
}
