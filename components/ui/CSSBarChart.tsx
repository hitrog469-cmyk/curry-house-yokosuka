'use client'

interface BarData {
  label: string
  value: number
  color?: string
}

interface CSSBarChartProps {
  data: BarData[]
  height?: number
  orientation?: 'vertical' | 'horizontal'
  title?: string
  formatValue?: (value: number) => string
  barColor?: string
}

export default function CSSBarChart({
  data,
  height = 200,
  orientation = 'vertical',
  title,
  formatValue = (v) => String(v),
  barColor = 'bg-green-500',
}: CSSBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 py-12">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  if (orientation === 'horizontal') {
    return (
      <div>
        {title && <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>}
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 text-right shrink-0 truncate">
                {item.label}
              </span>
              <div className="flex-1 bg-gray-700/50 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color || barColor} transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${(item.value / maxValue) * 100}%`, minWidth: item.value > 0 ? '24px' : '0' }}
                >
                  <span className="text-xs font-bold text-white drop-shadow">
                    {formatValue(item.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vertical bar chart
  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>}
      <div className="flex items-end gap-2 justify-between" style={{ height }}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * 100
          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
              <span className="text-xs font-bold text-gray-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatValue(item.value)}
              </span>
              <div
                className={`w-full max-w-[48px] rounded-t-lg ${item.color || barColor} transition-all duration-700 ease-out hover:brightness-110 cursor-default`}
                style={{ height: `${barHeight}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
              <span className="text-[10px] text-gray-500 mt-1.5 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
