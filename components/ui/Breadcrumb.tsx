'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link href="/" className="text-gray-400 hover:text-white transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          {item.href ? (
            <Link href={item.href} className="text-gray-400 hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-200 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
