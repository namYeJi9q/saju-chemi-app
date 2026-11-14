import { useMemo, useState, type KeyboardEvent, type PointerEvent, type Ref } from 'react'
import type { Member, Relation } from '../lib/relations'
import { STEMS } from '../lib/saju'
import { EDGE_STYLE, edgeState, nodeState, type Hover, type Selection } from '../lib/selection'
import {
  BADGE_GOLD,
  EDGE_DASH,
  ELEMENT_COLOR,
  NIGHT,
  PAGE,
  SANS,
  SERIF,
  STARLIGHT,
  STARLIGHT_DIM,
} from '../lib/theme'

const SIZE = 640
const C = SIZE / 2
const PLATE_R = 316
const ringR = (n: number) => (n > 6 ? 212 : 202)

interface Point {
  x: number
  y: number
  /** 원 위 각도(라디안). 이름표 방향을 정할 때 쓴다 */
  angle: number
}

function layout(n: number): Point[] {
  if (n === 1) return [{ x: C, y: C, angle: Math.PI / 2 }]
  if (n === 2)
    return [
      { x: C - 170, y: C, angle: Math.PI / 2 },
      { x: C + 170, y: C, angle: Math.PI / 2 },
    ]
  const R = ringR(n)
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle), angle }
  })
}

/** 배경 별. 매번 같은 자리에 찍히도록 고정 시드를 쓴다 */
function backgroundStars() {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: 80 }, () => {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * (PLATE_R - 16)
    return { x: C + Math.cos(a) * d, y: C + Math.sin(a) * d, r: 0.4 + rand() * 0.9, o: 0.15 + rand() * 0.35 }
  })
}
const STARS = backgroundStars()

interface Props {
  members: Member[]
  relations: Relation[]
  selection: Selection
  onSelect: (s: Selection) => void
  svgRef?: Ref<SVGSVGElement>
}

