import { useEffect, useState } from 'react'
import { createBookingRecord, fetchBookings, removeBooking } from './api'
import Admin from './components/Admin'
import Barber from './components/Barber'
import Booking from './components/Booking'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Styles from './components/Styles'
import { photo, STYLES } from './data'

function scrollToBooking() {
  document.getElementById('zakazivanje')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  const [styleId, setStyleId] = useState(STYLES[0].id)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const sync = () => {
      const next = window.location.hash === '#admin'
      setIsAdmin(next)
      if (!next) setLoading(true)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (isAdmin) return undefined
    let active = true
    fetchBookings()
      .then((rows) => {
        if (!active) return
        setBookings(rows)
        setLoadError('')
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Termini se trenutno ne učitavaju. Osveži stranicu.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAdmin])

  function chooseStyle(id) {
    setStyleId(id)
    scrollToBooking()
  }

  async function addBooking(booking) {
    const saved = await createBookingRecord(booking)
    setBookings((current) =>
      [...current, saved].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    )
    return saved
  }

  async function cancelBooking(id) {
    await removeBooking(id)
    setBookings((current) => current.filter((booking) => booking.id !== id))
  }

  if (isAdmin) return <Admin />

  return (
    <>
      <Header />
      <main>
        <Hero />
        <figure className="shop-band">
          <img src={photo('shop.jpg')} alt="Enterijer berbernice sa crnim stolicama" />
        </figure>
        <Styles selectedId={styleId} onSelect={chooseStyle} />
        <Booking
          styles={STYLES}
          styleId={styleId}
          onStyleChange={setStyleId}
          bookings={bookings}
          loading={loading}
          loadError={loadError}
          onCreate={addBooking}
          onCancel={cancelBooking}
        />
        <Barber />
      </main>
      <Footer />
      <a className="mobile-bar" href="#zakazivanje">
        Zakaži termin
      </a>
    </>
  )
}
