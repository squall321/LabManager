import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Loader2, Users, RefreshCw, CheckCircle2, XCircle,
  Eye, EyeOff, FileBarChart, UserCheck, ShieldCheck, Settings,
} from 'lucide-react'
import {
  getAdminStats, getAdminUsers, syncUsersFromYaml,
  getAllReports, updateReportVisibility, toggleUserActive,
} from '../services/api'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { User, Report } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats })
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['admin-users'], queryFn: getAdminUsers,
  })
  const { data: reports } = useQuery<Report[]>({
    queryKey: ['admin-reports'], queryFn: getAllReports,
  })

  const syncMutation = useMutation({
    mutationFn: syncUsersFromYaml,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: number; isPublic: boolean }) =>
      updateReportVisibility(id, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) => toggleUserActive(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const statCards = [
    { label: '전체 인원', value: stats?.total_users ?? 0, icon: Users, color: '#6366f1' },
    { label: '계정 활성화', value: stats?.users_with_password ?? 0, icon: UserCheck, color: '#22c55e' },
    { label: '진단 완료', value: stats?.completed_surveys ?? 0, icon: CheckCircle2, color: '#3b82f6' },
    { label: '공개 리포트', value: stats?.public_reports ?? 0, icon: Eye, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-500" /> 관리자
          </h1>
          <p className="text-slate-500 mt-1">사용자 계정과 리포트를 관리합니다</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn-secondary"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          YAML 동기화
        </button>
      </motion.div>

      {syncMutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {(syncMutation.data as any)?.message}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card !p-0 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">사용자 목록</h2>
        </div>
        {usersLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">이름</th>
                  <th className="px-6 py-3 font-medium">이메일</th>
                  <th className="px-6 py-3 font-medium">권한</th>
                  <th className="px-6 py-3 font-medium">계정 상태</th>
                  <th className="px-6 py-3 font-medium text-right">활성화</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                          {user.name[0]}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{user.email}</td>
                    <td className="px-6 py-3.5">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> 관리자
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">일반</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {user.password_set ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 가입 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                          <XCircle className="w-3.5 h-3.5" /> 미가입
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => toggleActiveMutation.mutate(user.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          user.is_active ? 'bg-brand-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            user.is_active ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                          style={{ transform: user.is_active ? 'translateX(18px)' : 'translateX(3px)' }}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Reports management */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card !p-0 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-title">리포트 공개 관리</h2>
          <span className="text-sm text-slate-400">{reports?.length ?? 0}개</span>
        </div>
        {!reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileBarChart className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">아직 생성된 리포트가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {reports.map((report) => {
              const primary = report.report_data.color_info.primary
              return (
                <div key={report.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: primary.hex }}
                    >
                      {report.user_name[0]}
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/report/${report.user_id}`)}
                        className="font-medium text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {report.user_name}
                      </button>
                      <div className="text-xs text-slate-400">{primary.name} · {primary.keyword}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => visibilityMutation.mutate({ id: report.id, isPublic: !report.is_public })}
                    disabled={visibilityMutation.isPending}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      report.is_public
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {report.is_public ? <><Eye className="w-3.5 h-3.5" /> 공개</> : <><EyeOff className="w-3.5 h-3.5" /> 비공개</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
