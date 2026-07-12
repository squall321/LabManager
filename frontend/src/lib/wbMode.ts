import type { WBMode } from '../types'

/** 프로젝트 렌즈(mode) 표시용 메타 */
export const MODE_META: Record<WBMode, { label: string; short: string; desc: string; badge: string }> = {
  discovery: {
    label: '기회 발굴',
    short: '발굴',
    desc: '무엇을 만들지 — 자동화/시스템으로 만들 가치가 있는지 검증',
    badge: 'bg-brand-50 text-brand-700',
  },
  simulation: {
    label: '시뮬레이션 계획',
    short: '시뮬',
    desc: '이 문제/컨셉을 어떻게 해석(시뮬레이션)할지 계획하고 검증',
    badge: 'bg-violet-50 text-violet-700',
  },
}

export const modeLabel = (m?: string) => MODE_META[(m as WBMode)] ?? MODE_META.discovery
