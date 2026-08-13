import { Download, Info } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import { useCountdown } from '../../hooks/useCountdown'
import {
  formatCurrencyBRL,
  formatLongPeriod,
  statusLabels,
} from '../../lib/campaign-utils'
import { ActionButton } from '../ui/ActionButton'
import { SoftButton } from '../ui/SoftButton'

type FeaturedCampaignHeroProps = {
  campaign: Campaign
  onOpenMaterials: (campaign: Campaign) => void
  onOpenDetails: (campaign: Campaign) => void
}

function SubtleEndDate({ endDate }: { endDate: string }) {
  const countdown = useCountdown(endDate)
  const [, m, d] = endDate.split('-')
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
  const endLabel = `${d} ${months[Number(m) - 1]}`

  return (
    <div className="pointer-events-none absolute top-[5px] left-[5px] z-[2]">
      <div className="rounded-lg border border-white/10 bg-[rgba(7,9,8,0.28)] px-2.5 py-1.5 backdrop-blur-[6px]">
        <p className="text-[0.58rem] font-medium tracking-[0.12em] text-white/45 uppercase">
          {countdown.expired ? 'Encerrada' : 'Termina'}
        </p>
        <p className="mt-0.5 font-display text-[0.78rem] font-medium tabular-nums text-white/55">
          {endLabel}
          {!countdown.expired && (
            <span className="ml-1.5 text-white/35">
              {String(countdown.days).padStart(2, '0')}d{' '}
              {String(countdown.hours).padStart(2, '0')}h
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export function FeaturedCampaignHero({
  campaign,
  onOpenMaterials,
  onOpenDetails,
}: FeaturedCampaignHeroProps) {
  return (
    <section id="top" className="hero-section">
      <div className="container hero-section__grid grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10">
        <div className="fade-up order-2 lg:order-1 lg:min-w-0">
          <h1 className="font-display mb-3 max-w-[16ch] text-[clamp(1.9rem,4.2vw,3.15rem)] leading-[1.05] font-semibold text-[var(--color-text)] lg:mb-4">
            {campaign.headline}
          </h1>

          <p className="mb-4 max-w-xl text-[0.95rem] leading-relaxed text-[var(--color-muted)] lg:mb-5 lg:line-clamp-3">
            {campaign.description}
          </p>

          <p className="mb-4 text-[0.75rem] font-medium tracking-[0.06em] text-[var(--color-muted)] uppercase lg:mb-5">
            {formatLongPeriod(campaign.startDate, campaign.endDate)}
          </p>

          <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center lg:mb-5">
            <ActionButton
              icon={<Download size={16} />}
              onClick={() => onOpenMaterials(campaign)}
            >
              Acessar materiais
            </ActionButton>
            <SoftButton icon={<Info size={16} />} onClick={() => onOpenDetails(campaign)}>
              Entender campanha
            </SoftButton>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:mb-0">
            {campaign.coupon && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-3.5 py-2.5">
                <div className="text-[0.62rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                  Cupom
                </div>
                <div className="mt-1 font-display text-[0.95rem] font-semibold text-[var(--color-green)]">
                  {campaign.coupon}
                </div>
              </div>
            )}
            {campaign.minimumDeposit != null && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-3.5 py-2.5">
                <div className="text-[0.62rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                  Depósito mín.
                </div>
                <div className="mt-1 font-display text-[0.95rem] font-semibold">
                  {formatCurrencyBRL(campaign.minimumDeposit)}
                </div>
              </div>
            )}
            {campaign.prize && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-3.5 py-2.5">
                <div className="text-[0.62rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                  Prêmio
                </div>
                <div className="mt-1 line-clamp-1 font-display text-sm font-semibold">
                  {campaign.prize}
                </div>
              </div>
            )}
          </div>

          {campaign.targetAudience && campaign.targetAudience.length > 0 && (
            <div className="mt-5 hidden lg:block">
              <p className="mb-1.5 text-[0.65rem] font-medium tracking-[0.14em] text-[var(--color-green)] uppercase">
                Foco recomendado
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {campaign.targetAudience.join(' · ')}
              </p>
            </div>
          )}
        </div>

        <div className="fade-up fade-up-delay-2 order-1 lg:order-2">
          <div className="hero-section__visual relative overflow-hidden rounded-[18px] border border-[var(--color-line)] bg-[var(--color-card)]">
            <img
              src={campaign.heroImage ?? campaign.cardImage}
              alt={`Arte da campanha ${campaign.name}`}
              className="aspect-[4/5] w-full object-cover sm:aspect-[3/4] lg:aspect-auto"
            />

            <SubtleEndDate endDate={campaign.endDate} />

            <div className="absolute top-[5px] right-[5px] z-[2] max-w-[calc(100%-7rem)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[rgba(7,9,8,0.35)] px-3 py-1.5 text-[0.6rem] font-medium tracking-[0.1em] text-white/75 uppercase backdrop-blur-md">
                Destaque · {statusLabels[campaign.status]}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(7,9,8,0.92)] via-[rgba(7,9,8,0.35)] to-transparent p-5 pt-16">
              <p className="font-display text-lg font-semibold text-[var(--color-text)]">
                {campaign.name}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{campaign.headline}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
