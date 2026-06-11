import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardCheck, Loader2, ArrowLeft, ArrowRight, Users2, User as UserIcon, Lock } from 'lucide-react'
import { getAssessmentQuestions, submitAssessment } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { AssessmentDetail } from '../../types'

export default function AssessmentTakePage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [highlight, setHighlight] = useState(false)

  const { data: inst, isLoading } = useQuery<AssessmentDetail>({
    queryKey: ['assessment-q', key], queryFn: () => getAssessmentQuestions(key),
  })

  const submitMut = useMutation({
    mutationFn: () => submitAssessment(key, Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v]))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessment-result', key] })
      toast.success('진단을 완료했어요')
      navigate(`/assessments/${key}/result`)
    },
    onError: () => toast.error('제출에 실패했어요'),
  })

  if (isLoading || !inst) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const allAnswered = inst.items.every((q) => answers[q.id])
  const remaining = inst.items.filter((q) => !answers[q.id]).length

  const scrollToFirst = () => {
    const first = inst.items.find((q) => !answers[q.id])
    if (first) {
      setHighlight(true)
      document.getElementById(`a-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setHighlight(false), 2400)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/assessments')} className="btn-ghost -ml-2 mb-2">
        <ArrowLeft className="w-4 h-4" /> 진단 목록
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <ClipboardCheck className="w-4 h-4" /> 진단
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{inst.name}</h1>
        <p className="text-slate-500 text-sm">{inst.subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
          {inst.scope === 'team'
            ? <><Users2 className="w-3.5 h-3.5" /> 팀 진단 · 개인 응답은 비공개, 익명 집계만 공유돼요</>
            : <><UserIcon className="w-3.5 h-3.5" /> 개인 진단 · <Lock className="w-3 h-3" /> 결과는 나만 봅니다</>}
        </div>
      </div>

      <div className="space-y-4">
        {inst.items.map((q, idx) => (
          <motion.div key={q.id} id={`a-${q.id}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
            className={`card transition-shadow ${highlight && !answers[q.id] ? 'ring-2 ring-amber-300 shadow-md' : ''}`}>
            <div className="flex gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-50 text-brand-600 text-sm font-semibold flex items-center justify-center">{idx + 1}</span>
              <p className="text-slate-800 font-medium pt-0.5">{q.text}</p>
            </div>
            <div className="flex gap-2 pl-10">
              {inst.scale_labels.map((label, i) => {
                const value = i + 1
                const selected = answers[q.id] === value
                return (
                  <button key={value} onClick={() => setAnswers((p) => ({ ...p, [q.id]: value }))}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all ${
                      selected ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-brand-500 bg-brand-500' : 'border-slate-300'}`}>
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className={`text-[11px] leading-tight text-center ${selected ? 'text-brand-700 font-medium' : 'text-slate-500'}`}>{label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="flex items-center justify-end gap-3">
          {!allAnswered && (
            <button onClick={scrollToFirst} className="text-sm font-medium text-amber-600 hover:text-amber-700">
              {remaining}개 남았어요 →
            </button>
          )}
          <button onClick={allAnswered ? () => submitMut.mutate() : scrollToFirst}
            disabled={submitMut.isPending} className="btn-primary min-w-[140px]">
            {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" />
              : allAnswered ? <>제출하고 결과 보기 <ArrowRight className="w-4 h-4" /></>
              : <>남은 문항으로 <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
