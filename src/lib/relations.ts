import { ELEMENTS, STEMS, type Chart, type Element, type Person } from './saju'
import { josa } from './josa'

export interface Member {
  person: Person
  chart: Chart
}

export type RelationKind = 'support' | 'refine' | 'peer'

export type BadgeKind = 'stemCombo' | 'branchCombo' | 'clash' | 'punish'

export interface Badge {
  kind: BadgeKind
  emoji: string
  name: string
  text: string
}

export interface Relation {
  key: string
  kind: RelationKind
  /** support/refine: 화살표 시작(주는 쪽). peer: 그냥 a */
  from: string
  /** support/refine: 화살표 끝(받는 쪽). peer: 그냥 b */
  to: string
  label: string
  title: string
  description: string
  badges: Badge[]
}

const GENERATES: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

const CONTROLS: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

const SUPPORT_METAPHOR: Record<string, string> = {
  'wood>fire': '나무가 불씨를 키우듯',
  'fire>earth': '불이 남긴 재가 흙을 기름지게 하듯',
  'earth>metal': '흙 속에서 보석이 단단해지듯',
  'metal>water': '바위 틈에서 맑은 물이 솟아나듯',
  'water>wood': '물이 나무를 자라게 하듯',
}

const REFINE_METAPHOR: Record<string, string> = {
  'wood>earth': '나무 뿌리가 흙을 붙잡아 단단하게 하듯',
  'earth>water': '둑이 물길을 잡아 흐름을 만들어 주듯',
  'water>fire': '물이 과열된 불을 알맞게 식혀 주듯',
  'fire>metal': '불이 쇠를 달궈 작품으로 단련하듯',
  'metal>wood': '조각칼이 나무를 다듬어 모양을 잡아 주듯',
}

const STEM_COMBOS = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸']
const BRANCH_COMBOS = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']
const CLASHES = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']
const PUNISHMENTS = ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯', '辰辰', '午午', '酉酉', '亥亥']

function pairIn(list: string[], a: string, b: string): boolean {
  return list.includes(a + b) || list.includes(b + a)
}

const BADGES: Record<BadgeKind, Omit<Badge, 'kind'>> = {
  stemCombo: {
    emoji: '🤝',
    name: '천간합',
    text: '처음 만났을 때부터 묘하게 끌리는 사이예요. 서로의 빈 곳을 자연스럽게 채워 줘요.',
  },
  branchCombo: {
    emoji: '🔗',
    name: '육합',
    text: '함께 있으면 마음이 편안해지는 사이예요. 생활의 리듬이 잘 맞아요.',
  },
  clash: {
    emoji: '⚡',
    name: '충',
    text: '만나면 에너지가 확 바뀌는 사이예요. 서로를 움직이게 하는 자극제가 되어 줘요.',
  },
  punish: {
    emoji: '🔥',
    name: '형',
    text: '부딪히면서 서로를 단련하는 사이예요. 대화의 온도만 맞추면 최고의 파트너가 돼요.',
  },
}

function badgesFor(a: Chart, b: Chart): Badge[] {
  const out: Badge[] = []
  const push = (kind: BadgeKind) => out.push({ kind, ...BADGES[kind] })
  if (pairIn(STEM_COMBOS, a.dayStem, b.dayStem)) push('stemCombo')
  if (pairIn(BRANCH_COMBOS, a.dayBranch, b.dayBranch)) push('branchCombo')
  if (pairIn(CLASHES, a.dayBranch, b.dayBranch)) push('clash')
  if (pairIn(PUNISHMENTS, a.dayBranch, b.dayBranch)) push('punish')
  return out
}

