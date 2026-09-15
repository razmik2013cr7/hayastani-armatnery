import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { usePinUnlocked } from '../pinAccess.js'
import { applyDiscount, tourInfo } from '../data.js'

const SHOP_SCOPE = 'shop'

const fmt = new Intl.NumberFormat('hy-AM')

export default function TourModal({ tour, onClose, onBuy, lang, t }) {
  const { user } = useAuth()
  // Access is decided once, site-wide (login or PIN) — opening/closing the
  // tour modal never re-asks for the PIN.
  const pinUnlocked = usePinUnlocked(SHOP_SCOPE)
  const [authOpen, setAuthOpen] = useState(false)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // DB-created tours carry their own title/description (with EN/RU variants
  // when provided); built-ins use i18n.
  const info = tourInfo(tour, lang, t)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={info.title} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-media">
          <img src={tour.image} alt={info.title} />
        </div>
        <div className="modal-body">
          <h2>{info.title}</h2>
          <p className="desc">{info.description}</p>

          <dl className="modal-meta">
            <div className="meta-row">
              <dt>{t.modal.from}</dt>
              <dd>{tour.dbId && tour.departureAddress ? tour.departureAddress : t.checkout.departureAddress}</dd>
            </div>
            <div className="meta-row">
              <dt>{t.modal.duration}</dt>
              <dd>{info.duration}</dd>
            </div>
          </dl>

          <div className="modal-foot">
            <span className="modal-price">
              {tour.discount ? (
                <>
                  <span className="price-was">{fmt.format(tour.oldPrice)} ֏</span>
                  <span className="price-now">{fmt.format(applyDiscount(tour.oldPrice, tour.discount))} ֏</span>
                </>
              ) : (
                `${fmt.format(tour.price)} ֏`
              )}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (user || pinUnlocked) {
                  onBuy()
                } else {
                  setAuthOpen(true)
                }
              }}
            >
              🎫 {user || pinUnlocked ? t.modal.buy : t.modal.signInToBuy}
            </button>
          </div>
        </div>
      </div>
      {authOpen && <AuthModal t={t} onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
