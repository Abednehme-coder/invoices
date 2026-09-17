import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null)

  // Trap scroll behind backdrop
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <div
      aria-hidden={!open}
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: 'var(--z-modal)', pointerEvents: open ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 transition-opacity duration-normal"
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-bg rounded-t-2xl shadow-lg flex flex-col transition-transform duration-normal"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '90dvh',
        }}
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <div className="w-10" />
          <div className="w-10 h-1 rounded-full bg-border mx-auto absolute top-3 left-1/2 -translate-x-1/2" />
          <h2 className="text-base font-semibold text-ink flex-1 text-center">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-md text-ink-faint hover:text-ink hover:bg-surface transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
