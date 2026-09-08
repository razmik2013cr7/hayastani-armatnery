import { CATEGORIES } from '../data.js'

export default function TourNav({ active, onChange, t }) {
  return (
    <nav className="tour-nav" aria-label="Tour types">
      <div className="tour-nav-inner">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`nav-pill${active === cat.id ? ' active' : ''}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.labelKey.split('.').reduce((obj, key) => obj[key], t)}
          </button>
        ))}
      </div>
    </nav>
  )
}
