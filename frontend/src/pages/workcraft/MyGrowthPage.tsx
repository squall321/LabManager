import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  Sprout, Loader2, Lock, Lightbulb, Target, CheckCircle2, Share2,
  BookOpenCheck, Award, Sparkles, TrendingUp, Circle,
} from 'lucide-react'
import { getGrowth } from '../../services/api'
import type { GrowthSummary, TimelineEvent } from '../../types'
import { cn } from '../../lib/utils'

const TL_ICON: Record<TimelineEvent['type'], { icon: typeof Lightbulb; color: string }> = {
  friction: { icon: Lightbulb, color: '#f59e0b' },
  mission: { icon: Target, color: '#3b82f6' },
  completed: { icon: CheckCircle2, color: '#22c55e' },
  learning: { icon: BookOpenCheck, color: '#8b5cf6' },
}

function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function MyGrowthPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<GrowthSummary>({ queryKey: ['growth'], queryFn: getGrowth })

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const c = data.counts
  const achievedCount = data.milestones.filter((m) => m.achieved).length
  const stats = [
    { label: '정의한 불편함', value: c.frictions, icon: Lightbulb, color: '#f59e0b' },
    { label: '시작한 미션', value: c.missions, icon: Target, color: '#3b82f6' },
    { label: '완성한 개선', value: c.completed, icon: CheckCircle2, color: '#22c55e' },
    { label: '배운 점 기록', value: c.learnings, icon: BookOpenCheck, color: '#8b5cf6' },
    { label: '나눈 횟수', value: c.shared, icon: Share2, color: '#ec4899' },
  ]

  // 누적 성장 곡선
  let cum = 0
  const chartData = data.monthly_completed.map((m) => ({ month: m.month.slice(5) + '월', total: (cum += m.count) }))

  const isEmpty = c.frictions === 0 && c.missions === 0

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-brand-600 to-brand-800 p-7 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium mb-2">
            <Sprout className="w-4 h-4" /> 나의 성장 여정 · 나만 보는 공간
          </div>
          {isEmpty ? (
            <>
              <h1 className="text-2xl font-bold mb-1">여기서 성장이 자라납니다</h1>
              <p className="text-emerald-50 text-sm">작은 불편함 하나를 기록하는 것부터가 시작이에요. 한 걸음씩 쌓아가요.</p>
              <button onClick={() => navigate('/workcraft/frictions')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-all active:scale-95">
                <Lightbulb className="w-4 h-4" /> 첫 걸음 시작하기
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">
                지금까지 {c.completed > 0 ? `${c.completed}개의 개선을 해냈어요` : `${c.missions}개의 미션을 시작했어요`} 🌱
              </h1>
              <p className="text-emerald-50 text-sm">
                {data.skills.length > 0
                  ? `${data.skills.length}가지 역량을 키웠고, 성장 배지 ${achievedCount}개를 모았어요.`
                  : `꾸준히 나아가고 있어요. 배운 점을 남기면 역량으로 쌓여요.`}
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Momentum stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
        {/* Left: skills + chart */}
        <div className="lg:col-span-3 space-y-6">
          {/* Skills grown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h2 className="section-title mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> 내가 키운 역량</h2>
            <p className="text-sm text-slate-400 mb-4">완성한 미션과 배운 점 기록에서 모인 역량이에요.</p>
            {data.skills.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                미션을 완성하고 배운 점을 남기면 역량이 하나씩 모여요.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.skills.map((s, i) => (
                  <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-brand-50 to-emerald-50 text-brand-700 border border-brand-100">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" /> {s}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Growth curve */}
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <h2 className="section-title mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500" /> 성장 곡선</h2>
              <p className="text-sm text-slate-400 mb-4">완성한 개선이 쌓여온 흐름이에요.</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                    formatter={(v: number) => [`${v}개 누적`, '완성']} />
                  <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5} fill="url(#growthFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Milestones */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h2 className="section-title mb-1 flex items-center gap-2"><Award className="w-4 h-4 text-brand-500" /> 성장 배지</h2>
            <p className="text-sm text-slate-400 mb-4">{achievedCount} / {data.milestones.length} 달성 · 경쟁이 아니라 나의 발자취예요.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {data.milestones.map((m) => (
                <div key={m.key} className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  m.achieved ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-100 bg-slate-50/40'
                )}>
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                    m.achieved ? 'bg-emerald-100' : 'bg-slate-100')}>
                    {m.achieved ? <Award className="w-[18px] h-[18px] text-emerald-600" /> : <Circle className="w-[18px] h-[18px] text-slate-300" />}
                  </div>
                  <div>
                    <div className={cn('text-sm font-semibold', m.achieved ? 'text-slate-800' : 'text-slate-400')}>{m.title}</div>
                    <div className="text-[11px] text-slate-400">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 card">
          <h2 className="section-title mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> 나의 발자취</h2>
          <p className="text-sm text-slate-400 mb-4">최근 활동이 시간순으로 쌓여요.</p>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">아직 기록이 없어요. 첫 활동을 시작해보세요.</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-100" />
              <div className="space-y-4">
                {data.timeline.map((e, i) => {
                  const cfg = TL_ICON[e.type]
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }} className="relative">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-white border-2 flex items-center justify-center"
                        style={{ borderColor: cfg.color }}>
                        <cfg.icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="text-sm text-slate-700 leading-snug">{e.title}</div>
                      <div className="text-[11px] text-slate-400">{fmtDate(e.date)}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
