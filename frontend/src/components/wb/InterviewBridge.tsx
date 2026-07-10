import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  X, Copy, Check, Loader2, Mic, ClipboardPaste, ArrowRight, ExternalLink, Sparkles,
} from 'lucide-react'
import { getInterviewPrompt, applyWBAll } from '../../services/api'
import { toast } from '../../store/toastStore'

const LLM_LINKS = [
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'ChatGPT', url: 'https://chat.openai.com' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
]

/**
 * 인터뷰 모드: 대화/음성 정리 텍스트 → 전체 프롬프트 → AI → 전체 JSON 붙여넣기로 한 번에 채움.
 */
export function InterviewBridge({ pid, onClose, onApplied }: { pid: number; onClose: () => void; onApplied: () => void }) {
  const [tab, setTab] = useState<'prompt' | 'paste'>('prompt')
  const [transcript, setTranscript] = useState('')
  const [prompt, setPrompt] = useState('')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)

  const genMut = useMutation({
    mutationFn: () => getInterviewPrompt(pid, transcript),
    onSuccess: (r) => { setPrompt(r.prompt); navigator.clipboard.writeText(r.prompt); setCopied(true); setTimeout(() => setCopied(false), 1600); toast.success('프롬프트를 만들어 복사했어요') },
    onError: () => toast.error('생성 실패'),
  })
  const applyMut = useMutation({
    mutationFn: () => applyWBAll(pid, pasted),
    onSuccess: (r) => {
      const a = r.applied || {}
      const parts = Object.entries(a).map(([k, v]) => `${k} ${v}`).join(' · ')
      toast.success(`정리된 내용을 반영했어요 (${parts})`)
      onApplied(); onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || '해석하지 못했어요'),
  })

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-slate-900">인터뷰로 한 번에 채우기</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {[['prompt', '1. 대화 정리 → 프롬프트'], ['paste', '2. 결과 붙여넣기']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === k ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'prompt' ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-brand-50/60 border border-brand-100 p-3 text-sm text-brand-800 flex gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>인터뷰·회의 녹취(음성인식 텍스트)를 붙여넣고 프롬프트를 만드세요. AI가 아이디어·페르소나·문제·PR/FAQ·기능을 <b>한 번에</b> 정리해 줍니다.</span>
              </div>
              <label className="label">인터뷰 / 대화 내용 (선택 — 비우면 현재 아이디어로 구성)</label>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
                className="input-field min-h-[160px] text-sm" placeholder="예: (녹취) '우리가 매번 낙하 케이스를 손으로 만들고, 결과 비교 포맷이 사람마다 달라서...'" />
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => genMut.mutate()} disabled={genMut.isPending} className="btn-primary text-sm">
                  {genMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 프롬프트 생성·복사</>}
                </button>
                {LLM_LINKS.map((l) => (
                  <a key={l.name} href={l.url} target="_blank" rel="noreferrer" className="btn-secondary text-sm">{l.name} 열기 <ExternalLink className="w-3.5 h-3.5" /></a>
                ))}
              </div>
              {prompt && (
                <>
                  <pre className="rounded-xl bg-slate-900 text-slate-200 text-[12px] leading-relaxed font-mono whitespace-pre-wrap p-4 max-h-[34vh] overflow-y-auto">{prompt}</pre>
                  <div className="flex justify-end"><button onClick={() => setTab('paste')} className="btn-ghost text-sm">복사했어요, 다음 <ArrowRight className="w-4 h-4" /></button></div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">AI가 정리해 준 JSON을 붙여넣으면 프로젝트 전체(아이디어·페르소나·문제·PR/FAQ·기능)가 한 번에 채워집니다.</p>
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)}
                className="input-field min-h-[220px] font-mono text-[12.5px]" placeholder='{ "idea": {...}, "personas": [...], "pains": [...], "features": [...], "prfaq": {...} }' />
              <div className="flex justify-end">
                <button onClick={() => applyMut.mutate()} disabled={!pasted.trim() || applyMut.isPending} className="btn-primary">
                  {applyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ClipboardPaste className="w-4 h-4" /> 전체 반영</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
