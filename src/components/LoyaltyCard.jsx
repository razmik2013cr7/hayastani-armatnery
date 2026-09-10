import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { STAFF_PIN, TOURS } from '../data.js'
import {
  getGuestStars,
  setGuestStars,
  getGuestActivated,
  setGuestActivated,
  getGuestCardNo,
  cardNoForUser,
} from '../loyalty.js'
import mainLogo from '../assets/main-logo.jpeg'

const TOTAL_STARS = 10

// «Հավատարմության քարտ» — collect 10 PIN-unlocked stars and pick a free tour.
// • With an account: activation + stars are saved to profiles (loyalty_stars,
//   loyalty_activated — see supabase-migration.sql).
// • Without an account: the card is activated with the staff PIN and all
//   progress lives in this device's localStorage.
export default function LoyaltyCard({ t, onClose }) {
  const { user, supabase, profile } = useAuth()
  const [stars, setStars] = useState(0)
  const [activated, setActivated] = useState(false)
  const [cardNo, setCardNo] = useState('')
  const [pinMode, setPinMode] = useState(null) // 'activate' | 'star' | null
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err', text }

  const notify = (kind, text) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 5000)
  }

  // Load the card state from the profile or the device.
  useEffect(() => {
    if (user) {
      setCardNo(cardNoForUser(user.id))
      setStars(profile?.loyalty_stars ?? 0)
      setActivated(!!profile?.loyalty_activated)
    } else {
      setCardNo(getGuestCardNo())
      setStars(getGuestStars())
      setActivated(getGuestActivated())
    }
  }, [user, profile])

  const persist = async (nextStars, nextActivated) => {
    setStars(nextStars)
    setActivated(nextActivated)
    if (user) {
      setBusy(true)
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, loyalty_stars: nextStars, loyalty_activated: nextActivated })
      setBusy(false)
      if (error) notify('err', t.loyalty.saveFailed)
    } else {
      setGuestStars(nextStars)
      setGuestActivated(nextActivated)
    }
  }

  const applyPin = (mode) => {
    if (pin.trim().toUpperCase() !== STAFF_PIN) {
      setPinError(true)
      return
    }
    setPinError(false)
    setPin('')
    setPinMode(null)
    if (mode === 'activate') {
      persist(stars, true)
      notify('ok', `✅ ${t.loyalty.activated}`)
    } else {
      persist(Math.min(stars + 1, TOTAL_STARS), true)
      notify('ok', `⭐ ${t.loyalty.starOn}`)
    }
  }

  const starClick = (i) => {
    if (i < stars || busy) return
    setPinMode(activated ? 'star' : 'activate')
  }

  const pickTour = (tour) => {
    // Reward claimed — restart the cycle so the card can be filled again.
    persist(0, true)
    if (!user) localStorage.setItem('loyalty_reward', tour.id)
    notify('ok', `🎁 ${t.loyalty.rewardChosen}: ${t.tours[tour.id].title}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loyalty-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-body">
          <div className="loyalty-card">
            <div className="loyalty-arch">
              <img src={mainLogo} alt="" />
            </div>
            <div className="loyalty-title">{t.loyalty.title}</div>
            <div className="loyalty-row">
              <span>{t.loyalty.cardNo}:</span>
              <strong>{cardNo}</strong>
            </div>
            <div className="loyalty-stars" role="group" aria-label={t.loyalty.title}>
              {Array.from({ length: TOTAL_STARS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`loyalty-star${i < stars ? ' on' : ''}`}
                  onClick={() => starClick(i)}
                  aria-label={i < stars ? `⭐ ${i + 1}` : t.loyalty.pinStar}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="loyalty-count">{stars} / {TOTAL_STARS}</div>
            <div className="loyalty-hint">{activated ? t.loyalty.starHint : t.loyalty.activateHint}</div>
          </div>

          {msg && <div className={`silver-msg ${msg.kind}`}>{msg.text}</div>}

          {!activated && (
            user ? (
              <button type="button" className="btn btn-primary loyalty-activate" onClick={() => persist(stars, true)} disabled={busy}>
                ✨ {t.loyalty.activate}
              </button>
            ) : (
              <div className="loyalty-guest-pin">
                <div className="gate-pin-row">
                  <input
                    className="pin-input"
                    autoComplete="off"
                    maxLength={12}
                    placeholder={t.checkout.pinPlaceholder}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))
                      setPinError(false)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && applyPin('activate')}
                  />
                  <button type="button" className="btn btn-ghost" onClick={() => applyPin('activate')}>
                    {t.checkout.pinSubmit}
                  </button>
                </div>
                {pinError && <div className="pin-error">{t.checkout.pinWrong}</div>}
              </div>
            )
          )}

          {activated && stars >= TOTAL_STARS && (
            <div className="loyalty-reward">
              <h3>🎁 {t.loyalty.rewardTitle}</h3>
              <div className="loyalty-reward-grid">
                {TOURS.map((tour) => (
                  <button key={tour.id} type="button" className="loyalty-reward-item" onClick={() => pickTour(tour)}>
                    <strong>{t.tours[tour.id].title}</strong>
                    <em>{t.tours[tour.id].duration}</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pinMode && (
            <div className="pin-overlay" role="dialog" aria-modal="true" onClick={() => setPinMode(null)}>
              <div className="pin-box" onClick={(e) => e.stopPropagation()}>
                <div className="pin-title">🔐 {pinMode === 'activate' ? t.loyalty.pinActivate : t.loyalty.pinStar}</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    applyPin(pinMode)
                  }}
                >
                  <input
                    className="pin-input"
                    autoComplete="off"
                    autoFocus
                    maxLength={12}
                    placeholder={t.checkout.pinPlaceholder}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))
                      setPinError(false)
                    }}
                  />
                  {pinError && <div className="pin-error">{t.checkout.pinWrong}</div>}
                  <div className="checkout-actions" style={{ marginTop: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setPinMode(null)}>
                      {t.modal.close}
                    </button>
                    <button type="submit" className="btn btn-primary">{t.checkout.pinSubmit}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
