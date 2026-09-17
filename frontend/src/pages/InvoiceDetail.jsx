import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, Trash2 } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { formatUSD, formatLBP, formatAmount } from '../components/CurrencyDisplay'
import Spinner from '../components/Spinner'

function formatDateTime(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get(`/invoices/${id}/`).then(r => setInvoice(r.data)).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('حذف هذه الفاتورة نهائياً؟')) return
    setDeleting(true)
    try {
      await api.delete(`/invoices/${id}/`)
      navigate(-1)
    } catch {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل الفاتورة" back />
      <div className="flex-1 flex items-center justify-center"><Spinner size={32} /></div>
    </div>
  )

  if (!invoice) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل الفاتورة" back />
      <div className="flex-1 flex items-center justify-center text-ink-faint">الفاتورة غير موجودة</div>
    </div>
  )

  const remaining = parseFloat(invoice.remaining_usd)
  const total = parseFloat(invoice.amount_usd)
  const paid = total - remaining
  const progressPct = total > 0 ? Math.round((paid / total) * 100) : 0
  const isPartial = invoice.status === 'partial'
  const waLink = invoice.whatsapp
    ? `https://wa.me/${invoice.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader
        title={invoice.reference}
        back
        action={
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-10 h-10 flex items-center justify-center rounded-md text-danger hover:bg-danger-bg transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            aria-label="حذف الفاتورة"
          >
            <Trash2 size={18} />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-4">

        {/* Status + name */}
        <div className="bg-surface rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <StatusBadge status={invoice.status} size="md" />
            <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">
              {formatDateTime(invoice.created_at)}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-ink">{invoice.name}</h2>
          {invoice.description && (
            <p className="text-sm text-ink-muted leading-relaxed">{invoice.description}</p>
          )}
        </div>

        {/* Amount card */}
        <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
          <Row label="المبلغ الأصلي">
            <span className="ltr-isolate tabular-nums font-semibold text-ink" dir="ltr">
              {formatAmount(parseFloat(invoice.amount), invoice.currency)}
            </span>
          </Row>
          <Row label="المبلغ بالدولار">
            <span className="ltr-isolate tabular-nums font-semibold text-ink" dir="ltr">
              {formatUSD(total)}
            </span>
          </Row>
          {isPartial && (
            <>
              <Row label="المدفوع">
                <span className="ltr-isolate tabular-nums font-medium text-success" dir="ltr">
                  {formatUSD(paid)}
                </span>
              </Row>
              <Row label="المتبقي">
                <span className="ltr-isolate tabular-nums font-semibold text-danger" dir="ltr">
                  {formatUSD(remaining)}
                </span>
              </Row>
              <div className="flex flex-col gap-1 mt-1">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">
                  {progressPct}% مدفوع
                </span>
              </div>
            </>
          )}
          {invoice.status === 'paid' && invoice.paid_at && (
            <Row label="تاريخ الدفع">
              <span className="text-sm text-success">{formatDateTime(invoice.paid_at)}</span>
            </Row>
          )}
        </div>

        {/* Contact */}
        {(invoice.whatsapp || invoice.client) && (
          <div className="bg-surface rounded-xl p-4 flex flex-col gap-2">
            {invoice.client_name && (
              <Row label="العميل">
                <button
                  onClick={() => navigate(`/clients/${invoice.client}`)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {invoice.client_name}
                </button>
              </Row>
            )}
            {invoice.whatsapp && (
              <Row label="واتساب">
                <span className="ltr-isolate text-sm text-ink-muted" dir="ltr">{invoice.whatsapp}</span>
              </Row>
            )}
          </div>
        )}

        {/* WhatsApp button */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-md bg-success text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
          >
            <MessageCircle size={18} />
            تواصل عبر واتساب
          </a>
        )}
      </main>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
    </div>
  )
}
