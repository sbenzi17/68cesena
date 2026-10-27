import { useRef, useState } from 'react'

// Lente come nei negozi online: passando il mouse sull'immagine compare un riquadro che segue il cursore
// e, a fianco, il dettaglio ingrandito alla risoluzione piena dell'immagine (almeno 2,5 volte).
// Il clic sull'immagine chiama onClick (per aprirla a schermo intero).
export default function HoverZoom({ src, alt = '', onClick }) {
  const boxRef = useRef(null)
  const imgRef = useRef(null)
  const [view, setView] = useState(null)

  const onMove = (e) => {
    const img = imgRef.current
    const r = img.getBoundingClientRect()
    const box = boxRef.current.getBoundingClientRect()
    const zoom = Math.max(2.5, img.naturalWidth / r.width)
    const paneW = box.width / 2
    const paneH = box.height
    const lensW = Math.min(r.width, paneW / zoom)
    const lensH = Math.min(r.height, paneH / zoom)
    const clamp = (v, max) => Math.min(Math.max(v, 0), max)
    const left = clamp(e.clientX - r.left - lensW / 2, r.width - lensW)
    const top = clamp(e.clientY - r.top - lensH / 2, r.height - lensH)
    setView({
      lens: { left: r.left - box.left + left, top: r.top - box.top + top, width: lensW, height: lensH },
      pane: {
        backgroundImage: `url(${src})`,
        backgroundSize: `${r.width * zoom}px ${r.height * zoom}px`,
        backgroundPosition: `${-left * zoom}px ${-top * zoom}px`,
      },
    })
  }

  return (
    <div className="hover-zoom" ref={boxRef} onMouseLeave={() => setView(null)}>
      <img ref={imgRef} src={src} alt={alt} onMouseMove={onMove} onClick={onClick} />
      {view && <span className="hover-zoom-lens" style={view.lens} aria-hidden="true" />}
      {view && <div className="hover-zoom-pane" style={view.pane} aria-hidden="true" />}
    </div>
  )
}
