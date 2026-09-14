import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { BUS_SEAT_ROWS, BUILTIN_BUS_IDS, STAFF_PIN } from '../data.js'

const fmt = new Intl.NumberFormat('hy-AM')

const SEAT_COLS_FULL = 'seats, buyer_name, payment_method, days, total_amd, school_info, created_at'
const SEAT_COLS_MIN = 'seats, buyer_name, created_at'

// 🚌 «Ցուցադրել ավտոբուսի տեղերը» — staff view: enter the PIN, pick a tour
// (or every bus) and see the full seat map plus a details list of every
// taken seat. Read-only: booking/deleting happens in the checkout flow.
export default function BusSeats({ t, onClose }) {
  const { supabase } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState(false)
  const [tourId, setTourId] = useState('')
  const [dbTours, setDbTours] = useState([])
  const [rows, setRows] = useState(null) // bookings of the chosen tour
  const [infoOpen, setInfoOpen] = useState(true)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    supabase
      .from('tours')
      .select('id, title, title_en, title_ru')
      .then(({ data }) => setDbTours(Array.isArray(data) ? data : []))
  }, [supabase])

  // Load the bookings of the selected tour (or all tours).
  useEffect(() => {
    if (!unlocked) return
    let alive = true
    setRows(null)
    let q = supabase.from('bookings').select(SEAT_COLS_FULL)
    if (tourId) q = q.eq('tour_id', tourId)
    q.then(({ data, error }) => {
      if (!alive) return
      if (error) {
        // Older schema — retry minimal.
        let q2 = supabase.from('bookings').select(SEAT_COLS_MIN)
        if (tourId) q2 = q2.eq('tour_id', tourId)
        q2.then(({ data: d2 }) => alive && setRows(d2 || []))
        return
      }
      setRows(data || [])
    })
    return () => {
      alive = false
    }
  }, [unlocked, tourId, supabase])

  const taken = useMemo(() => {
    const bySeat = {}
    for (const b of rows || []) {
      if (b.seats) bySeat[String(b.seats).trim().toUpperCase()] = b
    }
    return bySeat
  }, [rows])

  const describeBooking = (b) => {
    const parts = [b.buyer_name || t.checkout.ownerUnknown]
    if (b.school_info) parts.push(b.school_info)
    else if (b.payment_method === 'school') parts.push(t.checkout.schoolInfo)
    if (b.days) parts.push(`${b.days} ${t.checkout.daysWord}`)
    if (b.total_amd) parts.push(`${fmt.format(b.total_amd)} ֏`)
    return parts.join(' · ')
  }

  const tourName = (id) =>
    id.startsWith('db:') ? (dbTours.find((r) => r.id === id.slice(3)) || {}).title || id : t.tours[id]?.title || id

  const takenCount = Object.keys(taken).length

  const renderSeat = (id) => {
    const isTaken = !!taken[id]
    return (
      <button key={id} type="button" className={`seat${isTaken ? ' taken' : ''}`} aria-label={id}>
        {isTaken ? '✕' : id}
      </button>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-body">
          {!unlocked ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (pin.trim().toUpperCase() === STAFF_PIN) {
                  setUnlocked(true)
                  setPinErr(false)
                } else {
                  setPinErr(true)
                }
              }}
            >
              <h3>🔐 {t.checkout.pinTitle}</h3>
              <div className="gate-pin-row">
                <input
                  className="pin-input"
                  autoComplete="off"
                  autoFocus
                  maxLength={12}
                  placeholder={t.checkout.pinPlaceholder}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))
                    setPinErr(false)
                  }}
                />
                <button type="submit" className="btn btn-primary">{t.checkout.pinSubmit}</button>
              </div>
              {pinErr && <div className="pin-error">{t.checkout.pinWrong}</div>}
            </form>
          ) : (
            <>
              <h3>🚌 {t.admin.showBusSeats}</h3>
              <label className="field">
                <span>{t.admin.busToClean}</span>
                <select value={tourId} onChange={(e) => setTourId(e.target.value)}>
                  <option value="">{t.admin.allBuses}</option>
                  {BUILTIN_BUS_IDS.map((id) => (
                    <option key={id} value={id}>{t.tours[id]?.title || id}</option>
                  ))}
                  {dbTours.map((r) => (
                    <option key={r.id} value={`db:${r.id}`}>{r.title}</option>
                  ))}
                </select>
              </label>

              <div className="seat-legend" style={{ marginBottom: 10 }}>
                <span className="legend-item"><span className="legend-swatch" /> {t.checkout.seatLegendFree}</span>
                <span className="legend-item"><span className="legend-swatch taken" /> {t.checkout.seatLegendTaken}</span>
                <span className="legend-item"><strong style={{ marginLeft: 8 }}>{t.checkout.seatLegendTaken}: {takenCount}</strong></span>
              </div>

              <div className="bus-wrap">
                <div className="bus-top">
                  <span className="driver-icon" title={t.checkout.driver}>🧑‍✈️</span>
                  <span>{t.checkout.driver}</span>
                  <span className="wheel-note">WHEEL</span>
                </div>
                <div className="seat-grid" role="group" aria-label={t.checkout.selectSeat}>
                  {BUS_SEAT_ROWS.map((row, i) => {
                    const half = Math.ceil(row.length / 2)
                    return (
                      <div key={i} className="seat-row">
                        {row.slice(0, half).map(renderSeat)}
                        <span className="aisle" aria-hidden="true" />
                        {row.slice(half).map(renderSeat)}
                      </div>
                    )
                  })}
                </div>
              </div>

              {rows !== null && takenCount > 0 && (
                <>
                  <button type="button" className="btn btn-ghost taken-info-btn" onClick={() => setInfoOpen((o) => !o)}>
                    👥 {t.checkout.takenInfo} ({takenCount}) ▾
                  </button>
                  {infoOpen && (
                    <ul className="taken-info-list">
                      {Object.entries(taken).map(([seatId, b]) => (
                        <li key={seatId}>
                          <strong>{seatId}</strong>
                          <span>{describeBooking(b)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {rows !== null && takenCount === 0 && (
                <p className="t-sub" style={{ marginTop: 8 }}>— {t.checkout.seatLegendFree} —</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
