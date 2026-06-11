import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardCheck, Loader2, ArrowLeft, RefreshCw, Lock } from 'lucide-react'
import { getAssessmentResult } from '../../services/api'
import type { AssessmentResult } from '../../types'

const bandColor = (score: number) => (score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444')

export default function AssessmentResultPage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery<AssessmentResult>({
    queryKey: ['assessment-result', key], queryFn: () => getAssessmentResult(key), retry: false,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <ClipboardCheck className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 mb-5">아직 완료한 진단이 없습니다.</p>
        <button onClick={() => navigate(`/assessments/${key}`)} className="btn-primary">진단 시작하기</button>
      </div>
    )
  }

  const subs = Object.values(data.subscales)

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate('/assessments')} className="btn-ghost -ml-2"><ArrowLeft className="w-4 h-4" /> 진단 목록</button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-brand-100 text-sm font-medium mb-2">
            <Lock className="w-4 h-4" /> {data.instrument_name} · 나만 보는 결과
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-bold">{data.overall}</div>
            <div className="text-brand-100 text-sm mb-1">/ 100 · {data.overall_band.label}</div>
          </div>
          <p className="text-brand-50 text-sm mt-2 max-w-md">{data.overall_band.text}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
        <h2 className="section-title mb-4">영역별 결과</h2>
        <div className="space-y-5">
          {subs.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                <span className="text-sm font-bold" style={{ color: bandColor(s.score) }}>{s.score} · {s.band.label}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: bandColor(s.score) }}
                  initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{s.band.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <button onClick={() => navigate(`/assessments/${key}`)} className="btn-secondary">
        <RefreshCw className="w-4 h-4" /> 다시 진단하기
      </button>
    </div>
  )
}