export default function RelationGraph({ members, relations, selection, onSelect, svgRef }: Props) {
  const [hover, setHover] = useState<Hover>(null)
  const nodeR = members.length > 6 ? 26 : 30

  const pos = useMemo(() => {
    const pts = layout(members.length)
    return new Map(members.map((m, i) => [m.person.id, pts[i]]))
  }, [members])

  const mouseOnly = (fn: () => void) => (e: PointerEvent) => {
    if (e.pointerType === 'mouse') fn()
  }
  const keySelect = (s: Selection) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(s)
    }
  }

  const edges = relations.map((r) => {
    const a = pos.get(r.from)!
    const b = pos.get(r.to)!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    // 살짝 휜 곡선: 원을 가로지르는 선들이 한 점(중심)에서 겹치지 않게 한다
    const bend = members.length >= 4 ? len * 0.11 : 0
    const cx = (a.x + b.x) / 2 + (dy / len) * bend
    const cy = (a.y + b.y) / 2 - (dx / len) * bend
    const unit = (x: number, y: number) => {
      const l = Math.hypot(x, y) || 1
      return [x / l, y / l] as const
    }
    const [sux, suy] = unit(cx - a.x, cy - a.y)
    const [ux, uy] = unit(b.x - cx, b.y - cy)
    const directional = r.kind !== 'peer'
    const sx = a.x + sux * (nodeR + 6)
    const sy = a.y + suy * (nodeR + 6)
    const tipX = b.x - ux * (nodeR + 5)
    const tipY = b.y - uy * (nodeR + 5)
    const ex = directional ? tipX - ux * 9 : b.x - ux * (nodeR + 6)
    const ey = directional ? tipY - uy * 9 : b.y - uy * (nodeR + 6)
    const d = `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`
    const hitD = `M${sx},${sy} Q${cx},${cy} ${tipX},${tipY}`
    const state = edgeState(r, selection, hover)
    // 2차 베지어의 t=0.5 지점
    const mx = 0.25 * sx + 0.5 * cx + 0.25 * ex
    const my = 0.25 * sy + 0.5 * cy + 0.25 * ey
    return { r, d, hitD, tipX, tipY, ux, uy, directional, state, mx, my }
  })

  // 선택된 선은 마지막에 그려서 다른 선 위로 올라오게 한다
  const order = { dim: 0, default: 1, hover: 2, active: 3 } as const
  const sortedEdges = [...edges].sort((p, q) => order[p.state] - order[q.state])
  const labelled = sortedEdges.filter((e) => e.state === 'hover' || e.state === 'active')

  return (
    <svg
      ref={svgRef}
      className="graph"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="group"
      aria-label="관계도"
      onClick={() => onSelect(null)}
    >
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="soft" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={SIZE} height={SIZE} fill={PAGE} />
      <g aria-hidden="true">
        {/* 천문도처럼 둥근 판 위에 그린다 */}
        <circle cx={C} cy={C} r={PLATE_R} fill={NIGHT} stroke={STARLIGHT} strokeOpacity={0.16} />
        <circle cx={C} cy={C} r={PLATE_R - 9} fill="none" stroke={STARLIGHT} strokeOpacity={0.07} />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={STARLIGHT} opacity={s.o} />
        ))}
        {members.length >= 3 && (
          <circle cx={C} cy={C} r={ringR(members.length)} fill="none" stroke={STARLIGHT} strokeOpacity={0.07} />
        )}
      </g>

      <g className="graph-edges">
        {sortedEdges.map(({ r, d, hitD, tipX, tipY, ux, uy, directional, state, mx, my }) => {
          const st = EDGE_STYLE[state]
          const head = state === 'active' ? 12 : state === 'hover' ? 10.5 : 9
          const half = head * 0.45
          const px = -uy
          const py = ux
          const baseX = tipX - ux * head
          const baseY = tipY - uy * head
          return (
            <g
              key={r.key}
              className="edge"
              style={{ opacity: st.opacity }}
              tabIndex={0}
              role="button"
              aria-label={`${r.title}. 자세히 보기`}
              aria-pressed={state === 'active'}
              onPointerEnter={mouseOnly(() => setHover({ type: 'edge', key: r.key }))}
              onPointerLeave={mouseOnly(() => setHover(null))}
              onFocus={() => setHover({ type: 'edge', key: r.key })}
              onBlur={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation()
                onSelect({ type: 'edge', key: r.key })
              }}
              onKeyDown={keySelect({ type: 'edge', key: r.key })}
            >
              <path
                d={d}
                fill="none"
                stroke={STARLIGHT}
                strokeDasharray={EDGE_DASH[r.kind]}
                strokeLinecap="round"
                style={{ strokeWidth: st.width }}
              />
              {directional && (
                <polygon
                  points={`${tipX},${tipY} ${baseX + px * half},${baseY + py * half} ${baseX - px * half},${baseY - py * half}`}
                  fill={STARLIGHT}
                />
              )}
              {r.badges.length > 0 && <circle cx={mx} cy={my} r={state === 'active' ? 4 : 3} fill={BADGE_GOLD} />}
              {/* 얇은 선도 잘 잡히도록 넓고 투명한 터치 영역 */}
              <path className="hit" d={hitD} fill="none" stroke="transparent" strokeWidth={18} />
            </g>
          )
        })}
      </g>

      <g className="graph-nodes">
        {members.map((m) => {
          const p = pos.get(m.person.id)!
          const stem = STEMS[m.chart.dayStem]
          const col = ELEMENT_COLOR[stem.element]
          const state = nodeState(m.person.id, relations, selection, hover)
          const cos = Math.cos(p.angle)
          const sin = Math.sin(p.angle)
          const lr = nodeR + 16
          const lx = p.x + cos * lr
          const ly = p.y + sin * lr
          const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
          const baseline = sin > 0.5 ? 'hanging' : sin < -0.5 ? 'auto' : 'middle'
          const opacity = state === 'dim' ? 0.3 : 1
          const ringOn = state === 'active' || state === 'hover'
          return (
            <g
              key={m.person.id}
              className="node"
              style={{ opacity }}
              tabIndex={0}
              role="button"
              aria-label={`${m.person.name}, ${stem.image}의 기운. 관계 보기`}
              aria-pressed={state === 'active'}
              onPointerEnter={mouseOnly(() => setHover({ type: 'node', id: m.person.id }))}
              onPointerLeave={mouseOnly(() => setHover(null))}
              onFocus={() => setHover({ type: 'node', id: m.person.id })}
              onBlur={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation()
                onSelect({ type: 'node', id: m.person.id })
              }}
              onKeyDown={keySelect({ type: 'node', id: m.person.id })}
            >
              <circle
                className="ring"
                cx={p.x}
                cy={p.y}
                r={nodeR + 7}
                fill="none"
                stroke={col.ring}
                strokeWidth={1.5}
                style={{ opacity: ringOn ? (state === 'active' ? 0.9 : 0.5) : 0 }}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill={col.fill}
                stroke={col.ring}
                strokeWidth={stem.element === 'water' ? 1.5 : 0}
                filter="url(#glow)"
              />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={col.ink}
                fontFamily={SERIF}
                fontSize={nodeR * 0.95}
              >
                {m.chart.dayStem}
              </text>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline={baseline}
                fill={STARLIGHT}
                fontFamily={SANS}
                fontSize={15}
                fontWeight={state === 'active' ? 700 : 500}
              >
                {m.person.name}
              </text>
            </g>
          )
        })}
      </g>

      <g className="graph-labels" pointerEvents="none">
        {labelled.map(({ r, mx, my, state }) => {
          const text = r.label + (r.badges.length ? ' ' + r.badges.map((b) => b.emoji).join('') : '')
          const active = state === 'active'
          const w = 22 + [...r.label].length * 13.5 + r.badges.length * 17
          const h = 26
          return (
            <g key={r.key}>
              <rect
                x={mx - w / 2}
                y={my - h / 2}
                width={w}
                height={h}
                rx={h / 2}
                fill={NIGHT}
                stroke={active ? STARLIGHT : STARLIGHT_DIM}
                strokeOpacity={active ? 0.9 : 0.5}
              />
              <text
                x={mx}
                y={my}
                textAnchor="middle"
                dominantBaseline="central"
                fill={active ? STARLIGHT : STARLIGHT_DIM}
                fontFamily={SANS}
                fontSize={13}
                fontWeight={active ? 700 : 500}
              >
                {text}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
