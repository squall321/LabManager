import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Loader2, Eye, EyeOff, FileBarChart, MessageSquare,
  Heart, AlertTriangle, Users2, Sprout, Lightbulb, ArrowLeft,
  UserPlus, HeartHandshake,
} from 'lucide-react'
import { getMyReport, updateMyVisibility } from '../services/api'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { LifestyleGrid } from '../components/birkman/LifestyleGrid'
import { ComponentChart } from '../components/birkman/ComponentChart'
import { InterestChart } from '../components/birkman/InterestChart'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { Report } from '../types'

const getReportByUser = (userId: number): Promise<Report> =>
  api.get(`/reports/${userId}`).then((r) => r.data)

export default function ReportPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const isOwnReport = !userId
  const targetUserId = userId ? parseInt(userId) : currentUser?.id

  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: ['report', targetUserId],
    queryFn: () => (isOwnReport ? getMyReport() : getReportByUser(parseInt(userId!))),
    retry: false,
  })

  const visibilityMutation = useMutation({
    mutationFn: (isPublic: boolean) => updateMyVisibility(isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', targetUserId] })
      queryClient.invalidateQueries({ queryKey: ['my-report'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileBarChart className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">리포트를 찾을 수 없습니다</h2>
        <p className="text-slate-500 mb-6">
          {isOwnReport ? '먼저 협업 스타일 진단을 완료해주세요' : '비공개 리포트이거나 존재하지 않습니다'}
        </p>
        <button onClick={() => navigate(isOwnReport ? '/survey' : '/team')} className="btn-primary">
          {isOwnReport ? '설문 시작하기' : '팀 리포트로 돌아가기'}
        </button>
      </div>
    )
  }

  const data = report.report_data
  const primary = data.color_info.primary
  const secondary = data.color_info.secondary
  const narrative = data.narrative

  const narrativeSections = [
    { icon: MessageSquare, title: '겉으로 드러나는 스타일', text: narrative.usual_behavior, color: '#6366f1' },
    { icon: Heart, title: '편하게 일하기 위한 조건', text: narrative.needs, color: '#ec4899' },
    { icon: AlertTriangle, title: '삐걱일 때 나타나는 모습', text: narrative.stress_behavior, color: '#f59e0b' },
    { icon: Users2, title: '팀에서의 역할', text: narrative.team_role, color: '#22c55e' },
    { icon: MessageSquare, title: '효과적인 소통법', text: narrative.communication, color: '#3b82f6' },
    { icon: Sprout, title: '성장 포인트', text: narrative.growth, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-6">
      {!isOwnReport && (
        <button onClick={() => navigate('/team')} className="btn-ghost -ml-2">
          <ArrowLeft className="w-4 h-4" /> 팀 리포트
        </button>
      )}

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-7 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${primary.hex} 0%, ${primary.hex}dd 50%, ${secondary.hex || primary.hex}99 100%)`,
        }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/15 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-medium opacity-90 mb-1">{report.user_name}님의 협업 스타일 리포트</div>
            <h1 className="text-3xl font-bold mb-1.5">{primary.name} · {primary.keyword}</h1>
            {primary.tagline && <p className="text-sm opacity-90 mb-2.5">{primary.tagline}</p>}
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                주 스타일 {primary.name}
              </span>
              {secondary.name && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  보조 스타일 {secondary.name}
                </span>
              )}
            </div>
          </div>

          {isOwnReport && (
            <button
              onClick={() => visibilityMutation.mutate(!report.is_public)}
              disabled={visibilityMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur hover:bg-white/30 transition-all text-sm font-semibold active:scale-95"
            >
              {visibilityMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : report.is_public ? (
                <><Eye className="w-4 h-4" /> 공개됨</>
              ) : (
                <><EyeOff className="w-4 h-4" /> 비공개</>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Summary narrative */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card"
      >
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-brand-500" /> 요약
        </h2>
        <div className="prose prose-sm prose-slate max-w-none whitespace-pre-line text-slate-600 leading-relaxed">
          {narrative.summary.replace(/\*\*/g, '')}
        </div>
      </motion.div>

      {/* 함께 일하기 가이드 (협업 배려 포인트) — 옛 리포트엔 없을 수 있어 가드 */}
      {(narrative.work_with_me || narrative.i_adapt) && (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="card border-brand-100 bg-gradient-to-br from-brand-50/50 to-white"
      >
        <h2 className="section-title mb-1 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-brand-500" /> 함께 일하기 가이드
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {isOwnReport ? '동료와 대화할 때 서로 배려하면 좋은 점들이에요.' : `${report.user_name}님과 협업할 때 참고하세요.`}
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {isOwnReport ? '동료가 나와 일할 때' : '이렇게 다가가면 좋아요'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{narrative.work_with_me}</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users2 className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {isOwnReport ? '내가 동료를 대할 때 의식할 점' : `${report.user_name}님이 신경 쓰는 점`}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{narrative.i_adapt}</p>
          </div>
        </div>
      </motion.div>
      )}

      {/* Grid + Components */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="section-title mb-1">협업 스타일 맵</h2>
          <p className="text-sm text-slate-500 mb-8">드러나는 스타일과 편한 조건의 위치를 나타냅니다</p>
          <div className="px-6 pb-2">
            <LifestyleGrid
              usualX={data.life_style_x}
              usualY={data.life_style_y}
              needX={data.life_style_need_x}
              needY={data.life_style_need_y}
              primaryColor={data.primary_color}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card"
        >
          <h2 className="section-title mb-1">스타일 요소</h2>
          <p className="text-sm text-slate-500 mb-2">드러나는 스타일과 편한 조건을 비교합니다</p>
          <ComponentChart components={data.components} componentNames={data.component_names} />
        </motion.div>
      </div>

      {/* Interests */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="section-title mb-1">관심 영역</h2>
        <p className="text-sm text-slate-500 mb-4">어떤 활동에 흥미를 느끼는지 보여줍니다</p>
        <InterestChart interests={data.interests} />
        <div className="flex flex-wrap gap-2 mt-4">
          {data.top_interests.map((interest, i) => (
            <span
              key={interest.category}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {i === 0 && '🏆'} {interest.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Narrative sections */}
      <div className="grid md:grid-cols-2 gap-5">
        {narrativeSections.map((sec, i) => (
          <motion.div
            key={sec.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            className="card"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${sec.color}15` }}
              >
                <sec.icon className="w-[18px] h-[18px]" style={{ color: sec.color }} />
              </div>
              <h3 className="font-semibold text-slate-900">{sec.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{sec.text}</p>
          </motion.div>
        ))}
      </div>

      {/* 면책 고지 */}
      <p className="text-xs text-slate-400 text-center pt-2 leading-relaxed max-w-2xl mx-auto">
        본 워크샵은 특정 상용 진단도구의 공식 프로그램이 아니며, 팀 내 협업 방식과 업무 선호를
        탐색하기 위한 자체 활동입니다. 개인 평가나 인사 판단에 사용하지 않습니다.
      </p>
    </div>
  )
}
