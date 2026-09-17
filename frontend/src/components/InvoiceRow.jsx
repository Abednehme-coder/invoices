import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../api'
import StatusBadge from './StatusBadge'
import { formatUSD, formatAmount } from './CurrencyDisplay'

const HOLD_MS = 800

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

export default function InvoiceRow({ invoice, onPaid }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0) // 0-100
  const [marking, setMarking] = useState(false)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const remaining = parseFloat(invoice.remaining_usd)
  const amount = parseFloat(invoice.amount)
  const canQuickPay = invoice.status !== 'paid' && onPaid

  const startHold = useCallback((e) => {
    e.stopPropagation()
    if (marking) return
    startRef.current = performance.now()
    const tick = (now) => {
      const elapsed = now - startRef.current
      const pct = Math.min((elapsed / HOLD_MS) * 100, 100)
      setProgress(pct)
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        triggerPay()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [marking])

  const cancelHold = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setProgress(0)
  }, [])

  async function triggerPay() {
    setMarking(true)
    setProgress(0)
    try {
      await api.post(`/invoices/${invoice.id}/mark-paid/`)
      onPaid()
    } catch {
      setMarking(false)
    }
  }

  // SVG ring
  const r = 10
  const circ = 2 * Math.PI * r
  const dash = (progress / 100) * circ

  return (
    <div className="flex items-stretch gap-2">
      <button
        onClick={() => navigate(`/invoices/${invoice.id}`)}
        className="flex-1 min-w-0 text-start bg-surface rounded-md px-4 py-3 flex items-start justify-between gap-3 transition-colors duration-fast hover:bg-surface-raised active:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-ink-faint ltr-isolate font-medium" dir="ltr">
              {invoice.reference}
            </span>
            <StatusBadge status={invoice.status} size="sm" />
          </div>
          <span className="text-ink font-medium truncate">{invoice.name}</span>
          {invoice.description && (
            <span className="text-ink-muted text-sm truncate">{invoice.description}</span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`tabular-nums ltr-isolate font-semibold ${
              invoice.status === 'paid' ? 'text-success' : 'text-ink'
            }`}
            dir="ltr"
          >
            {invoice.status === 'partial'
              ? formatUSD(remaining) + ' متبقي'
              : formatAmount(amount, invoice.currency)}
          </span>
          <span className="text-xs text-ink-faint">{formatDate(invoice.created_at)}</span>
        </div>
      </button>

      {/* Hold-to-pay button */}
      {canQuickPay && (
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          disabled={marking}
          className="w-12 shrink-0 bg-surface rounded-md flex items-center justify-center select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:opacity-40"
          aria-label="اضغط مطولاً للتسجيل كمدفوعة"
          style={{ WebkitUserSelect: 'none' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28">
            {/* Track */}
            <circle
              cx="14" cy="14" r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2.5"
            />
            {/* Progress arc */}
            <circle
              cx="14" cy="14" r={r}
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform="rotate(-90 14 14)"
              style={{ transition: progress === 0 ? 'none' : undefined }}
            />
            {/* Check icon */}
            <Check
              x="7" y="7"
              width="14" height="14"
              strokeWidth={2.5}
              stroke={progress > 0 ? 'var(--color-success)' : 'var(--color-ink-faint)'}
            />
          </svg>
        </button>
      )}
    </div>
  )
}
