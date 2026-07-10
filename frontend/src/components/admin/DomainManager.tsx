import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Plus, Trash2, Boxes, Check, X, Pencil } from 'lucide-react'
import {
  listAdminDomains, createAdminDomain, updateAdminDomain, deleteAdminDomain,
} from '../../services/api'
import { toast } from '../../store/toastStore'

interface Domain { id: number; key: string; name: string; description: string; active: boolean; order: number }

export function DomainManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const { data: domains, isLoading } = useQuery<Domain[]>({ queryKey: ['admin-domains'], queryFn: listAdminDomains })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['admin-domains'] })

  const createMut = useMutation({
    mutationFn: () => createAdminDomain(form),
    onSuccess: () => { inval(); setForm({ name: '', description: '' }); toast.success('업무 유형을 추가했어요') },
    onError: () => toast.error('추가에 실패했어요'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateAdminDomain(id, data),
    onSuccess: () => { inval(); setEditing(null); toast.success('수정했어요') },
    onError: () => toast.error('수정 실패'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAdminDomain(id),
    onSuccess: () => { inval(); toast.success('삭제했어요') },
    onError: () => toast.error('삭제 실패'),
  })

  const startEdit = (d: Domain) => { setEditing(d.id); setEditForm({ name: d.name, description: d.description }) }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card !p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2"><Boxes className="w-5 h-5 text-brand-500" /> 업무 유형 관리</h2>
        <span className="text-sm text-slate-400">Working Backwards 도메인 · {domains?.length ?? 0}개</span>
      </div>

      {/* 추가 */}
      <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex gap-2 flex-wrap items-center">
        <input className="input-field !py-2 flex-1 min-w-[160px]" value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="새 유형 이름 (예: 진동/모달)" />
        <input className="input-field !py-2 flex-1 min-w-[160px]" value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="설명 (선택)" />
        <button onClick={() => createMut.mutate()} disabled={!form.name.trim() || createMut.isPending} className="btn-primary text-sm">
          {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 추가</>}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
      ) : (
        <div className="divide-y divide-slate-50">
          {domains?.map((d) => (
            <div key={d.id} className="px-6 py-3 flex items-center gap-3 group">
              {editing === d.id ? (
                <>
                  <input className="input-field !py-1.5 w-40 text-sm" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                  <input className="input-field !py-1.5 flex-1 text-sm" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                  <button onClick={() => updateMut.mutate({ id: d.id, data: editForm })} className="text-green-500 hover:text-green-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => updateMut.mutate({ id: d.id, data: { active: !d.active } })}
                    title={d.active ? '비활성화' : '활성화'}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${d.active ? 'bg-brand-500' : 'bg-slate-200'}`}>
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform" style={{ transform: d.active ? 'translateX(18px)' : 'translateX(3px)' }} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${d.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{d.name}</div>
                    {d.description && <div className="text-xs text-slate-400 truncate">{d.description}</div>}
                  </div>
                  <span className="text-[11px] text-slate-300 font-mono">{d.key}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(d)} className="text-slate-300 hover:text-brand-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`'${d.name}' 유형을 삭제할까요? (기존 프로젝트의 값은 유지됩니다)`)) deleteMut.mutate(d.id) }}
                      className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
