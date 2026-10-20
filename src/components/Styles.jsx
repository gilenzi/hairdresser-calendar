import { formatDuration, formatPrice, photo, STYLES } from '../data'

export default function Styles({ selectedId, onSelect }) {
  return (
    <section className="section" id="frizure">
      <div className="section-head">
        <p className="eyebrow">Frizure</p>
        <h2>Četiri reza. Ništa više.</h2>
        <p>
          Samo muško šišanje. Cena je konačna, a vreme u kalendaru je
          rezervisano samo za tebe.
        </p>
      </div>
      <div className="style-grid">
        {STYLES.map((style) => {
          const selected = style.id === selectedId
          return (
            <article key={style.id} className={selected ? 'style-card is-selected' : 'style-card'}>
              <img className={style.id} src={photo(style.image)} alt={style.alt} />
              <div className="style-body">
                <div className="style-title">
                  <h3>{style.name}</h3>
                  <strong>{formatPrice(style.price)}</strong>
                </div>
                <p>{style.blurb}</p>
                <div className="style-foot">
                  <span>{formatDuration(style.minutes)}</span>
                  <button type="button" onClick={() => onSelect(style.id)}>
                    {selected ? 'Izabrano' : 'Izaberi'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
