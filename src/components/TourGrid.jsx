import { useEffect, useMemo, useState } from 'react'
import { TOURS, tourInfo } from '../data.js'
import { useAuth } from '../AuthContext.jsx'

const fmt = new Intl.NumberFormat('hy-AM')

// Tours created through the admin panel live in the DB and merge with the
// built-in list. Falls back to the built-ins when the table is missing.
function useAllTours(supabase) {
  const [extra, setExtra] = useState([])
  useEffect(() => {
    let alive = true
    supabase
      .from('tours')
      .select('*')
      .then(({ data }) => {
        if (alive && Array.isArray(data)) setExtra(data)
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
    return [...TOURS, ...custom]
  }, [extra])
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
