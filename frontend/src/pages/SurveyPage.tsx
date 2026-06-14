import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, ClipboardList } from 'lucide-react'
import {
  getSurveyStatus, startSurvey, getSurveyQuestions, submitSection,
} from '../services/api'
import type { SurveySection } from '../types'

export default function SurveyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [surveyId, setSurveyId] = useState<number | null>(null)
  const [section, setSection] = useState<SurveySection | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    setLoading(true)
    try {
      const status = await getSurveyStatus()
      if (status.status === 'completed') {
        setCompleted(true)
        setLoading(false)
        return
      }
      const start = await startSurvey()
      setSurveyId(start.survey_id)
      await loadSection(start.current_section)
    } finally {
      setLoading(false)
    }
  }

  const loadSection = async (sec: number) => {
    const data = await getSurveyQuestions(sec)
    setSection(data)
    setAnswers({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [highlightUnanswered, setHighlightUnanswered] = useState(false)

  const handleAnswer = (qId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const allAnswered = section ? section.questions.every((q) => answers[q.id]) : false
  const remaining = section ? section.questions.filter((q) => !answers[q.id]).length : 0

  const scrollToFirstUnanswered = () => {
    if (!section) return
    const first = section.questions.find((q) => !answers[q.id])
    if (first) {
      setHighlightUnanswered(true)
      document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setHighlightUnanswered(false), 2400)
    }
  }

  const handleSubmit = async () => {
    if (!section || !surveyId || !allAnswered) return
    setSubmitting(true)
    try {
      const responses = section.questions.map((q) => ({
        question_id: q.id,
        response: answers[q.id],
      }))
      const res = await submitSection(surveyId, section.section, responses)
      if (res.status === 'completed') {
        await queryClient.invalidateQueries({ queryKey: ['survey-status'] })
        await queryClient.invalidateQueries({ queryKey: ['my-report'] })
        setCompleted(true)
      } else {
        await loadSection(res.next_section)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-11 h-11 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">진단이 완료되었습니다!</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          모든 문항에 응답해주셔서 감사합니다.<br />
          분석된 리포트를 지금 확인해보세요.
        </p>
        <button onClick={() => navigate('/report')} className="btn-primary">
          내 리포트 보기 <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  if (!section) return null

  const progress = (section.section / section.total_sections) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-600 text-sm font-semibold mb-2">
          <ClipboardList className="w-4 h-4" />
          협업 스타일 워크샵
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{section.section_title}</h1>
        <p className="text-slate-500 text-sm">
          섹션 {section.section} / {section.total_sections} · {section.section_subtitle}
        </p>
        {section.section === 1 && (
          <p className="text-xs text-slate-400 mt-3 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
            본 워크샵은 특정 상용 진단도구의 공식 프로그램이 아니며, 팀 내 협업 방식과 업무 선호를
            탐색하기 위한 자체 활동입니다. 개인 평가나 인사 판단에 사용하지 않습니다.
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>진행률</span>
            <span>{Object.keys(answers).length} / {section.questions.length}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={section.section}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-4"
        >
          {section.questions.map((q, idx) => (
            <motion.div
              key={q.id}
              id={`q-${q.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`card transition-shadow ${
                highlightUnanswered && !answers[q.id] ? 'ring-2 ring-amber-300 shadow-md' : ''
              }`}
            >
              <div className="flex gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-50 text-brand-600 text-sm font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-slate-800 font-medium pt-0.5">{q.text}</p>
              </div>
              <div className="flex gap-2 pl-10">
                {section.scale_labels.map((label, i) => {
                  const value = i + 1
                  const selected = answers[q.id] === value
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(q.id, value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all duration-150 ${
                        selected
                          ? 'border-brand-500 bg-brand-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                        }`}
                      >
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className={`text-[11px] leading-tight text-center ${selected ? 'text-brand-700 font-medium' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Footer actions */}
      <div className="sticky bottom-0 mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" /> 나중에 하기
          </button>
          <div className="flex items-center gap-3">
            {!allAnswered && (
              <button onClick={scrollToFirstUnanswered} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                {remaining}개 문항이 남았어요 →
              </button>
            )}
            <button
              onClick={allAnswered ? handleSubmit : scrollToFirstUnanswered}
              disabled={submitting}
              className="btn-primary min-w-[140px]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : !allAnswered ? (
                <>남은 문항으로 <ArrowRight className="w-4 h-4" /></>
              ) : section.section === section.total_sections ? (
                <>제출하고 완료 <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>다음 섹션 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
