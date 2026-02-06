'use client'

import Link from 'next/link'

export default function TopBanner() {
  return (
    <Link href="/menu" className="block">
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white cursor-pointer hover:from-red-700 hover:via-red-600 hover:to-red-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-2.5">
            {/* Scrolling content */}
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🔥 FREE DELIVERY on all orders! — TAP TO ORDER
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🌟 Check out Today&apos;s Special — Limited Time!
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🎉 Use code WELCOME15 for 15% OFF
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  📍 Yokosuka&apos;s Finest Indian, Mexican, Nepalese & Japanese-Fusion
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🔥 FREE DELIVERY on all orders! — TAP TO ORDER
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🌟 Check out Today&apos;s Special — Limited Time!
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  🎉 Use code WELCOME15 for 15% OFF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
