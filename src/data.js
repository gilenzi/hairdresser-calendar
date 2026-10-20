export const SALON = {
  name: 'REZ',
  city: 'Beograd',
  address: 'Cetinjska 15, Vračar',
  phone: '065 123 4567',
  phoneHref: 'tel:+381651234567',
  barber: 'Luka Petrović',
}

export const STYLES = [
  {
    id: 'fade',
    name: 'Skin fade',
    blurb: 'Čist prelaz do kože, oštra linija i dužina na vrhu po tvojoj meri.',
    minutes: 40,
    price: 1800,
    image: 'fade.jpg',
    alt: 'Frizer radi skin fade i liniju brade',
  },
  {
    id: 'classic',
    name: 'Klasični rez',
    blurb: 'Uredan svakodnevni kroj. Lako se nosi i bez proizvoda.',
    minutes: 30,
    price: 1400,
    image: 'portrait.jpg',
    alt: 'Muškarac sa urednim klasičnim šišanjem',
  },
  {
    id: 'crop',
    name: 'Teksturirani crop',
    blurb: 'Kratko sa strane, tekstura na vrhu. Za kosu koja treba pravac.',
    minutes: 45,
    price: 1900,
    image: 'crop-cut.jpg',
    alt: 'Teksturirani crop sa fade stranama',
  },
  {
    id: 'beard',
    name: 'Šišanje i brada',
    blurb: 'Rez plus oblikovanje brade. Izađeš potpuno sređen.',
    minutes: 60,
    price: 2500,
    image: 'beard-cut.jpg',
    alt: 'Muškarac sa bradom tokom šišanja',
  },
]

export function photo(file) {
  return `${import.meta.env.BASE_URL}photos/${file}`
}

export function formatPrice(amount) {
  return `${new Intl.NumberFormat('sr-RS').format(amount)} RSD`
}

export function formatDuration(minutes) {
  return `${minutes} min`
}
