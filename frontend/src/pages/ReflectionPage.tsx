import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MessagesSquare, Loader2, CheckCircle2, Lock, ShieldCheck, Sparkles,
} from 'lucide-react'
import {
  getReflectionCurrent, submitReflection, getMyReflections, getReflectionTrends,
} from '../services/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

interface Current { week: string; friction_types: string[]; answered: boolean; my: { friction_type: string; note: string } | null }
interface TrendItem { category: string; contributors: number | null; progress: number; visible: boolean }
interface Trends { min_n: number; weeks: number; participants: number; items: TrendItem[] }

export default function ReflectionPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [type, setType] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery<Current>({ queryKey: ['reflection-current'], queryFn: getReflectionCurrent })
  const { data: mine } = useQuery<{ week: string; friction_type: string; note: string }[]>({
    queryKey: ['reflection-mine'], queryFn: getMyReflections,
  })
  const { data: trends } = useQuery<Trends>({
    queryKey: ['reflection-trends'], queryFn: getReflectionTrends, enabled: !!user?.is_part_leader, retry: false,
  })

  useEffect(() => { if (data?.my) { setType(data.my.friction_type); setNote(data.my.note) } }, [data])

  const submitMut = useMutation({
    mutationFn: () => submitReflection({ friction_type: type, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-current'] })
      queryClient.invalidateQueries({ queryKey: ['reflection-mine'] })
      queryClient.invalidateQueries({ queryKey: ['reflection-trends'] })
      toast.success('이번 주 회고를 남겼어요')
    },
    onError: () => toast.error('저장에 실패했어요'),
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const maxC = Math.max(...(trends?.items.filter(i => i.visible).map(i => i.contributors ?? 0) ?? [1]), 1)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessagesSquare className="w-6 h-6 text-brand-500" /> 협업 회고
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          이번 주 협업은 어땠나요? <b>메모는 나만 보고</b>, 파트장은 개인 내용 대신
          <b> 어떤 마찰이 반복되는지</b>만 익명으로 봅니다.
        </p>
      </motion.div>

      {/* This week */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">이번 주 ({data.week})</h2>
          {data.answered && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> 기록됨
            </span>
          )}
        </div>
        <label className="label">이번 주 협업에서 가장 두드러진 점은?</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {data.friction_types.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                type === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>{t}</button>
          ))}
        </div>
        <label className="label">메모 (선택 · 나만 봅니다)</label>
        <textarea className="input-field mt-1.5 min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="무엇 때문에 그랬는지 짧게 적어두면, 나중에 패턴이 보여요" />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5"><Lock className="w-3 h-3" /> 메모는 파트장에게 전달되지 않아요</span>
          <button onClick={() => submitMut.mutate()} disabled={!type || submitMut.isPending} className="btn-primary">
            {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : data.answered ? '수정 저장' : '회고 남기기'}
          </button>
        </div>
      </motion.div>

      {/* My recent */}
      {mine && mine.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h2 className="section-title mb-3">내 최근 회고</h2>
          <div className="space-y-2">
            {mine.map((r) => (
              <div key={r.week} className="flex items-start gap-3 text-sm">
                <span className="text-slate-400 w-20 flex-shrink-0">{r.week.split('-W')[1]}주</span>
                <span className="font-medium text-slate-700 flex-shrink-0">{r.friction_type}</span>
                {r.note && <span className="text-slate-500 truncate">— {r.note}</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leader trends */}
      {user?.is_part_leader && trends && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <h2 className="section-title mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" /> 반복되는 협업 마찰 <span className="text-xs font-normal text-slate-400">· 파트장 전용 · 익명 · 최근 {trends.weeks}주</span>
          </h2>
          <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> 메모는 보이지 않으며, 서로 다른 기여자 {trends.min_n}명 이상인 유형만 공개됩니다.
          </p>
          {trends.items.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">아직 집계할 회고가 없어요.</div>
          ) : (
            <div className="space-y-3">
              {trends.items.map((it) => (
                <div key={it.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{it.category}</span>
                    {it.visible ? <span className="text-sm font-semibold text-brand-600">{it.contributors}명</span>
                      : <span className="text-xs text-slate-400">{it.progress}/{trends.min_n} 모이는 중</span>}
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    {it.visible ? (
                      <motion.div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${((it.contributors ?? 0) / maxC) * 100}%` }} transition={{ duration: 0.5 }} />
                    ) : (
                      <div className="h-full bg-slate-300/60 rounded-full" style={{ width: `${(it.progress / trends.min_n) * 100}%` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!user?.is_part_leader && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5" /> 꾸준히 남기면 반복되는 마찰이 보이고, 팀이 함께 풀 거리를 찾을 수 있어요.
        </div>
      )}
    </div>
  )
}
