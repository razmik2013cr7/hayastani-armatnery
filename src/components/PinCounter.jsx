import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { MAX_PIN_DEVICES } from '../pinAccess.js'
import { countPinDevices } from '../pinSession.js'

// Two pills under the admin buttons:
//   • how many devices currently hold the staff PIN (live sessions, /7)
//   • how many users have signed up in the database (profiles table)
export default function PinCounter({ t }) {
  const [pin, setPin] = useState({ count: null, max: MAX_PIN_DEVICES })
  const [users, setUsers] = useState(null)

  useEffect(() => {
    let alive = true
    const loadPin = async () => {
      const { count, max } = await countPinDevices()
      if (alive) setPin({ count, max })
    }
    const loadUsers = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      if (alive && !error) setUsers(count ?? 0)
    }
    loadPin()
    loadUsers()
    const timer = setInterval(loadPin, 15000)
    window.addEventListener('pincount', loadPin)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('pincount', loadPin)
    }
  }, [])

  return (
    <>
      <div className="pin-counter" title={t.checkout.pinBusyTitle}>
        <span className={`pin-counter-dot${pin.count >= pin.max ? ' full' : ''}`} aria-hidden="true" />
        <span>
          {t.checkout.pinActiveDevices}: <strong>{pin.count === null ? '…' : pin.count}</strong> / {pin.max}
        </span>
      </div>
      <div className="pin-counter users" title={t.checkout.pinUsersTitle}>
        <span aria-hidden="true">👤</span>
        <span>
          {t.checkout.pinUsers}: <strong>{users === null ? '…' : users}</strong>
        </span>
      </div>
    </>
  )
}
