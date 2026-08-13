import { useEffect } from 'react'

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    document.body.classList.add('scroll-locked')
    return () => document.body.classList.remove('scroll-locked')
  }, [locked])
}
