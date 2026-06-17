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

export const setPassword = (
  email: string, password: string, confirm_password: string, signup_code?: string,
) =>
  api.post('/auth/set-password', { email, password, confirm_password, signup_code }).then((r) => r.data)

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

// WorkCraft
export const getWorkcraftMeta = () => api.get('/workcraft/meta').then((r) => r.data)

export const listFrictions = () => api.get('/workcraft/frictions').then((r) => r.data)
export const listSharedFrictions = () => api.get('/workcraft/frictions/shared').then((r) => r.data)
export const createFriction = (data: any) => api.post('/workcraft/frictions', data).then((r) => r.data)
export const updateFriction = (id: number, data: any) =>
  api.put(`/workcraft/frictions/${id}`, data).then((r) => r.data)
export const deleteFriction = (id: number) =>
  api.delete(`/workcraft/frictions/${id}`).then((r) => r.data)

export const listMissions = () => api.get('/workcraft/missions').then((r) => r.data)
export const createMission = (data: any) => api.post('/workcraft/missions', data).then((r) => r.data)
export const updateMission = (id: number, data: any) =>
  api.put(`/workcraft/missions/${id}`, data).then((r) => r.data)
export const deleteMission = (id: number) =>
  api.delete(`/workcraft/missions/${id}`).then((r) => r.data)

export const generateMissionPrompt = (missionId: number) =>
  api.post(`/workcraft/missions/${missionId}/prompt/generate`).then((r) => r.data)
export const getMissionPrompt = (missionId: number) =>
  api.get(`/workcraft/missions/${missionId}/prompt`).then((r) => r.data)

export const getRecommendations = () => api.get('/workcraft/recommendations').then((r) => r.data)

// WorkCraft - review & growth
export const getMissionReview = (missionId: number) =>
  api.get(`/workcraft/missions/${missionId}/review`).then((r) => r.data)
export const saveMissionReview = (missionId: number, data: any) =>
  api.post(`/workcraft/missions/${missionId}/review`, data).then((r) => r.data)
export const getGrowth = () => api.get('/workcraft/growth').then((r) => r.data)

// WorkCraft - templates & support
export const listTemplates = () => api.get('/workcraft/templates').then((r) => r.data)
export const shareTemplate = (data: any) => api.post('/workcraft/templates/share', data).then((r) => r.data)
export const createSupportRequest = (data: any) =>
  api.post('/workcraft/support-requests', data).then((r) => r.data)
export const mySupportRequests = () => api.get('/workcraft/support-requests/mine').then((r) => r.data)

// WorkCraft - leader (part_leader only)
export const getLeaderTrends = () => api.get('/leader/anonymous-trends').then((r) => r.data)
export const getLeaderSupportRequests = () => api.get('/leader/support-requests').then((r) => r.data)

// Assessments
export const listAssessments = () => api.get('/assessments').then((r) => r.data)
export const getAssessmentQuestions = (key: string) =>
  api.get(`/assessments/${key}/questions`).then((r) => r.data)
export const submitAssessment = (key: string, responses: Record<string, number>) =>
  api.post(`/assessments/${key}/submit`, { responses }).then((r) => r.data)
export const getAssessmentResult = (key: string) =>
  api.get(`/assessments/${key}/result`).then((r) => r.data)
export const getAssessmentTeam = (key: string) =>
  api.get(`/assessments/${key}/team`).then((r) => r.data)

// Collaboration Reflections
export const getReflectionMeta = () => api.get('/reflections/meta').then((r) => r.data)
export const getReflectionCurrent = () => api.get('/reflections/current').then((r) => r.data)
export const submitReflection = (data: any) => api.post('/reflections/submit', data).then((r) => r.data)
export const getMyReflections = () => api.get('/reflections/mine').then((r) => r.data)
export const getReflectionTrends = () => api.get('/reflections/trends').then((r) => r.data)

// Team Agreements
export const getAgreementMeta = () => api.get('/agreements/meta').then((r) => r.data)
export const listAgreements = () => api.get('/agreements').then((r) => r.data)
export const createAgreement = (data: any) => api.post('/agreements', data).then((r) => r.data)
export const deleteAgreement = (id: number) => api.delete(`/agreements/${id}`).then((r) => r.data)
export const toggleAgreementAgree = (id: number) => api.post(`/agreements/${id}/agree`).then((r) => r.data)

// Weekly Pulse
export const getPulseCurrent = () => api.get('/pulse/current').then((r) => r.data)
export const submitPulse = (responses: Record<string, number>) =>
  api.post('/pulse/submit', { responses }).then((r) => r.data)
export const getPulseTrends = () => api.get('/pulse/trends').then((r) => r.data)

// Admin
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data)
export const getAdminUsers = () => api.get('/admin/users').then((r) => r.data)
export const syncUsersFromYaml = () => api.post('/admin/sync-users').then((r) => r.data)
export const toggleUserActive = (userId: number) =>
  api.patch(`/admin/users/${userId}/toggle-active`).then((r) => r.data)

export default api
