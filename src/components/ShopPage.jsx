import { useCallback, useEffect, useState } from 'react'
import { SHOP_ITEMS } from '../data.js'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { translations } from '../i18n.js'
import mainLogo from '../assets/main-logo.jpeg'

function readLang() {
  const saved = localStorage.getItem('lang')
  return saved && translations[saved] ? saved : 'hy'
}

function fmt(n) {
  return new Intl.NumberFormat('hy-AM').format(n)
}

export default function ShopPage({ onBack }) {
  const { user, supabase } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [lang, setLang] = useState(readLang)
  const [balance, setBalance] = useState(null) // null = loading
  const [message, setMessage] = useState(null) // { kind: 'ok' | 'err', text }
  const [busyId, setBusyId] = useState(null)

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
    setBalance(error ? 0 : (data?.silver_coins ?? 0))
  }, [user, supabase])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  const buy = async (item) => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (busyId) return
    if (balance < item.price) {
      notify('err', t.shop.needMore)
      return
    }
    setBusyId(item.id)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, silver_coins: balance - item.price })
    if (error) {
      notify('err', t.shop.buyFailed)
    } else {
      setBalance(balance - item.price)
      notify('ok', `✅ ${t.shop.items[item.id]} — ${t.shop.bought}`)
    }
    setBusyId(null)
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
      </header>

      {authOpen && <AuthModal t={t} onClose={() => setAuthOpen(false)} />}

      <main className="shop-main">
        <h1 style={{ marginTop: 0 }}>🛍 {t.shop.title}</h1>

        <div className="silver-balance-card">
          <div className="silver-balance-label">{t.silver.balance}</div>
          <div className="silver-balance-num">
            {balance === null ? '…' : `${fmt(balance)} 🪙`}
          </div>
          <a className="shop-earn-link" href="#/silver">
            🪙 {t.shop.earnMore}
          </a>
        </div>

        {message && (
          <div className={`silver-msg ${message.kind}`}>{message.text}</div>
        )}

        <div className="shop-grid">
          {SHOP_ITEMS.map((item) => {
            const affordable = user && balance !== null && balance >= item.price
            return (
              <div key={item.id} className="shop-card">
                <img className="shop-item-img" src={item.image} alt={t.shop.items[item.id]} loading="lazy" />
                <div className="shop-card-body">
                  <div className="shop-item-name">{t.shop.items[item.id]}</div>
                  <div className="shop-item-price">{fmt(item.price)} 🪙</div>
                  <button
                    type="button"
                    className={`btn ${affordable ? 'btn-primary' : 'btn-ghost'}`}
                    disabled={busyId === item.id || (user && balance !== null && !affordable)}
                    onClick={() => buy(item)}
                  >
                    {user
                      ? affordable
                        ? t.shop.buy
                        : t.shop.needMore
                      : t.silver.needLogin}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>Հայաստանի Արմատները</span>
          <span>+374 77 044201</span>
        </div>
      </footer>
    </div>
  )
}
