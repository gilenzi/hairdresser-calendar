import { SALON } from '../data'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>{SALON.name}</strong>
        <p>Muška berbernica u Beogradu. Jedan frizer, zakazivanje preko kalendara.</p>
      </div>
      <p>
        {SALON.address}
        <br />
        <a href={SALON.phoneHref}>{SALON.phone}</a>
      </p>
      <p className="copy">
        © {new Date().getFullYear()} {SALON.name}
        <br />
        <a href="#admin">Admin</a>
      </p>
    </footer>
  )
}
