'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Truck, ChefHat, LayoutGrid, LogOut, Home } from 'lucide-react'

const tabs = [
  { id: 'delivery', label: 'Delivery', icon: Truck, href: '/staff' },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat, href: '/staff/dashboard' },
  { id: 'tables', label: 'Tables', icon: LayoutGrid, href: '/staff/tables' },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [staffName, setStaffName] = useState('')

  useEffect(() => {
    // Try admin_session first, then user localStorage
    const adminSession = localStorage.getItem('admin_session')
    const userSession = localStorage.getItem('user')
    if (adminSession) {
      try {
        const data = JSON.parse(adminSession)
        setStaffName(data.full_name || data.username || 'Staff')
      } catch { setStaffName('Staff') }
    } else if (userSession) {
      try {
        const data = JSON.parse(userSession)
        setStaffName(data.name || data.full_name || 'Staff')
      } catch { setStaffName('Staff') }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('admin_session')
    router.push('/admin/login')
  }

  const getActiveTab = () => {
    if (pathname === '/staff') return 'delivery'
    if (pathname === '/staff/dashboard') return 'kitchen'
    if (pathname === '/staff/tables') return 'tables'
    return 'delivery'
  }

  const activeTab = getActiveTab()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Shared Staff Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Tab Navigation */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </div>

          {/* Right: Staff info + actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden md:inline">
              {staffName}
            </span>
            <Link
              href="/"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  )
}
