import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

export default function AuthModal({ onClose, t }) {
  const { supabase } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
        })
        if (data.session) {
          onClose()
        } else {
          setNotice(t.auth.checkEmail)
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onClose()
    }

    setBusy(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label={t.modal.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-body">
          <h2>{mode === 'login' ? t.auth.signIn : t.auth.signUp}</h2>

          {notice && <p className="auth-notice">{notice}</p>}
          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={submit} className="pay-grid">
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="auth-name">{t.auth.fullName}</label>
                <input id="auth-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">{t.auth.email}</label>
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="auth-pass">{t.auth.password}</label>
              <input id="auth-pass" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={busy}>
              {mode === 'login' ? t.auth.loginBtn : t.auth.createAccount}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setNotice('')
            }}
          >
            {mode === 'login' ? t.auth.needAccount : t.auth.haveAccount}
          </button>
        </div>
      </div>
    </div>
  )
}
