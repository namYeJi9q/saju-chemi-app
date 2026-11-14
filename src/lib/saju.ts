import { Solar } from 'lunar-javascript'

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export interface Person {
  id: string
  name: string
  /** YYYY-MM-DD (양력) */
  birthDate: string
  /** HH:mm, 모르면 null */
  birthTime: string | null
}

export interface Chart {
  year: string
  month: string
  day: string
  /** 태어난 시간을 모르면 null */
  hour: string | null
  dayStem: string
  dayBranch: string
}

export const STEMS: Record<
  string,
  { ko: string; element: Element; yang: boolean; image: string }
> = {
  甲: { ko: '갑', element: 'wood', yang: true, image: '큰 나무' },
  乙: { ko: '을', element: 'wood', yang: false, image: '들꽃' },
  丙: { ko: '병', element: 'fire', yang: true, image: '태양' },
  丁: { ko: '정', element: 'fire', yang: false, image: '촛불' },
  戊: { ko: '무', element: 'earth', yang: true, image: '큰 산' },
  己: { ko: '기', element: 'earth', yang: false, image: '정원의 흙' },
  庚: { ko: '경', element: 'metal', yang: true, image: '바위' },
  辛: { ko: '신', element: 'metal', yang: false, image: '보석' },
  壬: { ko: '임', element: 'water', yang: true, image: '바다' },
  癸: { ko: '계', element: 'water', yang: false, image: '이슬비' },
}

export const BRANCH_KO: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
}

export const ELEMENTS: Record<
  Element,
  { ko: string; hanja: string; name: string }
> = {
  wood: { ko: '목', hanja: '木', name: '나무' },
  fire: { ko: '화', hanja: '火', name: '불' },
  earth: { ko: '토', hanja: '土', name: '흙' },
  metal: { ko: '금', hanja: '金', name: '쇠' },
  water: { ko: '수', hanja: '水', name: '물' },
}

/** 甲寅 → 갑인 */
export function pillarKo(pillar: string): string {
  const [s, b] = [...pillar]
  return `${STEMS[s]?.ko ?? s}${BRANCH_KO[b] ?? b}`
}

/**
 * 한국 표준시(KST, 동경 135도)를 서울 기준 지방시에 가깝게 맞추기 위해 30분을 뺀다.
 * 날짜는 자정(보정 후 00:00, 즉 KST 00:30)에 바뀐다(야자시 방식).
 */
const KST_CORRECTION_MINUTES = 30

export function computeChart(person: Person): Chart | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.birthDate)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]

  let hour = 12
  let minute = 0
  const hasTime = person.birthTime != null && /^\d{2}:\d{2}$/.test(person.birthTime)
  if (hasTime) {
    const [h, mi] = person.birthTime!.split(':').map(Number)
    hour = h
    minute = mi
  }

  // 보정 시각 계산 (Date로 날짜 넘어감 처리)
  const base = new Date(Date.UTC(y, mo - 1, d, hour, minute))
  if (Number.isNaN(base.getTime())) return null
  if (hasTime) base.setUTCMinutes(base.getUTCMinutes() - KST_CORRECTION_MINUTES)

  try {
    const ec = Solar.fromYmdHms(
      base.getUTCFullYear(),
      base.getUTCMonth() + 1,
      base.getUTCDate(),
      base.getUTCHours(),
      base.getUTCMinutes(),
      0,
    )
      .getLunar()
      .getEightChar()
    ec.setSect(2)
    const day = ec.getDay()
    return {
      year: ec.getYear(),
      month: ec.getMonth(),
      day,
      hour: hasTime ? ec.getTime() : null,
      dayStem: day[0],
      dayBranch: day[1],
    }
  } catch {
    return null
  }
}
