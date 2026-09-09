import shopShirt from './assets/shop-shirt.jpeg'
import shopNotebookPen from './assets/shop-notebook-pen.jpeg'
import shopMug from './assets/shop-mug.jpeg'
import shopPen from './assets/shop-pen.jpeg'
import shopPhoneCase from './assets/shop-phone-case.jpeg'
import shopSummerHat from './assets/shop-summer-hat.jpeg'
import shopWinterHat from './assets/shop-winter-hat.jpeg'
import shopHoodie from './assets/shop-hoodie.jpeg'

// Canonical public URL of the site (deployed on Vercel) — used for the QR code.
// NOTE: the *-projects.vercel.app variant of this domain sits behind Vercel's
// SSO login wall, so the QR must always encode this clean production domain.
export const SITE_URL = 'https://hayastani-armatnery.vercel.app'

export const CATEGORIES = [
  { id: 'all', labelKey: 'nav.all', days: null },
  { id: '1', labelKey: 'nav.one', days: 1 },
  { id: '2', labelKey: 'nav.two', days: 2 },
  { id: '3', labelKey: 'nav.three', days: 3 },
]

// Prices are for the whole tour (per booking, in AMD).
export const TOURS = [
  { id: 'gyumri', image: '/tour-gyumri.svg', price: 15000, days: 1 },
  { id: 'dilijan', image: '/tour-dilijan.svg', price: 12000, days: 1 },
  { id: 'goris', image: '/tour-goris.svg', price: 18000, days: 2 },
  { id: 'sevan', image: '/tour-sevan.svg', price: 9000, days: 1 },
  { id: 'syuniq', image: '/tour-syuniq.svg', price: 22000, days: 3 },
]

// Step-1 add-ons — each shows its price next to the Yes/No toggle.
export const EXTRAS = [
  { key: 'photoshoot', icon: '📷', price: 15000 },
  { key: 'food', icon: '🍽️', price: 8000 },
  { key: 'cottage', icon: '🏡', price: 25000 },
]

// Step-2 choice: shared bus tour or a personal (private) one.
export const TOUR_TYPES = [
  { id: 'group', icon: '🚌', price: 0 },
  { id: 'personal', icon: '🚐', price: 20000 },
]

// Payment options — card brands show the card form, wallets ask for a phone number.
export const PAYMENT_METHODS = [
  { id: 'mastercard', label: 'Mastercard', type: 'card' },
  { id: 'visa', label: 'Visa', type: 'card' },
  { id: 'arca', label: 'ArCa', type: 'card' },
  { id: 'amex', label: 'American Express', type: 'card' },
  { id: 'idram', label: 'Idram', type: 'wallet' },
  { id: 'telcell', label: 'Telcell', type: 'wallet' },
]

// Seat map: 45-seat bus — 2 + 2 seating, driver in front, back row of 5.
export const BUS_SEAT_ROWS = (() => {
  const rows = []
  for (let r = 1; r <= 11; r++) {
    const letters = r === 11 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']
    rows.push(letters.map((l) => `${r}${l}`))
  }
  return rows
})()

export const BUS_SEATS = BUS_SEAT_ROWS.flat()

export const TAKEN_SEATS = ['3A', '3B', '7C', '7D', '9A'] // demo fallback when the DB is unreachable

// Staff PIN — entering it on a taken seat reveals who booked it.
export const STAFF_PIN = '2011'

// Souvenir shop — prices are in silver coins, earned from the QR page.
export const SHOP_ITEMS = [
  { id: 'shirt', image: shopShirt, price: 1500 },
  { id: 'notebookPen', image: shopNotebookPen, price: 800 },
  { id: 'mug', image: shopMug, price: 500 },
  { id: 'pen', image: shopPen, price: 120 },
  { id: 'phoneCase', image: shopPhoneCase, price: 300 },
  { id: 'summerHat', image: shopSummerHat, price: 500 },
  { id: 'winterHat', image: shopWinterHat, price: 700 },
  { id: 'hoodie', image: shopHoodie, price: 2000 },
]
