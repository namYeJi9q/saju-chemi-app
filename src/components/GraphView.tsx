import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import RelationGraph from './RelationGraph'
import DetailPanel from './DetailPanel'
import type { Member, Relation } from '../lib/relations'
import type { Selection } from '../lib/selection'
import { downloadSvgAsPng } from '../lib/exportImage'

interface Props {
  members: Member[]
  relations: Relation[]
  /** 관계선이 그려지기 전(두 명 미만)일 때 보여 줄 안내 */
  emptyHint: ReactNode
  /** 그래프 아래, 안내 문구 자리에 덧붙일 내용 */
  footnote?: ReactNode
  exportFileName?: string
}

/**
 * 관계도 그래프 + 범례 + 풀이 패널(모바일은 바텀시트).
 * 혼자 쓰기 화면과 공유 관계도 화면이 같이 쓴다. 선택 상태는 여기서 관리한다.
 */
export default function GraphView({ members, relations, emptyHint, footnote, exportFileName = '우리-사이-관계도.png' }: Props) {
  const [selection, setSelection] = useState<Selection>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // 지워졌거나 아직 완성되지 않은 사람을 가리키는 선택은 풀어 준다
  const validSelection: Selection = useMemo(() => {
    if (!selection) return null
    if (selection.type === 'node') return members.some((m) => m.person.id === selection.id) ? selection : null
    return relations.some((r) => r.key === selection.key) ? selection : null
  }, [selection, members, relations])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelection(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 모바일에서는 바텀시트가 그래프를 가리지 않도록 그래프를 화면 위쪽으로 올려 준다
  const select = useCallback((s: Selection) => {
    setSelection(s)
    if (!s || !frameRef.current) return
    if (!window.matchMedia('(max-width: 767px)').matches) return
    const top = frameRef.current.getBoundingClientRect().top
    if (Math.abs(top - 12) > 24) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: top - 12, behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [])

  const exportPng = useCallback(async () => {
    if (!svgRef.current) return
    setExportError(null)
    try {
      await downloadSvgAsPng(svgRef.current, exportFileName)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '이미지를 만들지 못했어요')
    }
  }, [exportFileName])

  return (
    <>
      <section className="col-graph" aria-label="관계도">
        <div className="graph-frame" ref={frameRef}>
          {members.length > 0 && (
            <RelationGraph
              members={members}
              relations={relations}
              selection={validSelection}
              onSelect={select}
              svgRef={svgRef}
            />
          )}
          {members.length < 2 && (
            <div className={members.length === 1 ? 'graph-empty is-low' : 'graph-empty'}>{emptyHint}</div>
          )}
        </div>

        <div className="graph-foot">
          <Legend />
          {members.length >= 2 && (
            <button type="button" className="text-btn" onClick={exportPng}>
              이미지로 저장
            </button>
          )}
        </div>
        {exportError && <p className="error">{exportError}</p>}
        {footnote}
      </section>

      <aside className={validSelection ? 'col-detail is-open' : 'col-detail'} aria-live="polite">
        {validSelection && (
          <button type="button" className="sheet-close" onClick={() => setSelection(null)}>
            닫기
          </button>
        )}
        <DetailPanel members={members} relations={relations} selection={validSelection} onSelect={select} />
      </aside>
    </>
  )
}

function Legend() {
  return (
    <ul className="legend" aria-label="선 모양 안내">
      <li>
        <svg width="36" height="10" aria-hidden="true">
          <line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="34,5 27,1.5 27,8.5" fill="currentColor" />
        </svg>
        챙겨줌 (상생)
      </li>
      <li>
        <svg width="36" height="10" aria-hidden="true">
          <line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
          <polygon points="34,5 27,1.5 27,8.5" fill="currentColor" />
        </svg>
        다듬어줌 (상극)
      </li>
      <li>
        <svg width="36" height="10" aria-hidden="true">
          <line x1="2" y1="5" x2="34" y2="5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="1.5 4" strokeLinecap="round" />
        </svg>
        같은 결
      </li>
      <li>
        <svg width="12" height="10" aria-hidden="true">
          <circle cx="6" cy="5" r="3.5" fill="var(--gold)" />
        </svg>
        특별한 인연
      </li>
    </ul>
  )
}
