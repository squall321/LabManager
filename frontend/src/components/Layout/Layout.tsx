import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, ClipboardList, FileBarChart, Users,
  Settings, LogOut, FlaskConical, Lightbulb, Target,
  KanbanSquare,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const birkmanNav = [
  { to: '/',       label: '대시보드',   icon: LayoutDashboard },
  { to: '/survey', label: '버크만 설문', icon: ClipboardList },
  { to: '/report', label: '내 리포트',   icon: FileBarChart },
  { to: '/team',   label: '팀 리포트',   icon: Users },
]

const workcraftNav = [
  { to: '/workcraft/frictions',   label: '업무 불편함',   icon: Lightbulb },
  { to: '/workcraft/missions/new', label: '미션 만들기',   icon: Target },
  { to: '/workcraft/board',        label: '내 미션 보드',  icon: KanbanSquare },
]

const modules = [
  { key: 'birkman',   label: 'Birkman Workshop', home: '/',                    short: 'BW' },
  { key: 'workcraft', label: 'WorkCraft Studio',  home: '/workcraft/frictions', short: 'WS' },
]

export function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const activeModule = location.pathname.startsWith('/workcraft') ? 'workcraft' : 'birkman'
  const nav = activeModule === 'workcraft' ? workcraftNav : birkmanNav

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">LabManager</div>
              <div className="text-[11px] text-slate-400 font-medium">People &amp; Growth</div>
            </div>
          </div>
        </div>

        {/* Module switcher */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {modules.map((m) => (
              <button
                key={m.key}
                onClick={() => navigate(m.home)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeModule === m.key
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold',
                  activeModule === m.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                )}>{m.short}</span>
                {m.key === 'birkman' ? 'Birkman' : 'WorkCraft'}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="pb-1 px-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {activeModule === 'workcraft' ? 'WorkCraft Studio' : 'Birkman Workshop'}
            </div>
          </div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}

          {user?.is_admin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">관리</div>
              </div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
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

      <main className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
