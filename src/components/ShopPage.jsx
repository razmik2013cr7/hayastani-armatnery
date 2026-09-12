import { useCallback, useEffect, useState } from 'react'
import { SHOP_ITEMS } from '../data.js'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { getGuestCoins, lockPin, setGuestCoins, usePinUnlocked } from '../pinAccess.js'

const SHOP_SCOPE = 'shop'
import NavTabs from './NavTabs.jsx'
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
  const pinUnlocked = usePinUnlocked(SHOP_SCOPE)
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
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('silver_coins')
        .eq('id', user.id)
        .single()
      setBalance(error ? 0 : (data?.silver_coins ?? 0))
      return
    }
    // Guests keep their coins on this device — visible even while the
    // PIN is locked (locking only gates purchasing, not the balance).
    setBalance(getGuestCoins())
  }, [user, supabase])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  const buy = async (item) => {
    if (!user && !pinUnlocked) {
      setAuthOpen(true)
      return
    }
    if (busyId) return
    if (balance < item.price) {
      notify('err', t.shop.needMore)
      return
    }
    setBusyId(item.id)
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, silver_coins: balance - item.price })
      if (error) {
        notify('err', t.shop.buyFailed)
      } else {
        setBalance(balance - item.price)
        notify('ok', `✅ ${t.shop.items[item.id]} — ${t.shop.bought}`)
      }
    } else {
      setGuestCoins(balance - item.price)
      setBalance(balance - item.price)
      notify('ok', `✅ ${t.shop.items[item.id]} — ${t.shop.bought}`)
    }
    // Record the order and email the owner:
    // «ԱՊՐԱՆՔԸ» գնվել է «ՕԳՏԱՏԵՐԻ» կողմից → rafikmkrtchyan25@gmail.com
    const itemName = t.shop.items[item.id]
    const buyerName =
      user?.user_metadata?.full_name ||
      user?.email ||
      'Հյուր (PIN)'
    supabase
      .from('shop_orders')
      .insert({
        item_id: item.id,
        item_name: itemName,
        price_coins: item.price,
        buyer_email: user?.email ?? null,
        buyer_name: user?.user_metadata?.full_name ?? null,
      })
      .then(({ error }) => {
        if (error) console.warn('shop_orders insert failed:', error.message)
      })
    // Fire-and-forget email via FormSubmit (no backend or API keys needed).
    fetch('https://formsubmit.co/ajax/rafikmkrtchyan25@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `${itemName} գնվել է ${buyerName} կողմից`,
        _template: 'box',
        item: itemName,
        price: `${item.price} 🪙`,
        buyer: buyerName,
      }),
    }).catch((err) => console.warn('order email failed:', err))
    // One-shot PIN: after a guest purchase the PIN locks again, so the
    // next purchase asks for it once more.
    if (!user) lockPin(SHOP_SCOPE)
    setBusyId(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="logo-link" style={{ cursor: 'pointer', border: 'none', background: 'none' }} onClick={onBack}>
            <img className="logo-img" src={mainLogo} alt="" />
            <span className="logo-text">Հավերժական Հայրենիք</span>
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
            const canBuy = user || pinUnlocked
            const affordable = canBuy && balance !== null && balance >= item.price
            return (
              <div key={item.id} className="shop-card">
                <img className="shop-item-img" src={item.image} alt={t.shop.items[item.id]} loading="lazy" />
                <div className="shop-card-body">
                  <div className="shop-item-name">{t.shop.items[item.id]}</div>
                  <div className="shop-item-price">{fmt(item.price)} 🪙</div>
                  <button
                    type="button"
                    className={`btn ${affordable ? 'btn-primary' : 'btn-ghost'}`}
                    disabled={busyId === item.id || (canBuy && balance !== null && !affordable)}
                    onClick={() => buy(item)}
                  >
                    {canBuy
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
          <span>Հավերժական Հայրենիք</span>
          <span>+374 77 044201</span>
        </div>
      </footer>
    </div>
  )
}
