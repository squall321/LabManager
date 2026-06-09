import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { checkEmail, login, setPassword } from '../services/api'
import { useAuthStore } from '../store/authStore'

type Step = 'email' | 'login' | 'set-password'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await checkEmail(email)
      setName(res.name)
      setStep(res.password_set ? 'login' : 'set-password')
    } catch (err: any) {
      setError(err.response?.data?.detail || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      setAuth(res.access_token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    try {
      const res = await setPassword(email, password, confirm)
      setAuth(res.access_token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '비밀번호 설정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-brand-300 rounded-full blur-3xl animate-pulse-slow" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold block leading-tight">LabManager</span>
              <span className="text-brand-200 text-xs font-medium">People &amp; Growth Platform</span>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              나를 이해하고<br />성장을 설계하는 공간
            </h1>
            <p className="text-brand-100 text-base leading-relaxed max-w-md mb-7">
              LabManager는 구성원 한 사람 한 사람이 자신의 강점을 발견하고,
              스스로 성장의 방향을 그려가도록 돕는 모듈형 워크스페이스입니다.
              기록과 리포트는 온전히 당신의 것입니다.
            </p>
            <div className="space-y-2.5 max-w-md">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-xs font-bold">BW</span>
                <span className="text-brand-50"><b className="font-semibold">Birkman Workshop</b> · 성향·강점 진단과 리포트</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-75">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">WS</span>
                <span className="text-brand-100"><b className="font-semibold">WorkCraft Studio</b> · 업무 개선 미션 <span className="text-[11px] bg-white/15 px-1.5 py-0.5 rounded">준비 중</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-brand-200 text-sm">
            <ShieldCheck className="w-4 h-4" />
            개인 리포트의 공개 여부는 언제나 본인이 결정합니다
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">LabManager</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 'email' && (
                <form onSubmit={handleEmailCheck}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1.5">시작하기</h2>
                  <p className="text-slate-500 text-sm mb-7">등록된 이메일 주소를 입력해주세요</p>
                  <div className="relative mb-4">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="input-field pl-11"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>다음 <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {step === 'login' && (
                <form onSubmit={handleLogin}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1.5">
                    안녕하세요, {name}님
                  </h2>
                  <p className="text-slate-500 text-sm mb-7">비밀번호를 입력해주세요</p>
                  <div className="relative mb-4">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="비밀번호"
                      className="input-field pl-11"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full mb-3">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '로그인'}
                  </button>
                  <button type="button" onClick={() => { setStep('email'); setError('') }} className="btn-ghost w-full">
                    다른 이메일로 로그인
                  </button>
                </form>
              )}

              {step === 'set-password' && (
                <form onSubmit={handleSetPassword}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1.5">
                    환영합니다, {name}님
                  </h2>
                  <p className="text-slate-500 text-sm mb-7">첫 로그인입니다. 사용할 비밀번호를 설정해주세요</p>
                  <div className="relative mb-3">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="새 비밀번호 (8자 이상)"
                      className="input-field pl-11"
                    />
                  </div>
                  <div className="relative mb-4">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="비밀번호 확인"
                      className="input-field pl-11"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full mb-3">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '비밀번호 설정 후 시작'}
                  </button>
                  <button type="button" onClick={() => { setStep('email'); setError('') }} className="btn-ghost w-full">
                    뒤로
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
