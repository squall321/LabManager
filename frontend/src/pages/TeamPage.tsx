import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Users, ArrowRight, Lock } from 'lucide-react'
import { getPublicReports } from '../services/api'
import { BIRKMAN_COLORS } from '../lib/utils'
import type { Report } from '../types'

export default function TeamPage() {
  const navigate = useNavigate()

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['public-reports'],
    queryFn: getPublicReports,
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-500" /> 팀 리포트
        </h1>
        <p className="text-slate-500 mt-1">공개된 동료들의 버크만 성향을 확인해보세요</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">공개된 리포트가 없습니다</h2>
          <p className="text-slate-500">팀원들이 리포트를 공개하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report, i) => {
            const primary = report.report_data.color_info.primary
            return (
              <motion.button
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/report/${report.user_id}`)}
                className="card text-left hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: primary.hex }}
                    >
                      {report.user_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{report.user_name}</div>
                      <div className="text-xs text-slate-400">{report.user_email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: primary.hex }}
                  >
                    {primary.name} · {primary.keyword}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {report.report_data.top_interests.slice(0, 2).map((interest) => (
                    <span key={interest.category} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                      {interest.name}
                    </span>
                  ))}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
