import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { formatPeriod, statusLabels } from '../../lib/campaign-utils'
import { CampaignOverview } from './CampaignOverview'
import { CampaignMaterials } from './CampaignMaterials'
import { CampaignCopies } from './CampaignCopies'
import { CampaignRules } from './CampaignRules'

type CampaignDrawerProps = {
  campaign: Campaign | null
  initialTab?: TabId
  onClose: () => void
}

type TabId = 'overview' | 'materials' | 'copies' | 'rules'

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'materials', label: 'Materiais' },
  { id: 'copies', label: 'Copies' },
  { id: 'rules', label: 'Regras' },
]

export function CampaignDrawer({
  campaign,
  initialTab = 'overview',
  onClose,
}: CampaignDrawerProps) {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<TabId>(initialTab)
  const [closing, setClosing] = useState(false)
  useBodyScrollLock(Boolean(campaign))

  const handleClose = useCallback(() => {
    setClosing((already) => {
      if (already) return already
      window.setTimeout(onClose, 280)
      return true
    })
  }, [onClose])

  useEffect(() => {
    if (campaign) {
      setTab(initialTab)
      setClosing(false)
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0 })
      })
    }
  }, [campaign, initialTab])

  useEffect(() => {
    if (!campaign || closing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [campaign, closing, handleClose])

  if (!campaign) return null

  return (
    <div
      className={['sheet-root', closing ? 'sheet-root--closing' : ''].join(' ')}
      role="presentation"
    >
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Fechar detalhes da campanha"
        onClick={handleClose}
      />

      <aside
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="sheet-toolbar">
          <p className="sheet-toolbar__label">Detalhes da campanha</p>
          <button
            type="button"
            onClick={handleClose}
            className="sheet-close"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="sheet-scroll">
          <div className="sheet-hero">
            <img
              src={campaign.heroImage ?? campaign.cardImage}
              alt={`Arte da campanha ${campaign.name}`}
              className="sheet-hero__image"
            />
          </div>

          <div className="sheet-heading">
            <div className="mb-3 inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-green-soft)] px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.12em] text-[var(--color-green)] uppercase">
              {statusLabels[campaign.status]}
            </div>
            <h2 id={titleId} className="font-display text-[1.65rem] font-semibold md:text-[1.9rem]">
              {campaign.name}
            </h2>
            <p className="mt-1.5 text-[0.95rem] text-[var(--color-muted)]">
              {campaign.headline}
            </p>
            <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
              {formatPeriod(campaign.startDate, campaign.endDate)}
            </p>
          </div>

          <div className="sheet-tabs">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 py-3 md:px-7">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={[
                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                    tab === item.id
                      ? 'bg-[var(--color-green-soft)] text-[var(--color-green)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-content">
            {tab === 'overview' && <CampaignOverview campaign={campaign} />}
            {tab === 'materials' && <CampaignMaterials campaign={campaign} />}
            {tab === 'copies' && <CampaignCopies campaign={campaign} />}
            {tab === 'rules' && <CampaignRules campaign={campaign} />}
          </div>
        </div>
      </aside>
    </div>
  )
}
