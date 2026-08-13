import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Check, Copy, Download, Package } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import { useClipboard } from '../../hooks/useClipboard'
import { downloadAsset, isAssetAvailable } from '../../lib/asset-download'
import { FadeIn } from '../ui/FadeIn'
import { UnavailableMaterialDialog } from '../ui/UnavailableMaterialDialog'

type TodayRecommendationProps = {
  campaign: Campaign
  onOpenKit: (campaign: Campaign) => void
}

function formatDropDate(date = new Date()) {
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
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`
}

function splitHeroLines(title: string) {
  const cleaned = title.replace(/^[^—–-]+[—–-]\s*/, '').trim()
  const parts = cleaned
    .split(/[.,]/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length >= 2) return [parts[0], parts[1]]
  if (cleaned) return [cleaned]
  return ['Operou', 'Acelerou']
}

export function TodayRecommendation({
  campaign,
  onOpenKit,
}: TodayRecommendationProps) {
  const rec = campaign.todayRecommendation
  const { copy, isCopied } = useClipboard()
  const [unavailableItem, setUnavailableItem] = useState<string | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const material = useMemo(
    () =>
      campaign.materials.find((m) => m.id === rec?.featuredMaterialId) ??
      campaign.materials.find((m) => m.type === 'story') ??
      campaign.materials[0],
    [campaign.materials, rec?.featuredMaterialId],
  )

  const heroLines = useMemo(
    () => splitHeroLines(rec?.title ?? campaign.headline),
    [rec?.title, campaign.headline],
  )

  const handleGlow = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const node = heroRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    node.style.setProperty('--glow-x', `${x}%`)
    node.style.setProperty('--glow-y', `${y}%`)
  }, [])

  const handleDownloadStory = () => {
    if (!material) return
    if (isAssetAvailable(material.url)) {
      downloadAsset(material.url, material.url.split('/').pop())
    } else {
      setUnavailableItem(material.title)
    }
  }

  if (!rec) return null

  const dropDate = formatDropDate()
  const copied = isCopied('today')

  return (
    <section id="materiais" className="drop-day pb-16 md:pb-20">
      <div className="container">
        <FadeIn variant="blur" durationMs={850}>
          <div className="drop-day__header">
            <div className="drop-day__header-main">
              <p className="drop-day__label">DROP DO DIA • {dropDate}</p>
              <h2 className="drop-day__headline font-display">
                Hoje é dia de acelerar.
              </h2>
              <p className="drop-day__sub">
                Selecionamos a campanha com maior potencial para você divulgar
                agora.
              </p>
            </div>
            <div className="drop-day__priority" aria-label="Prioridade alta">
              <span className="drop-day__pulse" aria-hidden="true" />
              PRIORIDADE ALTA
            </div>
          </div>
        </FadeIn>

        <div className="drop-day__compose">
          <FadeIn variant="scale" delayMs={70} durationMs={900}>
            <div
              ref={heroRef}
              className="drop-day__hero"
              onMouseMove={handleGlow}
            >
              <div className="drop-day__shards" aria-hidden="true">
                <span
                  style={{ backgroundImage: `url(${campaign.cardImage})` }}
                />
                <span
                  style={{
                    backgroundImage: `url(${campaign.heroImage ?? campaign.cardImage})`,
                  }}
                />
                <span
                  style={{ backgroundImage: `url(${campaign.cardImage})` }}
                />
              </div>

              <img
                src={campaign.heroImage ?? campaign.cardImage}
                alt={`Campanha ${campaign.name}`}
                className="drop-day__car"
                loading="lazy"
              />

              <div className="drop-day__veil" />

              <div className="drop-day__hero-copy">
                <span className="drop-day__badge">CAMPANHA RECOMENDADA</span>
                <p className="drop-day__brand">{campaign.name}</p>
                {heroLines.map((line) => (
                  <p key={line} className="drop-day__line font-display">
                    {line.endsWith('.') ? line : `${line}.`}
                  </p>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn variant="up" delayMs={140} durationMs={800}>
            <div className="drop-day__dock">
              {rec.copy ? (
                <button
                  type="button"
                  className="drop-day__dock-ghost"
                  onClick={() => copy(rec.copy!, 'today')}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? 'Copiado ✓' : 'Copiar copy'}</span>
                </button>
              ) : null}

              {material ? (
                <button
                  type="button"
                  className="drop-day__dock-primary"
                  onClick={handleDownloadStory}
                >
                  <Download size={15} />
                  <span>Baixar story</span>
                </button>
              ) : null}

              <button
                type="button"
                className="drop-day__dock-link"
                onClick={() => onOpenKit(campaign)}
              >
                <Package size={15} />
                <span>Ver kit completo</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </FadeIn>

          {rec.copy ? (
            <FadeIn variant="up" delayMs={180} durationMs={800}>
              <button
                type="button"
                className={[
                  'drop-day__copy-note',
                  copied ? 'is-copied' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => copy(rec.copy!, 'today')}
                aria-label={copied ? 'Copy copiada' : 'Copiar copy pronta'}
              >
                <div className="drop-day__copy-top">
                  <span>COPY PRONTA</span>
                  <span className="drop-day__copy-icon">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </span>
                </div>
                <p>“{rec.copy}”</p>
                <em>{copied ? 'Copiado ✓' : 'Clique para copiar'}</em>
              </button>
            </FadeIn>
          ) : null}
        </div>

        <div className="drop-day__meta">
          <FadeIn variant="left" delayMs={120}>
            <div className="drop-day__why">
              <p className="drop-day__why-label">POR QUE HOJE?</p>
              <ul>
                <li>
                  <span>🔥</span> Campanha ativa
                </li>
                <li>
                  <span>🎟️</span> Mecânica simples
                </li>
                <li>
                  <span>🚗</span> Prêmio de alto desejo
                </li>
              </ul>
            </div>
          </FadeIn>

          <FadeIn variant="right" delayMs={160}>
            <div className="drop-day__tip">
              <p>
                <span>⚡</span> <strong>Dica do Marketing</strong>
              </p>
              <p>
                Publique o story primeiro e use a copy no grupo logo depois.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      <UnavailableMaterialDialog
        open={unavailableItem !== null}
        itemName={unavailableItem ?? undefined}
        onClose={() => setUnavailableItem(null)}
      />
    </section>
  )
}
