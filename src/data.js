export const CATEGORIES = [
  { id: 'all', labelKey: 'nav.all', people: null },
  { id: '1', labelKey: 'nav.one', people: 1 },
  { id: '5', labelKey: 'nav.five', people: 5 },
  { id: '10', labelKey: 'nav.ten', people: 10 },
]

// For now every category shows the same 5 tours; prices are PER PERSON.
export const TOURS = [
  {
    id: 'gyumri',
    image: '/tour-gyumri.svg',
    price: 15000,
    seats: 1,
  },
  {
    id: 'dilijan',
    image: '/tour-dilijan.svg',
    price: 12000,
    seats: 5,
  },
  {
    id: 'goris',
    image: '/tour-goris.svg',
    price: 18000,
    seats: 10,
  },
  {
    id: 'sevan',
    image: '/tour-sevan.svg',
    price: 9000,
    seats: 5,
  },
  {
    id: 'syuniq',
    image: '/tour-syuniq.svg',
    price: 22000,
    seats: 10,
  },
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

export const TAKEN_SEATS = ['3A', '3B', '7C', '7D', '9A'] // pretend already sold
