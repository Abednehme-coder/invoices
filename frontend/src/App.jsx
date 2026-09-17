import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewInvoice from './pages/NewInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import ClientList from './pages/ClientList'
import ClientDetail from './pages/ClientDetail'
import RecordPayment from './pages/RecordPayment'
import Archive from './pages/Archive'
import Settings from './pages/Settings'

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
        <ProtectedRoute><NewInvoice /></ProtectedRoute>
      } />

      <Route path="/invoices/:id" element={
        <ProtectedRoute><InvoiceDetail /></ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute><ClientList /></ProtectedRoute>
      } />

      <Route path="/clients/:id" element={
        <ProtectedRoute><ClientDetail /></ProtectedRoute>
      } />

      <Route path="/clients/:id/pay" element={
        <ProtectedRoute><RecordPayment /></ProtectedRoute>
      } />

      <Route path="/archive" element={
        <ProtectedRoute><Archive /></ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
