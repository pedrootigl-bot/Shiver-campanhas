import { useCallback, useMemo, useState } from 'react'
import type { Campaign } from './types/campaign'
import { useCampaigns } from './hooks/useCampaigns'
import {
  getFeaturedCampaign,
  getPartnerStats,
  isActiveOnHub,
  withResolvedStatus,
} from './lib/campaign-utils'
import { SplashScreen } from './components/SplashScreen'
import { PartnerHeader } from './components/partner-hub/PartnerHeader'
import { ShiverHero } from './components/partner-hub/ShiverHero'
import { PartnerStats } from './components/partner-hub/PartnerStats'
import { TodayRecommendation } from './components/partner-hub/TodayRecommendation'
import { CampaignCoverflow } from './components/partner-hub/CampaignCoverflow'
import { CampaignDrawer } from './components/partner-hub/CampaignDrawer'
import { EndingSoon } from './components/partner-hub/EndingSoon'
import { MomentumBanner } from './components/partner-hub/MomentumBanner'
import { CampaignTimeline } from './components/partner-hub/CampaignTimeline'
import { PersonalizedCampaignTeaser } from './components/partner-hub/PersonalizedCampaignTeaser'
import { PartnerSupport } from './components/partner-hub/PartnerSupport'

type DrawerState = {
  campaign: Campaign | null
  tab: 'overview' | 'materials' | 'copies' | 'rules'
}

function App() {
  const { campaigns, stats: apiStats, loading, error } = useCampaigns()
  const [splashDone, setSplashDone] = useState(false)
  const [drawer, setDrawer] = useState<DrawerState>({
    campaign: null,
    tab: 'overview',
  })

  const resolvedCampaigns = useMemo(
    () =>
      campaigns
        .map((c) => withResolvedStatus(c))
        .filter((c) => isActiveOnHub(c.status)),
    [campaigns],
  )
  const featured = useMemo(
    () => getFeaturedCampaign(resolvedCampaigns),
    [resolvedCampaigns],
  )
  const stats = useMemo(() => {
    const locais = getPartnerStats(resolvedCampaigns)
    if (!apiStats) return locais
    return {
      activeCampaigns: Number(apiStats.campanhas) || locais.activeCampaigns,
      materials: Number(apiStats.materiais) || locais.materials,
      copies: Number(apiStats.copies) || locais.copies,
      videos: Number(apiStats.videos) || locais.videos,
    }
  }, [apiStats, resolvedCampaigns])
  const todayCampaign =
    resolvedCampaigns.find(
      (c) => c.todayRecommendation && c.status !== 'finished',
    ) ?? featured

  const openCampaign = useCallback(
    (campaign: Campaign, tab: DrawerState['tab'] = 'overview') => {
      setDrawer({ campaign, tab })
    },
    [],
  )

  const closeDrawer = useCallback(() => {
    setDrawer({ campaign: null, tab: 'overview' })
  }, [])

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div
        className={
          splashDone
            ? 'relative z-[1] opacity-100 transition-opacity duration-500'
            : 'relative z-[1] opacity-0'
        }
      >
        <div className="page-glow" aria-hidden="true" />
        <div className="page-orbs" aria-hidden="true">
          <span className="page-orb page-orb--a" />
          <span className="page-orb page-orb--b" />
          <span className="page-orb page-orb--c" />
        </div>
        <PartnerHeader />

        <main className={splashDone ? 'site-enter' : ''}>
          {error ? (
            <p className="container py-6 text-sm text-red-300" role="alert">
              Não foi possível carregar as campanhas. Confira se a API está na
              porta 3000.
            </p>
          ) : null}

          <ShiverHero
            ready={splashDone}
            campaigns={resolvedCampaigns}
            onExploreCampaigns={() => {
              document
                .getElementById('campanhas')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
            onOpenMaterials={() => {
              if (featured) openCampaign(featured, 'materials')
            }}
          />

          <PartnerStats {...stats} />

          {!loading && todayCampaign ? (
            <TodayRecommendation
              campaign={todayCampaign}
              onOpenKit={(c) => openCampaign(c, 'materials')}
            />
          ) : null}

          <CampaignCoverflow
            campaigns={resolvedCampaigns}
            onOpen={(c) => openCampaign(c, 'overview')}
            onDownload={(c) => openCampaign(c, 'materials')}
          />

          <EndingSoon
            campaigns={resolvedCampaigns}
            onPromote={(c) => openCampaign(c, 'overview')}
          />

          <MomentumBanner />

          <CampaignTimeline
            campaigns={resolvedCampaigns}
            onSelect={(c) => openCampaign(c, 'overview')}
          />

          <PersonalizedCampaignTeaser />
          <PartnerSupport />
        </main>

        <footer className="border-t border-[var(--color-line)] py-8">
          <div className="container flex flex-col gap-2 text-sm text-[var(--color-muted-2)] md:flex-row md:items-center md:justify-between site-footer-enter">
            <div className="flex items-center gap-3">
              <span className="font-display text-sm tracking-[0.14em] text-[var(--color-text)] uppercase">
                Shiver Broker
              </span>
              <p className="font-display text-sm tracking-[0.08em] text-[var(--color-muted)] uppercase">
                Partner Hub
              </p>
            </div>
            <p>Central operacional de campanhas para afiliados e parceiros.</p>
          </div>
        </footer>
      </div>

      <CampaignDrawer
        campaign={drawer.campaign}
        initialTab={drawer.tab}
        onClose={closeDrawer}
      />
    </>
  )
}

export default App
