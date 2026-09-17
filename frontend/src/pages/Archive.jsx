import { useState, useEffect, useCallback } from 'react'
import { Search, Archive as ArchiveIcon } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import InvoiceRow from '../components/InvoiceRow'
import Spinner from '../components/Spinner'
import BottomNav from '../components/BottomNav'

export default function Archive() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchArchive = useCallback((q) => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    api.get(`/archive/${params}`)
      .then(r => setInvoices(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchArchive(debouncedSearch)
  }, [debouncedSearch, fetchArchive])

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="الأرشيف" />

      <main className="flex-1 overflow-y-auto pb-24">

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الفاتورة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-surface pr-9 pl-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
            <ArchiveIcon size={40} className="text-ink-faint" />
            <p className="text-ink-muted text-sm">
              {search ? 'لا توجد نتائج' : 'الأرشيف فارغ — الفواتير المدفوعة تظهر هنا بعد ٤٨ ساعة'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-4">
            <p className="text-xs text-ink-faint px-1">{invoices.length} فاتورة مؤرشفة</p>
            {invoices.map(inv => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
