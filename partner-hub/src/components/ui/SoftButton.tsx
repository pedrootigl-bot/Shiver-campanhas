import type { ButtonHTMLAttributes, ReactNode } from 'react'

type SoftButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  icon?: ReactNode
}

export function SoftButton({
  children,
  icon,
  className = '',
  ...props
}: SoftButtonProps) {
  return (
    <button type="button" className={['soft-btn', className].filter(Boolean).join(' ')} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
