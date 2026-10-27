import { Link } from 'react-router-dom'

// Marchio: un fotogramma di pellicola (le fotografie) con dentro gli anni dell'archivio, 68/77
export function BrandMark({ className = 'brand-mark' }) {
  const holes = [0, 1, 2, 3, 4, 5]
  return (
    <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="5" width="62" height="54" rx="3" className="brand-film" />
      {holes.map(i => <rect key={`t${i}`} x={5 + i * 9.6} y="9" width="5" height="4.5" rx="1" className="brand-hole" />)}
      {holes.map(i => <rect key={`b${i}`} x={5 + i * 9.6} y="50.5" width="5" height="4.5" rx="1" className="brand-hole" />)}
      <rect x="5" y="17" width="54" height="30" className="brand-frame" />
      <text x="9" y="32" className="brand-year">68</text>
      <line x1="24" y1="43.5" x2="40" y2="20.5" className="brand-slash" />
      <text x="55" y="43.5" textAnchor="end" className="brand-year">77</text>
    </svg>
  )
}

export default function Brand() {
  return (
    <Link to="/" className="logo">
      <BrandMark />
      <span className="logo-text">
        <span className="logo-title">1968/1977 a Cesena</span>
        <small>Archivio fotografico e documenti</small>
      </span>
    </Link>
  )
}
