import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout/Layout'
import { Toaster } from './components/Toaster'

// 라우트별 코드 스플리팅 — 첫 로드 번들을 줄이고 무거운 차트는 해당 페이지에서만 로드
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SurveyPage = lazy(() => import('./pages/SurveyPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const TeamCollabMapPage = lazy(() => import('./pages/TeamCollabMapPage'))
const PulsePage = lazy(() => import('./pages/PulsePage'))
const AgreementsPage = lazy(() => import('./pages/AgreementsPage'))
const ReflectionPage = lazy(() => import('./pages/ReflectionPage'))
const KudosPage = lazy(() => import('./pages/KudosPage'))
const DecisionsPage = lazy(() => import('./pages/DecisionsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const FrictionsPage = lazy(() => import('./pages/workcraft/FrictionsPage'))
const TeamFrictionsPage = lazy(() => import('./pages/workcraft/TeamFrictionsPage'))
const MissionBuilderPage = lazy(() => import('./pages/workcraft/MissionBuilderPage'))
const ActionBoardPage = lazy(() => import('./pages/workcraft/ActionBoardPage'))
const CalendarPage = lazy(() => import('./pages/workcraft/CalendarPage'))
const PromptStudioPage = lazy(() => import('./pages/workcraft/PromptStudioPage'))
const TemplateLibraryPage = lazy(() => import('./pages/workcraft/TemplateLibraryPage'))
const SupportRequestPage = lazy(() => import('./pages/workcraft/SupportRequestPage'))
const LeaderDashboardPage = lazy(() => import('./pages/workcraft/LeaderDashboardPage'))
const ReviewPage = lazy(() => import('./pages/workcraft/ReviewPage'))
const MyGrowthPage = lazy(() => import('./pages/workcraft/MyGrowthPage'))
const AssessmentsHubPage = lazy(() => import('./pages/assessments/AssessmentsHubPage'))
const AssessmentTakePage = lazy(() => import('./pages/assessments/AssessmentTakePage'))
const AssessmentResultPage = lazy(() => import('./pages/assessments/AssessmentResultPage'))
const AssessmentTeamPage = lazy(() => import('./pages/assessments/AssessmentTeamPage'))

function ProtectedRoute({
  children, adminOnly = false, leaderOnly = false,
}: { children: JSX.Element; adminOnly?: boolean; leaderOnly?: boolean }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />
  if (leaderOnly && !user?.is_part_leader) return <Navigate to="/workcraft/frictions" replace />
  return children
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<PageFallback />}>
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
            <Route path="/team-map" element={<TeamCollabMapPage />} />
            <Route path="/pulse" element={<PulsePage />} />
            <Route path="/agreements" element={<AgreementsPage />} />
            <Route path="/reflections" element={<ReflectionPage />} />
            <Route path="/kudos" element={<KudosPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />

            {/* Assessments */}
            <Route path="/assessments" element={<AssessmentsHubPage />} />
            <Route path="/assessments/:key" element={<AssessmentTakePage />} />
            <Route path="/assessments/:key/result" element={<AssessmentResultPage />} />
            <Route
              path="/assessments/:key/team"
              element={
                <ProtectedRoute leaderOnly>
                  <AssessmentTeamPage />
                </ProtectedRoute>
              }
            />

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
      </Suspense>
    </BrowserRouter>
  )
}
