import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { STAFF_PIN, BUILTIN_BUS_IDS, TOURS } from '../data.js'
import BusSeats from './BusSeats.jsx'

const fmt = new Intl.NumberFormat('hy-AM')

// Admin panel — add / edit / delete tours, set discounts, clean bus(es),
// manage card tours. The staff PIN (2011RLOHN) is required for EVERY admin
// action: it arms one action only and re-locks as soon as the action
// completes, so the next action asks for the PIN again. Tours live in
// public.tours; card tours in public.card_tours (same schema, separate
// list); discounts in public.tour_discounts — see supabase-migration.sql.
// Discounts apply to REGULAR tours only — never to card tours.
const TABLES = { tour: 'tours', card: 'card_tours' }

function PinGate({ t, onSubmit }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (onSubmit(pin.trim().toUpperCase())) setPin('')
        else setErr(true)
      }}
    >
      <h3>🔐 {t.admin.pinTitle}</h3>
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
            setErr(false)
          }}
        />
        <button type="submit" className="btn btn-primary">{t.checkout.pinSubmit}</button>
      </div>
      {err && <div className="pin-error">{t.checkout.pinWrong}</div>}
    </form>
  )
}

// Image field: paste from clipboard (Ctrl+V), drop, or pick a file — the
// image is embedded as a data URL; a normal URL can also be typed.
function ImageField({ label, hint, value, onChange }) {
  const [drag, setDrag] = useState(false)
  const fileRef = useRef(null)
  const takeFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'))
      if (item) takeFile(item.getAsFile())
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })
  return (
    <div
      className={`admin-image-field${drag ? ' drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files?.[0]) }}
    >
      <div className="admin-image-preview">
        {value ? <img src={value} alt="" /> : <span className="admin-image-empty">🖼</span>}
      </div>
      <input
        className="admin-image-url"
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
      <div className="admin-image-actions">
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          📁 {label}
        </button>
        {value && (
          <button type="button" className="btn btn-ghost" onClick={() => onChange('')}>
            ✕
          </button>
        )}
      </div>
      <span className="t-sub">{hint}</span>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => takeFile(e.target.files?.[0])} />
    </div>
  )
}

const EMPTY_FORM = {
  title: '', titleEn: '', titleRu: '',
  description: '', descriptionEn: '', descriptionRu: '',
  departureAddress: '', region: 'home', days: '3', price: '', imageUrl: '',
}

function DiscountEditor({ value, setValue, busy, onSave, onRemove, t }) {
  return (
    <div className="discount-editor">
      <label className="field">
        <span>{t.admin.discount}</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
          placeholder="0"
        />
      </label>
      <p className="t-sub">{t.admin.discountNote}</p>
      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={onRemove}>
          ✕ {t.admin.discountRemove}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onSave}>
          🏷 {t.admin.discountSet}
        </button>
      </div>
    </div>
  )
}

function formFromRow(row) {
  return {
    title: row.title || '',
    titleEn: row.title_en || '',
    titleRu: row.title_ru || '',
    description: row.description || '',
    descriptionEn: row.description_en || '',
    descriptionRu: row.description_ru || '',
    departureAddress: row.departure_address || '',
    region: row.region || 'home',
    days: String(row.days || 3),
    price: String(row.price ?? ''),
    imageUrl: row.image_url || '',
  }
}

function TourForm({ initial, editing, cardMode, saving, onSave, onCancel, t }) {
  const [form, setForm] = useState(initial)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  // Card tours only need the three name fields.
  if (cardMode) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="admin-form">
        <h3>{editing ? `✏️ ${t.admin.editCardTour}` : `➕ ${t.admin.addCardTour}`}</h3>
        <label className="field">
          <span>{t.admin.name} (AM)</span>
          <input value={form.title} onChange={set('title')} required />
        </label>
        <label className="field">
          <span>{t.admin.name} (EN)</span>
          <input value={form.titleEn} onChange={set('titleEn')} placeholder={form.title} />
        </label>
        <label className="field">
          <span>{t.admin.name} (RU)</span>
          <input value={form.titleRu} onChange={set('titleRu')} placeholder={form.title} />
        </label>
        <div className="checkout-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{t.admin.cancel}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{t.admin.save}</button>
        </div>
      </form>
    )
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="admin-form">
      <h3>{editing ? `✏️ ${t.admin.editTour}` : `➕ ${t.admin.addTour}`}</h3>

      <label className="field">
        <span>{t.admin.name} (AM)</span>
        <input value={form.title} onChange={set('title')} required />
      </label>
      <label className="field">
        <span>{t.admin.name} (EN)</span>
        <input value={form.titleEn} onChange={set('titleEn')} placeholder={form.title} />
      </label>
      <label className="field">
        <span>{t.admin.name} (RU)</span>
        <input value={form.titleRu} onChange={set('titleRu')} placeholder={form.title} />
      </label>

      <label className="field">
        <span>{t.admin.desc} (AM)</span>
        <textarea value={form.description} onChange={set('description')} rows={2} />
      </label>
      <label className="field">
        <span>{t.admin.desc} (EN)</span>
        <textarea value={form.descriptionEn} onChange={set('descriptionEn')} rows={2} />
      </label>
      <label className="field">
        <span>{t.admin.desc} (RU)</span>
        <textarea value={form.descriptionRu} onChange={set('descriptionRu')} rows={2} />
      </label>

      <div className="admin-row">
        <label className="field">
          <span>{t.admin.category}</span>
          <select value={form.region} onChange={set('region')}>
            <option value="home">{t.admin.home}</option>
            <option value="abroad">{t.admin.abroad}</option>
          </select>
        </label>
        <label className="field">
          <span>{t.admin.days}</span>
          <input inputMode="numeric" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value.replace(/\D/g, '').slice(0, 2) }))} required />
        </label>
      </div>
      <label className="field">
        <span>{t.admin.price}</span>
        <input inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, '').slice(0, 9) }))} required />
      </label>
      <label className="field">
        <span>{t.admin.departure}</span>
        <input value={form.departureAddress} onChange={set('departureAddress')} placeholder={t.checkout.departureAddress} />
      </label>
      <span className="field-label">{t.admin.image}</span>
      <ImageField
        label={t.admin.imageFile}
        hint={t.admin.imageHint}
        value={form.imageUrl}
        onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
      />

      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t.admin.cancel}</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{t.admin.save}</button>
      </div>
    </form>
  )
}

function TourList({ heading, sub, tours, picked, onPick, t, actions, discounts }) {
  return (
    <div className="admin-form">
      <h3>{heading}</h3>
      <p className="t-sub">{sub}</p>
      {tours === null ? (
        <p>…</p>
      ) : tours.length === 0 ? (
        <p className="t-sub">—</p>
      ) : (
        <ul className="admin-tour-list">
          {tours.map((row) => (
            <li key={row.id}>
              <label className={`admin-tour-item${row.hidden ? ' hidden-tour' : ''}`}>
                <input type="radio" name="admin-pick" checked={picked === row.id} onChange={() => onPick(row.id)} />
                <span>
                  <strong>{row.title}{row.builtin ? ' ⭐' : ''}</strong>
                  <em>
                    {row.region === 'abroad' ? t.admin.abroad : t.admin.home} · {row.days} {t.checkout.daysWord}
                    {!row.builtin && row.price != null && ` · ${fmt.format(Number(row.price) || 0)} ֏`}
                    {discounts && discounts[row.id] != null && ` · 🏷 −${discounts[row.id]}%`}
                    {row.hidden && ` · ${t.admin.hiddenTag}`}
                  </em>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {actions}
    </div>
  )
}

export default function AdminPanel({ t, initialMode, onClose, onSaved }) {
  const { supabase } = useAuth()
  const [mode, setMode] = useState('pin') // 'pin' | 'add' | 'edit' | 'delete' | 'bus' | 'addCard' | 'delCard' | 'discount'
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { kind: 'ok' | 'err', text }
  const [tours, setTours] = useState(null) // rows of the active table
  const [hidden, setHidden] = useState(new Set()) // hidden builtin ids
  const [discounts, setDiscounts] = useState({}) // { [tourId]: pct } — regular tours only
  const [discVal, setDiscVal] = useState('') // discount input for the picked tour
  const [picked, setPicked] = useState(null) // id picked for edit/delete
  const [formOpen, setFormOpen] = useState(false) // edit mode: form shown?
  const [busTour, setBusTour] = useState('') // '' = every bus

  const isCard = ['addCard', 'delCard'].includes(initialMode)
  const isDiscount = initialMode === 'discount'

  // Build the list shown in delete/edit pickers: DB rows + builtin tours
  // (marked, still listed even when hidden so they can be restored).
  const buildList = (rows, hiddenSet) => {
    const list = (rows || []).map((r) => ({
      id: r.id,
      dbId: r.id,
      title: r.title,
      region: r.region,
      days: r.days,
      price: r.price,
      hidden: false,
    }))
    for (const b of TOURS) {
      list.push({
        id: b.id,
        builtin: true,
        title: t.tours[b.id]?.title || b.id,
        region: b.home ? 'home' : 'abroad',
        days: b.days,
        price: b.price,
        hidden: hiddenSet.has(b.id),
      })
    }
    return list
  }

  // DB rows + the hidden-builtin set for the active kind (regular/card),
  // plus the discount map for regular tours.
  const loadAll = async () => {
    setTours(null)
    const table = isCard ? TABLES.card : TABLES.tour
    const [{ data: rows, error }, { data: hiddenRows }, { data: discRows }] = await Promise.all([
      supabase.from(table).select('*').order('created_at', { ascending: false }),
      supabase.from('hidden_tours').select('tour_id').eq('kind', isCard ? 'card' : 'tour'),
      isDiscount
        ? supabase.from('tour_discounts').select('tour_id, discount').eq('kind', 'tour')
        : Promise.resolve({ data: [] }),
    ])
    if (error) notify('err', error.message)
    setHidden(new Set((hiddenRows || []).map((r) => r.tour_id)))
    setDiscounts(Object.fromEntries((discRows || []).map((r) => [r.tour_id, r.discount])))
    setTours(buildList(rows || [], new Set((hiddenRows || []).map((r) => r.tour_id))))
  }

  // The PIN arms ONE action. Completing it (or canceling) re-locks, so the
  // next action asks for the PIN again.
  const wantMode = () => {
    setMode('pin')
    setUnlocked(false)
    setPicked(null)
    setTours(null)
    setFormOpen(false)
    setDiscVal('')
  }

  const notify = (kind, text) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const activeTable = isCard ? TABLES.card : TABLES.tour

  const loadTours = (table) => {
    setTours(null)
    supabase
      .from(table || activeTable)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) notify('err', error.message)
        setTours(buildList(data || [], hidden))
      })
  }

  // Pin accepted → unlock the armed action (the mode chosen from the buttons).
  const acceptPin = (pin) => {
    if (pin !== STAFF_PIN) return false
    setUnlocked(true)
    setMode(initialMode)
    if (['edit', 'delete', 'delCard', 'discount'].includes(initialMode)) loadAll()
    return true
  }

  const rowFromForm = (form) => ({
    title: form.title.trim(),
    title_en: form.titleEn.trim() || null,
    title_ru: form.titleRu.trim() || null,
    description: form.description.trim() || null,
    description_en: form.descriptionEn.trim() || null,
    description_ru: form.descriptionRu.trim() || null,
    departure_address: form.departureAddress.trim() || null,
    region: form.region,
    days: Number(form.days) || 3,
    price: Number(form.price) || 0,
    image_url: form.imageUrl.trim() || null,
  })

  const saveTour = async (form) => {
    setBusy(true)
    const editing = mode === 'edit' && picked
    const values = isCard
      ? {
          title: form.title.trim(),
          title_en: form.titleEn.trim() || null,
          title_ru: form.titleRu.trim() || null,
        }
      : rowFromForm(form)
    let res = editing
      ? await supabase.from(activeTable).update(values).eq('id', picked)
      : await supabase.from(activeTable).insert(values)
    // Older schema without the new columns: retry without them so the
    // tour itself is never lost (localized fields need the migration).
    if (res.error && /(title_en|title_ru|description_en|description_ru|departure_address)/i.test(res.error.message || '')) {
      const { title_en, title_ru, description_en, description_ru, departure_address, ...rest } = values
      res = editing
        ? await supabase.from(activeTable).update(rest).eq('id', picked)
        : await supabase.from(activeTable).insert(rest)
    }
    setBusy(false)
    if (res.error) {
      notify('err', res.error.message || t.admin.failed)
      return
    }
    notify('ok', `✅ ${editing ? t.admin.updated : t.admin.saved}`)
    // Re-lock: the next action needs the PIN again.
    wantMode()
    if (onSaved) onSaved()
  }

  const deleteTour = async () => {
    if (!picked) return
    setBusy(true)
    const item = (tours || []).find((r) => r.id === picked)
    let error = null
    if (item?.builtin) {
      // Builtin tours can't be deleted from the code — hide them instead.
      ;({ error } = await supabase
        .from('hidden_tours')
        .insert({ kind: isCard ? 'card' : 'tour', tour_id: picked }))
      // Already hidden → restore instead (toggle).
      if (error && error.code === '23505') {
        const r2 = await supabase
          .from('hidden_tours')
          .delete()
          .eq('kind', isCard ? 'card' : 'tour')
          .eq('tour_id', picked)
        error = r2.error
        notify('ok', `✅ ${t.admin.restored}`)
      } else {
        notify('ok', `🗑 ${t.admin.hidden}`)
      }
    } else {
      const { error: e } = await supabase.from(activeTable).delete().eq('id', picked)
      error = e
      if (!error) notify('ok', `🗑 ${t.admin.deleted}`)
    }
    setBusy(false)
    if (error && error.code !== '23505') {
      notify('err', error.message || t.admin.failed)
      return
    }
    setPicked(null)
    // Re-lock: deleting another tour asks for the PIN again.
    wantMode()
    if (onSaved) onSaved()
  }

  // Wipe bookings so the chosen bus's seats show free again. RLS blocks
  // direct deletes with the anon key, so this goes through the PIN-checked
  // RPC, which accepts an optional tour filter.
  const cleanBus = async () => {
    setBusy(true)
    const { error } = await supabase.rpc('reset_bus_bookings', {
      pin: STAFF_PIN,
      p_tour_id: busTour || null,
    })
    setBusy(false)
    if (error) {
      notify('err', error.message || t.admin.failed)
      return
    }
    notify('ok', `🚌 ${t.admin.busCleaned}`)
    wantMode()
  }

  // Set (or update) the picked tour's percent discount. Regular tours only.
  const saveDiscount = async () => {
    const pct = Number(discVal)
    if (!picked || !pct || pct < 1 || pct > 99) return
    setBusy(true)
    const { error } = await supabase
      .from('tour_discounts')
      .upsert({ kind: 'tour', tour_id: picked, discount: pct }, { onConflict: 'kind,tour_id' })
    setBusy(false)
    if (error) {
      notify('err', error.message || t.admin.failed)
      return
    }
    notify('ok', `🏷 ${t.admin.discountSet}: −${pct}%`)
    wantMode()
    if (onSaved) onSaved()
  }

  // Remove the picked tour's discount (back to full price).
  const removeDiscount = async () => {
    if (!picked) return
    setBusy(true)
    const { error } = await supabase
      .from('tour_discounts')
      .delete()
      .eq('kind', 'tour')
      .eq('tour_id', picked)
    setBusy(false)
    if (error) {
      notify('err', error.message || t.admin.failed)
      return
    }
    notify('ok', `✅ ${t.admin.discountRemoved}`)
    wantMode()
    if (onSaved) onSaved()
  }

  const formInitial = mode === 'edit' && picked ? formFromRow((tours || []).find((r) => r.id === picked)) : EMPTY_FORM
  const editReady = mode === 'edit' && picked && formOpen

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
            <PinGate t={t} onSubmit={acceptPin} />
          ) : mode === 'add' || mode === 'addCard' ? (
            <TourForm
              key="new"
              initial={EMPTY_FORM}
              editing={false}
              cardMode={isCard}
              saving={busy}
              onSave={saveTour}
              onCancel={onClose}
              t={t}
            />
          ) : mode === 'edit' ? (
            tours === null ? (
              <p>…</p>
            ) : editReady ? (
              <TourForm
                key={picked}
                initial={formInitial}
                editing
                cardMode={isCard && (tours || []).find((r) => r.id === picked)?.dbId}
                saving={busy}
                onSave={saveTour}
                onCancel={() => { setFormOpen(false); loadAll() }}
                t={t}
              />
            ) : (
              <TourList
                heading={`✏️ ${t.admin.editTour}`}
                sub={t.admin.pickEdit}
                tours={tours}
                picked={picked}
                onPick={setPicked}
                t={t}
                actions={
                  <div className="checkout-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                    <button type="button" className="btn btn-primary" disabled={!picked} onClick={() => setFormOpen(true)}>
                      ✏️ {t.admin.editTour}
                    </button>
                  </div>
                }
              />
            )
          ) : mode === 'delete' || mode === 'delCard' ? (
            <TourList
              heading={`🗑 ${t.admin.deleteTour}`}
              sub={t.admin.pick}
              tours={tours}
              picked={picked}
              onPick={setPicked}
              t={t}
              actions={
                <div className="checkout-actions">
                  <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                  <button type="button" className="btn btn-primary" disabled={!picked || busy} onClick={deleteTour}>
                    🗑 {t.admin.deleteTour}
                  </button>
                </div>
              }
            />
          ) : mode === 'discount' ? (
            tours === null ? (
              <p>…</p>
            ) : (
              <>
                <TourList
                  heading={`🏷 ${t.admin.discountTour}`}
                  sub={t.admin.discountPick}
                  tours={tours}
                  picked={picked}
                  onPick={(id) => {
                    setPicked(id)
                    setDiscVal(discounts[id] != null ? String(discounts[id]) : '')
                  }}
                  t={t}
                  discounts={isDiscount ? discounts : undefined}
                />
                {picked && (
                  <DiscountEditor
                    value={discVal}
                    setValue={setDiscVal}
                    busy={busy}
                    onSave={saveDiscount}
                    onRemove={removeDiscount}
                    t={t}
                  />
                )}
                {!picked && (
                  <div className="checkout-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="admin-form">
              <h3>🚌 {t.admin.cleanBus}</h3>
              <label className="field">
                <span>{t.admin.busToClean}</span>
                <select value={busTour} onChange={(e) => setBusTour(e.target.value)}>
                  <option value="">{t.admin.allBuses}</option>
                  {BUILTIN_BUS_IDS.map((id) => (
                    <option key={id} value={id}>{t.tours[id]?.title || id}</option>
                  ))}
                  {(tours || []).map((row) => (
                    <option key={row.id} value={`db:${row.id}`}>{row.title}</option>
                  ))}
                </select>
              </label>
              <p className="t-sub">
                {busTour
                  ? `${t.admin.confirmClean}: «${
                      busTour.startsWith('db:')
                        ? (tours || []).find((r) => r.id === busTour.slice(3))?.title || busTour
                        : t.tours[busTour]?.title || busTour
                    }»`
                  : t.admin.confirmClean}
              </p>
              <div className="checkout-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>{t.admin.cancel}</button>
                <button type="button" className="btn btn-primary" onClick={cleanBus} disabled={busy}>{t.admin.cleanBus}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// The admin buttons shown on the main page.
export function AdminEntry({ t, onSaved }) {
  const [open, setOpen] = useState(null) // 'add' | 'edit' | 'delete' | 'bus' | 'seats' | null
  const [seatsOpen, setSeatsOpen] = useState(false)
  return (
    <div className="admin-entry">
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('add')}>
        ➕ {t.admin.addTour}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('edit')}>
        ✏️ {t.admin.editTour}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('delete')}>
        🗑 {t.admin.deleteTour}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setSeatsOpen(true)}>
        📋 {t.admin.showBusSeats}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('bus')}>
        🚌 {t.admin.cleanBus}
      </button>
      <button type="button" className="btn btn-ghost admin-btn" onClick={() => setOpen('discount')}>
        🏷 {t.admin.discountTour}
      </button>
      {open && (
        <AdminPanel t={t} initialMode={open} onClose={() => setOpen(null)} onSaved={onSaved} />
      )}
      {seatsOpen && <BusSeats t={t} onClose={() => setSeatsOpen(false)} />}
    </div>
  )
}
