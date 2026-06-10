import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

const ICON = {
  success: { icon: CheckCircle2, color: 'text-green-500', ring: 'border-green-100' },
  error: { icon: XCircle, color: 'text-red-500', ring: 'border-red-100' },
  info: { icon: Info, color: 'text-brand-500', ring: 'border-brand-100' },
}

export function Toaster() {
  const { toasts, remove } = useToastStore()
  return (
    <div aria-live="polite" aria-atomic="true" className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-[320px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const cfg = ICON[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border ${cfg.ring} px-4 py-3`}
            >
              <cfg.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
              <p className="flex-1 text-sm text-slate-700 leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="알림 닫기" className="text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
