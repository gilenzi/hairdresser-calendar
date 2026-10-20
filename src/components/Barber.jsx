import { photo, SALON } from '../data'

const QUOTES = [
  {
    text: 'Fade je tačan i posle nedelju dana i dalje stoji kako treba.',
    name: 'Nemanja',
  },
  {
    text: 'Zakazao sam u pauzi. Ušao, seo, izašao. Bez čekaonice.',
    name: 'Andrej',
  },
  {
    text: 'Jedan frizer i uvek isti rez. Baš to mi treba.',
    name: 'Stefan',
  },
]

export default function Barber() {
  return (
    <>
      <section className="section barber" id="frizer">
        <div className="barber-copy">
          <p className="eyebrow">Frizer</p>
          <h2>{SALON.barber}</h2>
          <p>
            Jedini frizer u {SALON.name}-u. Radi sam, pa u stolici nema drugog
            klijenta pored tebe i niko ne deli tvoj termin.
          </p>
          <ul className="facts">
            <li>
              <span>Adresa</span>
              <strong>{SALON.address}</strong>
            </li>
            <li>
              <span>Telefon</span>
              <strong>
                <a href={SALON.phoneHref}>{SALON.phone}</a>
              </strong>
            </li>
            <li>
              <span>Radno vreme</span>
              <strong>Pon–pet 9–19, subota 9–15</strong>
            </li>
          </ul>
        </div>
        <figure className="barber-photo">
          <img src={photo('luka.jpg')} alt="Luka Petrović šiša klijenta" />
        </figure>
      </section>
      <section className="quotes" aria-label="Utisci">
        {QUOTES.map((quote) => (
          <blockquote key={quote.name}>
            <p>„{quote.text}“</p>
            <footer>{quote.name}</footer>
          </blockquote>
        ))}
      </section>
    </>
  )
}
