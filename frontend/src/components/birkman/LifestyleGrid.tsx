import { motion } from 'framer-motion'
import { BIRKMAN_COLORS } from '../../lib/utils'

interface Props {
  usualX: number
  usualY: number
  needX: number
  needY: number
  primaryColor: string
}

/**
 * 버크만 라이프스타일 그리드 (캐노니컬 4사분면)
 *   X축: 업무중심(왼쪽) ↔ 관계중심(오른쪽)
 *   Y축: 신중·간접(아래) ↔ 적극·직접(위)
 *   - 좌상(Red):    업무 + 직접 → 행동가
 *   - 우상(Green):  관계 + 직접 → 소통가
 *   - 좌하(Yellow): 업무 + 간접 → 조직가
 *   - 우하(Blue):   관계 + 간접 → 기획가
 * Usual(평소 행동)은 채워진 점, Need(내면의 욕구)는 테두리 점으로 표시.
 */
export function LifestyleGrid({ usualX, usualY, needX, needY, primaryColor }: Props) {
  const toPct = (x: number, y: number) => ({
    left: ((x + 50) / 100) * 100,
    top: ((50 - y) / 100) * 100,
  })
  const usual = toPct(usualX, usualY)
  const need = toPct(needX, needY)

  const quadrants = [
    { color: 'red',    label: '행동가',   sub: 'Doer',         pos: 'top-0 left-0',     align: 'items-start justify-start text-left' },
    { color: 'green',  label: '소통가',   sub: 'Communicator', pos: 'top-0 right-0',    align: 'items-start justify-end text-right' },
    { color: 'yellow', label: '조직가',   sub: 'Organizer',    pos: 'bottom-0 left-0',  align: 'items-end justify-start text-left' },
    { color: 'blue',   label: '기획가',   sub: 'Planner',      pos: 'bottom-0 right-0', align: 'items-end justify-end text-right' },
  ]

  const primaryHex = BIRKMAN_COLORS[primaryColor]?.hex ?? '#6366f1'

  return (
    <div className="relative">
      {/* Axis labels */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500">↑ 적극 · 직접</div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500">신중 · 간접 ↓</div>
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-500 whitespace-nowrap">← 업무중심</div>
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 rotate-90 text-xs font-semibold text-slate-500 whitespace-nowrap">관계중심 →</div>

      <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white">
        {quadrants.map((q) => (
          <div
            key={q.color}
            className={`absolute w-1/2 h-1/2 ${q.pos} flex p-3 ${q.align}`}
            style={{ backgroundColor: `${BIRKMAN_COLORS[q.color].hex}10` }}
          >
            <span className="leading-tight" style={{ color: BIRKMAN_COLORS[q.color].hex }}>
              <span className="block text-[12px] font-bold">{q.label}</span>
              <span className="block text-[9px] font-semibold opacity-70">{q.sub}</span>
            </span>
          </div>
        ))}

        {/* Grid lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />

        {/* Connector line between Usual and Need */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          <line
            x1={`${usual.left}%`} y1={`${usual.top}%`}
            x2={`${need.left}%`} y2={`${need.top}%`}
            stroke={primaryHex} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"
          />
        </svg>

        {/* Need point (outline) */}
        <motion.div
          className="absolute z-10"
          style={{ left: `${need.left}%`, top: `${need.top}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.45, stiffness: 200 }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <div
              className="w-5 h-5 rounded-full border-[3px] bg-white shadow-md"
              style={{ borderColor: primaryHex }}
            />
          </div>
        </motion.div>

        {/* Usual point (filled) */}
        <motion.div
          className="absolute z-20"
          style={{ left: `${usual.left}%`, top: `${usual.top}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.3, stiffness: 200 }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 rounded-full border-[3px] border-white shadow-lg" style={{ backgroundColor: primaryHex }} />
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: primaryHex }} />
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryHex }} /> 평소 행동
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-[2px] bg-white" style={{ borderColor: primaryHex }} /> 내면의 욕구
        </span>
      </div>
    </div>
  )
}
