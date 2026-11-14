import type { Member, Relation } from '../lib/relations'
import { summarize } from '../lib/relations'
import { ELEMENTS, STEMS, pillarKo } from '../lib/saju'
import type { Selection } from '../lib/selection'
import { ELEMENT_COLOR } from '../lib/theme'
import { josa, particle } from '../lib/josa'

interface Props {
  members: Member[]
  relations: Relation[]
  selection: Selection
  onSelect: (s: Selection) => void
}

function Dot({ m }: { m: Member }) {
  const col = ELEMENT_COLOR[STEMS[m.chart.dayStem].element]
  return <span className="dot" style={{ background: col.fill, borderColor: col.ring }} aria-hidden="true" />
}

function basis(giver: Member, receiver: Member, kind: Relation['kind']) {
  const g = ELEMENTS[STEMS[giver.chart.dayStem].element]
  const r = ELEMENTS[STEMS[receiver.chart.dayStem].element]
  if (kind === 'peer') return `같은 ${g.ko}(${g.hanja}) 기운끼리 만난 관계예요.`
  const gi = `${g.ko}(${g.hanja})${particle(g.ko, '이/가')}`
  const re = `${r.ko}(${r.hanja})${particle(r.ko, '을/를')}`
  if (kind === 'support') return `${gi} ${re} 살리는 상생 관계예요.`
  return `${gi} ${re} 다스리는 상극 관계예요.`
}

export default function DetailPanel({ members, relations, selection, onSelect }: Props) {
  const byId = new Map(members.map((m) => [m.person.id, m]))

  if (selection?.type === 'edge') {
    const r = relations.find((x) => x.key === selection.key)
    if (!r) return null
    const a = byId.get(r.from)!
    const b = byId.get(r.to)!
    return (
      <div className="detail">
        <p className="pair">
          <button type="button" className="chip" onClick={() => onSelect({ type: 'node', id: a.person.id })}>
            <Dot m={a} />
            {a.person.name}
          </button>
          <span className="pair-arrow" aria-hidden="true">
            {r.kind === 'peer' ? '—' : '→'}
          </span>
          <button type="button" className="chip" onClick={() => onSelect({ type: 'node', id: b.person.id })}>
            <Dot m={b} />
            {b.person.name}
          </button>
        </p>
        <h2 className="detail-title">{r.title}</h2>
        <p className="detail-body">{r.description}</p>
        {r.badges.length > 0 && (
          <ul className="badges">
            {r.badges.map((badge) => (
              <li key={badge.kind}>
                <strong>
                  <span aria-hidden="true">{badge.emoji}</span> {badge.name}
                </strong>
                <span>{badge.text}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="basis">
          {a.person.name} {a.chart.dayStem}({STEMS[a.chart.dayStem].image}), {b.person.name} {b.chart.dayStem}(
          {STEMS[b.chart.dayStem].image}). {basis(a, b, r.kind)}
        </p>
      </div>
    )
  }

  if (selection?.type === 'node') {
    const m = byId.get(selection.id)
    if (!m) return null
    const s = summarize(m.person.id, relations)
    const stem = STEMS[m.chart.dayStem]
    const names = (ids: string[]) => ids.map((id) => byId.get(id)?.person.name).join(', ')
    const pillars = [
      { label: '시', value: m.chart.hour },
      { label: '일', value: m.chart.day },
      { label: '월', value: m.chart.month },
      { label: '년', value: m.chart.year },
    ]
    const rows = [
      { label: `${josa(m.person.name, '이/가')} 챙겨주는 사람`, ids: s.givesSupport },
      { label: `${josa(m.person.name, '을/를')} 챙겨주는 사람`, ids: s.getsSupport },
      { label: `${josa(m.person.name, '이/가')} 다듬어주는 사람`, ids: s.givesRefine },
      { label: `${josa(m.person.name, '을/를')} 다듬어주는 사람`, ids: s.getsRefine },
      { label: '결이 같은 사람', ids: s.peers },
    ].filter((row) => row.ids.length > 0)

    return (
      <div className="detail">
        <p className="pair">
          <Dot m={m} />
          <span className="person-element">{ELEMENTS[stem.element].name}의 기운</span>
        </p>
        <h2 className="detail-title">{m.person.name}</h2>
        <div className="pillars" role="list" aria-label="사주 기둥">
          {pillars.map((p) => (
            <div key={p.label} role="listitem" className={p.label === '일' ? 'pillar is-day' : 'pillar'}>
              <span className="pillar-hanja">{p.value ?? '··'}</span>
              <span className="pillar-label">{p.label}</span>
            </div>
          ))}
        </div>
        <p className="detail-body">
          {pillarKo(m.chart.day)} 일주, {josa(stem.image, '이에요/예요')}.
          {s.role && <> 이 모임에서는 {s.role}에 가까워요.</>}
        </p>
        {rows.length > 0 && (
          <dl className="flows">
            {rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{names(row.ids)}</dd>
              </div>
            ))}
          </dl>
        )}
        {s.badges.length > 0 && (
          <ul className="badges">
            {s.badges.map(({ with: other, badge }) => (
              <li key={other + badge.kind}>
                <strong>
                  <span aria-hidden="true">{badge.emoji}</span> {josa(byId.get(other)?.person.name ?? '', '과/와')} {badge.name}
                </strong>
              </li>
            ))}
          </ul>
        )}
        {!m.chart.hour && <p className="basis">태어난 시간을 넣으면 시주까지 볼 수 있어요.</p>}
      </div>
    )
  }

  return (
    <div className="detail detail-empty">
      <h2 className="detail-title">관계 읽는 법</h2>
      <p className="detail-body">선을 누르면 두 사람의 관계를, 사람을 누르면 그 사람이 모임 안에서 어떤 흐름에 있는지 보여 줘요.</p>
    </div>
  )
}
