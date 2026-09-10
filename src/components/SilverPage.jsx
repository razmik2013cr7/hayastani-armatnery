import { useEffect, useRef, useState } from 'react'
import NavTabs from './NavTabs.jsx'
import { getSessionId, getGuestCoins, setGuestCoins } from '../pinAccess.js'
import { REWARD_PIN } from '../data.js'
import { supabase } from '../supabaseClient.js'
import { translations } from '../i18n.js'
import mainLogo from '../assets/main-logo.jpeg'
import ticketLogo from '../assets/ticket-logo.jpeg'

const COIN_REWARD = 50

function readLang() {
  const saved = localStorage.getItem('lang')
  return saved && translations[saved] ? saved : 'hy'
}

function fmt(n) {
  return new Intl.NumberFormat('hy-AM').format(n)
}

export default function SilverPage({ onBack }) {
  const [lang, setLang] = useState(readLang)
  // In-memory only: the 2011 PIN is required again on every visit.
  const [unlocked, setUnlocked] = useState(false)
  // Coins live on the device that scanned the QR — never in an account.
  const [balance, setBalance] = useState(() => getGuestCoins())
  const [message, setMessage] = useState(null) // { kind: 'ok' | 'err', text }
  const [busy, setBusy] = useState(false)
  const [gatePin, setGatePin] = useState('')
  const [gateError, setGateError] = useState(false)
  const claimLock = useRef(false)
  // When opened by scanning the footer QR, the URL carries the session id
  // of the device that DISPLAYED the code. The claim is then sent THERE.
  const [remoteSession, setRemoteSession] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('s')
    if (s) setRemoteSession(s)
  }, [])

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const t = translations[lang]

  const notify = (kind, text) => {
    setMessage({ kind, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // Claim the reward once per unlocked visit.
  // • Scanned from the footer QR → credit the DISPLAYING device (laptop)
  //   via the qr_claims table + Realtime, then return to the gate.
  // • Opened directly on this device → credit this device's wallet.
  useEffect(() => {
    if (!unlocked || claimLock.current) return
    claimLock.current = true
    if (remoteSession) {
      // Broadcast the claim to the device that displayed the QR — it credits
      // its own wallet live via Realtime (no database table involved).
      const ch = supabase.channel(`qr-claims:${remoteSession}`)
      ch.subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        ch.send({
          type: 'broadcast',
          event: 'claim',
          payload: { from: getSessionId(), coins: COIN_REWARD },
        })
        supabase.removeChannel(ch)
        notify('ok', t.silver.sentToComputer)
        setTimeout(() => {
          setUnlocked(false)
          claimLock.current = false
        }, 1500)
      })
      return
    }
    const next = getGuestCoins() + COIN_REWARD
    setGuestCoins(next)
    setBalance(next)
    notify('ok', `+${fmt(COIN_REWARD)} 🪙 ${t.silver.claimed}`)
  }, [unlocked, remoteSession, t])

  const removeCoins = () => {
    if (busy || !balance) return
    setBusy(true)
    setGuestCoins(0)
    setBalance(0)
    notify('ok', t.silver.removed)
    setBusy(false)
  }

  const lockNow = () => {
    setUnlocked(false)
    claimLock.current = false
    setBalance(getGuestCoins())
  }

  const tryGatePin = () => {
    if (gatePin.trim().toUpperCase() === REWARD_PIN) {
      setGateError(false)
      setGatePin('')
      setUnlocked(true)
    } else {
      setGateError(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="logo-link" style={{ cursor: 'pointer', border: 'none', background: 'none' }} onClick={onBack}>
            <img className="logo-img" src={mainLogo} alt="" />
            <span className="logo-text">Հավերժաքան Հայրենիք</span>
          </button>
          <div className="header-spacer" />
          <div className="lang-switch" role="group" aria-label="Language">
            {['hy', 'en', 'ru'].map((code) => (
              <button
                key={code}
                type="button"
                className={`lang-btn${lang === code ? ' active' : ''}`}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <NavTabs t={t} />
      </header>

      <main style={{ flex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        {!unlocked ? (
          // Gate: the 2011 PIN is required every time this page is opened —
          // coins are credited to the device, no account involved.
          <div className="gate-box silver-gate">
            <div className="gate-icon" aria-hidden="true">🔐</div>
            <h2>{t.silver.pinGateTitle}</h2>
            <p className="t-sub">{t.silver.pinGateHint}</p>
            <div className="gate-reward" aria-hidden="true">+{COIN_REWARD} 🪙</div>
            <div className="gate-pin-row">
              <input
                className="pin-input"
                autoComplete="off"
                maxLength={12}
                placeholder={t.checkout.pinPlaceholder}
                value={gatePin}
                onChange={(e) => {
                  setGatePin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))
                  setGateError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && tryGatePin()}
              />
              <button type="button" className="btn btn-ghost" onClick={tryGatePin}>
                {t.checkout.pinSubmit}
              </button>
            </div>
            {gateError && <div className="pin-error">{t.checkout.pinWrong}</div>}
          </div>
        ) : (
          <>
            <h1 style={{ marginTop: 0 }}>🪙 {t.silver.title}</h1>

            <div className="silver-balance-card">
              <div className="silver-balance-label">{t.silver.balance}</div>
              <div className="silver-balance-num">{fmt(balance)} 🪙</div>
              <div className="t-sub">{t.silver.subtitle}</div>
            </div>

            {message && (
              <div className={`silver-msg ${message.kind}`}>
                {message.kind === 'ok' ? '✅ ' : '⚠️ '}
                {message.text}
              </div>
            )}

            {balance > 0 && (
              <div className="silver-remove-box">
                <div className="dep-label">{t.silver.removeTitle}</div>
                <p className="t-sub" style={{ marginTop: 6 }}>{t.silver.removeHint}</p>
                <button type="button" className="btn btn-ghost silver-remove-btn" onClick={removeCoins} disabled={busy}>
                  🗑 {t.silver.removeBtn}
                </button>
              </div>
            )}

            <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={lockNow}>
              {t.silver.lockPin}
            </button>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <img src={ticketLogo} alt="" width="30" height="30" style={{ borderRadius: 8, objectFit: 'cover' }} />
          <span>+374 77 044201</span>
        </div>
      </footer>
    </div>
  )
}
