import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Loader2, Plus, X, ArrowRight, Trash2, Target, CheckCircle2,
  Search, Trash, RotateCcw, ArchiveRestore, Mic, Copy,
} from 'lucide-react'
import {
  listWBProjects, createWBProject, deleteWBProject, restoreWBProject, duplicateWBProject, getWBMeta,
  type WBListParams,
} from '../../services/api'
import { toast } from '../../store/toastStore'
import { InterviewBridge } from '../../components/wb/InterviewBridge'
import type { WBProject, WBMeta, WBMode } from '../../types'
import { MODE_META } from '../../lib/wbMode'

export default function WBProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [interview, setInterview] = useState(false)
  const [form, setForm] = useState({ name: '', mode: 'discovery' as WBMode, domain: 'drop_impact', one_liner: '', current_problem: '' })

  // 보관함/검색/필터/정렬
  const [trashed, setTrashed] = useState(false)
  const [q, setQ] = useState('')
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('updated')

  const params: WBListParams = { trashed, q, domain, status, sort }
  const { data: meta } = useQuery<WBMeta>({ queryKey: ['wb-meta'], queryFn: getWBMeta })
  const { data: projects, isLoading } = useQuery<WBProject[]>({
    queryKey: ['wb-projects', params],
    queryFn: () => listWBProjects(params),
  })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['wb-projects'] })

  const createMut = useMutation({
    mutationFn: () => createWBProject(form),
    onSuccess: (p) => { inval(); toast.success('프로젝트를 만들었어요'); navigate(`/wb/${p.id}`) },
    onError: () => toast.error('생성에 실패했어요'),
  })
  const trashMut = useMutation({
    mutationFn: (id: number) => deleteWBProject(id),
    onSuccess: () => { inval(); toast.success('보관함으로 옮겼어요 — 필요하면 복구할 수 있어요') },
    onError: () => toast.error('이동에 실패했어요'),
  })
  const restoreMut = useMutation({
    mutationFn: (id: number) => restoreWBProject(id),
    onSuccess: () => { inval(); toast.success('복구했어요') },
    onError: () => toast.error('복구에 실패했어요'),
  })
  const purgeMut = useMutation({
    mutationFn: (id: number) => deleteWBProject(id, true),
    onSuccess: () => { inval(); toast.success('영구 삭제했어요') },
    onError: () => toast.error('삭제에 실패했어요'),
  })
  const dupMut = useMutation({
    mutationFn: (id: number) => duplicateWBProject(id),
    onSuccess: () => { inval(); toast.success('프로젝트를 복제했어요') },
    onError: () => toast.error('복제에 실패했어요'),
  })

  const domainName = (key: string) => meta?.domains.find((d) => d.key === key)?.name || key
  const hasFilter = !!(q || domain || status)

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
        {!trashed && (
          <div className="flex gap-2">
            <button onClick={() => setInterview(true)} className="btn-secondary"><Mic className="w-4 h-4" /> 인터뷰로 시작</button>
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> 새 프로젝트</button>
          </div>
        )}
      </motion.div>

      {interview && (
        <InterviewBridge meta={meta} onClose={() => setInterview(false)}
          onCreated={(p) => { inval(); navigate(`/wb/${p.id}`) }} />
      )}

      <AnimatePresence>
        {showForm && !trashed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">새 프로젝트 (Idea Canvas)</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* 프로젝트 렌즈(mode) 선택 */}
              <div>
                <label className="label">프로젝트 유형</label>
                <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
                  {(['discovery', 'simulation'] as WBMode[]).map((m) => (
                    <button key={m} type="button" onClick={() => setForm((p) => ({ ...p, mode: m }))}
                      className={`text-left rounded-xl border p-3 transition-all ${form.mode === m ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-200' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="font-semibold text-sm text-slate-800">{MODE_META[m].label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{MODE_META[m].desc}</div>
                    </button>
                  ))}
                </div>
              </div>
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

      {/* 검색 · 필터 · 정렬 · 보관함 토글 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input-field !pl-9" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="이름·한 줄 설명 검색" />
        </div>
        <select className="input-field !w-auto" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">모든 업무유형</option>
          {meta?.domains.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
        </select>
        {!trashed && (
          <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">모든 상태</option>
            <option value="draft">초안</option>
            <option value="validated">검증 완료</option>
          </select>
        )}
        <select className="input-field !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updated">최근 수정순</option>
          <option value="created">생성순</option>
          <option value="name">이름순</option>
        </select>
        <button onClick={() => { setTrashed((t) => !t); setStatus('') }}
          className={`btn-ghost text-sm ${trashed ? 'bg-slate-100 text-slate-900' : ''}`}>
          <Trash className="w-4 h-4" /> {trashed ? '진행 중 보기' : '보관함'}
        </button>
      </div>

      {trashed && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-500 flex items-center gap-2">
          <ArchiveRestore className="w-4 h-4 text-slate-400" />
          보관함의 프로젝트는 목록에 안 보여요. 여기서 <b>복구</b>하거나 <b>영구 삭제</b>할 수 있어요.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !projects || projects.length === 0 ? (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              {trashed ? <Trash className="w-8 h-8 text-slate-400" /> : <Compass className="w-8 h-8 text-slate-400" />}
            </div>
            <p className="text-slate-500">
              {trashed ? '보관함이 비어 있어요.'
                : hasFilter ? '조건에 맞는 프로젝트가 없어요.'
                : '아직 프로젝트가 없어요. 검증하고 싶은 아이디어로 시작해보세요.'}
            </p>
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`card group transition-all ${trashed ? 'opacity-80' : 'cursor-pointer hover:shadow-card-hover'}`}
              onClick={() => { if (!trashed) navigate(`/wb/${p.id}`) }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${MODE_META[p.mode]?.badge || MODE_META.discovery.badge}`}>{MODE_META[p.mode]?.short || '발굴'}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">{domainName(p.domain)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.origin_mission_id && <span title="WorkCraft 미션에서 승격" className="text-slate-300"><Target className="w-3.5 h-3.5" /></span>}
                  {!trashed && p.status === 'validated' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {trashed ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); restoreMut.mutate(p.id) }}
                        title="복구" className="text-slate-400 hover:text-green-600"><RotateCcw className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`'${p.name}'을(를) 영구 삭제할까요? 되돌릴 수 없어요.`)) purgeMut.mutate(p.id) }}
                        title="영구 삭제" className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); dupMut.mutate(p.id) }} disabled={dupMut.isPending}
                        title="복제" className="text-slate-300 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); trashMut.mutate(p.id) }}
                        title="보관함으로" className="text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
              {p.one_liner && <p className="text-sm text-slate-500">{p.one_liner}</p>}
              <div className="text-xs text-slate-400 mt-3">
                {trashed && p.deleted_at ? `${p.deleted_at.slice(0, 10)} 보관` : `${p.updated_at.slice(0, 10)} 수정`}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
