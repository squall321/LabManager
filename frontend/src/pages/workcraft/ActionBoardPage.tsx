import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  KanbanSquare, Loader2, Plus, Sparkles, FileCode2, ChevronRight, Lock,
} from 'lucide-react'
import { listMissions, updateMission } from '../../services/api'
import type { GrowthMission, MissionStatus } from '../../types'

const COLUMNS: { key: MissionStatus; label: string; hint: string; color: string }[] = [
  { key: 'idea',         label: 'Idea',        hint: '아이디어',        color: '#94a3b8' },
  { key: 'prompt_ready', label: 'Prompt Ready', hint: '명세서 준비',     color: '#6366f1' },
  { key: 'in_progress',  label: 'In Progress',  hint: 'Claude 작업 중',  color: '#3b82f6' },
  { key: 'review',       label: 'Review',       hint: '검토',            color: '#f59e0b' },
  { key: 'done',         label: 'Done',         hint: '완성',            color: '#22c55e' },
  { key: 'shared',       label: 'Shared',       hint: '공유 완료',       color: '#8b5cf6' },
]

const NEXT: Record<MissionStatus, MissionStatus | null> = {
  idea: 'prompt_ready', prompt_ready: 'in_progress', in_progress: 'review',
  review: 'done', done: 'shared', shared: null,
}

export default function ActionBoardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: missions, isLoading } = useQuery<GrowthMission[]>({
    queryKey: ['missions'], queryFn: listMissions,
  })

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: MissionStatus }) => updateMission(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  })

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
            <Lock className="w-3.5 h-3.5" /> 이 보드는 본인만 볼 수 있습니다.
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
            return (
              <div key={col.key} className="bg-slate-100/60 rounded-2xl p-2.5 min-h-[120px]">
                <div className="flex items-center gap-1.5 px-1.5 py-1 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((m) => {
                    const next = NEXT[m.status]
                    return (
                      <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-2 line-clamp-3">{m.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/workcraft/missions/${m.id}/prompt`)}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg py-1.5 transition-colors">
                            <FileCode2 className="w-3 h-3" /> 명세서
                          </button>
                          {next && (
                            <button onClick={() => moveMut.mutate({ id: m.id, status: next })}
                              disabled={moveMut.isPending}
                              title={`→ ${next}`}
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
