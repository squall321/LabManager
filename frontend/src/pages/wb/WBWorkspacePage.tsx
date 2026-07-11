import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Compass, Loader2, ArrowLeft, ArrowRight, Lightbulb, Users2, Map, AlertTriangle,
  MessageSquare as MessageSquareQuote, ListChecks, Gauge, FileDown, Plus, Trash2, Wand2, Copy, Check,
  Download, Sparkles, UserPlus, CheckCircle2, RotateCcw, Mic,
} from 'lucide-react'
import * as api from '../../services/api'
import { getWBMeta } from '../../services/api'
import { toast } from '../../store/toastStore'
import { LLMBridge } from '../../components/wb/LLMBridge'
import { InterviewBridge } from '../../components/wb/InterviewBridge'
import { BIRKMAN_COLORS } from '../../lib/utils'
import type { WBProject, WBMeta, WBPersona, PersonaCandidate, WBPain, WBPRFAQ, WBFeature, WBValidation } from '../../types'
import { cn } from '../../lib/utils'

const STEPS = [
  { key: 'idea', label: 'Idea Canvas', icon: Lightbulb },
  { key: 'persona', label: '페르소나', icon: Users2 },
  { key: 'ditl', label: 'Day in the Life', icon: Map },
  { key: 'pain', label: 'Pain Cluster', icon: AlertTriangle },
  { key: 'prfaq', label: 'PR/FAQ', icon: MessageSquareQuote },
  { key: 'feature', label: '기능 백로그', icon: ListChecks },
  { key: 'validation', label: '검증 & MVP', icon: Gauge },
  { key: 'report', label: '리포트', icon: FileDown },
] as const

