'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const DEFAULT_MESSAGES = [
  '🔥 FREE DELIVERY on all orders! — TAP TO ORDER',
  "🌟 Check out Today's Special — Limited Time!",
  '🎉 Use code WELCOME15 for 15% OFF',
  "📍 Yokosuka's Finest Indian, Mexican, Nepalese & Japanese-Fusion",
]

export default function TopBanner() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'banner_messages')
      .single()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setMessages(data.value as string[])
        }
      })
  }, [])

  // Duplicate messages for seamless marquee loop
  const displayMessages = [...messages, ...messages]

  return (
    <Link href="/menu" className="block">
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white cursor-pointer hover:from-red-700 hover:via-red-600 hover:to-red-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-2.5">
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
                {displayMessages.map((msg, i) => (
                  <span key={i} className="inline-flex items-center gap-2 font-semibold text-sm">
                    {msg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
