import { useState } from 'react'
import { LANGUAGES } from '../i18n.js'
import { useAuth } from '../AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import logo from '../assets/main-logo.jpeg'

const PHONE = '+374 77 044201'

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export default function Header({ lang, onLangChange, t }) {
  const { user, profile, supabase } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="logo-link" href="/" aria-label="Home">
          <img className="logo-img" src={logo} alt="Հայաստանի Արմատները logo" />
          <span className="logo-text">Հայաստանի Արմատները</span>
        </a>

        <div className="header-spacer" />

        <a className="header-phone" href={`tel:${PHONE.replace(/\s/g, '')}`}>
          <PhoneIcon />
          <span>{PHONE}</span>
        </a>

        {user ? (
          <div className="account-wrap">
            <button type="button" className="account-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="avatar">{(profile?.full_name || user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}</span>
              <span className="account-name">{profile?.full_name || user.user_metadata?.full_name || user.email}</span>
            </button>
            {menuOpen && (
              <div className="account-menu">
                <div className="account-email">{user.email}</div>
                <button
                  type="button"
                  className="account-signout"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setMenuOpen(false)
                  }}
                >
                  {t.auth.signOut}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-ghost account-login" onClick={() => setAuthOpen(true)}>
            👤 {t.auth.signIn}
          </button>
        )}

        <div className="lang-switch" role="group" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`lang-btn${lang === l.code ? ' active' : ''}`}
              onClick={() => onLangChange(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

      {authOpen && <AuthModal t={t} onClose={() => setAuthOpen(false)} />}
      </div>
    </header>
  )
}
