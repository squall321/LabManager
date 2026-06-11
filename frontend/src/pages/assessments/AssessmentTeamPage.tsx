import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users2, Loader2, ArrowLeft, ShieldCheck, Lock } from 'lucide-react'
import { getAssessmentTeam } from '../../services/api'
import type { TeamAggregate } from '../../types'

const bandColor = (score: number) => (score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444')

export default function AssessmentTeamPage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<TeamAggregate>({
    queryKey: ['assessment-team', key], queryFn: () => getAssessmentTeam(key),
  })

  if (isLoading || !data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate('/assessments')} className="btn-ghost -ml-2"><ArrowLeft className="w-4 h-4" /> 진단 목록</button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" /> 파트장 전용 · 익명 집계
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users2 className="w-6 h-6 text-brand-500" /> {data.instrument_name}
        </h1>
        <p className="text-slate-500 mt-1 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> 개인 응답·이름은 보이지 않습니다. 팀 전체의 익명 평균만 표시됩니다.
        </p>
      </motion.div>

      {!data.visible ? (
        <div className="card text-center py-12">
          <Users2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-1">아직 집계를 공개할 수 없어요</p>
          <p className="text-sm text-slate-400 mb-4">
            개인이 역추적되지 않도록 <b>{data.min_n}명 이상</b>이 참여했을 때만 결과를 공개합니다.
          </p>
          <div className="inline-flex items-center gap-2">
            <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(data.n / data.min_n) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-slate-500">{data.n} / {data.min_n}</span>
          </div>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="card flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-0.5">팀 전체 평균 ({data.n}명 참여)</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold" style={{ color: bandColor(data.overall!) }}>{data.overall}</span>
                <span className="text-slate-400 text-sm mb-1">/ 100 · {data.overall_band?.label}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
            <h2 className="section-title mb-4">영역별 (익명 평균)</h2>
            <div className="space-y-4">
              {Object.values(data.subscales ?? {}).map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    <span className="text-sm font-bold" style={{ color: bandColor(s.score) }}>{s.score}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: bandColor(s.score) }}
                      initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {data.item_means && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <h2 className="section-title mb-1">문항별 익명 평균</h2>
              <p className="text-sm text-slate-400 mb-4">역채점은 반영된 값입니다 (5점 만점, 높을수록 긍정).</p>
              <div className="space-y-3">
                {data.item_means.map((it) => (
                  <div key={it.id} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 flex-1">{it.text}</span>
                    <span className="text-sm font-semibold text-slate-800 w-10 text-right">{it.mean.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="text-center text-xs text-slate-400">
            이 화면의 목적은 개인 점검이 아니라, 팀이 더 안전하게 일할 수 있도록 지원할 지점을 찾는 것입니다.
          </div>
        </>
      )}
    </div>
  )
}
