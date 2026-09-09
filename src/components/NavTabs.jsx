import { useEffect, useState } from 'react'

// Top-bar section switcher between the main site and the souvenir shop.
// Tracks the URL hash so the active tab follows navigation.
export default function NavTabs({ t }) {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const shopActive = hash === '#/shop'
  const mainActive = !shopActive

  return (
    <nav className="site-tabs" aria-label="Sections">
      <a className={`site-tab${mainActive ? ' active' : ''}`} href="#/">
        🏠 {t.tabs.main}
      </a>
      <a className={`site-tab${shopActive ? ' active' : ''}`} href="#/shop">
        🛍 {t.tabs.shop}
      </a>
    </nav>
  )
}
