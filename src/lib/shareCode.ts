/**
 * 공유 코드: 맞히기 어려운 랜덤 10글자.
 * 헷갈리는 글자(0/O, 1/l/I)는 빼서, 누가 손으로 옮겨 적어도 틀리지 않게 한다.
 * 57가지 글자 × 10자리 ≈ 3.6 × 10^17 가지라 겹칠 걱정은 사실상 없다.
 */
const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateShareCode(length = 10): string {
  const bytes = new Uint8Array(length * 2)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) {
    // 고르게 뽑히도록 알파벳 길이의 배수 안쪽 값만 쓴다
    if (b >= 256 - (256 % ALPHABET.length)) continue
    out += ALPHABET[b % ALPHABET.length]
    if (out.length === length) return out
  }
  return out + generateShareCode(length - out.length)
}

export function shareUrl(code: string): string {
  return `${window.location.origin}/g/${code}`
}
