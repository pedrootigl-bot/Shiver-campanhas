import RotatingText from '../effects/RotatingText'
import { FadeIn } from '../ui/FadeIn'

export function MomentumBanner() {
  return (
    <section className="momentum-banner">
      <div className="container">
        <FadeIn variant="blur" durationMs={1000}>
          <div className="momentum-banner__inner">
            <RotatingText
              className="momentum-banner__text"
              nowrap
              prefix="Potencialize"
              texts={[
                'seus resultados',
                'sua operação',
                'sua rede',
                'seu alcance',
              ]}
              prefixColor="#E8EEF8"
              color="#ffffff"
              badgeBackground="#1F9AFF"
              badgeRadius={12}
              badgePaddingX={14}
              badgePaddingY={6}
              gap={10}
              font={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.15rem, 3.4vw, 2.75rem)',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: '1.1em',
                textAlign: 'left',
              }}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
