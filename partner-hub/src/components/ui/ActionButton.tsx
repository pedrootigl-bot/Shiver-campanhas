import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  icon?: ReactNode
  success?: boolean
  successLabel?: string
}

export function ActionButton({
  children,
  icon,
  success = false,
  successLabel = 'Pronto',
  className = '',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={['action-btn', success ? 'is-success' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {icon}
      <span>{success ? successLabel : children}</span>
    </button>
  )
}
