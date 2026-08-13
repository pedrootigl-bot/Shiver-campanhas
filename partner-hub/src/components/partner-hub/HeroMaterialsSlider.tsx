import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign } from '../../types/campaign'

type HeroMaterialsSliderProps = {
  campaigns: Campaign[]
  ready?: boolean
}

type SlideItem = {
  id: string
  src: string
  label: string
  campaign: string
  type: string
}

export function HeroMaterialsSlider({
  campaigns = [],
  ready = true,
}: HeroMaterialsSliderProps) {
  const slides = useMemo<SlideItem[]>(() => {
    const items: SlideItem[] = []
    for (const campaign of campaigns ?? []) {
        for (const material of campaign.materials ?? []) {
        const src = material.thumbnail || material.url
        if (!src) continue
        if (material.type === 'video') continue
        items.push({
          id: material.id,
          src,
          label: material.title,
          campaign: campaign.name,
          type: material.type,
        })
      }
    }
    return items
  }, [campaigns])

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = slides.length
  const current = slides[index]

  useEffect(() => {
    if (!ready || paused || total < 2) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 2800)
    return () => window.clearInterval(id)
  }, [ready, paused, total])

  if (!current) return null

  const go = (dir: number) => {
    setIndex((i) => (i + dir + total) % total)
  }

  return (
    <div
      className={[
        'hero-materials',
        ready ? 'fade-up fade-up-delay-2' : 'is-prefade',
      ].join(' ')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-materials__frame">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id}
            src={current.src}
            alt={current.label}
            className="hero-materials__img"
            initial={{ opacity: 0, scale: 1.06, x: 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -14 }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 22,
              mass: 0.9,
            }}
            draggable={false}
          />
        </AnimatePresence>

        <div className="hero-materials__overlay" />

        <div className="hero-materials__caption">
          <p className="hero-materials__kicker">
            {current.campaign} · {current.type}
          </p>
          <p className="hero-materials__title">{current.label}</p>
          <p className="hero-materials__count">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
        </div>

        <div className="hero-materials__controls">
          <button
            type="button"
            aria-label="Material anterior"
            onClick={() => go(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Próximo material"
            onClick={() => go(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="hero-materials__thumbs" aria-hidden="true">
        {slides
          .slice(
            Math.max(0, Math.min(index - 4, Math.max(0, total - 12))),
            Math.max(0, Math.min(index - 4, Math.max(0, total - 12))) + 12,
          )
          .map((slide) => {
            const realIndex = slides.findIndex((s) => s.id === slide.id)
            return (
              <button
                key={slide.id}
                type="button"
                className={[
                  'hero-materials__thumb',
                  realIndex === index ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setIndex(realIndex)}
              >
                <img src={slide.src} alt="" />
              </button>
            )
          })}
      </div>
    </div>
  )
}
