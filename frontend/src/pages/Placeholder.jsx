import BottomNav from '../components/BottomNav'
import PageHeader from '../components/PageHeader'

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title={title} back />
      <main className="flex-1 flex items-center justify-center text-ink-faint text-sm pb-20">
        قيد الإنشاء…
      </main>
      <BottomNav />
    </div>
  )
}
