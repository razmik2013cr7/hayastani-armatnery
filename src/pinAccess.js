import { useEffect, useState } from 'react'

// PIN access — entering a PIN unlocks gated features without an account.
// Two scopes:
//   • shop   — buying tickets and store items (PIN: STAFF_PIN, e.g. 2011RLOHN)
//   • rewards — the QR silver-coins page (PIN: REWARD_PIN, 2011)
// Unlocks persist on the device until locked again.
const PREFIX = 'pin_ok_'
const COINS_KEY = 'guest_silver_coins'
const EVT = 'pinaccess'

export const isPinUnlocked = (scope) => localStorage.getItem(PREFIX + scope) === '1'

export function unlockPin(scope) {
  localStorage.setItem(PREFIX + scope, '1')
  window.dispatchEvent(new Event(EVT))
}

export function lockPin(scope) {
  localStorage.removeItem(PREFIX + scope)
  window.dispatchEvent(new Event(EVT))
}

// Coin wallet for PIN-unlocked guests (no account to store them in).
export const getGuestCoins = () => Number(localStorage.getItem(COINS_KEY) || 0)

// Stable per-device session id — encoded in the footer QR so a phone scan
// can send its coin claim back to the device that DISPLAYED the code.
const SESSION_KEY = 'qr_session_id'

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function setGuestCoins(n) {
  localStorage.setItem(COINS_KEY, String(n))
  window.dispatchEvent(new Event(EVT))
}

export function usePinUnlocked(scope) {
  const [unlocked, setUnlocked] = useState(() => isPinUnlocked(scope))
  useEffect(() => {
    const sync = () => setUnlocked(isPinUnlocked(scope))
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [scope])
  return unlocked
}
