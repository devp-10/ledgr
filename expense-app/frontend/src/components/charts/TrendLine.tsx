import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthTrend } from '../../types'
import { format, parseISO } from 'date-fns'

interface TrendLineProps {
  data: MonthTrend[]
  targetRate?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const isRate = payload[0]?.dataKey === 'savingsRate'
  return (
    <div className="chart-tooltip">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="font-money text-white font-semibold gradient-text">
        {isRate ? `${val}%` : `$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
      </div>
    </div>
  )
}

export function TrendLine({ data, targetRate }: TrendLineProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-white/30">No trend data</div>
  )

  const formatted = data.map(d => ({
    month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM yy') } catch { return d.month } })(),
    spending: Math.abs(d.spending),
    income: d.income,
    savingsRate: d.income > 0 ? Math.round(((d.income - Math.abs(d.spending)) / d.income) * 100) : 0,
  }))

  const useRate = targetRate !== undefined
  const dataKey = useRate ? 'savingsRate' : 'spending'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
            <stop offset="60%" stopColor="#22D3EE" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
          axisLine={false}
          tickLine={false}
          width={42}
          tickFormatter={v => useRate ? `${v}%` : `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.4)', strokeWidth: 1, strokeDasharray: '4 2' }} />
        {targetRate !== undefined && (
          <ReferenceLine
            y={targetRate}
            stroke="#10B981"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: `${targetRate}% target`, fill: 'rgba(52,211,153,0.7)', fontSize: 10, position: 'insideTopRight' }}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="url(#trendStroke)"
          strokeWidth={2.5}
          fill="url(#trendFill)"
          dot={false}
          activeDot={{ r: 5, fill: '#a78bfa', stroke: '#070711', strokeWidth: 2, filter: 'url(#glow)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
