import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LifeBuoy, Loader2, Send, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { createSupportRequest, mySupportRequests } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { SupportRequest } from '../../types'

const REQUEST_TYPES = [
  '샘플 코드', '프롬프트 가이드', '교육/스터디', '공용 데이터/폴더',
  '도구/환경 권한', '시간 확보', '기타',
]

export default function SupportRequestPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ request_type: '샘플 코드', description: '', anonymous: true })

  const { data: mine, isLoading } = useQuery<SupportRequest[]>({
    queryKey: ['my-support'], queryFn: mySupportRequests,
  })

  const createMut = useMutation({
    mutationFn: () => createSupportRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support'] })
      toast.success('요청을 보냈어요. 파트장이 익명 집계로 확인해요')
      setForm({ request_type: '샘플 코드', description: '', anonymous: true })
    },
    onError: () => toast.error('요청 전송에 실패했어요'),
  })

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-brand-500" /> 지원 요청
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          업무 개선에 필요한 교육·환경·도구를 요청하세요. 파트장은 요청을 <b>익명 집계</b>로 확인하고
          공통적으로 필요한 지원을 제공합니다. 익명으로 보내면 이름이 표시되지 않습니다.
        </p>
      </motion.div>

      <div className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">필요한 지원 유형</label>
            <select className="input-field mt-1.5" value={form.request_type}
              onChange={(e) => set('request_type', e.target.value)}>
              {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer md:mt-7">
            <input type="checkbox" checked={form.anonymous}
              onChange={(e) => set('anonymous', e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
            <span className="text-sm text-slate-700">익명으로 요청</span>
          </label>
        </div>
        <div>
          <label className="label">구체적으로 어떤 지원이 필요한가요?</label>
          <textarea className="input-field mt-1.5 min-h-[88px]" value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="예: 반복 CSV 처리를 위한 Python 샘플 코드와 짧은 가이드가 있으면 좋겠어요" />
        </div>
        <div className="flex justify-end">
          <button onClick={() => createMut.mutate()} disabled={!form.description || createMut.isPending} className="btn-primary">
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> 요청 보내기</>}
          </button>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">내 요청 내역</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
        ) : !mine || mine.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">아직 보낸 요청이 없습니다.</div>
        ) : (
          <div className="space-y-2.5">
            {mine.map((r) => (
              <div key={r.id} className="card !py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{r.request_type}</span>
                    {r.anonymous && <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">익명</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.status === 'open' ? 'text-amber-500' : 'text-green-600'}`}>
                  {r.status === 'open' ? <><Clock className="w-3.5 h-3.5" /> 접수됨</> : <><CheckCircle2 className="w-3.5 h-3.5" /> 처리됨</>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
