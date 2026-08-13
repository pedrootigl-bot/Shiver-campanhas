"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '../../lib/utils'

export type HoverExpandImage = {
  src: string
  alt: string
  code: string
  title?: string
}

type HoverExpandProps = {
  images: HoverExpandImage[]
  className?: string
  activeIndex?: number
  onActiveChange?: (index: number) => void
}

const spring = {
  type: 'spring' as const,
  stiffness: 140,
  damping: 22,
  mass: 0.85,
}

export function HoverExpand({
  images,
  className,
  activeIndex,
  onActiveChange,
}: HoverExpandProps) {
  const featured = Math.min(1, Math.max(0, images.length - 1))
  const [internalActive, setInternalActive] = useState<number>(featured)
  const activeImage = activeIndex ?? internalActive

  const setActive = (index: number) => {
    setInternalActive(index)
    onActiveChange?.(index)
  }

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ ...spring, delay: 0.08 }}
      className={cn('hover-expand relative w-full', className)}
    >
      <div className="hover-expand__rail">
        {images.map((image, index) => {
          const isActive = activeImage === index
          return (
            <motion.button
              key={`${image.src}-${index}`}
              type="button"
              layout
              className={cn('hover-expand__item', isActive && 'is-active')}
              initial={false}
              animate={{
                flexGrow: isActive ? 5.2 : 1,
                flexBasis: isActive ? '19rem' : '2.85rem',
              }}
              transition={spring}
              onClick={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              aria-pressed={isActive}
              aria-label={image.title || image.alt}
            >
              <motion.img
                src={image.src}
                className="hover-expand__img"
                alt={image.alt}
                draggable={false}
                animate={{
                  scale: isActive ? 1.04 : 1.12,
                  filter: isActive
                    ? 'saturate(1.05) contrast(1.08)'
                    : 'saturate(0.85) contrast(1.02) brightness(0.88)',
                }}
                transition={spring}
              />

              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div
                    key={`veil-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="hover-expand__veil"
                  />
                ) : null}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div
                    key={`meta-${index}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ ...spring, delay: 0.04 }}
                    className="hover-expand__meta"
                  >
                    <p className="hover-expand__code">{image.code}</p>
                    {image.title ? (
                      <p className="hover-expand__title">{image.title}</p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
