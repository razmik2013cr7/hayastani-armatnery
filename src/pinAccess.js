import { useEffect, useState } from 'react'

// PIN access — entering a PIN unlocks gated features without an account.
// Two scopes:
//   • shop   — buying tickets and store items (PIN: STAFF_PIN, e.g. 2011RLOHN)
//   • rewards — the QR silver-coins page (PIN: REWARD_PIN, 2011)
// Unlocks are PER-VISIT: nothing is persisted, so the PIN must be entered
// again every time the page is (re)opened.
//
// Concurrent PIN sessions are LIMITED to MAX_DEVICES: each unlocked device
// registers itself in a Supabase table with a periodic heartbeat; a device
// that stops sending the heartbeat (closed tab/browser) is considered gone
// and its slot frees up. When all slots are taken, new PIN entries are
// rejected until someone leaves.
const COINS_KEY = 'guest_silver_coins'
const EVT = 'pinaccess'

// In-memory unlock map — resets on every full page load, which is exactly
// the "enter the PIN each time" behavior.
const unlockedScopes = new Set()

export const isPinUnlocked = (scope) => unlockedScopes.has(scope)

export function unlockPin(scope) {
  unlockedScopes.add(scope)
  window.dispatchEvent(new Event(EVT))
}

export function lockPin(scope) {
  unlockedScopes.delete(scope)
  window.dispatchEvent(new Event(EVT))
}

// Coin wallet for PIN-unlocked guests (no account to store them in).
export const getGuestCoins = () => Number(localStorage.getItem(COINS_KEY) || 0)

// Max devices allowed to hold the PIN at the same time.
export const MAX_PIN_DEVICES = 7

// Stable id for this browser tab session (one device slot per tab session).
export function getSessionId() {
  let id = sessionStorage.getItem('pin_session_id')
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('pin_session_id', id)
  }
  return id
}

// Stable per-device session id — encoded in the footer QR so a phone scan
// can send its coin claim back to the device that DISPLAYED the code.
const QR_SESSION_KEY = 'qr_session_id'

export function getQrSessionId() {
  let id = localStorage.getItem(QR_SESSION_KEY)
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(QR_SESSION_KEY, id)
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
