import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  X, Copy, Check, Loader2, Wand2, ClipboardPaste, ArrowRight, ExternalLink,
} from 'lucide-react'
import { getWBPrompt, applyWBStep } from '../../services/api'
import { toast } from '../../store/toastStore'

const LLM_LINKS = [
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'ChatGPT', url: 'https://chat.openai.com' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
]

interface Props {
  pid: number
  step: string
  personaId?: number
  title: string
  onClose: () => void
  onApplied: () => void
}

/**
 * LLM 왕복 브릿지 (API 없이 완전 동작):
 *  1) 단계별 프롬프트를 생성해 복사 → Claude/ChatGPT/Gemini에 붙여넣기
 *  2) LLM이 돌려준 JSON을 붙여넣으면 파싱해 반영
 */
export function LLMBridge({ pid, step, personaId, title, onClose, onApplied }: Props) {
  const [tab, setTab] = useState<'prompt' | 'paste'>('prompt')
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')

  const { data, isLoading } = useQuery<{ prompt: string }>({
    queryKey: ['wb-prompt', pid, step, personaId],
    queryFn: () => getWBPrompt(pid, step, personaId),
  })

  const applyMut = useMutation({
    mutationFn: () => applyWBStep(pid, step, pasted, personaId),
    onSuccess: (r) => {
      toast.success(`반영했어요 (${r.applied}건)`)
      onApplied()
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || '붙여넣은 내용을 해석하지 못했어요'),
  })

  const copy = () => {
    if (!data) return
    navigator.clipboard.writeText(data.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-slate-900">{title}</h2>
            <span className="text-xs text-slate-400">AI로 채우기</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {[['prompt', '1. 프롬프트 복사'], ['paste', '2. 답변 붙여넣기']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === k ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'prompt' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                아래 프롬프트를 복사해 원하는 AI에 붙여넣으세요. AI가 <b>정해진 JSON</b>으로 답하도록 설계돼 있어요.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={copy} className="btn-primary text-sm">
                  {copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 프롬프트 복사</>}
                </button>
                {LLM_LINKS.map((l) => (
                  <a key={l.name} href={l.url} target="_blank" rel="noreferrer"
                    className="btn-secondary text-sm">
                    {l.name} 열기 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
              ) : (
                <pre className="rounded-xl bg-slate-900 text-slate-200 text-[12.5px] leading-relaxed font-mono whitespace-pre-wrap p-4 max-h-[42vh] overflow-y-auto">{data?.prompt}</pre>
              )}
              <div className="flex justify-end">
                <button onClick={() => setTab('paste')} className="btn-ghost text-sm">복사했어요, 다음 <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                AI가 준 답변(JSON)을 그대로 붙여넣으세요. 앞뒤에 설명이 섞여 있어도 JSON 부분만 알아서 반영합니다.
              </p>
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)}
                className="input-field min-h-[220px] font-mono text-[12.5px]"
                placeholder='{ "personas": [ ... ] } 처럼 AI 응답을 붙여넣기' />
              <div className="flex justify-end">
                <button onClick={() => applyMut.mutate()} disabled={!pasted.trim() || applyMut.isPending} className="btn-primary">
                  {applyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ClipboardPaste className="w-4 h-4" /> 반영하기</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
