import { ExternalLink } from 'lucide-react'
import type { Campaign } from '../../types/campaign'

type CampaignRulesProps = {
  campaign: Campaign
}

export function CampaignRules({ campaign }: CampaignRulesProps) {
  return (
    <div className="space-y-8">
      <section>
        <h4 className="mb-3 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
          Resumo da campanha
        </h4>
        <p className="leading-relaxed text-[var(--color-text)]">{campaign.description}</p>
        {campaign.rules && campaign.rules.length > 0 && (
          <ul className="mt-4 space-y-2">
            {campaign.rules.map((rule) => (
              <li
                key={rule}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-muted)]"
              >
                {rule}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-3 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
          Regras oficiais
        </h4>

        {campaign.eligibility && campaign.eligibility.length > 0 && (
          <Block title="Elegibilidade" items={campaign.eligibility} />
        )}
        {campaign.restrictions && campaign.restrictions.length > 0 && (
          <Block title="Restrições" items={campaign.restrictions} />
        )}
        {campaign.notes && campaign.notes.length > 0 && (
          <Block title="Observações" items={campaign.notes} />
        )}

        {campaign.officialRulesUrl ? (
          <a
            href={campaign.officialRulesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-green)] no-underline hover:underline"
          >
            Ver regulamento completo
            <ExternalLink size={14} />
          </a>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-muted-2)]">
            O link do regulamento completo será adicionado quando disponível.
          </p>
        )}
      </section>
    </div>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-[var(--color-muted)]">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
