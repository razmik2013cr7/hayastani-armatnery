import { useEffect, useState } from 'react'

// Staff PIN access — entering the PIN unlocks login-gated features
// (buying tickets, shop purchases, QR coin rewards) without an account.
// The unlock persists on this device until locked again.
const KEY = 'staff_pin_ok'
const COINS_KEY = 'guest_silver_coins'
const EVT = 'pinaccess'

export const isPinUnlocked = () => localStorage.getItem(KEY) === '1'

export function unlockPin() {
  localStorage.setItem(KEY, '1')
  window.dispatchEvent(new Event(EVT))
}

export function lockPin() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(EVT))
}

// Coin wallet for PIN-unlocked guests (no account to store them in).
export const getGuestCoins = () => Number(localStorage.getItem(COINS_KEY) || 0)

export function setGuestCoins(n) {
  localStorage.setItem(COINS_KEY, String(n))
  window.dispatchEvent(new Event(EVT))
}

export function usePinUnlocked() {
  const [unlocked, setUnlocked] = useState(isPinUnlocked)
  useEffect(() => {
    const sync = () => setUnlocked(isPinUnlocked())
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return unlocked
}
