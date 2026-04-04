import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useOnlineStatus } from './hooks/useOnlineStatus'

// Pages
import Landing       from './pages/Landing'
import Login         from './pages/Login'
import OtpVerify     from './pages/OtpVerify'
import Register      from './pages/Register'
import PlanSelection from './pages/PlanSelection'
import Dashboard     from './pages/Dashboard'
import ClaimHistory  from './pages/ClaimHistory'
import Offline       from './pages/Offline'

function ProtectedRoute({ children }) {
  const { worker, loading } = useAuth()
  if (loading) return <div className="page-wrapper items-center justify-center"><div className="skeleton w-16 h-16 rounded-2xl" /></div>
  return worker ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const isOnline = useOnlineStatus()

  return (
    <>
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You're offline — some features may be unavailable
        </div>
      )}
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/verify"    element={<OtpVerify />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/plans"     element={<ProtectedRoute><PlanSelection /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/claims"    element={<ProtectedRoute><ClaimHistory /></ProtectedRoute>} />
        <Route path="/offline"   element={<Offline />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