export default function WBWorkspacePage() {
  const { pid: pidStr } = useParams()
  const pid = Number(pidStr)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<string>('idea')
  const [interview, setInterview] = useState(false)

  const { data: project, isLoading } = useQuery<WBProject>({ queryKey: ['wb-project', pid], queryFn: () => api.getWBProject(pid), retry: false })
  const { data: meta } = useQuery<WBMeta>({ queryKey: ['wb-meta'], queryFn: getWBMeta })
  // 단계 완료 상태(가이드) — 하위 스텝과 같은 queryKey라 캐시 공유
  const { data: personas } = useQuery<WBPersona[]>({ queryKey: ['wb-personas', pid], queryFn: () => api.listPersonas(pid) })
  const { data: pains } = useQuery<WBPain[]>({ queryKey: ['wb-pains', pid], queryFn: () => api.listPains(pid) })
  const { data: features } = useQuery<WBFeature[]>({ queryKey: ['wb-features', pid], queryFn: () => api.listFeatures(pid) })
  const { data: prfaq } = useQuery<WBPRFAQ | null>({ queryKey: ['wb-prfaq', pid], queryFn: () => api.getPRFAQ(pid).catch(() => null), retry: false })
  const { data: validation } = useQuery<WBValidation | null>({ queryKey: ['wb-validation', pid], queryFn: () => api.getValidation(pid).catch(() => null), retry: false })

  const done: Record<string, boolean> = {
    idea: !!(project?.current_problem || project?.one_liner),
    persona: (personas?.length ?? 0) > 0,
    ditl: (personas ?? []).some((p) => p.scenarios?.length > 0),
    pain: (pains?.length ?? 0) > 0,
    prfaq: !!prfaq?.headline,
    feature: (features?.length ?? 0) > 0,
    validation: (validation?.total ?? 0) > 0,
    report: true,
  }
  const nextStep = STEPS.find((s) => s.key !== 'report' && !done[s.key])?.key

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
  if (!project || !meta) return (
    <div className="text-center py-20">
      <p className="text-slate-500 mb-4">프로젝트를 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/wb')} className="btn-secondary">프로젝트 목록</button>
    </div>
  )

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/wb')} className="btn-ghost -ml-2"><ArrowLeft className="w-4 h-4" /> 프로젝트 목록</button>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-1"><Compass className="w-4 h-4" /> Working Backwards</div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.one_liner && <p className="text-slate-500 mt-0.5">{project.one_liner}</p>}
        </div>
        <button onClick={() => setInterview(true)} className="btn-secondary text-sm flex-shrink-0 whitespace-nowrap">
          <Mic className="w-4 h-4" /> 인터뷰로 채우기
        </button>
      </motion.div>

      {interview && (
        <InterviewBridge pid={pid} version={project.version} onClose={() => setInterview(false)}
          onApplied={() => {
            // 이 프로젝트에 관련된 캐시만 새로고침
            for (const key of ['wb-project', 'wb-personas', 'wb-pains', 'wb-features', 'wb-prfaq', 'wb-validation', 'wb-export']) {
              queryClient.invalidateQueries({ queryKey: [key, pid] })
            }
          }} />
      )}

      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        {/* Step nav */}
        <div className="lg:sticky lg:top-4 h-fit">
          {(() => {
            const doneCount = STEPS.filter((s) => s.key !== 'report' && done[s.key]).length
            const totalCount = STEPS.length - 1
            return (
              <div className="hidden lg:block mb-3 px-1">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>진행</span><span>{doneCount} / {totalCount}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(doneCount / totalCount) * 100}%` }} />
                </div>
              </div>
            )
          })()}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {STEPS.map((s, i) => {
              const isDone = done[s.key]
              const isNext = nextStep === s.key
              return (
                <button key={s.key} onClick={() => setStep(s.key)}
                  className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    step === s.key ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50')}>
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                    isDone ? 'bg-green-500 text-white' : step === s.key ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500')}>
                    {isDone ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="flex-1 text-left">{s.label}</span>
                  {isNext && <span className="text-[10px] font-semibold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded-full">다음</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="min-w-0">
          {step === 'idea' && <IdeaStep project={project} meta={meta} />}
          {step === 'persona' && <PersonaStep pid={pid} />}
          {step === 'ditl' && <DITLStep pid={pid} meta={meta} goStep={setStep} />}
          {step === 'pain' && <PainStep pid={pid} />}
          {step === 'prfaq' && <PRFAQStep pid={pid} />}
          {step === 'feature' && <FeatureStep pid={pid} />}
          {step === 'validation' && <ValidationStep pid={pid} meta={meta} />}
          {step === 'report' && <ReportStep pid={pid} name={project.name} status={project.status} />}

          {/* 단계 이동 푸터 */}
          {(() => {
            const idx = STEPS.findIndex((s) => s.key === step)
            const prev = idx > 0 ? STEPS[idx - 1] : null
            const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null
            return (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                {prev ? (
                  <button onClick={() => setStep(prev.key)} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> {prev.label}</button>
                ) : <span />}
                {next && (
                  <button onClick={() => setStep(next.key)} className="btn-primary text-sm">다음: {next.label} <ArrowRight className="w-4 h-4" /></button>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Idea Canvas ──
function IdeaStep({ project, meta }: { project: WBProject; meta: WBMeta }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: project.name, domain: project.domain, one_liner: project.one_liner, current_problem: project.current_problem,
    target_user: project.target_user, expected_benefit: project.expected_benefit,
    current_alternative: project.current_alternative, success_criteria: project.success_criteria, not_doing: project.not_doing,
  })
  const saveMut = useMutation({
    // 낙관적 잠금: 읽은 버전을 되보내 다른 곳의 수정을 덮어쓰지 않게 함
    mutationFn: () => api.updateWBProject(project.id, { ...form, expected_version: project.version }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wb-project', project.id] }); toast.success('저장했어요') },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toast.error('다른 곳에서 먼저 수정됐어요. 새로고침 후 다시 저장해 주세요.')
        queryClient.invalidateQueries({ queryKey: ['wb-project', project.id] })
      } else toast.error('저장 실패')
    },
  })
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const field = (k: keyof typeof form, label: string, ph = '', area = false) => (
    <div>
      <label className="label">{label}</label>
      {area
        ? <textarea className="input-field mt-1.5 min-h-[64px]" value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
        : <input className="input-field mt-1.5" value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />}
    </div>
  )
  return (
    <div className="card space-y-4">
      <h2 className="section-title">Idea Canvas</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {field('name', '아이디어 이름 *')}
        <div>
          <label className="label">업무 유형</label>
          <select className="input-field mt-1.5" value={form.domain} onChange={(e) => set('domain', e.target.value)}>
            {meta.domains.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
          </select>
        </div>
      </div>
      {field('one_liner', '한 줄 설명')}
      {field('current_problem', '현재 문제', '지금 무엇이 불편/비효율인가', true)}
      <div className="grid md:grid-cols-2 gap-4">
        {field('target_user', '대상 사용자')}
        {field('current_alternative', '기존 대체 수단', '엑셀·스크립트·수동 리포트')}
      </div>
      {field('expected_benefit', '기대 효과', '', true)}
      <div className="grid md:grid-cols-2 gap-4">
        {field('success_criteria', '성공 기준')}
        {field('not_doing', '하지 않을 것')}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">이름과 현재 문제만 채워도 AI로 나머지를 확장할 수 있어요.</p>
        <button onClick={() => saveMut.mutate()} disabled={!form.name.trim() || saveMut.isPending} className="btn-primary">
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Persona ──
function PersonaStep({ pid }: { pid: number }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [bridge, setBridge] = useState(false)
  const { data: personas } = useQuery<WBPersona[]>({ queryKey: ['wb-personas', pid], queryFn: () => api.listPersonas(pid) })
  const { data: candidates } = useQuery<PersonaCandidate[]>({ queryKey: ['wb-candidates'], queryFn: api.getPersonaCandidates })
  const { data: meta } = useQuery<WBMeta>({ queryKey: ['wb-meta'], queryFn: getWBMeta })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['wb-personas', pid] })

  const addPreset = useMutation({
    mutationFn: (r: any) => api.addPersona(pid, { name: r.role, role: r.role, goals: r.goals, pains: r.pains, fears: r.fears }),
    onSuccess: inval,
  })

  const addFromCandidate = useMutation({
    mutationFn: (c: PersonaCandidate) => api.addPersona(pid, { name: c.name, role: '이해관계자', source_user_id: c.user_id }),
    onSuccess: () => { inval(); toast.success('페르소나를 추가했어요') },
    onError: () => toast.error('추가 실패'),
  })
  const addBlank = useMutation({
    mutationFn: () => api.addPersona(pid, { name: '새 페르소나', role: '' }),
    onSuccess: () => { inval() },
  })
  const genToday = useMutation({
    mutationFn: () => api.genTodayStatements(pid),
    onSuccess: () => { inval(); toast.success("Today's Statement를 생성했어요") },
  })
  const del = useMutation({ mutationFn: (id: number) => api.deletePersona(pid, id), onSuccess: inval })

  const existingSources = new Set((personas ?? []).map((p) => p.source_user_id))

  return (
    <div className="space-y-4">
      {/* 실제 동료(협업 스타일) 후보 */}
      <div className="card">
        <h2 className="section-title mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> 실제 동료로 페르소나 만들기</h2>
        <p className="text-sm text-slate-400 mb-3">공개된 협업 스타일 리포트를 가진 동료. 선택하면 스타일에 맞는 관심사·반론이 자동 채워져요.</p>
        {!candidates || candidates.length === 0 ? (
          <div className="text-sm text-slate-400">
            공개된 협업 스타일 리포트가 아직 없어요.
            <button onClick={() => navigate('/survey')} className="text-brand-600 hover:underline ml-1">진단을 완료하고 공개</button>
            하면 동료를 실제 페르소나로 쓸 수 있어요.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => (
              <button key={c.user_id} disabled={existingSources.has(c.user_id) || addFromCandidate.isPending}
                onClick={() => addFromCandidate.mutate(c)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-brand-300 text-sm disabled:opacity-40 transition-all">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BIRKMAN_COLORS[c.style_code]?.hex }} />
                {c.name} <span className="text-xs text-slate-400">{c.keyword}</span>
                {existingSources.has(c.user_id) ? <Check className="w-3.5 h-3.5 text-green-500" /> : <UserPlus className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 역할 프리셋 빠른 추가 (CAE 기본 이해관계자) */}
      {meta && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-1 text-sm">역할 프리셋으로 빠르게 추가</h3>
          <p className="text-xs text-slate-400 mb-3">전형적인 이해관계자를 관심사·두려움과 함께 한 번에 추가해요.</p>
          <div className="flex flex-wrap gap-2">
            {meta.role_presets.map((r) => (
              <button key={r.role} onClick={() => addPreset.mutate(r)} disabled={addPreset.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-brand-300 text-sm transition-all">
                <Plus className="w-3.5 h-3.5 text-slate-400" /> {r.role}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">페르소나 {personas?.length ? `(${personas.length})` : ''}</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setBridge(true)} className="btn-secondary text-sm"><Wand2 className="w-4 h-4" /> AI로 페르소나 만들기</button>
          {personas && personas.length > 0 && (
            <button onClick={() => genToday.mutate()} disabled={genToday.isPending} className="btn-secondary text-sm">
              {genToday.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Today's Statement 생성</>}
            </button>
          )}
          <button onClick={() => addBlank.mutate()} className="btn-secondary text-sm"><Plus className="w-4 h-4" /> 빈 페르소나</button>
        </div>
      </div>
      {bridge && <LLMBridge pid={pid} step="personas" title="페르소나 5종 만들기" onClose={() => setBridge(false)} onApplied={inval} />}

      {!personas || personas.length === 0 ? (
        <div className="card text-center py-10 text-sm text-slate-400">위에서 동료를 선택하거나 빈 페르소나를 추가하세요.</div>
      ) : personas.map((p) => <PersonaCard key={p.id} pid={pid} persona={p} onDelete={() => del.mutate(p.id)} onChange={inval} />)}
    </div>
  )
}

function PersonaCard({ pid, persona, onDelete, onChange }: { pid: number; persona: WBPersona; onDelete: () => void; onChange: () => void }) {
  const [f, setF] = useState({ name: persona.name, role: persona.role, goals: persona.goals, fears: persona.fears, comm_style: persona.comm_style, today_statement: persona.today_statement })
  const save = useMutation({ mutationFn: () => api.updatePersona(pid, persona.id, f), onSuccess: () => { onChange(); toast.success('저장했어요') }, onError: () => toast.error('저장 실패') })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {persona.style_code && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BIRKMAN_COLORS[persona.style_code]?.hex }} />}
          <input className="font-semibold text-slate-900 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none" value={f.name} onChange={(e) => set('name', e.target.value)} />
          <input className="text-sm text-slate-500 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none w-28" value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="역할" />
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="label">관심사</label><textarea className="input-field mt-1 min-h-[52px] text-sm" value={f.goals} onChange={(e) => set('goals', e.target.value)} /></div>
        <div><label className="label">두려움</label><textarea className="input-field mt-1 min-h-[52px] text-sm" value={f.fears} onChange={(e) => set('fears', e.target.value)} /></div>
      </div>
      <div className="mt-3"><label className="label">소통 방식</label><textarea className="input-field mt-1 min-h-[44px] text-sm" value={f.comm_style} onChange={(e) => set('comm_style', e.target.value)} /></div>
      <div className="mt-3"><label className="label">Today's Statement</label><textarea className="input-field mt-1 min-h-[52px] text-sm" value={f.today_statement} onChange={(e) => set('today_statement', e.target.value)} placeholder="자동 생성 버튼으로 채우거나 직접 작성" /></div>
      <div className="flex justify-end mt-3"><button onClick={() => save.mutate()} disabled={save.isPending} className="btn-secondary text-sm">{save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}</button></div>
    </div>
  )
}

// ── Step 3: Day in the Life ──
function DITLStep({ pid, meta, goStep }: { pid: number; meta: WBMeta; goStep: (s: string) => void }) {
  const { data: personas } = useQuery<WBPersona[]>({ queryKey: ['wb-personas', pid], queryFn: () => api.listPersonas(pid) })
  if (!personas || personas.length === 0) return (
    <div className="card text-center py-10">
      <Users2 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 mb-3">하루 시나리오는 페르소나별로 만들어요. 먼저 페르소나를 추가하세요.</p>
      <button onClick={() => goStep('persona')} className="btn-secondary text-sm"><ArrowLeft className="w-4 h-4" /> 페르소나 단계로</button>
    </div>
  )
  return <div className="space-y-4">{personas.map((p) => <DITLCard key={p.id} pid={pid} persona={p} timeBlocks={meta.time_blocks} />)}</div>
}

function DITLCard({ pid, persona, timeBlocks }: { pid: number; persona: WBPersona; timeBlocks: string[] }) {
  const queryClient = useQueryClient()
  const [bridge, setBridge] = useState(false)
  const [rows, setRows] = useState(persona.scenarios.length ? persona.scenarios.map((s) => ({ ...s })) : timeBlocks.map((t, i) => ({ time_block: t, activity: '', pain_point: '', opportunity: '', order: i })))
  const save = useMutation({
    mutationFn: () => api.setScenarios(pid, persona.id, rows),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wb-personas', pid] }); toast.success('시나리오를 저장했어요') },
    onError: () => toast.error('저장 실패'),
  })
  const setRow = (i: number, k: string, v: string) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r))
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          {persona.style_code && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BIRKMAN_COLORS[persona.style_code]?.hex }} />}
          {persona.name}의 하루
        </h3>
        <button onClick={() => setBridge(true)} className="btn-secondary !py-1.5 text-xs"><Wand2 className="w-3.5 h-3.5" /> AI로 채우기</button>
      </div>
      {bridge && <LLMBridge pid={pid} step="ditl" personaId={persona.id} title={`${persona.name}의 하루 시나리오`}
        onClose={() => setBridge(false)} onApplied={() => queryClient.invalidateQueries({ queryKey: ['wb-personas', pid] })} />}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[70px_1fr_1fr] gap-2 items-center">
            <span className="text-xs font-medium text-slate-500">{r.time_block}</span>
            <input className="input-field !py-2 text-sm" value={r.activity} onChange={(e) => setRow(i, 'activity', e.target.value)} placeholder="하는 일" />
            <input className="input-field !py-2 text-sm" value={r.pain_point} onChange={(e) => setRow(i, 'pain_point', e.target.value)} placeholder="문제/불편" />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3"><button onClick={() => save.mutate()} disabled={save.isPending} className="btn-secondary text-sm">{save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}</button></div>
    </div>
  )
}

// ── Step 4: Pain Cluster ──
function PainStep({ pid }: { pid: number }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [bridge, setBridge] = useState(false)
  const { data: pains } = useQuery<WBPain[]>({ queryKey: ['wb-pains', pid], queryFn: () => api.listPains(pid) })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['wb-pains', pid] })
  const add = useMutation({ mutationFn: () => api.addPain(pid, { title, description: '' }), onSuccess: () => { setTitle(''); inval() } })
  const del = useMutation({ mutationFn: (id: number) => api.deletePain(pid, id), onSuccess: inval })
  const imp = useMutation({
    mutationFn: () => api.importPains(pid),
    onSuccess: (r) => { inval(); toast.success(`${r.imported}건 가져왔어요`) },
    onError: () => toast.error('가져오기 실패'),
  })
  const badge = (s: string) => s === 'friction' ? 'WorkCraft 불편함' : s === 'reflection' ? '협업 회고' : s === 'llm' ? 'AI' : '직접'
  return (
    <div className="space-y-4">
      {bridge && <LLMBridge pid={pid} step="pains" title="공통 문제(Pain) 묶기" onClose={() => setBridge(false)} onApplied={inval} />}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="section-title">Pain Cluster</h2>
          <div className="flex gap-2">
            <button onClick={() => setBridge(true)} className="btn-secondary text-sm"><Wand2 className="w-4 h-4" /> AI로 추출</button>
            <button onClick={() => imp.mutate()} disabled={imp.isPending} className="btn-secondary text-sm">
              {imp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> WorkCraft에서 가져오기</>}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-3">공유 불편함·협업 회고(익명)에서 실제 반복 문제를 시드할 수 있어요.</p>
        <div className="flex gap-2">
          <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문제 그룹 추가 (예: 반복 세팅)"
            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) add.mutate() }} />
          <button onClick={() => add.mutate()} disabled={!title.trim() || add.isPending} className="btn-primary"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      {pains && pains.length > 0 && (
        <div className="space-y-2">
          {pains.map((p) => (
            <div key={p.id} className="card !py-3 flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{p.title}</span>
                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded', p.source === 'manual' ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-600')}>{badge(p.source)}</span>
                </div>
                {p.description && <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>}
              </div>
              <button onClick={() => del.mutate(p.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 5: PR/FAQ ──
function PRFAQStep({ pid }: { pid: number }) {
  const queryClient = useQueryClient()
  const [bridge, setBridge] = useState(false)
  const inval = () => queryClient.invalidateQueries({ queryKey: ['wb-prfaq', pid] })
  const { data, isLoading } = useQuery<WBPRFAQ | null>({ queryKey: ['wb-prfaq', pid], queryFn: () => api.getPRFAQ(pid).catch(() => null), retry: false })
  const gen = useMutation({
    mutationFn: () => api.genPRFAQ(pid),
    onSuccess: () => { inval(); toast.success('PR/FAQ 초안을 생성했어요') },
    onError: () => toast.error('생성 실패'),
  })
  const bridgeEl = bridge && <LLMBridge pid={pid} step="prfaq" title="PR/FAQ 작성" onClose={() => setBridge(false)} onApplied={inval} />
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
  if (!data) return (
    <>
      {bridgeEl}
      <div className="card text-center py-12">
        <MessageSquareQuote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 mb-4">템플릿으로 초안을 만들거나, AI로 더 풍부하게 작성해보세요.<br />페르소나 스타일 기반 반론이 자동 포함됩니다.</p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => gen.mutate()} disabled={gen.isPending} className="btn-secondary">
            {gen.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '템플릿 초안'}
          </button>
          <button onClick={() => setBridge(true)} className="btn-primary"><Wand2 className="w-4 h-4" /> AI로 작성</button>
        </div>
      </div>
    </>
  )
  return <>{bridgeEl}<PRFAQEditor pid={pid} data={data} onRegen={() => gen.mutate()} regenerating={gen.isPending} onAI={() => setBridge(true)} /></>
}

function PRFAQEditor({ pid, data, onRegen, regenerating, onAI }: { pid: number; data: WBPRFAQ; onRegen: () => void; regenerating: boolean; onAI: () => void }) {
  const queryClient = useQueryClient()
  const [f, setF] = useState<WBPRFAQ>({ ...data, faq: data.faq ?? [], risks: data.risks ?? [] })
  const save = useMutation({
    mutationFn: () => api.savePRFAQ(pid, f),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wb-prfaq', pid] }); toast.success('저장했어요') },
    onError: () => toast.error('저장 실패'),
  })
  const set = (k: keyof WBPRFAQ, v: string) => setF((p) => ({ ...p, [k]: v }))
  const setQA = (field: 'faq' | 'risks', i: number, k: 'q' | 'a', v: string) =>
    setF((p) => ({ ...p, [field]: p[field].map((x, j) => j === i ? { ...x, [k]: v } : x) }))
  const ta = (k: keyof WBPRFAQ, label: string) => (
    <div><label className="label">{label}</label><textarea className="input-field mt-1 min-h-[52px] text-sm" value={f[k] as string} onChange={(e) => set(k, e.target.value)} /></div>
  )
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="section-title">PR/FAQ</h2>
        <div className="flex gap-2">
          <button onClick={onAI} className="btn-secondary text-sm"><Wand2 className="w-4 h-4" /> AI로 작성</button>
          <button onClick={onRegen} disabled={regenerating} className="btn-secondary text-sm">{regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : '템플릿 다시'}</button>
        </div>
      </div>
      <div><label className="label">헤드라인</label><input className="input-field mt-1" value={f.headline} onChange={(e) => set('headline', e.target.value)} /></div>
      <div><label className="label">부제목</label><input className="input-field mt-1" value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
      {ta('customer_problem', '고객 문제')}
      {ta('opportunity', '기회 / 자동화 필요성')}
      {ta('solution', '솔루션')}
      {ta('leader_quote', '리더 인용문')}
      {ta('cta', '행동 유도')}
      <div>
        <label className="label">FAQ</label>
        <div className="space-y-2 mt-1">
          {f.faq.map((qa, i) => (
            <div key={i} className="space-y-1">
              <input className="input-field !py-2 text-sm font-medium" value={qa.q} onChange={(e) => setQA('faq', i, 'q', e.target.value)} placeholder="질문" />
              <input className="input-field !py-2 text-sm" value={qa.a} onChange={(e) => setQA('faq', i, 'a', e.target.value)} placeholder="답변" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="label flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 리스크 · 반론 <span className="text-[11px] text-slate-400">(페르소나 스타일 기반 자동 초안)</span></label>
        <div className="space-y-2 mt-1">
          {f.risks.map((qa, i) => (
            <div key={i} className="space-y-1">
              <input className="input-field !py-2 text-sm font-medium" value={qa.q} onChange={(e) => setQA('risks', i, 'q', e.target.value)} placeholder="예상 반론" />
              <input className="input-field !py-2 text-sm" value={qa.a} onChange={(e) => setQA('risks', i, 'a', e.target.value)} placeholder="대응 (직접 작성)" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end"><button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">{save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}</button></div>
    </div>
  )
}

// ── Step 6: Feature Backlog ──
function FeatureStep({ pid }: { pid: number }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', priority: 3, reason: '' })
  const [bridge, setBridge] = useState(false)
  const { data: features } = useQuery<WBFeature[]>({ queryKey: ['wb-features', pid], queryFn: () => api.listFeatures(pid) })
  const inval = () => queryClient.invalidateQueries({ queryKey: ['wb-features', pid] })
  const add = useMutation({ mutationFn: () => api.addFeature(pid, form), onSuccess: () => { setForm({ name: '', priority: 3, reason: '' }); inval() } })
  const del = useMutation({ mutationFn: (id: number) => api.deleteFeature(pid, id), onSuccess: inval })
  return (
    <div className="space-y-4">
      {bridge && <LLMBridge pid={pid} step="features" title="기능 도출·우선순위" onClose={() => setBridge(false)} onApplied={inval} />}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">기능 백로그</h2>
          <button onClick={() => setBridge(true)} className="btn-secondary text-sm"><Wand2 className="w-4 h-4" /> AI로 도출</button>
        </div>
        <div className="grid md:grid-cols-[1fr_80px] gap-2">
          <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="기능명 (예: 케이스 자동 생성)" />
          <select className="input-field" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>P{n}</option>)}
          </select>
        </div>
        <input className="input-field mt-2" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="이유 (왜 이 우선순위인가)" />
        <div className="flex justify-end mt-2"><button onClick={() => add.mutate()} disabled={!form.name.trim() || add.isPending} className="btn-primary text-sm"><Plus className="w-4 h-4" /> 추가</button></div>
      </div>
      {features && features.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="px-4 py-2.5 w-12">우선</th><th className="px-4 py-2.5">기능</th><th className="px-4 py-2.5">이유</th><th></th></tr></thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 group">
                  <td className="px-4 py-2.5"><span className="inline-flex w-6 h-6 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">{f.priority}</span></td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{f.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{f.reason}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => del.mutate(f.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Step 7: Validation & MVP ──
function liveVerdict(total: number, max: number): string {
  const r = max ? total / max : 0
  if (r >= 0.75) return '자동화/시스템으로 만들 가치가 높아요. 단, 1차 MVP는 작게 시작하세요.'
  if (r >= 0.5) return '가치가 있으나 범위를 좁혀 검증부터 하는 게 좋아요.'
  if (total === 0) return '항목을 평가해 총점을 매겨보세요.'
  return '아직 근거가 약해요. 문제 정의와 이해관계자를 더 확인하세요.'
}

function ValidationStep({ pid, meta }: { pid: number; meta: WBMeta }) {
  const queryClient = useQueryClient()
  const { data } = useQuery<WBValidation | null>({ queryKey: ['wb-validation', pid], queryFn: () => api.getValidation(pid).catch(() => null), retry: false })
  const { data: hints } = useQuery<any>({ queryKey: ['wb-hints', pid], queryFn: () => api.getValidationHints(pid) })
  const [scores, setScores] = useState<Record<string, number>>({})
  useEffect(() => { if (data?.scores) setScores(data.scores) }, [data])
  const save = useMutation({
    mutationFn: () => api.saveValidation(pid, { scores, note: data?.note || '' }),
    onSuccess: (v) => { queryClient.invalidateQueries({ queryKey: ['wb-validation', pid] }); setScores(v.scores); toast.success(`총점 ${v.total}/${meta.validation_max}`) },
    onError: () => toast.error('저장 실패'),
  })
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const applyHint = (key: string) => hints?.[key] != null && setScores((s) => ({ ...s, [key]: hints[key] }))
  const radarData = meta.validation_items.map((it) => ({ item: it.label, score: scores[it.key] || 0 }))
  const ratio = total / meta.validation_max
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">검증 점수 & MVP</h2>
        <div className="text-right">
          <span className={cn('text-2xl font-bold', ratio >= 0.75 ? 'text-green-600' : ratio >= 0.5 ? 'text-amber-500' : 'text-slate-600')}>{total}</span>
          <span className="text-slate-400 text-sm"> / {meta.validation_max}</span>
        </div>
      </div>
      {total > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="item" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      )}
      <div className="space-y-3">
        {meta.validation_items.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-700">{item.label} <span className="text-xs text-slate-400">· {item.question}</span></span>
              <div className="flex items-center gap-2">
                {item.auto && hints?.[item.key] != null && (
                  <button onClick={() => applyHint(item.key)} className="text-[11px] text-brand-600 hover:underline" title={hints.explain?.[item.key]}>추천 {hints[item.key]}</button>
                )}
                <span className="text-sm font-bold text-slate-800 w-4 text-right">{scores[item.key] || '-'}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setScores((s) => ({ ...s, [item.key]: n }))}
                  className={cn('flex-1 h-7 rounded-md text-xs font-medium transition-all',
                    (scores[item.key] || 0) >= n ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {total > 0 && <div className={cn('rounded-xl p-3.5 text-sm border', ratio >= 0.75 ? 'bg-green-50 border-green-100 text-green-800' : ratio >= 0.5 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-600')}>{liveVerdict(total, meta.validation_max)}</div>}
      <div className="flex justify-end"><button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">{save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '판정 저장'}</button></div>
    </div>
  )
}

// ── Step 8: Report ──
function ReportStep({ pid, name, status }: { pid: number; name: string; status: string }) {
  const [copied, setCopied] = useState('')
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ markdown: string; llm_prompt: string }>({ queryKey: ['wb-export', pid], queryFn: () => api.exportWB(pid) })
  const statusMut = useMutation({
    mutationFn: (s: string) => api.updateWBProject(pid, { status: s }),
    onSuccess: (_d, s) => {
      queryClient.invalidateQueries({ queryKey: ['wb-project', pid] })
      queryClient.invalidateQueries({ queryKey: ['wb-projects'] })
      toast.success(s === 'validated' ? '검증 완료로 표시했어요 ✅' : '초안으로 되돌렸어요')
    },
  })
  if (isLoading || !data) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
  const copy = (text: string, which: string) => { navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(''), 1600) }
  const download = () => {
    const blob = new Blob([data.markdown], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}.md`; a.click()
  }
  return (
    <div className="space-y-4">
      {/* 검증 완료 표시 */}
      <div className={cn('card flex items-center justify-between !py-3.5', status === 'validated' ? 'border-green-200 bg-green-50/50' : '')}>
        <div className="flex items-center gap-2 text-sm">
          {status === 'validated'
            ? <><CheckCircle2 className="w-5 h-5 text-green-500" /> <span className="font-semibold text-green-700">검증 완료</span> <span className="text-slate-400">— 착수 판단이 끝난 과제</span></>
            : <><Compass className="w-5 h-5 text-slate-400" /> <span className="text-slate-600">아직 초안 상태예요. 검토가 끝나면 완료로 표시하세요.</span></>}
        </div>
        {status === 'validated'
          ? <button onClick={() => statusMut.mutate('draft')} disabled={statusMut.isPending} className="btn-ghost text-sm"><RotateCcw className="w-4 h-4" /> 초안으로</button>
          : <button onClick={() => statusMut.mutate('validated')} disabled={statusMut.isPending} className="btn-primary text-sm"><CheckCircle2 className="w-4 h-4" /> 검증 완료로 표시</button>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => copy(data.llm_prompt, 'llm')} className="btn-secondary text-sm">{copied === 'llm' ? <><Check className="w-4 h-4" /> 복사됨</> : <><Wand2 className="w-4 h-4" /> Claude 다듬기 프롬프트 복사</>}</button>
        <button onClick={() => copy(data.markdown, 'md')} className="btn-secondary text-sm">{copied === 'md' ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> Markdown 복사</>}</button>
        <button onClick={download} className="btn-primary text-sm"><Download className="w-4 h-4" /> 다운로드</button>
      </div>
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
          <span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-slate-400 ml-2 font-mono">{name}.md</span>
        </div>
        <pre className="p-5 text-[13px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-[65vh]">{data.markdown}</pre>
      </div>
    </div>
  )
}
