import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '../lib/router'

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

/** 페이지를 새로 불러오지 않고 이동하는 링크. 새 탭 열기(⌘/Ctrl+클릭)는 브라우저 기본 동작을 따른다. */
export default function AppLink({ to, onClick, ...rest }: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handleClick} {...rest} />
}
