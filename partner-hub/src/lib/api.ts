const API_URL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

export type StatsApi = {
  campanhas?: number
  materiais?: number
  copies?: number
  videos?: number
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`
  let ultimoErro: Error | null = null

  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    try {
      const resposta = await fetch(url)
      if (!resposta.ok) {
        throw new Error(`Falha em ${path}: ${resposta.status}`)
      }
      return (await resposta.json()) as T
    } catch (erro) {
      ultimoErro = erro instanceof Error ? erro : new Error(String(erro))
      if (tentativa < 3) {
        await new Promise((resolve) => setTimeout(resolve, 250 * tentativa))
      }
    }
  }

  throw ultimoErro ?? new Error(`Falha em ${path}`)
}

export function fetchPartnerHubCampanhas() {
  return getJson<unknown[]>("/api/partner-hub/campanhas")
}

export function fetchStats() {
  return getJson<StatsApi>("/api/stats")
}

export function kitDownloadPath(campanhaId: string | number) {
  return `${API_URL}/api/download/kit/${campanhaId}`
}
