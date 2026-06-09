import { Lock, UserCog, Users2, FileText } from 'lucide-react'
import type { Visibility } from '../../types'
import { cn } from '../../lib/utils'

const OPTIONS: { value: Visibility; label: string; desc: string; icon: typeof Lock }[] = [
  { value: 'private',            label: '나만 보기',        desc: '기본값 · 본인만 열람',          icon: Lock },
  { value: 'leader_only',        label: '파트장에게 공유',  desc: '파트장만 추가로 열람',          icon: UserCog },
  { value: 'team_public',        label: '파트 전체에 공유', desc: '모든 구성원이 열람',            icon: Users2 },
  { value: 'anonymous_template', label: '익명 템플릿',      desc: '이름 없이 템플릿으로 공유',      icon: FileText },
]

interface Props {
  value: Visibility
  onChange: (v: Visibility) => void
}

export function VisibilitySelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all',
              active
                ? 'border-brand-500 bg-brand-50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <opt.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
            <div>
              <div className={cn('text-sm font-semibold', active ? 'text-brand-700' : 'text-slate-700')}>{opt.label}</div>
              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{opt.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
