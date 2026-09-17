import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { formatUSD, formatLBP } from '../components/CurrencyDisplay'

function previewDistribution(invoices, amountUSD) {
  let remaining = amountUSD
  const result = []

  for (const inv of invoices) {
    if (remaining <= 0) break
    const invRemaining = parseFloat(inv.remaining_usd)
    const cover = Math.min(remaining, invRemaining)
    const willBePaid = cover >= invRemaining - 0.001
    result.push({
      id: inv.id,
      reference: inv.reference,
      name: inv.name,
      invRemaining,
      cover,
      willBePaid,
    })
    remaining -= cover
  }

  return { rows: result, leftover: remaining }
}

export default function RecordPayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [note, setNote] = useState('')
  const [rate, setRate] = useState(90000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}/summary/`),
      api.get('/settings/'),
    ]).then(([sumRes, settingsRes]) => {
      setSummary(sumRes.data)
      setRate(parseFloat(settingsRes.data.ll_per_usd))
    }).finally(() => setLoading(false))
  }, [id])

  const unpaid = summary
    ? summary.invoices
        .filter(i => ['unpaid', 'partial'].includes(i.status))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : []

  const amountUSD = amount
    ? (currency === 'USD'
        ? parseFloat(amount)
        : parseFloat(amount) / rate)
    : 0

  const { rows: preview, leftover } = unpaid.length && amountUSD > 0
    ? previewDistribution(unpaid, amountUSD)
    : { rows: [], leftover: 0 }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/payments/', {
        client: parseInt(id),
        amount: parseFloat(amount),
        currency,
        note,
      })
      navigate(`/clients/${id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تسجيل دفعة" back />
      <div className="flex-1 flex items-center justify-center"><Spinner size={32} /></div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تسجيل دفعة" back />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-5">
        {summary && (
          <div className="bg-primary-subtle rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-medium text-ink">{summary.name}</span>
            <span className="ltr-isolate tabular-nums text-sm text-danger font-semibold" dir="ltr">
              {formatUSD(parseFloat(summary.total_owed_usd))} متبقي
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Amount + currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              المبلغ <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="flex-1 h-12 rounded-md border border-border bg-surface px-4 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary ltr-isolate"
                dir="ltr"
                required
                autoFocus
              />
              <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                {['USD', 'LBP'].map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`px-4 h-12 text-sm font-medium transition-colors ${
                      currency === cur
                        ? 'bg-primary text-primary-text'
                        : 'bg-surface text-ink-muted hover:bg-surface-raised'
                    }`}
                  >
                    {cur === 'USD' ? '$' : 'ل.ل.'}
                  </button>
                ))}
              </div>
            </div>
            {amount && currency === 'LBP' && (
              <p className="text-xs text-ink-faint ltr-isolate" dir="ltr">
                ≈ {formatUSD(amountUSD)}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">ملاحظة</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="اختياري..."
              className="h-12 rounded-md border border-border bg-surface px-4 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-muted">توزيع الدفعة</h3>
              <div className="bg-surface rounded-xl overflow-hidden divide-y divide-border">
                {preview.map(row => (
                  <div key={row.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{row.reference}</span>
                      <span className="text-sm text-ink truncate">{row.name}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`text-sm font-semibold ltr-isolate tabular-nums ${row.willBePaid ? 'text-success' : 'text-warning'}`} dir="ltr">
                        {formatUSD(row.cover)}
                      </span>
                      {row.willBePaid ? (
                        <span className="text-xs text-success">مسدد بالكامل</span>
                      ) : (
                        <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">
                          يتبقى {formatUSD(row.invRemaining - row.cover)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {leftover > 0.001 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-primary-subtle">
                    <span className="text-sm text-ink-muted">رصيد زائد</span>
                    <span className="text-sm font-semibold ltr-isolate tabular-nums text-primary" dir="ltr">
                      {formatUSD(leftover)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger bg-danger-bg rounded-md px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {submitting ? 'جارٍ الحفظ…' : (
              <><Check size={18} /> تأكيد الدفعة</>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
