import { useEffect, useRef } from 'react'

// Finestra di conferma ("Sei sicuro?"). Si chiude con Annulla, con Esc o cliccando fuori.
export default function ConfirmDialog({ open, title, children, confirmLabel = 'Conferma', danger, busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <div className="confirm-body">{children}</div>
        <div className="confirm-actions">
          <button type="button" ref={cancelRef} className="btn btn-secondary" onClick={onCancel} disabled={busy}>Annulla</button>
          <button type="button" className={`btn${danger ? ' btn-danger-solid' : ''}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Attendi…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
