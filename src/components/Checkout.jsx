import { useEffect, useMemo, useRef, useState } from 'react'
import { BUS_SEAT_ROWS, CATEGORIES, EXTRAS, PAYMENT_METHODS, STAFF_PIN, TOUR_TYPES, TAKEN_SEATS, tourPriceForDays } from '../data.js'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { usePinUnlocked } from '../pinAccess.js'

const SHOP_SCOPE = 'shop'
import ticketLogo from '../assets/ticket-logo.jpeg'

const fmt = new Intl.NumberFormat('hy-AM')

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function OptionRow({ icon, label, price, value, onChange, t }) {
  return (
    <div className="option-row">
      <span className="option-name">
        <span className="opt-icon" aria-hidden="true">{icon}</span>
        {label}
        <span className="opt-price">+{fmt.format(price)} ֏</span>
      </span>
      <span className="segmented" role="group" aria-label={label}>
        <button type="button" className={`seg-btn${value ? ' active' : ''}`} onClick={() => onChange(true)}>
          {t.checkout.yes}
        </button>
        <button type="button" className={`seg-btn${!value ? ' active' : ''}`} onClick={() => onChange(false)}>
          {t.checkout.no}
        </button>
      </span>
    </div>
  )
}

function StepOptions({ tour, options, setOptions, total, chooseDays, days, setDays, onNext, t }) {
  return (
    <div>
      <h3>{t.checkout.step1}</h3>

      {chooseDays && (
        <div className="departure-box">
          <div className="dep-label">{t.checkout.chooseDays}</div>
          <div className="days-picker">
            {CATEGORIES.filter((c) => c.days).map((c) => {
              const price = tourPriceForDays(tour, c.days)
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`day-opt${days === c.days ? ' active' : ''}`}
                  onClick={() => setDays(c.days)}
                >
                  <span className="day-name">📅 {t.nav[c.labelKey.split('.')[1]]}</span>
                  <span className="day-price">{fmt.format(price)} ֏</span>
                </button>
              )
            })}
          </div>
          <div className="t-sub" style={{ marginTop: 4 }}>{t.checkout.chooseDaysHint}</div>
        </div>
      )}

      <div className="option-grid">
        {EXTRAS.map((ex) => (
          <OptionRow
            key={ex.key}
            icon={ex.icon}
            label={t.checkout[ex.key]}
            price={ex.price}
            value={options[ex.key]}
            onChange={(v) => setOptions((o) => ({ ...o, [ex.key]: v }))}
            t={t}
          />
        ))}
      </div>

      <div className="departure-box">
        <div className="dep-label">{t.checkout.departure}</div>
        <div className="dep-address">
          <span aria-hidden="true">📍</span> {t.checkout.departureAddress}
        </div>
        <div className="t-sub" style={{ marginTop: 4 }}>{t.checkout.departureHint}</div>
      </div>

      <div className="total-bar">
        <span>{t.checkout.total}</span>
        <span className="total-num">{fmt.format(total)} ֏</span>
      </div>

      <div className="checkout-actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {t.checkout.next} →
        </button>
      </div>
    </div>
  )
}

