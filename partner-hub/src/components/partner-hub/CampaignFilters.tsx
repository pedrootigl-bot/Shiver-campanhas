import type { CampaignObjective } from '../../types/campaign'
import { objectiveLabels } from '../../lib/campaign-utils'

type CampaignFiltersProps = {
  value: CampaignObjective | 'all'
  onChange: (value: CampaignObjective | 'all') => void
}

const options: Array<CampaignObjective | 'all'> = [
  'all',
  'acquisition',
  'ftd',
  'redeposit',
  'retention',
  'volume',
]

export function CampaignFilters({ value, onChange }: CampaignFiltersProps) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const active = value === option
        const label = option === 'all' ? 'Todos' : objectiveLabels[option]
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
              active
                ? 'border-[var(--color-green)] bg-[var(--color-green-soft)] text-[var(--color-green)]'
                : 'border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
