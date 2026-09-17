export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatLBP(amount) {
  return new Intl.NumberFormat('ar-LB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ل.ل.'
}

export function formatPhone(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

export function sanitizePhone(raw) {
  return (raw || '').replace(/\D/g, '').slice(0, 8)
}

export function formatAmount(amount, currency) {
  if (currency === 'USD') return formatUSD(amount)
  return formatLBP(amount)
}

export default function CurrencyDisplay({ usd, ll, size = 'md', showBoth = true }) {
  const usdClass = {
    sm:   'text-base font-semibold',
    md:   'text-xl font-bold',
    lg:   'text-3xl font-bold',
    display: 'text-4xl font-bold',
  }[size] ?? 'text-xl font-bold'

  const llClass = {
    sm:   'text-xs',
    md:   'text-sm',
    lg:   'text-base',
    display: 'text-lg',
  }[size] ?? 'text-sm'

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={`ltr-isolate tabular-nums text-primary ${usdClass}`}
        dir="ltr"
      >
        {formatUSD(usd)}
      </span>
      {showBoth && ll != null && (
        <span className={`ltr-isolate tabular-nums text-ink-muted ${llClass}`} dir="ltr">
          {formatLBP(ll)}
        </span>
      )}
    </div>
  )
}
