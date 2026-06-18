import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Loader2, Plus, X, Trash2, Search, ChevronDown, Tag, Lightbulb,
} from 'lucide-react'
import { listDecisions, createDecision, deleteDecision } from '../services/api'
import { toast } from '../store/toastStore'

interface Decision {
  id: number; title: string; context: string; decision: string; rationale: string
  tags: string[]; author_name: string; created_by: number; created_at: string
}

const EMPTY = { title: '', context: '', decision: '', rationale: '', tags: '' }

export default function DecisionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: items, isLoading } = useQuery<Decision[]>({ queryKey: ['decisions'], queryFn: listDecisions })

  const createMut = useMutation({
    mutationFn: () => createDecision(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['decisions'] }); setForm(EMPTY); setShowForm(false); toast.success('결정을 기록했어요') },
    onError: () => toast.error('저장에 실패했어요'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDecision(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['decisions'] }); toast.success('삭제했어요') },
    onError: () => toast.error('삭제 권한이 없거나 실패했어요'),
  })

  const allTags = useMemo(() => {
    const s = new Set<string>()
    ;(items ?? []).forEach((d) => d.tags.forEach((t) => s.add(t)))
    return [...s]
  }, [items])

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return (items ?? []).filter((d) => {
      if (activeTag && !d.tags.includes(activeTag)) return false
      if (!kw) return true
      return [d.title, d.decision, d.rationale, d.context].join(' ').toLowerCase().includes(kw)
    })
  }, [items, q, activeTag])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-brand-500" /> 결정 기록
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            작은 의사결정과 <b>그 근거</b>를 한 줄로 남겨두세요. 나중에 "이거 왜 이렇게 했지?"를 반복하지 않게 돼요.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> 결정 기록</button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">새 결정 기록</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">무엇을 정했나요? (제목) *</label>
                <input className="input-field mt-1.5" value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder="예: 리포트 도구로 라이브러리 A를 채택" />
              </div>
              <div>
                <label className="label">결정 내용 *</label>
                <textarea className="input-field mt-1.5 min-h-[56px]" value={form.decision} onChange={(e) => set('decision', e.target.value)}
                  placeholder="A를 쓰기로 함" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">배경 (어떤 상황이었나)</label>
                  <textarea className="input-field mt-1.5 min-h-[56px]" value={form.context} onChange={(e) => set('context', e.target.value)}
                    placeholder="B와 A를 비교 검토 중이었음" />
                </div>
                <div>
                  <label className="label">근거 (왜)</label>
                  <textarea className="input-field mt-1.5 min-h-[56px]" value={form.rationale} onChange={(e) => set('rationale', e.target.value)}
                    placeholder="문서가 좋고 번들이 작아서" />
                </div>
              </div>
              <div>
                <label className="label">태그 (쉼표로 구분)</label>
                <input className="input-field mt-1.5" value={form.tags} onChange={(e) => set('tags', e.target.value)}
                  placeholder="프론트엔드, 라이브러리" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
                <button onClick={() => createMut.mutate()} disabled={!form.title.trim() || !form.decision.trim() || createMut.isPending} className="btn-primary">
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '기록'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + tag filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="결정·근거 검색"
            className="input-field pl-9 !py-2" />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  activeTag === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}><Tag className="w-3 h-3" /> {t}</button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <GitBranch className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">{q || activeTag ? '조건에 맞는 기록이 없어요.' : '아직 기록된 결정이 없어요. 첫 결정을 남겨보세요.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((d, i) => {
            const open = expanded === d.id
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="card !py-4 group">
                <div className="flex items-start gap-3">
                  <button onClick={() => setExpanded(open ? null : d.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{d.title}</h3>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{d.decision}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
                      <span>{d.author_name}</span>
                      <span>{d.created_at.slice(0, 10)}</span>
                      {d.tags.map((t) => <span key={t} className="text-brand-500">#{t}</span>)}
                    </div>
                  </button>
                  <button onClick={() => { if (confirm('이 결정 기록을 삭제할까요?')) deleteMut.mutate(d.id) }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="삭제">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <AnimatePresence>
                  {open && (d.context || d.rationale) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-0 mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {d.context && (
                        <div className="text-sm"><span className="font-semibold text-slate-500">배경 · </span><span className="text-slate-600">{d.context}</span></div>
                      )}
                      {d.rationale && (
                        <div className="text-sm flex items-start gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span><span className="font-semibold text-slate-500">근거 · </span><span className="text-slate-600">{d.rationale}</span></span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
