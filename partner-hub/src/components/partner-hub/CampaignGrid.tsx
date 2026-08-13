import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign, CampaignObjective } from '../../types/campaign'
import { filterCampaigns } from '../../lib/campaign-utils'
import { CampaignCard } from './CampaignCard'
import { CampaignFilters } from './CampaignFilters'
import { FadeIn } from '../ui/FadeIn'

type CampaignGridProps = {
  campaigns: Campaign[]
  onOpen: (campaign: Campaign) => void
  onDownload: (campaign: Campaign) => void
}

export function CampaignGrid({ campaigns, onOpen, onDownload }: CampaignGridProps) {
  const [filter, setFilter] = useState<CampaignObjective | 'all'>('all')
  const scrollerRef = useRef<HTMLDivElement>(null)
  const filtered = useMemo(
    () => filterCampaigns(campaigns, filter),
    [campaigns, filter],
  )

  const scrollByCard = (direction: -1 | 1) => {
    const node = scrollerRef.current
    if (!node) return
    const amount = Math.min(320, node.clientWidth * 0.8) * direction
    node.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section id="campanhas" className="pb-12 md:pb-16">
      <div className="container">
        <FadeIn variant="left">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[0.7rem] font-medium tracking-[0.16em] text-[var(--color-green)] uppercase">
                Biblioteca operacional
              </p>
              <h2 className="font-display text-[clamp(1.55rem,3vw,2.1rem)] font-semibold tracking-tight">
                Campanhas ativas
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
                Deslize para ver todas as campanhas em andamento.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CampaignFilters value={filter} onChange={setFilter} />
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={() => scrollByCard(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-muted)] transition hover:border-[var(--color-line-strong)] hover:text-[var(--color-green)]"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Próximo"
                  onClick={() => scrollByCard(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-muted)] transition hover:border-[var(--color-line-strong)] hover:text-[var(--color-green)]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </FadeIn>

        {filtered.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--color-line)] bg-[var(--color-card)] p-8 text-center text-[var(--color-muted)]">
            Nenhuma campanha encontrada para este filtro.
          </div>
        ) : (
          <FadeIn variant="up" delayMs={60}>
            <div
              ref={scrollerRef}
              className="campaign-rail no-scrollbar flex gap-3.5 overflow-x-auto pb-2"
            >
              {filtered.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onOpen={onOpen}
                  onDownload={onDownload}
                />
              ))}
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  )
}
