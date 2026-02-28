import {
  ComposedChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthTrend } from '../../lib/api'
import { format, parseISO } from 'date-fns'

interface NetCashFlowBarProps {
  data: MonthTrend[]
  compareData?: MonthTrend[]
}

const POS = '#4a9d5b'
const NEG = '#c0392b'
const COMPARE_COLOR = '#94a3b8'

function toLabel(month: string) {
  try { return format(parseISO(`${month}-01`), 'MMM yy') } catch { return month }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const net = payload.find((p: any) => p.dataKey === 'net')?.value ?? 0
  const prev = payload.find((p: any) => p.dataKey === 'compareNet')?.value
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1.5">{label}</div>
      <div className={`font-money font-semibold ${net >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>
        {net >= 0 ? '+' : ''}{net >= 1000 || net <= -1000 ? `$${(net / 1000).toFixed(1)}k` : `$${net}`}
      </div>
      {prev !== undefined && (
        <div className="text-xs text-gray-400 mt-0.5 font-money">
          prev: {prev >= 0 ? '+' : ''}{Math.abs(prev) >= 1000 ? `$${(prev / 1000).toFixed(1)}k` : `$${prev}`}
        </div>
      )}
    </div>
  )
}

export function NetCashFlowBar({ data, compareData }: NetCashFlowBarProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">No data</div>
  )

  const hasCompare = compareData && compareData.length > 0

  const chartData = data.map((d, i) => {
    const net = d.income - Math.abs(d.spending)
    const prev = compareData?.[i]
    return {
      month: toLabel(d.month),
      net,
      ...(prev !== undefined ? { compareNet: prev.income - Math.abs(prev.spending) } : {}),
    }
  })

  const absMax = Math.max(...chartData.flatMap(d => [Math.abs(d.net), Math.abs(d.compareNet ?? 0)]))
  const yDomain: [number, number] = [-absMax * 1.15, absMax * 1.15]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="35%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(0,0,0,0.06)"
          className="dark:stroke-white/[0.06]"
          vertical={false}
        />
        <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" className="dark:stroke-white/20" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="net" radius={[3, 3, 3, 3]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.net >= 0 ? POS : NEG} fillOpacity={0.85} />
          ))}
        </Bar>
        {hasCompare && (
          <Line
            type="monotone"
            dataKey="compareNet"
            stroke={COMPARE_COLOR}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, fill: COMPARE_COLOR, strokeWidth: 0 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
