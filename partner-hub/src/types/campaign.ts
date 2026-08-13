export type CampaignStatus =
  | 'active'
  | 'coming-soon'
  | 'ending-soon'
  | 'finished'

export type CampaignObjective =
  | 'acquisition'
  | 'ftd'
  | 'redeposit'
  | 'retention'
  | 'volume'

export type MaterialType = 'story' | 'feed' | 'video' | 'banner' | 'other'

export type CopyChannel =
  | 'whatsapp'
  | 'telegram'
  | 'instagram'
  | 'reactivation'
  | 'commercial'

export type CampaignMaterial = {
  id: string
  type: MaterialType
  title: string
  thumbnail?: string
  url: string
  width?: number
  height?: number
}

export type CampaignCopy = {
  id: string
  channel: CopyChannel
  title: string
  text: string
}

export type SellingAngle = {
  title: string
  description: string
}

export type TodayRecommendation = {
  title: string
  description: string
  copy?: string
  featuredMaterialId?: string
}

export type Campaign = {
  id: string
  slug: string
  name: string
  headline: string
  status: CampaignStatus
  featured?: boolean
  priority?: number
  startDate: string
  endDate: string
  coupon?: string
  minimumDeposit?: number
  prize?: string
  description: string
  objectives: CampaignObjective[]
  targetAudience?: string[]
  mechanics?: string[]
  sellingAngles?: SellingAngle[]
  todayRecommendation?: TodayRecommendation
  materials: CampaignMaterial[]
  copies?: CampaignCopy[]
  rules?: string[]
  eligibility?: string[]
  restrictions?: string[]
  notes?: string[]
  officialRulesUrl?: string
  kitUrl?: string
  heroImage?: string
  cardImage: string
  /** Imagem vertical (stories) para o painel do calendário, quando existir */
  storyImage?: string
  accent?: string
}
