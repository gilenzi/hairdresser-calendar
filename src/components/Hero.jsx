import { photo, SALON } from '../data'

export default function Hero() {
  return (
    <section className="hero" id="vrh">
      <div className="hero-copy">
        <p className="eyebrow">Muška berbernica · {SALON.city}</p>
        <h1>
          Šišanje koje se zakazuje <em>za minut.</em>
        </h1>
        <p className="lead">
          Jedan frizer, četiri muške frizure i kalendar koji pokazuje šta je
          slobodno. Biraš rez, dan i sat — bez poziva i bez čekanja u redu.
        </p>
        <div className="hero-actions">
          <a className="button button-solid" href="#zakazivanje">
            Zakaži termin
          </a>
          <a className="button button-ghost" href="#frizure">
            Pogledaj frizure
          </a>
        </div>
        <dl className="hours">
          <div>
            <dt>Pon–pet</dt>
            <dd>9–19</dd>
          </div>
          <div>
            <dt>Subota</dt>
            <dd>9–15</dd>
          </div>
          <div>
            <dt>Nedelja</dt>
            <dd>Zatvoreno</dd>
          </div>
        </dl>
      </div>
      <figure className="hero-photo">
        <img src={photo('hero.jpg')} alt="Muško brijanje u berbernici REZ" />
        <figcaption>
          <span>Frizer</span>
          <strong>{SALON.barber}</strong>
          <small>Jedina stolica. Ceo termin je tvoj.</small>
        </figcaption>
      </figure>
    </section>
  )
}
