import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import {
  formatLongPeriod,
  statusLabels,
  withResolvedStatus,
} from '../../lib/campaign-utils'
import { FadeIn } from '../ui/FadeIn'
import { SoftButton } from '../ui/SoftButton'

type CampaignTimelineProps = {
  campaigns: Campaign[]
  onSelect: (campaign: Campaign) => void
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

type DayCell = {
  day: number
  dateKey: string
} | null

function buildMonthWeeks(year: number, month: number): DayCell[][] {
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: DayCell[][] = []
  let week: DayCell[] = Array.from({ length: startWeekday }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    week.push({ day, dateKey: toKey(year, month, day) })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return weeks
}

export function CampaignTimeline({
  campaigns,
  onSelect,
}: CampaignTimelineProps) {
  const ordered = useMemo(
    () =>
      campaigns
        .map((c) => withResolvedStatus(c))
        .sort(
          (a, b) =>
            new Date(`${a.startDate}T12:00:00`).getTime() -
            new Date(`${b.startDate}T12:00:00`).getTime(),
        ),
    [campaigns],
  )

  const calendarMonth = useMemo(() => {
    const base = ordered[0]
      ? new Date(`${ordered[0].startDate}T12:00:00`)
      : new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  }, [ordered])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = ordered[selectedIndex] ?? null

  const byStartDate = useMemo(() => {
    const map = new Map<string, Campaign[]>()
    for (const campaign of ordered) {
      const list = map.get(campaign.startDate) ?? []
      list.push(campaign)
      map.set(campaign.startDate, list)
    }
    return map
  }, [ordered])

  const weeks = useMemo(
    () => buildMonthWeeks(calendarMonth.year, calendarMonth.month),
    [calendarMonth],
  )

  const shiftCampaign = (delta: number) => {
    if (ordered.length === 0) return
    setSelectedIndex((current) => {
      const next = current + delta
      if (next < 0) return ordered.length - 1
      if (next >= ordered.length) return 0
      return next
    })
  }

  const selectCampaign = (campaign: Campaign) => {
    const index = ordered.findIndex((item) => item.id === campaign.id)
    if (index >= 0) setSelectedIndex(index)
  }

  return (
    <section id="calendario" className="calendar-section">
      <div className="container">
        <FadeIn variant="blur">
          <div className="section-heading">
            <p className="section-kicker">Planejamento</p>
            <h2 className="font-display text-[clamp(1.55rem,3vw,2.2rem)] font-medium tracking-tight">
              Calendário de oportunidades
            </h2>
            <p className="mt-2 max-w-xl text-[var(--color-muted)]">
              Visualize o mês, selecione o dia e abra a campanha em um clique.
            </p>
          </div>
        </FadeIn>

        <FadeIn delayMs={80} variant="scale">
          <div className="calendar-board">
            <div className="calendar-board__grid-pane">
              <div className="calendar-board__toolbar">
                <div>
                  <p className="calendar-board__month">
                    {MONTHS[calendarMonth.month]}
                  </p>
                  <p className="calendar-board__year">{calendarMonth.year}</p>
                </div>
                <div className="calendar-board__nav">
                  <button
                    type="button"
                    aria-label="Campanha anterior"
                    onClick={() => shiftCampaign(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima campanha"
                    onClick={() => shiftCampaign(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="calendar-board__weekdays">
                {WEEKDAYS.map((day, i) => (
                  <span key={`${day}-${i}`}>{day}</span>
                ))}
              </div>

              <div className="calendar-board__weeks">
                {weeks.map((week, weekIndex) => (
                  <div key={`w-${weekIndex}`} className="calendar-board__week">
                    {week.map((cell, cellIndex) => {
                      if (!cell) {
                        return (
                          <div
                            key={`e-${weekIndex}-${cellIndex}`}
                            className="calendar-board__day is-empty"
                          />
                        )
                      }

                      const events = byStartDate.get(cell.dateKey) ?? []
                      const hasEvent = events.length > 0
                      const isSelected =
                        selected?.startDate === cell.dateKey

                      return (
                        <button
                          key={cell.dateKey}
                          type="button"
                          disabled={!hasEvent}
                          onClick={() => {
                            if (!hasEvent) return
                            selectCampaign(events[0])
                          }}
                          className={[
                            'calendar-board__day',
                            hasEvent ? 'has-event' : '',
                            isSelected ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span>{String(cell.day).padStart(2, '0')}</span>
                          {hasEvent ? <i aria-hidden="true" /> : null}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="calendar-board__detail">
              {selected ? (
                <>
                  <div className="calendar-board__detail-media">
                    <img
                      src={selected.cardImage || selected.heroImage}
                      alt=""
                    />
                  </div>
                  <div className="calendar-board__detail-body">
                    <span className="campaign-coverflow__status">
                      {statusLabels[selected.status]}
                    </span>
                    <h3 className="font-display text-[1.35rem] font-medium tracking-tight md:text-[1.55rem]">
                      {selected.name}
                    </h3>
                    <p className="mt-1 text-[var(--color-text)]">
                      {selected.headline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                      {selected.description}
                    </p>
                    <p className="mt-3 text-[0.7rem] font-medium tracking-[0.1em] text-[var(--color-muted-2)] uppercase">
                      {formatLongPeriod(selected.startDate, selected.endDate)}
                    </p>
                    <div className="mt-5">
                      <SoftButton onClick={() => onSelect(selected)}>
                        Conferir campanha
                      </SoftButton>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[var(--color-muted)]">
                  Nenhuma campanha neste mês.
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
