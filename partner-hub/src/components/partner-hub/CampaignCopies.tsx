import { Check, Copy } from 'lucide-react'
import type { Campaign, CopyChannel } from '../../types/campaign'
import { useClipboard } from '../../hooks/useClipboard'
import { ActionButton } from '../ui/ActionButton'

type CampaignCopiesProps = {
  campaign: Campaign
}

const channelLabels: Record<CopyChannel, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
  reactivation: 'Reativação',
  commercial: 'Comercial',
}

const order: CopyChannel[] = [
  'whatsapp',
  'telegram',
  'instagram',
  'reactivation',
  'commercial',
]

export function CampaignCopies({ campaign }: CampaignCopiesProps) {
  const { copy, isCopied } = useClipboard()
  const copies = campaign.copies ?? []

  if (copies.length === 0) {
    return (
      <p className="text-[var(--color-muted)]">
        As copies desta campanha serão cadastradas em breve.
      </p>
    )
  }

  const grouped = order
    .map((channel) => ({
      channel,
      items: copies.filter((item) => item.channel === channel),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <section key={group.channel}>
          <h4 className="mb-3 text-[0.72rem] font-bold tracking-[0.16em] text-[var(--color-muted)] uppercase">
            {channelLabels[group.channel]}
          </h4>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--color-green)]">
                    {channelLabels[item.channel]} — {item.title}
                  </p>
                  <ActionButton
                    icon={
                      isCopied(item.id) ? <Check size={16} /> : <Copy size={16} />
                    }
                    success={isCopied(item.id)}
                    successLabel="Copy copiada"
                    onClick={() => copy(item.text, item.id)}
                  >
                    Copiar
                  </ActionButton>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
