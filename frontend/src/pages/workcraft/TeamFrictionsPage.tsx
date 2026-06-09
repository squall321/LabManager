import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Share2, Loader2, Target, Repeat, Sparkles, UserCircle2, EyeOff,
} from 'lucide-react'
import { listSharedFrictions } from '../../services/api'
import type { SharedFriction } from '../../types'

export default function TeamFrictionsPage() {
  const navigate = useNavigate()

  const { data: shared, isLoading } = useQuery<SharedFriction[]>({
    queryKey: ['shared-frictions'], queryFn: listSharedFrictions,
  })

  const planFrom = (f: SharedFriction) => {
    // 타인의 공유 불편함 → 미션 빌더로 (origin으로 전달, 본인 friction 연결은 아님)
    navigate('/workcraft/missions/new', {
      state: {
        sharedFriction: {
          id: f.id,
          title: f.title,
          description: f.description,
          related_skill: f.related_skill,
          owner_name: f.owner_name,
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-brand-500" /> 공유 불편함
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          동료가 <b>직접 공유한</b> 업무 불편함입니다. 마음에 드는 문제를 골라 내 성장 미션으로 만들어
          함께 풀어볼 수 있어요. 익명으로 공유된 항목은 작성자가 표시되지 않습니다.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : !shared || shared.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Share2 className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">아직 공유된 불편함이 없습니다.</p>
          <p className="text-slate-400 text-sm mt-1">누군가 불편함 카드를 '파트 전체' 또는 '익명 템플릿'으로 공유하면 여기에 보입니다.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shared.map((f, i) => {
            const anon = f.visibility === 'anonymous_template'
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="card group flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                    {f.friction_type}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    {anon ? <><EyeOff className="w-3.5 h-3.5" /> 익명</> : <><UserCircle2 className="w-3.5 h-3.5" /> {f.owner_name}</>}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                {f.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{f.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                  {f.frequency && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {f.frequency}</span>}
                  {f.related_skill && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {f.related_skill}</span>}
                  {!anon && f.department && <span className="text-slate-300">· {f.department}</span>}
                </div>
                <button onClick={() => planFrom(f)} className="btn-secondary w-full text-sm mt-auto">
                  <Target className="w-4 h-4" /> 이 문제로 내 미션 만들기
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
