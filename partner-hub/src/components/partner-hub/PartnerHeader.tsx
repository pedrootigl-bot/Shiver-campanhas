import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LogIn, Menu, X } from 'lucide-react'
import { ADMIN_LOGIN_PATH } from '../../lib/admin'

function IconCampaigns() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.5 18.5 9 8l3.2 7.2L15.5 8l3.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 18.5h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="12.2" cy="9.2" r="1.15" fill="currentColor" />
    </svg>
  )
}

function IconMaterials() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="5.5"
        width="15"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 14.5 10.4 11l2.1 2.4 1.5-1.5L16 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="9.2" r="1.1" fill="currentColor" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="6"
        width="15"
        height="13.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M4.5 10h15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 4.5v3M15 4.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconSupport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 11V9.8A4.5 4.5 0 0 1 12 5.3a4.5 4.5 0 0 1 4.5 4.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="4.8"
        y="11"
        width="3.4"
        height="5.2"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="15.8"
        y="11"
        width="3.4"
        height="5.2"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

const links: Array<{
  href: string
  label: string
  index: string
  icon: () => ReactNode
}> = [
  { href: '#campanhas', label: 'Campanhas', index: '01', icon: IconCampaigns },
  { href: '#materiais', label: 'Materiais', index: '02', icon: IconMaterials },
  { href: '#calendario', label: 'Calendário', index: '03', icon: IconCalendar },
  { href: '#suporte', label: 'Suporte', index: '04', icon: IconSupport },
]

export function PartnerHeader() {
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('#top')
  const sections = useMemo(() => links.map((l) => l.href.slice(1)), [])

  useEffect(() => {
    const onScroll = () => {
      const offset = window.scrollY + 120
      let current = '#top'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.offsetTop <= offset) current = `#${id}`
      }
      setActiveHash(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <a href="#top" className="site-header__brand" aria-label="Shiver Broker">
          <span className="site-header__mark" aria-hidden="true" />
          <span className="site-header__brand-text">
            <strong>SHIVER</strong>
            <em>BROKER</em>
          </span>
        </a>

        <nav className="site-header__nav" aria-label="Principal">
          {links.map(({ href, label, index }) => {
            const active = activeHash === href
            return (
              <a
                key={href}
                href={href}
                className={['site-header__link', active ? 'is-active' : '']
                  .filter(Boolean)
                  .join(' ')}
                data-index={index}
              >
                <span className="site-header__link-index">{index}</span>
                <span className="site-header__link-label">{label}</span>
              </a>
            )
          })}
        </nav>

        <div className="site-header__actions">
          <a href="#campanhas" className="site-header__cta">
            Explorar
          </a>
          <a href={ADMIN_LOGIN_PATH} className="site-header__cta site-header__cta--admin">
            <LogIn size={14} aria-hidden="true" />
            Admin
          </a>
        </div>

        <button
          type="button"
          className="site-header__menu"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div className="site-header__drawer">
          {links.map(({ href, label, index, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="site-header__drawer-link"
              onClick={() => setOpen(false)}
            >
              <span className="site-header__drawer-index">{index}</span>
              <span>{label}</span>
              <span className="site-header__drawer-icon">
                <Icon />
              </span>
            </a>
          ))}
          <a
            href={ADMIN_LOGIN_PATH}
            className="site-header__drawer-link site-header__drawer-link--admin"
          >
            <span className="site-header__drawer-index">
              <LogIn size={14} aria-hidden="true" />
            </span>
            <span>Área admin</span>
            <span className="site-header__drawer-icon">Entrar</span>
          </a>
        </div>
      ) : null}
    </header>
  )
}
