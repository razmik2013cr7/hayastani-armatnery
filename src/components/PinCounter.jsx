import { useEffect, useState } from 'react'
import { countPinDevices } from '../pinSession.js'

// Small pill under the admin buttons: shows how many devices are currently
// holding the staff PIN (live sessions, out of the 7-device cap).
export default function PinCounter({ t }) {
  const [state, setState] = useState({ count: null, max: 7 })

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { count, max } = await countPinDevices()
      if (alive) setState({ count, max })
    }
    load()
    const timer = setInterval(load, 15000)
    window.addEventListener('pincount', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('pincount', load)
    }
  }, [])

  return (
    <div className="pin-counter" title={t.checkout.pinBusyTitle}>
      <span className={`pin-counter-dot${state.count >= state.max ? ' full' : ''}`} aria-hidden="true" />
      <span>
        {t.checkout.pinActiveDevices}: <strong>{state.count === null ? '…' : state.count}</strong> / {state.max}
      </span>
    </div>
  )
}
