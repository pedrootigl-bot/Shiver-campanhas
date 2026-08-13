import type { Campaign } from '../../types/campaign'
import {
  formatCurrencyBRL,
  formatPeriod,
  objectiveLabels,
} from '../../lib/campaign-utils'

type CampaignOverviewProps = {
  campaign: Campaign
}

export function CampaignOverview({ campaign }: CampaignOverviewProps) {
  return (
    <div className="space-y-8">
      <section>
        <h4 className="mb-2 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
          Resumo
        </h4>
        <p className="leading-relaxed text-[var(--color-text)]">{campaign.description}</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Meta label="Período" value={formatPeriod(campaign.startDate, campaign.endDate)} />
        {campaign.coupon && <Meta label="Cupom" value={campaign.coupon} accent />}
        {campaign.minimumDeposit != null && (
          <Meta
            label="Depósito mínimo"
            value={formatCurrencyBRL(campaign.minimumDeposit) ?? ''}
          />
        )}
        {campaign.prize && <Meta label="Prêmio" value={campaign.prize} />}
      </section>

      {campaign.targetAudience && campaign.targetAudience.length > 0 && (
        <section>
          <h4 className="mb-2 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
            Público recomendado
          </h4>
          <p className="text-[var(--color-text)]">{campaign.targetAudience.join(' · ')}</p>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
          Objetivo
        </h4>
        <div className="flex flex-wrap gap-2">
          {campaign.objectives.map((objective) => (
            <span
              key={objective}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-muted)]"
            >
              {objectiveLabels[objective]}
            </span>
          ))}
        </div>
      </section>

      {campaign.mechanics && campaign.mechanics.length > 0 && (
        <section>
          <h4 className="mb-3 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
            Mecânica
          </h4>
          <ol className="space-y-3">
            {campaign.mechanics.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] font-display text-sm font-bold text-[var(--color-green)]">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-[var(--color-text)]">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {campaign.sellingAngles && campaign.sellingAngles.length > 0 && (
        <section>
          <h4 className="mb-3 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
            Ângulos de divulgação
          </h4>
          <div className="space-y-3">
            {campaign.sellingAngles.map((angle) => (
              <div
                key={angle.title}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4"
              >
                <p className="font-semibold text-[var(--color-green)]">{angle.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{angle.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Meta({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3">
      <div className="text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-muted)] uppercase">
        {label}
      </div>
      <div
        className={[
          'mt-1 text-sm font-semibold',
          accent ? 'text-[var(--color-green)]' : 'text-[var(--color-text)]',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}
