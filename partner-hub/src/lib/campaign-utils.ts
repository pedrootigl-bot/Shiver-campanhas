import type {
  Campaign,
  CampaignObjective,
  CampaignStatus,
  MaterialType,
} from '../types/campaign'

const DAY_MS = 1000 * 60 * 60 * 24
const ENDING_SOON_DAYS = 5

export const objectiveLabels: Record<CampaignObjective, string> = {
  acquisition: 'Aquisição',
  ftd: 'FTD',
  redeposit: 'Redepósito',
  retention: 'Retenção',
  volume: 'Volume',
}

export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Ativa',
  'coming-soon': 'Em breve',
  'ending-soon': 'Últimos dias',
  finished: 'Encerrada',
}

export const materialLabels: Record<MaterialType, string> = {
  story: 'Stories',
  feed: 'Feed',
  video: 'Vídeos',
  banner: 'Banners',
  other: 'Outros',
}

export function parseDate(value: string) {
  return new Date(`${value}T23:59:59`)
}

export function getDaysRemaining(endDate: string, now = new Date()) {
  const end = parseDate(endDate)
  return Math.ceil((end.getTime() - now.getTime()) / DAY_MS)
}

export function resolveCampaignStatus(
  campaign: Campaign,
  now = new Date(),
): CampaignStatus {
  const start = new Date(`${campaign.startDate}T00:00:00`)
  const end = parseDate(campaign.endDate)

  if (now < start) return 'coming-soon'
  if (now > end) return 'finished'

  const daysLeft = getDaysRemaining(campaign.endDate, now)
  if (daysLeft <= ENDING_SOON_DAYS) return 'ending-soon'
  return 'active'
}

export function withResolvedStatus(campaign: Campaign, now = new Date()): Campaign {
  return { ...campaign, status: resolveCampaignStatus(campaign, now) }
}

export function isActiveOnHub(status: CampaignStatus): boolean {
  switch (status) {
    case 'active':
    case 'ending-soon':
      return true
    case 'coming-soon':
    case 'finished':
      return false
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function formatPeriod(startDate: string, endDate: string) {
  const fmt = (value: string) => {
    const [, m, d] = value.split('-')
    return `${d}/${m}`
  }
  return `${fmt(startDate)} — ${fmt(endDate)}`
}

export function formatLongPeriod(startDate: string, endDate: string) {
  const months = [
    'JAN',
    'FEV',
    'MAR',
    'ABR',
    'MAI',
    'JUN',
    'JUL',
    'AGO',
    'SET',
    'OUT',
    'NOV',
    'DEZ',
  ]
  const fmt = (value: string) => {
    const [, m, d] = value.split('-')
    return `${d} DE ${months[Number(m) - 1]}`
  }
  return `${fmt(startDate)} — ${fmt(endDate)}`
}

export function formatCurrencyBRL(value?: number) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function countMaterialsByType(campaign: Campaign) {
  return campaign.materials.reduce(
    (acc, material) => {
      acc[material.type] = (acc[material.type] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<MaterialType, number>>,
  )
}

export function getFeaturedCampaign(campaigns: Campaign[]) {
  const resolved = campaigns.map((c) => withResolvedStatus(c))
  return (
    resolved
      .filter((c) => c.featured && c.status !== 'finished')
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ??
    resolved
      .filter((c) => c.status === 'active' || c.status === 'ending-soon')
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ??
    resolved[0]
  )
}

export function getPartnerStats(campaigns: Campaign[]) {
  const resolved = campaigns.map((c) => withResolvedStatus(c))
  const active = resolved.filter(
    (c) => c.status === 'active' || c.status === 'ending-soon',
  )
  const materials = resolved.reduce((sum, c) => sum + c.materials.length, 0)
  const copies = resolved.reduce((sum, c) => sum + (c.copies?.length ?? 0), 0)
  const videos = resolved.reduce(
    (sum, c) => sum + c.materials.filter((m) => m.type === 'video').length,
    0,
  )

  return {
    activeCampaigns: active.length,
    materials,
    copies,
    videos,
  }
}

export function getEndingSoonCampaigns(campaigns: Campaign[]) {
  return campaigns
    .map((c) => withResolvedStatus(c))
    .filter((c) => c.status === 'ending-soon')
    .sort((a, b) => parseDate(a.endDate).getTime() - parseDate(b.endDate).getTime())
}

export function getTimelineCampaigns(campaigns: Campaign[]) {
  return [...campaigns].sort(
    (a, b) =>
      new Date(`${a.startDate}T00:00:00`).getTime() -
      new Date(`${b.startDate}T00:00:00`).getTime(),
  )
}

export function getCampaignProgress(campaign: Campaign, now = new Date()) {
  const start = new Date(`${campaign.startDate}T00:00:00`).getTime()
  const end = parseDate(campaign.endDate).getTime()
  if (end <= start) return 100
  const progress = ((now.getTime() - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, progress))
}

export function filterCampaigns(
  campaigns: Campaign[],
  objective: CampaignObjective | 'all',
) {
  const resolved = campaigns.map((c) => withResolvedStatus(c))
  const visible = resolved.filter((c) => isActiveOnHub(c.status))
  if (objective === 'all') {
    return visible.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }
  return visible
    .filter((c) => c.objectives.includes(objective))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
