import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import TourNav from './components/TourNav.jsx'
import TourGrid from './components/TourGrid.jsx'
import TourModal from './components/TourModal.jsx'
import Checkout from './components/Checkout.jsx'
import { CATEGORIES } from './data.js'
import { AuthProvider } from './AuthContext.jsx'
import { translations } from './i18n.js'
import mainLogo from './assets/main-logo.jpeg'

export default function App() {
  const [lang, setLang] = useState('hy')
  const [category, setCategory] = useState('all')
  const [selectedTour, setSelectedTour] = useState(null)
  const [checkoutTour, setCheckoutTour] = useState(null)

  const t = translations[lang]

  // People count derived from the selected navbar category.
  const peopleCount = CATEGORIES.find((c) => c.id === category)?.people ?? 1

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

  return (
    <AuthProvider>
      <Header lang={lang} onLangChange={setLang} t={t} />
      <TourNav active={category} onChange={setCategory} t={t} />

      <section className="hero">
        <div className="hero-inner">
          <h1>{hero.title}</h1>
          <p>{hero.sub}</p>
        </div>
      </section>

      <main style={{ flex: 1 }}>
        <TourGrid category={category} peopleCount={peopleCount} onOpen={setSelectedTour} t={t} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={mainLogo} alt="" width="26" height="26" style={{ borderRadius: 6, objectFit: 'cover' }} />
            Հայաստանի Արմատները
          </strong>
          <span>+374 77 044201</span>
        </div>
      </footer>

      {selectedTour && (
        <TourModal
          tour={selectedTour}
          peopleCount={peopleCount}
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
          peopleCount={peopleCount}
          t={t}
          onClose={() => setCheckoutTour(null)}
        />
      )}
    </AuthProvider>
  )
}
