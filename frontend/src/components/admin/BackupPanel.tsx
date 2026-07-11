import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, DatabaseBackup, Download, HardDriveDownload, Shield } from 'lucide-react'
import { listBackups, createBackup, downloadBackup } from '../../services/api'
import { toast } from '../../store/toastStore'

interface Backup { name: string; size: number; created_at: string }
interface AutoInfo { enabled: boolean; interval_hours: number; keep: number }

const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`)
const fmtDate = (s: string) => s.replace('T', ' ').slice(0, 19)

export function BackupPanel() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ backups: Backup[]; auto?: AutoInfo }>({ queryKey: ['admin-backups'], queryFn: listBackups })

  const createMut = useMutation({
    mutationFn: createBackup,
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['admin-backups'] }); toast.success(`백업 생성됨 (${fmtSize(r.size)})`) },
    onError: () => toast.error('백업에 실패했어요'),
  })

  const download = async (name: string) => {
    try {
      const blob = await downloadBackup(name)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('다운로드에 실패했어요') }
  }

  const backups = data?.backups ?? []

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card !p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <h2 className="section-title flex items-center gap-2"><DatabaseBackup className="w-5 h-5 text-brand-500" /> 데이터 백업</h2>
        <button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="btn-primary text-sm">
          {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><HardDriveDownload className="w-4 h-4" /> 지금 백업</>}
        </button>
      </div>
      <div className="px-6 py-2 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" /> 서버 실행 중에도 안전한 스냅샷으로 저장됩니다. 관리자만 생성·다운로드할 수 있어요.
      </div>
      {data?.auto?.enabled && (
        <div className="px-6 py-2 bg-green-50/60 border-b border-green-100 text-xs text-green-700 flex items-center gap-1.5">
          <DatabaseBackup className="w-3.5 h-3.5" />
          자동 백업 켜짐 — {data.auto.interval_hours}시간마다 스냅샷, 최근 {data.auto.keep}개 보관(초과분 자동 정리).
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
      ) : backups.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-400">아직 백업이 없어요. "지금 백업"으로 첫 스냅샷을 만드세요.</div>
      ) : (
        <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
          {backups.map((b) => (
            <div key={b.name} className="px-6 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800 font-mono">{b.name}</div>
                <div className="text-xs text-slate-400">{fmtDate(b.created_at)} · {fmtSize(b.size)}</div>
              </div>
              <button onClick={() => download(b.name)} className="btn-secondary !py-1.5 text-sm"><Download className="w-4 h-4" /> 다운로드</button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
