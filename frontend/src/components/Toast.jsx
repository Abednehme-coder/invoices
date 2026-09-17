import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const DURATION = 4000

export default function Toast({ message, onUndo, onDismiss }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, DURATION)
    return () => clearTimeout(timerRef.current)
  }, [onDismiss])

  function handleUndo() {
    clearTimeout(timerRef.current)
    onUndo()
  }

  return createPortal(
    <div
      className="fixed bottom-24 inset-x-4 z-toast flex items-center gap-3 bg-ink text-bg rounded-xl px-4 py-3 shadow-lg"
      style={{ animation: 'slideUp 0.2s ease-out' }}
      role="status"
    >
      {/* Timer bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 rounded-b-xl overflow-hidden bg-white/10">
        <div
          className="h-full bg-white/40 rounded-b-xl"
          style={{ animation: `shrink ${DURATION}ms linear forwards` }}
        />
      </div>

      <span className="flex-1 text-sm font-medium">{message}</span>

      <button
        onClick={handleUndo}
        className="text-sm font-bold text-primary-subtle underline underline-offset-2 shrink-0 hover:no-underline"
      >
        تراجع
      </button>

      <button onClick={onDismiss} className="text-bg/60 hover:text-bg shrink-0">
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>,
    document.body
  )
}
