import { useEffect, useMemo, useState } from 'react'
import { TOURS, tourInfo, applyDiscount } from '../data.js'
import { useAuth } from '../AuthContext.jsx'

const fmt = new Intl.NumberFormat('hy-AM')

// Tours created through the admin panel live in the DB and merge with the
// built-in list. Builtin tours hidden through the admin panel (hidden_tours
// table, kind='tour') are filtered out. Falls back to the built-ins when the
// table is missing.
function useAllTours(supabase) {
  const [extra, setExtra] = useState([])
  const [hidden, setHidden] = useState(new Set())
  const [discounts, setDiscounts] = useState({}) // { [tourId]: discountPct }
  useEffect(() => {
    let alive = true
    supabase
      .from('tours')
      .select('*')
      .then(({ data }) => {
        if (alive && Array.isArray(data)) setExtra(data)
      })
    // Owner-set discounts (percent off). Not applied to card tours.
    supabase
      .from('tour_discounts')
      .select('tour_id, discount')
      .then(({ data }) => {
        if (alive && Array.isArray(data)) {
          setDiscounts(Object.fromEntries(data.map((r) => [r.tour_id, r.discount])))
        }
      })
    supabase
      .from('hidden_tours')
      .select('tour_id')
      .eq('kind', 'tour')
      .then(({ data }) => {
        if (alive && Array.isArray(data)) setHidden(new Set(data.map((r) => r.tour_id)))
      })
    return () => {
      alive = false
    }
  }, [supabase])
  return useMemo(() => {
    const custom = extra
      .filter((row) => row.active !== false)
      .map((row) => ({
        id: `db:${row.id}`,
        dbId: row.id,
        image: row.image_url || '/tour-sevan.svg',
        price: Number(row.price) || 0,
        days: Number(row.days) || 3,
        home: row.region !== 'abroad',
        title: row.title,
        titleEn: row.title_en,
        titleRu: row.title_ru,
        description: row.description,
        descriptionEn: row.description_en,
        descriptionRu: row.description_ru,
        departureAddress: row.departure_address,
      }))
    const list = [...TOURS.filter((b) => !hidden.has(b.id)), ...custom]
    return list.map((tour) => {
      const key = tour.dbId || tour.id
      const discount = discounts[key]
      return discount
        ? { ...tour, discount, oldPrice: tour.price, price: applyDiscount(tour.price, discount) }
        : tour
    })
  }, [extra, hidden, discounts])
}

function Group({ tours, title, onOpen, lang, t }) {
  if (tours.length === 0) return null
  return (
    <div className="region-group">
      <h2 className="region-title">
        <span className="region-dot home" aria-hidden="true" />
        {title}
      </h2>
      <div className="tour-grid">
        {tours.map((tour) => {
          const info = tourInfo(tour, lang, t)
          return (
            <button key={tour.id} type="button" className="tour-card" onClick={() => onOpen(tour)}>
              <div className="tour-media">
                <img src={tour.image} alt={info.title} loading="lazy" />
                <span className="seats-badge">
                  📅 {info.duration}
                </span>
                {tour.discount ? <span className="sale-badge">−{tour.discount}%</span> : null}
              </div>
              <div className="tour-body">
                <h3 className="tour-title">{info.title}</h3>
                <p className="tour-desc-preview">{info.description}</p>
                <div className="tour-foot">
                  <span className="tour-price">
                    {tour.discount ? (
                      <>
                        <span className="price-was">{fmt.format(tour.oldPrice)} ֏</span>
                        <span className="price-now">{fmt.format(tour.price)} ֏</span>
                      </>
                    ) : (
                      `${fmt.format(tour.price)} ֏`
                    )}
                  </span>
                  <span className="details-link">{t.card.details} →</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TourGrid({ days, onOpen, lang, t }) {
  const { supabase } = useAuth()
  const tours = useAllTours(supabase)
  const visible = tours.filter((tour) => !days || tour.days === days)

  return (
    <section className="tours-section">
      {visible.length === 0 ? (
        <p className="t-empty">—</p>
      ) : (
        <>
          <Group tours={visible.filter((x) => x.home)} title={t.regions.home} onOpen={onOpen} lang={lang} t={t} />
          <Group tours={visible.filter((x) => !x.home)} title={t.regions.abroad} onOpen={onOpen} lang={lang} t={t} />
        </>
      )}
    </section>
  )
}