export function pairKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`
}

function describe(giver: Member, receiver: Member, kind: RelationKind) {
  const g = giver.person.name
  const r = receiver.person.name
  const gStem = STEMS[giver.chart.dayStem]
  const rStem = STEMS[receiver.chart.dayStem]
  const k = `${gStem.element}>${rStem.element}`

  if (kind === 'support') {
    return {
      label: '챙겨줌',
      title: `${josa(g, '이/가')} ${josa(r, '을/를')} 챙겨주는 사이`,
      description: `${SUPPORT_METAPHOR[k]}, ${g}의 ${gStem.image} 기운이 ${r}의 ${rStem.image}에 힘을 실어 줘요. ${josa(g, '은/는')} ${r}에게 곁에 있는 것만으로 든든한 사람이에요.`,
    }
  }
  return {
    label: '다듬어줌',
    title: `${josa(g, '이/가')} ${josa(r, '을/를')} 다듬어주는 사이`,
    description: `${REFINE_METAPHOR[k]}, ${josa(g, '은/는')} ${r}에게 좋은 자극을 주는 사람이에요. 가끔은 쓴소리처럼 들려도 결국 ${josa(r, '을/를')} 한 뼘 더 자라게 해요.`,
  }
}

function describePeer(a: Member, b: Member) {
  const an = a.person.name
  const bn = b.person.name
  const as = STEMS[a.chart.dayStem]
  const bs = STEMS[b.chart.dayStem]
  const el = ELEMENTS[as.element].name
  if (a.chart.dayStem === b.chart.dayStem) {
    return {
      label: '같은 결',
      title: `${josa(an, '과/와')} ${bn}, 꼭 닮은 사이`,
      description: `둘 다 ${as.image}의 기운을 타고났어요. 말하지 않아도 통하는 동료이자, 서로를 끌어올리는 선의의 라이벌이에요.`,
    }
  }
  return {
    label: '같은 결',
    title: `${josa(an, '과/와')} ${bn}, 결이 같은 사이`,
    description: `같은 ${el}의 기운이지만 ${josa(an, '은/는')} ${as.image}, ${josa(bn, '은/는')} ${josa(bs.image, '이에요/예요')}. 비슷해서 편하고, 조금 달라서 서로 배울 게 많은 사이예요.`,
  }
}

export function relate(a: Member, b: Member): Relation {
  const ea = STEMS[a.chart.dayStem].element
  const eb = STEMS[b.chart.dayStem].element
  const key = pairKey(a.person.id, b.person.id)
  const badges = badgesFor(a.chart, b.chart)

  if (ea === eb) {
    return { key, kind: 'peer', from: a.person.id, to: b.person.id, badges, ...describePeer(a, b) }
  }
  if (GENERATES[ea] === eb) {
    return { key, kind: 'support', from: a.person.id, to: b.person.id, badges, ...describe(a, b, 'support') }
  }
  if (GENERATES[eb] === ea) {
    return { key, kind: 'support', from: b.person.id, to: a.person.id, badges, ...describe(b, a, 'support') }
  }
  if (CONTROLS[ea] === eb) {
    return { key, kind: 'refine', from: a.person.id, to: b.person.id, badges, ...describe(a, b, 'refine') }
  }
  return { key, kind: 'refine', from: b.person.id, to: a.person.id, badges, ...describe(b, a, 'refine') }
}

export function buildRelations(members: Member[]): Relation[] {
  const out: Relation[] = []
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      out.push(relate(members[i], members[j]))
    }
  }
  return out
}

export interface PersonSummary {
  givesSupport: string[]
  getsSupport: string[]
  givesRefine: string[]
  getsRefine: string[]
  peers: string[]
  badges: { with: string; badge: Badge }[]
  role: string
}

const ROLES = [
  { key: 'givesSupport', text: '모두를 든든하게 받쳐 주는 버팀목' },
  { key: 'givesRefine', text: '모두를 한 뼘씩 자라게 하는 코치' },
  { key: 'peers', text: '누구와도 결을 맞추는 동료형' },
  { key: 'getsSupport', text: '주변의 응원을 받으며 크는 사람' },
  { key: 'getsRefine', text: '자극 속에서 가장 크게 성장하는 사람' },
] as const

export function summarize(id: string, relations: Relation[]): PersonSummary {
  const s: PersonSummary = {
    givesSupport: [],
    getsSupport: [],
    givesRefine: [],
    getsRefine: [],
    peers: [],
    badges: [],
    role: '',
  }
  for (const r of relations) {
    if (r.from !== id && r.to !== id) continue
    const other = r.from === id ? r.to : r.from
    if (r.kind === 'peer') s.peers.push(other)
    else if (r.kind === 'support') (r.from === id ? s.givesSupport : s.getsSupport).push(other)
    else (r.from === id ? s.givesRefine : s.getsRefine).push(other)
    for (const badge of r.badges) s.badges.push({ with: other, badge })
  }
  let best = 0
  for (const role of ROLES) {
    const n = s[role.key].length
    if (n > best) {
      best = n
      s.role = role.text
    }
  }
  return s
}
