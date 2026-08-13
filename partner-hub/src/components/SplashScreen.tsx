import { useEffect, useState } from 'react'
import ChromaticWaves from './effects/ChromaticWaves'

type SplashScreenProps = {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'waves' | 'brand' | 'exit'>('waves')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onDone()
      return
    }

    const brandIn = window.setTimeout(() => setPhase('brand'), 900)
    const brandOut = window.setTimeout(() => setPhase('exit'), 2700)
    const doneTimer = window.setTimeout(onDone, 3500)

    return () => {
      window.clearTimeout(brandIn)
      window.clearTimeout(brandOut)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={
        phase === 'exit' ? 'splash splash--shiver splash--exit' : 'splash splash--shiver'
      }
      role="presentation"
      aria-hidden={phase === 'exit'}
    >
      <div className="splash__waves" aria-hidden="true">
        <ChromaticWaves
          bgColor="#060F21"
          colors={['#1A37F9', '#4B6BFF', '#9BB0FF', '#FFFFFF']}
          frequency={2}
          speed={5}
          cellSize={32}
          gamma={6}
          paletteBias={-2}
        />
      </div>

      <div
        className={[
          'splash__brand-mark',
          phase === 'brand' ? 'is-visible' : '',
          phase === 'exit' ? 'is-leaving' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <p className="splash__brand-name">SHIVER</p>
        <p className="splash__brand-sub">BROKER</p>
      </div>
    </div>
  )
}
