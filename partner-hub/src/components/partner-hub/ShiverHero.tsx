import { Download, Info } from 'lucide-react'
import type { Campaign } from '../../types/campaign'
import SmokyText from '../effects/SmokyText'
import { ActionButton } from '../ui/ActionButton'
import { SoftButton } from '../ui/SoftButton'
import { HeroMaterialsSlider } from './HeroMaterialsSlider'

type ShiverHeroProps = {
  campaigns: Campaign[]
  onExploreCampaigns: () => void
  onOpenMaterials: () => void
  ready?: boolean
}

export function ShiverHero({
  campaigns,
  onExploreCampaigns,
  onOpenMaterials,
  ready = true,
}: ShiverHeroProps) {
  return (
    <section id="top" className="hero-section shiver-hero">
      <div className="container shiver-hero__grid">
        <div className="shiver-hero__copy">
          <div className="shiver-hero__smoky">
            {ready ? (
              <SmokyText
                key="campanhas-shiver"
                text={'Campanhas\nShiver'}
                color="#EEF2FB"
                intensity={9}
                position="bottomLeft"
                animationMode="singleLine"
                appearTrigger="default"
                appearTransition={{
                  type: 'tween',
                  ease: 'easeOut',
                  duration: 2.1,
                  delay: 0.12,
                }}
                font={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.4rem, 7.5vw, 5rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.02,
                  textAlign: 'left',
                }}
              />
            ) : null}
          </div>

          <p
            className={[
              'shiver-hero__sub',
              ready ? 'fade-up fade-up-delay-2' : 'is-prefade',
            ].join(' ')}
          >
            Entenda a dinâmica
          </p>

          <p
            className={[
              'shiver-hero__lead',
              ready ? 'fade-up fade-up-delay-3' : 'is-prefade',
            ].join(' ')}
          >
            Materiais, copies e calendário para afiliados operarem com ritmo —
            sem ruído, com foco em conversão.
          </p>

          <div
            className={[
              'shiver-hero__actions',
              ready ? 'fade-up fade-up-delay-3' : 'is-prefade',
            ].join(' ')}
          >
            <ActionButton
              icon={<Download size={16} />}
              onClick={onOpenMaterials}
            >
              Acessar materiais
            </ActionButton>
            <SoftButton
              icon={<Info size={16} />}
              onClick={onExploreCampaigns}
            >
              Ver campanhas
            </SoftButton>
          </div>
        </div>

        <HeroMaterialsSlider campaigns={campaigns} ready={ready} />
      </div>
    </section>
  )
}
