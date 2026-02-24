import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'
import { useState } from 'react'
import { SpendingCategory } from '../../types'
import { getCategoryDotColor } from '../ui/Badge'

interface CategoryDonutProps {
  data: SpendingCategory[]
  total: number
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-600 dark:text-gray-400 mb-1">{item.name}</div>
      <div className="font-money text-gray-900 dark:text-gray-100 font-semibold">{formatMoney(item.value)}</div>
    </div>
  )
}

export function CategoryDonut({ data, total }: CategoryDonutProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">
      No spending data
    </div>
  )

  const sorted = [...data].sort((a, b) => b.amount - a.amount).slice(0, 8)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              activeIndex={activeIdx ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              paddingAngle={2}
              strokeWidth={0}
            >
              {sorted.map((entry) => (
                <Cell key={entry.category} fill={getCategoryDotColor(entry.category)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-lg font-bold font-money text-gray-900 dark:text-gray-100">{formatMoney(total)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map((item, i) => (
          <div
            key={item.category}
            className={`flex items-center justify-between text-sm transition-opacity ${activeIdx === null || activeIdx === i ? 'opacity-100' : 'opacity-40'}`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryDotColor(item.category) }} />
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px] text-xs">{item.category}</span>
            </div>
            <div className="flex items-center gap-3 ml-2 flex-shrink-0">
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                {total > 0 ? Math.round((item.amount / total) * 100) : 0}%
              </span>
              <span className="font-money text-gray-900 dark:text-gray-100 text-xs">{formatMoney(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
