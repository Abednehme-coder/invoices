import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'

export default function Settings() {
  const { logout } = useAuth()
  const [rate, setRate] = useState('')
  const [rateLoading, setRateLoading] = useState(true)
  const [rateSaving, setRateSaving] = useState(false)
  const [rateSaved, setRateSaved] = useState(false)

  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [passError, setPassError] = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passSaved, setPassSaved] = useState(false)

  useEffect(() => {
    api.get('/settings/').then(r => {
      setRate(r.data.ll_per_usd)
    }).finally(() => setRateLoading(false))
  }, [])

  async function saveRate(e) {
    e.preventDefault()
    if (!rate || parseFloat(rate) <= 0) return
    setRateSaving(true)
    setRateSaved(false)
    try {
      await api.patch('/settings/', { ll_per_usd: parseFloat(rate) })
      setRateSaved(true)
      setTimeout(() => setRateSaved(false), 2500)
    } finally {
      setRateSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPassError('')
    if (newPass !== newPass2) {
      setPassError('كلمتا المرور غير متطابقتين')
      return
    }
    if (newPass.length < 8) {
      setPassError('كلمة المرور يجب أن تكون ٨ أحرف على الأقل')
      return
    }
    setPassSaving(true)
    setPassSaved(false)
    try {
      await api.post('/auth/change-password/', { old_password: oldPass, new_password: newPass })
      setOldPass('')
      setNewPass('')
      setNewPass2('')
      setPassSaved(true)
      setTimeout(() => setPassSaved(false), 2500)
    } catch (err) {
      setPassError(err.response?.data?.detail || 'خطأ في تغيير كلمة المرور')
    } finally {
      setPassSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="الإعدادات" />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-6">

        {/* Exchange rate */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">سعر الصرف</h2>
          <form onSubmit={saveRate} className="bg-surface rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-ink">ليرة لبنانية لكل دولار</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="مثال: 90000"
                  min="1"
                  className="flex-1 h-11 rounded-md border border-border bg-bg px-3 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary ltr-isolate"
                  dir="ltr"
                  disabled={rateLoading}
                />
                <span className="text-sm text-ink-muted shrink-0">ل.ل. / $</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={rateSaving || rateLoading || !rate}
              className="h-11 rounded-md bg-primary text-primary-text font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors hover:bg-primary-hover"
            >
              {rateSaved ? <><Check size={16} /> تم الحفظ</> : rateSaving ? 'جارٍ الحفظ…' : 'حفظ سعر الصرف'}
            </button>
          </form>
        </section>

        {/* Change password */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">تغيير كلمة المرور</h2>
          <form onSubmit={changePassword} className="bg-surface rounded-xl p-4 flex flex-col gap-3">
            <input
              type="password"
              placeholder="كلمة المرور الحالية"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
            <input
              type="password"
              placeholder="كلمة المرور الجديدة (٨ أحرف+)"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              value={newPass2}
              onChange={e => setNewPass2(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            {passError && (
              <p className="text-sm text-danger">{passError}</p>
            )}
            <button
              type="submit"
              disabled={passSaving || !oldPass || !newPass || !newPass2}
              className="h-11 rounded-md bg-surface-raised border border-border text-ink font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-surface transition-colors"
            >
              {passSaved ? <><Check size={16} /> تم التغيير</> : passSaving ? 'جارٍ الحفظ…' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </section>

        {/* Logout */}
        <section>
          <button
            onClick={logout}
            className="w-full h-12 rounded-xl bg-danger-bg text-danger font-semibold flex items-center justify-center transition-colors hover:opacity-80 active:scale-[0.98]"
          >
            تسجيل الخروج
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

const inputClass = 'h-11 rounded-md border border-border bg-bg px-3 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary'
