import { Megaphone } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import {
  getCampaignProgress,
  getDaysRemaining,
  getEndingSoonCampaigns,
} from '../../lib/campaign-utils'
import { ActionButton } from '../ui/ActionButton'
import { FadeIn } from '../ui/FadeIn'

type EndingSoonProps = {
  campaigns: Campaign[]
  onPromote: (campaign: Campaign) => void
}

export function EndingSoon({ campaigns, onPromote }: EndingSoonProps) {
  const ending = getEndingSoonCampaigns(campaigns)
  if (ending.length === 0) return null

  return (
    <section className="pb-16 md:pb-20">
      <div className="container">
        <FadeIn variant="left">
          <div className="mb-6">
            <p className="mb-2 text-[0.7rem] font-medium tracking-[0.16em] text-[var(--color-green)] uppercase">
              Urgência
            </p>
            <h2 className="font-display text-[clamp(1.65rem,3vw,2.25rem)] font-semibold tracking-tight">
              Terminando em breve
            </h2>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2">
          {ending.map((campaign, index) => {
            const days = Math.max(0, getDaysRemaining(campaign.endDate))
            const progress = getCampaignProgress(campaign)
            return (
              <FadeIn key={campaign.id} variant="up" delayMs={index * 100}>
                <div className="motion-card rounded-[10px] border border-[var(--color-line)] bg-[var(--color-card)] p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-medium">{campaign.name}</h3>
                      <p className="mt-1 text-sm font-medium text-[var(--color-green)]">
                        Termina em {days} {days === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                    <img
                      src={campaign.cardImage}
                      alt=""
                      className="h-14 w-[72px] rounded-[8px] object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className="progress-fill h-full rounded-full bg-[var(--color-green)]"
                      style={{ ['--progress' as string]: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-5">
                    <ActionButton
                      icon={<Megaphone size={16} />}
                      onClick={() => onPromote(campaign)}
                    >
                      Divulgar agora
                    </ActionButton>
                  </div>
                </div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
