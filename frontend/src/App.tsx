import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout/Layout'
import { Toaster } from './components/Toaster'
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
import TemplateLibraryPage from './pages/workcraft/TemplateLibraryPage'
import SupportRequestPage from './pages/workcraft/SupportRequestPage'
import LeaderDashboardPage from './pages/workcraft/LeaderDashboardPage'
import ReviewPage from './pages/workcraft/ReviewPage'
import MyGrowthPage from './pages/workcraft/MyGrowthPage'

function ProtectedRoute({
  children, adminOnly = false, leaderOnly = false,
}: { children: JSX.Element; adminOnly?: boolean; leaderOnly?: boolean }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />
  if (leaderOnly && !user?.is_part_leader) return <Navigate to="/workcraft/frictions" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
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
          <Route path="/workcraft/missions/:missionId/edit" element={<MissionBuilderPage />} />
          <Route path="/workcraft/board" element={<ActionBoardPage />} />
          <Route path="/workcraft/calendar" element={<CalendarPage />} />
          <Route path="/workcraft/growth" element={<MyGrowthPage />} />
          <Route path="/workcraft/templates" element={<TemplateLibraryPage />} />
          <Route path="/workcraft/support" element={<SupportRequestPage />} />
          <Route path="/workcraft/missions/:missionId/prompt" element={<PromptStudioPage />} />
          <Route path="/workcraft/missions/:missionId/review" element={<ReviewPage />} />
          <Route
            path="/workcraft/leader"
            element={
              <ProtectedRoute leaderOnly>
                <LeaderDashboardPage />
              </ProtectedRoute>
            }
          />

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
