import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import {
  Activity, Loader2, CheckCircle2, Sparkles, Lock, TrendingUp, ShieldCheck,
} from 'lucide-react'
import { getPulseCurrent, submitPulse, getPulseTrends } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import type { PulseCurrent, PulseTrends } from '../types'

const LINE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']

export default function PulsePage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const { data, isLoading } = useQuery<PulseCurrent>({ queryKey: ['pulse-current'], queryFn: getPulseCurrent })
  const { data: trends } = useQuery<PulseTrends>({
    queryKey: ['pulse-trends'], queryFn: getPulseTrends, enabled: !!user?.is_part_leader, retry: false,
  })

  useEffect(() => { if (data?.my_responses) setAnswers(data.my_responses) }, [data])

  const submitMut = useMutation({
    mutationFn: () => submitPulse(answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse-current'] })
      queryClient.invalidateQueries({ queryKey: ['pulse-trends'] })
      toast.success('이번 주 펄스를 기록했어요. 30초면 충분해요 🌤️')
    },
    onError: () => toast.error('기록에 실패했어요'),
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const allAnswered = data.questions.every((q) => answers[q.key])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-500" /> 주간 펄스
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          매주 30초, 가볍게 팀 분위기를 체크해요. 답변은 <b>나만 보고</b>, 파트장은 개인이 아니라
          <b> 주차별 익명 추세</b>만 봅니다. 꾸준함이 변화를 일찍 알아채게 해줘요.
        </p>
      </motion.div>

      {/* This week's pulse */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">이번 주 ({data.week})</h2>
          {data.answered && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> 기록됨
            </span>
          )}
        </div>

        <div className="space-y-5">
          {data.questions.map((q) => (
            <div key={q.key}>
              <p className="text-slate-800 font-medium mb-2.5">{q.text}</p>
              <div className="flex gap-2">
                {data.scale_labels.map((label, i) => {
                  const value = i + 1
                  const selected = answers[q.key] === value
                  return (
                    <button key={value} onClick={() => setAnswers((p) => ({ ...p, [q.key]: value }))}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all ${
                        selected ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-brand-500 bg-brand-500' : 'border-slate-300'}`}>
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className={`text-[11px] ${selected ? 'text-brand-700 font-medium' : 'text-slate-500'}`}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={() => submitMut.mutate()} disabled={!allAnswered || submitMut.isPending} className="btn-primary">
            {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : data.answered ? '수정 저장' : '이번 주 기록'}
          </button>
        </div>
      </motion.div>

      {/* Leader trend */}
      {user?.is_part_leader && trends && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h2 className="section-title mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" /> 주차별 추세 <span className="text-xs font-normal text-slate-400">· 파트장 전용 · 익명</span>
          </h2>
          <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> 참여 {trends.min_n}명 이상인 주차만 표시됩니다 (개인 식별 불가).
          </p>
          {trends.series.every((s) => !s.visible) ? (
            <div className="text-center py-10 text-sm text-slate-400">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              아직 표시할 추세가 없어요. 참여가 {trends.min_n}명 이상 모이면 주차별 변화가 그려집니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends.series} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(w: string) => w.split('-W')[1] + '주'} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {trends.questions.map((q, i) => (
                  <Line key={q.key} type="monotone" dataKey={q.key} name={q.short}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} connectNulls
                    dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      )}

      {!user?.is_part_leader && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5" /> 꾸준히 기록하면 팀의 분위기 변화를 더 일찍 알아챌 수 있어요.
        </div>
      )}
    </div>
  )
}
