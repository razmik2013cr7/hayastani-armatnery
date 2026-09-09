import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import NavTabs from './NavTabs.jsx'
import { translations } from '../i18n.js'
import mainLogo from '../assets/main-logo.jpeg'
import ticketLogo from '../assets/ticket-logo.jpeg'

const COIN_REWARD = 200

function readLang() {
  const saved = localStorage.getItem('lang')
  return saved && translations[saved] ? saved : 'hy'
}

function fmt(n) {
  return new Intl.NumberFormat('hy-AM').format(n)
}

export default function SilverPage({ onBack }) {
  const { user, supabase } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [lang, setLang] = useState(readLang)
  const [balance, setBalance] = useState(null) // null = loading
  const [message, setMessage] = useState(null) // { kind: 'ok' | 'err', text }
  const [busy, setBusy] = useState(false)
  const claimLock = useRef(false)

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const t = translations[lang]

  const notify = (kind, text) => {
    setMessage({ kind, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const loadBalance = useCallback(async () => {
    if (!user) return setBalance(0)
    const { data, error } = await supabase
      .from('profiles')
      .select('silver_coins')
      .eq('id', user.id)
      .single()
    if (error) {
      // Table missing or row not created yet — treat as 0 instead of crashing.
      setBalance(0)
      return
    }
    setBalance(data?.silver_coins ?? 0)
  }, [user, supabase])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  // Claim the QR reward exactly once per visit, signed-in users only.
  // Upsert is used so it also works when the profile row doesn't exist yet.
  useEffect(() => {
    if (!user || claimLock.current) return
    claimLock.current = true
    ;(async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('silver_coins')
        .eq('id', user.id)
        .single()
      const next = (prof?.silver_coins ?? 0) + COIN_REWARD
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, silver_coins: next })
      if (error) {
        notify('err', t.silver.claimFailed)
      } else {
        setBalance(next)
        notify('ok', `+${fmt(COIN_REWARD)} 🪙 ${t.silver.claimed}`)
      }
    })()
  }, [user, supabase, t])

  const removeCoins = async () => {
    if (busy || !balance) return
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, silver_coins: 0 })
    if (error) {
      notify('err', t.silver.removeFailed)
    } else {
      setBalance(0)
      notify('ok', t.silver.removed)
    }
    setBusy(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setBalance(0)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="logo-link" style={{ cursor: 'pointer', border: 'none', background: 'none' }} onClick={onBack}>
            <img className="logo-img" src={mainLogo} alt="" />
            <span className="logo-text">Հայաստանի Արմատները</span>
          </button>
          <div className="header-spacer" />
          {!user && (
            <button type="button" className="btn btn-ghost account-login" onClick={() => setAuthOpen(true)}>
              👤 {t.silver.signIn}
            </button>
          )}
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

      {authOpen && <AuthModal t={t} onClose={() => setAuthOpen(false)} />}

      <main style={{ flex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        <h1 style={{ marginTop: 0 }}>🪙 {t.silver.title}</h1>

        <div className="silver-balance-card">
          <div className="silver-balance-label">{t.silver.balance}</div>
          <div className="silver-balance-num">
            {balance === null ? '…' : `${fmt(balance)} 🪙`}
          </div>
          <div className="t-sub">{t.silver.subtitle}</div>
        </div>

        {message && (
          <div className={`silver-msg ${message.kind}`}>
            {message.kind === 'ok' ? '✅ ' : '⚠️ '}
            {message.text}
          </div>
        )}

        {user ? (
          balance > 0 && (
            <div className="silver-remove-box">
              <div className="dep-label">{t.silver.removeTitle}</div>
              <p className="t-sub" style={{ marginTop: 6 }}>{t.silver.removeHint}</p>
              <button type="button" className="btn btn-ghost silver-remove-btn" onClick={removeCoins} disabled={busy}>
                🗑 {t.silver.removeBtn}
              </button>
            </div>
          )
        ) : (
          <div className="silver-remove-box">
            <div className="dep-label">{t.silver.needLogin}</div>
            <p className="t-sub" style={{ marginTop: 6 }}>{t.silver.needLoginHint}</p>
          </div>
        )}

        {user && (
          <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={signOut}>
            {t.silver.signOut}
          </button>
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
