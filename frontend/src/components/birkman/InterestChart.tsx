import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell,
} from 'recharts'

interface Props {
  interests: Record<string, number>
}

const INTEREST_NAMES: Record<string, string> = {
  artistic: '예술적 창작',
  scientific: '과학/기술',
  social_service: '사회봉사/교육',
  persuasive: '비즈니스/설득',
  numerical: '수리/분석',
  clerical: '사무/행정',
  mechanical: '기계/공학',
  outdoor: '야외/자연',
}

export function InterestChart({ interests }: Props) {
  const data = Object.entries(interests)
    .map(([key, value]) => ({ name: INTEREST_NAMES[key] || key, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
        <XAxis type="number" domain={[0, 99]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fill: '#475569', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontSize: 13,
          }}
          formatter={(v: number) => [`${v}점`, '관심도']}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.value === max ? '#6366f1' : `rgba(99,102,241,${0.3 + (entry.value / max) * 0.5})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
