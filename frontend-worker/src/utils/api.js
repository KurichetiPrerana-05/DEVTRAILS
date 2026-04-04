import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gs_token')
      localStorage.removeItem('gs_worker')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Worker API
export const workerAPI = {
  getProfile:   ()     => api.get('/workers/me'),
  getStatus:    ()     => api.get('/workers/me/coverage-status'),
  updatePlan:   (plan) => api.put('/workers/me/plan', { plan }),
  getClaims:    ()     => api.get('/workers/me/claims'),
  getClaimById: (id)   => api.get(`/workers/me/claims/${id}`),
  createClaim:  (data) => api.post('/claims/create', data), // Hits P2's main claim route
}

// Weather / Risk API
export const riskAPI = {
  getZoneRisk:     (lat, lng) => api.get(`/risk/zone?lat=${lat}&lng=${lng}`),
  getDisruptionCal: (month)   => api.get(`/risk/disruption-calendar?month=${month}`),
  getCurrentConditions: ()    => api.get('/risk/current'),
}

// Notification API
export const notifAPI = {
  getPrefs:       ()      => api.get('/notifications/prefs'),
  updatePrefs:    (prefs) => api.put('/notifications/prefs', prefs),
  sendTestWA:     ()      => api.post('/notifications/whatsapp/test'),
}