function StepPayment({ method, setMethod, card, setCard, tourType, setTourType, total, onBack, onNext, t }) {
  const set = (k, fmtFn) => (e) => {
    const v = fmtFn ? fmtFn(e.target.value) : e.target.value
    setCard((c) => ({ ...c, [k]: v }))
  }
  const isCard = method?.type === 'card'

  return (
    <div>
      <h3>{t.checkout.step2}</h3>

      <div className="pay-methods" role="group" aria-label={t.checkout.selectPayment}>
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`pay-method${method?.id === m.id ? ' active' : ''}`}
            onClick={() => setMethod(m)}
          >
            <span aria-hidden="true">{m.type === 'card' ? '💳' : '📱'}</span>
            {m.label}
          </button>
        ))}
      </div>

      {isCard ? (
        <div className="card-visual" aria-hidden="true">
          <div className="chip" />
          <div className="card-num-view">{formatCardNumber(card.number) || '•••• •••• •••• ••••'}</div>
          <div className="card-bottom">
            <span>{card.name.toUpperCase() || 'YOUR NAME'}</span>
            <span>{card.expiry || 'MM/YY'}</span>
          </div>
        </div>
      ) : (
        <div className="wallet-box">
          <div className="field">
            <label htmlFor="wallet-phone">{t.checkout.phone}</label>
            <input
              id="wallet-phone"
              inputMode="tel"
              placeholder="077 000000"
              value={card.phone}
              onChange={(e) => setCard((c) => ({ ...c, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
            />
            <div className="t-sub">{t.checkout.phoneHint}</div>
          </div>
        </div>
      )}

      <div className="tour-type-box">
        <div className="dep-label">{t.checkout.selectClass}</div>
        <div className="tour-types" role="group" aria-label={t.checkout.selectClass}>
          {TOUR_TYPES.map((ty) => (
            <button
              key={ty.id}
              type="button"
              className={`tour-type${tourType === ty.id ? ' active' : ''}`}
              onClick={() => setTourType(ty.id)}
            >
              <span aria-hidden="true">{ty.icon}</span>
              <span className="tt-name">{ty.id === 'personal' ? t.checkout.personal : t.checkout.group}</span>
              <span className="tt-price">{ty.price > 0 ? `+${fmt.format(ty.price)} ֏` : '—'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="total-bar">
        <span>{t.checkout.total}</span>
        <span className="total-num">{fmt.format(total)} ֏</span>
      </div>

      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← {t.checkout.back}
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {t.checkout.pay} {fmt.format(total)} ֏
        </button>
      </div>
    </div>
  )
}

// Ask the database which seats of this tour are already booked.
// Falls back to the demo list when the table isn't reachable (schema not applied yet).
function useTakenSeats(tourId, supabase) {
  const [taken, setTaken] = useState({ seats: TAKEN_SEATS, live: false })

  useEffect(() => {
    let alive = true
    const load = () => {
      supabase
        .from('bookings')
        .select('seats, buyer_name, created_at')
        .eq('tour_id', tourId)
        .then(({ data, error }) => {
          if (!alive) return
          if (!error && Array.isArray(data)) {
            const bySeat = {}
            for (const b of data) {
              if (b.seats) bySeat[String(b.seats).trim().toUpperCase()] = b.buyer_name || null
            }
            setTaken({ seats: bySeat, live: true })
          }
        })
    }
    load()
    const timer = setInterval(load, 10000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [tourId, supabase])

  return taken
}

function PinOverlay({ seat, error, onSubmit, onClose, t }) {
  const [pin, setPin] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="pin-overlay" role="dialog" aria-modal="true">
      <div className="pin-box">
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="pin-title">🔐 {t.checkout.pinTitle}</div>
        <div className="pin-seat">{seat}</div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(pin)
          }}
        >
          <input
            ref={inputRef}
            className="pin-input"
            autoComplete="off"
            maxLength={12}
            placeholder={t.checkout.pinPlaceholder}
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
          />
          {error && <div className="pin-error">{error}</div>}
          <div className="checkout-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t.modal.close}
            </button>
            <button type="submit" className="btn btn-primary">{t.checkout.pinSubmit}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepSeats({ tour, seat, setSeat, onBack, onFinish, t }) {
  const { supabase } = useAuth()
  const taken = useTakenSeats(tour.id, supabase)
  const [pinSeat, setPinSeat] = useState(null) // taken seat being inspected
  const [pinError, setPinError] = useState(null)
  const [pinOwner, setPinOwner] = useState(null) // { seat, name }

  const isTaken = (id) => (taken.live ? !!taken.seats[id] : taken.seats.includes(id))
  const ownerOf = (id) => (taken.live ? taken.seats[id] : null)

  const handlePinSubmit = (pin) => {
    if (pin !== STAFF_PIN) {
      setPinError(t.checkout.pinWrong)
      return
    }
    setPinError(null)
    setPinOwner({ seat: pinSeat, name: ownerOf(pinSeat) })
    setPinSeat(null)
  }

  const renderSeat = (id) => {
    const takenSeat = isTaken(id)
    const selected = seat === id
    return (
      <button
        key={id}
        type="button"
        className={`seat${takenSeat ? ' taken' : ''}${selected ? ' selected' : ''}`}
        onClick={() => {
          if (takenSeat) {
            setPinError(null)
            setPinSeat(id)
          } else {
            setSeat(id)
          }
        }}
        aria-label={`${takenSeat ? t.checkout.seatLegendTaken : t.checkout.seatLegendFree}: ${id}`}
      >
        {id}
      </button>
    )
  }

  return (
    <div>
      <h3>{t.checkout.step3}</h3>
      <div className="seat-legend" style={{ marginBottom: 12 }}>
        <span className="legend-item"><span className="legend-swatch" /> {t.checkout.seatLegendFree}</span>
        <span className="legend-item"><span className="legend-swatch taken" /> {t.checkout.seatLegendTaken}</span>
        <span className="legend-item"><span className="legend-swatch selected" /> {t.checkout.seatLegendSelected}</span>
      </div>

      {pinOwner && (
        <div className="pin-owner-box">
          <span aria-hidden="true">👤</span> {t.checkout.seat} <strong>{pinOwner.seat}</strong> — {pinOwner.name || t.checkout.ownerUnknown}
        </div>
      )}

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

      {pinSeat && (
        <PinOverlay
          seat={pinSeat}
          error={pinError}
          onSubmit={handlePinSubmit}
          onClose={() => {
            setPinSeat(null)
            setPinError(null)
          }}
          t={t}
        />
      )}

      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← {t.checkout.back}
        </button>
        <button type="button" className="btn btn-primary" onClick={onFinish} disabled={!seat}>
          🎫 {t.checkout.done}
        </button>
      </div>
    </div>
  )
}

function Ticket({ tour, days, options, seat, card, method, tourType, total, onClose, t }) {
  const code = useMemo(() => {
    let h = ''
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * chars.length)]
    return h
  }, [])

  const info = t.tours[tour.id]

  return (
    <div>
      <div className="ticket">
        <div className="ticket-upper">
          <img className="ticket-logo" src={ticketLogo} alt="Ticket logo" />
          <div>
            <div className="t-tour">{info.title}</div>
            <div className="t-sub">Հայաստանի Արմատները</div>
          </div>
        </div>
        <div className="ticket-lower">
          <div className="ticket-fields">
            <div className="t-field">
              <div className="t-label">{t.checkout.departure}</div>
              <div className="t-value">{t.checkout.departureAddress}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.modal.duration}</div>
              <div className="t-value">{days} {t.checkout.daysWord}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.selectSeat}</div>
              <div className="t-value">{seat}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.selectClass}</div>
              <div className="t-value">{tourType === 'personal' ? t.checkout.personal : t.checkout.group}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.photoshoot}</div>
              <div className="t-value">{options.photoshoot ? t.checkout.included : t.checkout.notIncluded}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.food}</div>
              <div className="t-value">{options.food ? t.checkout.included : t.checkout.notIncluded}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.cottage}</div>
              <div className="t-value">{options.cottage ? t.checkout.included : t.checkout.notIncluded}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.selectPayment}</div>
              <div className="t-value">{method?.label || '—'}</div>
            </div>
            <div className="t-field">
              <div className="t-label">{t.checkout.cardHolder}</div>
              <div className="t-value">{card.name || (card.phone ? `+374 ${card.phone}` : '—')}</div>
            </div>
          </div>
          <div className="ticket-stub">
            <span className="stub-label">{t.checkout.total}</span>
            <span className="stub-seat">{fmt.format(total)}</span>
            <span className="stub-code">{code}</span>
          </div>
        </div>
      </div>
      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t.modal.close}
        </button>
      </div>
    </div>
  )
}

