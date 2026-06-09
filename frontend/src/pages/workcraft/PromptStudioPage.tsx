import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileCode2, Loader2, Copy, Check, RefreshCw, ArrowLeft, Sparkles, Terminal,
} from 'lucide-react'
import { getMissionPrompt, generateMissionPrompt, listMissions } from '../../services/api'
import type { ClaudePrompt, GrowthMission } from '../../types'

export default function PromptStudioPage() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(missionId)
  const [copied, setCopied] = useState(false)

  const { data: missions } = useQuery<GrowthMission[]>({ queryKey: ['missions'], queryFn: listMissions })
  const mission = missions?.find((m) => m.id === id)

  const { data: prompt, isLoading, error } = useQuery<ClaudePrompt>({
    queryKey: ['prompt', id], queryFn: () => getMissionPrompt(id), retry: false,
  })

  const genMut = useMutation({
    mutationFn: () => generateMissionPrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt', id] })
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  const copy = () => {
    if (!prompt) return
    navigator.clipboard.writeText(prompt.prompt_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/workcraft/board')} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> 미션 보드
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileCode2 className="w-6 h-6 text-brand-500" /> Claude Code 실행 명세서
        </h1>
        {mission && <p className="text-slate-500 mt-1">미션: <b className="text-slate-700">{mission.title}</b></p>}
        <p className="text-slate-400 text-sm mt-1">
          아래 명세서를 복사해 Claude Code에 붙여넣으면, 먼저 프로젝트 구조를 파악하고 수정 계획을 제안하도록 안내합니다.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : error || !prompt ? (
        <div className="card text-center py-12">
          <Terminal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-5">아직 생성된 명세서가 없습니다. 미션 내용을 바탕으로 만들어보세요.</p>
          <button onClick={() => genMut.mutate()} disabled={genMut.isPending} className="btn-primary">
            {genMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCode2 className="w-4 h-4" /> 명세서 생성</>}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => genMut.mutate()} disabled={genMut.isPending} className="btn-secondary text-sm">
              {genMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              다시 생성
            </button>
            <button onClick={copy} className="btn-primary text-sm">
              {copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 전체 복사</>}
            </button>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-slate-400 ml-2 font-mono">claude-code-prompt.txt</span>
            </div>
            <pre className="p-5 text-[13px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-[60vh]">
              {prompt.prompt_text}
            </pre>
          </motion.div>
        </>
      )}
    </div>
  )
}
