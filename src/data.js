import shopShirt from './assets/shop-shirt.jpeg'
import shopNotebookPen from './assets/shop-notebook-pen.jpeg'
import shopMug from './assets/shop-mug.jpeg'
import shopPen from './assets/shop-pen.jpeg'
import shopPhoneCase from './assets/shop-phone-case.jpeg'
import shopTermoMug from './assets/shop-termo-mug.jpeg'
import shopSummerHat from './assets/shop-summer-hat.jpeg'
import shopWinterHat from './assets/shop-winter-hat.jpeg'
import shopHoodie from './assets/shop-hoodie.jpeg'

// Canonical public URL of the site (deployed on Vercel) — used for the QR code.
// NOTE: the *-projects.vercel.app variant of this domain sits behind Vercel's
// SSO login wall, so the QR must always encode this clean production domain.
export const SITE_URL = 'https://hayastani-armatnery.vercel.app'

// Day categories — no "all" option; every group shows Հայկական + Արտասահմանյան.
export const CATEGORIES = [
  { id: '3', labelKey: 'nav.three', days: 3 },
  { id: '5', labelKey: 'nav.five', days: 5 },
  { id: '7', labelKey: 'nav.seven', days: 7 },
]

// Prices are for the whole tour (per booking, in AMD).
// home: true → Հայկական group, home: false → Արտասահմանյան group.
export const TOURS = [
  { id: 'gyumri', image: '/tour-gyumri.svg', price: 15000, days: 3, home: true },
  { id: 'dilijan', image: '/tour-dilijan.svg', price: 12000, days: 3, home: true },
  { id: 'jermuk', image: '/tour-jermuk.svg', price: 10000, days: 3, home: false },
  { id: 'goris', image: '/tour-goris.svg', price: 18000, days: 5, home: true },
  { id: 'tbilisi', image: '/tour-tbilisi.svg', price: 14000, days: 5, home: false },
  { id: 'sevan', image: '/tour-sevan.svg', price: 9000, days: 3, home: true },
  { id: 'syuniq', image: '/tour-syuniq.svg', price: 22000, days: 7, home: true },
  { id: 'georgia', image: '/tour-georgia.svg', price: 26000, days: 7, home: false },
]

// Display strings for a tour, honoring the UI language. Built-in tours come
// from i18n; DB-created tours may carry EN/RU variants (title_en/title_ru…)
// and their own departure address.
export function tourInfo(tour, lang, t) {
  if (!tour.dbId) return t.tours[tour.id]
  const pick = (base, en, ru) => (lang === 'en' ? en || base : lang === 'ru' ? ru || base : base)
  return {
    title: pick(tour.title, tour.titleEn, tour.titleRu),
    description: pick(tour.description, tour.descriptionEn, tour.descriptionRu) || '',
    duration: `${tour.days} ${t.checkout.daysWord}`,
  }
}

// Step-1 add-ons — each shows its price next to the Yes/No toggle.
export const EXTRAS = [
  {
    key: 'photoshoot',
    icon: '📷',
    // Default price — used for plans that don't define their own.
    price: 15000,
    // Package plans offered inside the extra's menu (labels in i18n under
    // checkout.<plansI18n>). A plan may override the price (AMD).
    plansI18n: 'photoPlans',
    plans: [
      { id: 'p1' },
      { id: 'p2' },
      { id: 'p3' },
      { id: 'p4', price: 80000 },
    ],
  },
  {
    key: 'food',
    icon: '🍽️',
    // Per-day rate: the chosen package (1/3/5/7 days) multiplies it —
    // 8000 × chosen days.
    price: 8000,
    plansI18n: 'foodPlans',
    plans: [
      { id: 'f1', days: 1 },
      { id: 'f3', days: 3 },
      { id: 'f5', days: 5 },
      { id: 'f7', days: 7 },
    ],
  },
  {
    key: 'cottage',
    icon: '🏡',
    price: 50000,
    plansI18n: 'cottagePlans',
    plans: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
  },
]

// Payment options — card brands show the card form, wallets ask for a phone number.
export const PAYMENT_METHODS = [
  { id: 'mastercard', label: 'Mastercard', type: 'card' },
  { id: 'visa', label: 'Visa', type: 'card' },
  { id: 'arca', label: 'ArCa', type: 'card' },
  { id: 'amex', label: 'American Express', type: 'card' },
  { id: 'idram', label: 'Idram', type: 'wallet' },
  { id: 'telcell', label: 'Telcell', type: 'wallet' },
  { id: 'school', label: 'Դպրոց', type: 'school' },
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

// The bus starts fully empty — seats are only taken by real bookings.
export const TAKEN_SEATS = []

// Staff PIN — unlocks buying (store + tours) without an account, and
// reveals who booked a taken seat on the bus map.
export const STAFF_PIN = '2011RLOHN'

// Rewards PIN — unlocks the QR silver-coins page on a device.
export const REWARD_PIN = '2011'

// Built-in tours: one bus per tour — ids used by the bus-cleaning picker.
export const BUILTIN_BUS_IDS = ['gyumri', 'dilijan', 'jermuk', 'goris', 'tbilisi', 'sevan', 'syuniq', 'georgia']

// Extra's price for the chosen plan. Food is a per-day rate: the plan
// carries how many days it covers (8000 × plan days); other plans may
// define their own price, otherwise the extra's base price applies.
export function extraPrice(extra, planId) {
  const plan = extra.plans?.find((p) => p.id === planId)
  if (plan?.days) return extra.price * plan.days
  return plan?.price ?? extra.price
}

// Price of a tour when booked for a different trip length than its base one,
// scaled proportionally and rounded to the nearest 100 AMD.
export function tourPriceForDays(tour, days) {
  if (days === tour.days) return tour.price
  return Math.round((tour.price * days) / tour.days / 100) * 100
}

// Souvenir shop — prices are in silver coins, earned from the QR page.
export const SHOP_ITEMS = [
  { id: 'shirt', image: shopShirt, price: 1500 },
  { id: 'notebookPen', image: shopNotebookPen, price: 800 },
  { id: 'mug', image: shopMug, price: 500 },
  { id: 'pen', image: shopPen, price: 120 },
  { id: 'phoneCase', image: shopPhoneCase, price: 300 },
  { id: 'termoMug', image: shopTermoMug, price: 1500 },
  { id: 'summerHat', image: shopSummerHat, price: 500 },
  { id: 'winterHat', image: shopWinterHat, price: 700 },
  { id: 'hoodie', image: shopHoodie, price: 2000 },
]
