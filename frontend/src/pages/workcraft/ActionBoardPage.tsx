import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  KanbanSquare, Loader2, Plus, Sparkles, FileCode2, ChevronRight, Lock,
  GripVertical, CalendarClock, Pencil, BookOpenCheck,
} from 'lucide-react'
import { listMissions, updateMission } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { GrowthMission, MissionStatus } from '../../types'
import { cn } from '../../lib/utils'

const COLUMNS: { key: MissionStatus; label: string; color: string }[] = [
  { key: 'idea',         label: 'Idea',         color: '#94a3b8' },
  { key: 'prompt_ready', label: 'Prompt Ready', color: '#6366f1' },
  { key: 'in_progress',  label: 'In Progress',  color: '#3b82f6' },
  { key: 'review',       label: 'Review',       color: '#f59e0b' },
  { key: 'done',         label: 'Done',         color: '#22c55e' },
  { key: 'shared',       label: 'Shared',       color: '#8b5cf6' },
]

const NEXT: Record<MissionStatus, MissionStatus | null> = {
  idea: 'prompt_ready', prompt_ready: 'in_progress', in_progress: 'review',
  review: 'done', done: 'shared', shared: null,
}

export default function ActionBoardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dragId, setDragId] = useState<number | null>(null)
  const [overCol, setOverCol] = useState<MissionStatus | null>(null)

  const { data: missions, isLoading } = useQuery<GrowthMission[]>({
    queryKey: ['missions'], queryFn: listMissions,
  })

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: MissionStatus }) => updateMission(id, { status }),
    // 낙관적 업데이트로 드래그 후 즉시 반영
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['missions'] })
      const prev = queryClient.getQueryData<GrowthMission[]>(['missions'])
      queryClient.setQueryData<GrowthMission[]>(['missions'], (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, status } : m))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['missions'], ctx.prev); toast.error('이동에 실패했어요') },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
    },
    onSuccess: (_d, vars) => {
      if (vars.status === 'done') toast.success('미션을 완성했어요! 배운 점을 남겨보면 성장 여정에 쌓여요 🌱')
      else if (vars.status === 'shared') toast.success('동료와 공유했어요. 멋진 나눔이에요 ✨')
    },
  })

  const onDrop = (status: MissionStatus) => {
    if (dragId != null) {
      const m = missions?.find((x) => x.id === dragId)
      if (m && m.status !== status) moveMut.mutate({ id: dragId, status })
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
            <Sparkles className="w-4 h-4" /> WorkCraft Studio
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-brand-500" /> 내 미션 보드
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> 본인만 볼 수 있어요 · 카드를 끌어다 단계를 옮기세요.
          </p>
        </div>
        <button onClick={() => navigate('/workcraft/missions/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> 새 미션
        </button>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !missions || missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <KanbanSquare className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 mb-4">아직 미션이 없습니다.</p>
          <button onClick={() => navigate('/workcraft/missions/new')} className="btn-secondary">첫 미션 만들기</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {COLUMNS.map((col) => {
            const items = missions.filter((m) => m.status === col.key)
            const isOver = overCol === col.key
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.key) }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => onDrop(col.key)}
                className={cn(
                  'rounded-2xl p-2.5 min-h-[140px] transition-colors',
                  isOver ? 'bg-brand-100/70 ring-2 ring-brand-300' : 'bg-slate-100/60'
                )}
              >
                <div className="flex items-center gap-1.5 px-1.5 py-1 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((m) => {
                    const next = NEXT[m.status]
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        draggable
                        onDragStart={() => setDragId(m.id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null) }}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: dragId === m.id ? 0.4 : 1, scale: 1 }}
                        className="bg-white rounded-xl p-2.5 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                          <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-3 flex-1">{m.title}</h4>
                        </div>
                        {m.due_date && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 pl-4">
                            <CalendarClock className="w-3 h-3" /> {m.due_date}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          {(m.status === 'done' || m.status === 'shared') ? (
                            <button onClick={() => navigate(`/workcraft/missions/${m.id}/review`)}
                              className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg py-1.5 transition-colors">
                              <BookOpenCheck className="w-3 h-3" /> 배운 점
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/workcraft/missions/${m.id}/prompt`)}
                              className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg py-1.5 transition-colors">
                              <FileCode2 className="w-3 h-3" /> 명세서
                            </button>
                          )}
                          <button onClick={() => navigate(`/workcraft/missions/${m.id}/edit`)}
                            title="수정"
                            className="inline-flex items-center justify-center text-slate-400 hover:text-brand-600 bg-slate-50 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {next && (
                            <button onClick={() => moveMut.mutate({ id: m.id, status: next })}
                              title={`다음 단계로`}
                              className="inline-flex items-center justify-center text-slate-400 hover:text-brand-600 bg-slate-50 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
