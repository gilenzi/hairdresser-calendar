const OPENING = {
  1: [9 * 60, 19 * 60],
  2: [9 * 60, 19 * 60],
  3: [9 * 60, 19 * 60],
  4: [9 * 60, 19 * 60],
  5: [9 * 60, 19 * 60],
  6: [9 * 60, 15 * 60],
}

export const WEEKDAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

export const MONTHS = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'jun',
  'jul',
  'avgust',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
]

export function toISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayISO(now = new Date()) {
  return toISO(now)
}

export function formatLong(iso) {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseISO(iso))
}

export function monthLabel(date) {
  const name = MONTHS[date.getMonth()]
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`
}

export function monthCells(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function overlaps(startA, lengthA, startB, lengthB) {
  return startA < startB + lengthB && startB < startA + lengthA
}

export function isClosed(iso) {
  return !OPENING[parseISO(iso).getDay()]
}

export function slotsFor(iso, minutes, bookings, now = new Date()) {
  const bounds = OPENING[parseISO(iso).getDay()]
  if (!bounds) return []

  const [open, close] = bounds
  const dayBookings = bookings.filter((booking) => booking.date === iso)
  const slots = []

  for (let start = open; start + minutes <= close; start += 30) {
    const time = minutesToTime(start)
    const slotDate = parseISO(iso)
    const [hours, mins] = time.split(':').map(Number)
    slotDate.setHours(hours, mins, 0, 0)
    const past = slotDate.getTime() <= now.getTime()
    const taken = dayBookings.some((booking) =>
      overlaps(start, minutes, timeToMinutes(booking.time), booking.minutes),
    )
    slots.push({
      time,
      free: !past && !taken,
      reason: past ? 'past' : taken ? 'taken' : 'free',
    })
  }

  return slots
}

export function dayStatus(iso, minutes, bookings, now = new Date()) {
  if (iso < todayISO(now)) return 'past'
  if (isClosed(iso)) return 'closed'
  if (!minutes) return 'open'
  const slots = slotsFor(iso, minutes, bookings, now)
  const bookable = slots.filter((slot) => slot.reason !== 'past')
  if (bookable.length === 0) return 'past'
  if (bookable.every((slot) => !slot.free)) return 'full'
  return 'open'
}

export function normalizePhone(value) {
  return value.replace(/[^\d+]/g, '')
}

export function isValidPhone(value) {
  return /^(0\d{8,9}|\+381\d{8,9})$/.test(normalizePhone(value))
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidName(value) {
  return /^[\p{L}][\p{L}\s.'-]{1,48}$/u.test(value.trim())
}

export function createBooking({ style, date, time, name, phone, email }) {
  return {
    id: crypto.randomUUID(),
    styleId: style.id,
    styleName: style.name,
    minutes: style.minutes,
    price: style.price,
    date,
    time,
    name: name.trim(),
    phone: normalizePhone(phone),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }
}

export function canBook(booking, bookings) {
  return slotsFor(booking.date, booking.minutes, bookings).some(
    (slot) => slot.time === booking.time && slot.free,
  )
}
