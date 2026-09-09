// One-off test of the silver-coin DB operations used by SilverPage.jsx.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Read credentials from .env so the key is never retyped by hand.
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const email = `coin.test.${Math.floor(Math.random() * 999999)}@gmail.com`
const password = 'test123456'

console.log('1) Signing up', email)
const { data: su, error: suErr } = await supabase.auth.signUp({ email, password })
if (suErr) {
  console.log('   signup error:', suErr.message)
  process.exit(1)
}
console.log('   user created:', !!su.user, '| session:', !!su.session)

if (!su.session) {
  console.log('   no session (email confirmation is ON?) — cannot continue as this user')
  process.exit(0)
}

console.log('2) Reading profiles.silver_coins (expect error or 0 — row may not exist yet)')
const { data: p0, error: p0Err } = await supabase
  .from('profiles')
  .select('silver_coins')
  .eq('id', su.user.id)
  .single()
console.log('   value:', p0?.silver_coins, '| error:', p0Err ? p0Err.message : null)

console.log('3) Claiming +200 via upsert (same as SilverPage)')
const current = p0?.silver_coins ?? 0
const { error: upErr } = await supabase
  .from('profiles')
  .upsert({ id: su.user.id, email, silver_coins: current + 200 })
console.log('   upsert error:', upErr ? upErr.message : null)

const { data: p1 } = await supabase
  .from('profiles')
  .select('silver_coins')
  .eq('id', su.user.id)
  .single()
console.log('   balance after claim:', p1?.silver_coins, p1?.silver_coins === current + 200 ? 'PASS' : 'FAIL')

console.log('4) Removing all coins via upsert (same as SilverPage)')
const { error: rmErr } = await supabase
  .from('profiles')
  .upsert({ id: su.user.id, email, silver_coins: 0 })
console.log('   upsert error:', rmErr ? rmErr.message : null)

const { data: p2 } = await supabase
  .from('profiles')
  .select('silver_coins')
  .eq('id', su.user.id)
  .single()
console.log('   balance after removal:', p2?.silver_coins, p2?.silver_coins === 0 ? 'PASS' : 'FAIL')
