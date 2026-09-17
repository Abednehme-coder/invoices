import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/invoices/new" element={
        <ProtectedRoute><Placeholder title="فاتورة جديدة" /></ProtectedRoute>
      } />

      <Route path="/invoices/:id" element={
        <ProtectedRoute><Placeholder title="تفاصيل الفاتورة" /></ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute><Placeholder title="العملاء" /></ProtectedRoute>
      } />

      <Route path="/clients/:id" element={
        <ProtectedRoute><Placeholder title="تفاصيل العميل" /></ProtectedRoute>
      } />

      <Route path="/clients/:id/pay" element={
        <ProtectedRoute><Placeholder title="تسجيل دفعة" /></ProtectedRoute>
      } />

      <Route path="/archive" element={
        <ProtectedRoute><Placeholder title="الأرشيف" /></ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute><Placeholder title="الإعدادات" /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
