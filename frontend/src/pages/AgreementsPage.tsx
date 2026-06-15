import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText, Loader2, Plus, X, Trash2, ThumbsUp, Users,
} from 'lucide-react'
import {
  getAgreementMeta, listAgreements, createAgreement, deleteAgreement, toggleAgreementAgree,
} from '../services/api'
import { toast } from '../store/toastStore'

interface Agreement {
  id: number; category: string; text: string; author_name: string
  is_mine: boolean; agree_count: number; i_agree: boolean
}

export default function AgreementsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: '회의', text: '' })

  const { data: meta } = useQuery<{ categories: string[] }>({ queryKey: ['agreement-meta'], queryFn: getAgreementMeta })
  const { data: items, isLoading } = useQuery<Agreement[]>({ queryKey: ['agreements'], queryFn: listAgreements })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agreements'] })

  const createMut = useMutation({
    mutationFn: () => createAgreement(form),
    onSuccess: () => { invalidate(); setForm({ category: '회의', text: '' }); setShowForm(false); toast.success('합의 항목을 추가했어요') },
    onError: () => toast.error('추가에 실패했어요'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAgreement(id),
    onSuccess: () => { invalidate(); toast.success('삭제했어요') },
    onError: () => toast.error('삭제 권한이 없거나 실패했어요'),
  })
  const agreeMut = useMutation({
    mutationFn: (id: number) => toggleAgreementAgree(id),
    onSuccess: invalidate,
  })

  const categories = meta?.categories ?? []
  const grouped = categories
    .map((c) => ({ category: c, list: (items ?? []).filter((i) => i.category === c) }))
    .filter((g) => g.list.length > 0)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-brand-500" /> 팀 협업 합의서
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            서로의 스타일을 알았다면, 이제 <b>"그래서 우리는 이렇게 일하자"</b>를 함께 정해요.
            누구나 제안하고, 공감하면 <b>동의</b>를 눌러주세요.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> 합의 제안</button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">새 합의 제안</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">분류</label>
                <select className="input-field mt-1.5" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">우리 팀은 이렇게 하자 *</label>
                <textarea className="input-field mt-1.5 min-h-[72px]" value={form.text}
                  onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                  placeholder="예: 오후 2~4시는 집중 시간으로, 급하지 않은 메시지는 그 외 시간에 보낸다" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
                <button onClick={() => createMut.mutate()} disabled={!form.text.trim() || createMut.isPending} className="btn-primary">
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '제안'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !items || items.length === 0 ? (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ScrollText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">아직 합의 항목이 없어요. 첫 규칙을 제안해보세요.</p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.category}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{g.category}</div>
              <div className="space-y-2.5">
                {g.list.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="card !py-4 flex items-start gap-3 group">
                    <button onClick={() => agreeMut.mutate(a.id)}
                      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
                        a.i_agree ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      }`} title="동의">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-bold">{a.agree_count}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 leading-relaxed">{a.text}</p>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {a.author_name} 제안 · {a.agree_count}명 동의
                      </div>
                    </div>
                    <button onClick={() => deleteMut.mutate(a.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="삭제">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
