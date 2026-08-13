import { useState } from 'react'
import { Download, Eye, Package } from 'lucide-react'
import type { Campaign, MaterialType } from '../../types/campaign'
import { materialLabels } from '../../lib/campaign-utils'
import {
  downloadAsset,
  isAssetAvailable,
  previewAsset,
} from '../../lib/asset-download'
import { ActionButton } from '../ui/ActionButton'
import { SoftButton } from '../ui/SoftButton'
import { UnavailableMaterialDialog } from '../ui/UnavailableMaterialDialog'

type CampaignMaterialsProps = {
  campaign: Campaign
}

const order: MaterialType[] = ['story', 'feed', 'video', 'banner', 'other']

export function CampaignMaterials({ campaign }: CampaignMaterialsProps) {
  const [unavailableItem, setUnavailableItem] = useState<string | null>(null)
  const grouped = order
    .map((type) => ({
      type,
      items: campaign.materials.filter((m) => m.type === type),
    }))
    .filter((group) => group.items.length > 0)

  const handleKit = () => {
    if (isAssetAvailable(campaign.kitUrl)) {
      downloadAsset(campaign.kitUrl!, `${campaign.slug}-kit.rar`)
      return
    }

    setUnavailableItem(`Kit completo — ${campaign.name}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          Materiais organizados por formato para acelerar sua divulgação.
        </p>
        <button type="button" className="kit-btn shrink-0" onClick={handleKit}>
          <Package size={17} />
          <span>Baixar kit completo</span>
        </button>
      </div>

      {grouped.map((group) => (
        <section key={group.type}>
          <h4 className="mb-3 text-[0.68rem] font-medium tracking-[0.14em] text-[var(--color-muted)] uppercase">
            {materialLabels[group.type]}
          </h4>
          <div className="space-y-3">
            {group.items.map((material) => (
              <div
                key={material.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3 sm:flex-row sm:items-center"
              >
                <div className="h-16 w-full shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] sm:w-24">
                  <img
                    src={material.thumbnail ?? campaign.cardImage}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{material.title}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {material.width && material.height
                      ? `${material.width}×${material.height}`
                      : 'Formato sob demanda'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <SoftButton
                    icon={<Eye size={16} />}
                    onClick={() => {
                      if (isAssetAvailable(material.url)) {
                        previewAsset(material.url)
                      } else {
                        setUnavailableItem(material.title)
                      }
                    }}
                  >
                    Visualizar
                  </SoftButton>
                  <ActionButton
                    icon={<Download size={16} />}
                    onClick={() => {
                      if (isAssetAvailable(material.url)) {
                        downloadAsset(
                          material.url,
                          material.url.split('/').pop(),
                        )
                      } else {
                        setUnavailableItem(material.title)
                      }
                    }}
                  >
                    Baixar
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <UnavailableMaterialDialog
        open={unavailableItem !== null}
        itemName={unavailableItem ?? undefined}
        onClose={() => setUnavailableItem(null)}
      />
    </div>
  )
}
