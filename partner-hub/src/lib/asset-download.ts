import { fileDownloadPath } from './api'

export function isAssetAvailable(url?: string) {
  return Boolean(url && url !== '#')
}

function nomeDoArquivo(url: string, fileName?: string) {
  const bruto = String(fileName || '').trim()
  if (bruto) {
    return bruto.replace(/[\\/]+/g, '_').slice(0, 180)
  }

  try {
    const limpo = url.split('?')[0]
    const base = decodeURIComponent(limpo.substring(limpo.lastIndexOf('/') + 1))
    return base.replace(/[\\/]+/g, '_').slice(0, 180) || 'arquivo'
  } catch {
    return 'arquivo'
  }
}

function ehRotaDownloadLocal(url: string) {
  if (url.startsWith('/api/download/')) return true

  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname.startsWith('/api/download/')
  } catch {
    return false
  }
}

function dispararDownload(objectUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
}

/**
 * Força o download no disco.
 * URLs do Storage são cross-origin: o atributo download é ignorado e o
 * arquivo abre em outra aba. Por isso o arquivo passa pelo backend.
 */
export async function downloadAsset(url: string, fileName?: string) {
  const nome = nomeDoArquivo(url, fileName)
  const endpoint = ehRotaDownloadLocal(url)
    ? url
    : fileDownloadPath(url, nome)

  const resposta = await fetch(endpoint)
  if (!resposta.ok) {
    throw new Error(`Falha ao baixar arquivo: ${resposta.status}`)
  }

  const blob = await resposta.blob()
  const objectUrl = URL.createObjectURL(blob)
  dispararDownload(objectUrl, nome)
}

export function previewAsset(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
