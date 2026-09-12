import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import Header from './components/Header.jsx'
import NavTabs from './components/NavTabs.jsx'
import TourNav from './components/TourNav.jsx'
import TourGrid from './components/TourGrid.jsx'
import TourModal from './components/TourModal.jsx'
import Checkout from './components/Checkout.jsx'
import SilverPage from './components/SilverPage.jsx'
import LoyaltyCard from './components/LoyaltyCard.jsx'
import ShopPage from './components/ShopPage.jsx'
import QrClaimListener from './components/QrClaimListener.jsx'
import { AdminEntry } from './components/AdminPanel.jsx'
import { CATEGORIES, SITE_URL } from './data.js'
import { getSessionId } from './pinAccess.js'
import { AuthProvider } from './AuthContext.jsx'
import { translations } from './i18n.js'
import mainLogo from './assets/main-logo.jpeg'

export default function App() {
  const [lang, setLang] = useState('hy')
  // Day categories only (3/5/7) — the “all” option was removed.
  const [category, setCategory] = useState('3')
  const [selectedTour, setSelectedTour] = useState(null)
  const [checkoutTour, setCheckoutTour] = useState(null)
  const [loyaltyOpen, setLoyaltyOpen] = useState(false)
  const [route, setRoute] = useState(() => window.location.hash)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // The footer QR encodes the DEPLOYED rewards link (not localhost) plus
  // this device's session id — so a phone scan credits the coins to the
  // device that DISPLAYED the code, not to the phone itself.
  useEffect(() => {
    const url = `${SITE_URL}/?s=${encodeURIComponent(getSessionId())}#/silver`
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: '#23201c', light: '#faf6ef' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [])

  const t = translations[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const hero = useMemo(() => {
    const copy = {
      hy: {
        title: 'Բացահայտիր Հավերժական Հայրենիքը',
        sub: 'Արմատներով ամուր, Գագաթներով վեհ',
      },
      en: {
        title: 'Discover the Eternal Homeland',
        sub: 'Strong in our roots, majestic on our peaks.',
      },
      ru: {
        title: 'Открой вечную Родину',
        sub: 'Крепки корнями, величественны вершинами.',
      },
    }
    return copy[lang]
  }, [lang])

  if (route === '#/silver' || route.startsWith('#/silver?')) {
    return (
      <AuthProvider>
        <SilverPage onBack={() => { window.location.hash = ''; setRoute('') }} />
      </AuthProvider>
    )
  }

  if (route === '#/shop' || route.startsWith('#/shop?')) {
    return (
      <AuthProvider>
        <ShopPage onBack={() => { window.location.hash = ''; setRoute('') }} />
      </AuthProvider>
    )
  }

  // Day count derived from the selected navbar category.
  const days = CATEGORIES.find((c) => c.id === category)?.days ?? null

  return (
    <AuthProvider>
      <Header lang={lang} onLangChange={setLang} t={t} />
      <NavTabs t={t} />
      <TourNav active={category} onChange={setCategory} t={t} />
      <QrClaimListener />

      <section className="hero">
        <div className="hero-inner">
          <h1>{hero.title}</h1>
          <p>{hero.sub}</p>
        </div>
      </section>

      <div className="admin-entry-wrap">
        <AdminEntry t={t} />
      </div>

      <main style={{ flex: 1 }}>
        <TourGrid days={days} onOpen={setSelectedTour} t={t} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={mainLogo} alt="" width="26" height="26" style={{ borderRadius: 6, objectFit: 'cover' }} />
            Հավերժական Հայրենիք
          </strong>
          <span>+374 77 044201</span>
          {qrDataUrl && (
            <a className="qr-link" href="#/silver" aria-label="Silver coins">
              <img src={qrDataUrl} alt="Silver coins QR" width="84" height="84" />
              <span>🪙</span>
            </a>
          )}
          <a className="footer-link" href="#/shop" aria-label="Shop">
            🛍
          </a>
          <button type="button" className="footer-link loyalty-footer-btn" onClick={() => setLoyaltyOpen(true)}>
            ⭐
          </button>
        </div>
      </footer>

      {selectedTour && (
        <TourModal
          tour={selectedTour}
          t={t}
          onClose={() => setSelectedTour(null)}
          onBuy={() => {
            setCheckoutTour(selectedTour)
            setSelectedTour(null)
          }}
        />
      )}

      {checkoutTour && (
        <Checkout
          tour={checkoutTour}
          categoryDays={days}
          t={t}
          onClose={() => setCheckoutTour(null)}
        />
      )}

      {loyaltyOpen && <LoyaltyCard t={t} onClose={() => setLoyaltyOpen(false)} />}
    </AuthProvider>
  )
}
