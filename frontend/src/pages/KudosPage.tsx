import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, Loader2, Send, Heart, ShieldCheck, Sparkles, Inbox,
} from 'lucide-react'
import {
  getKudosMeta, giveKudos, getKudosFeed, getKudosReceived, getRecentRecognized,
} from '../services/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

interface Meta { categories: string[]; recipients: { id: number; name: string; department: string | null }[] }
interface FeedItem { id: number; from_name: string; to_name: string; to_me: boolean; category: string; message: string }

const CAT_EMOJI: Record<string, string> = {
  '고마워요': '🙏', '꼼꼼함': '🔍', '빠른 응답': '⚡', '좋은 아이디어': '💡', '든든함': '🤝', '분위기 메이커': '🎉',
}

export default function KudosPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'feed' | 'received'>('feed')
  const [form, setForm] = useState({ to_user_id: 0, category: '고마워요', message: '' })

  const { data: meta } = useQuery<Meta>({ queryKey: ['kudos-meta'], queryFn: getKudosMeta })
  const { data: feed, isLoading } = useQuery<FeedItem[]>({ queryKey: ['kudos-feed'], queryFn: getKudosFeed })
  const { data: received } = useQuery<{ count: number; items: any[] }>({ queryKey: ['kudos-received'], queryFn: getKudosReceived })
  const { data: recognized } = useQuery<{ window_days: number; recognized: string[] }>({
    queryKey: ['kudos-recognized'], queryFn: getRecentRecognized, enabled: !!user?.is_part_leader, retry: false,
  })

  const giveMut = useMutation({
    mutationFn: () => giveKudos(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kudos-feed'] })
      queryClient.invalidateQueries({ queryKey: ['kudos-received'] })
      queryClient.invalidateQueries({ queryKey: ['kudos-recognized'] })
      toast.success('고마움을 전했어요 💛')
      setForm({ to_user_id: 0, category: '고마워요', message: '' })
    },
    onError: () => toast.error('전송에 실패했어요'),
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-brand-500" /> 고마워요
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          작은 도움에도 한마디 남겨보세요. 조용히 기여하는 동료가 빛나고, 팀 분위기가 따뜻해져요.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Give form */}
        <div className="card h-fit">
          <h2 className="section-title mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> 고마움 전하기</h2>
          <label className="label">누구에게</label>
          <select className="input-field mt-1.5 mb-3" value={form.to_user_id}
            onChange={(e) => setForm((p) => ({ ...p, to_user_id: Number(e.target.value) }))}>
            <option value={0}>동료 선택</option>
            {meta?.recipients.map((r) => <option key={r.id} value={r.id}>{r.name}{r.department ? ` · ${r.department}` : ''}</option>)}
          </select>
          <label className="label">어떤 점이 고마웠나요</label>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            {meta?.categories.map((c) => (
              <button key={c} onClick={() => setForm((p) => ({ ...p, category: c }))}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.category === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>{CAT_EMOJI[c]} {c}</button>
            ))}
          </div>
          <textarea className="input-field min-h-[64px]" value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="예: 급할 때 흔쾌히 도와줘서 정말 큰 힘이 됐어요" />
          <button onClick={() => giveMut.mutate()} disabled={!form.to_user_id || giveMut.isPending}
            className="btn-primary w-full mt-3">
            {giveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> 보내기</>}
          </button>

          {user?.is_part_leader && recognized && recognized.recognized.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> 최근 {recognized.window_days}일 인정받은 동료
              </div>
              <p className="text-[11px] text-slate-400 mb-2">순위 없이 이름만 — 1:1에서 슬쩍 언급해 격려해보세요.</p>
              <div className="flex flex-wrap gap-1.5">
                {recognized.recognized.map((n) => (
                  <span key={n} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md">{n}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feed / Received */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('feed')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'feed' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              팀 피드
            </button>
            <button onClick={() => setTab('received')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'received' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              내가 받은 {received?.count ? `(${received.count})` : ''}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'feed' ? (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
                ) : !feed || feed.length === 0 ? (
                  <div className="card text-center py-12 text-sm text-slate-400">
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" /> 첫 고마움을 남겨보세요.
                  </div>
                ) : feed.map((k, i) => (
                  <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className={`card !py-3.5 ${k.to_me ? 'border-brand-200 bg-brand-50/40' : ''}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{CAT_EMOJI[k.category] ?? '💛'}</span>
                      <span className="font-semibold text-slate-800">{k.from_name}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-slate-800">{k.to_name}{k.to_me && ' (나)'}</span>
                      <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ml-auto">{k.category}</span>
                    </div>
                    {k.message && <p className="text-sm text-slate-600 mt-1.5 pl-8">{k.message}</p>}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="received" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                {!received || received.items.length === 0 ? (
                  <div className="card text-center py-12 text-sm text-slate-400">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" /> 아직 받은 고마움이 없어요. 곧 쌓일 거예요.
                  </div>
                ) : received.items.map((k, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="card !py-3.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{CAT_EMOJI[k.category] ?? '💛'}</span>
                      <span className="font-semibold text-slate-800">{k.from_name}</span>
                      <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ml-auto">{k.category}</span>
                    </div>
                    {k.message && <p className="text-sm text-slate-600 mt-1.5 pl-8">{k.message}</p>}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
