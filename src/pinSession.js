import { supabase } from './supabaseClient.js'
import { getSessionId, MAX_PIN_DEVICES } from './pinAccess.js'

// Concurrency limiter for the shared staff PIN.
//
// When a device unlocks a PIN-gated feature it registers a row in
// public.pin_sessions (device, last_seen). While the page stays open a
// heartbeat refreshes last_seen every 20s; a session older than 60s counts
// as gone (closed tab/browser), so its slot frees automatically. A device
// that holds the pin refreshes its slot for 10 minutes after the last
// unlock even without the heartbeat, but leaves as soon as the page closes.
//
// MAX_PIN_DEVICES (7) devices may hold the PIN at the same time; when the
// cap is reached, canUsePin() returns false and the UI shows a "busy"
// message instead of unlocking.

const HEARTBEAT_MS = 20000
const STALE_MS = 60000

let started = false

function pruneOld(rows) {
  const cutoff = Date.now() - STALE_MS
  return (rows || []).filter((r) => new Date(r.last_seen).getTime() >= cutoff)
}

// How many devices currently hold the PIN (live sessions).
export async function countPinDevices() {
  const { data, error } = await supabase
    .from('pin_sessions')
    .select('device, last_seen')
  if (error) return { count: 0, max: MAX_PIN_DEVICES, error }
  return { count: pruneOld(data).length, max: MAX_PIN_DEVICES, error: null }
}

// Can this device take a slot right now? (Registration happens on unlock.)
export async function canUsePin() {
  const { count, max, error } = await countPinDevices()
  if (error) {
    // Table missing / unreachable — fail open rather than locking everyone out.
    return { ok: true, count, max }
  }
  return { ok: count < max, count, max }
}

// Register this device's slot and start the heartbeat. Returns true when
// the slot is secured.
export async function startPinSession() {
  const device = getSessionId()
  const { error } = await supabase
    .from('pin_sessions')
    .upsert({ device, last_seen: new Date().toISOString() }, { onConflict: 'device' })
  if (error) {
    // Fail open: if the table doesn't exist yet, don't lock everyone out.
    if (!/does not exist|schema/i.test(error.message || '')) console.warn(error.message)
  }
  if (!started) {
    started = true
    setInterval(() => {
      supabase
        .from('pin_sessions')
        .upsert({ device, last_seen: new Date().toISOString() }, { onConflict: 'device' })
        .then(() => window.dispatchEvent(new Event('pincount')))
    }, HEARTBEAT_MS)
  }
  return !error
}

// Immediately free this device's slot (called when the PIN locks again).
export async function endPinSession() {
  const { error } = await supabase
    .from('pin_sessions')
    .delete()
    .eq('device', getSessionId())
  if (error && !/does not exist|schema/i.test(error.message || '')) console.warn(error.message)
  window.dispatchEvent(new Event('pincount'))
}

// one-shot: remove stale sessions when the page loads
export function prunePinSessions() {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString()
  return supabase.from('pin_sessions').delete().lt('last_seen', cutoff)
}
