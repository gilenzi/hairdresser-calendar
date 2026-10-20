import { useEffect, useState } from 'react'
import {
  createBookingRecord,
  fetchAllBookings,
  removeBooking,
  setBookingStatus,
  updateBookingRecord,
} from '../api'
import { STYLES } from '../data'
import { formatLong } from '../schedule'

const GATE_KEY = 'rez-admin-ok'
const TIMES = Array.from({ length: 20 }, (_, index) => {
  const total = 9 * 60 + index * 30
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  styleId: STYLES[0].id,
  date: '',
  time: '10:00',
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1')
  const [password, setPassword] = useState('')
  const [gateError, setGateError] = useState('')
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('sve')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  async function load() {
    const next = await fetchAllBookings()
    setRows(next)
    setLoading(false)
  }

  useEffect(() => {
    if (!unlocked) return undefined
    let active = true
    fetchAllBookings()
      .then((next) => {
        if (!active) return
        setRows(next)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Rezervacije se ne učitavaju.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [unlocked])

  function unlock(event) {
    event.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem(GATE_KEY, '1')
      setUnlocked(true)
      setGateError('')
      return
    }
    setGateError('Pogrešna lozinka.')
  }

  function logout() {
    sessionStorage.removeItem(GATE_KEY)
    setUnlocked(false)
    setPassword('')
  }

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
    setError('')
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      styleId: row.styleId,
      date: row.date,
      time: row.time,
    })
    setShowForm(true)
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    const style = STYLES.find((item) => item.id === form.styleId)
    const booking = {
      styleId: style.id,
      styleName: style.name,
      minutes: style.minutes,
      price: style.price,
      date: form.date,
      time: form.time,
      name: form.name,
      phone: form.phone,
      email: form.email,
      status: 'potvrden',
    }
    setBusy(true)
    setError('')
    try {
      if (editingId) await updateBookingRecord(editingId, booking)
      else await createBookingRecord(booking)
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY)
      await load()
    } catch (err) {
      setError(err.message || 'Izmena nije sačuvana.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(row) {
    setBusy(true)
    setError('')
    try {
      await setBookingStatus(row.id, row.status === 'odbijen' ? 'potvrden' : 'odbijen')
      await load()
    } catch (err) {
      setError(err.message || 'Status nije promenjen.')
    } finally {
      setBusy(false)
    }
  }

  async function destroy(id) {
    setBusy(true)
    setError('')
    try {
      await removeBooking(id)
      setPendingDelete(null)
      await load()
    } catch (err) {
      setError(err.message || 'Rezervacija nije obrisana.')
    } finally {
      setBusy(false)
    }
  }

  const visible = rows.filter((row) => filter === 'sve' || row.status === filter)

  if (!unlocked) {
    return (
      <main className="admin">
        <form className="admin-gate" onSubmit={unlock}>
          <p className="eyebrow">REZ</p>
          <h1>Admin</h1>
          <label>
            Lozinka
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </label>
          {gateError && <p className="form-error">{gateError}</p>}
          <button type="submit" className="button button-solid">
            Otvori
          </button>
          <a href="#vrh">Nazad na sajt</a>
        </form>
      </main>
    )
  }

  return (
    <main className="admin">
      <header className="admin-bar">
        <div>
          <p className="eyebrow">REZ</p>
          <h1>Rezervacije</h1>
        </div>
        <div className="admin-bar-actions">
          <button type="button" className="button button-solid" onClick={startCreate}>
            Nova rezervacija
          </button>
          <a href="#vrh">Sajt</a>
          <button type="button" className="button button-ghost" onClick={logout}>
            Izlaz
          </button>
        </div>
      </header>

      <div className="admin-filters" role="tablist">
        {[
          ['sve', 'Sve'],
          ['potvrden', 'Potvrđene'],
          ['odbijen', 'Odbijene'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filter === id ? 'is-selected' : ''}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <form className="admin-form" onSubmit={save}>
          <h2>{editingId ? 'Izmena' : 'Nova rezervacija'}</h2>
          <label>
            Ime i prezime
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Telefon
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Frizura
            <select
              value={form.styleId}
              onChange={(event) => setForm({ ...form, styleId: event.target.value })}
            >
              {STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Datum
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
          </label>
          <label>
            Sat
            <select value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}>
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="button button-solid" disabled={busy}>
              {busy ? 'Čuvam...' : 'Sačuvaj'}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Odustani
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Učitavam rezervacije...</p>
      ) : visible.length === 0 ? (
        <p>Nema rezervacija.</p>
      ) : (
        <ul className="admin-list">
          {visible.map((row) => (
            <li key={row.id} className={row.status === 'odbijen' ? 'is-rejected' : ''}>
              <div>
                <strong>
                  {formatLong(row.date)} · {row.time}
                </strong>
                <span>
                  {row.name} · {row.phone} · {row.email} · {row.styleName}
                </span>
                <em>{row.status === 'odbijen' ? 'Odbijena' : 'Potvrđena'}</em>
              </div>
              <div className="admin-row-actions">
                <button type="button" onClick={() => startEdit(row)} disabled={busy}>
                  Izmeni
                </button>
                <button type="button" onClick={() => changeStatus(row)} disabled={busy}>
                  {row.status === 'odbijen' ? 'Vrati' : 'Odbij'}
                </button>
                {pendingDelete === row.id ? (
                  <button type="button" onClick={() => destroy(row.id)} disabled={busy}>
                    Potvrdi brisanje
                  </button>
                ) : (
                  <button type="button" onClick={() => setPendingDelete(row.id)} disabled={busy}>
                    Obriši
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
