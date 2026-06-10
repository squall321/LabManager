import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpenCheck, Loader2, ArrowLeft, Sparkles, Sprout } from 'lucide-react'
import { listMissions, getMissionReview, saveMissionReview } from '../../services/api'
import { toast } from '../../store/toastStore'
import type { GrowthMission, MissionReview } from '../../types'

const EMPTY = {
  result_summary: '', learned_skill: '', business_impact: '',
  claude_good_points: '', claude_bad_points: '', next_action: '',
}

export default function ReviewPage() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(missionId)
  const [form, setForm] = useState(EMPTY)

  const { data: missions } = useQuery<GrowthMission[]>({ queryKey: ['missions'], queryFn: listMissions })
  const mission = missions?.find((m) => m.id === id)

  const { data: existing } = useQuery<MissionReview>({
    queryKey: ['review', id], queryFn: () => getMissionReview(id), retry: false,
  })
  useEffect(() => {
    if (existing) setForm({
      result_summary: existing.result_summary, learned_skill: existing.learned_skill,
      business_impact: existing.business_impact, claude_good_points: existing.claude_good_points,
      claude_bad_points: existing.claude_bad_points, next_action: existing.next_action,
    })
  }, [existing])

  const saveMut = useMutation({
    mutationFn: () => saveMissionReview(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      toast.success('배운 점을 기록했어요. 성장 여정에 쌓였어요 🌱')
      navigate('/workcraft/growth')
    },
    onError: () => toast.error('저장에 실패했어요'),
  })

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate('/workcraft/board')} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> 미션 보드
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-green-500" /> 배운 점 기록
        </h1>
        {mission && <p className="text-slate-500 mt-1">미션: <b className="text-slate-700">{mission.title}</b></p>}
        <p className="text-slate-400 text-sm mt-1">
          무엇을 해냈고 무엇을 배웠는지 짧게 남겨보세요. 이 기록은 <b>나만 보며</b>, 성장 여정에 차곡차곡 쌓입니다.
        </p>
      </motion.div>

      <div className="card space-y-4">
        <div>
          <label className="label">무엇을 해냈나요? (결과 요약)</label>
          <textarea className="input-field mt-1.5 min-h-[64px]" value={form.result_summary}
            onChange={(e) => set('result_summary', e.target.value)} placeholder="CSV를 올리면 그래프와 요약이 자동으로 나오는 페이지를 만들었다" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">새로 배운 역량</label>
            <input className="input-field mt-1.5" value={form.learned_skill}
              onChange={(e) => set('learned_skill', e.target.value)} placeholder="React, 데이터 시각화" />
            <p className="text-[11px] text-slate-400 mt-1">쉼표로 구분하면 성장 여정에 역량으로 쌓여요</p>
          </div>
          <div>
            <label className="label">업무에 어떤 도움이 됐나요?</label>
            <input className="input-field mt-1.5" value={form.business_impact}
              onChange={(e) => set('business_impact', e.target.value)} placeholder="주 2시간 절약" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Claude Code가 잘한 점</label>
            <textarea className="input-field mt-1.5 min-h-[56px]" value={form.claude_good_points}
              onChange={(e) => set('claude_good_points', e.target.value)} placeholder="구조를 먼저 제안해줘서 좋았다" />
          </div>
          <div>
            <label className="label">아쉬웠던 점</label>
            <textarea className="input-field mt-1.5 min-h-[56px]" value={form.claude_bad_points}
              onChange={(e) => set('claude_bad_points', e.target.value)} placeholder="엣지 케이스를 놓쳤다" />
          </div>
        </div>
        <div>
          <label className="label">다음에 해보고 싶은 것</label>
          <input className="input-field mt-1.5" value={form.next_action}
            onChange={(e) => set('next_action', e.target.value)} placeholder="다른 보고서도 자동화해보기" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => navigate('/workcraft/board')} className="btn-secondary">취소</button>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sprout className="w-4 h-4" /> 기록하기</>}
          </button>
        </div>
      </div>
    </div>
  )
}
