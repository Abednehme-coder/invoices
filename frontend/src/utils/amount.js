export function sanitizeAmount(raw) {
  const cleaned = (raw || '').replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned
}

export function formatAmountInput(raw) {
  if (!raw) return ''
  const [integer, decimal] = String(raw).split('.')
  const formatted = parseInt(integer || '0', 10).toLocaleString('en-US')
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted
}
