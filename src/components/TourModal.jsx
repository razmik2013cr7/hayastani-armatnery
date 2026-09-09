import { useEffect } from 'react'

const fmt = new Intl.NumberFormat('hy-AM')

export default function TourModal({ tour, onClose, onBuy, t }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const info = t.tours[tour.id]

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
              <dd>{t.checkout.departureAddress}</dd>
            </div>
            <div className="meta-row">
              <dt>{t.modal.duration}</dt>
              <dd>{info.duration}</dd>
            </div>
          </dl>

          <div className="modal-foot">
            <span className="modal-price">
              {fmt.format(tour.price)} ֏
            </span>
            <button type="button" className="btn btn-primary" onClick={onBuy}>
              🎫 {t.modal.buy}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
