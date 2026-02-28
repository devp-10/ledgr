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

/** Generate symmetric nice ticks that always include 0 */
function makeTicks(absMax: number): number[] {
  if (absMax === 0) return [-1, 0, 1]
  const raw = absMax / 2
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = ([1, 2, 2.5, 5, 10].find(m => m * mag >= raw) ?? 10) * mag
  const ticks: number[] = []
  for (let v = -step * 3; v <= step * 3; v += step) {
    if (v >= -absMax * 1.3 && v <= absMax * 1.3) ticks.push(Math.round(v))
  }
  if (!ticks.includes(0)) ticks.push(0)
  return ticks.sort((a, b) => a - b)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const net = payload.find((p: any) => p.dataKey === 'net')?.value ?? 0
  const prev = payload.find((p: any) => p.dataKey === 'compareNet')?.value
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1.5">{label}</div>
      <div className={`font-money font-semibold ${net >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>
        {net >= 0 ? '+' : ''}{fmt(net)}
      </div>
      {prev !== undefined && (
        <div className="text-xs text-gray-400 mt-0.5 font-money">
          prev: {prev >= 0 ? '+' : ''}{fmt(prev)}
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

  const absMax = Math.max(
    1,
    ...chartData.flatMap(d => [Math.abs(d.net), Math.abs((d as any).compareNet ?? 0)])
  )
  const ticks = makeTicks(absMax)
  const yDomain: [number, number] = [ticks[0], ticks[ticks.length - 1]]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="35%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(0,0,0,0.06)"
          className="dark:stroke-white/[0.06]"
          vertical={false}
        />
        {/* Zero reference line — solid and clearly visible */}
        <ReferenceLine
          y={0}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth={1.5}
          className="dark:stroke-white/30"
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={yDomain}
          ticks={ticks}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
          width={58}
          tickFormatter={v => {
            if (v === 0) return '$0'
            return `${v < 0 ? '-' : ''}$${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(0) + 'k' : Math.abs(v)}`
          }}
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
