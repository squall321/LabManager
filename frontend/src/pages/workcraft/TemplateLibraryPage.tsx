import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library, Loader2, Plus, Sparkles, X, Copy, Check, EyeOff, UserCircle2, FileCode2, Target,
} from 'lucide-react'
import { listTemplates, shareTemplate, listMissions } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { SharedTemplate, GrowthMission } from '../../types'

export default function TemplateLibraryPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    source_type: 'mission', source_id: null as number | null,
    title: '', category: '', description: '', anonymized: true,
  })

  const { data: templates, isLoading } = useQuery<SharedTemplate[]>({
    queryKey: ['templates'], queryFn: listTemplates,
  })
  const { data: missions } = useQuery<GrowthMission[]>({ queryKey: ['missions'], queryFn: listMissions })

  const shareMut = useMutation({
    mutationFn: () => shareTemplate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
      toast.success('템플릿을 공유했어요. 동료에게 도움이 될 거예요 ✨')
      setShowForm(false)
      setForm({ source_type: 'mission', source_id: null, title: '', category: '', description: '', anonymized: true })
    },
    onError: () => toast.error('공유에 실패했어요'),
  })

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const copy = (t: SharedTemplate) => {
    navigator.clipboard.writeText(t.body || t.description)
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 1600)
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
            <Library className="w-6 h-6 text-brand-500" /> 공유 템플릿
          </h1>
          <p className="text-slate-500 mt-1">좋은 미션과 Claude Code 프롬프트를 함께 쓰는 자산으로 모았습니다.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 내 미션 공유
        </button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">템플릿으로 공유</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">공유할 내 미션</label>
                <select className="input-field mt-1.5" value={form.source_id ?? ''}
                  onChange={(e) => set('source_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">미션 선택 (선택 안 하면 설명만 공유)</option>
                  {missions?.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">템플릿 제목 *</label>
                  <input className="input-field mt-1.5" value={form.title}
                    onChange={(e) => set('title', e.target.value)} placeholder="예: CSV 결과 자동 분석 프롬프트" />
                </div>
                <div>
                  <label className="label">분류</label>
                  <input className="input-field mt-1.5" value={form.category}
                    onChange={(e) => set('category', e.target.value)} placeholder="데이터 후처리 / 자동화" />
                </div>
              </div>
              <div>
                <label className="label">설명 / 추천 대상</label>
                <textarea className="input-field mt-1.5 min-h-[64px]" value={form.description}
                  onChange={(e) => set('description', e.target.value)} placeholder="반복적으로 CSV 그래프를 만드는 분께 추천" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.anonymized}
                  onChange={(e) => set('anonymized', e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                <span className="text-sm text-slate-700">익명으로 공유 (작성자 이름 숨김)</span>
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
                <button onClick={() => shareMut.mutate()} disabled={!form.title || shareMut.isPending} className="btn-primary">
                  {shareMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '공유'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !templates || templates.length === 0 ? (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Library className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">아직 공유된 템플릿이 없습니다. 첫 템플릿을 공유해보세요.</p>
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} className="card flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  {t.source_type === 'prompt' ? <FileCode2 className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                  {t.category || (t.source_type === 'prompt' ? '프롬프트' : '미션')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  {t.owner_name === '익명' ? <><EyeOff className="w-3.5 h-3.5" /> 익명</> : <><UserCircle2 className="w-3.5 h-3.5" /> {t.owner_name}</>}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{t.title}</h3>
              {t.description && <p className="text-sm text-slate-500 mb-3">{t.description}</p>}
              {t.body && (
                <pre className="text-[11px] bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-600 max-h-32 overflow-hidden whitespace-pre-wrap mb-3">{t.body}</pre>
              )}
              <button onClick={() => copy(t)} className="btn-secondary text-sm mt-auto">
                {copiedId === t.id ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 내용 복사</>}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
