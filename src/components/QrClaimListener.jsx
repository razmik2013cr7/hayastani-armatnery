import { useEffect, useRef, useState } from 'react'
import { getSessionId, setGuestCoins, getGuestCoins } from '../pinAccess.js'
import { supabase } from '../supabaseClient.js'
import { translations } from '../i18n.js'

const COIN_REWARD = 50
const COOLDOWN_MS = 5000

// Listens for coin claims sent from phones that scanned THIS device's QR.
// The phone broadcasts on channel qr-claims:<our session id>; Supabase
// Realtime delivers it here and we credit the local device wallet.
// (Broadcast needs no database table — works with the anon key alone.)
export default function QrClaimListener() {
  const [toast, setToast] = useState(null)
  const lastClaim = useRef(0)

  useEffect(() => {
    const sessionId = getSessionId()
    const channel = supabase
      .channel(`qr-claims:${sessionId}`)
      .on('broadcast', { event: 'claim' }, () => {
        const now = Date.now()
        if (now - lastClaim.current < COOLDOWN_MS) return // debounce double-fires
        lastClaim.current = now
        const next = getGuestCoins() + COIN_REWARD
        setGuestCoins(next)
        const lang = localStorage.getItem('lang') || 'hy'
        const t = translations[lang]
        setToast(`+${COIN_REWARD} 🪙 ${t.silver.remoteClaimed}`)
        setTimeout(() => setToast(null), 5000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      setToast(null)
    }
  }, [])

  if (!toast) return null

  return (
    <div className="qr-claim-toast" role="status">✅ {toast}</div>
  )
}
