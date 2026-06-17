import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, ClipboardList, FileBarChart, Users,
  Settings, LogOut, FlaskConical, Lightbulb, Target,
  KanbanSquare, Share2, CalendarDays, Library, LifeBuoy, BarChart3, Sprout,
  Menu, X, ClipboardCheck, Network, Activity, ScrollText, MessagesSquare, Award,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const birkmanNav = [
  { to: '/',            label: '대시보드',     icon: LayoutDashboard },
  { to: '/survey',      label: '협업 스타일 진단', icon: ClipboardList },
  { to: '/report',      label: '내 리포트',     icon: FileBarChart },
  { to: '/team',        label: '팀 리포트',     icon: Users },
  { to: '/team-map',    label: '팀 협업 맵',    icon: Network },
  { to: '/pulse',       label: '주간 펄스',     icon: Activity },
  { to: '/reflections', label: '협업 회고',     icon: MessagesSquare },
  { to: '/kudos',       label: '고마워요',      icon: Award },
  { to: '/agreements',  label: '협업 합의서',   icon: ScrollText },
  { to: '/assessments', label: '진단',          icon: ClipboardCheck },
]

const workcraftNav = [
  { to: '/workcraft/frictions',      label: '업무 불편함',   icon: Lightbulb },
  { to: '/workcraft/team-frictions', label: '공유 불편함',   icon: Share2 },
  { to: '/workcraft/missions/new',   label: '미션 만들기',   icon: Target },
  { to: '/workcraft/board',          label: '내 미션 보드',  icon: KanbanSquare },
  { to: '/workcraft/calendar',       label: '캘린더',        icon: CalendarDays },
  { to: '/workcraft/growth',         label: '성장 여정',     icon: Sprout },
  { to: '/workcraft/templates',      label: '템플릿',        icon: Library },
  { to: '/workcraft/support',        label: '지원 요청',     icon: LifeBuoy },
]

const modules = [
  { key: 'birkman',   home: '/',                    short: 'CS' },
  { key: 'workcraft', home: '/workcraft/frictions', short: 'WS' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
    isActive ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  )

export function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const activeModule = location.pathname.startsWith('/workcraft') ? 'workcraft' : 'birkman'
  const nav = activeModule === 'workcraft' ? workcraftNav : birkmanNav

  // 라우트 변경 시 모바일 드로어 닫기
  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }
  const close = () => setOpen(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-slate-200 px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900" aria-label="메뉴 열기">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">LabManager</span>
        </div>
      </div>

      {/* Overlay (mobile) */}
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={close} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen',
        'transform transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">LabManager</div>
              <div className="text-[11px] text-slate-400 font-medium">People &amp; Growth</div>
            </div>
          </div>
          <button onClick={close} className="lg:hidden p-1 text-slate-400 hover:text-slate-600" aria-label="메뉴 닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module switcher */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {modules.map((m) => (
              <button
                key={m.key}
                onClick={() => { navigate(m.home); close() }}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeModule === m.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold',
                  activeModule === m.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                )}>{m.short}</span>
                {m.key === 'birkman' ? '협업 스타일' : 'WorkCraft'}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="pb-1 px-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {activeModule === 'workcraft' ? 'WorkCraft Studio' : '협업 스타일 워크샵'}
            </div>
          </div>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={close} className={navLinkClass}>
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}

          {activeModule === 'workcraft' && user?.is_part_leader && (
            <>
              <div className="pt-3 pb-1 px-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">파트장</div>
              </div>
              <NavLink to="/workcraft/leader" onClick={close} className={navLinkClass}>
                <BarChart3 className="w-[18px] h-[18px]" />
                익명 대시보드
              </NavLink>
            </>
          )}

          {user?.is_admin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">관리</div>
              </div>
              <NavLink to="/admin" onClick={close} className={navLinkClass}>
                <Settings className="w-[18px] h-[18px]" />
                관리자
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.department || user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start">
            <LogOut className="w-[18px] h-[18px]" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
