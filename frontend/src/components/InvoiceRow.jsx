import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import api from '../api'
import StatusBadge from './StatusBadge'
import { formatUSD, formatAmount } from './CurrencyDisplay'

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

export default function InvoiceRow({ invoice, onPaid }) {
  const navigate = useNavigate()
  const [marking, setMarking] = useState(false)
  const remaining = parseFloat(invoice.remaining_usd)
  const amount = parseFloat(invoice.amount)
  const canQuickPay = invoice.status !== 'paid' && onPaid

  async function handleQuickPay(e) {
    e.stopPropagation()
    setMarking(true)
    try {
      await api.post(`/invoices/${invoice.id}/mark-paid/`)
      onPaid()
    } catch {
      setMarking(false)
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <button
        onClick={() => navigate(`/invoices/${invoice.id}`)}
        className="flex-1 min-w-0 text-start bg-surface rounded-md px-4 py-3 flex items-start justify-between gap-3 transition-colors duration-fast hover:bg-surface-raised active:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Right side — main info */}
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

        {/* Left side — amount + date */}
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

      {/* Quick-pay button */}
      {canQuickPay && (
        <button
          onClick={handleQuickPay}
          disabled={marking}
          className="w-12 shrink-0 bg-surface rounded-md flex items-center justify-center text-ink-faint hover:bg-success-bg hover:text-success transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:opacity-40"
          aria-label="تسجيل كمدفوعة"
        >
          <CheckCircle size={20} strokeWidth={marking ? 1 : 1.75} />
        </button>
      )}
    </div>
  )
}
