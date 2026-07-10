import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Loader2, Plus, X, ArrowRight, Trash2, Target, CheckCircle2,
} from 'lucide-react'
import { listWBProjects, createWBProject, deleteWBProject, getWBMeta } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { WBProject, WBMeta } from '../../types'

export default function WBProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', domain: 'drop_impact', one_liner: '', current_problem: '' })

  const { data: meta } = useQuery<WBMeta>({ queryKey: ['wb-meta'], queryFn: getWBMeta })
  const { data: projects, isLoading } = useQuery<WBProject[]>({ queryKey: ['wb-projects'], queryFn: listWBProjects })

  const createMut = useMutation({
    mutationFn: () => createWBProject(form),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['wb-projects'] })
      toast.success('프로젝트를 만들었어요')
      navigate(`/wb/${p.id}`)
    },
    onError: () => toast.error('생성에 실패했어요'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteWBProject(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wb-projects'] }); toast.success('삭제했어요') },
    onError: () => toast.error('삭제에 실패했어요'),
  })

  const domainName = (key: string) => meta?.domains.find((d) => d.key === key)?.name || key

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-500" /> Working Backwards
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            아이디어를 <b>여러 이해관계자 관점에서 검증</b>합니다. 페르소나·PR/FAQ·기능·검증 점수로
            "이 일이 정말 필요한가"를 구조적으로 확인해요.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> 새 프로젝트</button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">새 프로젝트 (Idea Canvas)</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">아이디어 이름 *</label>
                  <input className="input-field mt-1.5" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="예: Drop 해석 자동화 플랫폼" />
                </div>
                <div>
                  <label className="label">업무 유형</label>
                  <select className="input-field mt-1.5" value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}>
                    {meta?.domains.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">한 줄 설명</label>
                <input className="input-field mt-1.5" value={form.one_liner} onChange={(e) => setForm((p) => ({ ...p, one_liner: e.target.value }))}
                  placeholder="무엇을 만들고 싶은가" />
              </div>
              <div>
                <label className="label">현재 문제</label>
                <textarea className="input-field mt-1.5 min-h-[64px]" value={form.current_problem} onChange={(e) => setForm((p) => ({ ...p, current_problem: e.target.value }))}
                  placeholder="지금 무엇이 불편/비효율적인가" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
                <button onClick={() => createMut.mutate()} disabled={!form.name.trim() || createMut.isPending} className="btn-primary">
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>만들고 시작 <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !projects || projects.length === 0 ? (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3"><Compass className="w-8 h-8 text-slate-400" /></div>
            <p className="text-slate-500">아직 프로젝트가 없어요. 검증하고 싶은 아이디어로 시작해보세요.</p>
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card group cursor-pointer hover:shadow-card-hover transition-all" onClick={() => navigate(`/wb/${p.id}`)}>
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">{domainName(p.domain)}</span>
                <div className="flex items-center gap-2">
                  {p.origin_mission_id && <span title="WorkCraft 미션에서 승격" className="text-slate-300"><Target className="w-3.5 h-3.5" /></span>}
                  {p.status === 'validated' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('삭제할까요?')) deleteMut.mutate(p.id) }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
              {p.one_liner && <p className="text-sm text-slate-500">{p.one_liner}</p>}
              <div className="text-xs text-slate-400 mt-3">{p.updated_at.slice(0, 10)} 수정</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
