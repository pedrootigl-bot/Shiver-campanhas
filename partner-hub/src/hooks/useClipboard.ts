import { useCallback, useState } from 'react'

export function useClipboard(resetMs = 1800) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = useCallback(
    async (text: string, id = 'default') => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedId(id)
        window.setTimeout(() => {
          setCopiedId((current) => (current === id ? null : current))
        }, resetMs)
        return true
      } catch {
        return false
      }
    },
    [resetMs],
  )

  return { copiedId, copy, isCopied: (id = 'default') => copiedId === id }
}
