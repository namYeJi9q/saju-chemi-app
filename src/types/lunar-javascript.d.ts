declare module 'lunar-javascript' {
  export class EightChar {
    setSect(sect: 1 | 2): void
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    getDayGan(): string
    getDayZhi(): string
  }

  export class Lunar {
    getEightChar(): EightChar
  }

  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar
    getLunar(): Lunar
  }
}
