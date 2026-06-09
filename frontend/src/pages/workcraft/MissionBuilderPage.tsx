import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Target, Loader2, Sparkles, Wand2, Lightbulb, ArrowRight } from 'lucide-react'
import { createMission, getRecommendations } from '../../services/api'
import { VisibilitySelector } from '../../components/workcraft/VisibilitySelector'
import type { WorkFriction, Recommendation, Visibility } from '../../types'

export default function MissionBuilderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const friction = (location.state as any)?.friction as WorkFriction | undefined

  const [form, setForm] = useState({
    title: friction ? `${friction.title} 개선` : '',
    problem: friction?.description || '',
    goal: '',
    output: '',
    scope: '',
    success_criteria: '',
    deadline: '2주',
    learning_goal: friction?.related_skill || '',
    work_friction_id: friction?.id ?? null,
    status: 'idea' as const,
    visibility: 'private' as Visibility,
  })

  const { data: rec } = useQuery<Recommendation>({
    queryKey: ['wc-recommendations'], queryFn: getRecommendations,
  })

  const createMut = useMutation({
    mutationFn: () => createMission(form),
    onSuccess: (mission) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      navigate(`/workcraft/missions/${mission.id}/prompt`)
    },
  })

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-brand-500" /> 미션 만들기
        </h1>
        <p className="text-slate-500 mt-1">불편함을 이번 달 안에 끝낼 수 있는 작은 미션으로 바꿔보세요.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card space-y-4">
          <div>
            <label className="label">미션 제목 *</label>
            <input className="input-field mt-1.5" value={form.title}
              onChange={(e) => set('title', e.target.value)} placeholder="예: CSV 결과 자동 리포트 MVP 만들기" />
          </div>
          <div>
            <label className="label">현재 가장 불편한 점</label>
            <textarea className="input-field mt-1.5 min-h-[64px]" value={form.problem}
              onChange={(e) => set('problem', e.target.value)} placeholder="반복 분석에 시간이 많이 든다" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">원하는 결과물</label>
              <textarea className="input-field mt-1.5 min-h-[64px]" value={form.output}
                onChange={(e) => set('output', e.target.value)} placeholder="CSV 업로드 → 그래프 → 요약 통계 페이지" />
            </div>
            <div>
              <label className="label">이번 달 최소 결과물(범위)</label>
              <textarea className="input-field mt-1.5 min-h-[64px]" value={form.scope}
                onChange={(e) => set('scope', e.target.value)} placeholder="1차: CSV 3개 업로드, 선그래프 1개" />
            </div>
          </div>
          <div>
            <label className="label">성공 기준 (한 줄에 하나씩)</label>
            <textarea className="input-field mt-1.5 min-h-[88px]" value={form.success_criteria}
              onChange={(e) => set('success_criteria', e.target.value)}
              placeholder={'CSV를 업로드할 수 있다\n그래프가 표시된다\n평균/최대/최소가 표로 출력된다'} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">기한</label>
              <input className="input-field mt-1.5" value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)} placeholder="2주" />
            </div>
            <div>
              <label className="label">배우고 싶은 역량</label>
              <input className="input-field mt-1.5" value={form.learning_goal}
                onChange={(e) => set('learning_goal', e.target.value)} placeholder="React + Flask 데이터 시각화" />
            </div>
          </div>
          <div>
            <label className="label">공개 범위</label>
            <div className="mt-1.5">
              <VisibilitySelector value={form.visibility} onChange={(v) => set('visibility', v)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => navigate('/workcraft/frictions')} className="btn-secondary">취소</button>
            <button onClick={() => createMut.mutate()} disabled={!form.title || createMut.isPending} className="btn-primary">
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>저장하고 명세서 만들기 <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>

        {/* Recommendation panel (본인 전용) */}
        <div className="space-y-4">
          {rec?.has_birkman ? (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900">나에게 맞는 추천</h3>
              </div>
              <div className="text-xs text-slate-400 mb-1">버크만 유형 기반 · 나만 볼 수 있어요</div>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full mb-3">
                {rec.color_name} · {rec.color_keyword}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{rec.tone}</p>

              {rec.skill_tags.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">추천 역량 태그</div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.skill_tags.map((s) => (
                      <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {rec.mission_ideas.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">미션 아이디어</div>
                  <div className="space-y-2">
                    {rec.mission_ideas.map((idea) => (
                      <button key={idea.title} onClick={() => set('title', idea.title)}
                        className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-100 hover:border-brand-300 transition-colors">
                        <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {idea.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{idea.reason}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="card text-center">
              <Wand2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">버크만 진단을 완료하면 나에게 맞는 미션을 추천해드려요.</p>
              <button onClick={() => navigate('/survey')} className="btn-secondary text-sm">버크만 진단하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
