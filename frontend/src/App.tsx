import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SurveyPage from './pages/SurveyPage'
import ReportPage from './pages/ReportPage'
import TeamPage from './pages/TeamPage'
import AdminPage from './pages/AdminPage'
import FrictionsPage from './pages/workcraft/FrictionsPage'
import TeamFrictionsPage from './pages/workcraft/TeamFrictionsPage'
import MissionBuilderPage from './pages/workcraft/MissionBuilderPage'
import ActionBoardPage from './pages/workcraft/ActionBoardPage'
import CalendarPage from './pages/workcraft/CalendarPage'
import PromptStudioPage from './pages/workcraft/PromptStudioPage'

function ProtectedRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report/:userId" element={<ReportPage />} />
          <Route path="/team" element={<TeamPage />} />

          {/* WorkCraft Studio */}
          <Route path="/workcraft" element={<FrictionsPage />} />
          <Route path="/workcraft/frictions" element={<FrictionsPage />} />
          <Route path="/workcraft/team-frictions" element={<TeamFrictionsPage />} />
          <Route path="/workcraft/missions/new" element={<MissionBuilderPage />} />
          <Route path="/workcraft/board" element={<ActionBoardPage />} />
          <Route path="/workcraft/calendar" element={<CalendarPage />} />
          <Route path="/workcraft/missions/:missionId/prompt" element={<PromptStudioPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
