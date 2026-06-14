import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Legend, Tooltip,
} from 'recharts'
import type { ComponentScore } from '../../types'

interface Props {
  components: Record<string, ComponentScore>
  componentNames: Record<string, string>
}

export function ComponentChart({ components, componentNames }: Props) {
  const data = Object.entries(components).map(([key, score]) => ({
    component: componentNames[key] || key,
    '드러나는 스타일': Math.round(score.usual),
    '편한 조건': Math.round(score.need),
  }))

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="component"
          tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
        />
        <Radar
          name="드러나는 스타일"
          dataKey="드러나는 스타일"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Radar
          name="편한 조건"
          dataKey="편한 조건"
          stroke="#ec4899"
          fill="#ec4899"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontSize: 13,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
