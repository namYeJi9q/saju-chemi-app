import type { Element } from './saju'
import type { RelationKind } from './relations'

/** 오방색을 밤하늘 위에서 보이도록 다듬은 값. 노드(사람) 색은 오행만 뜻한다. */
export const ELEMENT_COLOR: Record<Element, { fill: string; ink: string; ring: string }> = {
  wood: { fill: '#4FA88F', ink: '#10162E', ring: '#4FA88F' },
  fire: { fill: '#E0694D', ink: '#10162E', ring: '#E0694D' },
  earth: { fill: '#E2B54A', ink: '#10162E', ring: '#E2B54A' },
  metal: { fill: '#EDE7DA', ink: '#10162E', ring: '#EDE7DA' },
  water: { fill: '#10162E', ink: '#EEE8D8', ring: '#8EA2DA' },
}

export const NIGHT = '#161B33'
export const PAGE = '#10142A'
export const STARLIGHT = '#EEE8D8'
export const STARLIGHT_DIM = '#A3A8C3'
export const BADGE_GOLD = '#E2B54A'

export const SERIF = "'Song Myung', 'Noto Serif KR', serif"
export const SANS = "'IBM Plex Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

/** 선은 모두 별빛 색. 관계 종류는 색이 아니라 선 모양으로 구분한다. */
export const EDGE_DASH: Record<RelationKind, string | undefined> = {
  support: undefined,
  refine: '7 5',
  peer: '1.5 5',
}

export const KIND_NAME: Record<RelationKind, string> = {
  support: '챙겨줌',
  refine: '다듬어줌',
  peer: '같은 결',
}
