import { useState } from 'react'
import { SALON } from '../data'

const LINKS = [
  { href: '#frizure', label: 'Frizure' },
  { href: '#zakazivanje', label: 'Zakazivanje' },
  { href: '#frizer', label: 'Frizer' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
  }

  return (
    <header className="site-header">
      <a className="logo" href="#vrh" onClick={close}>
        <span className="logo-mark" aria-hidden="true" />
        {SALON.name}
      </a>
      <nav className={open ? 'nav is-open' : 'nav'} aria-label="Glavna navigacija">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
      </nav>
      <a className="header-cta" href="#zakazivanje">
        Zakaži
      </a>
      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-label={open ? 'Zatvori meni' : 'Otvori meni'}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </header>
  )
}
