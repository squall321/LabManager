import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList, FileBarChart, ArrowRight, CheckCircle2,
  Clock, Sparkles, TrendingUp,
} from 'lucide-react'
import { getSurveyStatus, getMyReport } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { SurveyStatus, Report } from '../types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: status } = useQuery<SurveyStatus>({
    queryKey: ['survey-status'],
    queryFn: getSurveyStatus,
  })

  const { data: report } = useQuery<Report>({
    queryKey: ['my-report'],
    queryFn: getMyReport,
    retry: false,
  })

  const isCompleted = status?.status === 'completed'
  const hasStarted = status?.has_survey && !isCompleted
  const primaryColor = report?.report_data?.primary_color

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">
          안녕하세요, {user?.name}님 👋
        </h1>
        <p className="text-slate-500 mt-1">오늘도 좋은 하루 되세요. 진행 상황을 확인해보세요.</p>
      </motion.div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-white shadow-glow-brand"
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-100 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              Birkman Workshop
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
                <p className="text-brand-100 text-sm">약 10분 소요 · 60개 문항</p>
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

      {/* Cards grid */}
      <div className="grid md:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card"
        >
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
            {isCompleted ? '모든 문항에 응답하셨습니다' : `${status?.responses_count ?? 0} / 60 문항 완료`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">나의 성향 유형</h3>
          {primaryColor ? (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: BIRKMAN_COLORS[primaryColor]?.hex }}
              />
              <span className="text-sm font-medium text-slate-700">
                {report?.report_data?.color_info?.primary?.name} · {report?.report_data?.color_info?.primary?.keyword}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">진단 완료 후 확인 가능합니다</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">리포트 공개 상태</h3>
          <p className="text-sm text-slate-500">
            {report ? (report.is_public ? '팀에 공개됨' : '비공개 (나만 보기)') : '리포트 없음'}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
