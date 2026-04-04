import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [worker, setWorker]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedWorker = localStorage.getItem('gs_worker')
    const token        = localStorage.getItem('gs_token')

    const verify = async () => {
      if (token && token !== 'demo_token') {
        try {
          const res = await api.get('/workers/me')
          setWorker(res.data)
          localStorage.setItem('gs_worker', JSON.stringify(res.data))
        } catch (err) {
          console.warn('[Auth] Session invalid, logging out')
          logout()
        }
      } else if (storedWorker) {
        try { setWorker(JSON.parse(storedWorker)) } catch (_) {}
      }
      setLoading(false)
    }

    verify()
  }, [])

  const login = async (phone) => {
    const res = await api.post('/auth/send-otp', { phone })
    return res.data
  }

  const verifyOtp = async (phone, otp) => {
    const res = await api.post('/auth/verify-otp', { phone, otp })
    const { token, worker: w, isNew } = res.data
    localStorage.setItem('gs_token', token)
    if (!isNew) {
      localStorage.setItem('gs_worker', JSON.stringify(w))
      setWorker(w)
    }
    return { token, worker: w, isNew }
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const { worker: w } = res.data
    localStorage.setItem('gs_worker', JSON.stringify(w))
    setWorker(w)
    return w
  }

  // Used by Register (demo/offline mode) to update React state directly
  // without hitting the backend — prevents ProtectedRoute from bouncing
  const setWorkerDirectly = (w) => {
    localStorage.setItem('gs_token', 'demo_token')
    localStorage.setItem('gs_worker', JSON.stringify(w))
    setWorker(w)
  }

  const logout = () => {
    localStorage.removeItem('gs_token')
    localStorage.removeItem('gs_worker')
    setWorker(null)
  }

  const updateWorker = (updates) => {
    const updated = { ...worker, ...updates }
    localStorage.setItem('gs_worker', JSON.stringify(updated))
    setWorker(updated)
  }

  return (
    <AuthContext.Provider value={{ worker, loading, login, verifyOtp, register, logout, updateWorker, setWorkerDirectly }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
