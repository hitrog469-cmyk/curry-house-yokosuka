'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  trend?: { direction: 'up' | 'down' | 'flat'; percentage?: number }
  sparkData?: number[]
  icon?: LucideIcon
  color: string // tailwind border color class e.g. 'border-green-500'
  iconBg?: string // tailwind bg class e.g. 'bg-green-500/20'
  iconColor?: string // tailwind text color e.g. 'text-green-400'
  href?: string
  onClick?: () => void
}

function Sparkline({ data, color = '#4ade80' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const w = 80
  const h = 28
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const fillPoints = `0,${h} ${points} ${w},${h}`

  return (
    <svg width={w} height={h} className="shrink-0">
      <polygon points={fillPoints} fill={color} fillOpacity="0.15" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function KPICard({
  title,
  value,
  trend,
  sparkData,
  icon: Icon,
  color,
  iconBg = 'bg-gray-700',
  iconColor = 'text-gray-300',
  href,
  onClick,
}: KPICardProps) {
  const content = (
    <div
      className={`bg-gray-800 rounded-xl p-4 border-l-4 ${color} transition-all hover:bg-gray-750 ${
        (href || onClick) ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-white">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-400' :
              trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend.direction === 'flat' && <Minus className="w-3 h-3" />}
              {trend.percentage !== undefined && <span>{trend.percentage > 0 ? '+' : ''}{trend.percentage}%</span>}
            </div>
          )}
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline
            data={sparkData}
            color={
              color.includes('green') ? '#4ade80' :
              color.includes('blue') ? '#60a5fa' :
              color.includes('red') ? '#f87171' :
              color.includes('yellow') ? '#fbbf24' :
              color.includes('purple') ? '#c084fc' :
              color.includes('emerald') ? '#34d399' :
              '#4ade80'
            }
          />
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
