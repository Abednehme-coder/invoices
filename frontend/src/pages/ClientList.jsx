import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import { formatUSD, formatPhone, sanitizePhone } from '../components/CurrencyDisplay'
import Spinner from '../components/Spinner'
import BottomNav from '../components/BottomNav'

export default function ClientList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWa, setNewWa] = useState('')
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    api.get('/clients/').then(r => setClients(r.data)).finally(() => setLoading(false))
  }, [])

  async function addClient(e) {
    e.preventDefault()
    if (!newName) return
    setSaving(true)
    setAddError('')
    try {
      const res = await api.post('/clients/', { name: newName, whatsapp: sanitizePhone(newWa) })
      setClients(c => [res.data, ...c])
      setNewName('')
      setNewWa('')
      setShowAdd(false)
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'حدث خطأ'
      setAddError(msg)
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp.includes(search)
  )

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader
        title="العملاء"
        action={
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors duration-fast"
            aria-label="إضافة عميل"
          >
            <UserPlus size={20} />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto pb-24">

        {/* Add form */}
        {showAdd && (
          <form onSubmit={addClient} className="border-b border-border bg-surface px-4 py-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink">عميل جديد</h2>
            <input
              type="text"
              placeholder="الاسم *"
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError('') }}
              className={`${inputClass} ${addError ? 'border-danger ring-1 ring-danger' : ''}`}
              autoFocus
              required
            />
            {addError && (
              <p className="text-xs text-danger -mt-1">{addError}</p>
            )}
            <input
              type="tel"
              inputMode="numeric"
              placeholder="XX XXX XXX"
              value={formatPhone(newWa)}
              onChange={e => setNewWa(sanitizePhone(e.target.value))}
              className={`${inputClass} ltr-isolate`}
              dir="ltr"
              maxLength={10}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !newName}
                className="flex-1 h-10 rounded-md bg-primary text-primary-text text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 h-10 rounded-md border border-border text-sm text-ink-muted"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="بحث عن عميل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-surface pr-9 pl-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
            <Users size={40} className="text-ink-faint" />
            <p className="text-ink-muted text-sm">
              {search ? 'لا توجد نتائج' : 'لا يوجد عملاء بعد'}
            </p>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                className="text-sm text-primary font-medium underline-offset-2 hover:underline"
              >
                أضف أول عميل
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="w-full text-start flex items-center justify-between px-4 py-3.5 hover:bg-surface transition-colors duration-fast"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-ink truncate">{c.name}</span>
                    {c.whatsapp && (
                      <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{formatPhone(c.whatsapp)}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ms-3">
                    {parseFloat(c.total_owed_usd) > 0 ? (
                      <>
                        <span className="ltr-isolate tabular-nums text-sm font-semibold text-danger" dir="ltr">
                          {formatUSD(parseFloat(c.total_owed_usd))}
                        </span>
                        <span className="text-xs text-ink-faint">
                          {c.invoice_count} فاتورة
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-success font-medium">مسدد</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

const inputClass = 'h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary w-full'
