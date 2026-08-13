import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type FadeVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'fade'

type FadeInProps = {
  children: ReactNode
  className?: string
  delayMs?: number
  variant?: FadeVariant
  durationMs?: number
  as?: 'div' | 'section' | 'article' | 'span'
  once?: boolean
  threshold?: number
}

const hiddenTransforms: Record<FadeVariant, string> = {
  up: 'translateY(28px)',
  down: 'translateY(-18px)',
  left: 'translateX(-32px)',
  right: 'translateX(32px)',
  scale: 'scale(0.94)',
  blur: 'translateY(14px)',
  fade: 'none',
}

export function FadeIn({
  children,
  className = '',
  delayMs = 0,
  variant = 'up',
  durationMs = 780,
  as: Tag = 'div',
  once = true,
  threshold = 0.14,
}: FadeInProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -48px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, threshold])

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : hiddenTransforms[variant],
    filter: visible
      ? 'blur(0px)'
      : variant === 'blur'
        ? 'blur(10px)'
        : undefined,
    transition: [
      `opacity ${durationMs}ms cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`,
      `transform ${durationMs}ms cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`,
      variant === 'blur'
        ? `filter ${durationMs}ms cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`
        : null,
    ]
      .filter(Boolean)
      .join(', '),
    willChange: 'opacity, transform',
  }

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={style}
      data-visible={visible ? 'true' : 'false'}
    >
      {children}
    </Tag>
  )
}
