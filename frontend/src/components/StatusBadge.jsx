const CONFIG = {
  unpaid:  { label: 'غير مدفوع', dot: '●', className: 'bg-unpaid-bg text-unpaid' },
  partial: { label: 'جزئي',      dot: '◑', className: 'bg-partial-bg text-partial' },
  paid:    { label: 'مدفوع',     dot: '✓', className: 'bg-paid-bg text-paid' },
}

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = CONFIG[status] ?? CONFIG.unpaid
  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${sizeClass} ${cfg.className}`}>
      <span aria-hidden="true">{cfg.dot}</span>
      {cfg.label}
    </span>
  )
}
