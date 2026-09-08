import { TOURS } from '../data.js'

const fmt = new Intl.NumberFormat('hy-AM')

export default function TourGrid({ category, peopleCount, onOpen, t }) {
  return (
    <section className="tours-section">
      <div className="tour-grid">
        {TOURS.map((tour) => {
          const info = t.tours[tour.id]
          const total = tour.price * peopleCount
          return (
            <button key={tour.id} type="button" className="tour-card" onClick={() => onOpen(tour)}>
              <div className="tour-media">
                <img src={tour.image} alt={info.title} loading="lazy" />
                <span className="seats-badge">
                  👥 {peopleCount} {t.card.people}
                </span>
              </div>
              <div className="tour-body">
                <h3 className="tour-title">{info.title}</h3>
                <p className="tour-desc-preview">{info.description}</p>
                <div className="tour-foot">
                  <span className="tour-price">
                    {fmt.format(total)} ֏{' '}
                    <small>
                      {peopleCount > 1 ? `${t.card.totalFor} · ` : ''}
                      {fmt.format(tour.price)} ֏ {t.card.perPerson}
                    </small>
                  </span>
                  <span className="details-link">{t.card.details} →</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
