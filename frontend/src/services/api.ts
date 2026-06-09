import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const checkEmail = (email: string) =>
  api.post('/auth/check-email', { email }).then((r) => r.data)

export const setPassword = (email: string, password: string, confirm_password: string) =>
  api.post('/auth/set-password', { email, password, confirm_password }).then((r) => r.data)

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)

// Survey
export const getSurveyStatus = () => api.get('/survey/status').then((r) => r.data)
export const startSurvey = () => api.post('/survey/start').then((r) => r.data)
export const getSurveyQuestions = (section: number) =>
  api.get(`/survey/questions/${section}`).then((r) => r.data)
export const submitSection = (
  surveyId: number,
  section: number,
  responses: { question_id: number; response: number }[]
) => api.post(`/survey/submit/${surveyId}`, { section, responses }).then((r) => r.data)

// Reports
export const getMyReport = () => api.get('/reports/me').then((r) => r.data)
export const updateMyVisibility = (is_public: boolean) =>
  api.patch('/reports/me/visibility', { is_public }).then((r) => r.data)
export const getPublicReports = () => api.get('/reports/public').then((r) => r.data)
export const getAllReports = () => api.get('/reports/all').then((r) => r.data)
export const updateReportVisibility = (id: number, is_public: boolean) =>
  api.patch(`/reports/${id}/visibility`, { is_public }).then((r) => r.data)

// Admin
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data)
export const getAdminUsers = () => api.get('/admin/users').then((r) => r.data)
export const syncUsersFromYaml = () => api.post('/admin/sync-users').then((r) => r.data)
export const toggleUserActive = (userId: number) =>
  api.patch(`/admin/users/${userId}/toggle-active`).then((r) => r.data)

export default api
