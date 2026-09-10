// Loyalty-card storage helpers.
// • Signed-in accounts: stars + activation live in profiles.loyalty_stars /
//   profiles.loyalty_activated (see supabase-migration.sql).
// • Guests (no account): everything lives in this device's localStorage.

const STARS_KEY = 'loyalty_stars'
const ACTIVE_KEY = 'loyalty_activated'
const CARD_KEY = 'loyalty_card_no'

export function getGuestStars() {
  return Number(localStorage.getItem(STARS_KEY)) || 0
}

export function setGuestStars(n) {
  localStorage.setItem(STARS_KEY, String(n))
}

export function getGuestActivated() {
  return localStorage.getItem(ACTIVE_KEY) === '1'
}

export function setGuestActivated(active) {
  if (active) localStorage.setItem(ACTIVE_KEY, '1')
  else localStorage.removeItem(ACTIVE_KEY)
}

// Card number for guests — created once, then kept on the device (RA-001234 style).
export function getGuestCardNo() {
  let no = localStorage.getItem(CARD_KEY)
  if (!no) {
    no = 'RA-' + String(Math.floor(100000 + Math.random() * 900000))
    localStorage.setItem(CARD_KEY, no)
  }
  return no
}

// Stable card number for an account, derived from its user id.
export function cardNoForUser(userId) {
  let h = 0
  for (const ch of String(userId)) h = (h * 31 + ch.charCodeAt(0)) % 900000
  return 'RA-' + String(100000 + h)
}
