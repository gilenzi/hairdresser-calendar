function root() {
  const value = import.meta.env.VITE_SUPABASE_URL || ''
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function headers(extra = {}) {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  }
}

function mapRow(row) {
  return {
    id: row.id,
    styleId: row.style_id,
    styleName: row.style_name,
    minutes: row.minutes,
    price: row.price,
    date: row.booking_date,
    time: String(row.time).slice(0, 5),
    name: row.client_name,
    phone: row.phone,
    email: row.client_email || '',
    status: row.status || 'potvrden',
  }
}

async function readError(response) {
  try {
    const payload = await response.json()
    if (payload?.code === '23P01') {
      return 'Taj termin je upravo zauzet. Izaberi drugi sat.'
    }
    if (payload?.message) return payload.message
  } catch {
    // The body was not JSON.
  }
  return 'Termin nije sačuvan. Pokušaj ponovo.'
}

const PUBLIC_COLUMNS =
  'id,style_id,style_name,minutes,price,booking_date,time,client_name,phone,status'
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS},client_email`

export async function fetchBookings() {
  const response = await fetch(
    `${root()}/rest/v1/bookings?select=${PUBLIC_COLUMNS}&status=eq.potvrden&order=booking_date.asc,time.asc`,
    { headers: headers() },
  )
  if (!response.ok) throw new Error(await readError(response))
  const rows = await response.json()
  return rows.map(mapRow)
}

export async function createBookingRecord(booking) {
  const response = await fetch(`${root()}/rest/v1/bookings`, {
    method: 'POST',
    headers: headers({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(bookingBody(booking)),
  })
  if (!response.ok) throw new Error(await readError(response))
  const rows = await response.json()
  return mapRow(rows[0])
}

export async function fetchAllBookings() {
  const response = await fetch(
    `${root()}/rest/v1/bookings?select=${ADMIN_COLUMNS}&order=created_at.desc`,
    { headers: headers() },
  )
  if (!response.ok) throw new Error(await readError(response))
  const rows = await response.json()
  return rows.map(mapRow)
}

function bookingBody(booking) {
  return {
    style_id: booking.styleId,
    style_name: booking.styleName,
    minutes: booking.minutes,
    price: booking.price,
    booking_date: booking.date,
    time: booking.time,
    start_minute: 0,
    client_name: booking.name,
    phone: booking.phone,
    client_email: booking.email,
    status: booking.status || 'potvrden',
  }
}

export async function updateBookingRecord(id, booking) {
  const response = await fetch(`${root()}/rest/v1/bookings?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(bookingBody(booking)),
  })
  if (!response.ok) throw new Error(await readError(response))
  const rows = await response.json()
  return mapRow(rows[0])
}

export async function setBookingStatus(id, status) {
  const response = await fetch(`${root()}/rest/v1/bookings?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error(await readError(response))
  const rows = await response.json()
  return mapRow(rows[0])
}

export async function removeBooking(id) {
  const response = await fetch(`${root()}/rest/v1/bookings?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=minimal' }),
  })
  if (!response.ok) throw new Error(await readError(response))
}
