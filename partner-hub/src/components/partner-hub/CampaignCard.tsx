import { ArrowRight, Download } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import {
  formatCurrencyBRL,
  formatPeriod,
  objectiveLabels,
  statusLabels,
} from '../../lib/campaign-utils'
import { ActionButton } from '../ui/ActionButton'
import { SoftButton } from '../ui/SoftButton'

type CampaignCardProps = {
  campaign: Campaign
  onOpen: (campaign: Campaign) => void
  onDownload: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onOpen, onDownload }: CampaignCardProps) {
  return (
    <article className="campaign-card flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-[var(--color-card)] sm:w-[320px]">
      <div className="relative overflow-hidden bg-[#0a0d0b]">
        <img
          src={campaign.cardImage}
          alt={`Banner ${campaign.name}`}
          className="campaign-card__image aspect-[718/548] w-full object-contain"
          loading="lazy"
        />
        <span className="absolute top-2 right-2 rounded-full border border-[var(--color-line)] bg-[rgba(7,9,8,0.82)] px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.08em] text-[var(--color-green)] uppercase backdrop-blur-sm">
          {statusLabels[campaign.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-display text-[1.05rem] font-semibold tracking-tight">
          {campaign.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.82rem] leading-snug text-[var(--color-muted)]">
          {campaign.headline}
        </p>
        <p className="mt-2 text-[0.72rem] font-medium text-[var(--color-text)]">
          {formatPeriod(campaign.startDate, campaign.endDate)}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {campaign.coupon && (
            <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--color-green)]">
              {campaign.coupon}
            </span>
          )}
          {campaign.minimumDeposit != null && (
            <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 py-1 text-[0.68rem] font-medium text-[var(--color-muted)]">
              {formatCurrencyBRL(campaign.minimumDeposit)}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {campaign.objectives.slice(0, 3).map((objective) => (
            <span
              key={objective}
              className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[0.62rem] font-medium text-[var(--color-muted)]"
            >
              {objectiveLabels[objective]}
            </span>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-3">
          <ActionButton
            className="flex-1 !px-2.5 !py-2 !text-[0.78rem]"
            icon={<Download size={14} />}
            onClick={() => onDownload(campaign)}
          >
            Baixar
          </ActionButton>
          <SoftButton
            className="flex-1 !px-2.5 !py-2 !text-[0.78rem]"
            icon={<ArrowRight size={14} />}
            onClick={() => onOpen(campaign)}
          >
            Ver
          </SoftButton>
        </div>
      </div>
    </article>
  )
}
