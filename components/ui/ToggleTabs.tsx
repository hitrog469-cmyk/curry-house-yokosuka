'use client'

import type { LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon?: LucideIcon
  badge?: number
}

interface ToggleTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pill' | 'underline'
  size?: 'sm' | 'md'
}

export default function ToggleTabs({ tabs, activeTab, onChange, variant = 'pill', size = 'md' }: ToggleTabsProps) {
  if (variant === 'underline') {
    return (
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-all relative ${
                size === 'sm' ? 'text-sm' : 'text-base'
              } ${
                isActive
                  ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="inline-flex bg-gray-800 rounded-xl p-1 gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              size === 'sm' ? 'text-sm' : 'text-base'
            } ${
              isActive
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full min-w-[20px] text-center ${
                isActive ? 'bg-white text-green-700' : 'bg-red-500 text-white'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
