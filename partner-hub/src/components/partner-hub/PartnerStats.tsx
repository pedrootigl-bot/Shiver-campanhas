import { useEffect, useRef, useState } from 'react'
import { animated, to, useSpring, useSprings } from '@react-spring/web'
import { FadeIn } from '../ui/FadeIn'

type PartnerStatsProps = {
  activeCampaigns: number
  materials: number
  copies: number
  videos: number
}

export function PartnerStats({
  activeCampaigns,
  materials,
  copies,
  videos,
}: PartnerStatsProps) {
  const items = [
    { value: activeCampaigns, label: 'Campanhas ativas' },
    { value: materials, label: 'Materiais' },
    { value: copies, label: 'Copies prontas' },
    { value: videos, label: 'Vídeos' },
  ]

  const shellRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const node = shellRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const [tilt, tiltApi] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: { mass: 1, tension: 280, friction: 28 },
  }))

  const [numberSprings] = useSprings(
    items.length,
    (index) => ({
      number: active ? items[index].value : 0,
      delay: index * 90,
      config: { mass: 1, tension: 120, friction: 22 },
    }),
    [active, activeCampaigns, materials, copies, videos],
  )

  const [cellSprings, cellApi] = useSprings(
    items.length,
    () => ({
      y: 0,
      glow: 0,
      config: { mass: 1, tension: 260, friction: 24 },
    }),
    [],
  )

  useEffect(() => {
    cellApi.start((index) => ({
      y: hovered === index ? -4 : 0,
      glow: hovered === index ? 1 : 0,
    }))
  }, [hovered, cellApi])

  return (
    <section className="pb-10 md:pb-12">
      <div className="container">
        <FadeIn variant="scale" durationMs={850}>
          <animated.div
            ref={shellRef}
            className="stats-shell spring-stats grid grid-cols-2 gap-3 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-card)] p-4 md:grid-cols-4 md:gap-0 md:p-0 md:divide-x md:divide-[var(--color-line)]"
            style={{
              transform: to(
                [tilt.rotateX, tilt.rotateY, tilt.scale],
                (rx, ry, s) =>
                  `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
              ),
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const px = (e.clientX - rect.left) / rect.width
              const py = (e.clientY - rect.top) / rect.height
              tiltApi.start({
                rotateX: (0.5 - py) * 6,
                rotateY: (px - 0.5) * 8,
                scale: 1.01,
              })
            }}
            onMouseLeave={() => {
              tiltApi.start({ rotateX: 0, rotateY: 0, scale: 1 })
              setHovered(null)
            }}
          >
            {items.map((item, index) => (
              <animated.div
                key={item.label}
                className="stat-cell px-4 py-4 text-center md:py-6"
                style={{
                  transform: cellSprings[index].y.to(
                    (y) => `translateY(${y}px)`,
                  ),
                  background: cellSprings[index].glow.to(
                    (g) => `rgba(26, 55, 249, ${0.04 + g * 0.1})`,
                  ),
                  boxShadow: cellSprings[index].glow.to(
                    (g) =>
                      `inset 0 0 0 1px rgba(75, 107, 255, ${g * 0.28}), 0 10px 24px rgba(26, 55, 249, ${g * 0.18})`,
                  ),
                }}
                onMouseEnter={() => setHovered(index)}
              >
                <animated.div className="font-display text-[1.85rem] font-medium tracking-tight text-[var(--color-text)] md:text-3xl">
                  {numberSprings[index].number.to((n) => Math.round(n))}
                </animated.div>
                <div className="mt-1 text-[0.68rem] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase">
                  {item.label}
                </div>
              </animated.div>
            ))}
          </animated.div>
        </FadeIn>
      </div>
    </section>
  )
}
