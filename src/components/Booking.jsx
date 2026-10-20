import { useMemo, useState } from 'react'
import { formatDuration, formatPrice, SALON } from '../data'
import {
  canBook,
  createBooking,
  dayStatus,
  formatLong,
  isValidEmail,
  isValidName,
  isValidPhone,
  monthCells,
  monthLabel,
  shiftMonth,
  slotsFor,
  todayISO,
  toISO,
  WEEKDAYS,
} from '../schedule'

export default function Booking({
  styles,
  styleId,
  onStyleChange,
  bookings,
  loading,
  loadError,
  onCreate,
  onCancel,
}) {
  const style = styles.find((item) => item.id === styleId) ?? null
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [busy, setBusy] = useState(false)

  const maxMonth = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 3, 1)
  }, [])

  const cells = monthCells(cursor)
  const slots = style && date ? slotsFor(date, style.minutes, bookings) : []
  const visibleSlots = slots.filter((slot) => slot.reason !== 'past')
  const activeTime = visibleSlots.some((slot) => slot.time === time && slot.free) ? time : ''
  const upcoming = bookings
    .filter((booking) => `${booking.date}T${booking.time}` >= `${today}T00:00`)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))

  const atCurrentMonth =
    cursor.getFullYear() === new Date().getFullYear() &&
    cursor.getMonth() === new Date().getMonth()
  const atLastMonth =
    cursor.getFullYear() === maxMonth.getFullYear() &&
    cursor.getMonth() === maxMonth.getMonth()

  function pickDate(iso) {
    setDate(iso)
    setTime('')
    setError('')
    setDone(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (loading || busy) return
    if (!style) {
      setError('Prvo izaberi frizuru.')
      return
    }
    if (!date) {
      setError('Izaberi dan u kalendaru.')
      return
    }
    if (!activeTime) {
      setError('Izaberi slobodan sat.')
      return
    }
    if (!isValidName(name)) {
      setError('Upiši ime i prezime.')
      return
    }
    if (!isValidPhone(phone)) {
      setError('Upiši broj telefona, npr. 065 123 4567.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Upiši email na koji šaljemo potvrdu.')
      return
    }

    const booking = createBooking({ style, date, time: activeTime, name, phone, email })
    if (!canBook(booking, bookings)) {
      setError('Taj termin je upravo zauzet. Izaberi drugi sat.')
      setTime('')
      return
    }

    setBusy(true)
    try {
      const saved = await onCreate(booking)
      setDone(saved)
      setTime('')
      setName('')
      setPhone('')
      setEmail('')
      setError('')
    } catch (err) {
      setError(err.message || 'Termin nije sačuvan.')
      if (String(err.message).includes('zauzet')) setTime('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section booking" id="zakazivanje">
        <div className="section-head">
        <p className="eyebrow">Zakazivanje</p>
        <h2>Izaberi dan i sat.</h2>
        <p>
          {SALON.barber} radi sam, pa je svaki sat jedinstven. Kad neko zakaže,
          taj termin se odmah vidi i na drugim uređajima.
        </p>
      </div>

      <div className="desk">
        <div className="calendar-card">
          <div className="calendar-nav">
            <button
              type="button"
              onClick={() => setCursor((value) => shiftMonth(value, -1))}
              disabled={atCurrentMonth}
              aria-label="Prethodni mesec"
            >
              ←
            </button>
            <strong>{monthLabel(cursor)}</strong>
            <button
              type="button"
              onClick={() => setCursor((value) => shiftMonth(value, 1))}
              disabled={atLastMonth}
              aria-label="Sledeći mesec"
            >
              →
            </button>
          </div>
          <div className="weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="days" role="grid" aria-label="Kalendar">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="day-empty" />
              const iso = toISO(new Date(cursor.getFullYear(), cursor.getMonth(), day))
              const status = dayStatus(iso, style?.minutes ?? 0, bookings)
              const booked = bookings.some((item) => item.date === iso)
              const disabled = status === 'past' || status === 'closed' || status === 'full'
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  className={[
                    'day',
                    date === iso ? 'is-selected' : '',
                    iso === today ? 'is-today' : '',
                    status === 'closed' ? 'is-closed' : '',
                    status === 'full' ? 'is-full' : '',
                    booked ? 'has-booking' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled}
                  aria-pressed={date === iso}
                  aria-label={`${day}. ${monthLabel(cursor)}${status === 'closed' ? ', zatvoreno' : ''}${status === 'full' ? ', popunjeno' : ''}`}
                  onClick={() => pickDate(iso)}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <p className="calendar-note">Nedelja je zatvorena. Tačkica znači da tog dana već ima termina.</p>
        </div>

        <div className="ticket">
          <div className="style-switch" role="listbox" aria-label="Frizura">
            {styles.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={item.id === styleId}
                className={item.id === styleId ? 'is-selected' : ''}
                onClick={() => {
                  onStyleChange(item.id)
                  setTime('')
                  setDone(null)
                  setError('')
                }}
              >
                <span>{item.name}</span>
                <small>
                  {formatDuration(item.minutes)} · {formatPrice(item.price)}
                </small>
              </button>
            ))}
          </div>

          {done ? (
            <div className="success" role="status">
              <p className="eyebrow">Potvrđeno</p>
              <h3>Termin je zakazan.</h3>
              <p>
                {done.styleName}, {formatLong(done.date)} u {done.time}. {done.name},{' '}
                {done.phone}. Potvrda ide na {done.email}, a frizer dobija obaveštenje.
              </p>
              <button type="button" className="button button-solid" onClick={() => setDone(null)}>
                Zakaži još jedan
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <fieldset className="slots">
                <legend>
                  {date ? formatLong(date) : 'Prvo izaberi dan'}
                  {style ? ` · ${style.name}` : ''}
                </legend>
                {!style && <p className="hint">Izaberi frizuru da vidimo koliko traje termin.</p>}
                {style && !date && <p className="hint">Dan biraš u kalendaru levo.</p>}
                {style && date && visibleSlots.length === 0 && (
                  <p className="hint">Za ovu frizuru tog dana nema slobodnog sata.</p>
                )}
                {visibleSlots.length > 0 && (
                  <div className="slot-grid">
                    {visibleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        className={activeTime === slot.time ? 'is-selected' : ''}
                        disabled={!slot.free}
                        aria-pressed={activeTime === slot.time}
                        onClick={() => {
                          setTime(slot.time)
                          setError('')
                        }}
                      >
                        {slot.time}
                        {!slot.free && <small>zauzeto</small>}
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>

              <label>
                Ime i prezime
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Marko Jovanović"
                />
              </label>
              <label>
                Telefon
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="065 123 4567"
                />
              </label>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="marko@email.com"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="button button-solid button-wide" disabled={busy || loading}>
                {busy ? 'Čuvam termin...' : 'Potvrdi termin'}
                {!busy && style && activeTime ? ` · ${formatPrice(style.price)}` : ''}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="agenda">
        <div>
          <h3>Zakazani termini</h3>
          <p>Lista dolazi iz baze. Zauzet sat važi za sve koji otvore sajt.</p>
        </div>
        {loadError ? (
          <p className="form-error" role="alert">{loadError}</p>
        ) : loading ? (
          <p className="hint">Učitavam termine...</p>
        ) : upcoming.length === 0 ? (
          <p className="hint">Još nema zakazanih termina.</p>
        ) : (
          <ul>
            {upcoming.map((booking) => (
              <li key={booking.id}>
                <div>
                  <strong>
                    {formatLong(booking.date)} · {booking.time}
                  </strong>
                  <span>
                    {booking.styleName} · {booking.name} · {booking.phone}
                  </span>
                </div>
                {cancelId === booking.id ? (
                  <div className="cancel-actions">
                    <button
                      type="button"
                      onClick={async () => {
                        setBusy(true)
                        try {
                          await onCancel(booking.id)
                          setCancelId(null)
                        } catch (err) {
                          setError(err.message || 'Termin nije otkazan.')
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      Potvrdi
                    </button>
                    <button type="button" className="quiet" onClick={() => setCancelId(null)}>
                      Nazad
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCancelId(booking.id)}>
                    Otkaži
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
