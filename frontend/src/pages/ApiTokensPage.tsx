import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  KeyRound, Loader2, Plus, Trash2, Copy, Check, ShieldAlert, Plug,
} from 'lucide-react'
import { listApiTokens, createApiToken, revokeApiToken } from '../services/api'
import { toast } from '../store/toastStore'

interface Token { id: number; name: string; prefix: string; active: boolean; created_at: string; last_used_at: string | null }

export default function ApiTokensPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [justCreated, setJustCreated] = useState<{ token: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: tokens, isLoading } = useQuery<Token[]>({ queryKey: ['api-tokens'], queryFn: listApiTokens })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['api-tokens'] })

  const createMut = useMutation({
    mutationFn: () => createApiToken(name),
    onSuccess: (r) => { inval(); setJustCreated({ token: r.token, name: r.name }); setName(''); toast.success('토큰을 발급했어요') },
    onError: () => toast.error('발급에 실패했어요'),
  })
  const revokeMut = useMutation({
    mutationFn: (id: number) => revokeApiToken(id),
    onSuccess: () => { inval(); toast.success('토큰을 해지했어요') },
    onError: () => toast.error('해지에 실패했어요'),
  })

  const copy = (t: string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1600) }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><KeyRound className="w-6 h-6 text-brand-500" /> API 토큰</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Claude/ChatGPT 같은 AI가 <b>MCP</b>로 이 앱에 접속해 내 프로젝트를 읽고 채우게 하려면 개인 토큰이 필요해요.
          토큰은 <b>내 계정으로만</b> 동작하고, 발급 직후 한 번만 전체가 보입니다.
        </p>
      </motion.div>

      {/* 발급 */}
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <input className="input-field flex-1 min-w-[200px]" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="토큰 이름 (예: 내 노트북 Claude)" onKeyDown={(e) => { if (e.key === 'Enter') createMut.mutate() }} />
          <button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="btn-primary">
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 새 토큰 발급</>}
          </button>
        </div>

        <AnimatePresence>
          {justCreated && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-4 overflow-hidden">
              <div className="flex items-center gap-1.5 text-amber-700 text-sm font-semibold mb-2"><ShieldAlert className="w-4 h-4" /> 지금만 볼 수 있어요 — 안전한 곳에 복사해두세요</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono break-all">{justCreated.token}</code>
                <button onClick={() => copy(justCreated.token)} className="btn-primary text-sm flex-shrink-0">{copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 복사</>}</button>
              </div>
              <button onClick={() => setJustCreated(null)} className="text-xs text-amber-600 hover:underline mt-2">복사했어요, 닫기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 목록 */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100"><h2 className="section-title text-base">발급된 토큰</h2></div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
        ) : !tokens || tokens.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">아직 발급한 토큰이 없어요.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tokens.map((t) => (
              <div key={t.id} className="px-6 py-3 flex items-center justify-between group">
                <div>
                  <div className="text-sm font-medium text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{t.prefix}··· · 발급 {t.created_at.slice(0, 10)}{t.last_used_at ? ` · 최근 사용 ${t.last_used_at.slice(0, 10)}` : ' · 미사용'}</div>
                </div>
                <button onClick={() => { if (confirm(`'${t.name}' 토큰을 해지할까요? 이 토큰을 쓰는 연결이 즉시 끊깁니다.`)) revokeMut.mutate(t.id) }}
                  className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MCP 안내 */}
      <div className="card bg-slate-50/60">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><Plug className="w-4 h-4 text-brand-500" /> MCP 연결이란?</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          MCP를 설정하면 Claude 같은 AI가 대화만으로 이 앱의 Working Backwards 프로젝트를 <b>직접 읽고 채울</b> 수 있어요.
          인터뷰·음성으로 정리한 내용을 AI가 바로 반영합니다. 설정 방법은 저장소의 <code className="text-brand-600">docs/MCP_GUIDE.md</code>를 참고하세요.
        </p>
      </div>
    </div>
  )
}
