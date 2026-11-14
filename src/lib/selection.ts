import type { Relation } from './relations'

export type Selection = { type: 'edge'; key: string } | { type: 'node'; id: string } | null

export type Hover = { type: 'edge'; key: string } | { type: 'node'; id: string } | null

export type EdgeState = 'default' | 'hover' | 'active' | 'dim'
export type NodeState = 'default' | 'hover' | 'active' | 'related' | 'dim'

function touches(r: Relation, id: string) {
  return r.from === id || r.to === id
}

export function edgeState(r: Relation, sel: Selection, hover: Hover): EdgeState {
  const hovered =
    (hover?.type === 'edge' && hover.key === r.key) || (hover?.type === 'node' && touches(r, hover.id))

  if (sel) {
    const active = sel.type === 'edge' ? sel.key === r.key : touches(r, sel.id)
    if (active) return 'active'
    // 선택 중에도 다른 선에 마우스를 올리면 "이것도 볼래?" 정도로 살짝 떠오른다
    return hovered ? 'hover' : 'dim'
  }
  return hovered ? 'hover' : 'default'
}

export function nodeState(id: string, relations: Relation[], sel: Selection, hover: Hover): NodeState {
  const isHovered = hover?.type === 'node' && hover.id === id
  if (!sel) return isHovered ? 'hover' : 'default'

  if (sel.type === 'node') {
    if (sel.id === id) return 'active'
    const linked = relations.some((r) => touches(r, sel.id) && touches(r, id))
    if (linked) return 'related'
    return isHovered ? 'hover' : 'dim'
  }
  const r = relations.find((x) => x.key === sel.key)
  if (r && touches(r, id)) return 'related'
  return isHovered ? 'hover' : 'dim'
}

/** 선 상태별 스타일. 기본은 얇고 흐리게, hover는 한 단계, 선택은 확실하게. */
export const EDGE_STYLE: Record<EdgeState, { width: number; opacity: number }> = {
  default: { width: 1.2, opacity: 0.38 },
  hover: { width: 2, opacity: 0.75 },
  active: { width: 3, opacity: 1 },
  dim: { width: 1, opacity: 0.08 },
}
