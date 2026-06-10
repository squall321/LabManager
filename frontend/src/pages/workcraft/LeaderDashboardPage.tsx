import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart3, Loader2, Users, Target, CheckCircle2, FileCode2, Library,
  Lightbulb, ShieldCheck, Lock, LifeBuoy, EyeOff, UserCircle2,
} from 'lucide-react'
import { getLeaderTrends, getLeaderSupportRequests } from '../../services/api'
import type { LeaderDashboard, LeaderSupportItem } from '../../types'

export default function LeaderDashboardPage() {
  const { data, isLoading } = useQuery<LeaderDashboard>({
    queryKey: ['leader-trends'], queryFn: getLeaderTrends,
  })
  const { data: support } = useQuery<LeaderSupportItem[]>({
    queryKey: ['leader-support'], queryFn: getLeaderSupportRequests,
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const t = data.totals
  const statCards = [
    { label: '참여 인원', value: t.participants, icon: Users, color: '#6366f1' },
    { label: '정의된 불편함', value: t.total_frictions, icon: Lightbulb, color: '#f59e0b' },
    { label: '생성된 미션', value: t.total_missions, icon: Target, color: '#3b82f6' },
    { label: '완료된 개선', value: t.completed_missions, icon: CheckCircle2, color: '#22c55e' },
    { label: '실행 명세서', value: t.generated_prompts, icon: FileCode2, color: '#8b5cf6' },
    { label: '공유 템플릿', value: t.shared_templates, icon: Library, color: '#ec4899' },
  ]

  const maxContrib = Math.max(...data.friction_trends.filter(f => f.visible).map(f => f.contributors ?? 0), 1)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" /> 파트장 전용
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" /> 익명 대시보드
        </h1>
        <p className="text-slate-500 mt-1 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          개인별 내용·이름은 보이지 않습니다. 공통 패턴과 필요한 지원만 익명으로 집계됩니다.
        </p>
      </motion.div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }} className="card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="w-[18px] h-[18px]" style={{ color: s.color }} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Friction trends */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 card">
          <h2 className="section-title mb-1">공통 업무 불편함</h2>
          <p className="text-sm text-slate-400 mb-5">
            서로 다른 기여자가 {data.anonymity_min_n}명 이상일 때만 공개됩니다. (개인 역추적 방지)
          </p>
          {data.friction_trends.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400">아직 집계할 데이터가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {data.friction_trends.map((f) => (
                <div key={f.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{f.category}</span>
                    {f.visible ? (
                      <span className="text-sm font-semibold text-brand-600">{f.contributors}명</span>
                    ) : (
                      <span className="text-xs text-slate-400">{f.progress}/{f.min_n} 모이는 중</span>
                    )}
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    {f.visible ? (
                      <motion.div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${((f.contributors ?? 0) / maxContrib) * 100}%` }}
                        transition={{ duration: 0.5 }} />
                    ) : (
                      <div className="h-full bg-slate-300/60 rounded-full" style={{ width: `${(f.progress / f.min_n) * 100}%` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Support requests + trends */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 card">
          <h2 className="section-title mb-1 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-brand-500" /> 지원 요청</h2>
          <p className="text-sm text-slate-400 mb-4">구성원이 요청한 교육·환경·도구</p>

          {data.support_trends.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {data.support_trends.map((s) => (
                <span key={s.type} className="inline-flex items-center gap-1 text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                  {s.type} <span className="text-brand-400">×{s.count}</span>
                </span>
              ))}
            </div>
          )}

          {!support || support.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">아직 요청이 없습니다.</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {support.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">{s.request_type}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      {s.requester === '익명' ? <><EyeOff className="w-3 h-3" /> 익명</> : <><UserCircle2 className="w-3 h-3" /> {s.requester}</>}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="text-center text-xs text-slate-400 pt-2">
        이 화면의 목적은 "누가 많이 했는가"가 아니라 "어떤 문제가 반복되고 어떤 지원이 필요한가"입니다.
      </div>
    </div>
  )
}
