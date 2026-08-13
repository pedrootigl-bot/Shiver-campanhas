import { useEffect, useState } from "react"
import type { Campaign } from "../types/campaign"
import {
  fetchPartnerHubCampanhas,
  fetchStats,
  type StatsApi,
} from "../lib/api"
import { mapCampanhasToCampaigns } from "../lib/map-campaign"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<StatsApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const [dados, indicadores] = await Promise.all([
          fetchPartnerHubCampanhas(),
          fetchStats().catch(() => null),
        ])
        if (!ativo) return
        setCampaigns(mapCampanhasToCampaigns(Array.isArray(dados) ? dados : []))
        setStats(indicadores)
        setError(null)
      } catch (err) {
        if (!ativo) return
        setError(
          err instanceof Error ? err.message : "Erro ao carregar campanhas",
        )
      } finally {
        if (ativo) setLoading(false)
      }
    }

    void carregar()
    return () => {
      ativo = false
    }
  }, [])

  return { campaigns, stats, loading, error }
}
