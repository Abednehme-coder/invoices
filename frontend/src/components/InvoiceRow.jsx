import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { formatUSD, formatLBP, formatAmount } from './CurrencyDisplay'

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

export default function InvoiceRow({ invoice }) {
  const navigate = useNavigate()
  const remaining = parseFloat(invoice.remaining_usd)
  const amount = parseFloat(invoice.amount)

  return (
    <button
      onClick={() => navigate(`/invoices/${invoice.id}`)}
      className="w-full text-start bg-surface rounded-md px-4 py-3 flex items-start justify-between gap-3 transition-colors duration-fast hover:bg-surface-raised active:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Right side — main info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs text-ink-faint ltr-isolate font-medium"
            dir="ltr"
          >
            {invoice.reference}
          </span>
          <StatusBadge status={invoice.status} size="sm" />
        </div>
        <span className="text-ink font-medium truncate">
          {invoice.name}
        </span>
        {invoice.description && (
          <span className="text-ink-muted text-sm truncate">
            {invoice.description}
          </span>
        )}
      </div>

      {/* Left side — amount + date */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="tabular-nums ltr-isolate font-semibold text-ink" dir="ltr">
          {invoice.status === 'partial'
            ? formatUSD(remaining) + ' متبقي'
            : formatAmount(amount, invoice.currency)}
        </span>
        <span className="text-xs text-ink-faint">
          {formatDate(invoice.created_at)}
        </span>
      </div>
    </button>
  )
}
