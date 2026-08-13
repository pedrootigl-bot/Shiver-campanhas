import { useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import {
  formatCurrencyBRL,
  formatLongPeriod,
  statusLabels,
} from '../../lib/campaign-utils'
import { HoverExpand } from '../effects/HoverExpand'
import { ActionButton } from '../ui/ActionButton'
import { SoftButton } from '../ui/SoftButton'
import { FadeIn } from '../ui/FadeIn'

type CampaignCoverflowProps = {
  campaigns: Campaign[]
  onOpen: (campaign: Campaign) => void
  onDownload: (campaign: Campaign) => void
}

export function CampaignCoverflow({
  campaigns,
  onOpen,
  onDownload,
}: CampaignCoverflowProps) {
  const images = useMemo(
    () =>
      campaigns.map((c, index) => ({
        src: c.cardImage || c.heroImage || '',
        alt: c.name,
        title: c.name,
        code: `# ${String(index + 1).padStart(2, '0')}`,
      })),
    [campaigns],
  )

  const featuredIndex = Math.max(
    0,
    campaigns.findIndex((c) => c.featured),
  )
  const [active, setActive] = useState(featuredIndex === -1 ? 0 : featuredIndex)
  const campaign = campaigns[active] ?? campaigns[0]

  if (!campaign) return null

  return (
    <section id="campanhas" className="section campaign-coverflow">
      <div className="container">
        <FadeIn variant="blur" durationMs={900}>
          <div className="section-heading">
            <p className="section-kicker">Campanhas</p>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.35rem)] leading-tight">
              Escolha a campanha e acelere
            </h2>
            <p className="mt-2 max-w-xl text-[var(--color-muted)]">
              Passe o mouse nas artes para expandir e veja os detalhes ao lado
              para baixar o kit.
            </p>
          </div>
        </FadeIn>

        <div className="campaign-coverflow__layout">
          <FadeIn variant="left" delayMs={80} durationMs={900}>
            <div className="campaign-coverflow__stage campaign-coverflow__stage--expand">
              <HoverExpand
                images={images}
                activeIndex={active}
                onActiveChange={setActive}
              />
            </div>
          </FadeIn>

          <FadeIn variant="right" delayMs={140} durationMs={900}>
            <div
              key={campaign.id}
              className="campaign-coverflow__panel panel-swap"
            >
              <div className="campaign-coverflow__meta">
                <span className="campaign-coverflow__status">
                  {statusLabels[campaign.status]}
                </span>
                <h3 className="font-display text-[clamp(1.35rem,2.5vw,1.85rem)]">
                  {campaign.name}
                </h3>
                <p className="mt-1 text-lg text-[var(--color-text)]">
                  {campaign.headline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                  {campaign.description}
                </p>
                <p className="mt-3 text-[0.72rem] font-medium tracking-[0.08em] text-[var(--color-muted)] uppercase">
                  {formatLongPeriod(campaign.startDate, campaign.endDate)}
                </p>
              </div>

              <div className="campaign-coverflow__stats">
                {campaign.coupon && (
                  <div className="campaign-coverflow__stat">
                    <span>Cupom</span>
                    <strong>{campaign.coupon}</strong>
                  </div>
                )}
                {campaign.minimumDeposit != null && (
                  <div className="campaign-coverflow__stat">
                    <span>Depósito mín.</span>
                    <strong>{formatCurrencyBRL(campaign.minimumDeposit)}</strong>
                  </div>
                )}
                {campaign.prize && (
                  <div className="campaign-coverflow__stat">
                    <span>Prêmio</span>
                    <strong>{campaign.prize}</strong>
                  </div>
                )}
              </div>

              <div className="campaign-coverflow__actions">
                <ActionButton
                  icon={<Download size={16} />}
                  onClick={() => onDownload(campaign)}
                >
                  Baixar materiais
                </ActionButton>
                <SoftButton
                  icon={<Info size={16} />}
                  onClick={() => onOpen(campaign)}
                >
                  Ver detalhes
                </SoftButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
