import { useEffect, useState } from 'react'

export type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calc(endDate: string): Countdown {
  const end = new Date(`${endDate}T23:59:59`).getTime()
  const diff = end - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, expired: false }
}

export function useCountdown(endDate: string) {
  const [value, setValue] = useState(() => calc(endDate))

  useEffect(() => {
    setValue(calc(endDate))
    const id = window.setInterval(() => setValue(calc(endDate)), 1000)
    return () => window.clearInterval(id)
  }, [endDate])

  return value
}
