/** 이름 뒤에 붙는 조사를 받침 유무에 맞춰 고른다. 한글이 아니면 받침 없음으로 본다. */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1)
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

type Pair = '이/가' | '은/는' | '을/를' | '과/와' | '이랑/랑' | '이에요/예요'

export function josa(word: string, pair: Pair): string {
  const [withB, withoutB] = pair.split('/')
  return `${word}${hasBatchim(word) ? withB : withoutB}`
}

/** 조사만 돌려준다. 단어 뒤에 괄호 등이 붙을 때 쓴다. */
export function particle(word: string, pair: Pair): string {
  const [withB, withoutB] = pair.split('/')
  return hasBatchim(word) ? withB : withoutB
}
