import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, Loader2, ArrowRight, CheckCircle2, Users2, User as UserIcon, BarChart3,
} from 'lucide-react'
import { listAssessments } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { AssessmentInstrument } from '../../types'

export default function AssessmentsHubPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery<AssessmentInstrument[]>({
    queryKey: ['assessments'], queryFn: listAssessments,
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-brand-500" /> 진단
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          검증된 방법론으로 나와 팀을 더 잘 이해해보세요. 개인 진단 결과는 <b>본인만</b> 보고,
          팀 진단은 개인 응답 대신 <b>익명 집계</b>만 파트장에게 전달됩니다.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data?.map((a, i) => (
            <motion.div key={a.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  a.scope === 'team' ? 'text-blue-700 bg-blue-50' : 'text-brand-700 bg-brand-50'
                }`}>
                  {a.scope === 'team' ? <><Users2 className="w-3 h-3" /> 팀 · 익명 집계</> : <><UserIcon className="w-3 h-3" /> 개인 · 비공개</>}
                </span>
                {a.completed && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 완료
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{a.name}</h3>
              <p className="text-sm text-slate-500 mb-4 flex-1">{a.subtitle}</p>
              <div className="text-xs text-slate-400 mb-3">{a.item_count}문항 · 약 {Math.max(2, Math.round(a.item_count / 5))}분</div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/assessments/${a.key}`)} className="btn-primary text-sm flex-1">
                  {a.completed ? '다시 하기' : '시작하기'} <ArrowRight className="w-4 h-4" />
                </button>
                {a.completed && a.scope === 'individual' && (
                  <button onClick={() => navigate(`/assessments/${a.key}/result`)} className="btn-secondary text-sm">결과</button>
                )}
                {a.scope === 'team' && user?.is_part_leader && (
                  <button onClick={() => navigate(`/assessments/${a.key}/team`)} className="btn-secondary text-sm" title="파트장 전용 익명 집계">
                    <BarChart3 className="w-4 h-4" /> 팀 결과
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