function Success({ tour, days, options, seat, card, method, tourType, total, onClose, t }) {
  return (
    <div className="success">
      <div className="check-circle">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2>{t.checkout.ticketBought}</h2>
      <p>Ticket bought</p>
      <Ticket
        tour={tour}
        days={days}
        options={options}
        seat={seat}
        card={card}
        method={method}
        tourType={tourType}
        total={total}
        onClose={onClose}
        t={t}
      />
    </div>
  )
}

export default function Checkout({ tour, categoryDays = null, onClose, t }) {
  const { user, supabase } = useAuth()
  const pinUnlocked = usePinUnlocked(SHOP_SCOPE)
  const [authOpen, setAuthOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [options, setOptions] = useState({ photoshoot: false, food: false, cottage: false })
  const [method, setMethod] = useState(null)
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '', phone: '' })
  const [tourType, setTourType] = useState('group')
  const [seat, setSeat] = useState(null)
  const [finished, setFinished] = useState(false)
  // Tours opened from the "All" category ask for the trip length at purchase.
  const [days, setDays] = useState(tour.days)
  const needsDayChoice = categoryDays == null

  // Whole-tour price = base price for the chosen length + extras + personal-tour surcharge.
  const total = useMemo(() => {
    let sum = tourPriceForDays(tour, days)
    for (const ex of EXTRAS) if (options[ex.key]) sum += ex.price
    sum += TOUR_TYPES.find((ty) => ty.id === tourType)?.price ?? 0
    return sum
  }, [tour, days, options, tourType])

  const steps = [t.checkout.step1, t.checkout.step2, t.checkout.step3]

  // Buying requires an account or the staff PIN — no steps are reachable otherwise.
  if (!user && !pinUnlocked) {
    return (
      <div className="checkout-overlay" onClick={onClose}>
        <div className="checkout" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="checkout-body">
            <div className="gate-box">
              <div className="gate-icon" aria-hidden="true">🔐</div>
              <h3>{t.checkout.needAccountTitle}</h3>
              <p className="t-sub">{t.checkout.needAccountText}</p>
              <button type="button" className="btn btn-primary" onClick={() => setAuthOpen(true)}>
                👤 {t.auth.signIn}
              </button>
            </div>
            {authOpen && <AuthModal t={t} onClose={() => setAuthOpen(false)} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="checkout-header">
          <div className="steps">
            {steps.map((label, i) => {
              const num = i + 1
              const state = finished || num < step ? 'done' : num === step ? 'active' : ''
              return (
                <span key={label} style={{ display: 'contents' }}>
                  {i > 0 && <span className="step-line" />}
                  <span className={`step-dot ${state}`}>
                    <span className="step-num">{finished || num < step ? '✓' : num}</span>
                    <span className="step-label">{label}</span>
                  </span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="checkout-body">
          {finished ? (
            <Success
              tour={tour}
              days={days}
              options={options}
              seat={seat}
              card={card}
              method={method}
              tourType={tourType}
              total={total}
              onClose={onClose}
              t={t}
            />
          ) : step === 1 ? (
            <StepOptions
              options={options}
              setOptions={setOptions}
              total={total}
              chooseDays={needsDayChoice}
              days={days}
              setDays={setDays}
              tour={tour}
              onNext={() => setStep(2)}
              t={t}
 />
          ) : step === 2 ? (
            <StepPayment
              method={method}
              setMethod={setMethod}
              card={card}
              setCard={setCard}
              tourType={tourType}
              setTourType={setTourType}
              total={total}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              t={t}
            />
          ) : (
            <StepSeats
              tour={tour}
              seat={seat}
              setSeat={setSeat}
              onBack={() => setStep(2)}
              onFinish={async () => {
                try {
                  await supabase.from('bookings').insert({
                    user_id: user?.id ?? null,
                    tour_id: tour.id,
                    days,
                    seats: seat,
                    buyer_name:
                      card.name?.trim() ||
                      (card.phone ? `+374 ${card.phone}` : null) ||
                      user?.user_metadata?.full_name ||
                      user?.email ||
                      null,
                    tour_type: tourType,
                    photoshoot: options.photoshoot,
                    food: options.food,
                    cottage: options.cottage,
                    payment_method: method?.id ?? null,
                    total_amd: total,
                    card_last4: card.number.replace(/\D/g, '').slice(-4) || null,
                  })
                } catch (err) {
                  // Never block the purchase UX on DB errors.
                  console.warn('Booking save failed:', err)
                }
                setFinished(true)
              }}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}
