import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, X } from 'lucide-react'
import { ActionButton } from './ActionButton'

type UnavailableMaterialDialogProps = {
  open: boolean
  itemName?: string
  onClose: () => void
}

const text = {
  closeNotice: 'Fechar aviso',
  close: 'Fechar',
  title: 'Indispon\u00edvel no momento',
  defaultItem: 'Este material ainda n\u00e3o est\u00e1 dispon\u00edvel para download.',
  unavailable: 'ainda n\u00e3o est\u00e1 dispon\u00edvel para download.',
  support: 'Entre em contato com o suporte para receber ajuda.',
  confirm: 'Entendi',
}

export function UnavailableMaterialDialog({
  open,
  itemName,
  onClose,
}: UnavailableMaterialDialogProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        aria-label={text.closeNotice}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[420px] rounded-[22px] border border-[var(--color-line-strong)] bg-[#0d120f] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_35px_rgba(104,218,0,0.08)]"
      >
        <button
          type="button"
          className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-muted)] transition hover:text-white"
          aria-label={text.close}
          onClick={onClose}
        >
          <X size={17} />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-green-soft)] text-[var(--color-green)]">
          <AlertCircle size={22} />
        </div>

        <h3 id={titleId} className="font-display pr-10 text-xl font-semibold">
          {text.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {itemName ? `${itemName} ${text.unavailable}` : text.defaultItem}{' '}
          {text.support}
        </p>

        <div className="mt-6 flex justify-end">
          <ActionButton onClick={onClose}>{text.confirm}</ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
