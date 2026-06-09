import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarDays, Loader2, ChevronLeft, ChevronRight, Sparkles, Flag, CircleDot,
} from 'lucide-react'
import { listMissions } from '../../services/api'
import type { GrowthMission, MissionStatus } from '../../types'

const STATUS_COLOR: Record<MissionStatus, string> = {
  idea: '#94a3b8', prompt_ready: '#6366f1', in_progress: '#3b82f6',
  review: '#f59e0b', done: '#22c55e', shared: '#8b5cf6',
}
const STATUS_LABEL: Record<MissionStatus, string> = {
  idea: 'Idea', prompt_ready: 'Prompt Ready', in_progress: 'In Progress',
  review: 'Review', done: 'Done', shared: 'Shared',
}
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const todayISO = () => new Date().toISOString().slice(0, 10)
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based

  const { data: missions, isLoading } = useQuery<GrowthMission[]>({
    queryKey: ['missions'], queryFn: listMissions,
  })

  // due_date 기준으로 날짜별 미션 매핑
  const byDate = useMemo(() => {
    const map: Record<string, GrowthMission[]> = {}
    ;(missions ?? []).forEach((m) => {
      if (m.due_date) (map[m.due_date] ??= []).push(m)
    })
    return map
  }, [missions])

  const upcoming = useMemo(() => {
    const t = todayISO()
    return (missions ?? [])
      .filter((m) => m.due_date && m.due_date >= t && m.status !== 'done' && m.status !== 'shared')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8)
  }, [missions])

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) } else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) } else setMonth(month + 1)
  }

  const today = todayISO()

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> WorkCraft Studio
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-brand-500" /> 캘린더
        </h1>
        <p className="text-slate-500 mt-1">미션 마감일을 달력과 일정으로 한눈에 확인하세요.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{year}년 {month + 1}월</h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-slate-100 text-slate-600">오늘</button>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`text-center text-xs font-semibold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} className="aspect-square" />
                const dateStr = iso(year, month, day)
                const items = byDate[dateStr] ?? []
                const isToday = dateStr === today
                return (
                  <div key={idx} className={`aspect-square rounded-lg border p-1 flex flex-col gap-0.5 overflow-hidden ${isToday ? 'border-brand-400 bg-brand-50/50' : 'border-slate-100'}`}>
                    <span className={`text-[11px] font-medium ${isToday ? 'text-brand-700' : 'text-slate-400'}`}>{day}</span>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {items.slice(0, 3).map((m) => (
                        <button key={m.id} onClick={() => navigate(`/workcraft/missions/${m.id}/prompt`)}
                          title={m.title}
                          className="w-full flex items-center gap-1 text-left">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[m.status] }} />
                          <span className="text-[10px] text-slate-600 truncate leading-tight">{m.title}</span>
                        </button>
                      ))}
                      {items.length > 3 && <span className="text-[9px] text-slate-400">+{items.length - 3}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda */}
          <div className="card">
            <h2 className="section-title mb-1 flex items-center gap-2"><Flag className="w-4 h-4 text-brand-500" /> 다가오는 일정</h2>
            <p className="text-sm text-slate-400 mb-4">마감일이 남은 진행 중 미션</p>
            {upcoming.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">예정된 마감이 없습니다.</div>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((m) => (
                  <button key={m.id} onClick={() => navigate(`/workcraft/missions/${m.id}/prompt`)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleDot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: STATUS_COLOR[m.status] }} />
                      <span className="text-sm font-semibold text-slate-800 truncate">{m.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{STATUS_LABEL[m.status]}</span>
                      <span className="font-medium text-brand-600">{m.due_date}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
