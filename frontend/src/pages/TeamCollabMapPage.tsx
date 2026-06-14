import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Network, UserPlus, Sparkles, Lightbulb, ArrowLeft, Lock } from 'lucide-react'
import { getMyReport, getPublicReports } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { Report } from '../types'

interface Node {
  report: Report
  x: number
  y: number
}

export default function TeamCollabMapPage() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [selected, setSelected] = useState<Report | null>(null)

  const { data: myReport } = useQuery<Report>({ queryKey: ['my-report'], queryFn: getMyReport, retry: false })
  const { data: publicReports, isLoading } = useQuery<Report[]>({
    queryKey: ['public-reports'], queryFn: getPublicReports,
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  }

  const teammates = (publicReports ?? []).filter((r) => r.user_id !== me?.id)

  // 방사형 좌표 계산 (viewBox 0 0 440 440, 중심 220,220)
  const CX = 220, CY = 220, R = 155
  const nodes: Node[] = teammates.map((report, i) => {
    const angle = (2 * Math.PI / Math.max(teammates.length, 1)) * i - Math.PI / 2
    return { report, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
  })

  const myColor = myReport?.report_data?.primary_color
    ? BIRKMAN_COLORS[myReport.report_data.primary_color]?.hex
    : '#6366f1'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-brand-500" /> 팀 협업 맵
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          나를 중심으로, 함께 일하는 동료마다 <b>어떤 마음가짐으로 다가가면 좋을지</b>를 보여줍니다.
          동료 노드를 눌러 그 사람과 일할 때의 배려 포인트를 확인하세요.
        </p>
      </motion.div>

      {teammates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Network className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">아직 공개된 동료 리포트가 없습니다.</p>
          <p className="text-slate-400 text-sm mt-1">동료들이 협업 스타일 리포트를 공개하면 여기에 연결됩니다.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Graph */}
          <div className="lg:col-span-3 card">
            <svg viewBox="0 0 440 440" className="w-full h-auto">
              {/* edges */}
              {nodes.map((n) => (
                <line key={`e-${n.report.id}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
                  stroke={selected?.id === n.report.id ? myColor : '#e2e8f0'}
                  strokeWidth={selected?.id === n.report.id ? 2.5 : 1.5} />
              ))}

              {/* teammate nodes */}
              {nodes.map((n, i) => {
                const c = BIRKMAN_COLORS[n.report.report_data.primary_color]?.hex ?? '#94a3b8'
                const active = selected?.id === n.report.id
                return (
                  <motion.g key={n.report.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }} style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(active ? null : n.report)}>
                    <circle cx={n.x} cy={n.y} r={active ? 26 : 22} fill={c}
                      stroke="#fff" strokeWidth={3} opacity={active ? 1 : 0.9} />
                    <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize="15" fontWeight="700">{n.report.user_name[0]}</text>
                    <text x={n.x} y={n.y + 38} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                      {n.report.user_name}
                    </text>
                  </motion.g>
                )
              })}

              {/* me (center) */}
              <circle cx={CX} cy={CY} r={34} fill={myColor} stroke="#fff" strokeWidth={4} />
              <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="16" fontWeight="700">나</text>
            </svg>

            {/* legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-500">
              {Object.entries(BIRKMAN_COLORS).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.hex }} /> {v.name}
                </span>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: BIRKMAN_COLORS[selected.report_data.primary_color]?.hex }}>
                      {selected.user_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{selected.user_name}</div>
                      <div className="text-xs text-slate-500">
                        {selected.report_data.color_info.primary.name} · {selected.report_data.color_info.primary.keyword}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3.5 mb-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-semibold mb-1.5">
                      <UserPlus className="w-4 h-4" /> {selected.user_name}님과 일할 때
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selected.report_data.narrative?.work_with_me || '협업 팁이 아직 없습니다.'}
                    </p>
                  </div>
                  <button onClick={() => navigate(`/report/${selected.user_id}`)} className="btn-secondary w-full text-sm">
                    리포트 전체 보기
                  </button>
                </motion.div>
              ) : (
                <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-2">
                    <Sparkles className="w-4 h-4" /> 나의 협업 태도
                  </div>
                  {myReport ? (
                    <>
                      <div className="text-xs text-slate-400 mb-2">
                        {myReport.report_data.color_info.primary.name} · {myReport.report_data.color_info.primary.keyword}
                      </div>
                      <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5">
                        <div className="flex items-center gap-1.5 text-blue-700 text-sm font-semibold mb-1.5">
                          <Lightbulb className="w-4 h-4" /> 내가 동료를 대할 때 의식할 점
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {myReport.report_data.narrative?.i_adapt
                            || '협업 스타일 진단을 다시 받으면 더 구체적인 팁이 채워져요.'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> 동료 노드를 누르면 그 사람과 일할 때의 배려 포인트가 나와요.
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 mb-3">내 협업 스타일 진단을 완료하면 더 풍부하게 보여요.</p>
                      <button onClick={() => navigate('/survey')} className="btn-secondary text-sm">진단하러 가기</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/team')} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> 팀 리포트 목록
      </button>
    </div>
  )
}
