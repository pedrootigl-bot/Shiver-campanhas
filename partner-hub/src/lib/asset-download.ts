export function isAssetAvailable(url?: string) {
  return Boolean(url && url !== '#')
}

export function downloadAsset(url: string, fileName?: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName ?? ''
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function previewAsset(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
