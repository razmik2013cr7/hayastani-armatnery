import { TOURS } from '../data.js'

const fmt = new Intl.NumberFormat('hy-AM')

export default function TourGrid({ days, onOpen, t }) {
  const visible = TOURS.filter((tour) => !days || tour.days === days)

  return (
    <section className="tours-section">
      {visible.length === 0 ? (
        <p className="t-empty">—</p>
      ) : (
        <div className="tour-grid">
          {visible.map((tour) => {
            const info = t.tours[tour.id]
            return (
              <button key={tour.id} type="button" className="tour-card" onClick={() => onOpen(tour)}>
                <div className="tour-media">
                  <img src={tour.image} alt={info.title} loading="lazy" />
                  <span className="seats-badge">
                    📅 {info.duration}
                  </span>
                </div>
                <div className="tour-body">
                  <h3 className="tour-title">{info.title}</h3>
                  <p className="tour-desc-preview">{info.description}</p>
                  <div className="tour-foot">
                    <span className="tour-price">
                      {fmt.format(tour.price)} ֏
                    </span>
                    <span className="details-link">{t.card.details} →</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
