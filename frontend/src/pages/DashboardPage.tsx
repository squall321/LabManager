import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList, FileBarChart, ArrowRight, CheckCircle2, Clock, Sparkles,
  Sprout, Target, Lightbulb, BookOpenCheck,
} from 'lucide-react'
import { getSurveyStatus, getMyReport, getGrowth } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { SurveyStatus, Report, GrowthSummary } from '../types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: status } = useQuery<SurveyStatus>({ queryKey: ['survey-status'], queryFn: getSurveyStatus })
  const { data: report } = useQuery<Report>({ queryKey: ['my-report'], queryFn: getMyReport, retry: false })
  const { data: growth } = useQuery<GrowthSummary>({ queryKey: ['growth'], queryFn: getGrowth, retry: false })

  const isCompleted = status?.status === 'completed'
  const hasStarted = status?.has_survey && !isCompleted
  const totalQ = status?.total_questions ?? 100
  const primary = report?.report_data?.color_info?.primary
  const primaryColor = report?.report_data?.primary_color
  const g = growth?.counts

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">안녕하세요, {user?.name}님 👋</h1>
        <p className="text-slate-500 mt-1">오늘도 한 걸음씩. 나의 진행 상황과 성장을 확인해보세요.</p>
      </motion.div>

      {/* Birkman status banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-white shadow-glow-brand"
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-100 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" /> Birkman Workshop
            </div>
            {isCompleted ? (
              <>
                <h2 className="text-xl font-bold mb-1">진단이 완료되었습니다</h2>
                <p className="text-brand-100 text-sm">나의 리포트를 확인하고 강점을 알아보세요</p>
              </>
            ) : hasStarted ? (
              <>
                <h2 className="text-xl font-bold mb-1">진단을 이어서 진행해보세요</h2>
                <p className="text-brand-100 text-sm">
                  섹션 {status?.current_section} / 3 진행 중 · {status?.responses_count}개 응답 완료
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">버크만 진단을 시작해보세요</h2>
                <p className="text-brand-100 text-sm">약 10분 소요 · {totalQ}개 문항</p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate(isCompleted ? '/report' : '/survey')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-all active:scale-95 shadow-lg"
          >
            {isCompleted ? '리포트 보기' : hasStarted ? '이어서 하기' : '시작하기'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Two-module summary */}
      <div className="grid md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-brand-600" />
            </div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> 진행 전
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">설문 진행 상태</h3>
          <p className="text-sm text-slate-500">
            {isCompleted ? '모든 문항에 응답하셨습니다' : `${status?.responses_count ?? 0} / ${totalQ} 문항 완료`}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">나의 성향 유형</h3>
          {primaryColor ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: BIRKMAN_COLORS[primaryColor]?.hex }} />
              <span className="text-sm font-medium text-slate-700">{primary?.name} · {primary?.keyword}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">진단 완료 후 확인 가능합니다</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">리포트 공개 상태</h3>
          <p className="text-sm text-slate-500">
            {report ? (report.is_public ? '팀에 공개됨' : '비공개 (나만 보기)') : '리포트 없음'}
          </p>
        </motion.div>
      </div>

      {/* WorkCraft growth snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card bg-gradient-to-br from-emerald-50/60 to-white border-emerald-100"
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-0.5">
              <Sprout className="w-4 h-4" /> WorkCraft Studio
            </div>
            <h3 className="font-bold text-slate-900">나의 성장 현황</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/workcraft/board')} className="btn-secondary text-sm">미션 보드</button>
            <button onClick={() => navigate('/workcraft/growth')} className="btn-primary text-sm">
              성장 여정 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!g || (g.frictions === 0 && g.missions === 0) ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-slate-500">
              반복되는 업무를 작은 개선 미션으로 바꿔보세요. 작은 불편함 하나가 성장의 시작이에요.
            </p>
            <button onClick={() => navigate('/workcraft/frictions')} className="btn-secondary text-sm">
              <Lightbulb className="w-4 h-4" /> 첫 불편함 적기
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '정의한 불편함', value: g.frictions, icon: Lightbulb, color: '#f59e0b' },
                { label: '시작한 미션', value: g.missions, icon: Target, color: '#3b82f6' },
                { label: '완성한 개선', value: g.completed, icon: CheckCircle2, color: '#22c55e' },
                { label: '배운 점', value: g.learnings, icon: BookOpenCheck, color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white border border-slate-100 p-3">
                  <s.icon className="w-4 h-4 mb-1.5" style={{ color: s.color }} />
                  <div className="text-xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-[11px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            {growth && growth.skills.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-slate-400">키운 역량</span>
                {growth.skills.slice(0, 6).map((sk) => (
                  <span key={sk} className="text-xs bg-white border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">{sk}</span>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
