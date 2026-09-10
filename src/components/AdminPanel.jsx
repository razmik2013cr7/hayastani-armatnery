import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { STAFF_PIN } from '../data.js'

// Admin panel — add or delete tours, gated by the staff PIN (2011RLOHN).
// Tours are stored in the public.tours table (see supabase-migration.sql).
// The PIN must be entered once per panel opening (nothing is persisted).
export default function AdminPanel({ t, initialMode, onClose, onSaved }) {
  const { supabase } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [mode, setMode] = useState(initialMode) // 'add' | 'delete'
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err', text }

  // 'add' form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('home')
  const [days, setDays] = useState('3')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // 'delete' state
  const [tours, setTours] = useState(null)
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const notify = (kind, text) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const submitPin = (e) => {
    e.preventDefault()
    if (pin.trim().toUpperCase() === STAFF_PIN) {
      setUnlocked(true)
      setPinError(false)
      setPin('')
    } else {
      setPinError(true)
    }
  }

  // Load the DB tours when the delete view opens.
  useEffect(() => {
    if (!unlocked || mode !== 'delete') return
    let alive = true
    supabase
      .from('tours')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return
        if (error) notify('err', error.message)
        setTours(data || [])
      })
    return () => {
      alive = false
    }
  }, [unlocked, mode, supabase])

  const addTour = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('tours').insert({
      title: title.trim(),
      description: description.trim() || null,
      region,
      days: Number(days) || 3,
      price: Number(price) || 0,
      image_url: imageUrl.trim() || null,
    })
    setBusy(false)
    if (error) {
      notify('err', error.message || t.admin.failed)
      return
    }
    setTitle(''); setDescription(''); setPrice(''); setImageUrl(''); setDays('3'); setRegion('home')
    notify('ok', `✅ ${t.admin.saved}`)
    if (onSaved) onSaved()
  }

  const deleteTour = async () => {
    if (!picked) return
    setBusy(true)
    const { error } = await supabase.from('tours').delete().eq('id', picked)
    setBusy(false)
    if (error) {
      notify('err', error.message || t.admin.failed)
      return
    }
    setTours((rows) => rows.filter((r) => r.id !== picked))
    setPicked(null)
    notify('ok', `🗑 ${t.admin.deleted}`)
    if (onSaved) onSaved()
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
          {msg && <div className={`silver-msg ${msg.kind}`}>{msg.text}</div>}

          {!unlocked ? (
            <>
              <h3>🔐 {t.admin.pinTitle}</h3>
              <form onSubmit={submitPin} className="gate-pin-row">
                <input
                  className="pin-input"
                  autoComplete="off"
                  autoFocus
                  maxLength={12}
                  placeholder={t.checkout.pinPlaceholder}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))
                    setPinError(false)
                  }}
                />
                <button type="submit" className="btn btn-primary">{t.checkout.pinSubmit}</button>
              </form>
              {pinError && <div className="pin-error">{t.checkout.pinWrong}</div>}
            </>
          ) : mode === 'add' ? (
            <form onSubmit={addTour} className="admin-form">
              <h3>➕ {t.admin.addTour}</h3>
              <label className="field">
                <span>{t.admin.name}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t.admin.desc}</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </label>
              <div className="admin-row">
                <label className="field">
                  <span>{t.admin.category}</span>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="home">{t.admin.home}</option>
                    <option value="abroad">{t.admin.abroad}</option>
                  </select>
                </label>
                <label className="field">
                  <span>{t.admin.days}</span>
                  <input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, '').slice(0, 2))} required />
                </label>
              </div>
              <label className="field">
                <span>{t.admin.price}</span>
                <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 9))} required />
              </label>
              <label className="field">
                <span>{t.admin.image}</span>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
                <span className="t-sub">{t.admin.imageHint}</span>
              </label>
              <div className="checkout-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{t.admin.save}</button>
              </div>
            </form>
          ) : (
            <div className="admin-form">
              <h3>🗑 {t.admin.deleteTour}</h3>
              <p className="t-sub">{t.admin.pick}</p>
              {tours === null ? (
                <p>…</p>
              ) : tours.length === 0 ? (
                <p className="t-sub">—</p>
              ) : (
                <ul className="admin-tour-list">
                  {tours.map((row) => (
                    <li key={row.id}>
                      <label className="admin-tour-item">
                        <input type="radio" name="admin-del" checked={picked === row.id} onChange={() => setPicked(row.id)} />
                        <span>
                          <strong>{row.title}</strong>
                          <em>
                            {row.region === 'abroad' ? t.admin.abroad : t.admin.home} · {row.days} {t.checkout.daysWord} · {Number(row.price).toLocaleString('hy-AM')} ֏
                          </em>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="checkout-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                <button type="button" className="btn btn-primary" onClick={deleteTour} disabled={!picked || busy}>{t.admin.deleteTour}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// The two admin buttons shown on the main page.
export function AdminEntry({ t, onSaved }) {
  const [open, setOpen] = useState(null) // 'add' | 'delete' | null
  return (
    <div className="admin-entry">
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('add')}>
        ➕ {t.admin.addTour}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('delete')}>
        🗑 {t.admin.deleteTour}
      </button>
      {open && (
        <AdminPanel t={t} initialMode={open} onClose={() => setOpen(null)} onSaved={onSaved} />
      )}
    </div>
  )
}
