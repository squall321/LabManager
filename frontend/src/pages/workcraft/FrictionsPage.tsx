import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, Plus, Loader2, Trash2, Target, Repeat, Sparkles, X, Pencil,
} from 'lucide-react'
import {
  listFrictions, createFriction, updateFriction, deleteFriction, getWorkcraftMeta,
} from '../../services/api'
import { VisibilitySelector } from '../../components/workcraft/VisibilitySelector'
import { toast } from '../../store/toastStore'
import type { WorkFriction, WorkCraftMeta, Visibility } from '../../types'

const EMPTY = {
  title: '', description: '', friction_type: '기타', frequency: '',
  expected_effect: '', related_skill: '', claude_feasible: true,
  visibility: 'private' as Visibility,
}

export default function FrictionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data: meta } = useQuery<WorkCraftMeta>({ queryKey: ['wc-meta'], queryFn: getWorkcraftMeta })
  const { data: frictions, isLoading } = useQuery<WorkFriction[]>({
    queryKey: ['frictions'], queryFn: listFrictions,
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY) }

  const saveMut = useMutation({
    mutationFn: () => (editingId ? updateFriction(editingId, form) : createFriction(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frictions'] })
      toast.success(editingId ? '불편함 카드를 수정했어요' : '불편함 카드를 저장했어요')
      closeForm()
    },
    onError: () => toast.error('저장에 실패했어요. 다시 시도해주세요'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteFriction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frictions'] })
      toast.success('삭제했어요')
    },
    onError: () => toast.error('삭제에 실패했어요'),
  })

  const startEdit = (f: WorkFriction) => {
    setEditingId(f.id)
    setForm({
      title: f.title, description: f.description, friction_type: f.friction_type,
      frequency: f.frequency, expected_effect: f.expected_effect, related_skill: f.related_skill,
      claude_feasible: f.claude_feasible, visibility: f.visibility,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmDelete = (f: WorkFriction) => {
    if (window.confirm(`'${f.title}' 카드를 삭제할까요?`)) deleteMut.mutate(f.id)
  }

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-brand-500" /> 업무 불편함
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          반복되거나 답답한 업무를 부담 없이 적어보세요. 여기 적은 내용은 <b>본인만</b> 볼 수 있고,
          공유 범위는 언제나 직접 정합니다. 작은 불편함이 곧 성장 미션의 출발점이 됩니다.
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
          ℹ️ 내용과 이름은 누구에게도 공개되지 않습니다. 다만 어떤 <b>유형</b>의 불편함이 많은지에 대한
          익명 집계는(같은 유형을 <b>5명 이상</b>이 적었을 때만, 내용·이름 제외) 파트장이 공통 지원을 마련하는 데 쓰일 수 있어요.
        </p>
      </motion.div>

      {!showForm && (
        <button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> 불편함 카드 추가
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="card overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{editingId ? '불편함 카드 수정' : '새 불편함 카드'}</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">반복적으로 불편한 업무는 무엇인가요? *</label>
                <input className="input-field mt-1.5" value={form.title}
                  onChange={(e) => set('title', e.target.value)} placeholder="예: 시험 결과 CSV 그래프 작성 반복" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">불편함 유형</label>
                  <select className="input-field mt-1.5" value={form.friction_type}
                    onChange={(e) => set('friction_type', e.target.value)}>
                    {meta?.friction_types.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">얼마나 자주 발생하나요?</label>
                  <input className="input-field mt-1.5" value={form.frequency}
                    onChange={(e) => set('frequency', e.target.value)} placeholder="예: 주 3회 이상" />
                </div>
              </div>
              <div>
                <label className="label">왜 불편한가요?</label>
                <textarea className="input-field mt-1.5 min-h-[72px]" value={form.description}
                  onChange={(e) => set('description', e.target.value)} placeholder="매번 CSV를 열고 수동으로 그래프를 만들어야 한다" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">개선되면 어떤 효과가 있나요?</label>
                  <input className="input-field mt-1.5" value={form.expected_effect}
                    onChange={(e) => set('expected_effect', e.target.value)} placeholder="분석/보고 시간 단축" />
                </div>
                <div>
                  <label className="label">배울 수 있는 역량은?</label>
                  <input className="input-field mt-1.5" value={form.related_skill}
                    onChange={(e) => set('related_skill', e.target.value)} placeholder="Python, 데이터 시각화" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.claude_feasible}
                  onChange={(e) => set('claude_feasible', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600" />
                <span className="text-sm text-slate-700">Claude Code로 개선 가능할 것 같다</span>
              </label>
              <div>
                <label className="label">공개 범위</label>
                <div className="mt-1.5">
                  <VisibilitySelector value={form.visibility} onChange={(v) => set('visibility', v)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={closeForm} className="btn-secondary">취소</button>
                <button onClick={() => saveMut.mutate()} disabled={!form.title || saveMut.isPending} className="btn-primary">
                  {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? '수정' : '저장')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !frictions || frictions.length === 0 ? (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Lightbulb className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">아직 기록된 불편함이 없습니다. 첫 카드를 추가해보세요.</p>
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {frictions.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} className="card group">
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  {f.friction_type}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(f)} className="text-slate-300 hover:text-brand-500" title="수정">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmDelete(f)} className="text-slate-300 hover:text-red-500" title="삭제">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
              {f.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{f.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                {f.frequency && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {f.frequency}</span>}
                {f.related_skill && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {f.related_skill}</span>}
              </div>
              <button
                onClick={() => navigate('/workcraft/missions/new', { state: { friction: f } })}
                className="btn-secondary w-full text-sm"
              >
                <Target className="w-4 h-4" /> 이걸 성장 미션으로 만들기
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
