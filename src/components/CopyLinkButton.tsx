import { useEffect, useRef, useState } from 'react'
import { shareUrl } from '../lib/shareCode'

/**
 * 공유 링크 복사. 복사가 막힌 브라우저(일부 앱 안 브라우저)에서는
 * 링크를 직접 길게 눌러 복사할 수 있게 주소 칸을 보여 준다.
 */
export default function CopyLinkButton({ code }: { code: string }) {
  const url = shareUrl(code)
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="copy-link">
      <button type="button" className="btn-primary" onClick={copy}>
        {state === 'copied' ? '링크를 복사했어요' : '링크 복사'}
      </button>
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
