import { useMemo, useState } from 'react'
import { BUS_SEAT_ROWS, TAKEN_SEATS } from '../data.js'
import { useAuth } from '../AuthContext.jsx'
import ticketLogo from '../assets/ticket-logo.jpeg'

const fmt = new Intl.NumberFormat('hy-AM')

const EXTRAS = [
  { key: 'photoshoot', icon: '📷', price: 15000 },
  { key: 'food', icon: '🍽️', price: 8000 },
  { key: 'cottage', icon: '🏡', price: 25000 },
]

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function OptionRow({ icon, label, value, onChange, t }) {
  return (
    <div className="option-row">
      <span className="option-name">
        <span className="opt-icon" aria-hidden="true">{icon}</span>
        {label}
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

function StepOptions({ options, setOptions, total, peopleCount, onNext, t }) {
  return (
    <div>
      <h3>{t.checkout.step1}</h3>
      <p className="checkout-people">
        👥 {peopleCount} {t.card.people}
      </p>
      <div className="option-grid">
        {EXTRAS.map((ex) => (
          <OptionRow
            key={ex.key}
            icon={ex.icon}
            label={t.checkout[ex.key]}
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

function StepPayment({ card, setCard, total, onBack, onNext, t }) {
  const set = (k, fmt) => (e) => {
    const v = fmt ? fmt(e.target.value) : e.target.value
    setCard((c) => ({ ...c, [k]: v }))
  }

  return (
    <div>
      <h3>{t.checkout.step2}</h3>
      <div className="card-visual" aria-hidden="true">
        <div className="chip" />
        <div className="card-num-view">{formatCardNumber(card.number) || '•••• •••• •••• ••••'}</div>
        <div className="card-bottom">
          <span>{card.name.toUpperCase() || 'YOUR NAME'}</span>
          <span>{card.expiry || 'MM/YY'}</span>
        </div>
      </div>

      <div className="pay-grid">
        <div className="field">
          <label htmlFor="cc-number">{t.checkout.cardNumber}</label>
          <input
            id="cc-number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={card.number}
            onChange={set('number', formatCardNumber)}
          />
        </div>
        <div className="field">
          <label htmlFor="cc-name">{t.checkout.cardHolder}</label>
          <input id="cc-name" autoComplete="cc-name" placeholder="ANNA HAKOBYAN" value={card.name} onChange={set('name')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="cc-exp">{t.checkout.expiry}</label>
            <input
              id="cc-exp"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={card.expiry}
              onChange={set('expiry', formatExpiry)}
            />
          </div>
          <div className="field">
            <label htmlFor="cc-cvc">{t.checkout.cvc}</label>
            <input id="cc-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="•••" maxLength={3} value={card.cvc} onChange={set('cvc')} />
          </div>
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

function StepSeats({ seat, setSeat, onBack, onFinish, t }) {

  const renderSeat = (id) => {
    const taken = TAKEN_SEATS.includes(id)
    const selected = seat === id
    return (
      <button
        key={id}
        type="button"
        className={`seat${taken ? ' taken' : ''}${selected ? ' selected' : ''}`}
        disabled={taken}
        onClick={() => setSeat(id)}
        aria-label={`${taken ? t.checkout.seatLegendTaken : t.checkout.seatLegendFree}: ${id}`}
      >
        {id}
      </button>
    )
  }

  return (
    <div>
      <h3>{t.checkout.step3}</h3>
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

      <div className="seat-legend">
        <span className="legend-item"><span className="legend-swatch" /> {t.checkout.seatLegendFree}</span>
        <span className="legend-item"><span className="legend-swatch taken" /> {t.checkout.seatLegendTaken}</span>
        <span className="legend-item"><span className="legend-swatch selected" /> {t.checkout.seatLegendSelected}</span>
      </div>

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

function Ticket({ tour, options, seat, card, total, onClose, t }) {
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
              <div className="t-label">{t.checkout.selectSeat}</div>
              <div className="t-value">{seat}</div>
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
              <div className="t-label">{t.checkout.cardHolder}</div>
              <div className="t-value">{card.name || '—'}</div>
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

function Success({ tour, options, seat, card, total, onClose, t }) {
  return (
    <div className="success">
      <div className="check-circle">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2>{t.checkout.ticketBought}</h2>
      <p>Ticket bought</p>
      <Ticket tour={tour} options={options} seat={seat} card={card} total={total} onClose={onClose} t={t} />
    </div>
  )
}

export default function Checkout({ tour, peopleCount = 1, onClose, t }) {
  const { user, supabase } = useAuth()
  const [step, setStep] = useState(1)
  const [options, setOptions] = useState({ photoshoot: false, food: false, cottage: false })
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [seat, setSeat] = useState(null)
  const [finished, setFinished] = useState(false)

  // Extras are per person too; the whole sum scales with the people count.
  const total = useMemo(() => {
    let sum = tour.price
    for (const ex of EXTRAS) if (options[ex.key]) sum += ex.price
    return sum * peopleCount
  }, [tour, options, peopleCount])

  const steps = [t.checkout.step1, t.checkout.step2, t.checkout.step3]

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
            <Success tour={tour} options={options} seat={seat} card={card} total={total} onClose={onClose} t={t} />
          ) : step === 1 ? (
            <StepOptions
              options={options}
              setOptions={setOptions}
              total={total}
              peopleCount={peopleCount}
              onNext={() => setStep(2)}
              t={t}
            />
          ) : step === 2 ? (
            <StepPayment card={card} setCard={setCard} total={total} onBack={() => setStep(1)} onNext={() => setStep(3)} t={t} />
          ) : (
            <StepSeats
              seat={seat}
              setSeat={setSeat}
              onBack={() => setStep(2)}
              onFinish={async () => {
                try {
                  await supabase.from('bookings').insert({
                    user_id: user?.id ?? null,
                    tour_id: tour.id,
                    people_count: peopleCount,
                    seats: seat,
                    photoshoot: options.photoshoot,
                    food: options.food,
                    cottage: options.cottage,
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
