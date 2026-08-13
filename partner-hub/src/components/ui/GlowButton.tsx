import {
  useCallback,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react'

type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  block?: boolean
}

function mixHex(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
    ] as const
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const to = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  const r = ar + (br - ar) * t
  const g = ag + (bg - ag) * t
  const bl = ab + (bb - ab) * t
  return `#${to(r)}${to(g)}${to(bl)}`
}

export function GlowButton({
  children,
  variant = 'primary',
  block = false,
  className = '',
  onPointerMove,
  ...props
}: GlowButtonProps) {
  const handleMove = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      button.style.setProperty('--pointer-x', `${x}px`)
      button.style.setProperty('--pointer-y', `${y}px`)
      button.style.setProperty(
        '--button-glow',
        mixHex('#1F9AFF', '#5CBCFF', Math.min(1, Math.max(0, x / rect.width))),
      )
      onPointerMove?.(e)
    },
    [onPointerMove],
  )

  return (
    <button
      type="button"
      className={[
        'glow-button',
        variant === 'ghost' ? 'glow-button--ghost' : '',
        block ? 'glow-button--block' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerMove={handleMove}
      {...props}
    >
      <span className="gradient" aria-hidden="true" />
      <span className="label">{children}</span>
    </button>
  )
}
