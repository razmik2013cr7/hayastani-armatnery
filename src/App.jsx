import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import Header from './components/Header.jsx'
import NavTabs from './components/NavTabs.jsx'
import TourNav from './components/TourNav.jsx'
import TourGrid from './components/TourGrid.jsx'
import TourModal from './components/TourModal.jsx'
import Checkout from './components/Checkout.jsx'
import SilverPage from './components/SilverPage.jsx'
import ShopPage from './components/ShopPage.jsx'
import { CATEGORIES, SITE_URL } from './data.js'
import { AuthProvider } from './AuthContext.jsx'
import { translations } from './i18n.js'
import mainLogo from './assets/main-logo.jpeg'

export default function App() {
  const [lang, setLang] = useState('hy')
  const [category, setCategory] = useState('all')
  const [selectedTour, setSelectedTour] = useState(null)
  const [checkoutTour, setCheckoutTour] = useState(null)
  const [route, setRoute] = useState(() => window.location.hash)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // The footer QR encodes the DEPLOYED site's silver-coins link (not localhost),
  // so scanning it with a phone always lands on the live rewards page.
  useEffect(() => {
    const url = `${SITE_URL}/#/silver`
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
        title: 'Բացահայտիր Հայաստանի արմատները',
        sub: 'Ավտոբուսային տուրեր ամբողջ Հայաստանով — ընտրիր, ամրագրիր և պատրաստվիր ճամփորդության։',
      },
      en: {
        title: 'Discover the Roots of Armenia',
        sub: 'Bus tours across Armenia — choose a tour, grab your ticket and get ready for the journey.',
      },
      ru: {
        title: 'Открой корни Армении',
        sub: 'Автобусные туры по всей Армении — выбери тур, купи билет и готовься к путешествию.',
      },
    }
    return copy[lang]
  }, [lang])

  if (route === '#/silver') {
    return (
      <AuthProvider>
        <SilverPage onBack={() => { window.location.hash = ''; setRoute('') }} />
      </AuthProvider>
    )
  }

  if (route === '#/shop') {
    return (
      <AuthProvider>
        <ShopPage onBack={() => { window.location.hash = ''; setRoute('') }} />
      </AuthProvider>
    )
  }

  // Day count derived from the selected navbar category (null = all).
  const days = CATEGORIES.find((c) => c.id === category)?.days ?? null

  return (
    <AuthProvider>
      <Header lang={lang} onLangChange={setLang} t={t} />
      <NavTabs t={t} />
      <TourNav active={category} onChange={setCategory} t={t} />

      <section className="hero">
        <div className="hero-inner">
          <h1>{hero.title}</h1>
          <p>{hero.sub}</p>
        </div>
      </section>

      <main style={{ flex: 1 }}>
        <TourGrid days={days} onOpen={setSelectedTour} t={t} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={mainLogo} alt="" width="26" height="26" style={{ borderRadius: 6, objectFit: 'cover' }} />
            Հայաստանի Արմատները
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
          t={t}
          onClose={() => setCheckoutTour(null)}
        />
      )}
    </AuthProvider>
  )
}
